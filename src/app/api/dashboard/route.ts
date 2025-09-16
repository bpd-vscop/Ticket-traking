import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    // Get stats in parallel for better performance
    const [
      totalSheets,
      unassignedSheets,
      totalFamilies,
      totalTeachers,
      totalUsers,
      recentSheets,
      totalTicketsGenerated,
      totalDownloads,
      sheetsByLevel,
      topDownloadedSheets
    ] = await Promise.all([
      // Total sheets count
      db.collection('sheets').countDocuments(),

      // Unassigned sheets count
      db.collection('sheets').countDocuments({ isAssigned: false }),

      // Total families count
      db.collection('families').countDocuments(),

      // Total teachers count
      db.collection('teachers').countDocuments(),

      // Total users count (admin only)
      session.user.role === 'admin' ? db.collection('users').countDocuments() : null,

      // Recent sheets (last 7 days)
      db.collection('sheets').countDocuments({
        generationDate: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }),

      // Total tickets generated (sum of all packSizes)
      db.collection('sheets').aggregate([
        { $group: { _id: null, total: { $sum: '$packSize' } } }
      ]).toArray(),

      // Total downloads
      db.collection('sheets').aggregate([
        { $group: { _id: null, total: { $sum: '$downloads' } } }
      ]).toArray(),

      // Sheets by level for chart data
      db.collection('sheets').aggregate([
        {
          $group: {
            _id: '$level',
            count: { $sum: 1 },
            assigned: { $sum: { $cond: ['$isAssigned', 1, 0] } },
            unassigned: { $sum: { $cond: ['$isAssigned', 0, 1] } }
          }
        }
      ]).toArray(),

      // Top 5 most downloaded sheets
      db.collection('sheets').find({}, {
        projection: { id: 1, level: 1, startNumber: 1, endNumber: 1, downloads: 1, generationDate: 1 }
      })
      .sort({ downloads: -1 })
      .limit(5)
      .toArray()
    ]);

    const stats = {
      overview: {
        totalSheets,
        unassignedSheets,
        totalFamilies,
        totalTeachers,
        ...(session.user.role === 'admin' && { totalUsers }),
        recentSheets,
        totalTicketsGenerated: totalTicketsGenerated[0]?.total || 0,
        totalDownloads: totalDownloads[0]?.total || 0,
      },
      charts: {
        sheetsByLevel: sheetsByLevel.map(item => ({
          level: item._id,
          total: item.count,
          assigned: item.assigned,
          unassigned: item.unassigned,
        })),
        topDownloadedSheets: topDownloadedSheets.map(sheet => ({
          ...sheet,
          displayName: `${sheet.level}-${new Date(sheet.generationDate).getFullYear().toString().slice(-2)}${String(sheet.startNumber).padStart(4, '0')}`
        }))
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}