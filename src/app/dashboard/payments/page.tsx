"use client";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Button,
} from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  Banknote,
  FileText,
  Users
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Family, Payment, levelLabels } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PaymentWithFamily = {
  payment: Payment;
  family: Family;
  familyName: string;
};

const PaymentStatusIcon = ({ status }: { status: 'pending' | 'completed' | 'overdue' }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'overdue':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-yellow-600" />;
  }
};

const PaymentMethodIcon = ({ method }: { method: 'cash' | 'cheque' | 'card' }) => {
  switch (method) {
    case 'cash':
      return <Banknote className="h-4 w-4 text-green-600" />;
    case 'card':
      return <CreditCard className="h-4 w-4 text-blue-600" />;
    case 'cheque':
      return <FileText className="h-4 w-4 text-purple-600" />;
  }
};

export default function PaymentsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('all');

  const isAdmin = session?.user?.role === 'admin';

  // Fetch families with payments
  useEffect(() => {
    const fetchFamilies = async () => {
      try {
        const response = await fetch('/api/families', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setFamilies(data.families || []);
        }
      } catch (error) {
        console.error('Failed to fetch families:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFamilies();
  }, []);

  // Helper function to get family name
  const getFamilyName = (family: Family) => {
    const students = family.students;
    const isNewFormat = students && students.length > 0 && typeof students[0] === 'object';

    if (isNewFormat) {
      const studentInfos = students as any[];
      return studentInfos.length > 1
        ? `${studentInfos[0].firstName} ${studentInfos[0].lastName} (+${studentInfos.length - 1})`
        : `${studentInfos[0].firstName} ${studentInfos[0].lastName}`;
    } else {
      const studentNames = (students as any) || (family.student ? [family.student] : []);
      return studentNames.length > 1
        ? `${studentNames[0]} (+${studentNames.length - 1})`
        : studentNames[0] || 'Unknown Family';
    }
  };

  // Process all payments for stats
  const allPayments: PaymentWithFamily[] = families.flatMap(family => {
    if (!family.payments || family.payments.length === 0) return [];

    return family.payments.map(payment => ({
      payment: {
        ...payment,
        status: payment.status || (payment.dueDate && new Date(payment.dueDate) < new Date() ? 'overdue' : 'pending')
      },
      family,
      familyName: getFamilyName(family)
    }));
  });

  // Filter families based on selection
  const filteredFamilies = selectedFamilyId === 'all' ? families : families.filter(f => f.id === selectedFamilyId);

  // Payments for selected family/families
  const familyPayments: PaymentWithFamily[] = filteredFamilies.flatMap(family => {
    if (!family.payments || family.payments.length === 0) return [];

    return family.payments.map(payment => ({
      payment: {
        ...payment,
        status: payment.status || (payment.dueDate && new Date(payment.dueDate) < new Date() ? 'overdue' : 'pending')
      },
      family,
      familyName: getFamilyName(family)
    }));
  });

  const pendingPayments = familyPayments.filter(p => p.payment.status === 'pending');
  const completedPayments = familyPayments.filter(p => p.payment.status === 'completed');
  const overduePayments = familyPayments.filter(p => p.payment.status === 'overdue');

  // All payments for stats (not filtered by family)
  const allPendingPayments = allPayments.filter(p => p.payment.status === 'pending');
  const allCompletedPayments = allPayments.filter(p => p.payment.status === 'completed');
  const allOverduePayments = allPayments.filter(p => p.payment.status === 'overdue');

  // Summary statistics (all families)
  const totalPending = allPendingPayments.reduce((sum, p) => sum + p.payment.amount, 0);
  const totalCompleted = allCompletedPayments.reduce((sum, p) => sum + p.payment.amount, 0);
  const totalOverdue = allOverduePayments.reduce((sum, p) => sum + p.payment.amount, 0);
  const totalActiveFamilies = families.filter(f => f.payments && f.payments.length > 0).length;

  const updateChequeReceived = async (familyId: string, paymentIndex: number, received: boolean) => {
    if (!isAdmin) return;

    try {
      const family = families.find(f => f.id === familyId);
      if (!family) return;

      const updatedPayments = [...family.payments];
      updatedPayments[paymentIndex] = {
        ...updatedPayments[paymentIndex],
        chequeReceived: received
      };

      const response = await fetch('/api/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family: {
            id: familyId,
            payments: updatedPayments
          }
        }),
      });

      if (response.ok) {
        setFamilies(prev => prev.map(f =>
          f.id === familyId
            ? { ...f, payments: updatedPayments }
            : f
        ));
        toast({
          title: "Updated",
          description: `Cheque receipt status updated.`
        });
      }
    } catch (error) {
      console.error('Failed to update cheque status:', error);
    }
  };

  const markPaymentAsCompleted = async (familyId: string, paymentIndex: number) => {
    if (!isAdmin) return;
    try {
      const family = families.find(f => f.id === familyId);
      if (!family) return;

      const updatedPayments = [...family.payments];
      updatedPayments[paymentIndex] = {
        ...updatedPayments[paymentIndex],
        status: 'completed',
        date: new Date().toISOString().split('T')[0]
      };

      const response = await fetch('/api/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family: {
            id: familyId,
            payments: updatedPayments
          }
        }),
      });

      if (response.ok) {
        // Update local state
        setFamilies(prev => prev.map(f =>
          f.id === familyId
            ? { ...f, payments: updatedPayments }
            : f
        ));
        toast({
          title: "Payment Completed",
          description: "Payment has been marked as completed."
        });
      }
    } catch (error) {
      console.error('Failed to update payment:', error);
    }
  };

  const PaymentTable = ({ payments, showActions = false }: { payments: PaymentWithFamily[], showActions?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Family</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Details</TableHead>
          {showActions && isAdmin && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((item, index) => (
          <TableRow key={`${item.family.id}-${index}`}>
            <TableCell>
              <div>
                <p className="font-medium">{item.familyName}</p>
                <p className="text-sm text-muted-foreground">
                  {levelLabels[item.family.level]}
                </p>
              </div>
            </TableCell>
            <TableCell className="font-medium">{item.payment.amount} MAD</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <PaymentMethodIcon method={item.payment.method} />
                <span className="capitalize">{item.payment.method}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <PaymentStatusIcon status={item.payment.status} />
                <Badge variant={
                  item.payment.status === 'completed' ? 'default' :
                  item.payment.status === 'overdue' ? 'destructive' : 'secondary'
                }>
                  {item.payment.status}
                </Badge>
              </div>
            </TableCell>
            <TableCell>
              {item.payment.dueDate ? (
                <div>
                  <p>{new Date(item.payment.dueDate).toLocaleDateString()}</p>
                  {item.payment.status !== 'completed' && (
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.payment.dueDate), { addSuffix: true })}
                    </p>
                  )}
                </div>
              ) : item.payment.date ? (
                new Date(item.payment.date).toLocaleDateString()
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell>
              <div className="text-sm">
                {item.payment.chequeNumber && (
                  <div>
                    <p>Cheque: {item.payment.chequeNumber}</p>
                    {item.payment.method === 'cheque' && (
                      <div className="flex items-center gap-2 mt-1">
                        {isAdmin ? (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={item.payment.chequeReceived || false}
                              onCheckedChange={(checked) => {
                                const paymentIndex = item.family.payments.findIndex(p => p === item.payment);
                                updateChequeReceived(item.family.id, paymentIndex, !!checked);
                              }}
                            />
                            <span className="text-xs">Cheque received</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${item.payment.chequeReceived ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-xs">{item.payment.chequeReceived ? 'Received' : 'Not received'}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {item.payment.notes && (
                  <p className="text-muted-foreground">{item.payment.notes}</p>
                )}
              </div>
            </TableCell>
            {showActions && item.payment.status === 'pending' && isAdmin && (
              <TableCell>
                <Button
                  size="sm"
                  onClick={() => markPaymentAsCompleted(item.family.id, item.family.payments.findIndex(p => p === item.payment))}
                >
                  Mark Paid
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
        {payments.length === 0 && (
          <TableRow>
            <TableCell colSpan={showActions && isAdmin ? 7 : 6} className="text-center text-muted-foreground">
              No payments found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Payments</h1>
        <div className="text-center">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Payments Management</h1>
        <div className="w-64">
          <Select value={selectedFamilyId} onValueChange={setSelectedFamilyId}>
            <SelectTrigger>
              <SelectValue placeholder="Select family" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Families</SelectItem>
              {families.filter(f => f.payments && f.payments.length > 0).map(family => (
                <SelectItem key={family.id} value={family.id}>
                  {getFamilyName(family)} - {levelLabels[family.level]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending} MAD</div>
            <p className="text-xs text-muted-foreground">
              {pendingPayments.length} payment{pendingPayments.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalOverdue} MAD</div>
            <p className="text-xs text-muted-foreground">
              {overduePayments.length} payment{overduePayments.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalCompleted} MAD</div>
            <p className="text-xs text-muted-foreground">
              {completedPayments.length} payment{completedPayments.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending + totalCompleted + totalOverdue} MAD</div>
            <p className="text-xs text-muted-foreground">
              {allPayments.length} total payment{allPayments.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Families</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveFamilies}</div>
            <p className="text-xs text-muted-foreground">
              Families with payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingPayments.length})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue ({overduePayments.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedPayments.length})
          </TabsTrigger>
          <TabsTrigger value="selected">
            {selectedFamilyId === 'all' ? 'All Selected' : 'Selected Family'} ({familyPayments.length})
          </TabsTrigger>
          <TabsTrigger value="all-families">
            All Families ({allPayments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payments</CardTitle>
              <CardDescription>
                Payments that are due but not yet completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentTable payments={pendingPayments} showActions={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card>
            <CardHeader>
              <CardTitle>Overdue Payments</CardTitle>
              <CardDescription>
                Payments that are past their due date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentTable payments={overduePayments} showActions={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Payments</CardTitle>
              <CardDescription>
                Successfully completed payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentTable payments={completedPayments} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="selected">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedFamilyId === 'all' ? 'All Family Payments' : `${filteredFamilies[0] ? getFamilyName(filteredFamilies[0]) : 'Family'} Payments`}
              </CardTitle>
              <CardDescription>
                {selectedFamilyId === 'all'
                  ? 'All payments from all families'
                  : `All payments for selected family`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentTable payments={familyPayments} showActions={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-families">
          <Card>
            <CardHeader>
              <CardTitle>All Families - All Payments</CardTitle>
              <CardDescription>
                Complete payment history across all families
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentTable payments={allPayments} showActions={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}