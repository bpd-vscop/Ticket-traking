"use client";
import { useEffect, useState } from "react";
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
import { Level, Sheet, levels, levelLabels, PackSize, packSizes } from "@/lib/types";
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


  // Code39 encoding (replicated from preview for identical look)
  const CODE39: Record<string, string> = {
    "0": "n n n w w n w n n",
    "1": "w n n w n n n n w",
    "2": "n n w w n n n n w",
    "3": "w n w w n n n n n",
    "4": "n n n w w n n n w",
    "5": "w n n w w n n n n",
    "6": "n n w w w n n n n",
    "7": "n n n w n n w n w",
    "8": "w n n w n n w n n",
    "9": "n n w w n n w n n",
    A: "w n n n n w n n w",
    B: "n n w n n w n n w",
    C: "w n w n n w n n n",
    D: "n n n n w w n n w",
    E: "w n n n w w n n n",
    F: "n n w n w w n n n",
    G: "n n n n n w w n w",
    H: "w n n n n w w n n",
    I: "n n w n n w w n n",
    J: "n n n n w w w n n",
    K: "w n n n n n n w w",
    L: "n n w n n n n w w",
    M: "w n w n n n n w n",
    N: "n n n n w n n w w",
    O: "w n n n w n n w n",
    P: "n n w n w n n w n",
    Q: "n n n n n n w w w",
    R: "w n n n n n w w n",
    S: "n n w n n n w w n",
    T: "n n n n w n w w n",
    U: "w w n n n n n n w",
    V: "n w w n n n n n w",
    W: "w w w n n n n n n",
    X: "n w n n w n n n w",
    Y: "w w n n w n n n n",
    Z: "n w w n w n n n n",
    "-": "n w n n n n w n w",
    ".": "w w n n n n w n n",
    " ": "n w w n n n w n n",
    "$": "n w n w n w n n n",
    "/": "n w n w n n n w n",
    "+": "n w n n n w n w n",
    "%": "n n n w n w n w n",
    "*": "n w n n w n w n n",
  };

  const code39BarsSvg = (value: string, x: number, y: number, width: number, height: number) => {
    const sanitize = (t: string) => t.toUpperCase().replace(/[^0-9A-Z\. \-\$\/\+%]/g, "-");
    const data = `*${sanitize(value)}*`;
    const narrow = 1;
    const wide = 3;
    const quiet = 10; // modules (quiet zone = 10X)

    // Build sequence of unit widths; begin with quiet as SPACE (handled in renderer)
    const seq: number[] = [quiet];
    let totalUnits = quiet;
    for (let i = 0; i < data.length; i++) {
      const patt = CODE39[data[i]];
      if (!patt) continue;
      const parts = patt.split(" ");
      for (let j = 0; j < parts.length; j++) {
        const w = parts[j] === "w" ? wide : narrow;
        seq.push(w);
        totalUnits += w;
      }
      // Inter-character narrow SPACE only between symbols (not after last)
      if (i < data.length - 1) {
        seq.push(narrow);
        totalUnits += narrow;
      }
    }
    seq.push(quiet);
    totalUnits += quiet;

    // Margins inside barcode box (small, to mimic preview)
    const margin = 0.5; // mm
    const bx = x + margin;
    const by = y + margin;
    const bw = Math.max(0, width - margin * 2);
    const bh = Math.max(0, height - margin * 2);
    const unitW = bw / totalUnits;

    let cx = bx;
    // Start with SPACE so the leading quiet zone is blank
    let drawBar = false;
    let svg = "";
    for (let i = 0; i < seq.length; i++) {
      const w = seq[i] * unitW;
      if (drawBar) {
        svg += `<rect x="${cx}" y="${by}" width="${w}" height="${bh}" fill="#111827" />`;
      }
      cx += w;
      drawBar = !drawBar;
    }
    return svg;
  };

  let ticketsSvg = '';
  for (let i = 0; i < packSize; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = col * ticketWidth;
    const y = row * ticketHeight;
    const serial = ((sheet.startNumber - 1 + i) % 9999) + 1;
    const nn = String(serial).padStart(4, "0");
    const code = `${level}-${currentYear}${nn}`;

    // Dimensions matching preview layout
    const rightBarX = ticketWidth * 0.8;
    const rightBarW = ticketWidth * 0.2;
    const leftW = ticketWidth * 0.8;
    const barcodeH = ticketHeight * 0.15; // 15% of ticket height
    const logoH = ticketHeight - barcodeH; // 85%

    const cx = rightBarX + rightBarW / 2;
    const cy = ticketHeight / 2;

    // Build barcode SVG for bottom of left area
    const barcodeSvg = code39BarsSvg(code, 0, ticketHeight - barcodeH, leftW, barcodeH);

    ticketsSvg += `
      <g transform="translate(${x}, ${y})">
        <!-- Solid white background to cover watermark pattern under the ticket -->
        <rect width="${ticketWidth}" height="${ticketHeight}" fill="white" />
        <!-- Right dark bar -->
        <rect x="${rightBarX}" y="0" width="${rightBarW}" height="${ticketHeight}" fill="#000000" />
        <!-- Logo area (left, top 85%) -->
        <image href="${ticketLogoSrc}" x="0" y="0" width="${leftW}" height="${logoH}" preserveAspectRatio="xMidYMid meet" />
        <!-- Barcode area (left, bottom 15%) -->
        ${barcodeSvg}
        <!-- Rotated code text in right bar -->
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

  // Single dashed grid overlay (avoids double-overlap borders)
  const stroke = '#cccccc';
  const strokeW = 0.5; // mm
  const dash = '2 2';  // mm on/off
  let gridSvg = '';
  for (let c = 0; c <= cols; c++) {
    const gx = c * ticketWidth;
    gridSvg += `<line x1="${gx}" y1="0" x2="${gx}" y2="${gridHeight}" stroke="${stroke}" stroke-width="${strokeW}" stroke-dasharray="${dash}" stroke-linecap="butt" shape-rendering="geometricPrecision" />`;
  }
  for (let r = 0; r <= rows; r++) {
    const gy = r * ticketHeight;
    gridSvg += `<line x1="0" y1="${gy}" x2="${gridWidth}" y2="${gy}" stroke="${stroke}" stroke-width="${strokeW}" stroke-dasharray="${dash}" stroke-linecap="butt" shape-rendering="geometricPrecision" />`;
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
        <!-- Draw grid on top so dashes are even and single-layer -->
        ${gridSvg}
      </g>
    </svg>
  `;
};


import { useSession } from "next-auth/react";
const SheetCard = ({
  sheet,
  isSelected,
  onSelect,
  canDownload,
}: {
  sheet: Sheet;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  canDownload: boolean;
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
    const newCount = downloadCount + 1;
    setDownloadCount(newCount);
    try {
      fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheet: { id: sheet.id, downloads: newCount } }),
      }).catch(() => {});
    } catch {}
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

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // For better quality, render at a higher resolution. A scale of 4 should be sharp.
    const scale = 12;
    const canvasWidth = 420 * scale;
    const canvasHeight = 297 * scale;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const img = new Image();
    const svgBlob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx?.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      URL.revokeObjectURL(url);
      const imgData = canvas.toDataURL("image/png");
      doc.addImage(imgData, "PNG", 0, 0, 420, 297);
      doc.save(`sheet-${sheet.level}-${sheet.startNumber}.pdf`);
      const newCount = downloadCount + 1;
      setDownloadCount(newCount);
      try {
        fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheet: { id: sheet.id, downloads: newCount } }),
        }).catch(() => {});
      } catch {}
    };

    img.src = url;
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
            <Button 
              variant={downloadCount > 0 ? "secondary" : "outline"} 
              className="w-full"
              disabled={!canDownload}
              title={!canDownload ? "You do not have permission to download" : "Download options"}
            >
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
            {/* Note: EPS generation is not feasible in a browser environment.
                It requires server-side tools like ImageMagick or Inkscape.
                A user would typically open the SVG in a vector editor to export as EPS.
            */}
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
  const { data: session } = useSession();
  const [sheets, setSheets] = useState<Sheet[]>(getSheets().filter(s => !s.isAssigned));
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPackSize, setSelectedPackSize] = useState<PackSize | 'all'>('all');

  const canDownload = session?.user?.role === 'admin';

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

  const sheetsByLevel = (level: Level) => {
    const levelSheets = sheets.filter((sheet) => sheet.level === level);
    if (selectedPackSize === 'all') {
      return levelSheets;
    }
    return levelSheets.filter((sheet) => sheet.packSize === selectedPackSize);
  };

  // Hydrate from DB if available
  useEffect(() => {
    fetch('/api/sheets', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        const dbSheets: Sheet[] = (data?.sheets || []).map((s: any) => ({
          ...s,
          generationDate: new Date(s.generationDate),
        }));
        // only unassigned in inventory
        setSheets(dbSheets.filter(s => !s.isAssigned));
      })
      .catch(() => {
        // ignore; fallback remains mock
      });
  }, []);

  const handleDownloadSelected = async () => {
    // helper to download a single sheet as PDF
    const userLogoSrc = localStorage.getItem("ticketLogo") || "/logo.svg";
    const watermarkHref = await getPublicLogoDataUri();

    for (const id of selectedSheets) {
      const sheet = sheets.find(s => s.id === id);
      if (!sheet) continue;
      const svgContent = generateSheetSvg(sheet, userLogoSrc, watermarkHref);

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const scale = 12;
      const canvasWidth = 420 * scale;
      const canvasHeight = 297 * scale;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const img = new Image();
      const svgBlob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      await new Promise<void>((resolve) => {
        img.onload = () => {
          ctx?.drawImage(img, 0, 0, canvasWidth, canvasHeight);
          URL.revokeObjectURL(url);
          const imgData = canvas.toDataURL("image/png");
          doc.addImage(imgData, "PNG", 0, 0, 420, 297);
          doc.save(`sheet-${sheet.level}-${sheet.startNumber}.pdf`);
          resolve();
        };
        img.src = url;
      });

      // Persist download count increment
      const current = sheet.downloads || 0;
      const next = current + 1;
      try {
        fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheet: { id: sheet.id, downloads: next } }),
        }).catch(() => {});
      } catch {}

      // reflect locally
      setSheets(prev => prev.map(s => s.id === sheet.id ? { ...s, downloads: next } : s));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sheet Inventory</h1>
        <div className="flex items-center gap-2">
          {canDownload && selectedSheets.length > 1 && (
            <Button variant="secondary" onClick={handleDownloadSelected}>
              Download Selected (PDF)
            </Button>
          )}
          <Button
            onClick={() => setIsModalOpen(true)}
            disabled={selectedSheets.length === 0}
          >
            Assign Selected ({selectedSheets.length})
          </Button>
        </div>
      </div>
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
      <Tabs defaultValue="P">
        <TabsList className="w-full">
          {levels.map((level) => (
            <TabsTrigger key={level} value={level} className="flex-1">
              {levelLabels[level]}
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
                    canDownload={canDownload}
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
