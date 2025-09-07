// src/app/api/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { hash } from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

type Params = {
  id: string;
};

// GET a single user by ID
export async function GET(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Admins can get any user, users can only get themselves
  if (session.user.role !== 'admin' && session.user.id !== params.id) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('users').findOne({ id: params.id }, { projection: { password: 0 } });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error(`Error fetching user ${params.id}:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT (update) a user by ID
export async function PUT(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Admins can update any user, users can only update themselves
  if (session.user.role !== 'admin' && session.user.id !== params.id) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { firstName, lastName, username, email, role, password, address, number, profilePicture } = await request.json();
    const updateData: any = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (address) updateData.address = address;
    if (number) updateData.number = number;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    
    // Only admins can change a user's role
    if (role && session.user.role === 'admin') {
      updateData.role = role;
    }

    if (password) {
      updateData.password = await hash(password, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No update data provided' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Check for duplicate email or username (excluding current user)
    if (email || username) {
      const duplicateQuery: any = { 
        id: { $ne: params.id },
        $or: []
      };
      
      if (email) duplicateQuery.$or.push({ email });
      if (username) duplicateQuery.$or.push({ username });
      
      const existingUser = await db.collection('users').findOne(duplicateQuery);
      if (existingUser) {
        return NextResponse.json({ message: 'Email or username already exists' }, { status: 409 });
      }
    }

    const result = await db.collection('users').updateOne({ id: params.id }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error(`Error updating user ${params.id}:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE a user by ID (admin only)
export async function DELETE(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  // Prevent admin from deleting themselves
  if (session.user.id === params.id) {
    return NextResponse.json({ message: 'Cannot delete your own admin account' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection('users').deleteOne({ id: params.id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting user ${params.id}:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
