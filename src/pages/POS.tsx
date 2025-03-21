
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProducts, getCustomers, createSale } from "@/lib/api";
import { Product, Customer, Sale } from "@/lib/types";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Search, 
  User, 
  ShoppingCart, 
  Receipt, 
  Trash, 
  Plus,
  PercentIcon,
  Banknote,
  CreditCard,
  Wallet,
  PrinterIcon,
  Loader2
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function POS() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "digital">("cash");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [amountPaid, setAmountPaid] = useState("");
  const [note, setNote] = useState("");

  // Fetch products
  const { data: products, isLoading: isProductsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  // Fetch customers
  const { data: customers, isLoading: isCustomersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });

  // Calculate cart totals
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const discountAmount = (subtotal * parseFloat(discountPercent || "0")) / 100;
  const total = subtotal - discountAmount;
  const change = parseFloat(amountPaid || "0") - total;

  // Filter products
  const filteredProducts = products
    ? products.filter((product) => {
        const matchesSearch =
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.barcode.includes(searchQuery);
        
        const matchesCategory =
          categoryFilter === "all" || product.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
      })
    : [];

  // Get unique categories
  const categories = products
    ? Array.from(new Set(products.map((product) => product.category)))
    : [];

  // Handle barcode scan
  const handleBarcodeScan = (barcode: string) => {
    const product = products?.find((p) => p.barcode === barcode);
    
    if (product) {
      addToCart(product);
      toast.success(`Added: ${product.name}`);
    } else {
      toast.error("Product not found");
    }
  };

  // Add to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error("Product is out of stock");
      return;
    }
    
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product.id === product.id
      );
      
      if (existingItem) {
        // Check if we have enough stock
        if (existingItem.quantity >= product.stock) {
          toast.error("Not enough stock available");
          return prevCart;
        }
        
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  // Remove from cart
  const removeFromCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product.id === product.id
      );
      
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      
      return prevCart.filter((item) => item.product.id !== product.id);
    });
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setDiscountPercent("0");
    setNote("");
  };

  // Handle checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    
    setIsPaymentDialogOpen(true);
  };

  // Handle payment
  const handlePayment = async () => {
    setIsCheckoutLoading(true);
    
    try {
      const sale: Omit<Sale, "id" | "createdAt" | "updatedAt"> = {
        invoiceNumber: `INV-${Date.now()}`,
        customerId: selectedCustomer?.id,
        customer: selectedCustomer ?? undefined,
        items: cart.map((item) => ({
          id: `item-${Date.now()}-${item.product.id}`,
          saleId: "",
          productId: item.product.id,
          product: item.product,
          quantity: item.quantity,
          price: item.product.price,
          discount: 0,
          total: item.product.price * item.quantity,
        })),
        subtotal,
        discount: discountAmount,
        tax: 0,
        total,
        paymentMethod,
        status: "completed",
        note: note || undefined,
      };
      
      // In a real app, this would be an API call to create a sale
      // For demo, we're mocking the response
      // await createSale(sale);
      
      // Mock successful sale
      setTimeout(() => {
        toast.success("Sale completed successfully");
        
        // Clear cart and reset state
        clearCart();
        setIsPaymentDialogOpen(false);
        setPaymentMethod("cash");
        setAmountPaid("");
        setIsCheckoutLoading(false);
        
        // Print receipt
        printReceipt(sale);
      }, 1000);
    } catch (error) {
      console.error("Failed to complete sale:", error);
      toast.error("Failed to complete sale");
      setIsCheckoutLoading(false);
    }
  };

  // Print receipt
  const printReceipt = (sale: Omit<Sale, "id" | "createdAt" | "updatedAt">) => {
    // In a real app, this would print a receipt
    console.log("Printing receipt for sale:", sale);
    toast.info("Receipt sent to printer");
  };

  return (
    <div className="h-[calc(100vh-theme(spacing.6)*2)] flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row h-full gap-6">
        {/* Products Section */}
        <div className="w-full md:w-2/3 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Point of Sale</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearCart}>
                <Trash size={16} className="mr-2" /> Clear
              </Button>
              <Button onClick={handleCheckout} disabled={cart.length === 0}>
                <ShoppingCart size={16} className="mr-2" /> Checkout
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <BarcodeScanner onScan={handleBarcodeScan} />

          <div className="mt-4 overflow-y-auto flex-1">
            {isProductsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] rounded-lg skeleton" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
                <h3 className="text-lg font-medium">No products found</h3>
                <p className="text-sm text-muted-foreground">
                  Try a different search term
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map((product) => {
                  const cartItem = cart.find(
                    (item) => item.product.id === product.id
                  );
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isPos
                      quantity={cartItem?.quantity || 0}
                      onAdd={() => addToCart(product)}
                      onRemove={() => removeFromCart(product)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-full md:w-1/3 flex flex-col overflow-hidden">
          <Card className="flex flex-col h-full overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Cart</CardTitle>
                <Badge variant="outline" className="font-normal">
                  {cart.length} {cart.length === 1 ? "item" : "items"}
                </Badge>
              </div>
              <CardDescription>
                {cart.reduce((sum, item) => sum + item.quantity, 0)} products in cart
              </CardDescription>
            </CardHeader>
            
            <Separator />
            
            {/* Customer Selection */}
            <div className="p-4 bg-secondary/30">
              <div className="flex items-center gap-2">
                <User size={16} className="text-muted-foreground" />
                <Select 
                  value={selectedCustomer?.id || ""}
                  onValueChange={(value) => {
                    if (value === "guest") {
                      setSelectedCustomer(null);
                    } else {
                      const customer = customers?.find((c) => c.id === value);
                      setSelectedCustomer(customer || null);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer or guest checkout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guest">Guest Checkout</SelectItem>
                    <Separator className="my-1" />
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Separator />
            
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground">
                    Your cart is empty
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Scan a barcode or search for products to add
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between gap-4 p-2 rounded-md bg-secondary/30"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium truncate">
                        {item.product.name}
                      </h4>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>
                          ${item.product.price.toFixed(2)} × {item.quantity}
                        </span>
                        <span className="font-medium text-foreground">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeFromCart(item.product)}
                      >
                        <Minus size={14} />
                      </Button>
                      <span className="w-6 text-center">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => addToCart(item.product)}
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Cart Totals */}
            <div className="p-4 space-y-2 bg-secondary/30">
              {discountPercent !== "0" && (
                <div className="flex items-center gap-2 text-sm">
                  <PercentIcon size={14} className="text-muted-foreground" />
                  <span>Discount ({discountPercent}%)</span>
                  <span className="ml-auto">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div className="font-medium">Total</div>
                <div className="text-xl font-bold">${total.toFixed(2)}</div>
              </div>
            </div>
            
            <Separator />
            
            {/* Actions */}
            <CardFooter className="pt-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 w-full">
                <Input
                  placeholder="Discount %"
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const input = document.createElement("textarea");
                    input.value = note;
                    setNote(input.value);
                  }}
                >
                  Add Note
                </Button>
              </div>
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                <ShoppingCart size={16} className="mr-2" />
                Checkout
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <h3 className="font-medium">Order Summary</h3>
              <div className="rounded-md border bg-secondary/30 p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discountPercent !== "0" && (
                  <div className="flex justify-between text-sm">
                    <span>Discount ({discountPercent}%)</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-1" />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <Tabs defaultValue="cash" onValueChange={(value) => setPaymentMethod(value as any)}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="cash" className="flex items-center gap-2">
                  <Banknote size={14} />
                  <span>Cash</span>
                </TabsTrigger>
                <TabsTrigger value="card" className="flex items-center gap-2">
                  <CreditCard size={14} />
                  <span>Card</span>
                </TabsTrigger>
                <TabsTrigger value="digital" className="flex items-center gap-2">
                  <Wallet size={14} />
                  <span>Digital</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="cash" className="space-y-3 pt-3">
                <div className="space-y-2">
                  <Label htmlFor="amount-paid">Amount Paid</Label>
                  <Input
                    id="amount-paid"
                    type="number"
                    min={total}
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder={total.toFixed(2)}
                  />
                </div>
                
                {parseFloat(amountPaid) >= total && (
                  <div className="rounded-md bg-secondary/50 p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Change:</span>
                      <span className="font-bold">${change.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="card" className="space-y-3 pt-3">
                <div className="p-4 text-center space-y-2">
                  <CreditCard className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p>Customer will pay by card</p>
                </div>
              </TabsContent>
              
              <TabsContent value="digital" className="space-y-3 pt-3">
                <div className="p-4 text-center space-y-2">
                  <Wallet className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p>Customer will pay using digital wallet</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
              className="sm:flex-1"
              disabled={isCheckoutLoading}
            >
              Cancel
            </Button>
            <Button
              className="sm:flex-1"
              onClick={handlePayment}
              disabled={isCheckoutLoading || (paymentMethod === "cash" && parseFloat(amountPaid || "0") < total)}
            >
              {isCheckoutLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Receipt className="mr-2 h-4 w-4" />
                  Complete Sale
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
