import { Ticket } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground">
      <Ticket className="w-5 h-5" />
    </div>
  );
}
