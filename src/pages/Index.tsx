
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingCart, Package, CreditCard } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90">
      <div className="container mx-auto px-4 py-16">
        <header className="flex justify-between items-center mb-16">
          <h1 className="text-3xl font-bold">Merchant POS</h1>
          <div className="space-x-4">
            {user ? (
              <Link to="/dashboard">
                <Button>
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button>
                  Login <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </header>
        
        <main>
          <section className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">Powerful Point of Sale System</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Manage your inventory, track sales, handle customer loans, and run your business efficiently with our comprehensive merchant POS solution.
            </p>
          </section>
          
          <section className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
              <div className="mb-4 bg-primary/10 p-3 rounded-full w-fit">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Sales Processing</h3>
              <p className="text-muted-foreground">
                Quickly process sales with an intuitive interface designed for speed and efficiency.
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
              <div className="mb-4 bg-primary/10 p-3 rounded-full w-fit">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Inventory Management</h3>
              <p className="text-muted-foreground">
                Keep track of your stock levels, receive alerts for low inventory, and manage product details.
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
              <div className="mb-4 bg-primary/10 p-3 rounded-full w-fit">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Customer Loans</h3>
              <p className="text-muted-foreground">
                Manage customer loans, track repayments, and keep your financial records organized.
              </p>
            </div>
          </section>
          
          <div className="text-center">
            {!user && (
              <Link to="/login">
                <Button size="lg">
                  Get Started Today <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </main>
        
        <footer className="mt-24 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Merchant POS. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
