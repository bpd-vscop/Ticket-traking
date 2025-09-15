// scripts/seed-sheets.js
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

    const sheetsCollection = client.db().collection('sheets');
    await sheetsCollection.deleteMany({});
    console.log('Cleared existing sheets.');

    const sheets = [
      { id: 'sheet-1', level: 'P', packSize: 24, startNumber: 1, endNumber: 24, isAssigned: true, downloads: 2, generationDate: new Date('2024-07-20T10:00:00Z'), familyId: 'family-1' },
      { id: 'sheet-2', level: 'P', packSize: 38, startNumber: 25, endNumber: 62, isAssigned: true, downloads: 0, generationDate: new Date('2024-07-21T11:00:00Z'), familyId: 'family-1' },
      { id: 'sheet-3', level: 'C', packSize: 24, startNumber: 1, endNumber: 24, isAssigned: true, downloads: 1, generationDate: new Date('2024-07-22T09:30:00Z'), familyId: 'family-2' },
      { id: 'sheet-4', level: 'L', packSize: 38, startNumber: 1, endNumber: 38, isAssigned: false, downloads: 0, generationDate: new Date() },
      { id: 'sheet-5', level: 'S', packSize: 36, startNumber: 1, endNumber: 36, isAssigned: false, downloads: 0, generationDate: new Date() },
    ];

    await sheetsCollection.insertMany(sheets);
    console.log(`Seeded ${sheets.length} sheets.`);

  } catch (err) {
    console.error('Error seeding sheets:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

main();
