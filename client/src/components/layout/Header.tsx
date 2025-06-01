import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { ChevronDown, ShoppingCart, MapPin, LogIn, Bell } from "lucide-react";
import { SimpleDeliveryNotifications } from "@/components/notifications/SimpleDeliveryNotifications";
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
import { AuthModal } from "@/components/auth/AuthModal";

interface Location {
  id: number;
  area: string;
  pincode: string;
  deliveryFee: number;
  available?: boolean;
}

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
  const [userLocation, setUserLocation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const [, navigate] = useLocation();
  // Function to open auth modal
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

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations", locationQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (locationQuery) {
        params.append("query", locationQuery);
      }
      const response = await fetch(`/api/locations?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch locations");
      }

      return response.json();
    },
  });

  const toggleCart = () => {
    setCartOpen(!cartOpen);
  };

  const fetchLocationsByCoordinates = async (lat: number, lng: number) => {
    try {
      const params = new URLSearchParams();
      params.append("lat", lat.toString());
      params.append("lng", lng.toString());
      params.append("radius", "10");

      const response = await fetch(`/api/locations?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch nearby locations");
      }

      const nearbyLocations: Location[] = await response.json();
      return nearbyLocations;
    } catch (error) {
      console.error("Error fetching locations by coordinates:", error);
      return [];
    }
  };

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Locating...",
      description: "Finding your current location",
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const nearbyLocations = await fetchLocationsByCoordinates(
          latitude,
          longitude,
        );

        if (nearbyLocations.length > 0) {
          const closestLocation = nearbyLocations[0];
          setUserLocation(
            `${closestLocation.area} - ${closestLocation.pincode}`,
          );
          toast({
            title: "Location Set",
            description: `Your location is set to ${closestLocation.area}`,
          });
        } else {
          toast({
            title: "No Delivery Available",
            description: "Sorry, we don't deliver to your current location yet",
            variant: "destructive",
          });
        }
      },
      (error) => {
        toast({
          title: "Location Error",
          description: "Failed to get your location. " + error.message,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      },
    );
  };

  const selectLocation = (location: Location) => {
    setUserLocation(`${location.area} - ${location.pincode}`);
    setLocationQuery("");
  };
  useEffect(() => {
    if (searchQuery) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery)}`);
    }
  }, [searchQuery]);
  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-2 sm:px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          {/* Logo */}
          <div className="flex items-center justify-between w-full md:w-auto">
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
                <div className="cursor-pointer text-xs sm:text-sm text-muted-foreground hover:text-primary transition flex items-center pt-[8px] pl-[10px] sm:pl-[20px]">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="truncate max-w-[120px] sm:max-w-none">
                    {userLocation || "Select Location"}
                  </span>
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-64 p-2">
                <div className="mb-2">
                  <input
                    type="text"
                    placeholder="Search location..."
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                  />
                </div>

                <div className="max-h-48 overflow-auto">
                  {locations.length > 0 ? (
                    locations.map((loc) => (
                      <DropdownMenuItem
                        key={loc.id}
                        onClick={() => selectLocation(loc)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 mr-2 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-medium">{loc.area}</div>
                            <div className="text-xs text-muted-foreground">
                              PIN: {loc.pincode} • ₹
                              {(loc.deliveryFee / 100).toFixed(2)} delivery
                            </div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground p-2 text-center">
                      No locations found
                    </div>
                  )}
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={fetchCurrentLocation}
                  className="cursor-pointer mt-1"
                >
                  <span className="flex items-center text-primary">
                    <MapPin className="h-4 w-4 mr-2" />
                    Use My Current Location
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <form className="flex-grow max-w-xl relative order-last md:order-none my-2 md:my-0">
            <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              placeholder="Search meals..."
              className="w-full py-1.5 sm:py-2 pl-8 sm:pl-10 pr-8 sm:pr-10 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                }}
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </form>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {user && <SimpleDeliveryNotifications />}

            <Button
              variant="outline"
              className="relative flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
              onClick={toggleCart}
              disabled={!cartItems.length}
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden xs:inline">Cart</span>

              {cartItems.length > 0 && (
                <span className="ml-auto bg-primary text-white text-xs rounded-full px-1.5 sm:px-2 py-0.5">
                  {cartItems.length}
                </span>
              )}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2"
                  >
                    <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                      <AvatarImage
                        src={`https://ui-avatars.com/api/?name=${user.name || user.username || "User"}&background=random`}
                      />
                      <AvatarFallback>
                        {(user.name || user.username || "U").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="ml-1 sm:ml-2 hidden md:inline text-xs sm:text-sm">
                      {(user.name || user.username || "User").split(" ")[0]}
                    </span>
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
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
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  className="hidden md:flex"
                  onClick={() => openAuthModal("normal", "")}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </div>
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
