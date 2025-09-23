import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import * as z from 'zod';

const pricingSchema = z.object({
  P: z.number().min(1, { message: "Primaire rate must be at least 1 MAD." }),
  C: z.number().min(1, { message: "Collège rate must be at least 1 MAD." }),
  L: z.number().min(1, { message: "Lycée rate must be at least 1 MAD." }),
  S: z.number().min(1, { message: "Supérieur rate must be at least 1 MAD." }),
  E: z.number().min(100, { message: "Spéciale minimum rate must be at least 100 MAD." }),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized. Only administrators can update pricing settings.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = pricingSchema.parse(body);

    const client = await clientPromise;
    const db = client.db();

    // Update or create pricing settings document
    const result = await db.collection('settings').updateOne(
      { type: 'pricing' },
      {
        $set: {
          ...validatedData,
          updatedAt: new Date(),
          updatedBy: session.user.id
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      message: 'Pricing settings updated successfully',
      data: validatedData
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid data', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating pricing settings:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const pricingSettings = await db.collection('settings').findOne({ type: 'pricing' });

    if (!pricingSettings) {
      // Return default rates if no custom pricing is set
      return NextResponse.json({
        P: 130,
        C: 150,
        L: 180,
        S: 220,
        E: 100
      });
    }

    return NextResponse.json({
      P: pricingSettings.P || 130,
      C: pricingSettings.C || 150,
      L: pricingSettings.L || 180,
      S: pricingSettings.S || 220,
      E: pricingSettings.E || 100
    });

  } catch (error) {
    console.error('Error fetching pricing settings:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}