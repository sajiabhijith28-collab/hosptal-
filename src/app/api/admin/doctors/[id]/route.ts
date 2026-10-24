import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { getTodayISO } from '@/lib/utils';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required.' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { active } = body;

    if (typeof active !== 'boolean') {
      return NextResponse.json({ error: 'Active field must be boolean.' }, { status: 400 });
    }

    const doctor = await prisma.doctor.update({
      where: { id },
      data: { active },
    });

    return NextResponse.json({
      message: `Doctor ${doctor.name} is now ${active ? 'live and active' : 'deactivated'}.`,
      doctor,
    });
  } catch (error: any) {
    console.error('Error toggling doctor status:', error);
    return NextResponse.json({ error: 'Failed to update doctor status.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required.' }, { status: 403 });
    }

    const { id } = await context.params;
    const today = getTodayISO();

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        appointments: {
          where: {
            date: { gte: today },
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found.' }, { status: 404 });
    }

    // Rule: Block removal while the doctor has upcoming bookings
    if (doctor.appointments.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot remove ${doctor.name}: There are ${doctor.appointments.length} upcoming active booking(s) scheduled. Please cancel or reassign them first.`,
          upcomingBookingsCount: doctor.appointments.length,
        },
        { status: 400 }
      );
    }

    // Safe to delete doctor and their user account
    await prisma.$transaction(async (tx) => {
      // Delete any past/cancelled appointments first if any cascade needed
      await tx.appointment.deleteMany({ where: { doctorId: id } });
      await tx.doctor.delete({ where: { id } });
      if (doctor.userId) {
        await tx.user.delete({ where: { id: doctor.userId } }).catch(() => {});
      }
    });

    return NextResponse.json({
      message: `Doctor ${doctor.name} was successfully removed from Ente Hospital.`,
    });
  } catch (error: any) {
    console.error('Error deleting doctor:', error);
    return NextResponse.json({ error: 'Failed to delete doctor.' }, { status: 500 });
  }
}
