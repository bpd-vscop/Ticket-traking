import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

type TicketInput = {
  id: string; // e.g., P-25001
  level: 'P' | 'C' | 'L' | 'S' | 'E';
  sheetId: string;
  isUsed: boolean;
  familyId: string;
  validatedAt?: Date;
  validatedBy?: string; // user who validated
};

type TicketValidationRequest = {
  familyId: string;
  tickets: {
    id: string;
    isUsed: boolean;
  }[];
  validatedBy?: string;
};

const COLLECTION = 'tickets';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const familyId = searchParams.get('familyId');

    if (!familyId) {
      return NextResponse.json({ error: 'Family ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const col = db.collection(COLLECTION);

    const tickets = await col
      .find({ familyId }, { projection: { _id: 0 } })
      .sort({ id: 1 })
      .toArray();

    return NextResponse.json({ tickets });
  } catch (err) {
    console.error('GET /api/tickets error', err);
    return NextResponse.json({ error: 'Failed to load tickets' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Handle both single ticket updates and bulk validation
    if (body.familyId && body.tickets) {
      // Bulk validation update
      const { familyId, tickets, validatedBy }: TicketValidationRequest = body;

      const client = await clientPromise;
      const db = client.db();
      const col = db.collection(COLLECTION);

      const ops = tickets.map((ticket) => ({
        updateOne: {
          filter: { id: ticket.id, familyId },
          update: {
            $set: {
              isUsed: ticket.isUsed,
              validatedAt: new Date(),
              validatedBy: validatedBy || 'system',
              updatedAt: new Date(),
            },
          },
          upsert: false, // Don't create new tickets, only update existing ones
        },
      }));

      if (ops.length > 0) {
        await col.bulkWrite(ops, { ordered: false });
      }

      return NextResponse.json({ ok: true, updated: tickets.length });
    } else {
      // Single ticket creation/update
      const tickets: TicketInput[] = Array.isArray(body?.tickets)
        ? body.tickets
        : body?.ticket
        ? [body.ticket]
        : [];

      if (!tickets.length) {
        return NextResponse.json({ error: 'No tickets provided' }, { status: 400 });
      }

      const client = await clientPromise;
      const db = client.db();
      const col = db.collection(COLLECTION);

      const ops = tickets.map((ticket) => {
        const setData: Record<string, any> = {
          id: ticket.id,
          level: ticket.level,
          sheetId: ticket.sheetId,
          isUsed: ticket.isUsed,
          familyId: ticket.familyId,
          updatedAt: new Date(),
        };

        if (ticket.validatedAt) setData.validatedAt = ticket.validatedAt;
        if (ticket.validatedBy) setData.validatedBy = ticket.validatedBy;

        return {
          updateOne: {
            filter: { id: ticket.id },
            update: {
              $set: setData,
              $setOnInsert: { createdAt: new Date() }
            },
            upsert: true,
          },
        };
      });

      if (ops.length > 0) {
        await col.bulkWrite(ops, { ordered: false });
      }

      return NextResponse.json({ ok: true, count: tickets.length });
    }
  } catch (err) {
    console.error('POST /api/tickets error', err);
    return NextResponse.json({ error: 'Failed to save tickets' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id, familyId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const col = db.collection(COLLECTION);

    const filter: any = { id };
    if (familyId) filter.familyId = familyId;

    const result = await col.deleteOne(filter);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deleted: true });
  } catch (err) {
    console.error('DELETE /api/tickets error', err);
    return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 });
  }
}