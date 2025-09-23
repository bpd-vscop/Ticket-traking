import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

type FamilyInput = {
  id: string;
  sheetIds: string[];
  level: 'P' | 'C' | 'L' | 'S' | 'E';
  parents: {
    father?: string;
    mother?: string;
  };
  students: string[];
  subjects: Array<{
    name: string;
    hours: number;
    studentName: string;
  }>;
  packDetails: {
    hourlyRate: number;
    reduction?: number;
    reductionReason?: string;
    total: number;
  };
  payments: Array<{
    method: 'cash' | 'cheque' | 'card';
    amount: number;
  }>;
  teacherIds: string[];
  contact: {
    address?: string;
    phone?: string;
    email?: string;
  };
  // Backward compatibility
  student?: string;
};

const COLLECTION = 'families';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection(COLLECTION);

    const docs = await col
      .find({}, { projection: { _id: 0 } })
      .sort({ student: 1 })
      .toArray();

    return NextResponse.json({ families: docs });
  } catch (err) {
    console.error('GET /api/families error', err);
    return NextResponse.json({ error: 'Failed to load families' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const families: FamilyInput[] = Array.isArray(body?.families)
      ? body.families
      : body?.family
      ? [body.family]
      : [];

    if (!families.length) {
      return NextResponse.json({ error: 'No families provided' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const col = db.collection(COLLECTION);

    const ops = families.map((f) => {
      const setData: Record<string, any> = {
        id: f.id,
        updatedAt: new Date(),
        createdAt: new Date()
      };

      if (f.sheetIds !== undefined) setData.sheetIds = f.sheetIds;
      if (f.level !== undefined) setData.level = f.level;
      if (f.parents !== undefined) setData.parents = f.parents;
      if (f.students !== undefined) setData.students = f.students;
      if (f.subjects !== undefined) setData.subjects = f.subjects;
      if (f.packDetails !== undefined) setData.packDetails = f.packDetails;
      if (f.payments !== undefined) setData.payments = f.payments;
      if (f.teacherIds !== undefined) setData.teacherIds = f.teacherIds;
      if (f.contact !== undefined) setData.contact = f.contact;

      // Handle backward compatibility
      if (f.student !== undefined) setData.student = f.student;

      return {
        updateOne: {
          filter: { id: f.id },
          update: {
            $set: setData,
            $setOnInsert: { createdAt: new Date() }
          },
          upsert: true,
        },
      };
    });

    if (ops.length) {
      await col.bulkWrite(ops, { ordered: false });
    }

    return NextResponse.json({ ok: true, count: families.length });
  } catch (err) {
    console.error('POST /api/families error', err);
    return NextResponse.json({ error: 'Failed to save families' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Family ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const col = db.collection(COLLECTION);

    const result = await col.deleteOne({ id: id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deleted: true });
  } catch (err) {
    console.error('DELETE /api/families error', err);
    return NextResponse.json({ error: 'Failed to delete family' }, { status: 500 });
  }
}