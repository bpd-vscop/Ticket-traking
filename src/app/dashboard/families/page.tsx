"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockFamilies, mockTeachers } from "@/lib/data";
import { Family, Level, Teacher, levels } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { BookUser, User, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


const TeacherAssignmentModal = ({
  family,
  isOpen,
  setIsOpen,
}: {
  family: Family | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>(family?.teacherIds || []);
  const { toast } = useToast();

  const handleSave = () => {
    toast({
        title: "Teachers Assigned",
        description: `Teachers have been updated for the ${family?.student}'s family.`
    })
    setIsOpen(false);
  }

  if (!family) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Teacher for {family.student}</DialogTitle>
          <DialogDescription>
            Select one or more teachers for this family.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <Label>Teachers</Label>
            <Select onValueChange={(v) => setSelectedTeachers([v])} defaultValue={selectedTeachers[0]}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                    {mockTeachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                           {teacher.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {/* Note: UI for multiple teacher selection could be a multi-select component */}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-accent hover:bg-accent/90">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const FamilyCard = ({
  family,
  onAssignTeacher,
}: {
  family: Family;
  onAssignTeacher: (family: Family) => void;
}) => {
    const teachers = mockTeachers.filter(t => family.teacherIds.includes(t.id));
  return (
    <Card>
      <CardHeader>
        <CardTitle>{family.student}</CardTitle>
        <CardDescription>
          {family.parents.father} {family.parents.mother && ` & ${family.parents.mother}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <h4 className="font-semibold text-sm">Subjects</h4>
            <div className="flex flex-wrap gap-2">
            {family.subjects.map((s) => (
                <Badge key={s.name} variant="secondary">
                {s.name} - {s.hours}h/week
                </Badge>
            ))}
            </div>
        </div>
        <div className="space-y-2">
             <h4 className="font-semibold text-sm">Assigned Teachers</h4>
             <div className="flex flex-wrap gap-2">
                {teachers.length > 0 ? teachers.map(t => (
                    <Badge key={t.id} variant="outline" className="flex items-center gap-2">
                        <BookUser className="h-3 w-3" />
                        {t.name}
                    </Badge>
                )) : <p className="text-sm text-muted-foreground">No teachers assigned</p>}
             </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onAssignTeacher(family)}
        >
          Manage Teachers
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function FamiliesPage() {
  const [families, setFamilies] = useState<Family[]>(mockFamilies);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);

  const handleAssignTeacherClick = (family: Family) => {
    setSelectedFamily(family);
    setIsModalOpen(true);
  };

  const familiesByLevel = (level: Level) =>
    families.filter((family) => family.level === level);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Family Management</h1>
      <Tabs defaultValue="S">
        <TabsList>
          {levels.map((level) => (
            <TabsTrigger key={level} value={level}>
              {level}
            </TabsTrigger>
          ))}
        </TabsList>
        {levels.map((level) => (
          <TabsContent key={level} value={level}>
            {familiesByLevel(level).length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {familiesByLevel(level).map((family) => (
                  <FamilyCard
                    key={family.id}
                    family={family}
                    onAssignTeacher={handleAssignTeacherClick}
                  />
                ))}
              </div>
            ) : (
                <Card className="mt-4">
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">No families for this level.</p>
                    </CardContent>
                </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
      <TeacherAssignmentModal
        family={selectedFamily}
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
      />
    </div>
  );
}
