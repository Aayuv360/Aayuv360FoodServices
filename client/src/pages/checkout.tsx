import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { 
  useStripe, 
  useElements, 
  Elements, 
  PaymentElement 
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing Stripe public key. Please set VITE_STRIPE_PUBLIC_KEY environment variable.');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (error) {
        toast({
          title: "Payment failed",
          description: error.message || "An error occurred during payment processing",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Payment error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Pay Now"
        )}
      </Button>
    </form>
  );
};

const Checkout = () => {
  const [match, params] = useRoute("/checkout/:type");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Parse query parameters from URL
  const searchParams = new URLSearchParams(window.location.search);
  const amount = searchParams.get("amount");
  const planId = searchParams.get("planId");
  // Make sure to decode the URL parameter
  const paymentType = params?.type ? decodeURIComponent(params.type) : "one-time";
  
  // No need to redirect - AuthProtection component handles authentication

  // Create PaymentIntent on component mount
  useEffect(() => {
    if (!amount || !planId) {
      toast({
        title: "Invalid checkout parameters",
        description: "Missing amount or plan information",
        variant: "destructive",
      });
      
      // Log the issue for debugging
      console.error("Checkout params missing:", { amount, planId, paymentType, params });
      
      // If we're coming from subscription page, try to redirect back
      if (paymentType === "subscription") {
        setTimeout(() => {
          window.location.href = "/subscription";
        }, 2000);
      }
      return;
    }

    const createPaymentIntent = async () => {
      try {
        const endpoint = paymentType === "subscription" 
          ? "/api/get-or-create-subscription" 
          : "/api/create-payment-intent";
            
        const response = await apiRequest("POST", endpoint, {
          amount: parseFloat(amount),
          planId: planId,
        });
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setOrderDetails(data.orderDetails || { amount: parseFloat(amount) });
      } catch (error: any) {
        toast({
          title: "Payment setup failed",
          description: error.message || "Could not initialize payment",
          variant: "destructive",
        });
      }
    };

    createPaymentIntent();
  }, [amount, planId, paymentType, toast]);

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-gray-600">Setting up your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Complete Your Payment</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Checkout</CardTitle>
              <CardDescription>
                {paymentType === "subscription" 
                  ? "Subscribe to your millet meal plan" 
                  : "Complete your purchase"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orderDetails && (
                <div className="mb-6 p-4 bg-neutral-light rounded-lg">
                  <h3 className="font-medium mb-2">Order Summary</h3>
                  <div className="space-y-1 text-sm">
                    {orderDetails.planName && (
                      <div className="flex justify-between">
                        <span>Plan:</span>
                        <span>{orderDetails.planName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span>₹{(orderDetails.amount / 100).toFixed(2)}</span>
                    </div>
                    {orderDetails.tax && (
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>₹{(orderDetails.tax / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold border-t pt-2 mt-2">
                      <span>Total:</span>
                      <span className="text-primary">
                        ₹{(orderDetails.total ? orderDetails.total / 100 : orderDetails.amount / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm />
              </Elements>
            </CardContent>
            <CardFooter className="flex flex-col">
              <p className="text-xs text-gray-500 text-center mt-4">
                Your payment is secured with Stripe. We do not store your card details.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;