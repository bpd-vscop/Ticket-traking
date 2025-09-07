export type Level = "P" | "C" | "L" | "S" | "E";
export const levels: Level[] = ["P", "C", "L", "S", "E"];

export type PackSize = 24 | 38;
export const packSizes: PackSize[] = [24, 38];

export type PaymentMethod = "cash" | "cheque" | "card";

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

export type Family = {
  id: string;
  sheetIds: string[];
  level: Level;
  parents: {
    father?: string;
    mother?: string;
  };
  student: string;
  subjects: { name: string; hours: number }[];
  packDetails: {
    hourlyRate: number;
    reduction: number;
    reductionReason?: string;
    total: number;
  };
  payments: { method: PaymentMethod; amount: number }[];
  teacherIds: string[];
};

export type Teacher = {
  id: string;
  name: string;
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
