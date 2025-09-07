// scripts/seed-teachers.js
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

    const teachersCollection = client.db().collection('teachers');
    await teachersCollection.deleteMany({});
    console.log('Cleared existing teachers.');

    const teachers = [
      { id: 'teacher-1', name: 'Dr. Evelyn Reed' },
      { id: 'teacher-2', name: 'Mr. Samuel Carter' },
      { id: 'teacher-3', name: 'Ms. Olivia Chen' },
    ];

    await teachersCollection.insertMany(teachers);
    console.log(`Seeded ${teachers.length} teachers.`);

  } catch (err) {
    console.error('Error seeding teachers:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

main();
