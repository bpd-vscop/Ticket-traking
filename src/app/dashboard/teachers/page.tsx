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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Teacher, Level, TeacherSubjectAssignment, levelLabels, levels, subjectsByLevel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookUser, User, Users, Plus, X, Edit, Search, Filter, ArrowLeft, Phone, Mail, MapPin, Grid3X3, LayoutGrid, Table } from "lucide-react";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const AddTeacherModal = ({
  isOpen,
  setIsOpen,
  onSave,
  teacher = null,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (teacherData: Partial<Teacher>) => void;
  teacher?: Teacher | null;
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    specializations: [] as TeacherSubjectAssignment[],
    notes: '',
    newSubject: '' // For adding custom subjects
  });
  const { toast } = useToast();
  const isEditMode = !!teacher;

  // Initialize form data when teacher prop changes
  useEffect(() => {
    if (teacher) {
      setFormData({
        firstName: teacher.firstName || (teacher.name ? teacher.name.split(' ')[0] : ''),
        lastName: teacher.lastName || (teacher.name ? teacher.name.split(' ').slice(1).join(' ') : ''),
        email: teacher.email || '',
        phone: teacher.phone || '',
        address: teacher.address || '',
        specializations: teacher.specializations || [],
        notes: teacher.notes || '',
        newSubject: ''
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        specializations: [],
        notes: '',
        newSubject: ''
      });
    }
  }, [teacher]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: "Error",
        description: "Teacher first and last name are required.",
        variant: "destructive"
      });
      return;
    }

    if (formData.specializations.length === 0) {
      toast({
        title: "Error",
        description: "At least one specialization is required.",
        variant: "destructive"
      });
      return;
    }

    // Use specializations as-is (subjects are already added to the stack)
    const finalSpecializations = formData.specializations;

    const teacherData: Partial<Teacher> = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      address: formData.address.trim() || undefined,
      specializations: finalSpecializations,
      notes: formData.notes.trim() || undefined,
    };

    try {
      await onSave(teacherData);
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        specializations: [],
        notes: '',
        newSubject: ''
      });
      setIsOpen(false);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const addSpecialization = () => {
    setFormData(prev => ({
      ...prev,
      specializations: [...prev.specializations, {
        level: getNextAvailableLevel(),
        subjects: []
      }]
    }));
  };

  // Check if we can add a new level (all existing levels must have at least one subject and there are available levels)
  const canAddNewLevel = () => {
    if (formData.specializations.length === 0) return true;

    // Check if all existing levels have subjects
    const allLevelsHaveSubjects = formData.specializations.every(spec => spec.subjects.length > 0);

    // Check if there are still available levels to add
    const usedLevels = formData.specializations.map(spec => spec.level);
    const hasAvailableLevels = usedLevels.length < levels.length;

    return allLevelsHaveSubjects && hasAvailableLevels;
  };

  // Get available levels for a specific specialization (excluding already selected levels)
  const getAvailableLevels = (currentIndex: number) => {
    const usedLevels = formData.specializations
      .map((spec, index) => index !== currentIndex ? spec.level : null)
      .filter(level => level !== null);

    return levels.filter(level => !usedLevels.includes(level));
  };

  // Get the next available level for new specializations
  const getNextAvailableLevel = (): Level => {
    const usedLevels = formData.specializations.map(spec => spec.level);
    const availableLevels = levels.filter(level => !usedLevels.includes(level));
    return availableLevels[0] || 'P'; // Default to 'P' if all are used (shouldn't happen)
  };

  const removeSpecialization = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index)
    }));
  };

  const updateSpecializationLevel = (index: number, level: Level) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.map((spec, i) =>
        i === index ? { ...spec, level } : spec
      )
    }));
  };


  const addSubjectToSpecialization = (index: number, subject: string) => {
    if (!subject.trim()) return;

    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.map((spec, i) => {
        if (i === index) {
          // Check if subject already exists
          if (spec.subjects.includes(subject.trim())) {
            return spec;
          }
          return { ...spec, subjects: [...spec.subjects, subject.trim()] };
        }
        return spec;
      }),
      newSubject: '' // Clear the input
    }));
  };

  const removeSubjectFromSpecialization = (index: number, subject: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.map((spec, i) => {
        if (i === index) {
          return { ...spec, subjects: spec.subjects.filter(s => s !== subject) };
        }
        return spec;
      })
    }));
  };

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
      <div className={`fixed top-16 right-4 bottom-4 w-[700px] bg-white shadow-2xl transform transition-transform duration-500 ease-in-out rounded-lg ${
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
              <h2 className="text-xl font-semibold">
                {isEditMode ? 'Edit Teacher' : 'Add New Teacher'}
              </h2>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 pb-20">
            <form id="teacher-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold">Basic Information *</Label>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Ahmed"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Ben Ali"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="teacher@email.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+212 6 12 34 56 78"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Full address"
                    />
                  </div>
                </div>
              </div>

              {/* Specializations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-semibold">Specializations *</Label>
                    <span className="text-red-500 text-sm">(At least one required)</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSpecialization}
                      disabled={!canAddNewLevel()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Level
                    </Button>
                    {!canAddNewLevel() && formData.specializations.length > 0 && (
                      <span className="text-xs text-muted-foreground mt-1">
                        {formData.specializations.length >= levels.length
                          ? 'All education levels have been added'
                          : 'Add subjects to existing levels first'
                        }
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {formData.specializations.map((spec, index) => (
                    <div key={index} className="space-y-3 p-4 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium">Level {index + 1}</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSpecialization(index)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`level-${index}`}>Education Level *</Label>
                          <Select
                            value={spec.level}
                            onValueChange={(value) => updateSpecializationLevel(index, value as Level)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableLevels(index).map(level => (
                                <SelectItem key={level} value={level}>
                                  {levelLabels[level]}
                                </SelectItem>
                              ))}
                              {/* Always include the current level even if it would normally be filtered out */}
                              {!getAvailableLevels(index).includes(spec.level) && (
                                <SelectItem key={spec.level} value={spec.level}>
                                  {levelLabels[spec.level]}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Subjects *</Label>
                            <Badge variant="outline" className="text-xs">
                              {spec.subjects.length} selected
                            </Badge>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-4">
                            {/* Selected Subjects */}
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Selected Subjects</Label>
                              {spec.subjects.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {spec.subjects.map((subject, subIndex) => (
                                    <div
                                      key={subIndex}
                                      className="group flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg border border-primary/20 hover:bg-primary/15 transition-colors"
                                    >
                                      <span className="text-sm font-medium">{subject}</span>
                                      <button
                                        type="button"
                                        onClick={() => removeSubjectFromSpecialization(index, subject)}
                                        className="opacity-60 hover:opacity-100 hover:text-red-600 transition-all"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                                  <BookUser className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                                </div>
                              )}
                            </div>

                            {/* Available Subjects */}
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Available Subjects</Label>
                              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 bg-muted/30 rounded-lg border">
                                {subjectsByLevel[spec.level]
                                  .filter(subject => !spec.subjects.includes(subject))
                                  .map(subject => (
                                    <button
                                      key={subject}
                                      type="button"
                                      onClick={() => addSubjectToSpecialization(index, subject)}
                                      className="group flex items-center gap-2 p-2 text-left hover:bg-white hover:shadow-sm rounded-md border border-transparent hover:border-border transition-all text-sm"
                                    >
                                      <div className="flex-shrink-0 w-5 h-5 rounded border-2 border-primary/30 group-hover:border-primary group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                        <Plus className="h-3 w-3 text-primary/60 group-hover:text-primary" />
                                      </div>
                                      <span className="group-hover:text-primary transition-colors">{subject}</span>
                                    </button>
                                  ))}
                                {subjectsByLevel[spec.level].filter(subject => !spec.subjects.includes(subject)).length === 0 && (
                                  <div className="col-span-full text-center py-4">
                                    <p className="text-sm text-muted-foreground">All subjects have been added</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Custom Subject */}
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Add Custom Subject</Label>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <Input
                                    value={formData.newSubject}
                                    onChange={(e) => setFormData(prev => ({ ...prev, newSubject: e.target.value }))}
                                    placeholder="Enter custom subject name..."
                                    className="pr-10"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addSubjectToSpecialization(index, formData.newSubject);
                                      }
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => addSubjectToSpecialization(index, formData.newSubject)}
                                    disabled={!formData.newSubject.trim()}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.specializations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookUser className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No specializations added yet.</p>
                      <p className="text-xs">Click "Add Level" to get started.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Additional Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes about the teacher..."
                  rows={3}
                />
              </div>
            </form>
          </div>

          {/* Fixed Footer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-6 rounded-b-lg">
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="teacher-form">
                {isEditMode ? 'Update Teacher' : 'Add Teacher'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const CompactTeacherCard = ({
  teacher,
  onEdit,
  onDelete,
}: {
  teacher: Teacher;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacherId: string) => void;
}) => {
  return (
    <Card className="h-auto">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-sm flex items-center gap-1">
              <User className="h-4 w-4" />
              {teacher.firstName && teacher.lastName ? `${teacher.firstName} ${teacher.lastName}` : teacher.name || 'Unnamed Teacher'}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {teacher.email && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              {teacher.email}
            </div>
          )}
          <div className="text-xs">
            <span className="text-muted-foreground">Specializations: </span>
            {teacher.specializations?.length > 0 ? (
              <span>{teacher.specializations.length}</span>
            ) : (
              <span className="text-muted-foreground">None</span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(teacher)}
          className="flex-1 text-xs"
        >
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(teacher.id)}
          className="flex-1 text-xs"
        >
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

const TeachersTableView = ({
  teachers,
  onEdit,
  onDelete,
}: {
  teachers: Teacher[];
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacherId: string) => void;
}) => {
  return (
    <Card>
      <CardContent className="p-0">
        <TableComponent>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Specializations</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {teacher.firstName && teacher.lastName ? `${teacher.firstName} ${teacher.lastName}` : teacher.name || 'Unnamed Teacher'}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {teacher.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{teacher.email}</div>}
                  {teacher.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{teacher.phone}</div>}
                  {teacher.address && <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{teacher.address}</div>}
                  {!teacher.email && !teacher.phone && !teacher.address && '-'}
                </TableCell>
                <TableCell className="text-sm">
                  {teacher.specializations?.length > 0 ? (
                    <div className="space-y-1">
                      {teacher.specializations.map((spec, index) => (
                        <div key={index} className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs">
                            {levelLabels[spec.level]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            ({spec.subjects.length} subjects)
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell className="text-sm max-w-32 truncate">
                  {teacher.notes || '-'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(teacher)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(teacher.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableComponent>
      </CardContent>
    </Card>
  );
};

const TeacherCard = ({
  teacher,
  onEdit,
  onDelete,
}: {
  teacher: Teacher;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacherId: string) => void;
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {teacher.firstName && teacher.lastName ? `${teacher.firstName} ${teacher.lastName}` : teacher.name || 'Unnamed Teacher'}
            </CardTitle>
            <CardDescription className="space-y-1 mt-2">
              {teacher.email && (
                <div className="flex items-center gap-1 text-xs">
                  <Mail className="h-3 w-3" />
                  {teacher.email}
                </div>
              )}
              {teacher.phone && (
                <div className="flex items-center gap-1 text-xs">
                  <Phone className="h-3 w-3" />
                  {teacher.phone}
                </div>
              )}
              {teacher.address && (
                <div className="flex items-center gap-1 text-xs">
                  <MapPin className="h-3 w-3" />
                  {teacher.address}
                </div>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Specializations</h4>
          <div className="space-y-3">
            {teacher.specializations?.map((spec, index) => (
              <div key={index} className="space-y-2">
                <Badge variant="outline" className="text-xs">
                  {levelLabels[spec.level]}
                </Badge>
                <div className="flex flex-wrap gap-1">
                  {spec.subjects.map((subject, subIndex) => (
                    <Badge key={subIndex} variant="secondary" className="text-xs">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
            )) || (
              <p className="text-sm text-muted-foreground">No specializations defined</p>
            )}
          </div>
        </div>

        {teacher.notes && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Notes</h4>
            <p className="text-sm text-muted-foreground">{teacher.notes}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(teacher)}
          className="flex-1"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(teacher.id)}
          className="flex-1"
        >
          <X className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

type ViewMode = 'cards' | 'compact' | 'table';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [filters, setFilters] = useState({
    level: 'all' as Level | 'all',
    searchTerm: '',
  });
  const { toast } = useToast();

  const handleAddTeacherClick = () => {
    setEditingTeacher(null);
    setIsAddTeacherModalOpen(true);
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsAddTeacherModalOpen(true);
  };

  const handleAddTeacher = async (teacherData: Partial<Teacher>) => {
    try {
      const method = editingTeacher ? 'PUT' : 'POST';
      const url = editingTeacher ? `/api/teachers/${editingTeacher.id}` : '/api/teachers';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherData),
      });

      if (!response.ok) {
        throw new Error('Failed to save teacher');
      }

      const savedTeacher = await response.json();

      if (editingTeacher) {
        setTeachers(prev => prev.map(t => t.id === editingTeacher.id ? savedTeacher : t));
        toast({
          title: "Teacher Updated",
          description: `${teacherData.firstName} ${teacherData.lastName} has been successfully updated.`
        });
      } else {
        setTeachers(prev => [savedTeacher, ...prev]);
        toast({
          title: "Teacher Added",
          description: `${teacherData.firstName} ${teacherData.lastName} has been successfully added.`
        });
      }
    } catch (error) {
      console.error('Failed to save teacher:', error);
      toast({
        title: "Error",
        description: "Failed to save teacher. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;

    try {
      const response = await fetch(`/api/teachers/${teacherId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete teacher');
      }

      setTeachers(prev => prev.filter(t => t.id !== teacherId));
      toast({
        title: "Teacher Deleted",
        description: "Teacher has been successfully deleted."
      });
    } catch (error) {
      console.error('Failed to delete teacher:', error);
      toast({
        title: "Error",
        description: "Failed to delete teacher. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredTeachers = () => {
    return teachers.filter((teacher) => {
      // Filter by level
      const matchesLevel = filters.level === 'all' ||
        teacher.specializations?.some(spec => spec.level === filters.level);

      // Filter by search term
      const searchTerm = filters.searchTerm.toLowerCase();
      const teacherName = teacher.firstName && teacher.lastName
        ? `${teacher.firstName} ${teacher.lastName}`
        : teacher.name || '';
      const matchesSearch = searchTerm === '' ||
        teacherName.toLowerCase().includes(searchTerm) ||
        teacher.email?.toLowerCase().includes(searchTerm) ||
        teacher.specializations?.some(spec =>
          spec.subjects.some(subject => subject.toLowerCase().includes(searchTerm))
        );

      return matchesLevel && matchesSearch;
    });
  };

  const renderTeachersView = () => {
    const filteredTeachersList = filteredTeachers();

    if (filteredTeachersList.length === 0) {
      return (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {teachers.length === 0
                ? "No teachers found. Add your first teacher to get started."
                : "No teachers match the current filters. Try adjusting your search or filter criteria."
              }
            </p>
          </CardContent>
        </Card>
      );
    }

    if (viewMode === 'table') {
      return (
        <TeachersTableView
          teachers={filteredTeachersList}
          onEdit={handleEditTeacher}
          onDelete={handleDeleteTeacher}
        />
      );
    }

    const gridClass = viewMode === 'compact'
      ? 'grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3'
      : 'grid md:grid-cols-2 lg:grid-cols-3 gap-4';

    const CardComponent = viewMode === 'compact' ? CompactTeacherCard : TeacherCard;

    return (
      <div className={gridClass}>
        {filteredTeachersList.map((teacher) => (
          <CardComponent
            key={teacher.id}
            teacher={teacher}
            onEdit={handleEditTeacher}
            onDelete={handleDeleteTeacher}
          />
        ))}
      </div>
    );
  };

  // Fetch teachers from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/teachers', { cache: 'no-store' });

        if (response.ok) {
          const teachersData = await response.json();
          setTeachers(teachersData || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          title: "Error",
          description: "Failed to load teachers data.",
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
        <h1 className="text-2xl font-bold">Teacher Management</h1>
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading teachers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Teacher Management</h1>
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="h-8 w-8 p-0"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'compact' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('compact')}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 w-8 p-0"
            >
              <Table className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={handleAddTeacherClick} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Teacher
          </Button>
        </div>
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
            {/* Search by name/email */}
            <div className="flex-1">
              <Label htmlFor="search">Search by Name, Email or Subject</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search teachers..."
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

      {/* Teacher Views */}
      {renderTeachersView()}

      <AddTeacherModal
        isOpen={isAddTeacherModalOpen}
        setIsOpen={setIsAddTeacherModalOpen}
        onSave={handleAddTeacher}
        teacher={editingTeacher}
      />
    </div>
  );
}