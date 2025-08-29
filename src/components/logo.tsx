import { Ticket } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-primary text-primary-foreground">
      <Ticket className="w-8 h-8" />
    </div>
  );
}
