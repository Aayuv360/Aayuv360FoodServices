import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthModal } from "@/components/auth/AuthModal";

export function ProtectedRoute({
  component: Component,
  adminOnly = false,
  managerOnly = false,
}: {
  component: () => React.ReactNode;
  adminOnly?: boolean;
  managerOnly?: boolean;
}) {
  const { user, isLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setAuthModalOpen(true);
    }
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-lg text-muted-foreground mb-4">
            Please login to access this page
          </p>
        </div>
        <AuthModal
          isOpen={authModalOpen}
          onOpenChange={setAuthModalOpen}
          redirectUrl={location.pathname}
        />
      </div>
    );
  }

  if (adminOnly && user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-lg text-muted-foreground mb-8">
          You need administrator privileges to access this page.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  if (managerOnly && user.role !== "manager" && user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-lg text-muted-foreground mb-8">
          You need manager privileges to access this page.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return <Component />;
}
