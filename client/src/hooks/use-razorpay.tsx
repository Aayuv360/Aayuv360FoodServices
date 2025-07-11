import { useState, useEffect, useCallback } from "react";
import { useToast } from "./use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CreateOrderOptions {
  amount: number;
  orderId: number;
  type?:
    | "order"
    | "subscription"
    | "subscriptionUpgrade"
    | "subscriptionRenewal"
    | any;
  notes?: Record<string, string>;
}

interface PaymentVerifyOptions {
  orderId: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  type?:
    | "order"
    | "subscription"
    | "subscriptionUpgrade"
    | "subscriptionRenewal"
    | any;
}

interface PaymentFailureOptions {
  orderId: number;
  error: any;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

// Load Razorpay script once and track its loading state
const useRazorpayScript = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (window.Razorpay) {
      setLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setLoaded(true);

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return loaded;
};

export const useRazorpay = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const razorpayLoaded = useRazorpayScript();
  const [razorpayKey, setRazorpayKey] = useState<string | null>(null);

  // Fetch Razorpay key from server on component mount
  useEffect(() => {
    const fetchRazorpayConfig = async () => {
      try {
        const response = await fetch('/api/payments/config');
        if (response.ok) {
          const config = await response.json();
          setRazorpayKey(config.key);
        } else {
          console.error('Failed to fetch Razorpay config');
        }
      } catch (error) {
        console.error('Error fetching Razorpay config:', error);
      }
    };

    fetchRazorpayConfig();
  }, []);

  // Simplified payment - no server order creation needed for new flow

  // Function to initiate payment
  const initiatePayment = useCallback(
    async (options: {
      amount: number;
      orderId: number;
      description: string;
      name: string;
      type?:
        | "order"
        | "subscription"
        | "subscriptionUpgrade"
        | "subscriptionRenewal"
        | any;
      theme?: { color: string };
      onSuccess?: (data: any) => void;
      onFailure?: (error: any) => void;
    }) => {
      if (!razorpayLoaded) {
        toast({
          title: "Payment system loading",
          description: "Please wait while we initialize the payment system.",
        });
        return;
      }

      if (!razorpayKey) {
        toast({
          title: "Payment configuration loading",
          description: "Please wait while we load payment configuration.",
        });
        return;
      }

      if (!user) {
        toast({
          title: "Authentication required",
          description: "You need to be logged in to make a payment",
          variant: "destructive",
        });
        return;
      }

      try {
        // Check if Razorpay is available
        if (!window.Razorpay) {
          throw new Error("Razorpay SDK not loaded. Please refresh the page and try again.");
        }

        console.log("Razorpay available:", !!window.Razorpay);
        console.log("Payment details:", { amount: options.amount, key: razorpayKey?.substring(0, 10) + "..." });

        // Simplified payment options for direct Razorpay integration
        const razorpayOptions: RazorpayOptions = {
          key: razorpayKey, // Use the key from server
          amount: Math.round(options.amount * 100), // Convert to paise
          currency: "INR",
          name: options.name || "Aayuv Millet Foods",
          description: options.description || "Order Payment",
          image: "/favicon.png",
          order_id: `order_${options.orderId}_${Date.now()}`, // Use temp order ID
          handler: async (response) => {
            try {
              // Payment successful - call onSuccess with payment details
              if (options.onSuccess) {
                options.onSuccess(response);
              }
            } catch (error: any) {
              console.error("Payment success handling error:", error);
              if (options.onFailure) {
                options.onFailure(error);
              }
            }
          },
          prefill: {
            name: user.name || "",
            email: user.email || "",
            contact: user.phone || "",
          },
          notes: {
            orderId: options.orderId.toString(),
          },
          theme: options.theme || {
            color: "#F37254",
          },
          modal: {
            ondismiss: () => {
              toast({
                title: "Payment Cancelled",
                description: "You cancelled the payment process",
              });

              // Don't call onFailure for user cancellation
              // The cart should remain intact when user cancels payment
              if (options.onFailure) {
                options.onFailure({ 
                  message: "Payment cancelled by user", 
                  type: "user_cancelled" 
                });
              }
            },
          },
        };

        const razorpay = new window.Razorpay(razorpayOptions);
        razorpay.open();
      } catch (error: any) {
        toast({
          title: "Payment Initialization Failed",
          description: error.message || "Failed to initialize payment",
          variant: "destructive",
        });

        if (options.onFailure) {
          options.onFailure(error);
        }
      }
    },
    [razorpayLoaded, user, toast],
  );

  return {
    initiatePayment,
    isLoading: false, // No longer using server mutations
    isError: false,
    error: null,
  };
};
