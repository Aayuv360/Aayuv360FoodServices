import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { Container, Box } from "@mui/material";
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/home";
import Menu from "@/pages/menu";
import Login from "@/pages/authentication/login";
import Register from "@/pages/authentication/register";
import Profile from "@/pages/profile";
import Subscription from "@/pages/subscription";
import Checkout from "@/pages/checkout";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/menu" component={Menu} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/profile" component={Profile} />
          <Route path="/subscription" component={Subscription} />
          <Route path="/checkout" component={Checkout} />
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </Box>
      <Footer />
    </Box>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <SnackbarProvider maxSnack={3}>
          <Router />
        </SnackbarProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
