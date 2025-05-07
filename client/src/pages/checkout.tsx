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
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
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
  
  // Set up form with default values
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "cash",
      address: user?.address || "",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "",
      phone: user?.phone || "",
      notes: "",
    },
  });
  
  // Initialize order details on mount
  useEffect(() => {
    if (!amount || !planId) {
      toast({
        title: "Invalid checkout parameters",
        description: "Missing amount or plan information",
        variant: "destructive",
      });
      
      console.error("Checkout params missing:", { amount, planId, paymentType, params });
      
      // If we're coming from subscription page, try to redirect back
      if (paymentType === "subscription") {
        setTimeout(() => {
          navigate("/subscription");
        }, 2000);
      }
      return;
    }
    
    // Calculate the order details
    const amountValue = parseFloat(amount);
    const taxAmount = Math.round(amountValue * 0.05); // 5% tax
    const totalAmount = amountValue + taxAmount;
    
    setOrderDetails({
      amount: amountValue,
      tax: taxAmount,
      total: totalAmount,
      planName: planId,
    });
    
  }, [amount, planId, paymentType, toast, navigate]);
  
  // Submit order
  const onSubmit = async (data: CheckoutFormValues) => {
    if (!amount || !planId) {
      toast({
        title: "Invalid checkout parameters",
        description: "Missing amount or plan information",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Use appropriate endpoint based on payment type
      let endpoint = "/api/create-payment-intent";
      if (paymentType === "subscription") {
        endpoint = "/api/get-or-create-subscription";
      }
      
      const response = await apiRequest("POST", endpoint, {
        amount: parseFloat(amount),
        planId: planId,
        address: `${data.address}, ${data.city}, ${data.state} - ${data.pincode}`,
        paymentMethod: data.paymentMethod,
        phone: data.phone,
        notes: data.notes,
      });
      
      const responseData = await response.json();
      
      if (responseData.success) {
        // Successfully created order/subscription
        toast({
          title: "Order placed successfully!",
          description: "Your order has been confirmed",
        });
        
        // Invalidate relevant queries
        if (paymentType === "subscription") {
          queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
        } else {
          queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        }
        
        // Redirect to success page
        navigate("/payment-success");
      } else {
        toast({
          title: "Order failed",
          description: responseData.message || "There was an error processing your order",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-gray-600">Preparing checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Complete Your Order</h1>
          
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
              {/* Order Summary */}
              <div className="mb-6 p-4 bg-neutral-light rounded-lg">
                <h3 className="font-medium mb-2">Order Summary</h3>
                <div className="space-y-1 text-sm">
                  {orderDetails.planName && (
                    <div className="flex justify-between">
                      <span>Plan:</span>
                      <span className="capitalize">{orderDetails.planName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>₹{orderDetails.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (5%):</span>
                    <span>₹{orderDetails.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span className="text-primary">
                      ₹{orderDetails.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Checkout Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-muted-foreground" />
                      Delivery Information
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter your full address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="pincode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pincode</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                      Payment Method
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="cash" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Cash on Delivery
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="upi" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  UPI Payment
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="netbanking" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Net Banking
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Instructions (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any special delivery instructions or notes" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full mt-6" 
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <TruckIcon className="mr-2 h-4 w-4" />
                        Complete Order
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            
            <CardFooter className="flex flex-col">
              <p className="text-xs text-gray-500 text-center mt-4">
                Your order will be delivered within 24 hours of confirmation.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;