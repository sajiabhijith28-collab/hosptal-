import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';
import { SPECIALTIES } from '@/types';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, specialty, hospital, fee, yearsExperience, email, password } = body;

    if (!name || !specialty || !hospital || !fee || !email || !password) {
      return NextResponse.json(
        { error: 'All fields (name, specialty, hospital, fee, email, password) are required.' },
        { status: 400 }
      );
    }

    if (!SPECIALTIES.includes(specialty)) {
      return NextResponse.json(
        { error: `Invalid specialty. Supported specialties are: ${SPECIALTIES.join(', ')}` },
        { status: 400 }
      );
    }

    const trimmedEmail = String(email).toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A user account with this email already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and doctor in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: trimmedEmail,
          passwordHash,
          role: 'DOCTOR',
        },
      });

      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          name: name.trim(),
          specialty,
          hospital: hospital.trim(),
          fee: Number(fee),
          yearsExperience: Number(yearsExperience) || 5,
          active: true,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      return doctor;
    });

    return NextResponse.json(
      {
        message: `Doctor ${result.name} and account ${trimmedEmail} created successfully.`,
        doctor: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating doctor:', error);
    return NextResponse.json({ error: 'Failed to create doctor.' }, { status: 500 });
  }
}
