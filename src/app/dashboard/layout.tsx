"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  BookUser,
  LayoutGrid,
  LogOut,
  PackageCheck,
  Shield,
  Ticket,
  Users,
} from "lucide-react";
import { Logo } from "@/components/logo";

const navItems = [
  { href: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { href: "/dashboard/tickets", icon: Ticket, label: "Generate Tickets" },
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

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-3">
             <Logo />
             <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight">TicketWise</span>
             </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="justify-start w-full gap-2 px-2 h-11">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://picsum.photos/100" alt="Admin" data-ai-hint="profile picture" />
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-left truncate">
                  Admin User
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/")}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b h-14 bg-card/50">
           <SidebarTrigger className="md:hidden"/>
           <div className="hidden text-lg font-semibold md:block">
              {navItems.find(item => item.href === pathname)?.label || 'Dashboard'}
           </div>
        </header>
        <main className="flex-1 p-4 overflow-auto md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
