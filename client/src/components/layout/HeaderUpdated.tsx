// The only change here is to use CartSidebarModern instead of CartSidebar
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { ChevronDown, ShoppingCart, MapPin, LogIn, Bell } from "lucide-react";
import { NotificationManager } from "@/components/notifications/NotificationManager";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CartSidebarModern from "@/components/cart/CartSidebarModern";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AuthModal } from "@/components/auth/AuthModal";

interface Location {
  id: number;
  area: string;
  pincode: string;
  deliveryFee: number;
  available?: boolean;
}

const HeaderUpdated = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { cartItems } = useCart();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // Notification state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Get user selected location from localStorage if exists
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // Fetch all available locations
  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
  });

  useEffect(() => {
    const savedLocationJson = localStorage.getItem("selectedLocation");
    if (savedLocationJson) {
      try {
        const savedLocation = JSON.parse(savedLocationJson);
        setSelectedLocation(savedLocation);
      } catch (error) {
        console.error("Error parsing saved location:", error);
      }
    }
  }, []);

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    localStorage.setItem("selectedLocation", JSON.stringify(location));
  };

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (!isSearchExpanded) {
      // Focus the search input when expanded
      setTimeout(() => {
        const searchInput = document.getElementById("search-input");
        if (searchInput) searchInput.focus();
      }, 100);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setIsSearchExpanded(false);
      setSearchTerm("");
    }
  };

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const openAuthModal = (mode: "login" | "register") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Left Section: Logo */}
        <div className="flex-shrink-0">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-primary">AAYUV</span>
          </Link>
        </div>

        {/* Center Section: Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/">
            <span
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === "/" ? "text-primary" : "text-gray-600"
              }`}
            >
              Home
            </span>
          </Link>
          <Link href="/menu">
            <span
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.startsWith("/menu") ? "text-primary" : "text-gray-600"
              }`}
            >
              Menu
            </span>
          </Link>
          <Link href="/about">
            <span
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === "/about" ? "text-primary" : "text-gray-600"
              }`}
            >
              About Us
            </span>
          </Link>
          <Link href="/contact">
            <span
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === "/contact" ? "text-primary" : "text-gray-600"
              }`}
            >
              Contact
            </span>
          </Link>
        </nav>

        {/* Right Section: Search, Location, Cart, Account */}
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative">
            {isSearchExpanded ? (
              <form
                onSubmit={handleSearchSubmit}
                className="absolute right-0 top-0 w-64 flex items-center bg-white shadow-md rounded-md overflow-hidden"
              >
                <input
                  id="search-input"
                  type="text"
                  placeholder="Search meals..."
                  className="w-full px-3 py-2 text-sm focus:outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  type="button"
                  onClick={toggleSearch}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </form>
            ) : (
              <button
                onClick={toggleSearch}
                className="p-2 text-gray-600 hover:text-primary"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Location Selector */}
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center text-gray-600 hover:text-primary text-sm">
                  <MapPin className="h-5 w-5 mr-1" />
                  <span className="max-w-[80px] truncate">
                    {selectedLocation ? selectedLocation.area : "Select Location"}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-medium">
                  Delivery Locations
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-60 overflow-y-auto">
                  {locations.map((location: Location) => (
                    <DropdownMenuItem
                      key={location.id}
                      onClick={() => handleLocationSelect(location)}
                      className={`cursor-pointer ${
                        selectedLocation?.id === location.id
                          ? "bg-primary/10 text-primary"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{location.area}</span>
                        <span className="text-xs text-gray-500">
                          {location.pincode}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Notifications */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-gray-600 hover:text-primary relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
              </button>
              <NotificationManager
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
              />
            </div>
          )}

          {/* Cart */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="p-2 text-gray-600 hover:text-primary relative"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* User Account */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.avatarUrl || ""}
                      alt={user.name || "User"}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="w-[200px] truncate text-sm text-gray-500">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setLocation("/profile")}
                  className="cursor-pointer"
                >
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLocation("/profile?tab=orders")}
                  className="cursor-pointer"
                >
                  My Orders
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLocation("/profile?tab=subscriptions")}
                  className="cursor-pointer"
                >
                  My Subscriptions
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    signOut();
                    toast({
                      title: "Signed out",
                      description: "You have been signed out of your account",
                    });
                  }}
                  className="cursor-pointer text-red-500 focus:text-red-500"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-primary"
              onClick={() => openAuthModal("login")}
            >
              <LogIn className="h-5 w-5 mr-1" />
              <span className="hidden md:inline">Sign In</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div className="md:hidden border-t border-gray-200">
        <div className="flex justify-between px-4">
          <Link href="/">
            <span className="flex flex-col items-center py-2">
              <span
                className={`text-xs font-medium ${
                  location === "/" ? "text-primary" : "text-gray-600"
                }`}
              >
                Home
              </span>
            </span>
          </Link>
          <Link href="/menu">
            <span className="flex flex-col items-center py-2">
              <span
                className={`text-xs font-medium ${
                  location.startsWith("/menu") ? "text-primary" : "text-gray-600"
                }`}
              >
                Menu
              </span>
            </span>
          </Link>
          <Link href="/about">
            <span className="flex flex-col items-center py-2">
              <span
                className={`text-xs font-medium ${
                  location === "/about" ? "text-primary" : "text-gray-600"
                }`}
              >
                About
              </span>
            </span>
          </Link>
          <Link href="/contact">
            <span className="flex flex-col items-center py-2">
              <span
                className={`text-xs font-medium ${
                  location === "/contact" ? "text-primary" : "text-gray-600"
                }`}
              >
                Contact
              </span>
            </span>
          </Link>
        </div>
      </div>

      {/* Cart Sidebar */}
      <CartSidebarModern open={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialView={authMode}
        onSuccess={() => setShowAuthModal(false)}
      />
    </header>
  );
};

export default HeaderUpdated;