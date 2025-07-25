import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import { UIProvider } from "@/contexts/UIContext";
import {
  AccessibilityProvider,
  useKeyboardNavigation,
} from "@/hooks/use-accessibility";
import {
  usePerformanceMonitoring,
  useMemoryOptimization,
} from "@/hooks/use-performance";
import { useNavigationTracking } from "@/hooks/use-navigation-tracking";
import { ProtectedRoute } from "@/components/protected-route";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import Home from "@/pages/home";
import Menu from "@/pages/menu";
import Profile from "@/pages/profile";
import MealPlanner from "@/pages/meal-planner";
import Analytics from "@/pages/analytics";
import OrderManagement from "@/pages/order-management";
import AdminPortal from "@/pages/admin-portal";
import MakeAdmin from "@/pages/make-admin";
import NotFound from "@/pages/not-found";
import { RecoilRoot } from "recoil";
import { ItemDetailsPage } from "./pages/ItemDetailsPage";
import SubscriptionManager from "./pages/subscriptionManager";
import SuccessPage from "./pages/SuccessPage";
import AboutUs from "./pages/about-us";
import Terms from "./pages/terms";
import PrivacyRefund from "./pages/privacy-refund";
import FAQs from "./pages/faqs";
import OrderTrackingPage from "./pages/order-tracking";

function Router() {
  useKeyboardNavigation();
  usePerformanceMonitoring();
  useMemoryOptimization();
  useNavigationTracking();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="font-sans min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-amber-50">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(249,115,22,0.1),rgba(249,115,22,0))] pointer-events-none"></div>
        <Header />
        <main
          id="main-content"
          className="flex-grow relative md:pb-0"
          role="main"
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/MealDetails/:mealId" element={<ItemDetailsPage />} />
            <Route
              path="/profile"
              element={<ProtectedRoute component={Profile} />}
            />
            <Route path="/subscription" element={<SubscriptionManager />} />

            <Route
              path="/meal-planner"
              element={<ProtectedRoute component={MealPlanner} />}
            />

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
            <Route
              path="/orders/:orderId/tracking"
              element={<ProtectedRoute component={OrderTrackingPage} />}
            />

            <Route path="/success/:id/:type" element={<SuccessPage />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy-refund" element={<PrivacyRefund />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
        <MobileBottomNav />
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
              <BrowserRouter>
                <AuthProvider>
                  <CartProvider>
                    <Toaster />
                    <Router />
                  </CartProvider>
                </AuthProvider>
              </BrowserRouter>
            </UIProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </AccessibilityProvider>
    </RecoilRoot>
  );
}

export default App;
