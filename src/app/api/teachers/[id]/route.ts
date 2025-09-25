// src/app/api/teachers/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

type Params = {
  id: string;
};

// PUT (update) a teacher by ID (admin only)
export async function PUT(request: Request, { params }: { params: Promise<Params> }) {
  const { id } = await params;
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

    const updateData: any = {
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      specializations,
      notes: notes || undefined,
    };

    // Handle name fields
    if (firstName && lastName) {
      updateData.firstName = firstName;
      updateData.lastName = lastName;
    } else if (name) {
      updateData.firstName = name.split(' ')[0];
      updateData.lastName = name.split(' ').slice(1).join(' ') || '';
      updateData.name = name; // Keep backward compatibility
    }

    const result = await db.collection('teachers').updateOne({ id }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    // Return the updated teacher
    const updatedTeacher = await db.collection('teachers').findOne({ id });
    return NextResponse.json(updatedTeacher);
  } catch (error) {
    console.error(`Error updating teacher ${id}:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE a teacher by ID (admin only)
export async function DELETE(request: Request, { params }: { params: Promise<Params> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection('teachers').deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Teacher deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting teacher ${id}:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
