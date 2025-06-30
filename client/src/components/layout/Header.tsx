import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import CartSidebar from "@/components/cart/CartSidebar";
import { AuthModal } from "@/components/auth/AuthModal";
import MobileHeader from "./MobileHeader";
import DesktopHeader from "./DesktopHeader";
import { useLocation } from "react-router-dom";
import { useLocationManager } from "@/hooks/use-location-manager";
import { useServiceArea } from "@/hooks/use-service-area";
import { AlertCircle, CheckCircle } from "lucide-react";

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
  const { selectedAddress, serviceArea } = useLocationManager();
  const { isWithinServiceArea, getServiceMessage, checkServiceAvailability } =
    useServiceArea();
  console.log(selectedAddress);
  useEffect(() => {
    if (selectedAddress?.coords) {
      checkServiceAvailability(selectedAddress.coords);
    }
  }, [selectedAddress, checkServiceAvailability]);

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
        {selectedAddress && (
          <div
            className={`py-2 px-4 text-sm ${
              isWithinServiceArea
                ? "bg-green-100 text-green-800 border-b border-green-200"
                : "bg-red-100 text-red-800 border-b border-red-200"
            }`}
          >
            <div className="container mx-auto flex items-center justify-center gap-2">
              {isWithinServiceArea ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="text-center">{getServiceMessage()}</span>
            </div>
          </div>
        )}

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
