import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Please provide name, email, and password.' },
        { status: 400 }
      );
    }

    const trimmedEmail = String(email).toLowerCase().trim();
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const role = body.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';
    const specialty = body.specialty || 'General Physician';
    const hospital = body.hospital || 'Ente Hospital';
    const fee = Number(body.fee) || 800;
    const yearsExperience = Number(body.yearsExperience) || 5;

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        passwordHash,
        role,
        ...(role === 'DOCTOR'
          ? {
              doctorProfile: {
                create: {
                  name: name.trim().startsWith('Dr.') ? name.trim() : `Dr. ${name.trim()}`,
                  specialty,
                  hospital,
                  fee,
                  yearsExperience,
                  active: true,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json(
      { message: role === 'DOCTOR' ? 'Doctor account created successfully.' : 'Patient account created successfully.', user },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
