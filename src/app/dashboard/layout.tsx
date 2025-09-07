"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  LogOut,
  PackageCheck,
  Shield,
  Ticket,
  Users,
  Loader2,
  Settings,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { href: "/dashboard/tickets", icon: Ticket, label: "Generate Tickets", adminOnly: true },
  { href: "/dashboard/sheets", icon: LayoutGrid, label: "Sheets" },
  { href: "/dashboard/families", icon: Users, label: "Families" },
  { href: "/dashboard/packs", icon: PackageCheck, label: "Packs" },
  { href: "/dashboard/users", icon: Shield, label: "Users", adminOnly: true },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;

  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || (item.adminOnly && user?.role === 'admin')
  );

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
     // The middleware should handle redirection, but this is a fallback.
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-muted/40">
      <header className="sticky top-0 z-50">
        <div className="container mx-auto px-4">
            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border bg-card text-card-foreground shadow-lg h-16 px-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="flex items-center gap-3">
                         <Logo />
                         <span className="text-lg font-semibold tracking-tight">TicketWise</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-2">
                        {filteredNavItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                              pathname === item.href
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:bg-muted/50"
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        ))}
                    </nav>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://api.dicebear.com/8.x/bottts/svg?seed=${user?.email}`} alt={user?.name ?? 'User'} />
                        <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="end" className="w-56">
                    <DropdownMenuLabel>
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
      </header>
       <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="p-4 sm:p-6 lg:p-8 bg-card rounded-xl shadow-lg">
                {children}
            </div>
      </main>
    </div>
  );
}
