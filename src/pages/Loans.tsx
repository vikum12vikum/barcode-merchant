
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLoans, getCustomers, createLoan, updateLoan, deleteLoan, getLoanSummary } from "@/lib/api";
import { Loan, Customer, LoanSummary } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  CreditCard,
  DollarSign,
  Calendar,
  Loader2,
  Edit,
  Trash2,
  Eye,
  Users,
  BadgeCheck,
  AlertTriangle,
  Clock,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Badge,
} from "@/components/ui/badge";

export default function Loans() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [formData, setFormData] = useState({
    customerId: "",
    amount: 0,
    remainingAmount: 0,
    dueDate: "",
    installmentFrequency: "monthly",
    installmentAmount: 0,
    notes: "",
    status: "active",
  });

  // Fetch loans
  const { data: loans, isLoading } = useQuery({
    queryKey: ["loans"],
    queryFn: getLoans,
  });

  // Fetch customers
  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });

  // Fetch loan summary
  const { data: loanSummary } = useQuery({
    queryKey: ["loanSummary"],
    queryFn: getLoanSummary,
  });

  // Create loan mutation
  const createLoanMutation = useMutation({
    mutationFn: (loan: Omit<Loan, "id" | "createdAt" | "updatedAt" | "customer">) =>
      createLoan(loan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["loanSummary"] });
      toast.success("Loan created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to create loan");
      console.error(error);
    },
  });

  // Update loan mutation
  const updateLoanMutation = useMutation({
    mutationFn: ({ id, loan }: { id: string; loan: Partial<Loan> }) =>
      updateLoan(id, loan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["loanSummary"] });
      toast.success("Loan updated successfully");
      setIsEditDialogOpen(false);
      setSelectedLoan(null);
    },
    onError: (error) => {
      toast.error("Failed to update loan");
      console.error(error);
    },
  });

  // Delete loan mutation
  const deleteLoanMutation = useMutation({
    mutationFn: (id: string) => deleteLoan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["loanSummary"] });
      toast.success("Loan deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedLoan(null);
    },
    onError: (error) => {
      toast.error("Failed to delete loan");
      console.error(error);
    },
  });

  // Filter loans
  const filteredLoans = loans
    ? loans.filter((loan) => {
        const customer = loan.customer?.name?.toLowerCase() || "";
        return customer.includes(searchQuery.toLowerCase()) ||
          loan.id.includes(searchQuery) ||
          loan.status.includes(searchQuery.toLowerCase());
      })
    : [];

  // Handle form change
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === "amount" || name === "installmentAmount" || name === "remainingAmount"
        ? parseFloat(value) || 0
        : value 
    }));
  };

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      customerId: "",
      amount: 0,
      remainingAmount: 0,
      dueDate: "",
      installmentFrequency: "monthly",
      installmentAmount: 0,
      notes: "",
      status: "active",
    });
  };

  // Calculate remaining amount
  const calculateRemainingAmount = (amount: number) => {
    setFormData((prev) => ({ ...prev, amount, remainingAmount: amount }));
  };

  // Calculate installment amount
  const calculateInstallmentAmount = (amount: number, frequency: string) => {
    // Simple calculation based on frequency
    let installment = 0;
    
    switch (frequency) {
      case "daily":
        installment = amount / 30; // Roughly a month of daily payments
        break;
      case "weekly":
        installment = amount / 4; // Roughly a month of weekly payments
        break;
      case "monthly":
        installment = amount; // One payment
        break;
      default:
        installment = amount;
    }
    
    setFormData((prev) => ({ 
      ...prev, 
      installmentAmount: Math.round(installment * 100) / 100 
    }));
  };

  // Handle create loan
  const handleCreateLoan = () => {
    const newLoan = {
      customerId: formData.customerId,
      amount: formData.amount,
      remainingAmount: formData.amount,
      status: formData.status as 'active' | 'paid' | 'defaulted',
      dueDate: formData.dueDate,
      installmentFrequency: formData.installmentFrequency as 'daily' | 'weekly' | 'monthly',
      installmentAmount: formData.installmentAmount,
      notes: formData.notes || undefined,
    };

    createLoanMutation.mutate(newLoan);
  };

  // Handle edit loan
  const handleEditLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setFormData({
      customerId: loan.customerId,
      amount: loan.amount,
      remainingAmount: loan.remainingAmount,
      dueDate: loan.dueDate,
      installmentFrequency: loan.installmentFrequency,
      installmentAmount: loan.installmentAmount,
      notes: loan.notes || "",
      status: loan.status,
    });
    setIsEditDialogOpen(true);
  };

  // Handle view loan
  const handleViewLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsViewDialogOpen(true);
  };

  // Handle update loan
  const handleUpdateLoan = () => {
    if (!selectedLoan) return;

    const updatedLoan = {
      customerId: formData.customerId,
      amount: formData.amount,
      remainingAmount: formData.remainingAmount,
      status: formData.status as 'active' | 'paid' | 'defaulted',
      dueDate: formData.dueDate,
      installmentFrequency: formData.installmentFrequency as 'daily' | 'weekly' | 'monthly',
      installmentAmount: formData.installmentAmount,
      notes: formData.notes || undefined,
    };

    updateLoanMutation.mutate({
      id: selectedLoan.id,
      loan: updatedLoan,
    });
  };

  // Handle delete loan
  const handleDeleteLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsDeleteDialogOpen(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (!selectedLoan) return;
    deleteLoanMutation.mutate(selectedLoan.id);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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

  // Get customer name
  const getCustomerName = (customerId: string) => {
    if (!customers) return 'Unknown';
    const customer = customers.find((c) => c.id === customerId);
    return customer ? customer.name : 'Unknown';
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loans</h1>
          <p className="text-muted-foreground">Manage customer loans and payments</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus size={16} className="mr-2" /> New Loan
        </Button>
      </div>

      {loanSummary && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Loans</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold flex items-center">
                <Clock className="mr-2 h-4 w-4 text-blue-500" />
                {loanSummary.activeLoans}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Loaned</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold flex items-center">
                <DollarSign className="mr-2 h-4 w-4 text-emerald-500" />
                {formatCurrency(loanSummary.totalAmountLent)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold flex items-center">
                <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
                {formatCurrency(loanSummary.totalAmountOutstanding)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Repaid</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold flex items-center">
                <BadgeCheck className="mr-2 h-4 w-4 text-green-500" />
                {formatCurrency(loanSummary.totalAmountRepaid)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search loans..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="defaulted">Defaulted</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="mt-2 text-muted-foreground">Loading loans...</p>
                  </TableCell>
                </TableRow>
              ) : filteredLoans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground/30" />
                    <p className="mt-2 text-lg font-medium">No loans found</p>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? `No results for "${searchQuery}"` : "Create a new loan to get started"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLoans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>{loan.customer?.name}</TableCell>
                    <TableCell>{formatCurrency(loan.amount)}</TableCell>
                    <TableCell>{formatCurrency(loan.remainingAmount)}</TableCell>
                    <TableCell>{format(new Date(loan.dueDate), 'PP')}</TableCell>
                    <TableCell>{getStatusBadge(loan.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleViewLoan(loan)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditLoan(loan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                          onClick={() => handleDeleteLoan(loan)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Loan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Loan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customerId">Customer</Label>
              <Select
                onValueChange={(value) => handleSelectChange('customerId', value)}
                value={formData.customerId}
              >
                <SelectTrigger id="customerId">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Loan Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => {
                  const amount = parseFloat(e.target.value) || 0;
                  calculateRemainingAmount(amount);
                  calculateInstallmentAmount(amount, formData.installmentFrequency);
                }}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="installmentFrequency">Payment Frequency</Label>
              <Select
                onValueChange={(value) => {
                  handleSelectChange('installmentFrequency', value);
                  calculateInstallmentAmount(formData.amount, value);
                }}
                value={formData.installmentFrequency}
              >
                <SelectTrigger id="installmentFrequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="installmentAmount">Installment Amount</Label>
              <Input
                id="installmentAmount"
                name="installmentAmount"
                type="number"
                value={formData.installmentAmount}
                onChange={handleFormChange}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Add any notes about this loan"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateLoan}
              disabled={
                createLoanMutation.isPending || 
                !formData.customerId || 
                formData.amount <= 0 ||
                !formData.dueDate
              }
            >
              {createLoanMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Loan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Loan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Loan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-customerId">Customer</Label>
              <Select
                onValueChange={(value) => handleSelectChange('customerId', value)}
                value={formData.customerId}
              >
                <SelectTrigger id="edit-customerId">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-amount">Loan Amount</Label>
              <Input
                id="edit-amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleFormChange}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-remainingAmount">Remaining Amount</Label>
              <Input
                id="edit-remainingAmount"
                name="remainingAmount"
                type="number"
                value={formData.remainingAmount}
                onChange={handleFormChange}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                onValueChange={(value) => handleSelectChange('status', value)}
                value={formData.status}
              >
                <SelectTrigger id="edit-status">
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
              <Label htmlFor="edit-dueDate">Due Date</Label>
              <Input
                id="edit-dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-installmentFrequency">Payment Frequency</Label>
              <Select
                onValueChange={(value) => handleSelectChange('installmentFrequency', value)}
                value={formData.installmentFrequency}
              >
                <SelectTrigger id="edit-installmentFrequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-installmentAmount">Installment Amount</Label>
              <Input
                id="edit-installmentAmount"
                name="installmentAmount"
                type="number"
                value={formData.installmentAmount}
                onChange={handleFormChange}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notes (Optional)</Label>
              <Textarea
                id="edit-notes"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Add any notes about this loan"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedLoan(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateLoan}
              disabled={
                updateLoanMutation.isPending || 
                !formData.customerId || 
                formData.amount <= 0 ||
                !formData.dueDate
              }
            >
              {updateLoanMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Loan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Loan Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Loan Details</DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
                  <p className="text-lg font-semibold">{selectedLoan.customer?.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <div className="mt-1">{getStatusBadge(selectedLoan.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Loan Amount</h3>
                  <p className="text-lg font-semibold">{formatCurrency(selectedLoan.amount)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Remaining</h3>
                  <p className="text-lg font-semibold">{formatCurrency(selectedLoan.remainingAmount)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
                  <p className="text-lg font-semibold">{format(new Date(selectedLoan.dueDate), 'PP')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Payment Frequency</h3>
                  <p className="text-lg font-semibold capitalize">{selectedLoan.installmentFrequency}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Installment Amount</h3>
                <p className="text-lg font-semibold">{formatCurrency(selectedLoan.installmentAmount)}</p>
              </div>

              {selectedLoan.notes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                  <p className="text-sm mt-1">{selectedLoan.notes}</p>
                </div>
              )}

              <div className="pt-4 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    setSelectedLoan(null);
                  }}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleEditLoan(selectedLoan);
                  }}
                >
                  Edit Loan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this loan for customer{" "}
              <span className="font-medium">{selectedLoan?.customer?.name}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoanMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
