
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCashInHand, updateCashInHand, getCashTransactions } from "@/lib/api";
import { CashInHand as CashInHandType, CashTransaction } from "@/lib/types";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  ArrowUpCircle, 
  ArrowDownCircle, 
  Loader2,
  Wallet,
  Info,
  Calendar,
  Banknote,
  Receipt,
  Clock,
  User
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CashInHand() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionReason, setTransactionReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  // Fetch cash in hand
  const { data: cashInHand, isLoading: isCashInHandLoading } = useQuery({
    queryKey: ["cashInHand"],
    queryFn: getCashInHand,
  });

  // Fetch cash transactions
  const { data: transactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ["cashTransactions"],
    queryFn: getCashTransactions,
  });

  // Update cash in hand mutation
  const updateCashMutation = useMutation({
    mutationFn: ({ amount, type, reason }: { amount: number; type: 'deposit' | 'withdrawal'; reason: string }) =>
      updateCashInHand(amount, type, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashInHand"] });
      queryClient.invalidateQueries({ queryKey: ["cashTransactions"] });
      toast.success(`Cash ${transactionAmount} ${transactionReason === 'deposit' ? 'added to' : 'removed from'} register`);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to update cash register");
      console.error(error);
    },
  });

  // Reset form
  const resetForm = () => {
    setTransactionAmount("");
    setTransactionReason("");
    setCustomReason("");
    setIsDepositDialogOpen(false);
    setIsWithdrawalDialogOpen(false);
  };

  // Get final reason (either selected from dropdown or custom)
  const getFinalReason = () => {
    if (transactionReason === 'Other') {
      return customReason;
    }
    return transactionReason;
  };

  // Handle deposit
  const handleDeposit = () => {
    const amount = parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const reason = getFinalReason();
    if (!reason) {
      toast.error("Please provide a reason");
      return;
    }

    updateCashMutation.mutate({
      amount,
      type: 'deposit',
      reason,
    });
  };

  // Handle withdrawal
  const handleWithdrawal = () => {
    const amount = parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (cashInHand && amount > cashInHand.amount) {
      toast.error("Withdrawal amount exceeds cash in hand");
      return;
    }

    const reason = getFinalReason();
    if (!reason) {
      toast.error("Please provide a reason");
      return;
    }

    updateCashMutation.mutate({
      amount,
      type: 'withdrawal',
      reason,
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Print cash report
  const printCashReport = () => {
    // Create a printable document
    const printContent = `
      <html>
        <head>
          <title>Cash Register Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            h1 { font-size: 18px; margin-bottom: 10px; }
            .header { text-align: center; margin-bottom: 20px; }
            .info { margin-bottom: 20px; }
            .info div { margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; }
            @media print {
              body { -webkit-print-color-adjust: exact; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Cash Register Report</h1>
            <div>${format(new Date(), 'PPP')}</div>
          </div>
          
          <div class="info">
            <div><strong>Current Cash in Hand:</strong> ${cashInHand ? formatCurrency(cashInHand.amount) : 'N/A'}</div>
            <div><strong>Last Updated:</strong> ${cashInHand ? format(new Date(cashInHand.lastUpdated), 'PPpp') : 'N/A'}</div>
            <div><strong>Report Generated by:</strong> ${user?.name}</div>
          </div>
          
          <h2>Recent Transactions</h2>
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              ${transactions ? transactions.slice(0, 20).map(transaction => `
                <tr>
                  <td>${format(new Date(transaction.createdAt), 'PPpp')}</td>
                  <td>${transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}</td>
                  <td>${formatCurrency(transaction.amount)}</td>
                  <td>${transaction.reason}</td>
                  <td>${transaction.createdBy}</td>
                </tr>
              `).join('') : '<tr><td colspan="5">No transactions found</td></tr>'}
            </tbody>
          </table>
          
          <div class="footer">
            <p>This is an official cash register report. Please retain for your records.</p>
            <button onclick="window.print()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px;">Print Report</button>
          </div>
          <script>
            // Auto print and close
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;
    
    // Create a new iframe for printing instead of a new window
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    
    document.body.appendChild(printFrame);
    
    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(printContent);
      frameDoc.close();
      
      // Wait for resources to load before printing
      setTimeout(() => {
        try {
          printFrame.contentWindow?.print();
          
          // Remove the iframe after printing
          setTimeout(() => {
            document.body.removeChild(printFrame);
          }, 1000);
        } catch (error) {
          console.error("Printing failed", error);
          toast.error("Printing failed. Please try again.");
          document.body.removeChild(printFrame);
        }
      }, 500);
    }
    
    toast.success("Cash report sent to printer");
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cash in Hand</h1>
          <p className="text-muted-foreground">Manage and track cash in the register</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={printCashReport}
            className="flex items-center gap-2"
          >
            <Receipt size={16} /> Print Report
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsWithdrawalDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <ArrowUpCircle size={16} /> Withdrawal
          </Button>
          <Button 
            onClick={() => setIsDepositDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <ArrowDownCircle size={16} /> Deposit
          </Button>
        </div>
      </div>

      {/* Cash Summary Card */}
      <Card className="bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <Wallet className="h-5 w-5" /> Cash Register Balance
          </CardTitle>
          <CardDescription>
            Current cash in hand as of {cashInHand ? format(new Date(cashInHand.lastUpdated), 'PPpp') : 'now'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {isCashInHandLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="bg-secondary/20 rounded-lg p-6 text-center">
                <div className="text-sm text-muted-foreground mb-2">Current Balance</div>
                <div className="text-4xl font-bold">
                  {cashInHand ? formatCurrency(cashInHand.amount) : '$0.00'}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Info size={14} /> Last Updated
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-0">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-muted-foreground" />
                      <span>
                        {cashInHand 
                          ? format(new Date(cashInHand.lastUpdated), 'PPpp')
                          : 'Not available'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <User size={14} /> Updated By
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-0">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-muted-foreground" />
                      <span>{user?.name || 'Unknown'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>History of cash deposits and withdrawals</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Created By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isTransactionsLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="mt-2 text-muted-foreground">Loading transactions...</p>
                  </TableCell>
                </TableRow>
              ) : transactions && transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{format(new Date(transaction.createdAt), 'PPpp')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {transaction.type === 'deposit' ? (
                          <>
                            <ArrowDownCircle size={16} className="text-green-500" />
                            <span>Deposit</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpCircle size={16} className="text-red-500" />
                            <span>Withdrawal</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>{transaction.reason}</TableCell>
                    <TableCell>{transaction.createdBy}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <Wallet className="h-8 w-8 mx-auto text-muted-foreground/30" />
                    <p className="mt-2 text-lg font-medium">No transactions found</p>
                    <p className="text-sm text-muted-foreground">
                      Make a deposit or withdrawal to see it here
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Deposit Dialog */}
      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Cash to Register</DialogTitle>
            <DialogDescription>Enter the amount and reason for adding cash to the register.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Amount</Label>
              <div className="relative">
                <Banknote className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="deposit-amount"
                  placeholder="0.00"
                  type="number"
                  className="pl-10"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit-reason">Reason</Label>
              <Select value={transactionReason} onValueChange={setTransactionReason}>
                <SelectTrigger id="deposit-reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starting balance">Starting balance</SelectItem>
                  <SelectItem value="Cash sale">Cash sale</SelectItem>
                  <SelectItem value="Loan repayment">Loan repayment</SelectItem>
                  <SelectItem value="Owner deposit">Owner deposit</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {transactionReason === 'Other' && (
                <div className="mt-2">
                  <Textarea
                    placeholder="Please specify the reason"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDepositDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeposit}
              disabled={
                updateCashMutation.isPending || 
                !transactionAmount || 
                !transactionReason || 
                (transactionReason === 'Other' && !customReason)
              }
            >
              {updateCashMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <ArrowDownCircle className="mr-2 h-4 w-4" /> Add Cash
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Dialog */}
      <Dialog open={isWithdrawalDialogOpen} onOpenChange={setIsWithdrawalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Cash from Register</DialogTitle>
            <DialogDescription>Enter the amount and reason for removing cash from the register.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="withdrawal-amount">Amount</Label>
              <div className="relative">
                <Banknote className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="withdrawal-amount"
                  placeholder="0.00"
                  type="number"
                  className="pl-10"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value)}
                />
              </div>
              {cashInHand && (
                <p className="text-xs text-muted-foreground">
                  Available: {formatCurrency(cashInHand.amount)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawal-reason">Reason</Label>
              <Select value={transactionReason} onValueChange={setTransactionReason}>
                <SelectTrigger id="withdrawal-reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="End of day">End of day</SelectItem>
                  <SelectItem value="Paid supplier">Paid supplier</SelectItem>
                  <SelectItem value="Expense payment">Expense payment</SelectItem>
                  <SelectItem value="Error correction">Error correction</SelectItem>
                  <SelectItem value="Owner withdrawal">Owner withdrawal</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {transactionReason === 'Other' && (
                <div className="mt-2">
                  <Textarea
                    placeholder="Please specify the reason"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsWithdrawalDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleWithdrawal}
              disabled={
                updateCashMutation.isPending || 
                !transactionAmount || 
                !transactionReason || 
                (transactionReason === 'Other' && !customReason) ||
                (cashInHand && parseFloat(transactionAmount) > cashInHand.amount)
              }
            >
              {updateCashMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <ArrowUpCircle className="mr-2 h-4 w-4" /> Remove Cash
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
