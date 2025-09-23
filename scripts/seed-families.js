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
        parents: { father: 'Marc Dupuis', mother: 'Claire Dupuis' },
        students: ['Leo Dupuis', 'Emma Dupuis'],
        subjects: [{ name: 'Mathematics', hours: 2, studentName: 'Leo Dupuis' }, { name: 'Physics', hours: 1.5, studentName: 'Emma Dupuis' }],
        packDetails: { hourlyRate: 220, reduction: 20, reductionReason: 'Sibling discount', total: 200 },
        payments: [{ method: 'card', amount: 200 }],
        teacherIds: ['teacher-1', 'teacher-2'],
        contact: {
          address: '123 Rue de la Paix, Casablanca',
          phone: '+212 6 12 34 56 78',
          email: 'marc.dupuis@email.com'
        },
        // Backward compatibility
        student: 'Leo Dupuis'
      },
       {
        id: 'family-2',
        sheetIds: ['sheet-3'],
        level: 'L',
        parents: { mother: 'Sophie Dubois' },
        students: ['Chloe Dubois'],
        subjects: [{ name: 'French', hours: 2, studentName: 'Chloe Dubois' }],
        packDetails: { hourlyRate: 180, reduction: 0, total: 180 },
        payments: [{ method: 'cash', amount: 180 }],
        teacherIds: ['teacher-3'],
        contact: {
          address: '456 Avenue Mohammed V, Rabat',
          phone: '+212 6 87 65 43 21',
          email: 'sophie.dubois@email.com'
        },
        // Backward compatibility
        student: 'Chloe Dubois'
      },
      {
        id: 'family-3',
        sheetIds: [],
        level: 'P',
        parents: { father: 'Ahmed Benali', mother: 'Fatima Benali' },
        students: ['Youssef Benali'],
        subjects: [{ name: 'Arabic', hours: 3, studentName: 'Youssef Benali' }, { name: 'Mathematics', hours: 2, studentName: 'Youssef Benali' }],
        packDetails: { hourlyRate: 130, reduction: 10, reductionReason: 'Early payment', total: 120 },
        payments: [],
        teacherIds: [],
        contact: {
          address: '789 Quartier Hay Riad, Sale',
          phone: '+212 5 37 12 34 56',
          email: 'ahmed.benali@gmail.com'
        },
        // Backward compatibility
        student: 'Youssef Benali'
      }
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
