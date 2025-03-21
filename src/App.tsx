
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "./components/ui/sonner";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Sales from "./pages/Sales";
import Loans from "./pages/Loans";
import LoanDetails from "./pages/LoanDetails";
import CashInHand from "./pages/CashInHand";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import { Navigation } from "./components/layout/Navigation";
import { setupOfflineSync } from "./lib/api";
import "./App.css";

// Initialize query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Setup offline sync
setupOfflineSync();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return user && isAdmin ? <>{children}</> : <Navigate to="/dashboard" />;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Navigation />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pos"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <POS />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Products />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Customers />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Sales />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/loans"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Loans />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/loans/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LoanDetails />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cash-in-hand"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CashInHand />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <AdminRoute>
                  <AppLayout>
                    <Reports />
                  </AppLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <AdminRoute>
                  <AppLayout>
                    <div className="h-full flex items-center justify-center">
                      <h1 className="text-3xl font-bold">Settings (Coming Soon)</h1>
                    </div>
                  </AppLayout>
                </AdminRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster position="top-right" expand={false} richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
