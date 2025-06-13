import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import { ProtectedRoute } from "@/components/protected-route";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TopNav from "@/components/layout/TopNav";
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
function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="font-sans min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-amber-50">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(249,115,22,0.1),rgba(249,115,22,0))] pointer-events-none"></div>
        <Header />
        <main className="flex-grow relative">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/menu" component={Menu} />

            {/* Protected routes */}
            <ProtectedRoute path="/profile" component={Profile} />
            <Route path="/subscription" component={Subscription} />
            <ProtectedRoute
              path="/subscription/:subscriptionId"
              component={Subscription}
            />
            <ProtectedRoute path="/checkout/:orderId" component={Checkout} />
            <ProtectedRoute
              path="/payment-success"
              component={PaymentSuccess}
            />
            <ProtectedRoute path="/meal-planner" component={MealPlanner} />

            {/* Admin routes */}
            <ProtectedRoute path="/analytics" component={Analytics} adminOnly />
            <ProtectedRoute
              path="/order-management"
              component={OrderManagement}
              managerOnly
            />
            <ProtectedRoute
              path="/admin-portal"
              component={AdminPortal}
              adminOnly
            />
            <ProtectedRoute
              path="/make-admin"
              component={MakeAdmin}
              adminOnly
            />

            <Route component={NotFound} />
          </Switch>
        </main>

        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <CartProvider>
              <Toaster />
              <Router />
            </CartProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </RecoilRoot>
  );
}

export default App;
