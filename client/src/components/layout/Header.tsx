import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { User, ShoppingCart, MapPin, LogIn, Search } from "lucide-react";
import { SimpleDeliveryNotifications } from "@/components/notifications/SimpleDeliveryNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CartSidebar from "@/components/cart/CartSidebar";
import { AuthModal } from "@/components/auth/AuthModal";

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
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const [, navigate] = useLocation();

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

  const toggleCart = () => setCartOpen(!cartOpen);

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-2 sm:px-4 py-4 flex  items-center justify-between gap-y-2 md:gap-y-0 gap-x-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <div className="h-8 w-8 sm:h-10 sm:w-10 mr-2 bg-primary rounded-full flex items-center justify-center text-white text-base sm:text-lg font-bold">
                A
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-primary">
                Aayuv
              </h1>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="cursor-pointer gap-1 text-xs sm:text-sm text-muted-foreground hover:text-primary transition flex items-center pt-[8px] pl-[10px] sm:pl-[20px]">
                  <MapPin className="h-5 w-5 hover:text-primary" />
                  <span className="truncate max-w-[120px] sm:max-w-none hidden sm:inline">
                    {"Select Location"}
                  </span>
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-64 p-2">
                <div className="mb-2">
                  <input
                    type="text"
                    placeholder="Search location..."
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer mt-1">
                  <span className="flex items-center text-primary">
                    <MapPin className="h-4 w-4 mr-2" />
                    Use My Current Location
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Icons Row */}
          <div className="flex items-center flex-nowrap justify-end gap-2 sm:gap-4 w-full md:w-auto overflow-hidden">
            <button
              onClick={() => navigate("/menu")}
              className="hover:text-primary relative flex items-center gap-1 sm:gap-2 px-1 sm:px-2 py-0.75 sm:py-1 text-xs sm:text-sm"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">Search</span>
            </button>

            {user && <SimpleDeliveryNotifications />}

            <button
              className="hover:text-primary relative flex items-center gap-1 sm:gap-2 px-1 sm:px-2 py-0.75 sm:py-1 text-xs sm:text-sm m-1"
              onClick={toggleCart}
              disabled={!cartItems.length}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline">Cart</span>
              {cartItems.length > 0 && (
                <span className="absolute -top-0.5 -right-5 ml-auto bg-primary text-white text-xs rounded-full px-1.5 sm:px-2 py-0.5">
                  {cartItems.length}
                </span>
              )}
            </button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={() => navigate("/menu")}
                    className="hover:text-primary relative flex items-center gap-1 sm:gap-2 px-1 sm:px-2 py-0.75 sm:py-1 text-xs sm:text-sm"
                    aria-label="Search"
                  >
                    <User className="w-5 h-5" />
                    <span className="hidden sm:inline text-xs sm:text-sm whitespace-nowrap truncate max-w-[100px]">
                      {(user.name || user.username || "User").split(" ")[0]}
                    </span>{" "}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="w-full">
                      Your Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile?tab=subscriptions" className="w-full">
                      Subscriptions
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile?tab=orders" className="w-full">
                      Order History
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                className="hover:text-primary relative flex items-center gap-1 sm:gap-2 px-1 sm:px-2 py-0.75 sm:py-1 text-xs sm:text-sm"
                onClick={() => openAuthModal("normal", "")}
              >
                <LogIn className="w-5 h-5" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
          </div>
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
