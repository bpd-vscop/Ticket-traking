// scripts/seed-families.js
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './.env.local' });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI not found in .env.local');
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB...');

    const familiesCollection = client.db().collection('families');
    await familiesCollection.deleteMany({});
    console.log('Cleared existing families.');

    const families = [
      {
        id: 'family-1',
        sheetIds: ['sheet-1', 'sheet-2'],
        level: 'S',
        parents: { father: 'Marc Dupuis' },
        student: 'Leo Dupuis',
        subjects: [{ name: 'Mathematics', hours: 2 }, { name: 'Physics', hours: 1.5 }],
        packDetails: { hourlyRate: 40, reduction: 10, reductionReason: 'Sibling discount', total: 260 },
        payments: [{ method: 'card', amount: 260 }],
        teacherIds: ['teacher-1', 'teacher-2'],
      },
       {
        id: 'family-2',
        sheetIds: ['sheet-3'],
        level: 'L',
        parents: { mother: 'Sophie Dubois' },
        student: 'Chloe Dubois',
        subjects: [{ name: 'French', hours: 2 }],
        packDetails: { hourlyRate: 35, reduction: 0, total: 140 },
        payments: [{ method: 'cash', amount: 100 }, { method: 'cheque', amount: 40 }],
        teacherIds: ['teacher-3'],
      },
    ];

    await familiesCollection.insertMany(families);
    console.log(`Seeded ${families.length} families.`);

  } catch (err) {
    console.error('Error seeding families:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

main();
