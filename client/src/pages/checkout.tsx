import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Loader2, CreditCard, MapPin, TruckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Form schema for address and payment details
const checkoutSchema = z.object({
  paymentMethod: z.enum(["cash", "upi", "netbanking"]),
  address: z.string().min(10, "Address must be at least 10 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().min(6, "Pincode must be 6 digits"),
  phone: z.string().min(10, "Phone number must be 10 digits"),
  notes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

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
  
  console.log("Checkout parameters:", { amount, planId, paymentType, searchParams: searchParams.toString() });
  
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
        // Use appropriate endpoint based on payment type
        let endpoint = "/api/create-payment-intent";
        if (paymentType === "subscription") {
          endpoint = "/api/get-or-create-subscription";
        }
        // Both cart and one-time purchases use create-payment-intent endpoint
            
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
              <CardTitle>
                {paymentType === "subscription" 
                  ? "Subscription Checkout" 
                  : paymentType === "cart" 
                    ? "Cart Checkout"
                    : "Checkout"}
              </CardTitle>
              <CardDescription>
                {paymentType === "subscription" 
                  ? "Subscribe to your millet meal plan" 
                  : paymentType === "cart"
                    ? "Complete your cart purchase"
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