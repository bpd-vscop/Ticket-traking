"use client";
import { useState } from "react";
import jsPDF from "jspdf";
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
import { Download, FileText, FileType } from "lucide-react";
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

/** Helper: load /public/logo.svg and return as data-URI so it stays inside the downloaded SVG */
async function getPublicLogoDataUri(): Promise<string> {
  try {
    const res = await fetch("/logo.svg", { cache: "no-cache" });
    const svg = await res.text();
    // Encode safely for data URI
    const encoded = encodeURIComponent(svg)
      .replace(/'/g, "%27")
      .replace(/"/g, "%22");
    return `data:image/svg+xml;utf8,${encoded}`;
  } catch {
    // Fallback (note: external href may break when viewing the downloaded file offline)
    return "/logo.svg";
  }
}

const generateSheetSvg = (sheet: Sheet, ticketLogoSrc: string, watermarkHref: string): string => {
  const currentYear = new Date(sheet.generationDate).getFullYear().toString().slice(-2);
  const { packSize, level } = sheet;

  // --- Layout Customization ---
  const ticketWidth = 45; // 4.5cm
  const ticketHeight = 45; // 4.5cm
  const sheetWidth = 420; // A3 landscape width
  const sheetHeight = 297; // A3 landscape height
  const cols = 8; // Fixed 8 columns
  const rows = Math.ceil(packSize / cols);
  // --- End Customization ---

  const gridWidth = cols * ticketWidth;
  const gridHeight = rows * ticketHeight;

  // Center the grid on the sheet
  const marginLeft = (sheetWidth - gridWidth) / 2;
  const marginTop = (sheetHeight - gridHeight) / 2;


  let ticketsSvg = '';
  for (let i = 0; i < packSize; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = col * ticketWidth;
    const y = row * ticketHeight;
    const serial = ((sheet.startNumber - 1 + i) % 9999) + 1;
    const nn = String(serial).padStart(4, "0");
    const code = `${level}-${currentYear}${nn}`;

    const barX = ticketWidth * 0.8;
    const barW = ticketWidth * 0.2;
    const cx = barX + barW / 2;
    const cy = ticketHeight / 2;

    ticketsSvg += `
      <g transform="translate(${x}, ${y})">
        <rect width="${ticketWidth}" height="${ticketHeight}" fill="none" stroke="#ccc" stroke-dasharray="2" stroke-width="0.5"/>
        <rect x="${barX}" y="0" width="${barW}" height="${ticketHeight}" fill="#1f2937" />
        <image href="${ticketLogoSrc}" x="0" y="0" width="${ticketWidth * 0.8}" height="${ticketHeight}" preserveAspectRatio="xMidYMid meet" />
        <text
          x="${cx}"
          y="${cy}"
          transform="rotate(180 ${cx} ${cy})"
          fill="white"
          font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
          font-size="6"
          font-weight="bold"
          text-anchor="middle"
          dominant-baseline="central"
          letter-spacing="1"
          style="writing-mode: vertical-rl;"
        >
          ${code}
        </text>
      </g>
    `;
  }

  const watermarkTile = 75.5;
  const watermarkStepY = watermarkTile * 0.866;

  return `
    <svg
      width="${sheetWidth}mm"
      height="${sheetHeight}mm"
      viewBox="0 0 ${sheetWidth} ${sheetHeight}"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        <pattern id="watermark" width="${watermarkTile}" height="${watermarkStepY}" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
          <image href="${watermarkHref}" x="0" y="0" width="${watermarkTile / 2}" height="${watermarkTile / 2}" opacity="0.12" />
        </pattern>
        <pattern id="watermark-staggered" width="${watermarkTile}" height="${watermarkStepY}" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
          <image href="${watermarkHref}" x="${watermarkTile / 2}" y="${watermarkStepY / 2}" width="${watermarkTile / 2}" height="${watermarkTile / 2}" opacity="0.12" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="white" />
      <rect width="100%" height="100%" fill="url(#watermark)" />
      <rect width="100%" height="100%" fill="url(#watermark-staggered)" />
      <g transform="translate(${marginLeft}, ${marginTop})">
        ${ticketsSvg}
      </g>
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
  const currentYear = new Date(sheet.generationDate).getFullYear().toString().slice(-2);

  const handleDownloadSvg = async () => {
    // Ticket left-side logo can be user-chosen, but watermark must be the public /logo.svg
    const userLogoSrc = localStorage.getItem("ticketLogo") || "/logo.svg";
    const watermarkHref = await getPublicLogoDataUri();

    const svgContent = generateSheetSvg(sheet, userLogoSrc, watermarkHref);
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sheet-${sheet.level}-${sheet.startNumber}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadCount((prev) => prev + 1);
  };
  
  const handleDownloadPdf = async () => {
    const userLogoSrc = localStorage.getItem("ticketLogo") || "/logo.svg";
    const watermarkHref = await getPublicLogoDataUri();
    const svgContent = generateSheetSvg(sheet, userLogoSrc, watermarkHref);

    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a3",
    });

    const svgElement = document.createElement('div');
    svgElement.innerHTML = svgContent;
    
    // Temporarily append to body to ensure it's rendered for PDF generation
    document.body.appendChild(svgElement);

    // jsPDF can take an SVG string directly, but it may have trouble with external hrefs inside
    // It's more reliable to let the browser render it first.
    await doc.svg(svgElement.firstElementChild as SVGElement, {
        x: 0,
        y: 0,
        width: 420,
        height: 297
    });

    document.body.removeChild(svgElement);
    
    doc.save(`sheet-${sheet.level}-${sheet.startNumber}.pdf`);
    setDownloadCount((prev) => prev + 1);
  };


  return (
    <Card className={`transition-all ${isSelected ? 'border-primary ring-2 ring-primary' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-mono">
              {sheet.level}-{currentYear}{String(sheet.startNumber).padStart(4, '0')} to {sheet.level}-{currentYear}{String(sheet.endNumber).padStart(4, '0')}
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
            <DropdownMenuItem onClick={handleDownloadSvg}>
              <FileText className="mr-2 h-4 w-4" /> SVG
            </DropdownMenuItem>
             <DropdownMenuItem onClick={handleDownloadPdf}>
              <FileType className="mr-2 h-4 w-4" /> PDF
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
  };
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
                <Input placeholder="e.g., Math" className="w-2/3" required />
                <Input type="number" placeholder="Hours" className="w-1/3" required />
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
    const assignedSheetIds = new Set(selectedSheets);
    setSheets(prev => prev.filter(s => !assignedSheetIds.has(s.id)));
    setSelectedSheets([]);
  };

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
        sheets={getSheets().filter(s => selectedSheets.includes(s.id))}
        onAssign={handleAssign}
      />
    </div>
  );
}

    