"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Level, PackSize, levels, packSizes, Sheet } from "@/lib/types";
import { Edit, Sparkles, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CardDescription as DialogCardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { addSheet } from "@/lib/data";


/** Fixed grid: 8 cols × 5 rows = 40 slots of 5.5cm */
const COLS = 8;
const ROWS = 5;
const CAPACITY = COLS * ROWS; // 40

/* ------------------------------ Logo Uploader ----------------------------- */
const LogoUploader = ({
  logoSrc,
  onLogoChange,
}: {
  logoSrc: string;
  onLogoChange: (src: string) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === "string") {
          onLogoChange(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="relative w-full aspect-square flex items-center justify-center p-4 bg-muted rounded-lg cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleButtonClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      <div className="relative w-[150px] h-[150px]">
        <Image
          src={logoSrc}
          alt="Logo"
          layout="fill"
          objectFit="contain"
          className="opacity-80"
        />
        {(isHovered || logoSrc.includes('picsum')) && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
            <Upload className="h-6 w-6" />
            <span className="text-xs mt-1">Change Logo</span>
          </div>
        )}
      </div>
    </div>
  );
};


/* ------------------------------ Ticket Preview ----------------------------- */
const TicketPreview = ({
  level,
  logoSrc,
}: {
  level: Level;
  logoSrc: string;
}) => {
  const currentYear = new Date().getFullYear().toString().slice(-2);

  return (
    <div className="w-full aspect-square flex items-center justify-center p-4 bg-muted rounded-lg">
      <div className="w-[250px] h-[250px] bg-card shadow-lg overflow-hidden grid grid-cols-[4fr_1fr]">
        <div className="relative flex items-center justify-center p-4">
           <Image
              src={logoSrc}
              alt="Logo"
              width={150}
              height={150}
              objectFit="contain"
              className="opacity-80"
            />
        </div>
        <div className="bg-slate-800 text-white flex items-center justify-center font-mono p-1 overflow-hidden">
          <p className="text-5xl font-bold tracking-widest [writing-mode:vertical-rl] rotate-180">
            {level}-{currentYear}XXX
          </p>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------ Ticket Cell -------------------------------- */
function TicketCell({
  code,
  logoSrc,
  isBlank,
}: {
  code: string;
  logoSrc: string;
  isBlank: boolean;
}) {
  if (isBlank) {
    return <div className="ticket ticket--blank" aria-hidden="true" />;
  }
  return (
    <div className="ticket">
      <div className="ticket__left">
        <Image
          src={logoSrc}
          alt="Logo"
          width={80}
          height={80}
          objectFit="contain"
          className="opacity-60"
        />
      </div>
      <div className="ticket__right">
        {/* Keep same scale as the single TicketPreview */}
        <span className="ticket__code">{code}</span>
      </div>
    </div>
  );
}

/* ---------------------------- Sheet Preview -------------------------------- */
const SheetPreview = ({
  level,
  packSize,
  count,
  logoSrc,
  sheetStarts,
}: {
  level: Level;
  packSize: PackSize; // 24 or 38 (<=40)
  count: number;
  logoSrc: string;
  sheetStarts: number[]; // starting serial (1..9999) per sheet
}) => {
  const currentYear = new Date().getFullYear().toString().slice(-2);

  const renderSheet = (sheetIdx: number) => {
    const startSerial = sheetStarts[sheetIdx]; // 1..9999
    const codes: string[] = [];

    // Produce exactly packSize codes for this sheet, sequential with wrap at 9999
    for (let k = 0; k < packSize; k++) {
      const serial = ((startSerial - 1 + k) % 9999) + 1; // 1..9999
      const nn = String(serial).padStart(4, "0"); // 0001..9999
      codes.push(`${level}-${currentYear}${nn}`);
    }

    // Fill to 40 cells (blanks at the end)
    const cells = Array.from({ length: CAPACITY }).map((_, i) => {
      const code = i < packSize ? codes[i] : "";
      return (
        <TicketCell
          key={i}
          code={code}
          logoSrc={logoSrc}
          isBlank={i >= packSize}
        />
      );
    });

    // Grid sits above the watermark
    return (
      <div className="sheet-grid-wrap">
        <div className="grid-sheet relative z-10">{cells}</div>
      </div>
    );
  };

  const handlePrint = () => {
    window.print();
  }

  if (count === 0) return null;

  return (
    <DialogContent className="max-w-[95vw] p-4">
      <DialogHeader>
        <DialogTitle>Generated Sheets Preview ({count}x)</DialogTitle>
        <DialogCardDescription className="flex justify-between items-center">
         <span>
            Prints at 45×32&nbsp;cm, 8×5 slots (5.5&nbsp;cm). Pack {packSize}:{" "}
            {packSize === 24
              ? "rows 4 & 5 empty"
              : packSize === 38
              ? "last 2 cells empty"
              : `first ${packSize} filled, remaining blank`}
            .
         </span>
         <Button onClick={handlePrint} className="print:hidden">Print</Button>
        </DialogCardDescription>
      </DialogHeader>

      <div className="max-h-[70vh] overflow-auto p-4 space-y-6 bg-gray-200 print:bg-transparent print:p-0 print:overflow-visible print:space-y-0">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-muted p-4 rounded-lg print:p-0 print:rounded-none print:shadow-none print:break-after-page">
            <h3 className="font-semibold mb-2 text-center text-sm print:hidden">
              Sheet {i + 1} of {count}
            </h3>

            {/* On-screen scaled sheet; print rules switch it to exact cm size */}
            <div className="sheet-viewport mx-auto">
              {/* Watermark behind the grid */}
              <div className="sheet-inner paper-watermark sheet-inner--even">
                {renderSheet(i)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DialogContent>
  );
};

/* -------------------------- Generations Selector --------------------------- */
const GenerationsSelector = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) => {
  const options = [1, 2, 3, 4];
  const isCustom = !options.includes(value);

  return (
    <div className="space-y-4">
      <RadioGroup
        value={isCustom ? "custom" : String(value)}
        onValueChange={(val) => {
          if (val !== "custom") onChange(Number(val));
        }}
        className="flex items-center gap-2"
      >
        {options.map((opt) => (
          <RadioGroupItem
            key={opt}
            value={String(opt)}
            id={`gen-opt-${opt}`}
            className="sr-only"
          />
        ))}
        <RadioGroupItem value="custom" id="gen-opt-custom" className="sr-only" />

        {options.map((opt) => (
          <Label
            key={opt}
            htmlFor={`gen-opt-${opt}`}
            className={cn(
              "flex items-center justify-center h-10 w-10 rounded-full border-2 cursor-pointer transition-colors text-sm font-medium",
              value === opt && !isCustom
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent hover:text-accent-foreground border-input"
            )}
          >
            {opt}
          </Label>
        ))}

        <Input
          type="number"
          min="1"
          placeholder="Custom"
          value={isCustom ? value : ""}
          onChange={(e) => onChange(Math.max(1, Number(e.target.value)))}
          onFocus={() => {
            if (!isCustom) onChange(5);
          }}
          className={cn(
            "w-24 h-10 text-center rounded-full border-2",
            isCustom ? "border-primary ring-2 ring-primary/50" : "border-input"
          )}
        />
      </RadioGroup>
    </div>
  );
};

/* --------------------------------- Page ----------------------------------- */
type CounterMap = Record<string, number>; // key: `${level}-${yy}` -> last used serial (1..9999)

export default function TicketsPage() {
  const [level, setLevel] = useState<Level>("P");
  const [packSize, setPackSize] = useState<PackSize>(24);
  const [generations, setGenerations] = useState(1);
  const [logo, setLogo] = useState("/logo.svg");

  // sequential counters per (level, year)
  const [counters, setCounters] = useState<CounterMap>({});

  // start serial (1..9999) for each generated sheet
  const [sheetStarts, setSheetStarts] = useState<number[]>([]);
  const [generatedCount, setGeneratedCount] = useState(0);

  const { toast } = useToast();

  const yy = useMemo(
    () => new Date().getFullYear().toString().slice(-2),
    []
  );

  useEffect(() => {
    // Load logo from local storage on mount
    const savedLogo = localStorage.getItem('ticketLogo');
    if (savedLogo) {
      setLogo(savedLogo);
    }
  }, []);

  const handleLogoChange = (newLogo: string) => {
    setLogo(newLogo);
    localStorage.setItem('ticketLogo', newLogo);
  };

  const handleGenerate = () => {
    const key = `${level}-${yy}`;
    const lastUsed = counters[key] ?? 0; // 0 => next is 1
    const newSheetStarts: number[] = [];

    // For N sheets, allocate sequential ranges of packSize each
    for (let s = 0; s < generations; s++) {
      const startNumber = ((lastUsed + s * packSize) % 9999) + 1; // 1..9999
      newSheetStarts.push(startNumber);
       const newSheet: Sheet = {
        id: `sheet-${Date.now()}-${s}`,
        level,
        packSize,
        startNumber: startNumber,
        endNumber: startNumber + packSize - 1,
        isAssigned: false,
        downloads: 0,
        generationDate: new Date(),
      };
      addSheet(newSheet);
    }

    // Compute new last used after allocating all sheets
    const totalTickets = generations * packSize;
    const newLast = ((lastUsed + totalTickets -1) % 9999) + 1;

    setCounters((prev) => ({ ...prev, [key]: newLast }));
    setSheetStarts(newSheetStarts);
    setGeneratedCount(generations);

    toast({
      title: "Sheets Generated",
      description: `${generations} sheet(s) for ${level}-${yy} (${packSize} tickets each) have been added to the inventory.`,
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Generate New Tickets</CardTitle>
          <CardDescription>
            Fill in the details to generate new ticket sheets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="level">Level</Label>
            <Select onValueChange={(v) => setLevel(v as Level)} defaultValue={level}>
              <SelectTrigger id="level">
                <SelectValue placeholder="Select a level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((l) => (
                  <SelectItem key={l} value={l}>
                    {
                      {
                        P: "Primaire",
                        C: "Collège",
                        L: "Lycée",
                        S: "Supérieur",
                        E: "Spéciale",
                      }[l]
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pack-size">Pack Size</Label>
            <Select
              onValueChange={(v) => setPackSize(Number(v) as PackSize)}
              defaultValue={String(packSize)}
            >
              <SelectTrigger id="pack-size">
                <SelectValue placeholder="Select pack size" />
              </SelectTrigger>
              <SelectContent>
                {packSizes.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s} Tickets
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Number of Sheets</Label>
            <GenerationsSelector value={generations} onChange={setGenerations} />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={generatedCount === 0}>
                View Sheets
              </Button>
            </DialogTrigger>
            <SheetPreview
              level={level}
              packSize={packSize}
              count={generatedCount}
              logoSrc={logo}
              sheetStarts={sheetStarts}
            />
          </Dialog>
          <Button onClick={handleGenerate}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate
          </Button>
        </CardFooter>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <TicketPreview level={level} logoSrc={logo} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <LogoUploader logoSrc={logo} onLogoChange={handleLogoChange} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
