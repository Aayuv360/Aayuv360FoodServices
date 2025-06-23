import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import CartSidebar from "@/components/cart/CartSidebar";
import { AuthModal } from "@/components/auth/AuthModal";
import MobileHeader from "./MobileHeader";
import DesktopHeader from "./DesktopHeader";
import { useLocation } from "react-router-dom";

const Header = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"normal" | "subscribe">(
    "normal",
  );
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">(
    "login",
  );
  const [authRedirectUrl, setAuthRedirectUrl] = useState("");

  const isMobile = useIsMobile();

  const openAuthModal = (
    mode: "normal" | "subscribe" = "normal",
    redirectUrl = "",
    tab: "login" | "register" = "login",
  ) => {
    setAuthModalMode(mode);
    setAuthRedirectUrl(redirectUrl);
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {isMobile ? (
            <MobileHeader />
          ) : (
            <DesktopHeader
              openAuthModal={openAuthModal}
              toggleCart={() => setCartOpen(!cartOpen)}
            />
          )}
        </div>
      </header>

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
      <AuthModal
        isOpen={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultTab={authModalTab}
        redirectUrl={authRedirectUrl}
        mode={authModalMode}
      />
    </>
  );
};

export default Header;
