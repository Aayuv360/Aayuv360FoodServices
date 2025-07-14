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
  mode?: "normal" | "subscribe";
  onSuccess?: () => void;
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

    if (customOnSuccess) {
      customOnSuccess();
      return;
    }

    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-w-[90vw] p-4 sm:p-6 overflow-y-auto max-h-[90vh] md:max-h-[80vh]">
        <DialogHeader className="mb-2 sm:mb-4">
          <DialogTitle className="text-center text-xl sm:text-2xl font-bold">
            {mode === "subscribe" ? "Login to Subscribe" : "Welcome to Aayuv"}
          </DialogTitle>
          <DialogDescription className="text-center text-xs sm:text-sm">
            {mode === "subscribe"
              ? "Login or create an account to continue with your subscription"
              : "Login or create an account to access all features"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="login"
              className="text-xs sm:text-sm py-1.5 sm:py-2"
            >
              Login
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="text-xs sm:text-sm py-1.5 sm:py-2"
            >
              Register
            </TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-3 sm:mt-4">
            <LoginForm onSuccess={onSuccess} />
          </TabsContent>
          <TabsContent value="register" className="mt-3 sm:mt-4">
            <RegisterForm onSuccess={() => setActiveTab("login")} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
