import { useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "register";
  redirectUrl?: string;
  mode?: "normal" | "subscribe"; // normal or subscribe mode
  onSuccess?: () => void; // Custom callback for successful authentication
}

export function AuthModal({
  isOpen,
  onOpenChange,
  defaultTab = "login",
  redirectUrl,
  mode = "normal",
  onSuccess: customOnSuccess,
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  const onSuccess = () => {
    onOpenChange(false);
    
    // If there's a custom success callback, call it
    if (customOnSuccess) {
      customOnSuccess();
      return;
    }
    
    // Otherwise, handle redirects
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {mode === "subscribe"
              ? "Login to Subscribe"
              : "Welcome to MealMillet"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {mode === "subscribe"
              ? "Login or create an account to continue with your subscription"
              : "Login or create an account to access all features"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-4">
            <LoginForm onSuccess={onSuccess} />
          </TabsContent>
          <TabsContent value="register" className="mt-4">
            <RegisterForm onSuccess={() => setActiveTab("login")} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
