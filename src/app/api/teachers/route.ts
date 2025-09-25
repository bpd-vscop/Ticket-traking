// src/app/api/teachers/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { Teacher } from '@/lib/types';

// GET all teachers
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const teachers = await db.collection('teachers').find({}).toArray();
    return NextResponse.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST a new teacher (admin only)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { firstName, lastName, name, email, phone, address, specializations, notes } = await request.json();

    // Support both new format (firstName, lastName) and old format (name)
    if (!firstName && !lastName && !name) {
      return NextResponse.json({ message: 'Missing required field: firstName and lastName or name' }, { status: 400 });
    }

    if (!specializations || specializations.length === 0) {
      return NextResponse.json({ message: 'At least one specialization is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const newTeacher: Teacher = {
      id: `teacher-${Date.now()}`,
      firstName: firstName || (name ? name.split(' ')[0] : ''),
      lastName: lastName || (name ? name.split(' ').slice(1).join(' ') : ''),
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      specializations,
      notes: notes || undefined,
    };

    // Keep backward compatibility
    if (name && !firstName && !lastName) {
      newTeacher.name = name;
    }

    await db.collection('teachers').insertOne(newTeacher);
    return NextResponse.json(newTeacher, { status: 201 });
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
