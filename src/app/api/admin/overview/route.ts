import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { SPECIALTIES } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required.' }, { status: 403 });
    }

    const [
      activeBookings,
      pendingConfirmation,
      doctorsLive,
      confirmedAndCompletedAppointments,
      latestBookings,
      allAppointmentsWithDoctor,
    ] = await Promise.all([
      prisma.appointment.count({
        where: { status: { in: ['PENDING', 'CONFIRMED'] } },
      }),
      prisma.appointment.count({
        where: { status: 'PENDING' },
      }),
      prisma.doctor.count({
        where: { active: true },
      }),
      prisma.appointment.findMany({
        where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
        include: { doctor: { select: { fee: true } } },
      }),
      prisma.appointment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: {
            select: {
              name: true,
              specialty: true,
              hospital: true,
              fee: true,
            },
          },
          patient: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.appointment.findMany({
        where: { status: { not: 'CANCELLED' } },
        include: { doctor: { select: { specialty: true } } },
      }),
    ]);

    // Calculate booked consultation value in ₹
    const bookedValueINR = confirmedAndCompletedAppointments.reduce(
      (sum, item) => sum + (item.doctor?.fee || 0),
      0
    );

    const onlineCollectedINR = confirmedAndCompletedAppointments
      .filter((a: any) => a.paymentStatus === 'PAID')
      .reduce((sum, item) => sum + (item.doctor?.fee || 0), 0);

    const dueAtClinicINR = confirmedAndCompletedAppointments
      .filter((a: any) => a.paymentStatus === 'PAY_AT_CLINIC')
      .reduce((sum, item) => sum + (item.doctor?.fee || 0), 0);

    // Calculate bookings by specialty
    const specialtyCounts: Record<string, number> = {};
    for (const s of SPECIALTIES) {
      specialtyCounts[s] = 0;
    }

    for (const appt of allAppointmentsWithDoctor) {
      const spec = appt.doctor?.specialty;
      if (spec && specialtyCounts[spec] !== undefined) {
        specialtyCounts[spec]++;
      }
    }

    const totalCount = allAppointmentsWithDoctor.length || 1;
    const bookingsBySpecialty = SPECIALTIES.map((spec) => ({
      specialty: spec,
      count: specialtyCounts[spec],
      percentage: Math.round((specialtyCounts[spec] / totalCount) * 100),
    }));

    return NextResponse.json({
      stats: {
        activeBookings,
        pendingConfirmation,
        doctorsLive,
        bookedValueINR,
        onlineCollectedINR,
        dueAtClinicINR,
      },
      latest5Bookings: latestBookings,
      bookingsBySpecialty,
    });
  } catch (error: any) {
    console.error('Error fetching admin overview:', error);
    return NextResponse.json({ error: 'Failed to fetch admin metrics.' }, { status: 500 });
  }
}
