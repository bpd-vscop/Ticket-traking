import type { Sheet, Family, Teacher, User, Level, StudentInfo } from './types';

let mockTeachers: Teacher[] = [
  { id: 'teacher-1', name: 'Dr. Evelyn Reed' },
  { id: 'teacher-2', name: 'Mr. Samuel Carter' },
  { id: 'teacher-3', name: 'Ms. Olivia Chen' },
];

let mockSheets: Sheet[] = [
  { id: 'sheet-1', level: 'P', packSize: 24, startNumber: 1, endNumber: 24, isAssigned: true, downloads: 2, generationDate: new Date('2024-07-20T10:00:00Z'), familyId: 'family-1' },
  { id: 'sheet-2', level: 'P', packSize: 38, startNumber: 25, endNumber: 62, isAssigned: true, downloads: 0, generationDate: new Date('2024-07-21T11:00:00Z'), familyId: 'family-1' },
  { id: 'sheet-3', level: 'C', packSize: 24, startNumber: 1, endNumber: 24, isAssigned: true, downloads: 1, generationDate: new Date('2024-07-22T09:30:00Z'), familyId: 'family-2' },
  { id: 'sheet-4', level: 'L', packSize: 38, startNumber: 1, endNumber: 38, isAssigned: false, downloads: 0, generationDate: new Date() },
  { id: 'sheet-5', level: 'S', packSize: 36, startNumber: 1, endNumber: 36, isAssigned: false, downloads: 0, generationDate: new Date() },
];

let mockFamilies: Family[] = [
  {
    id: 'family-1',
    sheetIds: ['sheet-1', 'sheet-2'],
    level: 'S',
    parents: {
      father: { firstName: 'Marc', lastName: 'Dupuis' },
      mother: { firstName: 'Claire', lastName: 'Dupuis' },
      lastName: 'Dupuis'
    },
    students: [
      { firstName: 'Leo', lastName: 'Dupuis', level: 'S', subLevel: 'Licence 2 (L2) – 2ᵉ année universitaire' },
      { firstName: 'Emma', lastName: 'Dupuis', level: 'L', subLevel: '1ʳᵉ année baccalauréat (11ᵉ année)' }
    ] as StudentInfo[],
    subjects: [{ name: 'Mathematics', hours: 2, studentName: 'Leo Dupuis' }, { name: 'Physics', hours: 1.5, studentName: 'Emma Dupuis' }],
    packDetails: { hourlyRate: 220, reduction: 20, reductionReason: 'Sibling discount', total: 200 },
    payments: [{ method: 'card', amount: 200 }],
    teacherIds: ['teacher-1', 'teacher-2'],
    contact: {
      address: '123 Rue de la Paix, Casablanca',
      phone: '+212 6 12 34 56 78',
      email: 'marc.dupuis@email.com'
    },
    student: 'Leo Dupuis', // Backward compatibility
  },
   {
    id: 'family-2',
    sheetIds: ['sheet-3'],
    level: 'L',
    parents: {
      mother: { firstName: 'Sophie', lastName: 'Dubois' },
      lastName: 'Dubois'
    },
    students: [
      { firstName: 'Chloe', lastName: 'Dubois', level: 'L', subLevel: 'Tronc commun (10ᵉ année)' }
    ] as StudentInfo[],
    subjects: [{ name: 'French', hours: 2, studentName: 'Chloe Dubois' }],
    packDetails: { hourlyRate: 180, reduction: 0, total: 180 },
    payments: [{ method: 'cash', amount: 180 }],
    teacherIds: ['teacher-3'],
    contact: {
      address: '456 Avenue Mohammed V, Rabat',
      phone: '+212 6 87 65 43 21',
      email: 'sophie.dubois@email.com'
    },
    student: 'Chloe Dubois', // Backward compatibility
  },
  {
    id: 'family-3',
    sheetIds: ['sheet-5'],
    level: 'P',
    parents: {
      father: { firstName: 'Ahmed', lastName: 'Benali' },
      mother: { firstName: 'Fatima', lastName: 'Benali' },
      lastName: 'Benali'
    },
    students: [
      { firstName: 'Youssef', lastName: 'Benali', level: 'P', subLevel: '4ᵉ année primaire' }
    ] as StudentInfo[],
    subjects: [{ name: 'Arabic', hours: 3, studentName: 'Youssef Benali' }, { name: 'Mathematics', hours: 2, studentName: 'Youssef Benali' }],
    packDetails: { hourlyRate: 130, reduction: 10, reductionReason: 'Early payment', total: 120 },
    payments: [{ method: 'card', amount: 120 }],
    teacherIds: ['teacher-1'],
    contact: {
      address: '789 Quartier Hay Riad, Sale',
      phone: '+212 5 37 12 34 56',
      email: 'ahmed.benali@gmail.com'
    },
    student: 'Youssef Benali', // Backward compatibility
  },
];

// Functions to interact with the mock data
export const getTeachers = () => mockTeachers;
export const getSheets = () => mockSheets;
export const getFamilies = () => mockFamilies;

export const addSheet = (sheet: Sheet) => {
  mockSheets.unshift(sheet);
};

export const updateSheet = (updatedSheet: Partial<Sheet> & { id: string }) => {
  mockSheets = mockSheets.map(sheet => 
    sheet.id === updatedSheet.id ? { ...sheet, ...updatedSheet } : sheet
  );
};
