import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { AuthModal } from "@/components/auth/AuthModal";

export function ProtectedRoute({
  path,
  component: Component,
  adminOnly = false,
  managerOnly = false,
}: {
  path: string;
  component: () => React.ReactNode;
  adminOnly?: boolean;
  managerOnly?: boolean;
}) {
  const { user, isLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [location] = useLocation();

  // Show auth modal if the user is not logged in and the current path matches
  useEffect(() => {
    if (!isLoading && !user && location.startsWith(path.replace(/:\w+/g, ''))) {
      setAuthModalOpen(true);
    }
  }, [isLoading, user, location, path]);

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Not logged in - show auth modal
  if (!user) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
            <p className="text-lg text-muted-foreground mb-4">Please login to access this page</p>
          </div>
          <AuthModal 
            isOpen={authModalOpen} 
            onOpenChange={setAuthModalOpen} 
            redirectUrl={location}
          />
        </div>
      </Route>
    );
  }

  // Admin-only route check
  if (adminOnly && user.role !== "admin") {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-lg text-muted-foreground mb-8">You need administrator privileges to access this page.</p>
          <Redirect to="/" />
        </div>
      </Route>
    );
  }

  // Manager-only route check (managers and admins can access)
  if (managerOnly && user.role !== "manager" && user.role !== "admin") {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-lg text-muted-foreground mb-8">You need manager privileges to access this page.</p>
          <Redirect to="/" />
        </div>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}