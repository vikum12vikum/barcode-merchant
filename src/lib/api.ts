
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
  BorrowedItem
} from "./types";

const API_URL = "http://95.164.54.64:25553";

// Utility function for API requests
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
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
  // Mock implementation - in a real app, this would be a proper login endpoint
  // For demo, we're returning a mock user based on username
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

// Products
export async function getProducts(): Promise<Product[]> {
  const data = await fetchApi<Product[]>("/api/products");
  cacheResponse("/api/products", data);
  return data;
}

export async function getProduct(id: string): Promise<Product> {
  return fetchApi<Product>(`/api/products/${id}`);
}

export async function createProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
  return fetchApi<Product>("/api/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<Product> {
  return fetchApi<Product>(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  return fetchApi<void>(`/api/products/${id}`, {
    method: "DELETE",
  });
}

// Customers
export async function getCustomers(): Promise<Customer[]> {
  const data = await fetchApi<Customer[]>("/api/customers");
  cacheResponse("/api/customers", data);
  return data;
}

export async function getCustomer(id: string): Promise<Customer> {
  return fetchApi<Customer>(`/api/customers/${id}`);
}

export async function createCustomer(customer: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer> {
  return fetchApi<Customer>("/api/customers", {
    method: "POST",
    body: JSON.stringify(customer),
  });
}

export async function updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
  return fetchApi<Customer>(`/api/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(customer),
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  return fetchApi<void>(`/api/customers/${id}`, {
    method: "DELETE",
  });
}

// Sales
export async function getSales(): Promise<Sale[]> {
  const data = await fetchApi<Sale[]>("/api/sales");
  cacheResponse("/api/sales", data);
  return data;
}

export async function getSale(id: string): Promise<Sale> {
  return fetchApi<Sale>(`/api/sales/${id}`);
}

export async function getSaleItems(saleId: string): Promise<SaleItem[]> {
  return fetchApi<SaleItem[]>(`/api/sales/${saleId}/items`);
}

export async function createSale(sale: Omit<Sale, "id" | "createdAt" | "updatedAt">): Promise<Sale> {
  return fetchApi<Sale>("/api/sales", {
    method: "POST",
    body: JSON.stringify(sale),
  });
}

// Add a sale to an existing loan
export async function addSaleToLoan(loanId: string, sale: Omit<Sale, "id" | "createdAt" | "updatedAt">): Promise<Sale> {
  return fetchApi<Sale>(`/api/loans/${loanId}/sales`, {
    method: "POST",
    body: JSON.stringify(sale),
  });
}

// Get customer's active loans
export async function getCustomerActiveLoans(customerId: string): Promise<Loan[]> {
  const data = await fetchApi<Loan[]>(`/api/customers/${customerId}/loans/active`);
  cacheResponse(`/api/customers/${customerId}/loans/active`, data);
  return data;
}

// Reports
export async function getDailySalesReport(): Promise<DailySalesReport[]> {
  const data = await fetchApi<DailySalesReport[]>("/api/reports/daily-sales");
  cacheResponse("/api/reports/daily-sales", data);
  return data;
}

export async function getProductSalesReport(): Promise<ProductSalesReport[]> {
  const data = await fetchApi<ProductSalesReport[]>("/api/reports/product-sales");
  cacheResponse("/api/reports/product-sales", data);
  return data;
}

// Inventory
export async function adjustInventory(adjustment: InventoryAdjustment): Promise<void> {
  return fetchApi<void>("/api/inventory/adjust", {
    method: "POST",
    body: JSON.stringify(adjustment),
  });
}

// Cash in Hand
export async function getCashInHand(): Promise<CashInHand> {
  const data = await fetchApi<CashInHand>("/api/cash-in-hand");
  cacheResponse("/api/cash-in-hand", data);
  return data;
}

export async function updateCashInHand(amount: number, type: 'deposit' | 'withdrawal', reason: string): Promise<CashInHand> {
  return fetchApi<CashInHand>("/api/cash-in-hand", {
    method: "POST",
    body: JSON.stringify({
      amount,
      type,
      reason
    }),
  });
}

export async function getCashTransactions(): Promise<CashTransaction[]> {
  const data = await fetchApi<CashTransaction[]>("/api/cash-transactions");
  cacheResponse("/api/cash-transactions", data);
  return data;
}

// Loan Management
export async function getLoans(): Promise<Loan[]> {
  const data = await fetchApi<Loan[]>("/api/loans");
  cacheResponse("/api/loans", data);
  return data;
}

export async function getCustomerLoans(customerId: string): Promise<Loan[]> {
  const data = await fetchApi<Loan[]>(`/api/customers/${customerId}/loans`);
  cacheResponse(`/api/customers/${customerId}/loans`, data);
  return data;
}

export async function getLoan(id: string): Promise<Loan> {
  return fetchApi<Loan>(`/api/loans/${id}`);
}

export async function createLoan(loan: Omit<Loan, "id" | "createdAt" | "updatedAt" | "customer">): Promise<Loan> {
  return fetchApi<Loan>("/api/loans", {
    method: "POST",
    body: JSON.stringify(loan),
  });
}

export async function updateLoan(id: string, loan: Partial<Loan>): Promise<Loan> {
  return fetchApi<Loan>(`/api/loans/${id}`, {
    method: "PUT",
    body: JSON.stringify(loan),
  });
}

export async function deleteLoan(id: string): Promise<void> {
  return fetchApi<void>(`/api/loans/${id}`, {
    method: "DELETE",
  });
}

export async function getLoanPayments(loanId: string): Promise<LoanPayment[]> {
  const data = await fetchApi<LoanPayment[]>(`/api/loans/${loanId}/payments`);
  cacheResponse(`/api/loans/${loanId}/payments`, data);
  return data;
}

export async function createLoanPayment(loanId: string, payment: Omit<LoanPayment, "id" | "loanId">): Promise<LoanPayment> {
  return fetchApi<LoanPayment>(`/api/loans/${loanId}/payments`, {
    method: "POST",
    body: JSON.stringify(payment),
  });
}

export async function getLoanSummary(): Promise<LoanSummary> {
  const data = await fetchApi<LoanSummary>("/api/loans/summary");
  cacheResponse("/api/loans/summary", data);
  return data;
}

// Borrowed Items
export async function getBorrowedItems(loanId: string): Promise<BorrowedItem[]> {
  const data = await fetchApi<BorrowedItem[]>(`/api/loans/${loanId}/items`);
  cacheResponse(`/api/loans/${loanId}/items`, data);
  return data;
}

export async function updateBorrowedItem(loanId: string, itemId: string, item: Partial<BorrowedItem>): Promise<BorrowedItem> {
  return fetchApi<BorrowedItem>(`/api/loans/${loanId}/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(item),
  });
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
