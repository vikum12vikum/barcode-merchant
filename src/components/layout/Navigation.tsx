
import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  ClipboardList, 
  Settings, 
  LogOut,
  Menu,
  X,
  ReceiptText,
  Wallet
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  onClick?: () => void;
}

function NavItem({ icon, label, to, onClick }: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink 
      to={to} 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
        isActive 
          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
      )}
    >
      <span className="h-5 w-5">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export function Navigation() {
  const { user, logout, isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location.pathname, isMobile]);

  // When screen size changes, reset sidebar state
  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  if (!user) return null;

  const navItems = [
    {
      icon: <LayoutDashboard size={18} />,
      label: "Dashboard",
      to: "/dashboard",
    },
    {
      icon: <ShoppingCart size={18} />,
      label: "POS",
      to: "/pos",
    },
    {
      icon: <Package size={18} />,
      label: "Products",
      to: "/products",
    },
    {
      icon: <Users size={18} />,
      label: "Customers",
      to: "/customers",
    },
    {
      icon: <ReceiptText size={18} />,
      label: "Sales",
      to: "/sales",
    },
    {
      icon: <BarChart3 size={18} />,
      label: "Reports",
      to: "/reports",
      admin: true,
    },
    {
      icon: <Wallet size={18} />,
      label: "Cash in Hand",
      to: "/cash-in-hand",
    },
    {
      icon: <Settings size={18} />,
      label: "Settings",
      to: "/settings",
      admin: true,
    },
  ];

  const filteredNavItems = isAdmin 
    ? navItems 
    : navItems.filter(item => !item.admin);

  const sidebarContent = (
    <>
      <div className="flex items-center h-14 px-4 border-b border-sidebar-border">
        <span className="text-lg font-semibold tracking-tight">Merchant POS</span>
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar} 
            className="ml-auto"
          >
            <X size={18} />
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-auto py-2 px-2">
        <div className="space-y-1">
          {filteredNavItems.map((item) => (
            <NavItem
              key={item.to}
              icon={item.icon}
              label={item.label}
              to={item.to}
              onClick={() => isMobile && setIsOpen(false)}
            />
          ))}
        </div>
      </div>
      <div className="p-2 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={logout} 
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50"
        >
          <Menu size={20} />
        </Button>
      )}

      {/* Sidebar */}
      {isMobile ? (
        <>
          {/* Mobile overlay */}
          {isOpen && (
            <div 
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
          )}
          {/* Mobile sidebar */}
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col",
              isOpen ? "animate-slide-in-left" : "-translate-x-full",
              "transition-transform duration-300 ease-spring"
            )}
          >
            {sidebarContent}
          </aside>
        </>
      ) : (
        <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col h-screen sticky top-0">
          {sidebarContent}
        </aside>
      )}
    </>
  );
}
