import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { ChevronDown, Menu, X, ShoppingCart } from "lucide-react";
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

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { cartItems } = useCart();

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleCart = () => {
    setCartOpen(!cartOpen);
  };

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center">
              <div className="h-10 w-10 mr-2 bg-primary rounded-full flex items-center justify-center text-white text-lg font-bold">
                M
              </div>
              <h1 className="text-2xl font-bold text-primary">MealMillet</h1>
            </a>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6 items-center">
            <Link href="/">
              <a className={`hover:text-primary transition duration-200 ${location === "/" ? "text-primary" : "text-neutral-dark"}`}>
                Home
              </a>
            </Link>
            <Link href="/menu">
              <a className={`hover:text-primary transition duration-200 ${location === "/menu" ? "text-primary" : "text-neutral-dark"}`}>
                Menu
              </a>
            </Link>
            <Link href="/subscription">
              <a className={`hover:text-primary transition duration-200 ${location === "/subscription" ? "text-primary" : "text-neutral-dark"}`}>
                Plans
              </a>
            </Link>
          </nav>
          
          {/* Auth/User Actions */}
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative" 
              onClick={toggleCart}
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
                      <AvatarImage src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="ml-2 hidden md:inline">{user.name.split(' ')[0]}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <a className="w-full">Your Profile</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/subscription">
                      <a className="w-full">Subscription</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild className="hidden md:flex">
                  <Link href="/login">
                    <a>Login</a>
                  </Link>
                </Button>
                <Button variant="default" asChild className="hidden md:flex">
                  <Link href="/register">
                    <a>Register</a>
                  </Link>
                </Button>
              </div>
            )}
            
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" 
              onClick={toggleMobileMenu}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation (Hidden by default) */}
        <div className={`md:hidden ${mobileMenuOpen ? "block" : "hidden"}`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/">
              <a className="block px-3 py-2 rounded-md text-base font-medium hover:bg-neutral-light">
                Home
              </a>
            </Link>
            <Link href="/menu">
              <a className="block px-3 py-2 rounded-md text-base font-medium hover:bg-neutral-light">
                Menu
              </a>
            </Link>
            <Link href="/subscription">
              <a className="block px-3 py-2 rounded-md text-base font-medium hover:bg-neutral-light">
                Plans
              </a>
            </Link>
            {!user && (
              <>
                <Link href="/login">
                  <a className="block px-3 py-2 rounded-md text-base font-medium hover:bg-neutral-light">
                    Login
                  </a>
                </Link>
                <Link href="/register">
                  <a className="block px-3 py-2 rounded-md text-base font-medium hover:bg-neutral-light">
                    Register
                  </a>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Cart Sidebar */}
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Background overlay for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Header;
