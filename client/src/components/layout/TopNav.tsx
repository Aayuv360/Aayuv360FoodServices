import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, 
  UtensilsCrossed, 
  Calendar, 
  Award, 
  ClipboardList, 
  Settings, 
  BarChart, 
  Users 
} from "lucide-react";

export default function TopNav() {
  const [location] = useLocation();
  const [activeLink, setActiveLink] = useState<string>("/");
  const { user } = useAuth();
  
  useEffect(() => {
    setActiveLink(location);
  }, [location]);
  
  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/menu", label: "Menu", icon: UtensilsCrossed },
    { href: "/meal-planner", label: "Planner", icon: Calendar },
    { href: "/subscription", label: "Subscribe", icon: Award },
  ];
  
  // Admin and manager menu items, conditionally shown based on user role
  const adminLinks = [
    { 
      href: "/order-management", 
      label: "Orders", 
      icon: ClipboardList, 
      roles: ["admin", "manager"] 
    },
    { 
      href: "/admin-portal", 
      label: "Admin", 
      icon: Settings, 
      roles: ["admin"] 
    },
    {
      href: "/analytics", 
      label: "Analytics", 
      icon: BarChart, 
      roles: ["admin"] 
    },
    {
      href: "/make-admin", 
      label: "Roles", 
      icon: Users, 
      roles: ["user", "admin", "manager"] // Available to everyone for testing
    },
  ];
  
  // Filter admin links based on user role
  const filteredAdminLinks = adminLinks.filter(link => 
    user && link.roles.includes(user.role)
  );
  
  return (
    <nav className="container mx-auto px-2 sm:px-4 mt-2 mb-4 sm:mb-6">
      <div className="flex flex-col gap-2">
        {/* Main navigation */}
        <div className="flex justify-center md:justify-start overflow-x-auto pb-1 no-scrollbar">
          <div className="flex items-center space-x-1 md:space-x-2 bg-muted/30 rounded-full px-1.5 sm:px-2 py-1 border">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeLink === link.href;
              
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                >
                  <a 
                    className={cn(
                      "flex items-center space-x-0.5 sm:space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{link.label}</span>
                  </a>
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* Admin navigation - only shown if user has admin links */}
        {filteredAdminLinks.length > 0 && (
          <div className="flex justify-center md:justify-start overflow-x-auto pb-1 no-scrollbar">
            <div className="flex items-center space-x-1 md:space-x-2 bg-amber-100/70 rounded-full px-1.5 sm:px-2 py-1 border border-amber-200">
              {filteredAdminLinks.map((link) => {
                const Icon = link.icon;
                const isActive = activeLink === link.href;
                
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                  >
                    <a 
                      className={cn(
                        "flex items-center space-x-0.5 sm:space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                        isActive 
                          ? "bg-amber-500 text-white" 
                          : "text-amber-700 hover:text-amber-900 hover:bg-amber-200"
                      )}
                    >
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{link.label}</span>
                    </a>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}