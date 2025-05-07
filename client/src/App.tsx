import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";

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
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* <TopNav />
       */}
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/menu" component={Menu} />

          {/* Protected routes */}
          <Route path="/profile">
            <Profile />
          </Route>

          <Route path="/subscription">
            <Subscription />
          </Route>

          <Route path="/checkout/:type">
            <Checkout />
          </Route>

          <Route path="/payment-success" component={PaymentSuccess} />

          {/* <Route path="/meal-planner" component={MealPlanner} />
           */}
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
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
  );
}

export default App;
