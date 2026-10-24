import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SPECIALTIES, TIME_SLOTS } from '@/types';
import { getTodayISO } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = getTodayISO();

    // 1. Fetch all active doctors (fallback to all doctors if all were toggled inactive)
    let activeDoctors = await prisma.doctor.findMany({
      where: { active: true },
      include: {
        appointments: {
          where: {
            date: today,
            status: { not: 'CANCELLED' },
          },
          select: { time: true },
        },
      },
      orderBy: { yearsExperience: 'desc' },
    });

    if (activeDoctors.length === 0) {
      activeDoctors = await prisma.doctor.findMany({
        include: {
          appointments: {
            where: {
              date: today,
              status: { not: 'CANCELLED' },
            },
            select: { time: true },
          },
        },
        orderBy: { yearsExperience: 'desc' },
      });
    }

    // 2. Calculate count of active doctors per specialty
    const specialtyCounts: Record<string, number> = {};
    for (const spec of SPECIALTIES) {
      specialtyCounts[spec] = 0;
    }
    for (const doc of activeDoctors) {
      if (specialtyCounts[doc.specialty] !== undefined) {
        specialtyCounts[doc.specialty]++;
      }
    }

    const specialtyTiles = SPECIALTIES.map((spec) => ({
      specialty: spec,
      count: specialtyCounts[spec],
    }));

    // 3. Featured Hero Doctor (first doctor, e.g. Dr. Ananya Sharma)
    const heroDoctor = activeDoctors[0] || null;
    let heroSlots: Array<{ time: string; isBooked: boolean }> = [];
    if (heroDoctor) {
      const bookedSet = new Set(heroDoctor.appointments.map((a) => a.time));
      heroSlots = TIME_SLOTS.map((t) => ({
        time: t,
        isBooked: bookedSet.has(t),
      }));
    }

    // 4. Three doctors you can book today
    const topThreeDoctors = activeDoctors.slice(0, 3).map((doc) => {
      const bookedSet = new Set(doc.appointments.map((a) => a.time));
      const freeSlots = TIME_SLOTS.filter((t) => !bookedSet.has(t));
      return {
        id: doc.id,
        name: doc.name,
        specialty: doc.specialty,
        hospital: doc.hospital,
        fee: doc.fee,
        yearsExperience: doc.yearsExperience,
        todayFreeSlotsCount: freeSlots.length,
        nextSlot: freeSlots[0] || 'Fully booked today',
      };
    });

    return NextResponse.json({
      today,
      specialtyTiles,
      heroDoctor: heroDoctor
        ? {
            id: heroDoctor.id,
            name: heroDoctor.name,
            specialty: heroDoctor.specialty,
            hospital: heroDoctor.hospital,
            fee: heroDoctor.fee,
            yearsExperience: heroDoctor.yearsExperience,
            slots: heroSlots,
          }
        : null,
      featuredDoctors: topThreeDoctors,
    });
  } catch (error: any) {
    console.error('Error fetching home data:', error);
    return NextResponse.json({ error: 'Failed to fetch public home data.' }, { status: 500 });
  }
}
