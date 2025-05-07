import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "./AuthModal";

interface AuthProtectionProps {
  children: React.ReactNode;
  redirectUrl?: string;
  subscriptionMode?: boolean; 
}

export function AuthProtection({ 
  children,
  redirectUrl,
  subscriptionMode = false
}: AuthProtectionProps) {
  const [location] = useLocation();
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
    }
  }, [user, loading]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  // If user is authenticated, render children
  if (user) {
    return <>{children}</>;
  }
  
  // Otherwise show a placeholder with login modal
  return (
    <>
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h3 className="text-xl font-semibold mb-4">
          {subscriptionMode ? "Login Required for Subscription" : "Login Required"}
        </h3>
        <p className="text-muted-foreground mb-6">
          {subscriptionMode 
            ? "Please login or create an account to manage your subscription."
            : "Please login or create an account to access this feature."}
        </p>
        <button 
          onClick={() => setShowAuthModal(true)}
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
        >
          Login / Register
        </button>
      </div>
      
      <AuthModal
        isOpen={showAuthModal}
        onOpenChange={setShowAuthModal}
        mode={subscriptionMode ? "subscribe" : "normal"}
        redirectUrl={redirectUrl || location}
      />
    </>
  );
}