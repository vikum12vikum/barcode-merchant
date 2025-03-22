
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loan } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface LoanPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loans: Loan[];
  onConfirm: (loanId: string) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export default function LoanPaymentDialog({
  open,
  onOpenChange,
  loans,
  onConfirm,
  isLoading = false,
  title = "Add to Customer Loan",
  description = "Select an active loan to add this purchase to."
}: LoanPaymentDialogProps) {
  const [selectedLoanId, setSelectedLoanId] = useState<string>("");
  const activeLoans = loans.filter(loan => loan.status === 'active');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Reset state when dialog opens or changes
  useEffect(() => {
    if (open && activeLoans.length === 1) {
      // Auto-select if there's only one active loan
      setSelectedLoanId(activeLoans[0].id);
    } else if (!open) {
      setSelectedLoanId("");
    }
  }, [open, activeLoans]);

  // Reset state when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedLoanId("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {activeLoans.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">This customer has no active loans.</p>
              <p className="text-sm mt-2">You need to create a loan for this customer first.</p>
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
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
