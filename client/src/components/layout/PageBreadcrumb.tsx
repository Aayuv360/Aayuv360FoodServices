import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface BreadcrumbItemType {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface PageBreadcrumbProps {
  items?: BreadcrumbItemType[];
}

const getPageTitleFromPath = (pathname: string): string => {
  const pathMap: Record<string, string> = {
    "/about-us": "About Us",
    "/terms": "Terms & Conditions", 
    "/privacy-refund": "Privacy & Refund Policy",
    "/faqs": "FAQs",
    "/menu": "Menu",
    "/profile": "Profile",
    "/subscription": "Subscription",
    "/meal-planner": "Meal Planner",
    "/admin-portal": "Admin Portal",
    "/analytics": "Analytics",
    "/order-management": "Order Management",
  };
  
  return pathMap[pathname] || "Page";
};

const getDynamicBreadcrumbs = (currentPath: string): BreadcrumbItemType[] => {
  // Get the referrer from sessionStorage or use home as default
  const referrer = sessionStorage.getItem('breadcrumb_referrer') || '/';
  const currentTitle = getPageTitleFromPath(currentPath);
  
  // Always start with Home
  const breadcrumbs: BreadcrumbItemType[] = [
    { label: "Home", href: "/" }
  ];

  // If referrer is not home, add it to breadcrumb
  if (referrer !== '/' && referrer !== currentPath) {
    const referrerTitle = getPageTitleFromPath(referrer);
    breadcrumbs.push({
      label: referrerTitle,
      href: referrer
    });
  }

  // Add current page
  breadcrumbs.push({
    label: currentTitle,
    isCurrentPage: true
  });

  return breadcrumbs;
};

export const PageBreadcrumb: React.FC<PageBreadcrumbProps> = ({ items }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSticky, setIsSticky] = useState(false);

  // Track navigation for dynamic breadcrumbs
  useEffect(() => {
    const handleNavigation = () => {
      // Store current path as referrer for next navigation
      sessionStorage.setItem('breadcrumb_referrer', location.pathname);
    };

    // Listen for navigation changes
    return () => {
      handleNavigation();
    };
  }, [location]);

  // Handle scroll for sticky behavior - position below header
  useEffect(() => {
    const handleScroll = () => {
      // Assume header height is ~80px, start sticking after scrolling past initial position
      setIsSticky(window.scrollY > 150);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Generate dynamic breadcrumbs or use provided ones
  const breadcrumbItems = items || getDynamicBreadcrumbs(location.pathname);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-full bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100/50 shadow-sm transition-all duration-300 ${
        isSticky 
          ? 'sticky top-20 z-40 backdrop-blur-sm bg-orange-50/95 shadow-lg' 
          : 'relative'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <Breadcrumb>
          <BreadcrumbList className="text-sm">
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={`${item.label}-${index}`}>
                <BreadcrumbItem>
                  {item.isCurrentPage ? (
                    <BreadcrumbPage className="flex items-center gap-2 font-medium text-orange-800">
                      {index === 0 && <Home className="h-4 w-4" />}
                      <span className="bg-orange-100 px-2 py-1 rounded-md text-orange-800 font-medium">
                        {item.label}
                      </span>
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link 
                        to={item.href || "/"} 
                        className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors duration-200 font-medium"
                        onClick={() => {
                          // Store current path as referrer when navigating
                          sessionStorage.setItem('breadcrumb_referrer', location.pathname);
                        }}
                      >
                        {index === 0 && <Home className="h-4 w-4" />}
                        {item.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbItems.length - 1 && (
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </BreadcrumbSeparator>
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      

    </motion.div>
  );
};

export default PageBreadcrumb;