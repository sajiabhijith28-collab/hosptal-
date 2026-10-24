import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { TIME_SLOTS, TimeSlot } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const user = session.user as any;
    const role = user.role;
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const dateFilter = searchParams.get('date');

    const whereClause: any = {};

    if (role === 'PATIENT') {
      whereClause.patientId = user.id;
    } else if (role === 'DOCTOR') {
      let doctorId = user.doctorId;
      if (!doctorId && user.id) {
        const doc = await prisma.doctor.findUnique({
          where: { userId: user.id },
        });
        doctorId = doc?.id;
      }
      if (!doctorId) {
        return NextResponse.json({ error: 'Doctor profile not associated with this account.' }, { status: 403 });
      }
      whereClause.doctorId = doctorId;
    } else if (role === 'ADMIN') {
      // Admin can see everything
    } else {
      return NextResponse.json({ error: 'Invalid user role.' }, { status: 403 });
    }

    if (statusFilter && statusFilter !== 'ALL') {
      whereClause.status = statusFilter;
    }

    if (dateFilter) {
      whereClause.date = dateFilter;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            hospital: true,
            fee: true,
            yearsExperience: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
      ],
    });

    return NextResponse.json(appointments);
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Please sign in to book an appointment.' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'PATIENT' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only patients can book appointments.' }, { status: 403 });
    }

    const body = await request.json();
    const { doctorId, date, time, reason, patientId: targetPatientId, paymentMethod: inputPaymentMethod } = body;

    const patientId = user.role === 'ADMIN' && targetPatientId ? targetPatientId : user.id;

    if (!doctorId || !date || !time) {
      return NextResponse.json(
        { error: 'Please select a doctor, date, and time slot.' },
        { status: 400 }
      );
    }

    // Validate time slot
    if (!TIME_SLOTS.includes(time as TimeSlot)) {
      return NextResponse.json(
        { error: `Invalid time slot. Allowed slots are 09:00 to 11:30 and 14:00 to 16:30.` },
        { status: 400 }
      );
    }

    // Validate doctor is active
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor || !doctor.active) {
      return NextResponse.json(
        { error: 'This doctor is currently not accepting bookings.' },
        { status: 400 }
      );
    }

    // Check existing active bookings in the same slot for this doctor
    const existingConflict = await prisma.appointment.findFirst({
      where: {
        doctorId,
        date,
        time,
        status: {
          not: 'CANCELLED',
        },
      },
    });

    if (existingConflict) {
      return NextResponse.json(
        { error: 'This time slot was just booked by another patient. Please pick a different slot.' },
        { status: 409 }
      );
    }

    // Payment computation
    const paymentMethod = inputPaymentMethod || 'UPI';
    const isPayAtClinic = paymentMethod === 'PAY_AT_CLINIC';
    const paymentStatus = isPayAtClinic ? 'PAY_AT_CLINIC' : 'PAID';
    const transactionId = isPayAtClinic
      ? null
      : `TXN_${paymentMethod}_${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create appointment with initial status PENDING
    // SQLite partial unique index idx_doctor_active_slot also guarantees race-condition safety
    try {
      const appointment = await prisma.appointment.create({
        data: {
          doctorId,
          patientId,
          date,
          time,
          reason: reason?.trim() || null,
          status: 'PENDING',
          paymentStatus,
          paymentMethod,
          paymentAmount: doctor.fee,
          transactionId,
        },
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

      return NextResponse.json(
        {
          message: 'Booked. Waiting for the doctor to confirm.',
          appointment,
        },
        { status: 201 }
      );
    } catch (dbError: any) {
      // Catch unique index violation if two patients book simultaneously
      if (dbError.code === 'P2002' || String(dbError.message).includes('idx_doctor_active_slot')) {
        return NextResponse.json(
          { error: 'This time slot is no longer available. Please select another slot.' },
          { status: 409 }
        );
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create appointment.' },
      { status: 500 }
    );
  }
}
