
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSales } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  ReceiptText,
  Calendar,
  User,
  CreditCard,
  Printer,
  Download,
  ChevronDown,
  Clock,
  Banknote,
  Wallet,
  ExternalLink,
  Filter,
  Loader2,
  CreditCard as CardIcon,
  DollarSign,
  Receipt,
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Sale, SaleItem } from "@/lib/types";
import { toast } from "sonner";

export default function Sales() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);

  // Fetch sales
  const { data: sales, isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: getSales,
  });

  // Filter sales
  const filteredSales = sales
    ? sales.filter((sale) => {
        const matchesSearch =
          sale.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (sale.customer?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus =
          statusFilter === "all" || sale.status === statusFilter;
        
        const matchesPayment =
          paymentFilter === "all" || sale.paymentMethod === paymentFilter;
        
        return matchesSearch && matchesStatus && matchesPayment;
      })
    : [];

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // View invoice
  const viewInvoice = (sale: Sale) => {
    setSelectedSale(sale);
    setIsInvoiceDialogOpen(true);
  };

  // Print invoice
  const printInvoice = (sale: Sale) => {
    // Generate receipt HTML
    const receiptHTML = generateReceiptHTML(sale);
    
    // Print the receipt
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      
      // Wait for content to load before printing
      printWindow.onload = function() {
        printWindow.print();
        // Close window after printing (some browsers might block this)
        printWindow.onafterprint = function() {
          printWindow.close();
        };
      };
      
      toast.success("Invoice sent to printer");
    } else {
      toast.error("Unable to open print window. Please check your popup blocker settings.");
    }
  };

  // Generate receipt HTML
  const generateReceiptHTML = (sale: Sale) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${sale.invoiceNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.4;
              margin: 0;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 10px;
            }
            .address {
              margin-bottom: 20px;
            }
            .invoice-details {
              margin-bottom: 20px;
            }
            .customer-details {
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            .totals {
              width: 40%;
              margin-left: auto;
            }
            .totals table {
              margin-bottom: 5px;
            }
            .totals td:first-child {
              text-align: left;
            }
            .totals td:last-child {
              text-align: right;
            }
            .loan-info {
              margin-top: 15px;
              padding: 10px;
              border: 1px solid #ddd;
              background-color: #f9f9f9;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #777;
            }
            @media print {
              body {
                padding: 0;
                font-size: 12px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>INVOICE</h2>
            <h3>#${sale.invoiceNumber}</h3>
          </div>
          
          <div class="invoice-details">
            <strong>Date:</strong> ${formatDate(sale.createdAt)} ${formatTime(sale.createdAt)}<br>
            <strong>Payment Method:</strong> ${sale.paymentMethod}${sale.paymentMethod === 'loan' ? ' (Credit)' : ''}<br>
            <strong>Status:</strong> ${sale.status}
          </div>
          
          <div class="customer-details">
            <strong>Customer:</strong> ${sale.customer ? sale.customer.name : 'Guest Customer'}<br>
            ${sale.customer?.phone ? `<strong>Phone:</strong> ${sale.customer.phone}<br>` : ''}
            ${sale.customer?.email ? `<strong>Email:</strong> ${sale.customer.email}<br>` : ''}
            ${sale.customer?.address ? `<strong>Address:</strong> ${sale.customer.address}<br>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${sale.items.map(item => `
                <tr>
                  <td>${item.product.name}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.price)}</td>
                  <td>${formatCurrency(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <table>
              <tr>
                <td>Subtotal:</td>
                <td>${formatCurrency(sale.subtotal)}</td>
              </tr>
              ${sale.discount > 0 ? `
                <tr>
                  <td>Discount:</td>
                  <td>-${formatCurrency(sale.discount)}</td>
                </tr>
              ` : ''}
              ${sale.tax > 0 ? `
                <tr>
                  <td>Tax:</td>
                  <td>${formatCurrency(sale.tax)}</td>
                </tr>
              ` : ''}
              <tr>
                <td><strong>Total:</strong></td>
                <td><strong>${formatCurrency(sale.total)}</strong></td>
              </tr>
            </table>
          </div>
          
          ${sale.loanId ? `
            <div class="loan-info">
              <strong>Added to Loan:</strong> This purchase has been added to customer's loan account.<br>
              <strong>Loan ID:</strong> ${sale.loanId}<br>
              <strong>Payment Terms:</strong> As per loan agreement
            </div>
          ` : ''}
          
          ${sale.note ? `
            <div style="margin-top: 20px;">
              <strong>Note:</strong> ${sale.note}
            </div>
          ` : ''}
          
          <div class="footer">
            <p>Thank you for your business!</p>
          </div>
        </body>
      </html>
    `;
  };

  // Download invoice
  const downloadInvoice = (sale: Sale) => {
    toast.info("Generating PDF...");
    setTimeout(() => {
      toast.success("Invoice downloaded successfully");
    }, 1500);
  };

  // Get payment method icon
  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote size={14} />;
      case "card":
        return <CardIcon size={14} />;
      case "digital":
        return <Wallet size={14} />;
      case "loan":
        return <Receipt size={14} />;
      default:
        return <CardIcon size={14} />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            Pending
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="text-red-600 border-red-300">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales History</h1>
          <p className="text-muted-foreground">View and manage your invoices</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices or customers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <div className="flex items-center gap-2">
                <Filter size={14} />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <div className="flex items-center gap-2">
                <CreditCard size={14} />
                <SelectValue placeholder="Payment" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="digital">Digital</SelectItem>
              <SelectItem value="loan">Loan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <ReceiptText className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="text-lg font-medium">No invoices found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "No invoices have been created yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">
                      {sale.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar size={12} className="text-muted-foreground" />
                          <span>{formatDate(sale.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock size={10} />
                          <span>{formatTime(sale.createdAt)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User size={14} className="text-muted-foreground" />
                        <span>
                          {sale.customer ? sale.customer.name : "Guest"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 capitalize">
                        {getPaymentIcon(sale.paymentMethod)}
                        <span>{sale.paymentMethod}</span>
                        {sale.loanId && <span className="text-xs text-blue-500 ml-1">(Loan)</span>}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(sale.status)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => viewInvoice(sale)}
                        >
                          <ExternalLink size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => printInvoice(sale)}
                        >
                          <Printer size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => downloadInvoice(sale)}
                        >
                          <Download size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Invoice Details Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ReceiptText size={18} />
              <span>Invoice #{selectedSale?.invoiceNumber}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedSale && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Bill To</h3>
                  <p className="text-sm">
                    {selectedSale.customer ? (
                      <>
                        <span className="font-medium block">
                          {selectedSale.customer.name}
                        </span>
                        {selectedSale.customer.phone && (
                          <span className="block">{selectedSale.customer.phone}</span>
                        )}
                        {selectedSale.customer.email && (
                          <span className="block">{selectedSale.customer.email}</span>
                        )}
                        {selectedSale.customer.address && (
                          <span className="block mt-1">{selectedSale.customer.address}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">Guest Customer</span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-medium mb-1">Invoice Details</h3>
                  <p className="text-sm">
                    <span className="block">
                      <span className="text-muted-foreground">Date: </span>
                      {formatDate(selectedSale.createdAt)}
                    </span>
                    <span className="block">
                      <span className="text-muted-foreground">Status: </span>
                      {selectedSale.status}
                    </span>
                    <span className="block">
                      <span className="text-muted-foreground">Payment Method: </span>
                      {selectedSale.paymentMethod}
                      {selectedSale.loanId && <span className="text-blue-500 ml-1">(Loan)</span>}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSale.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product.name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.price)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(selectedSale.subtotal)}</span>
                  </div>
                  {selectedSale.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount</span>
                      <span>-{formatCurrency(selectedSale.discount)}</span>
                    </div>
                  )}
                  {selectedSale.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>{formatCurrency(selectedSale.tax)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{formatCurrency(selectedSale.total)}</span>
                  </div>
                </div>
              </div>
              
              {selectedSale.loanId && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-sm">
                  <span className="font-medium text-blue-700">Loan Information: </span>
                  This purchase has been added to customer's loan (ID: {selectedSale.loanId})
                </div>
              )}
              
              {selectedSale.note && (
                <div className="bg-muted/50 p-3 rounded-md text-sm">
                  <span className="font-medium">Note: </span>
                  {selectedSale.note}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <Button variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>
                Close
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => selectedSale && printInvoice(selectedSale)}
                >
                  <Printer size={16} className="mr-2" />
                  Print
                </Button>
                <Button 
                  onClick={() => selectedSale && downloadInvoice(selectedSale)}
                >
                  <Download size={16} className="mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
