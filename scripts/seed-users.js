// scripts/seed-users.js
const { MongoClient } = require('mongodb');
const { hash } = require('bcryptjs');
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

    const usersCollection = client.db().collection('users');

    // Clear existing non-admin users
    await usersCollection.deleteMany({ role: 'user' });
    console.log('Cleared existing non-admin users.');

    const users = [
      { id: 'user-2', name: 'John Doe', email: 'john.doe@example.com', role: 'user', password: 'password1' },
      { id: 'user-3', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'user', password: 'password2' },
    ];

    for (const user of users) {
      user.password = await hash(user.password, 12);
      await usersCollection.insertOne(user);
    }

    console.log(`Seeded ${users.length} users.`);

  } catch (err) {
    console.error('Error seeding users:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

main();
