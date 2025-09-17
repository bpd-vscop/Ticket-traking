"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookUser,
  LayoutGrid,
  Users,
  Calendar,
  BarChart3
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { levelLabels } from "@/lib/types";

type DashboardStats = {
  overview: {
    unassignedSheets: number;
    totalFamilies: number;
    totalTeachers: number;
    recentSheets: number;
    totalTicketsGenerated: number;
  };
  charts: {
    sheetsByLevel: {
      level: string;
      total: number;
      assigned: number;
      unassigned: number;
    }[];
  };
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard', {
          method: 'GET',
          cache: 'no-store'
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Failed to load dashboard data.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overview, charts } = stats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          Welcome back, {session?.user?.firstName}!
        </Badge>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalTicketsGenerated.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Generated across all sheets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Families</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalFamilies}</div>
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
            <div className="text-2xl font-bold">{overview.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">
              Available for assignments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.recentSheets}</div>
            <p className="text-xs text-muted-foreground">
              Sheets generated this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Sheets by Education Level
            </CardTitle>
            <CardDescription>
              Distribution of sheets across different education levels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {charts.sheetsByLevel.map((item) => {
              const assignedPercentage = item.total > 0 ? (item.assigned / item.total) * 100 : 0;
              return (
                <div key={item.level} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {levelLabels[item.level as keyof typeof levelLabels] || item.level}
                    </span>
                    <span className="text-muted-foreground">
                      {item.total} total ({item.assigned} assigned)
                    </span>
                  </div>
                  <div className="space-y-1">
                    <Progress value={assignedPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {assignedPercentage.toFixed(1)}% assigned, {item.unassigned} available
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome to TicketWise</CardTitle>
          <CardDescription>
            Your comprehensive ticket management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Quick Actions</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Generate new ticket sheets from the Tickets page</li>
                <li>• Assign sheets to families from the Sheets inventory</li>
                <li>• Manage family information and teacher assignments</li>
                <li>• Download tickets in SVG or PDF formats</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">System Overview</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {overview.totalTicketsGenerated} tickets generated</li>
                <li>• {overview.unassignedSheets} sheets ready for assignment</li>
                <li>• {overview.totalFamilies} active families enrolled</li>
                <li>• {overview.totalTeachers} teachers available</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
