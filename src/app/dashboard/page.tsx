import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookUser, LayoutGrid, Users } from "lucide-react";
import { getFamilies, getSheets, getTeachers } from "@/lib/data";

export default function DashboardPage() {
  const mockSheets = getSheets();
  const mockFamilies = getFamilies();
  const mockTeachers = getTeachers();
  
  const unassignedSheets = mockSheets.filter(s => !s.isAssigned).length;
  const activeFamilies = mockFamilies.length;
  const totalTeachers = mockTeachers.length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unassigned Sheets
            </CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unassignedSheets}</div>
            <p className="text-xs text-muted-foreground">
              Ready to be assigned to families
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Families</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeFamilies}</div>
            <p className="text-xs text-muted-foreground">
              Currently enrolled
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <BookUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeachers}</div>
            <p className="text-xs text-muted-foreground">
              Available for assignments
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome to TicketWise</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Use the navigation on the left to manage tickets, sheets, families, and more. This dashboard gives you a quick overview of your operations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
