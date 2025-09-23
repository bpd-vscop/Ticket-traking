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
import { Family, Ticket, Sheet } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { BookUser, User, ArrowLeft, Search, QrCode, Grid3X3, Table as TableIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadTicketsForFamily, saveTicketValidation, generateTicketsForFamily, createTicketsForFamily } from "@/lib/tickets";
import { useToast } from "@/hooks/use-toast";

const mockFamilies = getFamilies();
const mockTeachers = getTeachers();

const PackValidationModal = ({
  family,
  isOpen,
  setIsOpen,
}: {
  family: Family | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [ticketStates, setTicketStates] = useState<{[key: string]: boolean}>({});
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const { toast } = useToast();

  // Load tickets from database when family changes
  useEffect(() => {
    if (!family || !isOpen) return;

    const loadTickets = async () => {
      setLoading(true);
      try {
        // First, load existing tickets from database
        const existingTickets = await loadTicketsForFamily(family.id);

        if (existingTickets.length > 0) {
          // Use existing tickets from database
          setTickets(existingTickets);
          const initialStates: {[key: string]: boolean} = {};
          existingTickets.forEach(ticket => {
            initialStates[ticket.id] = ticket.isUsed;
          });
          setTicketStates(initialStates);
        } else {
          // No tickets exist, need to generate them from sheets
          // Load sheets data
          const sheetsResponse = await fetch('/api/sheets', { cache: 'no-store' });
          if (sheetsResponse.ok) {
            const sheetsData = await sheetsResponse.json();
            const allSheets = sheetsData.sheets || [];
            setSheets(allSheets);

            // Generate tickets based on family's assigned sheets
            const generatedTickets = generateTicketsForFamily(family, allSheets);
            setTickets(generatedTickets);

            // Create tickets in database
            if (generatedTickets.length > 0) {
              await createTicketsForFamily(family.id, generatedTickets);
            }

            // Initialize states as unused
            const initialStates: {[key: string]: boolean} = {};
            generatedTickets.forEach(ticket => {
              initialStates[ticket.id] = false; // Default to unused
            });
            setTicketStates(initialStates);
          }
        }
      } catch (error) {
        console.error('Error loading tickets:', error);
        toast({
          title: "Error",
          description: "Failed to load tickets. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, [family?.id, isOpen, toast]);

  if (!family) return null;

  const usedTickets = Object.values(ticketStates).filter(Boolean).length;

  // Filter tickets based on search term
  const filteredTickets = tickets.filter(ticket =>
    ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.sheetId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle search validation (works for both QR code and manual search)
  const handleSearchValidation = () => {
    const searchValue = searchTerm || qrCode;
    if (!searchValue) return;

    const matchingTicket = tickets.find(ticket =>
      ticket.id === searchValue ||
      ticket.id.includes(searchValue) ||
      ticket.sheetId.toLowerCase().includes(searchValue.toLowerCase())
    );

    if (matchingTicket) {
      setTicketStates(prev => ({
        ...prev,
        [matchingTicket.id]: true
      }));
      // Clear both fields after validation
      setSearchTerm('');
      setQrCode('');
    }
  };

  // Handle QR code auto-validation (when Enter is pressed)
  const handleQrCodeEnter = () => {
    if (!qrCode) return;
    setSearchTerm(qrCode); // Move QR code to search field
    handleSearchValidation();
  };

  // Handle save changes
  const handleSave = async () => {
    if (!family) return;

    setLoading(true);
    try {
      // Save ticket validation states to database
      await saveTicketValidation(family.id, ticketStates, 'current-user'); // TODO: Get actual user

      toast({
        title: "Tickets Validated",
        description: `${Object.values(ticketStates).filter(Boolean).length} tickets have been validated and saved.`,
      });

      setIsOpen(false);
      // Reset form state
      setSearchTerm('');
      setQrCode('');
    } catch (error) {
      console.error('Error saving ticket validation:', error);
      toast({
        title: "Error",
        description: "Failed to save ticket validation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    // Reset ticket states to original values from database
    const originalStates: {[key: string]: boolean} = {};
    tickets.forEach(ticket => {
      originalStates[ticket.id] = ticket.isUsed;
    });
    setTicketStates(originalStates);

    // Reset form state
    setSearchTerm('');
    setQrCode('');
    setIsOpen(false);
  };

  // Handle ticket state change
  const handleTicketToggle = (ticketId: string, checked: boolean) => {
    setTicketStates(prev => ({
      ...prev,
      [ticketId]: checked
    }));
  };

  // Ticket Card Component
  const TicketCard = ({ ticket }: { ticket: Ticket }) => {
    const isUsed = ticketStates[ticket.id] || false;
    const isHighlighted = searchTerm && ticket.id.toLowerCase().includes(searchTerm.toLowerCase());

    return (
      <div
        className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
          isUsed
            ? 'bg-green-50 border-green-200'
            : 'bg-white border-gray-200'
        } ${
          isHighlighted
            ? 'ring-2 ring-blue-400 ring-opacity-75'
            : ''
        }`}
        onClick={() => handleTicketToggle(ticket.id, !isUsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-mono text-lg font-semibold">{ticket.id}</h3>
            <p className="text-sm text-muted-foreground">{ticket.sheetId}</p>
          </div>
          <div className="flex items-center">
            <Checkbox
              checked={isUsed}
              onChange={() => {}} // Handled by card click
              className="pointer-events-none"
            />
          </div>
        </div>
        <div className="mt-2">
          <Badge
            variant={isUsed ? "default" : "secondary"}
            className={isUsed ? "bg-green-600" : ""}
          >
            {isUsed ? 'Used' : 'Available'}
          </Badge>
        </div>
      </div>
    );
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
      <div className={`fixed top-20 right-4 bottom-6 bg-white shadow-2xl transform transition-transform duration-500 ease-in-out rounded-lg ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{
        zIndex: 49,
        width: '80vw',

      }}>
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
              <div>
                <h2 className="text-xl font-semibold">Validate Pack for {family.student}</h2>
                <p className="text-sm text-muted-foreground">
                  Mark the tickets that have been returned and used. ({usedTickets} / {tickets.length} used)
                </p>
              </div>
            </div>
            {/* View Toggle */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
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
                <TableIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search and QR Code Section */}
          <div className="p-6 border-b bg-gray-50">
            <div className="grid grid-cols-2 gap-4">
              {/* Search Bar with Validate Button */}
              <div className="space-y-2">
                <Label htmlFor="search">Search Tickets</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by ticket ID or sheet ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchValidation()}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={handleSearchValidation} disabled={!searchTerm && !qrCode}>
                    Validate
                  </Button>
                </div>
              </div>

              {/* QR Code Field (No validate button) */}
              <div className="space-y-2">
                <Label htmlFor="qr-code">QR Code Scanner</Label>
                <div className="relative">
                  <QrCode className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="qr-code"
                    placeholder="Scan or enter QR code..."
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleQrCodeEnter()}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Scan or type QR code, then press Enter or click Validate
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading tickets...</p>
                </div>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredTickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Ticket ID</TableHead>
                    <TableHead>Sheet ID</TableHead>
                    <TableHead className="text-right w-[80px]">Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">{ticket.id}</TableCell>
                      <TableCell>{ticket.sheetId}</TableCell>
                      <TableCell className="text-right">
                        <Checkbox
                          checked={ticketStates[ticket.id] || false}
                          onCheckedChange={(checked) => handleTicketToggle(ticket.id, checked as boolean)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!loading && filteredTickets.length === 0 && tickets.length > 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No tickets found matching your search.</p>
              </div>
            )}

            {!loading && tickets.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No tickets found for this family.</p>
              </div>
            )}
          </div>

          {/* Fixed Footer with Save/Cancel buttons */}
          <div className="border-t bg-white p-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {usedTickets} of {tickets.length} tickets validated
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
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
  const [families, setFamilies] = useState<Family[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load families from database
  useEffect(() => {
    const loadFamilies = async () => {
      try {
        const response = await fetch('/api/families', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          // Only show families that have assigned sheets
          const familiesWithSheets = (data.families || []).filter((family: Family) =>
            family.sheetIds && family.sheetIds.length > 0
          );
          setFamilies(familiesWithSheets);
        }
      } catch (error) {
        console.error('Failed to load families:', error);
        toast({
          title: "Error",
          description: "Failed to load families. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadFamilies();
  }, [toast]);

  const handleValidateClick = (family: Family) => {
    setSelectedFamily(family);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Assigned Packs</h1>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading assigned packs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Assigned Packs</h1>
      <p className="text-muted-foreground">
        Overview of all families with assigned sheets. Click to validate returned tickets.
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
            <p className="text-center text-muted-foreground">No packs have been assigned yet.</p>
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
