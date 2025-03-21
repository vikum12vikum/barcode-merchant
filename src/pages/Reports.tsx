
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDailySalesReport, getProductSalesReport } from "@/lib/api";
import { DailySalesReport, ProductSalesReport, ReportFilters } from "@/lib/types";
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
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  FileText,
  Loader2,
  ShoppingBag,
  Download,
  SearchIcon,
  PrinterIcon
} from "lucide-react";
import { format, subDays, isValid, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Reports() {
  const [activeTab, setActiveTab] = useState("sales");
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  // Fetch daily sales report
  const { data: dailySales, isLoading: isDailySalesLoading } = useQuery({
    queryKey: ["dailySalesReport", filters],
    queryFn: () => getDailySalesReport(),
  });

  // Fetch product sales report
  const { data: productSales, isLoading: isProductSalesLoading } = useQuery({
    queryKey: ["productSalesReport", filters],
    queryFn: () => getProductSalesReport(),
  });

  // Handle filter change
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Print report
  const printReport = () => {
    // Create a printable document based on active tab
    let title = '';
    let content = '';
    
    if (activeTab === 'sales') {
      title = 'Sales Report';
      content = `
        <h2>Daily Sales Summary</h2>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th>Date</th>
              <th>Total Sales</th>
              <th>Transactions</th>
              <th>Average Transaction</th>
            </tr>
          </thead>
          <tbody>
            ${dailySales?.map(sale => `
              <tr>
                <td>${format(new Date(sale.date), 'PP')}</td>
                <td>${formatCurrency(sale.totalSales)}</td>
                <td>${sale.totalTransactions}</td>
                <td>${formatCurrency(sale.averageTransaction)}</td>
              </tr>
            `).join('') || '<tr><td colspan="4">No data available</td></tr>'}
          </tbody>
        </table>
      `;
    } else if (activeTab === 'products') {
      title = 'Product Sales Report';
      content = `
        <h2>Product Performance</h2>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity Sold</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${productSales?.map(product => `
              <tr>
                <td>${product.productName}</td>
                <td>${product.quantity}</td>
                <td>${formatCurrency(product.revenue)}</td>
              </tr>
            `).join('') || '<tr><td colspan="3">No data available</td></tr>'}
          </tbody>
        </table>
      `;
    }
    
    const printContent = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            h1 { font-size: 18px; margin-bottom: 10px; }
            h2 { font-size: 16px; margin-top: 20px; margin-bottom: 10px; }
            .header { text-align: center; margin-bottom: 20px; }
            .info { margin-bottom: 20px; }
            .info div { margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <div>Period: ${format(parseISO(filters.startDate), 'PP')} - ${format(parseISO(filters.endDate), 'PP')}</div>
          </div>
          
          <div class="info">
            <div><strong>Generated on:</strong> ${format(new Date(), 'PPpp')}</div>
          </div>
          
          ${content}
          
          <div class="footer">
            <p>This is an official report. Please retain for your records.</p>
          </div>
        </body>
      </html>
    `;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for resources to load before printing
      printWindow.onload = function() {
        printWindow.print();
        // Close the window after printing (some browsers might block this)
        printWindow.onafterprint = function() {
          printWindow.close();
        };
      };
    } else {
      toast.error("Unable to open print window. Please check your popup blocker settings.");
    }
    
    toast.success("Report sent to printer");
  };

  // Export to CSV
  const exportToCsv = () => {
    let csvContent = '';
    let fileName = '';
    
    if (activeTab === 'sales' && dailySales) {
      // Header
      csvContent = 'Date,Total Sales,Transactions,Average Transaction\n';
      
      // Rows
      dailySales.forEach(sale => {
        csvContent += `${format(new Date(sale.date), 'yyyy-MM-dd')},${sale.totalSales},${sale.totalTransactions},${sale.averageTransaction}\n`;
      });
      
      fileName = `sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    } else if (activeTab === 'products' && productSales) {
      // Header
      csvContent = 'Product,Product ID,Quantity Sold,Revenue\n';
      
      // Rows
      productSales.forEach(product => {
        csvContent += `${product.productName},${product.productId},${product.quantity},${product.revenue}\n`;
      });
      
      fileName = `product-sales-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    }
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Report exported as ${fileName}`);
  };

  // Prepare chart data
  const salesChartData = dailySales?.map(sale => ({
    date: format(new Date(sale.date), 'MMM dd'),
    sales: sale.totalSales,
  })) || [];

  const productChartData = productSales?.slice(0, 5).map(product => ({
    name: product.productName.length > 20 
      ? product.productName.substring(0, 20) + '...' 
      : product.productName,
    value: product.revenue,
  })) || [];

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">View and analyze sales and product performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={exportToCsv}
            className="flex items-center gap-2"
          >
            <Download size={16} /> Export CSV
          </Button>
          <Button 
            onClick={printReport}
            className="flex items-center gap-2"
          >
            <PrinterIcon size={16} /> Print Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select a date range to filter the report data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  className="pl-10"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  className="pl-10"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button className="w-full md:w-auto">
                <SearchIcon className="mr-2 h-4 w-4" /> Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs defaultValue="sales" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <TrendingUp size={16} /> Sales Report
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <ShoppingBag size={16} /> Product Performance
          </TabsTrigger>
        </TabsList>
        
        {/* Sales Report Tab */}
        <TabsContent value="sales" className="space-y-6">
          {isDailySalesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading sales data...</span>
            </div>
          ) : !dailySales || dailySales.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground/30" />
                <h3 className="mt-4 text-lg font-medium">No sales data available</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try changing the date range or check back later
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Sales Summary */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(dailySales.reduce((sum, sale) => sum + sale.totalSales, 0))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dailySales.reduce((sum, sale) => sum + sale.totalTransactions, 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Average Transaction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(
                        dailySales.reduce((sum, sale) => sum + sale.totalSales, 0) /
                        dailySales.reduce((sum, sale) => sum + sale.totalTransactions, 0)
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sales Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Sales Trend</CardTitle>
                  <CardDescription>
                    Sales performance from {format(parseISO(filters.startDate), 'PP')} to {format(parseISO(filters.endDate), 'PP')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={salesChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis 
                          tickFormatter={(value) => formatCurrency(value).replace('.00', '')}
                        />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(value as number), "Sales"]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Bar dataKey="sales" fill="#3b82f6" name="Sales" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Sales Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Sales Breakdown</CardTitle>
                  <CardDescription>
                    Detailed sales data for each day in the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Total Sales</TableHead>
                        <TableHead>Transactions</TableHead>
                        <TableHead>Average Transaction</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailySales.map((sale, index) => (
                        <TableRow key={index}>
                          <TableCell>{format(new Date(sale.date), 'PP')}</TableCell>
                          <TableCell>{formatCurrency(sale.totalSales)}</TableCell>
                          <TableCell>{sale.totalTransactions}</TableCell>
                          <TableCell>{formatCurrency(sale.averageTransaction)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        
        {/* Product Performance Tab */}
        <TabsContent value="products" className="space-y-6">
          {isProductSalesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading product data...</span>
            </div>
          ) : !productSales || productSales.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                <h3 className="mt-4 text-lg font-medium">No product data available</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try changing the date range or check back later
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Product Summary */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Products Sold</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {productSales.reduce((sum, product) => sum + product.quantity, 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(productSales.reduce((sum, product) => sum + product.revenue, 0))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Top Product</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold truncate">
                      {productSales.length > 0 ? productSales.sort((a, b) => b.revenue - a.revenue)[0].productName : 'None'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Product Chart */}
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Products by Revenue</CardTitle>
                    <CardDescription>
                      The 5 best-selling products by revenue
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={productChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {productChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Top Products by Quantity</CardTitle>
                    <CardDescription>
                      Products sold by quantity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={productSales.slice(0, 5).map(product => ({
                            name: product.productName.length > 15 
                              ? product.productName.substring(0, 15) + '...' 
                              : product.productName,
                            quantity: product.quantity,
                          }))}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip />
                          <Bar dataKey="quantity" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Products Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Sales Details</CardTitle>
                  <CardDescription>
                    Detailed sales data for each product in the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity Sold</TableHead>
                        <TableHead>Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productSales.map((product) => (
                        <TableRow key={product.productId}>
                          <TableCell>{product.productName}</TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell>{formatCurrency(product.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
