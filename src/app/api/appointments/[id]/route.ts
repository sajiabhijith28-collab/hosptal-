import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: true,
        patient: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
    }

    const user = session.user as any;
    const role = user.role;

    // Role-based authorization rules
    if (role === 'PATIENT') {
      if (appointment.patientId !== user.id) {
        return NextResponse.json({ error: 'Forbidden. You do not own this appointment.' }, { status: 403 });
      }
      // Patients can only cancel their visits
      if (status !== 'CANCELLED') {
        return NextResponse.json(
          { error: 'Patients can only cancel appointments.' },
          { status: 403 }
        );
      }
      if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
        return NextResponse.json(
          { error: `Cannot cancel an appointment that is already ${appointment.status.toLowerCase()}.` },
          { status: 400 }
        );
      }
    } else if (role === 'DOCTOR') {
      if (appointment.doctorId !== user.doctorId) {
        return NextResponse.json(
          { error: 'Forbidden. This appointment is not scheduled with you.' },
          { status: 403 }
        );
      }
      // Doctors can confirm or decline pending visits, or mark confirmed visits completed
      if (appointment.status === 'PENDING') {
        if (status !== 'CONFIRMED' && status !== 'CANCELLED') {
          return NextResponse.json(
            { error: 'Pending appointments can only be confirmed or declined.' },
            { status: 400 }
          );
        }
      } else if (appointment.status === 'CONFIRMED') {
        if (status !== 'COMPLETED' && status !== 'CANCELLED') {
          return NextResponse.json(
            { error: 'Confirmed appointments can only be marked completed or cancelled.' },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: `Cannot modify an appointment that is already ${appointment.status.toLowerCase()}.` },
          { status: 400 }
        );
      }
    } else if (role === 'ADMIN') {
      // Admins have full override authority
    } else {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        doctor: true,
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    let message = `Appointment marked as ${status.toLowerCase()}.`;
    if (status === 'CANCELLED') {
      message = 'Appointment cancelled. The time slot is now available again.';
    } else if (status === 'CONFIRMED') {
      message = 'Appointment confirmed successfully.';
    } else if (status === 'COMPLETED') {
      message = 'Appointment marked as completed.';
    }

    return NextResponse.json({
      message,
      appointment: updated,
    });
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Failed to update appointment.' }, { status: 500 });
  }
}
