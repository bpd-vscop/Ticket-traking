"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { getFamilies, getTeachers } from "@/lib/data";
import { Family, Ticket } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { BookUser, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const mockFamilies = getFamilies();
const mockTeachers = getTeachers();

const generateTicketsForFamily = (family: Family): Ticket[] => {
    let tickets: Ticket[] = [];
    const currentYear = new Date().getFullYear().toString().slice(-2);
    family.sheetIds.forEach(sheetId => {
        // This is a mock. In reality, we'd fetch sheet details.
        // Determine pack size based on sheet ID pattern
        // In reality, this would fetch from the actual sheet data
        let packSize = 38; // default
        if (sheetId.includes('2')) packSize = 24;
        else if (sheetId.includes('3') || sheetId === 'sheet-5') packSize = 36;
        for (let i = 1; i <= packSize; i++) {
            tickets.push({
                id: `${family.level}-${currentYear}${String(i).padStart(3, '0')}`,
                level: family.level,
                sheetId: sheetId,
                isUsed: Math.random() > 0.5 // Randomly mark as used for demo
            });
        }
    });
    return tickets;
}

const PackValidationModal = ({
  family,
  isOpen,
  setIsOpen,
}: {
  family: Family | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  if (!family) return null;

  const tickets = generateTicketsForFamily(family);
  const usedTickets = tickets.filter(t => t.isUsed).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Validate Pack for {family.student}</DialogTitle>
          <DialogDescription>
            Mark the tickets that have been returned and used.
            ({usedTickets} / {tickets.length} used)
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Ticket ID</TableHead>
                <TableHead>Sheet ID</TableHead>
                <TableHead className="text-right w-[80px]">Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{ticket.id}</TableCell>
                  <TableCell>{ticket.sheetId}</TableCell>
                  <TableCell className="text-right">
                    <Checkbox defaultChecked={ticket.isUsed} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PackCard = ({
  family,
  onValidate,
}: {
  family: Family;
  onValidate: (family: Family) => void;
}) => {
  const teachers = mockTeachers.filter(t => family.teacherIds.includes(t.id));
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><User className="h-5 w-5"/> {family.student}</CardTitle>
        <Separator className="my-2"/>
        <div className="space-y-2 pt-2">
            {teachers.map(teacher => (
                 <div key={teacher.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookUser className="h-4 w-4"/>
                    <span>{teacher.name}</span>
                 </div>
            ))}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex flex-wrap gap-2">
          {family.subjects.map((subject) => (
            <Badge key={subject.name} variant="secondary">{subject.name}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={() => onValidate(family)}>
          Validate Hours
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function PacksPage() {
  const [families] = useState<Family[]>(mockFamilies);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);

  const handleValidateClick = (family: Family) => {
    setSelectedFamily(family);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Assigned Packs</h1>
      <p className="text-muted-foreground">
        Overview of all families with assigned teachers. Click to validate returned tickets.
      </p>
      {families.length > 0 ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {families.map((family) => (
            <PackCard
              key={family.id}
              family={family}
              onValidate={handleValidateClick}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No packs have been assigned to teachers yet.</p>
          </CardContent>
        </Card>
      )}
      <PackValidationModal
        family={selectedFamily}
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
      />
    </div>
  );
}
