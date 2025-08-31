import type { Sheet, Family, Teacher, User, Level } from './types';

let mockUsers: User[] = [
  { id: 'user-1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
  { id: 'user-2', name: 'John Doe', email: 'john.doe@example.com', role: 'user' },
  { id: 'user-3', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'user' },
];

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
];

let mockFamilies: Family[] = [
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

// Functions to interact with the mock data
export const getUsers = () => mockUsers;
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
