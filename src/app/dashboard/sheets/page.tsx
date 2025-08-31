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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText } from "lucide-react";
import { getSheets } from "@/lib/data";
import { Level, Sheet, levels } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const mockSheets = getSheets();

const generateSheetSvg = (sheet: Sheet, logoSrc: string): string => {
    /*
     * HOW TO EDIT THIS SVG LAYOUT
     * This function generates an SVG string for a sheet of tickets.
     * You can customize the layout by changing the variables below.
     *
     * -- UNITS --
     * All dimensions are in millimeters (mm), as if for a physical page.
     *
     * -- CUSTOMIZATION VARIABLES --
     * sheetWidth, sheetHeight: The size of the physical paper.
     * cols, rows: The number of columns and rows in the grid.
     * ticketWidth, ticketHeight: The size of a single ticket.
     *
     * -- TICKET LAYOUT --
     * The ticket is split into a left (logo) and right (text) part.
     * - The `image` tag controls the logo's position and size.
     * - The `text` tag controls the reference number. Its `transform` attribute
     *   positions and rotates it. `font-size`, `letter-spacing`, etc.,
     *   control its appearance.
     */
    const currentYear = new Date(sheet.generationDate).getFullYear().toString().slice(-2);
    const { packSize, level } = sheet;

    // --- Layout Customization ---
    const ticketWidth = 55; // 5.5cm in mm
    const ticketHeight = 55; // 5.5cm in mm
    const sheetWidth = 450;  // 45cm in mm
    const sheetHeight = 320; // 32cm in mm
    const cols = 8;
    // --- End Customization ---

    let ticketsSvg = '';
    for (let i = 0; i < packSize; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = col * ticketWidth;
        const y = row * ticketHeight;
        const serial = ((sheet.startNumber - 1 + i) % 9999) + 1;
        const nn = String(serial).padStart(4, "0");
        const code = `${level}-${currentYear}${nn}`;

        // Each ticket is a <g> group element, positioned with a transform.
        ticketsSvg += `
        <g transform="translate(${x}, ${y})">
            {/* Dashed border for cutting */}
            <rect width="${ticketWidth}" height="${ticketHeight}" fill="none" stroke="#ccc" stroke-dasharray="2" stroke-width="0.5"/>

            {/* Right-side dark bar */}
            <rect x="${ticketWidth * 0.8}" y="0" width="${ticketWidth * 0.2}" height="${ticketHeight}" fill="#1f2937" />

            {/* Logo: Positioned in the left 80% of the ticket. */}
            <image href="${logoSrc}" x="0" y="0" width="${ticketWidth * 0.8}" height="${ticketHeight}" preserveAspectRatio="xMidYMid meet" />

            {/* Vertically rotated reference text */}
            <text
                transform="translate(${ticketWidth * 0.9}, ${ticketHeight / 2}) rotate(90)"
                fill="white"
                font-family="monospace"
                font-size="8"
                font-weight="bold"
                text-anchor="middle"
                letter-spacing="1.5"
            >
                ${code}
            </text>
        </g>
        `;
    }

    return `
    <svg
        width="${sheetWidth}mm"
        height="${sheetHeight}mm"
        viewBox="0 0 ${sheetWidth} ${sheetHeight}"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
    >
        <rect width="100%" height="100%" fill="white" />
        ${ticketsSvg}
    </svg>
    `;
};


const SheetCard = ({
  sheet,
  isSelected,
  onSelect,
}: {
  sheet: Sheet;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
}) => {
  const [downloadCount, setDownloadCount] = useState(sheet.downloads);
  const currentYear = new Date().getFullYear().toString().slice(-2);

  const handleDownload = () => {
    const logoSrc = localStorage.getItem('ticketLogo') || '/logo.svg';
    const svgContent = generateSheetSvg(sheet, logoSrc);
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sheet-${sheet.level}-${sheet.startNumber}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadCount((prev) => prev + 1);
  };

  return (
    <Card className={`transition-all ${isSelected ? 'border-primary ring-2 ring-primary' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-mono">
              {sheet.level}-{currentYear}{String(sheet.startNumber).padStart(3, '0')} to {sheet.level}-{currentYear}{String(sheet.endNumber).padStart(3, '0')}
            </CardTitle>
            <CardDescription>{sheet.packSize} tickets</CardDescription>
          </div>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(sheet.id, !!checked)}
            className="mt-1"
          />
        </div>
      </CardHeader>
      <CardContent>
         <p className="text-sm text-muted-foreground">
            Generated {formatDistanceToNow(sheet.generationDate, { addSuffix: true })}
        </p>
      </CardContent>
      <CardFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={downloadCount > 0 ? "secondary" : "outline"} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download {downloadCount > 0 && `(${downloadCount})`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleDownload}>
              <FileText className="mr-2 h-4 w-4" /> SVG
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
};

const AssignmentModal = ({
  isOpen,
  setIsOpen,
  sheets,
  onAssign,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  sheets: Sheet[];
  onAssign: () => void;
}) => {
    const { toast } = useToast();
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Sheets Assigned",
            description: `${sheets.length} sheet(s) have been assigned to a new family.`
        });
        onAssign();
        setIsOpen(false);
    }
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[625px]">
        <form onSubmit={handleSubmit}>
            <DialogHeader>
            <DialogTitle>Assign Sheets to Family</DialogTitle>
            <DialogDescription>
                You are assigning {sheets.length} sheet(s). Fill in the family details below.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="parent1">Parent Name 1</Label>
                        <Input id="parent1" placeholder="e.g., John Doe" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="parent2">Parent Name 2</Label>
                        <Input id="parent2" placeholder="e.g., Jane Doe" />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="student">Student Name</Label>
                    <Input id="student" placeholder="e.g., Junior Doe" required />
                </div>
                 <div className="space-y-2">
                    <Label>Subjects & Weekly Hours</Label>
                    <div className="flex gap-2">
                        <Input placeholder="e.g., Math" className="w-2/3" required/>
                        <Input type="number" placeholder="Hours" className="w-1/3" required/>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="hourly-rate">Hourly Rate (€)</Label>
                        <Input id="hourly-rate" type="number" placeholder="40" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="reduction">Reduction (€)</Label>
                        <Input id="reduction" type="number" placeholder="0" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="total">Total (€)</Label>
                        <Input id="total" type="number" placeholder="Calculated..." readOnly />
                    </div>
                </div>
                <div>
                     <Label>Payment</Label>
                     <div className="grid grid-cols-3 gap-2 mt-2">
                        <Input type="number" placeholder="Cash" />
                        <Input type="number" placeholder="Cheque" />
                        <Input type="number" placeholder="Card" />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit">Assign</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function SheetsPage() {
  const [sheets, setSheets] = useState<Sheet[]>(getSheets().filter(s => !s.isAssigned));
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectSheet = (id: string, checked: boolean) => {
    setSelectedSheets((prev) =>
      checked ? [...prev, id] : prev.filter((sheetId) => sheetId !== id)
    );
  };
  
  const handleAssign = () => {
    setSheets(prev => prev.filter(s => !selectedSheets.includes(s.id)));
    setSelectedSheets([]);
  }

  const sheetsByLevel = (level: Level) =>
    sheets.filter((sheet) => sheet.level === level);

  return (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
             <h1 className="text-2xl font-bold">Sheet Inventory</h1>
            <Button 
                onClick={() => setIsModalOpen(true)}
                disabled={selectedSheets.length === 0}
            >
                Assign Selected ({selectedSheets.length})
            </Button>
        </div>
      <Tabs defaultValue="P">
        <TabsList>
          {levels.map((level) => (
            <TabsTrigger key={level} value={level}>
              {level}
            </TabsTrigger>
          ))}
        </TabsList>
        {levels.map((level) => (
          <TabsContent key={level} value={level}>
            {sheetsByLevel(level).length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sheetsByLevel(level).map((sheet) => (
                  <SheetCard
                    key={sheet.id}
                    sheet={sheet}
                    isSelected={selectedSheets.includes(sheet.id)}
                    onSelect={handleSelectSheet}
                  />
                ))}
              </div>
            ) : (
                <Card className="mt-4">
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">No unassigned sheets for this level.</p>
                    </CardContent>
                </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
      <AssignmentModal 
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        sheets={sheets.filter(s => selectedSheets.includes(s.id))}
        onAssign={handleAssign}
      />
    </div>
  );
}

    

    

