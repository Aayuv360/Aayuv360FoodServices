import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { ChevronDown, ShoppingCart, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CartSidebar from "@/components/cart/CartSidebar";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const [userLocation, setUserLocation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout } = useAuth();
  const { cartItems } = useCart();

  const toggleCart = () => {
    setCartOpen(!cartOpen);
  };

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log(position);
        setUserLocation("Hyderabad, IN");
      },
      (error) => {
        alert("Failed to fetch location");
      },
    );
  };

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link href="/" className="flex items-center">
              <div className="h-10 w-10 mr-2 bg-primary rounded-full flex items-center justify-center text-white text-lg font-bold">
                A
              </div>
              <h1 className="text-2xl font-bold text-primary">Aayuv</h1>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="cursor-pointer text-sm text-muted-foreground hover:text-primary transition pl-12 pt-[5px]">
                  {userLocation || "Select Location"}
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-64">
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Search location..."
                    className="w-full px-2 py-1 border rounded text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <DropdownMenuItem onClick={fetchCurrentLocation}>
                  Use My Current Location
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex-grow max-w-xl relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full py-2 pl-10 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
            />

            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={toggleCart}
              disabled={!cartItems.length}
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full px-1.5 py-0.5">
                  {cartItems.length}
                </span>
              )}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
                      />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="ml-2 hidden md:inline">
                      {user.name.split(" ")[0]}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="w-full">
                      Your Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/subscription" className="w-full">
                      Subscription
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild className="hidden md:flex">
                  <Link href="/login">Login</Link>
                </Button>
                <Button variant="default" asChild className="hidden md:flex">
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default Header;
