import React from "react";
import { Link, useLocation } from "react-router-dom";
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

export const PageBreadcrumb: React.FC<PageBreadcrumbProps> = ({ items }) => {
  const location = useLocation();

  // If no custom items provided, generate from current path
  const breadcrumbItems = items || [
    { label: "Home", href: "/" },
    { label: getPageTitleFromPath(location.pathname), isCurrentPage: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100/50 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumb>
          <BreadcrumbList className="text-sm">
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={index}>
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