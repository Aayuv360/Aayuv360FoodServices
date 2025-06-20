import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useIsMobile } from "@/hooks/use-mobile";
import { User, ShoppingCart, MapPin, LogIn, Search, Menu } from "lucide-react";
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
import LocationSelector from "./LocationSelecto";

const Header = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const toggleCart = () => setCartOpen(!cartOpen);

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="h-8 w-8 sm:h-10 sm:w-10 mr-2 bg-primary rounded-full flex items-center justify-center text-white text-base sm:text-lg font-bold">
                A
              </div>
              <h1 className="text-lg sm:text-2xl font-bold text-primary">
                Aayuv
              </h1>
            </Link>

            {/* Desktop Navigation */}
            {!isMobile && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate("/menu")}
                  className="hover:text-primary flex items-center gap-2 px-2 py-1 text-sm"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </button>

                {user && <SimpleDeliveryNotifications />}

                <button
                  className="hover:text-primary relative flex items-center gap-2 px-2 py-1 text-sm"
                  onClick={toggleCart}
                  disabled={!cartItems.length}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Cart</span>
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full px-2 py-0.5">
                      {cartItems.length}
                    </span>
                  )}
                </button>

                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="hover:text-primary flex items-center gap-2 px-2 py-1 text-sm">
                        <User className="w-5 h-5" />
                        <span className="max-w-[100px] truncate">
                          {(user.name || user.username || "User").split(" ")[0]}
                        </span>
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
                    className="hover:text-primary flex items-center gap-2 px-2 py-1 text-sm"
                    onClick={() => openAuthModal("normal", "")}
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Login</span>
                  </button>
                )}
              </div>
            )}

            {/* Mobile Navigation */}
            {isMobile && (
              <div className="flex items-center gap-2">
                {user && <SimpleDeliveryNotifications />}
                
                <button
                  className="hover:text-primary relative p-2"
                  onClick={toggleCart}
                  disabled={!cartItems.length}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                      {cartItems.length}
                    </span>
                  )}
                </button>

                <button
                  className="hover:text-primary p-2"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobile && mobileMenuOpen && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    navigate("/menu");
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 rounded-md"
                >
                  <Search className="w-5 h-5" />
                  <span>Search Menu</span>
                </button>

                {user ? (
                  <>
                    <Link 
                      href="/profile" 
                      className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      <span>Your Profile</span>
                    </Link>
                    <Link 
                      href="/profile?tab=subscriptions" 
                      className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>Subscriptions</span>
                    </Link>
                    <Link 
                      href="/profile?tab=orders" 
                      className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>Order History</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 rounded-md text-left w-full"
                    >
                      <LogIn className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      openAuthModal("normal", "");
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 rounded-md text-left w-full"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Login</span>
                  </button>
                )}
              </div>
            </div>
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
