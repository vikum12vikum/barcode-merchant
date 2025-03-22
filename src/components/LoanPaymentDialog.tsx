
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loan } from "@/lib/types";
import { Loader2, FilePlus } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";

interface LoanPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loans: Loan[];
  onConfirm: (loanId: string) => void;
  onCreateLoan: (loanData: NewLoanData) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
  customerName?: string;
  saleTotal?: number;
}

interface NewLoanData {
  installmentFrequency: "daily" | "weekly" | "monthly";
  installmentAmount: number;
  dueDate: string;
  notes?: string;
}

export default function LoanPaymentDialog({
  open,
  onOpenChange,
  loans,
  onConfirm,
  onCreateLoan,
  isLoading = false,
  title = "Add to Customer Loan",
  description = "Select an active loan to add this purchase to.",
  customerName,
  saleTotal
}: LoanPaymentDialogProps) {
  const [selectedLoanId, setSelectedLoanId] = useState<string>("");
  const [mode, setMode] = useState<"select" | "create">("select");
  const activeLoans = loans.filter(loan => loan.status === 'active');

  const form = useForm<NewLoanData>({
    defaultValues: {
      installmentFrequency: "monthly",
      installmentAmount: saleTotal ? Math.ceil(saleTotal / 3) : 0,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      notes: ""
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Reset state when dialog opens or changes
  useEffect(() => {
    if (open) {
      if (activeLoans.length === 1) {
        // Auto-select if there's only one active loan
        setSelectedLoanId(activeLoans[0].id);
        setMode("select");
      } else if (activeLoans.length === 0) {
        // Auto-switch to create mode if no active loans
        setMode("create");
      } else {
        setMode("select");
      }
    } else {
      setSelectedLoanId("");
      setMode("select");
      form.reset();
    }
  }, [open, activeLoans, form]);

  // Reset state when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedLoanId("");
      setMode("select");
      form.reset();
    }
    onOpenChange(open);
  };

  const handleCreateLoan = (data: NewLoanData) => {
    onCreateLoan(data);
  };

  const switchToCreateMode = () => {
    setMode("create");
    setSelectedLoanId("");
  };

  const switchToSelectMode = () => {
    setMode("select");
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "select" ? title : `Create New Loan for ${customerName}`}</DialogTitle>
          {description && mode === "select" && <DialogDescription>{description}</DialogDescription>}
          {mode === "create" && <DialogDescription>Create a new loan for this purchase</DialogDescription>}
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <p>Loading active loans...</p>
          </div>
        ) : mode === "select" ? (
          <div className="grid gap-4 py-4">
            {activeLoans.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">This customer has no active loans.</p>
                <Button 
                  className="mt-4" 
                  onClick={switchToCreateMode}
                  variant="outline"
                >
                  <FilePlus className="h-4 w-4 mr-2" />
                  Create New Loan
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="loan">Select Active Loan</Label>
                  <Select
                    value={selectedLoanId}
                    onValueChange={setSelectedLoanId}
                  >
                    <SelectTrigger id="loan">
                      <SelectValue placeholder="Select a loan" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeLoans.map((loan) => (
                        <SelectItem key={loan.id} value={loan.id}>
                          {formatCurrency(loan.remainingAmount)} - Due: {format(new Date(loan.dueDate), 'PP')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={switchToCreateMode}
                  >
                    <FilePlus className="h-4 w-4 mr-2" />
                    Create New Loan Instead
                  </Button>
                </div>
              
                {selectedLoanId && (
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <p className="font-medium mb-1">Selected Loan Details</p>
                    {activeLoans.filter(loan => loan.id === selectedLoanId).map(loan => (
                      <div key={loan.id} className="space-y-1">
                        <p>Total Amount: {formatCurrency(loan.amount)}</p>
                        <p>Remaining: {formatCurrency(loan.remainingAmount)}</p>
                        <p>Type: {loan.type === 'cash' ? 'Cash Loan' : 'Goods Loan'}</p>
                        <p>Due Date: {format(new Date(loan.dueDate), 'PPP')}</p>
                        <p>Payment: {loan.installmentFrequency} ({formatCurrency(loan.installmentAmount)})</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateLoan)} className="space-y-4 py-2">
              {saleTotal && (
                <div className="bg-muted p-3 rounded-md mb-4">
                  <p className="font-medium">Purchase Amount: {formatCurrency(saleTotal)}</p>
                </div>
              )}
              
              <FormField
                control={form.control}
                name="installmentFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Frequency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How often the customer will make payments
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="installmentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Installment Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="0.01"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Amount per payment
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {activeLoans.length > 0 && (
                <div className="flex justify-end mt-2">
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    onClick={switchToSelectMode}
                  >
                    Use Existing Loan Instead
                  </Button>
                </div>
              )}
            </form>
          </Form>
        )}
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          {mode === "select" ? (
            <Button
              onClick={() => onConfirm(selectedLoanId)}
              disabled={isLoading || activeLoans.length === 0 || !selectedLoanId}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          ) : (
            <Button
              type="submit"
              onClick={form.handleSubmit(handleCreateLoan)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Loan...
                </>
              ) : (
                "Create Loan"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
