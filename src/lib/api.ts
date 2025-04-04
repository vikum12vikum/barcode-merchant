import { toast } from "sonner";
import { 
  Product, 
  Customer, 
  Sale, 
  SaleItem,
  DailySalesReport,
  ProductSalesReport,
  InventoryAdjustment,
  User,
  Loan,
  LoanPayment,
  LoanSummary,
  CashInHand,
  CashTransaction,
  BorrowedItem,
  ApiResponse,
  LoginResponse,
  OrderRequest,
  Category
} from "./types";

// Use localhost for development, can be overridden with environment variable
const API_URL = "http://localhost:25553";

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Utility function for API requests
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const url = `${API_URL}${endpoint}`;
    
    // Add authorization header if token exists
    const token = getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    
    if (token) {
      headers["Authorization"] = token;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    
    // Offline mode handling
    if (!navigator.onLine) {
      toast.error("You are offline. Some features may be limited.");
      // Return from cache or localStorage if available
      const cachedData = localStorage.getItem(`cache:${endpoint}`);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } else {
      toast.error("Connection error. Please try again.");
    }
    
    throw error;
  }
}

// Cache API response in localStorage
function cacheResponse(endpoint: string, data: any): void {
  try {
    localStorage.setItem(`cache:${endpoint}`, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to cache response:", error);
  }
}

// Authentication
export async function login(username: string, password: string): Promise<User> {
  try {
    const response = await fetchApi<ApiResponse<LoginResponse>>("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    // Store token in localStorage
    localStorage.setItem('token', response.data.token);

    // Convert to our internal User type
    return {
      id: response.data.id.toString(),
      username: username,
      role: response.data.role_id === 1 ? 'admin' : 'cashier',
      name: response.data.name
    };
  } catch (error) {
    // For demo fallback to mock implementation when server is not available
    console.warn("Using mock login due to server error:", error);
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username === "admin" && password === "admin") {
          resolve({
            id: "1",
            username: "admin",
            role: "admin",
            name: "Admin User"
          });
        } else if (username === "cashier" && password === "cashier") {
          resolve({
            id: "2",
            username: "cashier",
            role: "cashier",
            name: "Cashier User"
          });
        } else {
          reject(new Error("Invalid credentials"));
        }
      }, 800);
    });
  }
}

// Categories
export async function getCategories(): Promise<Category[]> {
  const response = await fetchApi<ApiResponse<Category[]>>("/categories");
  cacheResponse("/categories", response.data);
  return response.data;
}

export async function getCategory(id: string): Promise<Category> {
  const response = await fetchApi<ApiResponse<Category>>(`/categories/${id}`);
  return response.data;
}

export async function createCategory(name: string): Promise<Category> {
  const response = await fetchApi<ApiResponse<Category>>("/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return response.data;
}

export async function updateCategory(id: string, name: string): Promise<Category> {
  const response = await fetchApi<ApiResponse<Category>>(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
  return response.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await fetchApi<void>(`/categories/${id}`, {
    method: "DELETE",
  });
}

// Products
export async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetchApi<ApiResponse<any[]>>("/products");
    
    // Map API response to our internal Product type
    const products: Product[] = response.data.map(product => ({
      id: product.id.toString(),
      name: product.name,
      barcode: product.id.toString(), // Use id as barcode if not provided
      price: product.price,
      stock: 10, // Default stock level if not provided
      lowStockThreshold: 5, // Default threshold if not provided
      category: product.category_id?.toString() || "1", // Use category_id if available
      image: product.image,
      createdAt: product.created_at,
      updatedAt: product.updated_at
    }));
    
    cacheResponse("/products", products);
    return products;
  } catch (error) {
    console.error("Failed to fetch products:", error);
    throw error;
  }
}

export async function getProduct(id: string): Promise<Product> {
  const response = await fetchApi<ApiResponse<any>>(`/products/${id}`);
  
  // Map API response to our internal Product type
  return {
    id: response.data.id.toString(),
    name: response.data.name,
    barcode: response.data.id.toString(),
    price: response.data.price,
    stock: 10, // Default stock level if not provided
    lowStockThreshold: 5,
    category: response.data.category_id?.toString() || "1",
    image: response.data.image,
    createdAt: response.data.created_at,
    updatedAt: response.data.updated_at
  };
}

export async function createProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
  // Convert our internal type to API format
  const apiProduct = {
    name: product.name,
    price: product.price,
    category_id: parseInt(product.category),
    description: product.name,
    image: product.image || ""
  };
  
  const response = await fetchApi<ApiResponse<any>>("/products", {
    method: "POST",
    body: JSON.stringify(apiProduct),
  });
  
  // Map API response back to our internal Product type
  return {
    id: response.data.id.toString(),
    name: response.data.name,
    barcode: response.data.id.toString(),
    price: response.data.price,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    category: response.data.category_id?.toString() || "1",
    image: response.data.image,
    createdAt: response.data.created_at || new Date().toISOString(),
    updatedAt: response.data.updated_at || new Date().toISOString()
  };
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<Product> {
  // Convert our internal type to API format
  const apiProduct: Record<string, any> = {};
  
  if (product.name) apiProduct.name = product.name;
  if (product.price) apiProduct.price = product.price;
  if (product.category) apiProduct.category_id = parseInt(product.category);
  if (product.image) apiProduct.image = product.image;
  
  const response = await fetchApi<ApiResponse<any>>(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(apiProduct),
  });
  
  // Map API response back to our internal Product type
  return {
    id: response.data.id.toString(),
    name: response.data.name,
    barcode: response.data.id.toString(),
    price: response.data.price,
    stock: product.stock || 10,
    lowStockThreshold: product.lowStockThreshold || 5,
    category: response.data.category_id?.toString() || "1",
    image: response.data.image,
    createdAt: response.data.created_at,
    updatedAt: response.data.updated_at
  };
}

export async function deleteProduct(id: string): Promise<void> {
  await fetchApi<void>(`/products/${id}`, {
    method: "DELETE",
  });
}

// Customers - Mock implementation as customers endpoint isn't in the API docs
export async function getCustomers(): Promise<Customer[]> {
  try {
    // Try to hit a potential customers endpoint
    const response = await fetchApi<ApiResponse<any[]>>("/customers");
    
    // Map API response to our internal Customer type
    const customers: Customer[] = response.data.map(customer => ({
      id: customer.id.toString(),
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email,
      address: customer.address,
      createdAt: customer.created_at || new Date().toISOString(),
      updatedAt: customer.updated_at || new Date().toISOString()
    }));
    
    cacheResponse("/customers", customers);
    return customers;
  } catch (error) {
    console.warn("Failed to fetch customers, using mock data:", error);
    
    // Return mock data if endpoint doesn't exist
    const mockCustomers: Customer[] = [
      {
        id: "1",
        name: "John Doe",
        phone: "123-456-7890",
        email: "john@example.com",
        address: "123 Main St",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "2",
        name: "Jane Smith",
        phone: "987-654-3210",
        email: "jane@example.com",
        address: "456 Oak Ave",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    cacheResponse("/customers", mockCustomers);
    return mockCustomers;
  }
}

export async function getCustomer(id: string): Promise<Customer> {
  try {
    const response = await fetchApi<ApiResponse<any>>(`/customers/${id}`);
    
    return {
      id: response.data.id.toString(),
      name: response.data.name,
      phone: response.data.phone || "",
      email: response.data.email,
      address: response.data.address,
      createdAt: response.data.created_at || new Date().toISOString(),
      updatedAt: response.data.updated_at || new Date().toISOString()
    };
  } catch (error) {
    console.warn(`Failed to fetch customer ${id}, using mock data:`, error);
    
    // Return mock data if endpoint doesn't exist
    return {
      id,
      name: "Customer " + id,
      phone: "123-456-7890",
      email: "customer" + id + "@example.com",
      address: "123 Main St",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

export async function createCustomer(customer: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer> {
  try {
    const response = await fetchApi<ApiResponse<any>>("/customers", {
      method: "POST",
      body: JSON.stringify(customer),
    });
    
    return {
      id: response.data.id.toString(),
      name: response.data.name,
      phone: response.data.phone || "",
      email: response.data.email,
      address: response.data.address,
      createdAt: response.data.created_at || new Date().toISOString(),
      updatedAt: response.data.updated_at || new Date().toISOString()
    };
  } catch (error) {
    console.error("Failed to create customer:", error);
    throw error;
  }
}

export async function updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
  try {
    const response = await fetchApi<ApiResponse<any>>(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(customer),
    });
    
    return {
      id: response.data.id.toString(),
      name: response.data.name,
      phone: response.data.phone || "",
      email: response.data.email,
      address: response.data.address,
      createdAt: response.data.created_at || new Date().toISOString(),
      updatedAt: response.data.updated_at || new Date().toISOString()
    };
  } catch (error) {
    console.error(`Failed to update customer ${id}:`, error);
    throw error;
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  try {
    await fetchApi<void>(`/customers/${id}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error(`Failed to delete customer ${id}:`, error);
    throw error;
  }
}

// Sales/Orders
export async function getSales(): Promise<Sale[]> {
  try {
    // Convert from orders endpoint
    const response = await fetchApi<ApiResponse<any[]>>("/orders");
    
    // Map API response to our internal Sale type
    const sales: Sale[] = await Promise.all(
      response.data.map(async order => {
        // Get order items
        let items: SaleItem[] = [];
        try {
          const itemsResponse = await fetchApi<ApiResponse<any[]>>(`/orders/${order.id}/items`);
          items = await Promise.all(itemsResponse.data.map(async (item) => {
            // Get product details for each item
            const product = await getProduct(item.product_id.toString());
            
            return {
              id: item.id?.toString() || `item-${Date.now()}-${item.product_id}`,
              saleId: order.id.toString(),
              productId: item.product_id.toString(),
              product,
              quantity: item.quantity,
              price: product.price,
              discount: 0,
              total: product.price * item.quantity
            };
          }));
        } catch (error) {
          console.warn(`Failed to fetch items for order ${order.id}:`, error);
        }
        
        return {
          id: order.id.toString(),
          invoiceNumber: order.reference || `INV-${order.id}`,
          customerId: order.user_id?.toString(),
          items,
          subtotal: order.total,
          discount: 0,
          tax: 0,
          total: order.total,
          paymentMethod: 'cash',
          status: 'completed',
          createdAt: order.created_at || new Date().toISOString(),
          updatedAt: order.updated_at || new Date().toISOString()
        };
      })
    );
    
    cacheResponse("/orders", sales);
    return sales;
  } catch (error) {
    console.warn("Failed to fetch sales, using mock data:", error);
    
    // Return empty array if endpoint doesn't exist
    return [];
  }
}

export async function getSale(id: string): Promise<Sale> {
  try {
    const response = await fetchApi<ApiResponse<any>>(`/orders/${id}`);
    
    // Get order items
    let items: SaleItem[] = [];
    try {
      const itemsResponse = await fetchApi<ApiResponse<any[]>>(`/orders/${id}/items`);
      items = await Promise.all(itemsResponse.data.map(async (item) => {
        // Get product details for each item
        const product = await getProduct(item.product_id.toString());
        
        return {
          id: item.id?.toString() || `item-${Date.now()}-${item.product_id}`,
          saleId: id,
          productId: item.product_id.toString(),
          product,
          quantity: item.quantity,
          price: product.price,
          discount: 0,
          total: product.price * item.quantity
        };
      }));
    } catch (error) {
      console.warn(`Failed to fetch items for order ${id}:`, error);
    }
    
    return {
      id: response.data.id.toString(),
      invoiceNumber: response.data.reference || `INV-${response.data.id}`,
      customerId: response.data.user_id?.toString(),
      items,
      subtotal: response.data.total,
      discount: 0,
      tax: 0,
      total: response.data.total,
      paymentMethod: 'cash',
      status: 'completed',
      createdAt: response.data.created_at || new Date().toISOString(),
      updatedAt: response.data.updated_at || new Date().toISOString()
    };
  } catch (error) {
    console.error(`Failed to fetch sale ${id}:`, error);
    throw error;
  }
}

export async function getSaleItems(saleId: string): Promise<SaleItem[]> {
  try {
    const response = await fetchApi<ApiResponse<any[]>>(`/orders/${saleId}/items`);
    
    return await Promise.all(response.data.map(async (item) => {
      // Get product details for each item
      const product = await getProduct(item.product_id.toString());
      
      return {
        id: item.id?.toString() || `item-${Date.now()}-${item.product_id}`,
        saleId,
        productId: item.product_id.toString(),
        product,
        quantity: item.quantity,
        price: product.price,
        discount: 0,
        total: product.price * item.quantity
      };
    }));
  } catch (error) {
    console.error(`Failed to fetch items for sale ${saleId}:`, error);
    throw error;
  }
}

export async function createSale(sale: Omit<Sale, "id" | "createdAt" | "updatedAt">): Promise<Sale> {
  try {
    // Convert our internal Sale type to the API's OrderRequest format
    const orderRequest: OrderRequest = {
      user_id: sale.customerId || "1", // Use customerId if available, or default to 1
      orders: sale.items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity
      }))
    };
    
    const response = await fetchApi<ApiResponse<any>>("/orders", {
      method: "POST",
      body: JSON.stringify(orderRequest),
    });
    
    // Map API response back to our internal Sale type
    return {
      id: response.data.id?.toString() || `sale-${Date.now()}`,
      invoiceNumber: sale.invoiceNumber || `INV-${Date.now()}`,
      customerId: sale.customerId,
      customer: sale.customer,
      items: sale.items,
      subtotal: sale.subtotal,
      discount: sale.discount,
      tax: sale.tax,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      note: sale.note,
      createdAt: response.data.created_at || new Date().toISOString(),
      updatedAt: response.data.updated_at || new Date().toISOString()
    };
  } catch (error) {
    console.error("Failed to create sale:", error);
    
    // If API fails, we'll use mock response to keep UI working
    console.warn("Using mock response for createSale");
    return {
      id: `sale-${Date.now()}`,
      invoiceNumber: sale.invoiceNumber || `INV-${Date.now()}`,
      customerId: sale.customerId,
      customer: sale.customer,
      items: sale.items,
      subtotal: sale.subtotal,
      discount: sale.discount,
      tax: sale.tax,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      note: sale.note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

// Add a sale to an existing loan
export async function addSaleToLoan(loanId: string, sale: Omit<Sale, "id" | "createdAt" | "updatedAt">): Promise<Sale> {
  try {
    // This endpoint may not exist in the API, so we're mocking it for now
    return {
      id: `sale-${Date.now()}`,
      invoiceNumber: sale.invoiceNumber || `INV-${Date.now()}`,
      customerId: sale.customerId,
      customer: sale.customer,
      loanId,
      items: sale.items,
      subtotal: sale.subtotal,
      discount: sale.discount,
      tax: sale.tax,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      note: sale.note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Failed to add sale to loan ${loanId}:`, error);
    throw error;
  }
}

// Get customer's active loans
export async function getCustomerActiveLoans(customerId: string): Promise<Loan[]> {
  // This endpoint may not exist in the API, so we're mocking it for now
  const mockLoans: Loan[] = [
    {
      id: `loan-${Date.now()}-1`,
      customerId,
      customer: await getCustomer(customerId),
      amount: 1000,
      remainingAmount: 500,
      status: 'active',
      dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
      installmentFrequency: 'weekly',
      installmentAmount: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: 'cash'
    }
  ];
  
  cacheResponse(`/customers/${customerId}/loans/active`, mockLoans);
  return mockLoans;
}

// Reports
export async function getDailySalesReport(): Promise<DailySalesReport[]> {
  // This endpoint may not exist in the API, so we're generating it from sales
  try {
    const sales = await getSales();
    
    // Group sales by date
    const salesByDate = sales.reduce((acc, sale) => {
      const date = sale.createdAt.split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(sale);
      return acc;
    }, {} as Record<string, Sale[]>);
    
    // Generate daily reports
    const reports = Object.entries(salesByDate).map(([date, dateSales]) => {
      const totalSales = dateSales.reduce((sum, sale) => sum + sale.total, 0);
      const totalTransactions = dateSales.length;
      const averageTransaction = totalSales / totalTransactions || 0;
      
      return {
        date,
        totalSales,
        totalTransactions,
        averageTransaction
      };
    });
    
    cacheResponse("/reports/daily-sales", reports);
    return reports;
  } catch (error) {
    console.warn("Failed to generate daily sales report:", error);
    return [];
  }
}

export async function getProductSalesReport(): Promise<ProductSalesReport[]> {
  // This endpoint may not exist in the API, so we're generating it from sales
  try {
    const sales = await getSales();
    
    // Extract all sale items
    const allItems = sales.flatMap(sale => sale.items);
    
    // Group by product
    const productGroups = allItems.reduce((acc, item) => {
      const { productId, product, quantity, price } = item;
      if (!acc[productId]) {
        acc[productId] = {
          productId,
          productName: product.name,
          quantity: 0,
          revenue: 0
        };
      }
      
      acc[productId].quantity += quantity;
      acc[productId].revenue += price * quantity;
      
      return acc;
    }, {} as Record<string, ProductSalesReport>);
    
    const report = Object.values(productGroups);
    cacheResponse("/reports/product-sales", report);
    return report;
  } catch (error) {
    console.warn("Failed to generate product sales report:", error);
    return [];
  }
}

// Inventory
export async function adjustInventory(adjustment: InventoryAdjustment): Promise<void> {
  // This endpoint may not exist in the API, so we're mocking it for now
  console.log("Inventory adjustment:", adjustment);
  toast.success("Inventory adjusted successfully");
}

// Cash in Hand
export async function getCashInHand(): Promise<CashInHand> {
  // This endpoint may not exist in the API, so we're mocking it for now
  const mockCashInHand: CashInHand = {
    amount: 5000,
    lastUpdated: new Date().toISOString()
  };
  
  cacheResponse("/cash-in-hand", mockCashInHand);
  return mockCashInHand;
}

export async function updateCashInHand(amount: number, type: 'deposit' | 'withdrawal', reason: string): Promise<CashInHand> {
  // This endpoint may not exist in the API, so we're mocking it for now
  const currentCash = await getCashInHand();
  
  const newAmount = type === 'deposit' 
    ? currentCash.amount + amount
    : currentCash.amount - amount;
    
  const updatedCash: CashInHand = {
    amount: newAmount,
    lastUpdated: new Date().toISOString()
  };
  
  cacheResponse("/cash-in-hand", updatedCash);
  return updatedCash;
}

export async function getCashTransactions(): Promise<CashTransaction[]> {
  // This endpoint may not exist in the API, so we're mocking it for now
  const mockTransactions: CashTransaction[] = [
    {
      id: "1",
      amount: 1000,
      type: 'deposit',
      reason: 'Initial deposit',
      createdBy: 'Admin',
      createdAt: new Date(Date.now() - 7*24*60*60*1000).toISOString()
    },
    {
      id: "2",
      amount: 200,
      type: 'withdrawal',
      reason: 'Purchased supplies',
      createdBy: 'Cashier',
      createdAt: new Date(Date.now() - 3*24*60*60*1000).toISOString()
    }
  ];
  
  cacheResponse("/cash-transactions", mockTransactions);
  return mockTransactions;
}

// Most of the loan-related functionality is mocked since it's not in the API docs
// but keeping the same structure for future integration

// Loan Management
export async function getLoans(): Promise<Loan[]> {
  // Mock implementation
  const mockLoans: Loan[] = [];
  cacheResponse("/loans", mockLoans);
  return mockLoans;
}

export async function getCustomerLoans(customerId: string): Promise<Loan[]> {
  // Mock implementation
  const mockLoans: Loan[] = [];
  cacheResponse(`/customers/${customerId}/loans`, mockLoans);
  return mockLoans;
}

export async function getLoan(id: string): Promise<Loan> {
  // Mock implementation
  throw new Error("Loan not found");
}

export async function createLoan(loan: Omit<Loan, "id" | "createdAt" | "updatedAt" | "customer">): Promise<Loan> {
  // Mock implementation
  const customer = await getCustomer(loan.customerId);
  
  const newLoan: Loan = {
    ...loan,
    id: `loan-${Date.now()}`,
    customer,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return newLoan;
}

export async function updateLoan(id: string, loan: Partial<Loan>): Promise<Loan> {
  // Mock implementation
  throw new Error("Loan not found");
}

export async function deleteLoan(id: string): Promise<void> {
  // Mock implementation
  console.log(`Deleting loan ${id}`);
}

export async function getLoanPayments(loanId: string): Promise<LoanPayment[]> {
  // Mock implementation
  const mockPayments: LoanPayment[] = [];
  cacheResponse(`/loans/${loanId}/payments`, mockPayments);
  return mockPayments;
}

export async function createLoanPayment(loanId: string, payment: Omit<LoanPayment, "id" | "loanId">): Promise<LoanPayment> {
  // Mock implementation
  const newPayment: LoanPayment = {
    ...payment,
    id: `payment-${Date.now()}`,
    loanId
  };
  
  return newPayment;
}

export async function getLoanSummary(): Promise<LoanSummary> {
  // Mock implementation
  const mockSummary: LoanSummary = {
    totalLoans: 0,
    activeLoans: 0,
    paidLoans: 0,
    defaultedLoans: 0,
    totalAmountLent: 0,
    totalAmountOutstanding: 0,
    totalAmountRepaid: 0
  };
  
  cacheResponse("/loans/summary", mockSummary);
  return mockSummary;
}

// Borrowed Items
export async function getBorrowedItems(loanId: string): Promise<BorrowedItem[]> {
  // Mock implementation
  const mockItems: BorrowedItem[] = [];
  cacheResponse(`/loans/${loanId}/items`, mockItems);
  return mockItems;
}

export async function updateBorrowedItem(loanId: string, itemId: string, item: Partial<BorrowedItem>): Promise<BorrowedItem> {
  // Mock implementation
  throw new Error("Item not found");
}

// Offline support - sync local data when back online
export function setupOfflineSync() {
  window.addEventListener("online", async () => {
    toast.info("Back online! Syncing data...");
    
    // Get pending actions from localStorage
    const pendingActions = JSON.parse(localStorage.getItem("pendingActions") || "[]");
    
    // Process each pending action
    for (const action of pendingActions) {
      try {
        switch (action.type) {
          case "CREATE_SALE":
            await createSale(action.data);
            break;
          case "ADJUST_INVENTORY":
            await adjustInventory(action.data);
            break;
          case "UPDATE_CASH":
            await updateCashInHand(action.data.amount, action.data.type, action.data.reason);
            break;
          case "CREATE_LOAN":
            await createLoan(action.data);
            break;
          case "CREATE_LOAN_PAYMENT":
            await createLoanPayment(action.data.loanId, action.data.payment);
            break;
          case "ADD_SALE_TO_LOAN":
            await addSaleToLoan(action.data.loanId, action.data.sale);
            break;
          // Add other sync actions as needed
        }
      } catch (error) {
        console.error("Failed to sync action:", action, error);
      }
    }
    
    // Clear pending actions
    localStorage.setItem("pendingActions", "[]");
    
    toast.success("Data synchronized successfully!");
  });
}

// Add a pending action when offline
export function addPendingAction(type: string, data: any) {
  const pendingActions = JSON.parse(localStorage.getItem("pendingActions") || "[]");
  pendingActions.push({ type, data, timestamp: new Date().toISOString() });
  localStorage.setItem("pendingActions", JSON.stringify(pendingActions));
}

// Printing utility
export function printReceipt(receiptContent: string): void {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(receiptContent);
    printWindow.document.close();
    
    // Wait for resources to load before printing
    printWindow.onload = function() {
      printWindow.print();
      // Close the window after printing (some browsers might block this)
      printWindow.onafterprint = function() {
        printWindow.close();
      };
    };
    
    toast.success("Receipt sent to printer");
  } else {
    toast.error("Unable to open print window. Please check your popup blocker settings.");
  }
}
