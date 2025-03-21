
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getProducts, getSales, getDailySalesReport } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Package, ShoppingCart, AlertTriangle, ArrowUpRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Simulated data for initial display
  const [salesData, setSalesData] = useState([
    { date: "Mon", sales: 1200 },
    { date: "Tue", sales: 1800 },
    { date: "Wed", sales: 1400 },
    { date: "Thu", sales: 2000 },
    { date: "Fri", sales: 2400 },
    { date: "Sat", sales: 1800 },
    { date: "Sun", sales: 1200 },
  ]);

  // Get products
  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  // Get sales
  const salesQuery = useQuery({
    queryKey: ["sales"],
    queryFn: getSales,
  });

  // Get daily sales report
  const dailySalesQuery = useQuery({
    queryKey: ["dailySales"],
    queryFn: getDailySalesReport,
  });

  // Set loading state based on all queries
  useEffect(() => {
    const allQueriesSettled = 
      !productsQuery.isLoading && 
      !salesQuery.isLoading && 
      !dailySalesQuery.isLoading;
    
    if (allQueriesSettled) {
      setIsLoading(false);
    }
  }, [productsQuery.isLoading, salesQuery.isLoading, dailySalesQuery.isLoading]);

  // Calculate low stock products
  const lowStockProducts = productsQuery.data?.filter(
    (product) => product.stock <= product.lowStockThreshold
  ) || [];

  // Calculate total sales amount
  const totalSales = salesQuery.data?.reduce(
    (sum, sale) => sum + sale.total,
    0
  ) || 0;

  // Calculate total sales count
  const totalSalesCount = salesQuery.data?.length || 0;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}!
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Sales Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="animate-pulse h-8 w-24 bg-muted rounded" />
              ) : (
                formatCurrency(totalSales)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? (
                <div className="animate-pulse h-4 w-32 bg-muted rounded mt-1" />
              ) : (
                <>
                  <span className="text-green-500 inline-flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    12.5%
                  </span>
                  {" "}from last week
                </>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Total Transactions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="animate-pulse h-8 w-16 bg-muted rounded" />
              ) : (
                totalSalesCount
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? (
                <div className="animate-pulse h-4 w-32 bg-muted rounded mt-1" />
              ) : (
                <>
                  <span className="text-green-500 inline-flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    8.2%
                  </span>
                  {" "}from last week
                </>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Low Stock Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="animate-pulse h-8 w-16 bg-muted rounded" />
              ) : (
                lowStockProducts.length
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? (
                <div className="animate-pulse h-4 w-32 bg-muted rounded mt-1" />
              ) : lowStockProducts.length > 0 ? (
                <span className="text-amber-500 inline-flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Requires attention
                </span>
              ) : (
                "All stock levels are good"
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
          <CardDescription>Sales trends for the past week</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-80">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={salesData} margin={{ top: 20, right: 0, left: 0, bottom: 20 }}>
                <XAxis 
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  width={80}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`$${value}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    border: 'none',
                  }}
                />
                <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                  {salesData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.sales > 2000 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.5)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Products</CardTitle>
          <CardDescription>Products that need restocking</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="skeleton h-12 w-12 rounded" />
                  <div className="space-y-2">
                    <div className="skeleton h-4 w-40" />
                    <div className="skeleton h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : lowStockProducts.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              All products are well stocked!
            </div>
          ) : (
            <div className="space-y-4">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div 
                  key={product.id} 
                  className={cn(
                    "flex items-center gap-4 p-2 rounded-lg",
                    product.stock === 0 ? "bg-destructive/10" : "bg-amber-50/50"
                  )}
                >
                  <div className="h-12 w-12 bg-secondary/50 rounded-md flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Stock: {product.stock} / Threshold: {product.lowStockThreshold}
                    </p>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    product.stock === 0 
                      ? "bg-destructive/20 text-destructive" 
                      : "bg-amber-100 text-amber-800"
                  )}>
                    {product.stock === 0 ? "Out of Stock" : "Low Stock"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
