import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { getTodayISO } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const user = session.user as any;
    let doctorId = user.doctorId;
    if (!doctorId && user.id) {
      const doc = await prisma.doctor.findUnique({
        where: { userId: user.id },
      });
      doctorId = doc?.id;
    }

    if (user.role !== 'DOCTOR' || !doctorId) {
      return NextResponse.json({ error: 'Doctor account required.' }, { status: 403 });
    }

    const today = getTodayISO();

    const [
      doctorProfile,
      visitsTodayCount,
      awaitingReplyCount,
      confirmedUpcomingCount,
      todaySchedule,
    ] = await Promise.all([
      prisma.doctor.findUnique({
        where: { id: doctorId },
      }),
      prisma.appointment.count({
        where: {
          doctorId,
          date: today,
          status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
        },
      }),
      prisma.appointment.count({
        where: {
          doctorId,
          status: 'PENDING',
        },
      }),
      prisma.appointment.count({
        where: {
          doctorId,
          date: { gte: today },
          status: 'CONFIRMED',
        },
      }),
      prisma.appointment.findMany({
        where: {
          doctorId,
          date: today,
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          time: 'asc',
        },
      }),
    ]);

    return NextResponse.json({
      doctor: doctorProfile,
      stats: {
        visitsToday: visitsTodayCount,
        awaitingReply: awaitingReplyCount,
        confirmedUpcoming: confirmedUpcomingCount,
      },
      todaySchedule,
      todayDate: today,
    });
  } catch (error: any) {
    console.error('Error fetching doctor overview:', error);
    return NextResponse.json({ error: 'Failed to fetch doctor schedule.' }, { status: 500 });
  }
}
