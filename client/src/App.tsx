import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import { LocationProvider } from "@/contexts/LocationContext";
import { MapProvider } from "@/hooks/MapProvider";
import { UIProvider } from "@/contexts/UIContext";
import { ProtectedRoute } from "@/components/protected-route";

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
function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="font-sans min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-amber-50">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(249,115,22,0.1),rgba(249,115,22,0))] pointer-events-none"></div>
        <Header />
        <main className="flex-grow relative md:pb-0">
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
    </RecoilRoot>
  );
}

export default App;
