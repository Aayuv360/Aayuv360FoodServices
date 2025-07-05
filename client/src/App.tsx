import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import { LocationProvider } from "@/contexts/LocationContext";
import { UIProvider } from "@/contexts/UIContext";
import { AccessibilityProvider, useKeyboardNavigation } from "@/hooks/use-accessibility";
import { usePerformanceMonitoring, useMemoryOptimization } from "@/hooks/use-performance";
import { ProtectedRoute } from "@/components/protected-route";
import { AccessibilityToolbar, SkipToMainContent } from "@/components/ui/AccessibilityToolbar";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TopNav from "@/components/layout/TopNav";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import Home from "@/pages/home";
import Menu from "@/pages/menu";
import Profile from "@/pages/profile";
import Subscription from "@/pages/subscription";
import Checkout from "@/pages/checkout";
import PaymentSuccess from "@/pages/payment-success";
import MealPlanner from "@/pages/meal-planner";
import Analytics from "@/pages/analytics";
import OrderManagement from "@/pages/order-management";
import AdminPortal from "@/pages/admin-portal";
import MakeAdmin from "@/pages/make-admin";
import NotFound from "@/pages/not-found";
import { useAuth } from "./hooks/use-auth";
import { RecoilRoot } from "recoil";
import { ItemDetailsPage } from "./pages/ItemDetailsPage";
import SubscriptionManager from "./pages/subscriptionManager";
import SuccessPage from "./pages/SuccessPage";
import AuthPage from "./pages/auth-page";
import AboutUs from "./pages/about-us";
import Terms from "./pages/terms";
import PrivacyRefund from "./pages/privacy-refund";
import FAQs from "./pages/faqs";
function Router() {
  useKeyboardNavigation();
  usePerformanceMonitoring();
  useMemoryOptimization();
  
  return (
    <div className="flex flex-col min-h-screen">
      <SkipToMainContent />
      <div className="font-sans min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-amber-50">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(249,115,22,0.1),rgba(249,115,22,0))] pointer-events-none"></div>
        <Header />
        <main id="main-content" className="flex-grow relative md:pb-0" role="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/MealDetails/:mealId" element={<ItemDetailsPage />} />

            {/* Protected routes */}
            <Route
              path="/profile"
              element={<ProtectedRoute component={Profile} />}
            />
            <Route path="/subscription" element={<SubscriptionManager />} />
            {/* <Route
              path="/subscription/:subscriptionId"
              element={<ProtectedRoute component={Subscription} />}
            /> */}
            <Route
              path="/checkout/:orderId"
              element={<ProtectedRoute component={Checkout} />}
            />
            <Route
              path="/payment-success"
              element={<ProtectedRoute component={SuccessPage} />}
            />
            <Route
              path="/meal-planner"
              element={<ProtectedRoute component={MealPlanner} />}
            />

            {/* Admin routes */}
            <Route
              path="/analytics"
              element={<ProtectedRoute component={Analytics} adminOnly />}
            />
            <Route
              path="/order-management"
              element={
                <ProtectedRoute component={OrderManagement} managerOnly />
              }
            />
            <Route
              path="/admin-portal"
              element={<ProtectedRoute component={AdminPortal} adminOnly />}
            />
            <Route
              path="/make-admin"
              element={<ProtectedRoute component={MakeAdmin} adminOnly />}
            />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy-refund" element={<PrivacyRefund />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
        <MobileBottomNav />
        <AccessibilityToolbar />
      </div>
    </div>
  );
}

function App() {
  return (
    <RecoilRoot>
      <AccessibilityProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <UIProvider>
              <LocationProvider>
                <AuthProvider>
                  <CartProvider>
                    <BrowserRouter>
                      <Toaster />
                      <Router />
                    </BrowserRouter>
                  </CartProvider>
                </AuthProvider>
              </LocationProvider>
            </UIProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </AccessibilityProvider>
    </RecoilRoot>
  );
}

export default App;
