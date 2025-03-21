
export interface User {
  id: string;
  username: string;
  role: 'admin' | 'cashier';
  name: string;
}

export interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  category: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customer?: Customer;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  status: 'completed' | 'pending' | 'cancelled';
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailySalesReport {
  date: string;
  totalSales: number;
  totalTransactions: number;
  averageTransaction: number;
}

export interface ProductSalesReport {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
}

export interface CashInHand {
  amount: number;
  lastUpdated: string;
}

export interface InventoryAdjustment {
  productId: string;
  quantity: number;
  reason: string;
}
