import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { Home, UtensilsCrossed, Calendar, Award } from "lucide-react";

export default function TopNav() {
  const [location] = useLocation();
  const [activeLink, setActiveLink] = useState<string>("/");
  
  useEffect(() => {
    setActiveLink(location);
  }, [location]);
  
  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/menu", label: "Menu", icon: UtensilsCrossed },
    { href: "/meal-planner", label: "Planner", icon: Calendar },
    { href: "/subscription", label: "Subscribe", icon: Award },
  ];
  
  return (
    <nav className="container mx-auto px-4 mt-2 mb-6">
      <div className="flex justify-center md:justify-start">
        <div className="flex items-center space-x-1 md:space-x-2 bg-muted/30 rounded-full px-2 py-1 border">
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
                    "flex items-center space-x-1 px-3 py-2 rounded-full text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}