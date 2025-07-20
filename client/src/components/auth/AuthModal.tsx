import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Button } from "@/components/ui/button";
import OtpLoginForm from "./OtpLoginForm";

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(defaultTab === "register");
  const [isOtpLogin, setIsOtpLogin] = useState(false);

  const onSuccess = () => {
    onOpenChange(false);
    if (customOnSuccess) {
      customOnSuccess();
    } else if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  };

  const toggleAuthView = () => {
    setIsRegistering((prev) => !prev);
    setShowForgotPassword(false);
  };
  let description = "";
  if (showForgotPassword) {
    description = "Reset your password and regain access";
  } else if (isRegistering) {
    description = "Sign up an account to get started";
  } else {
    description =
      mode === "subscribe"
        ? "Login or Sign up an account to continue with your subscription"
        : "Login to your account to access all features";
  }
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-w-[90vw] p-4 sm:p-6 overflow-y-auto max-h-[90vh] md:max-h-[80vh] gap-0">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-center text-xl sm:text-2xl font-bold">
            {mode === "subscribe" ? "Login to Subscribe" : "Welcome to Aayuv"}
          </DialogTitle>
          <DialogDescription className="text-center text-xs sm:text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>

        {showForgotPassword ? (
          <ResetPasswordForm onBack={() => setShowForgotPassword(false)} />
        ) : isOtpLogin ? (
          <OtpLoginForm
            onSuccess={onSuccess}
            onBack={() => setIsOtpLogin(false)}
          />
        ) : isRegistering ? (
          <>
            <RegisterForm onSuccess={onSuccess} />
            <p className="text-sm text-center">
              Already have an account?{" "}
              <Button variant="link" onClick={toggleAuthView} className="!p-0">
                Login
              </Button>
            </p>
          </>
        ) : (
          <>
            <LoginForm
              onSuccess={onSuccess}
              onForgotPassword={() => setShowForgotPassword(true)}
            />
            <p className="text-sm text-center">
              Don’t have an account yet?{" "}
              <Button variant="link" onClick={toggleAuthView} className="!p-0">
                Sign up
              </Button>
            </p>
            {/* <p className="text-sm text-center !m-0">Or</p>
            <Button
              variant="link"
              onClick={() => {
                setIsOtpLogin(true);
                setShowForgotPassword(false);
              }}
              className="!p-0"
            >
              Login with OTP
            </Button> */}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
