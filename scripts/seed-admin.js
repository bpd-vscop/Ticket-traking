// scripts/seed-admin.js
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

    // Check if admin user already exists
    const existingAdmin = await usersCollection.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('Admin user already exists.');
      return;
    }

    // Hash password
    const hashedPassword = await hash('password', 12);

    // Create admin user
    const adminUser = {
      id: `user-${Date.now()}`,
      name: 'Admin User',
      email: 'admin@connectschool.com',
      password: hashedPassword,
      role: 'admin',
    };

    await usersCollection.insertOne(adminUser);
    console.log('Admin user created successfully!');

  } catch (err) {
    console.error('Error seeding admin user:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

main();
