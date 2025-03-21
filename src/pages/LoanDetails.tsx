
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLoan, getLoanPayments, createLoanPayment, updateLoan } from "@/lib/api";
import { Loan, LoanPayment } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowLeft,
  Plus,
  CreditCard,
  Calendar,
  Loader2,
  DollarSign,
  Receipt,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Progress,
} from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function LoanDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: 0,
    paymentMethod: "cash",
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    notes: "",
  });
  const [statusFormData, setStatusFormData] = useState({
    status: "",
    notes: "",
  });

  // Fetch loan details
  const { 
    data: loan, 
    isLoading: isLoanLoading,
    error: loanError
  } = useQuery({
    queryKey: ["loan", id],
    queryFn: () => getLoan(id || ""),
    enabled: !!id,
  });

  // Fetch loan payments
  const { 
    data: payments, 
    isLoading: isPaymentsLoading 
  } = useQuery({
    queryKey: ["loanPayments", id],
    queryFn: () => getLoanPayments(id || ""),
    enabled: !!id,
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: (payment: Omit<LoanPayment, "id" | "loanId">) =>
      createLoanPayment(id || "", payment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanPayments", id] });
      queryClient.invalidateQueries({ queryKey: ["loan", id] });
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["loanSummary"] });
      toast.success("Payment recorded successfully");
      setIsPaymentDialogOpen(false);
      resetPaymentForm();
    },
    onError: (error) => {
      toast.error("Failed to record payment");
      console.error(error);
    },
  });

  // Update loan status mutation
  const updateLoanStatusMutation = useMutation({
    mutationFn: (loan: Partial<Loan>) =>
      updateLoan(id || "", loan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loan", id] });
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["loanSummary"] });
      toast.success("Loan status updated successfully");
      setIsStatusDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to update loan status");
      console.error(error);
    },
  });

  // Handle payment form change
  const handlePaymentFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPaymentFormData((prev) => ({ 
      ...prev, 
      [name]: name === "amount" ? parseFloat(value) || 0 : value 
    }));
  };

  // Handle payment method select change
  const handlePaymentMethodChange = (value: string) => {
    setPaymentFormData((prev) => ({ ...prev, paymentMethod: value }));
  };

  // Handle status form change
  const handleStatusFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setStatusFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle status select change
  const handleStatusChange = (value: string) => {
    setStatusFormData((prev) => ({ ...prev, status: value }));
  };

  // Reset payment form
  const resetPaymentForm = () => {
    setPaymentFormData({
      amount: 0,
      paymentMethod: "cash",
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      notes: "",
    });
  };

  // Handle record payment
  const handleRecordPayment = () => {
    const newPayment = {
      amount: paymentFormData.amount,
      paymentMethod: paymentFormData.paymentMethod as 'cash' | 'card' | 'digital',
      paymentDate: paymentFormData.paymentDate,
      notes: paymentFormData.notes || undefined,
    };

    createPaymentMutation.mutate(newPayment);
  };

  // Handle update status
  const handleUpdateStatus = () => {
    const statusUpdate = {
      status: statusFormData.status as 'active' | 'paid' | 'defaulted',
      notes: statusFormData.notes ? 
        (loan?.notes ? `${loan.notes}\n${format(new Date(), 'PP')}: ${statusFormData.notes}` : 
        `${format(new Date(), 'PP')}: ${statusFormData.notes}`) : 
        loan?.notes
    };

    updateLoanStatusMutation.mutate(statusUpdate);
  };

  // Open status dialog
  const openStatusDialog = (status: string) => {
    setStatusFormData({
      status,
      notes: "",
    });
    setIsStatusDialogOpen(true);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate payment progress
  const calculateProgress = () => {
    if (!loan) return 0;
    return ((loan.amount - loan.remainingAmount) / loan.amount) * 100;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-500">{status}</Badge>;
      case 'paid':
        return <Badge className="bg-green-500">{status}</Badge>;
      case 'defaulted':
        return <Badge className="bg-red-500">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Calculate total paid
  const calculateTotalPaid = () => {
    if (!payments) return 0;
    return payments.reduce((total, payment) => total + payment.amount, 0);
  };

  if (isLoanLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading loan details...</p>
      </div>
    );
  }

  if (loanError || !loan) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-orange-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Loan not found</h2>
        <p className="text-muted-foreground mb-4">
          The loan you're looking for doesn't exist or couldn't be loaded.
        </p>
        <Button onClick={() => navigate('/loans')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Loans
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigate('/loans')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loan Details</h1>
          <p className="text-muted-foreground flex items-center gap-1">
            <span>Customer:</span>
            <span className="font-medium">{loan.customer?.name}</span>
            <span className="mx-2">•</span>
            <span>ID:</span>
            <span className="font-medium">{loan.id}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Loan Summary</span>
              {getStatusBadge(loan.status)}
            </CardTitle>
            <CardDescription>Overview of the current loan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Payment Progress</p>
              <div className="space-y-2">
                <Progress value={calculateProgress()} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span>{formatCurrency(loan.amount - loan.remainingAmount)} paid</span>
                  <span>{formatCurrency(loan.amount)} total</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Remaining Amount</p>
                <p className="text-xl font-bold">{formatCurrency(loan.remainingAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="text-xl font-bold">{format(new Date(loan.dueDate), 'PP')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Payment Frequency</p>
                <p className="text-md font-medium capitalize">{loan.installmentFrequency}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Installment Amount</p>
                <p className="text-md font-medium">{formatCurrency(loan.installmentAmount)}</p>
              </div>
            </div>

            {loan.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm whitespace-pre-line border rounded-md p-2 bg-muted/30 mt-1">
                  {loan.notes}
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2 border-t pt-4">
            <Button className="flex-1" onClick={() => setIsPaymentDialogOpen(true)}>
              <DollarSign className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
            <div className="flex-1 flex gap-2">
              {loan.status !== 'paid' && (
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => openStatusDialog('paid')}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark Paid
                </Button>
              )}
              {loan.status !== 'defaulted' && (
                <Button 
                  variant="outline" 
                  className="flex-1 text-destructive border-destructive hover:bg-destructive/10" 
                  onClick={() => openStatusDialog('defaulted')}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Mark Defaulted
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              {payments?.length 
                ? `${payments.length} payments recorded` 
                : "No payments recorded yet"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isPaymentsLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="ml-2">Loading payments...</p>
              </div>
            ) : !payments?.length ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground">No payment records found</p>
                <Button 
                  variant="link"
                  onClick={() => setIsPaymentDialogOpen(true)}
                >
                  Record first payment
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{format(new Date(payment.paymentDate), 'PP')}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter className="border-t p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-xl font-bold">{formatCurrency(calculateTotalPaid())}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsPaymentDialogOpen(true)}
              disabled={isPaymentsLoading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={paymentFormData.amount}
                onChange={handlePaymentFormChange}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Remaining balance: {formatCurrency(loan.remainingAmount)}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                onValueChange={handlePaymentMethodChange}
                value={paymentFormData.paymentMethod}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                name="paymentDate"
                type="date"
                value={paymentFormData.paymentDate}
                onChange={handlePaymentFormChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                value={paymentFormData.notes}
                onChange={handlePaymentFormChange}
                placeholder="Add any notes about this payment"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPaymentDialogOpen(false);
                resetPaymentForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRecordPayment}
              disabled={
                createPaymentMutation.isPending || 
                paymentFormData.amount <= 0
              }
            >
              {createPaymentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Record Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {statusFormData.status === 'paid' ? 'Mark Loan as Paid' : 
               statusFormData.status === 'defaulted' ? 'Mark Loan as Defaulted' : 
               'Update Loan Status'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">New Status</Label>
              <Select
                onValueChange={handleStatusChange}
                value={statusFormData.status}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="defaulted">Defaulted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="statusNotes">Notes (Optional)</Label>
              <Textarea
                id="statusNotes"
                name="notes"
                value={statusFormData.notes}
                onChange={handleStatusFormChange}
                placeholder="Add a note explaining this status change"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateStatus}
              disabled={
                updateLoanStatusMutation.isPending || 
                !statusFormData.status
              }
              className={statusFormData.status === 'defaulted' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {updateLoanStatusMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
