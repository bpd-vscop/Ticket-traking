"use client";

import { useState, useMemo } from "react";
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
import { Edit, Sparkles, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

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
    <div className="w-full aspect-video flex items-center justify-center">
      <div
        className="relative w-[300px] h-[180px] bg-white rounded-lg shadow-lg overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="h-1/4 bg-slate-800 text-white flex items-center justify-center text-xl font-mono tracking-widest">
          {level} - {currentYear}XXX
        </div>
        <div className="relative h-3/4 flex items-center justify-center">
          <Image src={logoSrc} alt="Logo" width={100} height={100} className="opacity-20" data-ai-hint="logo placeholder" />
          {isHovered && (
            <Button
              variant="outline"
              size="sm"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background/80"
            >
              <Edit className="mr-2 h-4 w-4" /> Edit Logo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const SheetPreview = ({ level, packSize, count }: { level: Level, packSize: PackSize, count: number }) => {
    const currentYear = new Date().getFullYear().toString().slice(-2);

    const ticketGrid = useMemo(() => {
        const gridClass = packSize === 36 ? "grid-cols-9" : "grid-cols-6";
        return (
            <div className={`grid ${gridClass} gap-1`}>
                {Array.from({ length: packSize }).map((_, i) => (
                    <div key={i} className="aspect-square bg-white border rounded-sm flex flex-col items-center justify-center text-[6px] p-0.5">
                        <div className="font-bold text-center">{level}-{currentYear}00{i+1}</div>
                        <Sparkles className="h-2 w-2 text-primary/50 mt-0.5"/>
                    </div>
                ))}
            </div>
        )

    }, [packSize, level, currentYear]);

    if(count === 0) return null;

    return (
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>Generated Sheets Preview ({count}x)</DialogTitle>
                <CardDescription>
                    Generated {count} sheet{count > 1 ? 's' : ''} for Level {level} with {packSize} tickets each.
                </CardDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto p-1 space-y-4">
               {Array.from({length: count}).map((_, i) => (
                    <div key={i} className="bg-muted p-4 rounded-lg">
                        <h3 className="font-semibold mb-2 text-center text-sm">Sheet {i+1} of {count}</h3>
                         <div className="aspect-[3/2] w-full bg-slate-200 p-2 rounded">
                            {ticketGrid}
                        </div>
                    </div>
               ))}
            </div>
        </DialogContent>
    )

}

export default function TicketsPage() {
  const [level, setLevel] = useState<Level>("P");
  const [packSize, setPackSize] = useState<PackSize>(24);
  const [generations, setGenerations] = useState(1);
  const [logo, setLogo] = useState("https://picsum.photos/200/200");
  const [generatedCount, setGeneratedCount] = useState(0);

  const { toast } = useToast();

  const handleGenerate = () => {
    setGeneratedCount(generations);
    toast({
      title: "Sheets Generated!",
      description: `${generations} sheet(s) for level ${level} with ${packSize} tickets have been created.`,
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card className="shadow-lg">
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
                        Se: "Spéciale",
                      }[l]
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pack-size">Pack Size</Label>
            <Select onValueChange={(v) => setPackSize(Number(v) as PackSize)} defaultValue={String(packSize)}>
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
            <Label htmlFor="generations">Number of Sheets</Label>
            <Input
              id="generations"
              type="number"
              min="1"
              value={generations}
              onChange={(e) => setGenerations(Math.max(1, Number(e.target.value)))}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
           <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={generatedCount === 0}>View Sheets</Button>
              </DialogTrigger>
              <SheetPreview level={level} packSize={packSize} count={generatedCount} />
            </Dialog>
          <Button onClick={handleGenerate} className="bg-accent hover:bg-accent/90">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate
          </Button>
        </CardFooter>
      </Card>

      <div className="flex flex-col gap-4">
        <Card className="flex-1 shadow-lg">
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
