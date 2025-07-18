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

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (options: CreateOrderOptions) => {
      const res = await apiRequest(
        "POST",
        "/api/payments/create-order",
        options,
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create order");
      }
      return res.json();
    },
  });

  // Verify payment mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: async (options: PaymentVerifyOptions) => {
      const res = await apiRequest("POST", "/api/payments/verify", options);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to verify payment");
      }
      return res.json();
    },
  });

  // Payment failure mutation
  const paymentFailureMutation = useMutation({
    mutationFn: async (options: PaymentFailureOptions) => {
      const res = await apiRequest("POST", "/api/payments/failed", options);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || "Failed to handle payment failure",
        );
      }
      return res.json();
    },
  });

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

      if (!user) {
        toast({
          title: "Authentication required",
          description: "You need to be logged in to make a payment",
          variant: "destructive",
        });
        return;
      }

      try {
        const orderData = await createOrderMutation.mutateAsync({
          amount: options.amount,
          orderId: options.orderId,
          type: options.type || "order",
        });

        const razorpayOptions: RazorpayOptions = {
          key: orderData.key,
          amount: orderData.amount,
          currency: orderData.currency,
          name: options.name || "Aayuv Millet Foods",
          description: options.description || "Order Payment",
          image: "/images/logo.png", // Logo URL
          order_id: orderData.orderId,
          handler: async (response) => {
            try {
              await verifyPaymentMutation.mutateAsync({
                orderId: options.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                type: options.type || "order",
              });

              toast({
                title: "Payment Successful",
                description: "Your payment has been processed successfully",
              });

              if (options.onSuccess) {
                options.onSuccess(response);
              }
            } catch (error: any) {
              toast({
                title: "Payment Verification Failed",
                description: error.message || "Failed to verify payment",
                variant: "destructive",
              });

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

              if (options.onFailure) {
                options.onFailure({
                  message: "Payment cancelled by user",
                  type: "user_cancelled",
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
    [razorpayLoaded, user, createOrderMutation, verifyPaymentMutation, toast],
  );

  // Simplified wallet payment method
  const payWithRazorpay = useCallback(
    async (
      amount: number,
      orderId: string,
      title: string,
      description: string,
      onSuccess: (paymentDetails: any) => void,
    ) => {
      if (!razorpayLoaded) {
        throw new Error("Razorpay is not loaded yet");
      }

      try {
        const razorpayOptions = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: amount,
          currency: "INR",
          name: "Aayuv Millet Foods",
          description: description,
          image: "/images/logo.png",
          order_id: orderId,
          handler: async (response: any) => {
            try {
              onSuccess({
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                signature: response.razorpay_signature,
              });

              toast({
                title: "Payment Successful",
                description: "Your payment has been processed successfully",
              });

              return { success: true };
            } catch (error: any) {
              toast({
                title: "Payment Processing Failed",
                description: error.message || "Failed to process payment",
                variant: "destructive",
              });
              throw error;
            }
          },
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
            contact: user?.phone || "",
          },
          notes: {
            purpose: "wallet_topup",
          },
          theme: {
            color: "#F37254",
          },
          modal: {
            ondismiss: () => {
              toast({
                title: "Payment Cancelled",
                description: "You cancelled the payment process",
              });
            },
          },
        };

        const razorpay = new window.Razorpay(razorpayOptions);
        razorpay.open();

        return { success: true };
      } catch (error: any) {
        toast({
          title: "Payment Initialization Failed",
          description: error.message || "Failed to initialize payment",
          variant: "destructive",
        });
        throw error;
      }
    },
    [razorpayLoaded, user, toast],
  );

  return {
    initiatePayment,
    payWithRazorpay,
    isLoading: createOrderMutation.isPending || verifyPaymentMutation.isPending,
    isError: createOrderMutation.isError || verifyPaymentMutation.isError,
    error: createOrderMutation.error || verifyPaymentMutation.error,
  };
};
