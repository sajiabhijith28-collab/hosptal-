import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TIME_SLOTS } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: doctorId } = await context.params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date query parameter (YYYY-MM-DD) is required.' },
        { status: 400 }
      );
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found.' }, { status: 404 });
    }

    // Find all active appointments for this doctor on this date
    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        date,
        status: {
          not: 'CANCELLED',
        },
      },
      select: {
        time: true,
        status: true,
      },
    });

    const bookedMap = new Map<string, string>();
    for (const appt of bookedAppointments) {
      bookedMap.set(appt.time, appt.status);
    }

    const slots = TIME_SLOTS.map((slot) => {
      const isBooked = bookedMap.has(slot);
      return {
        time: slot,
        isBooked,
        status: bookedMap.get(slot) || null,
      };
    });

    return NextResponse.json({
      doctorId,
      doctorName: doctor.name,
      date,
      slots,
    });
  } catch (error: any) {
    console.error('Error fetching doctor slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctor slots.' },
      { status: 500 }
    );
  }
}
