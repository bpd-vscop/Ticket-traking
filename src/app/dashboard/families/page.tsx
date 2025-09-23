"use client";

import { useState, useEffect } from "react";
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
import { Family, Level, Teacher, StudentInfo, levelLabels, levels, subLevels } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BookUser, User, Users, Plus, X, Edit, Search, Filter, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AddFamilyModal = ({
  isOpen,
  setIsOpen,
  onSave,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (familyData: Partial<Family>) => void;
}) => {
  const [formData, setFormData] = useState({
    father: {
      firstName: '',
      lastName: ''
    },
    mother: {
      firstName: '',
      lastName: ''
    },
    students: [{
      firstName: '',
      lastName: '',
      level: 'P' as Level,
      subLevel: subLevels.P[0]
    }] as StudentInfo[],
    contact: {
      address: '',
      phone: '',
      email: ''
    }
  });
  const { toast } = useToast();

  // Helper function to extract last name
  const getLastName = () => {
    // Use father's last name first, then mother's last name
    if (formData.father.lastName) {
      return formData.father.lastName.trim();
    } else if (formData.mother.lastName) {
      return formData.mother.lastName.trim();
    }
    return '';
  };

  // Auto-update student last names when parent names change
  const updateStudentLastNames = () => {
    const lastName = getLastName();
    setFormData(prev => ({
      ...prev,
      students: prev.students.map(student => ({
        ...student,
        lastName
      }))
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const hasFather = formData.father.firstName.trim() || formData.father.lastName.trim();
    const hasMother = formData.mother.firstName.trim() || formData.mother.lastName.trim();

    if (!hasFather && !hasMother) {
      toast({
        title: "Error",
        description: "At least one parent name is required.",
        variant: "destructive"
      });
      return;
    }

    const validStudents = formData.students.filter(s => s.firstName.trim());
    if (validStudents.length === 0) {
      toast({
        title: "Error",
        description: "At least one student name is required.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.contact.phone.trim() && !formData.contact.email.trim()) {
      toast({
        title: "Error",
        description: "Either phone number or email is required.",
        variant: "destructive"
      });
      return;
    }

    // Auto-assign last names to students
    updateStudentLastNames();

    const studentsWithLastNames = validStudents.map(student => ({
      ...student,
      lastName: getLastName()
    }));

    // Determine primary family level (most common level among students)
    const levelCounts = studentsWithLastNames.reduce((acc, student) => {
      acc[student.level] = (acc[student.level] || 0) + 1;
      return acc;
    }, {} as Record<Level, number>);

    const primaryLevel = Object.entries(levelCounts).reduce((a, b) =>
      levelCounts[a[0] as Level] > levelCounts[b[0] as Level] ? a : b
    )[0] as Level;

    const familyData: Partial<Family> = {
      parents: {
        ...(hasFather && { father: formData.father }),
        ...(hasMother && { mother: formData.mother }),
        lastName: getLastName()
      },
      students: studentsWithLastNames,
      level: primaryLevel,
      subjects: [], // Subjects will be added during sheet assignment
      contact: formData.contact,
      packDetails: {
        hourlyRate: 0,
        reduction: 0,
        reductionReason: '',
        total: 0
      },
      sheetIds: [],
      payments: [],
      teacherIds: []
    };

    try {
      await onSave(familyData);
      // Reset form
      setFormData({
        father: {
          firstName: '',
          lastName: ''
        },
        mother: {
          firstName: '',
          lastName: ''
        },
        students: [{
          firstName: '',
          lastName: '',
          level: 'P' as Level,
          subLevel: subLevels.P[0]
        }],
        contact: {
          address: '',
          phone: '',
          email: ''
        }
      });
      setIsOpen(false);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const addStudent = () => {
    setFormData(prev => ({
      ...prev,
      students: [...prev.students, {
        firstName: '',
        lastName: getLastName(),
        level: 'P' as Level,
        subLevel: subLevels.P[0]
      }]
    }));
  };

  const removeStudent = (index: number) => {
    if (formData.students.length > 1) {
      setFormData(prev => ({
        ...prev,
        students: prev.students.filter((_, i) => i !== index)
      }));
    }
  };

  const updateStudent = (index: number, field: keyof StudentInfo, value: string | Level) => {
    setFormData(prev => ({
      ...prev,
      students: prev.students.map((student, i) => {
        if (i === index) {
          const updatedStudent = { ...student, [field]: value };
          // When level changes, reset sub-level to first option
          if (field === 'level') {
            updatedStudent.subLevel = subLevels[value as Level][0];
          }
          return updatedStudent;
        }
        return student;
      })
    }));
  };

  // Removed subject management functions - subjects will be added during sheet assignment

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-500 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          position: 'fixed',
          top: -30,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 48
        }}
      />

      {/* Slide-in Panel */}
      <div className={`fixed top-16 right-4 bottom-4 w-[600px] bg-white shadow-2xl transform transition-transform duration-500 ease-in-out rounded-lg ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ zIndex: 49 }}>
        <div className="h-full flex flex-col relative">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={() => setIsOpen(false)}
                className="p-4"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <h2 className="text-xl font-semibold">Add New Family</h2>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 pb-20">
            <form id="add-family-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Parents Section - Now at the top */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-base font-semibold">Parent Information *</Label>
                <span className="text-red-500 text-sm">(At least one parent required)</span>
              </div>

              {/* Father Information */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Father</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="fatherFirstName">First Name</Label>
                    <Input
                      id="fatherFirstName"
                      value={formData.father.firstName}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          father: { ...prev.father, firstName: e.target.value }
                        }));
                      }}
                      placeholder="e.g., Ahmed"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="fatherLastName">Last Name</Label>
                    <Input
                      id="fatherLastName"
                      value={formData.father.lastName}
                      onChange={(e) => {
                        const newLastName = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          father: { ...prev.father, lastName: newLastName },
                          students: prev.students.map(student => ({
                            ...student,
                            lastName: newLastName || prev.mother.lastName || ''
                          }))
                        }));
                      }}
                      placeholder="e.g., Ben Ali"
                    />
                  </div>
                </div>
              </div>

              {/* Mother Information */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Mother</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="motherFirstName">First Name</Label>
                    <Input
                      id="motherFirstName"
                      value={formData.mother.firstName}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          mother: { ...prev.mother, firstName: e.target.value }
                        }));
                      }}
                      placeholder="e.g., Fatima"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="motherLastName">Last Name</Label>
                    <Input
                      id="motherLastName"
                      value={formData.mother.lastName}
                      onChange={(e) => {
                        const newLastName = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          mother: { ...prev.mother, lastName: newLastName },
                          students: prev.students.map(student => ({
                            ...student,
                            lastName: prev.father.lastName || newLastName || ''
                          }))
                        }));
                      }}
                      placeholder="e.g., Ben Ali"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-base font-semibold">Contact Information</Label>
                <span className="text-red-500 text-sm">(Phone or email required)</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.contact.address}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contact: { ...prev.contact, address: e.target.value }
                  }))}
                  placeholder="Full address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.contact.phone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      contact: { ...prev.contact, phone: e.target.value }
                    }))}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.contact.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      contact: { ...prev.contact, email: e.target.value }
                    }))}
                    placeholder="Email address"
                  />
                </div>
              </div>
            </div>


            {/* Children Section - Now at the end */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <Label className="text-base font-semibold">Children Information *</Label>
                <span className="text-red-500 text-sm">(At least one child required)</span>
              </div>
              <div className="space-y-4">
                {formData.students.map((student, index) => (
                  <div key={index} className="space-y-3 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">Child {index + 1}</Label>
                      {formData.students.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeStudent(index)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor={`firstName-${index}`}>First Name *</Label>
                        <Input
                          id={`firstName-${index}`}
                          value={student.firstName}
                          onChange={(e) => updateStudent(index, 'firstName', e.target.value)}
                          placeholder="e.g., Youssef"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`lastName-${index}`}>Last Name (Auto)</Label>
                        <Input
                          id={`lastName-${index}`}
                          value={student.lastName}
                          readOnly
                          className="bg-muted"
                          placeholder="Taken from parent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor={`level-${index}`}>Education Level *</Label>
                        <Select
                          value={student.level}
                          onValueChange={(value) => updateStudent(index, 'level', value as Level)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {levels.map(level => (
                              <SelectItem key={level} value={level}>
                                {levelLabels[level]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`subLevel-${index}`}>Specific Grade *</Label>
                        <Select
                          value={student.subLevel}
                          onValueChange={(value) => updateStudent(index, 'subLevel', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {subLevels[student.level].map(subLevel => (
                              <SelectItem key={subLevel} value={subLevel}>
                                {subLevel}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addStudent}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Child
                </Button>
              </div>
            </div>

            </form>
          </div>

          {/* Fixed Footer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-6 rounded-b-lg">
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="add-family-form">
                Add Family
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const TeacherAssignmentModal = ({
  family,
  isOpen,
  setIsOpen,
  teachers,
  onSave,
}: {
  family: Family | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  teachers: Teacher[];
  onSave: (familyId: string, teacherIds: string[]) => void;
}) => {
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>(family?.teacherIds || []);
  const { toast } = useToast();

  const handleSave = async () => {
    if (family) {
      try {
        await onSave(family.id, selectedTeachers);
        toast({
          title: "Teachers Assigned",
          description: `Teachers have been updated for ${family.student}'s family.`
        });
        setIsOpen(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update teachers. Please try again.",
          variant: "destructive"
        });
      }
    }
  }

  // Reset selected teachers when family changes
  useEffect(() => {
    setSelectedTeachers(family?.teacherIds || []);
  }, [family]);

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
                    {teachers.map(teacher => (
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
  allTeachers,
}: {
  family: Family;
  onAssignTeacher: (family: Family) => void;
  allTeachers: Teacher[];
}) => {
    const teachers = allTeachers.filter(t => family.teacherIds.includes(t.id));
    // Handle backward compatibility and new structure
    const students = family.students;
    const isNewFormat = students && students.length > 0 && typeof students[0] === 'object';

    let displayName;
    if (isNewFormat) {
      const studentInfos = students as StudentInfo[];
      displayName = studentInfos.length > 1
        ? `${studentInfos[0].firstName} ${studentInfos[0].lastName} (+${studentInfos.length - 1} more)`
        : `${studentInfos[0].firstName} ${studentInfos[0].lastName}`;
    } else {
      // Backward compatibility
      const studentNames = (students as unknown as string[]) || (family.student ? [family.student] : []);
      displayName = studentNames.length > 1
        ? `${studentNames[0]} (+${studentNames.length - 1} more)`
        : studentNames[0] || 'No students';
    }
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle>{displayName}</CardTitle>
            <CardDescription>
              {family.parents.father && typeof family.parents.father === 'object'
                ? `${family.parents.father.firstName} ${family.parents.father.lastName}`
                : family.parents.father
              }
              {family.parents.mother && (
                ` & ${typeof family.parents.mother === 'object'
                  ? `${family.parents.mother.firstName} ${family.parents.mother.lastName}`
                  : family.parents.mother
                }`
              )}
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            {levelLabels[family.level]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <h4 className="font-semibold text-sm">Children</h4>
            <div className="space-y-2">
            {isNewFormat ? (
              (students as StudentInfo[]).map((student, index) => (
                <div key={`${student.firstName}-${index}`} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <span className="font-medium">{student.firstName} {student.lastName}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {levelLabels[student.level]}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {student.subLevel}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-wrap gap-2">
                {((students as unknown as string[]) || [family.student].filter(Boolean)).map((student, index) => (
                  <Badge key={`${student}-${index}`} variant="secondary">
                    {student}
                  </Badge>
                ))}
              </div>
            )}
            {family.subjects && family.subjects.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {family.subjects.length} subject{family.subjects.length > 1 ? 's' : ''} assigned
              </Badge>
            )}
            </div>
        </div>
        {family.contact && (family.contact.phone || family.contact.email) && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Contact</h4>
            <div className="text-sm text-muted-foreground">
              {family.contact.phone && <div>📞 {family.contact.phone}</div>}
              {family.contact.email && <div>✉️ {family.contact.email}</div>}
            </div>
          </div>
        )}
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
  const [families, setFamilies] = useState<Family[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isAddFamilyModalOpen, setIsAddFamilyModalOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    level: 'all' as Level | 'all',
    searchTerm: '',
  });
  const { toast } = useToast();

  const handleAssignTeacherClick = (family: Family) => {
    setSelectedFamily(family);
    setIsTeacherModalOpen(true);
  };

  const handleAddFamilyClick = () => {
    setIsAddFamilyModalOpen(true);
  };

  const handleAddFamily = async (familyData: Partial<Family>) => {
    try {
      const newFamilyId = `family-${Date.now()}`;
      const completeFamilyData = {
        ...familyData,
        id: newFamilyId
      };

      const response = await fetch('/api/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ family: completeFamilyData }),
      });

      if (!response.ok) {
        throw new Error('Failed to add family');
      }

      // Add to local state
      setFamilies(prev => [completeFamilyData as Family, ...prev]);

      const firstStudent = familyData.students?.[0];
      const studentName = typeof firstStudent === 'object'
        ? `${firstStudent.firstName} ${firstStudent.lastName}`
        : firstStudent || 'New';

      toast({
        title: "Family Added",
        description: `${studentName}'s family has been successfully added.`
      });
    } catch (error) {
      console.error('Failed to add family:', error);
      toast({
        title: "Error",
        description: "Failed to add family. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const filteredFamilies = () => {
    return families.filter((family) => {
      // Filter by level
      const matchesLevel = filters.level === 'all' || family.level === filters.level;

      // Filter by search term (search in children names and parent names)
      const searchTerm = filters.searchTerm.toLowerCase();
      const students = family.students;
      const isNewFormat = students && students.length > 0 && typeof students[0] === 'object';

      let studentMatches = false;
      if (isNewFormat) {
        studentMatches = (students as StudentInfo[]).some(student =>
          `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm)
        );
      } else {
        studentMatches = ((students as unknown as string[]) || [family.student].filter(Boolean)).some(student =>
          student?.toLowerCase().includes(searchTerm)
        );
      }

      // Search in parent names (handle both old and new format)
      let parentMatches = false;
      if (family.parents.father) {
        if (typeof family.parents.father === 'object') {
          parentMatches = parentMatches ||
            `${family.parents.father.firstName} ${family.parents.father.lastName}`.toLowerCase().includes(searchTerm);
        } else {
          parentMatches = parentMatches || (family.parents.father as string).toLowerCase().includes(searchTerm);
        }
      }
      if (family.parents.mother) {
        if (typeof family.parents.mother === 'object') {
          parentMatches = parentMatches ||
            `${family.parents.mother.firstName} ${family.parents.mother.lastName}`.toLowerCase().includes(searchTerm);
        } else {
          parentMatches = parentMatches || (family.parents.mother as string).toLowerCase().includes(searchTerm);
        }
      }

      const matchesSearch = searchTerm === '' ||
        studentMatches ||
        parentMatches;

      return matchesLevel && matchesSearch;
    });
  };

  const handleSaveTeacher = async (familyId: string, teacherIds: string[]) => {
    try {
      const response = await fetch('/api/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family: {
            id: familyId,
            teacherIds: teacherIds
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update family');
      }

      // Update local state
      setFamilies(prev => prev.map(family =>
        family.id === familyId
          ? { ...family, teacherIds: teacherIds }
          : family
      ));
    } catch (error) {
      console.error('Failed to update family:', error);
      throw error;
    }
  };

  // Fetch families and teachers from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [familiesRes, teachersRes] = await Promise.all([
          fetch('/api/families', { cache: 'no-store' }),
          fetch('/api/teachers', { cache: 'no-store' })
        ]);

        if (familiesRes.ok) {
          const familiesData = await familiesRes.json();
          setFamilies(familiesData.families || []);
        }

        if (teachersRes.ok) {
          const teachersData = await teachersRes.json();
          setTeachers(teachersData.teachers || teachersData || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          title: "Error",
          description: "Failed to load families and teachers data.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Family Management</h1>
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading families...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Family Management</h1>
        <Button onClick={handleAddFamilyClick} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Family
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            {/* Search by child/parent name */}
            <div className="flex-1">
              <Label htmlFor="search">Search by Child or Parent Name</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search families..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Education Level Filter */}
            <div className="min-w-[200px]">
              <Label htmlFor="level">Education Level</Label>
              <Select
                value={filters.level}
                onValueChange={(value) => setFilters(prev => ({ ...prev, level: value as Level | 'all' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {levels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {levelLabels[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={() => setFilters({ level: 'all', searchTerm: '' })}
              className="shrink-0"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Family Cards */}
      {filteredFamilies().length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFamilies().map((family) => (
            <FamilyCard
              key={family.id}
              family={family}
              onAssignTeacher={handleAssignTeacherClick}
              allTeachers={teachers}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {families.length === 0
                ? "No families found. Add your first family to get started."
                : "No families match the current filters. Try adjusting your search or filter criteria."
              }
            </p>
          </CardContent>
        </Card>
      )}

      <AddFamilyModal
        isOpen={isAddFamilyModalOpen}
        setIsOpen={setIsAddFamilyModalOpen}
        onSave={handleAddFamily}
      />
      <TeacherAssignmentModal
        family={selectedFamily}
        isOpen={isTeacherModalOpen}
        setIsOpen={setIsTeacherModalOpen}
        teachers={teachers}
        onSave={handleSaveTeacher}
      />
    </div>
  );
}
