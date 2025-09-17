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
import { getFamilies, getTeachers } from "@/lib/data";
import { Family, Level, Teacher, levelLabels, levels, PackSize, packSizes } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { BookUser, User, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const mockFamilies = getFamilies();
const mockTeachers = getTeachers();

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
          <Button onClick={handleSave}>Save Changes</Button>
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
  const [selectedPackSize, setSelectedPackSize] = useState<PackSize | 'all'>('all');

  const handleAssignTeacherClick = (family: Family) => {
    setSelectedFamily(family);
    setIsModalOpen(true);
  };

  const familiesByLevel = (level: Level) => {
    const levelFamilies = families.filter((family) => family.level === level);
    // For families, we don't have direct pack size info, so we'll show all families
    // This maintains consistency with the sheets page UI pattern
    return levelFamilies;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Family Management</h1>

      {/* Pack Size Tabs */}
      <div className="flex justify-center mb-6">
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setSelectedPackSize('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedPackSize === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            All Sizes
          </button>
          {packSizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedPackSize(size)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPackSize === size
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              {size} tickets
            </button>
          ))}
        </div>
      </div>

      {/* Education Level Tabs */}
      <Tabs defaultValue="S">
        <TabsList className="w-full">
          {levels.map((level) => (
            <TabsTrigger key={level} value={level} className="flex-1">
               {levelLabels[level]}
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
