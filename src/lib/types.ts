export type Level = "P" | "C" | "L" | "S" | "E";
export const levels: Level[] = ["P", "C", "L", "S", "E"];
export const levelLabels: Record<Level, string> = {
  P: "Primaire",
  C: "Collège",
  L: "Lycée",
  S: "Supérieur",
  E: "Spéciale",
};

export const levelRates: Record<Level, number | null> = {
  P: 130, // Primaire - 130 MAD
  C: 150, // Collège - 150 MAD
  L: 180, // Lycée - 180 MAD
  S: 220, // Supérieur - 220 MAD
  E: null, // Spéciale - variable rate (min 100 MAD)
};

// Sub-levels for each education level (Moroccan education system)
export const subLevels: Record<Level, string[]> = {
  P: [
    "1ʳᵉ année primaire",
    "2ᵉ année primaire",
    "3ᵉ année primaire",
    "4ᵉ année primaire",
    "5ᵉ année primaire",
    "6ᵉ année primaire"
  ], // École primaire
  C: [
    "1ʳᵉ année collège (7ᵉ année de scolarité)",
    "2ᵉ année collège (8ᵉ année)",
    "3ᵉ année collège (9ᵉ année, brevet)"
  ], // Enseignement secondaire collégial
  L: [
    "Tronc commun (10ᵉ année)",
    "1ʳᵉ année baccalauréat (11ᵉ année)",
    "2ᵉ année baccalauréat (12ᵉ année, Bac)"
  ], // Enseignement secondaire qualifiant
  S: [
    "Licence 1 (L1) – 1ʳᵉ année universitaire",
    "Licence 2 (L2) – 2ᵉ année universitaire",
    "Licence 3 (L3) – 3ᵉ année universitaire",
    "Master 1 (M1) – 4ᵉ année universitaire",
    "Master 2 (M2) – 5ᵉ année universitaire"
  ], // Université
  E: ["Prépa", "Ingénieur", "Médecine", "Autres"], // Spéciale
};

export type PackSize = 24 | 36 | 38;
export const packSizes: PackSize[] = [24, 36, 38];

export type PaymentMethod = "cash" | "cheque" | "card";

export type Payment = {
  method: PaymentMethod;
  amount: number;
  status?: 'pending' | 'completed' | 'overdue';
  date?: string;
  dueDate?: string;
  chequeNumber?: string;
  chequeReceived?: boolean;
  notes?: string;
};

export type Ticket = {
  id: string; // e.g., P-25001
  level: Level;
  sheetId: string;
  isUsed: boolean;
};

export type Sheet = {
  id: string;
  level: Level;
  packSize: PackSize;
  startNumber: number;
  endNumber: number;
  isAssigned: boolean;
  familyId?: string;
  downloads: number;
  generationDate: Date;
};

export type StudentInfo = {
  firstName: string;
  lastName: string;
  level: Level;
  subLevel: string;
};

export type Family = {
  id: string;
  sheetIds: string[];
  level: Level; // Primary level for family (can be derived from students)
  parents: {
    father?: {
      firstName?: string;
      lastName?: string;
    };
    mother?: {
      firstName?: string;
      lastName?: string;
    };
    lastName?: string; // Family last name (fallback)
  };
  students: StudentInfo[]; // Enhanced students with level information
  subjects: { name: string; hours: number; studentName: string }[]; // Subject assigned to specific student
  packDetails: {
    hourlyRate: number;
    reduction: number;
    reductionReason?: string;
    total: number;
  };
  payments: Payment[];
  teacherIds: string[];
  contact: {
    address?: string;
    phone?: string;
    email?: string;
  };
  // Keeping backward compatibility
  student?: string; // Will be migrated to students array
};

// Subjects by education level
export const subjectsByLevel: Record<Level, string[]> = {
  P: [
    "Français",
    "Arabe",
    "Anglais",
    "Espagnol",
    "Mathématiques",
    "Sciences de la vie et de la terre (SVT)",
    "Histoire – Géographie",
    "Éducation islamique",
    "Informatique",
  ], // Primaire
  C: [
    "Français",
    "Arabe",
    "Anglais",
    "Espagnol",
    "Mathématiques",
    "Sciences physiques et chimiques",
    "Sciences de la vie et de la terre (SVT)",
    "Histoire – Géographie",
    "Éducation islamique",
    "Éducation artistique",
    "Informatique"
  ], // Collège
  L: [
    "Français",
    "Arabe",
    "Anglais",
    "Espagnol",
    "Mathématiques",
    "Sciences de la vie et de la terre (SVT)",
    "Physiques et chimiques",
    "Histoire – Géographie",
    "Philosophie",
    "Éducation islamique",
    "Informatique"
  ], // Lycée
  S: [
    "Mathématiques",
    "Informatique",
    "Physique",
    "Chimie",
    "Biologie",
    "Géologie",
    "Statistiques",
    "Économie appliquée",
    "Littérature arabe",
    "Littérature française",
    "Histoire",
    "Géographie",
    "Philosophie",
    "Études islamiques",
    "Sociologie",
    "Psychologie",
    "Droit civil",
    "Droit constitutionnel",
    "Droit commercial",
    "Sciences politiques",
    "Micro-économie",
    "Macro-économie",
    "Comptabilité",
    "Gestion",
    "Anglais",
    "Espagnol",
    "Allemand",
    "Traduction",
    "Linguistique",
    "Civilisation",
    "Intelligence artificielle",
    "Big data",
    "Réseaux",
    "Développement logiciel",
    "Finance",
    "Marketing",
    "Management",
    "Logistique",
    "Génie civil",
    "Génie mécanique",
    "Génie électrique",
    "Génie industriel"
  ], // Supérieur
  E: [
    "Mathématiques",
    "Physique",
    "Chimie",
    "Sciences de l'ingénieur",
    "Informatique",
    "Médecine",
    "Pharmacie",
    "Dentaire",
    "Autre"
  ] // Spéciale
};

export type TeacherSubjectAssignment = {
  level: Level;
  subjects: string[];
};

export type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  specializations: TeacherSubjectAssignment[];
  notes?: string;
  // Backward compatibility
  name?: string;
};

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password?: string;
  role: "admin" | "user";
  address?: string;
  number?: string;
  profilePicture?: string;
};
