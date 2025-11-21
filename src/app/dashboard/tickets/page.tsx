"use client";

import { useState, useRef, useEffect, Fragment } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Level, PackSize, levels, packSizes, Sheet } from "@/lib/types";
import { Edit, Sparkles } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { addSheet, getSheets } from "@/lib/data";

// ----------------------------- Code39 Barcode ------------------------------
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

function sanitizeCode39(text: string): string {
  const up = text.toUpperCase();
  return up.replace(/[^0-9A-Z\. \-\$\/\+%]/g, "-");
}

function Barcode({ value }: { value: string }) {
  const data = `*${sanitizeCode39(value)}*`;
  const narrow = 1;
  const wide = 3;
  const quiet = 10;

  // Build sequence of unit widths (bars/spaces alternate with BAR).
  // We prepend a quiet-zone SPACE by starting draw with drawBar=false.
  const seq: number[] = [quiet];
  let total = quiet;
  for (let i = 0; i < data.length; i++) {
    const patt = CODE39[data[i]];
    if (!patt) continue;
    const parts = patt.split(" ");
    for (let j = 0; j < parts.length; j++) {
      const w = parts[j] === "w" ? wide : narrow;
      seq.push(w);
      total += w;
    }
    // Inter-character narrow SPACE only between symbols (not after last)
    if (i < data.length - 1) {
      seq.push(narrow);
      total += narrow;
    }
  }
  seq.push(quiet);
  total += quiet;

  let x = 0;
  const bars: JSX.Element[] = [];
  // Start with SPACE so the leading quiet zone is blank
  let drawBar = false;
  for (let i = 0; i < seq.length; i++) {
    const w = seq[i];
    if (drawBar) {
      bars.push(<rect key={i} x={x} y={0} width={w} height={100} fill="#111827" />);
    }
    x += w;
    drawBar = !drawBar;
  }

  return (
    <svg viewBox={`0 0 ${total} 100`} preserveAspectRatio="none" className="w-full h-full">
      {bars}
    </svg>
  );
}

/* ------------------------------ Ticket Preview ----------------------------- */
const TicketPreviewWithEditor = ({
  level,
  logoSrc,
  onLogoChange,
}: {
  level: Level;
  logoSrc: string;
  onLogoChange: (src: string) => void;
}) => {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const fileRef = useRef<HTMLInputElement>(null);

  const triggerPick = () => fileRef.current?.click();
  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === "string") onLogoChange(ev.target.result);
    };
    reader.readAsDataURL(f);
    e.currentTarget.value = "";
  };

  // Reference text area above barcode
  const REFERENCE_AREA = "5%";
  const BARCODE_AREA = "15%";
  const LOGO_AREA = "80%";

  return (
    <div className="relative w-full aspect-square flex items-center justify-center p-4 bg-muted rounded-lg">
      <input ref={fileRef} type="file" accept="image/*" onChange={handlePick} className="hidden" />

      {/* Ticket card - now 4cm x 5cm ratio */}
      <div className="relative w-[200px] h-[250px] bg-card shadow-lg overflow-hidden">
        {/* Logo region */}
        <div className="absolute inset-x-0 top-0" style={{ height: LOGO_AREA }}>
          <div className="w-full h-full flex items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Reference text above barcode */}
        <div className="absolute left-2 right-0" style={{ top: LOGO_AREA, height: REFERENCE_AREA }}>
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-[0.6rem] font-mono font-light text-center tracking-[1.5em] px-1.5">
              {level}-{currentYear}XXX
            </div>
          </div>
        </div>

        {/* Barcode region at bottom */}
        <div className="absolute left-0 right-0 bottom-0" style={{ height: BARCODE_AREA }}>
          <div className="w-full h-full flex items-center justify-center px-1.5">
            <div className="w-full h-full">
              <Barcode value={`${level}-${currentYear}XXX`} />
            </div>
          </div>
        </div>
      </div>

      {/* Edit button moved to bottom-right (yellow-highlighted position) */}
      <Button
        size="sm"
        variant="secondary"
        className="absolute bottom-6 right-6 shadow"
        onClick={triggerPick}
      >
        <Edit className="h-4 w-4 mr-1" /> Edit
      </Button>
    </div>
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
          <RadioGroupItem key={opt} value={String(opt)} id={`gen-opt-${opt}`} className="sr-only" />
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
type CounterMap = Record<string, number>; // key: `${level}-${packSize}-${yy}` -> last used serial (1..9999)

export default function TicketsPage() {
  const [level, setLevel] = useState<Level>("P");
  const [packSize, setPackSize] = useState<PackSize>(24);
  const [generations, setGenerations] = useState(1);
  const [logo, setLogo] = useState("/logo.svg");

  // sequential counters per (level, year)
  const [counters, setCounters] = useState<CounterMap>({});

  const { toast } = useToast();

  useEffect(() => {
    // Load logo from local storage on mount
    const savedLogo = localStorage.getItem("ticketLogo");
    if (savedLogo) setLogo(savedLogo);

    // Also try to load from DB (if available)
    fetch('/api/logo', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (data?.logo && typeof data.logo === 'string') {
          setLogo(data.logo);
          // keep local copy for offline continuity
          localStorage.setItem('ticketLogo', data.logo);
        }
      })
      .catch(() => {
        // ignore network errors; localStorage fallback remains
      });

    // Sync counters from "inventory" - track per level only
    const sheets = getSheets();
    const latestCounters: CounterMap = {};
    sheets.forEach((sheet) => {
      const key = `${sheet.level}-${new Date(sheet.generationDate).getFullYear().toString().slice(-2)}`;
      const endNumber = sheet.endNumber;
      if (!latestCounters[key] || endNumber > latestCounters[key]) {
        latestCounters[key] = endNumber;
      }
    });
    setCounters(latestCounters);

    // Merge counters from DB (authoritative) if available
    fetch('/api/sheets', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        const dbCounters: CounterMap = { ...latestCounters };
        (data?.sheets || []).forEach((s: any) => {
          const dt = new Date(s.generationDate);
          const key = `${s.level}-${dt.getFullYear().toString().slice(-2)}`;
          const endNumber = Number(s.endNumber) || 0;
          if (!dbCounters[key] || endNumber > dbCounters[key]) {
            dbCounters[key] = endNumber;
          }
        });
        setCounters(dbCounters);
      })
      .catch(() => {});
  }, []);

  const handleLogoChange = (newLogo: string) => {
    setLogo(newLogo);
    localStorage.setItem("ticketLogo", newLogo);
    // Persist to DB as base64 (data URI)
    fetch('/api/logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUri: newLogo }),
    }).catch(() => {
      // ignore errors silently; localStorage still holds the value
    });
  };

  const handleGenerate = () => {
    const yy = new Date().getFullYear().toString().slice(-2);
    const key = `${level}-${yy}`; // Track per level only, not per pack size
    const lastUsed = counters[key] ?? 0; // 0 => next is 1

    // Prevent wrap within the same year for this level
    const totalTickets = generations * packSize;
    const projectedEnd = lastUsed + totalTickets;
    if (projectedEnd > 9999) {
      toast({
        title: 'Generation exceeds yearly limit',
        description: `Not enough remaining serials for ${level}-${yy}. Reduce quantity or wait for year change.`,
        variant: 'destructive',
      });
      return;
    }

    const createdSheets: Sheet[] = [];
    for (let s = 0; s < generations; s++) {
      const startNumber = lastUsed + 1 + s * packSize; // strictly increasing within the year
      const newSheet: Sheet = {
        id: `sheet-${Date.now()}-${s}`,
        level,
        packSize,
        startNumber,
        endNumber: startNumber + packSize - 1,
        isAssigned: false,
        downloads: 0,
        generationDate: new Date(),
      };
      createdSheets.push(newSheet);
      addSheet(newSheet); // keep local mock for immediate UX
    }

    // Persist to DB
    try {
      fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheets: createdSheets.map(s => ({
          ...s,
          generationDate: s.generationDate.toISOString(),
        })) }),
      }).catch(() => {});
    } catch {}

    const newLast = lastUsed + totalTickets;

    setCounters((prev) => ({ ...prev, [key]: newLast }));

    toast({
      title: "Sheets Generated",
      description: `${generations} sheet(s) for ${level} (${packSize} tickets each) generated. Serial numbers: ${lastUsed + 1} to ${newLast}.`,
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Generate New Tickets</CardTitle>
          <CardDescription>Fill in the details to generate new ticket sheets.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Level chips (dropdown removed) */}
          <div className="space-y-2">
            <Label>Level</Label>
            <div className="mt-2">
              <RadioGroup value={level} onValueChange={(v) => setLevel(v as Level)} className="flex flex-wrap gap-2">
                 {levels.map((l) => (
                   <Fragment key={`level-${l}`}>
                    <RadioGroupItem key={`lvl-item-${l}`} value={l} id={`lvl-${l}`} className="sr-only" />
                    <Label
                      key={`lvl-label-${l}`}
                      htmlFor={`lvl-${l}`}
                      className={cn(
                        "px-3 py-2 rounded-full border-2 cursor-pointer text-sm font-medium",
                        level === l
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-accent hover:text-accent-foreground border-input"
                      )}
                    >
                      {{ P: "Primaire", C: "Collège", L: "Lycée", S: "Supérieur", E: "Spéciale" }[l]}
                    </Label>
                   </Fragment>
                 ))}
              </RadioGroup>
            </div>
          </div>

          {/* Pack Size chips (dropdown removed) */}
          <div className="space-y-2">
            <Label>Pack Size</Label>
            <div className="mt-2">
              <RadioGroup
                value={String(packSize)}
                onValueChange={(v) => setPackSize(Number(v) as PackSize)}
                className="flex flex-wrap gap-2"
              >
                 {packSizes.map((s) => (
                   <Fragment key={`ps-${s}`}>
                    <RadioGroupItem key={`ps-item-${s}`} value={String(s)} id={`ps-${s}`} className="sr-only" />
                    <Label
                      key={`ps-label-${s}`}
                      htmlFor={`ps-${s}`}
                      className={cn(
                        "px-3 py-2 rounded-full border-2 cursor-pointer text-sm font-medium",
                        packSize === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-accent hover:text-accent-foreground border-input"
                      )}
                    >
                      {s} Tickets
                    </Label>
                   </Fragment>
                 ))}
              </RadioGroup>
            </div>
          </div>

          {/* Number of sheets */}
          <div className="space-y-2">
            <Label>Number of Sheets</Label>
            <GenerationsSelector value={generations} onChange={setGenerations} />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end">
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
            <TicketPreviewWithEditor level={level} logoSrc={logo} onLogoChange={handleLogoChange} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
