import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

type SheetInput = {
  id: string;
  level: 'P' | 'C' | 'L' | 'S' | 'E';
  packSize: 24 | 36 | 38;
  startNumber: number;
  endNumber: number;
  isAssigned: boolean;
  downloads?: number;
  generationDate: string | Date;
  familyId?: string;
};

const COLLECTION = 'sheets';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection(COLLECTION);

    const docs = await col
      .find({}, { projection: { _id: 0 } })
      .sort({ generationDate: -1 })
      .toArray();

    return NextResponse.json({ sheets: docs });
  } catch (err) {
    console.error('GET /api/sheets error', err);
    return NextResponse.json({ error: 'Failed to load sheets' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sheets: SheetInput[] = Array.isArray(body?.sheets)
      ? body.sheets
      : body?.sheet
      ? [body.sheet]
      : [];

    if (!sheets.length) {
      return NextResponse.json({ error: 'No sheets provided' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const col = db.collection(COLLECTION);

    const ops = sheets.map((s) => {
      const setData: Record<string, any> = { id: s.id, updatedAt: new Date() };
      if (s.level !== undefined) setData.level = s.level;
      if (s.packSize !== undefined) setData.packSize = s.packSize;
      if (s.startNumber !== undefined) setData.startNumber = s.startNumber;
      if (s.endNumber !== undefined) setData.endNumber = s.endNumber;
      if (s.isAssigned !== undefined) setData.isAssigned = s.isAssigned;
      if (s.downloads !== undefined) setData.downloads = s.downloads;
      if (s.generationDate !== undefined) setData.generationDate = new Date(s.generationDate);
      if (s.familyId !== undefined) setData.familyId = s.familyId;

      return {
        updateOne: {
          filter: { id: s.id },
          update: { $set: setData },
          upsert: true,
        },
      };
    });

    if (ops.length) {
      await col.bulkWrite(ops, { ordered: false });
    }

    return NextResponse.json({ ok: true, count: sheets.length });
  } catch (err) {
    console.error('POST /api/sheets error', err);
    return NextResponse.json({ error: 'Failed to save sheets' }, { status: 500 });
  }
}
