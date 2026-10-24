import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');
    const search = searchParams.get('search');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const session = await auth();
    const isAdmin = (session?.user as any)?.role === 'ADMIN';

    const whereClause: any = {};

    // Only admins can view inactive doctors
    if (!isAdmin || !includeInactive) {
      whereClause.active = true;
    }

    if (specialty && specialty !== 'All') {
      whereClause.specialty = specialty;
    }

    if (search && search.trim()) {
      const term = search.trim();
      whereClause.OR = [
        { name: { contains: term } },
        { specialty: { contains: term } },
        { hospital: { contains: term } },
      ];
    }

    const doctors = await prisma.doctor.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
      orderBy: [
        { active: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(doctors);
  } catch (error: any) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json({ error: 'Failed to fetch doctors.' }, { status: 500 });
  }
}
