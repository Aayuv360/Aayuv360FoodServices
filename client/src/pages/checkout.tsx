import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Clock, MapPin, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addHours, setHours, setMinutes } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DELIVERY_TIME_SLOTS } from "@/lib/constants";

// Checkout form schema
const checkoutSchema = z.object({
  deliveryAddress: z.string().min(5, "Address must be at least 5 characters"),
  deliveryDate: z.date({
    required_error: "Please select a delivery date",
  }),
  deliveryTime: z.string().min(1, "Please select a delivery time"),
  paymentMethod: z.enum(["card", "upi", "bank", "cod"]),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
  upiId: z.string().optional(),
  specialInstructions: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const Checkout = () => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();

  // Redirect if not authenticated
  if (!user) {
    navigate("/login");
    return null;
  }

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Add some items first.",
        variant: "destructive",
      });
      navigate("/menu");
    }
  }, [cartItems, navigate, toast]);

  // Default form values
  const defaultValues: CheckoutFormValues = {
    deliveryAddress: user?.address || "",
    deliveryDate: addHours(new Date(), 3), // Default to 3 hours from now
    deliveryTime: "18:00-19:00", // Default to evening slot
    paymentMethod: "card",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    upiId: "",
    specialInstructions: "",
  };

  // Form setup
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues,
  });

  // Watch payment method to show relevant fields
  const paymentMethod = form.watch("paymentMethod");
  const deliveryDate = form.watch("deliveryDate");

  // Calculate order total
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.meal?.price || 0) * item.quantity,
    0
  );
  const deliveryFee = 4000; // ₹40
  const tax = Math.round(subtotal * 0.05); // 5% tax
  const total = subtotal + deliveryFee + tax;

  // Format price in Indian Rupees
  const formatPrice = (price: number) => {
    return `₹${(price / 100).toFixed(2)}`;
  };

  // Order creation mutation
  const orderMutation = useMutation({
    mutationFn: async (data: CheckoutFormValues) => {
      // Combine delivery date and time
      const [hours, minutes] = data.deliveryTime.split(":")[0].split("-")[0].split(":");
      const deliveryDateTime = setMinutes(setHours(data.deliveryDate, parseInt(hours)), parseInt(minutes) || 0);
      
      const payload = {
        deliveryAddress: data.deliveryAddress,
        deliveryTime: deliveryDateTime.toISOString(),
        totalPrice: total,
        // In a real app, we would process payment here and include payment details
      };
      
      const res = await apiRequest("POST", "/api/orders", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      clearCart(); // Clear the cart after successful order
      toast({
        title: "Order placed successfully",
        description: "Your order has been placed and will be delivered soon",
      });
      navigate("/profile?tab=orders");
    },
    onError: (error: any) => {
      toast({
        title: "Error placing order",
        description: error.message || "There was an error placing your order",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: CheckoutFormValues) => {
    orderMutation.mutate(values);
  };

  if (cartItems.length === 0) {
    return null; // Don't render anything if cart is empty (user will be redirected)
  }

  return (
    <div className="min-h-screen bg-neutral-light py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <p className="text-gray-600 mb-8">Complete your order to get fresh millet meals delivered</p>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Checkout Form */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Delivery Details</h2>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="deliveryAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter your full delivery address" 
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="deliveryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="w-full flex justify-start text-left font-normal"
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                disabled={(date) => 
                                  date < new Date() || 
                                  date > new Date(new Date().setDate(new Date().getDate() + 7))
                                }
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deliveryTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Time</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select time slot" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DELIVERY_TIME_SLOTS.map((slot) => (
                                <SelectItem key={slot.value} value={slot.value}>
                                  <div className="flex items-center">
                                    <Clock className="mr-2 h-4 w-4" />
                                    {slot.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-xl font-bold">Payment Method</h2>
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="card">Credit/Debit Card</SelectItem>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="bank">Bank Transfer</SelectItem>
                              <SelectItem value="cod">Cash on Delivery</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {paymentMethod === "card" && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="cardNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Card Number</FormLabel>
                              <FormControl>
                                <Input placeholder="1234 5678 9012 3456" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="cardExpiry"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Expiry Date</FormLabel>
                                <FormControl>
                                  <Input placeholder="MM/YY" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="cardCvv"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CVV</FormLabel>
                                <FormControl>
                                  <Input placeholder="123" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === "upi" && (
                      <FormField
                        control={form.control}
                        name="upiId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UPI ID</FormLabel>
                            <FormControl>
                              <Input placeholder="name@upi" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {paymentMethod === "bank" && (
                      <div className="bg-neutral-light p-4 rounded-lg">
                        <h3 className="font-medium mb-2">Bank Transfer Details</h3>
                        <p className="text-sm text-gray-600 mb-1">Account Name: MealMillet Services</p>
                        <p className="text-sm text-gray-600 mb-1">Account Number: 1234567890</p>
                        <p className="text-sm text-gray-600 mb-1">IFSC Code: MEAL0001234</p>
                        <p className="text-sm text-gray-600">Bank: Millet Bank</p>
                      </div>
                    )}

                    {paymentMethod === "cod" && (
                      <div className="bg-neutral-light p-4 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Please keep exact change ready at the time of delivery.
                        </p>
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="specialInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Instructions (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any special instructions for delivery or meal preparation" 
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={orderMutation.isPending}
                  >
                    {orderMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {orderMutation.isPending
                      ? "Processing Your Order..."
                      : `Place Order - ${formatPrice(total)}`}
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 rounded overflow-hidden">
                      <img
                        src={item.meal?.imageUrl}
                        alt={item.meal?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.meal?.name}</h4>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Qty: {item.quantity}</span>
                        <span className="font-medium">{formatPrice((item.meal?.price || 0) * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Order Details */}
              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Tax</span>
                  <span>{formatPrice(tax)}</span>
                </div>
              </div>
              
              {/* Total */}
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-xl font-bold text-primary">{formatPrice(total)}</span>
                </div>
              </div>
              
              {/* Delivery Info */}
              <div className="bg-neutral-light rounded-lg p-4">
                <div className="flex items-start mb-2">
                  <Clock className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Estimated Delivery</p>
                    <p className="text-sm text-gray-600">
                      {deliveryDate && format(deliveryDate, "EEEE, MMMM d")} between {form.watch("deliveryTime").replace("-", " - ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Delivery Address</p>
                    <p className="text-sm text-gray-600">{form.watch("deliveryAddress") || "Please enter your address"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
