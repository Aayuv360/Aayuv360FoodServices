import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

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

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Not logged in - redirect to auth page
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
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