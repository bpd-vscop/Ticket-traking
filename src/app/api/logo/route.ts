import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

// Collection name dedicated for storing logos ("its own folder")
const COLLECTION = 'logos';
const DOC_KEY = 'ticketLogo';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection(COLLECTION);
    const doc = await col.findOne<{ key: string; dataUri: string }>(
      { key: DOC_KEY },
      { projection: { _id: 0, dataUri: 1 } }
    );
    return NextResponse.json({ logo: doc?.dataUri || null });
  } catch (err) {
    console.error('GET /api/logo error', err);
    return NextResponse.json({ error: 'Failed to load logo' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { dataUri } = await req.json();
    if (typeof dataUri !== 'string' || !dataUri.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
    }

    // Optional: limit payload size roughly by length (e.g., 5MB ~ 6.6MB base64)
    const maxLen = 7 * 1024 * 1024; // ~7MB
    if (dataUri.length > maxLen) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 });
    }

    const client = await clientPromise;
    const db = client.db();
    const col = db.collection(COLLECTION);

    await col.updateOne(
      { key: DOC_KEY },
      { $set: { key: DOC_KEY, dataUri, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/logo error', err);
    return NextResponse.json({ error: 'Failed to save logo' }, { status: 500 });
  }
}

