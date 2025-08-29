"use client";

import { useState } from "react";
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
import { Level, PackSize, levels, packSizes } from "@/lib/types";
import { Edit, Sparkles } from "lucide-react";
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

const COLS = 8;
const ROWS = 5;
const CAPACITY = COLS * ROWS; // 40
const TICKET_SIZE_CM = 5.5; // used in print CSS via globals

const TicketPreview = ({
  level,
  logoSrc,
}: {
  level: Level;
  logoSrc: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const currentYear = new Date().getFullYear().toString().slice(-2);

  return (
    <div className="w-full aspect-square flex items-center justify-center p-4 bg-muted rounded-lg">
      <div
        className="relative w-[250px] h-[250px] bg-card shadow-lg overflow-hidden flex"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative flex-[3] flex items-center justify-center p-4">
          <Image
            src={logoSrc}
            alt="Logo"
            width={150}
            height={150}
            className="rounded-full opacity-80"
            data-ai-hint="logo placeholder"
          />
          {isHovered && (
            <Button
              variant="outline"
              size="sm"
              className="absolute bottom-6 right-6 bg-background/80"
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="flex-[1] bg-slate-800 text-white flex items-center justify-center font-mono p-2">
          <p className="text-5xl font-bold tracking-widest [writing-mode:vertical-rl] rotate-180">
            {level}-{currentYear}XXX
          </p>
        </div>
      </div>
    </div>
  );
};

function TicketCell({
  index,
  code,
  logoSrc,
  isBlank,
}: {
  index: number;
  code: string;
  logoSrc: string;
  isBlank: boolean;
}) {
  if (isBlank) {
    return <div className="ticket bg-muted/40" aria-hidden="true" />;
  }

  return (
    <div className="ticket">
      <div className="ticket__left">
        <Image
          src={logoSrc}
          alt="Logo"
          width={80}
          height={80}
          className="rounded-full opacity-60"
          data-ai-hint="logo placeholder"
        />
      </div>
      <div className="ticket__right p-0.5">
        <span className="ticket__code">{code}</span>
      </div>
    </div>
  );
}

const SheetPreview = ({
  level,
  packSize,
  count,
  logoSrc,
  startNumber: initialStartNumber,
}: {
  level: Level;
  packSize: PackSize; // expect 24 or 38, but any <= 40 works
  count: number;
  logoSrc: string;
  startNumber: number;
}) => {
  const currentYear = new Date().getFullYear().toString().slice(-2);

  const gridForSheet = (sheetIndex: number) => {
    const startNumber = initialStartNumber + sheetIndex * packSize;

    // We render full capacity (40). First `packSize` cells are tickets; the rest are blanks.
    // For 24: first 24 tickets occupy rows 1-3; rows 4-5 entirely blank (your requirement).
    // For 38: first 38 tickets filled; last 2 cells (positions 39 & 40) blank.
    return (
      <div className="grid-sheet">
        {Array.from({ length: CAPACITY }).map((_, i) => {
          const isBlank = i >= packSize;
          const serial = String(startNumber + i + 1).padStart(3, "0");
          const code = `${level}-${currentYear}${serial}`;
          return (
            <TicketCell
              key={i}
              index={i}
              code={code}
              logoSrc={logoSrc}
              isBlank={isBlank}
            />
          );
        })}
      </div>
    );
  };

  if (count === 0) return null;

  return (
    <DialogContent className="max-w-[95vw]">
      <DialogHeader>
        <DialogTitle>Generated Sheets Preview ({count}x)</DialogTitle>
        <DialogCardDescription>
          Each sheet prints at 45×32&nbsp;cm with 8×5 slots of 5.5&nbsp;cm. Pack {packSize}:{" "}
          {packSize === 24
            ? "rows 4 & 5 left empty"
            : packSize === 38
            ? "last 2 cells left empty"
            : `first ${packSize} filled, remaining blanks`}
          .
        </DialogCardDescription>
      </DialogHeader>

      {/* Scrollable area; the sheet scales to fit screen */}
      <div className="max-h-[70vh] overflow-auto p-1 space-y-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-center text-sm">
              Sheet {i + 1} of {count}
            </h3>

            {/* On-screen scaled sheet; print rules switch it to exact cm size */}
            <div className="sheet-viewport mx-auto">
              <div className="sheet-inner">{gridForSheet(i)}</div>
            </div>
          </div>
        ))}
      </div>
    </DialogContent>
  );
};

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

export default function TicketsPage() {
  const [level, setLevel] = useState<Level>("P");
  const [packSize, setPackSize] = useState<PackSize>(24);
  const [generations, setGenerations] = useState(1);
  const [logo, setLogo] = useState("https://picsum.photos/200/200");
  const [generatedCount, setGeneratedCount] = useState(0);
  const [startNumber, setStartNumber] = useState(0);

  const { toast } = useToast();

  const handleGenerate = () => {
    // In a real app, this might come from a database to ensure uniqueness
    const newStartNumber = Math.floor(Math.random() * 10000);
    setStartNumber(newStartNumber);
    setGeneratedCount(generations);
    toast({
      title: "Sheets Generated!",
      description: `${generations} sheet(s) for level ${level} with ${packSize} tickets have been created.`,
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
              startNumber={startNumber}
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
      </div>
    </div>
  );
}
