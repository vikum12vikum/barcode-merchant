
import { toast } from "sonner";
import { 
  Product, 
  Customer, 
  Sale, 
  SaleItem,
  DailySalesReport,
  ProductSalesReport,
  InventoryAdjustment,
  User
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
