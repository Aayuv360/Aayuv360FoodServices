import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { User, ShoppingCart, Search, LogIn } from "lucide-react";
import LocationSelector from "./LocationSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DesktopHeader = ({
  openAuthModal,
  toggleCart,
}: {
  openAuthModal: () => void;
  toggleCart: () => void;
}) => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const scrollToMenuSection = () => {
    const menuSection = document.getElementById("menu-section");
    if (menuSection) {
      const headerOffset = 100;
      const elementPosition = menuSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };
  return (
    <div className="flex items-center justify-between">
      <Link to="/" className="flex items-center">
        <div className="h-10 w-10 mr-2 bg-primary rounded-full flex items-center justify-center text-white text-lg font-bold">
          A
        </div>
        <h1 className="text-2xl font-bold text-primary">Aayuv</h1>
        <LocationSelector />
      </Link>

      <div className="flex items-center gap-4">
        <button
          onClick={() => scrollToMenuSection()}
          className="hover:text-primary flex items-center gap-2 px-2 py-1 text-sm"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </button>

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
                <Link to="/profile" className="w-full">
                  Your Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/profile?tab=subscriptions" className="w-full">
                  Subscriptions
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/profile?tab=orders" className="w-full">
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
            onClick={() => openAuthModal()}
          >
            <LogIn className="w-5 h-5" />
            <span>Login</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default DesktopHeader;
