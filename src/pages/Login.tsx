
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ShoppingCart, Lock } from "lucide-react";

export default function Login() {
  const { user, login, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }
    
    try {
      await login(username, password);
    } catch (err) {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div 
        className="fixed inset-0 -z-10 animate-fade-in opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgb(229, 231, 235) 2px, transparent 0), radial-gradient(circle at 75px 75px, rgb(229, 231, 235) 2px, transparent 0)`,
          backgroundSize: "100px 100px",
        }}
      />
      
      <div className="max-w-screen-xl mx-auto w-full flex flex-col-reverse md:flex-row items-center justify-center gap-8 lg:gap-16">
        <div className="w-full max-w-md flex-1 animate-scale-in space-y-8">
          <div className="text-center md:text-left space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Merchant POS
            </h1>
            <p className="text-muted-foreground">
              Complete point-of-sale system for modern businesses.
            </p>
          </div>
          
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label 
                    htmlFor="username" 
                    className="text-sm font-medium text-foreground"
                  >
                    Username
                  </label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin or cashier"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <label 
                    htmlFor="password" 
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="admin or cashier"
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </CardFooter>
            </form>
          </Card>
          
          <div className="flex items-center justify-center text-xs text-muted-foreground">
            <p>Use "admin" or "cashier" for both username and password</p>
          </div>
        </div>
        
        <div className="w-full max-w-md flex-1 animate-scale-in delay-100">
          <div className="aspect-square max-w-md rounded-xl overflow-hidden glass p-8 flex items-center justify-center">
            <div className="relative">
              <div className="h-40 w-40 bg-primary/10 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-20 w-20 text-primary/60" />
              </div>
              <div className="absolute -right-4 -bottom-4 h-20 w-20 bg-accent/20 rounded-full flex items-center justify-center">
                <Lock className="h-10 w-10 text-primary/60" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
