import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Check, X } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, addMonths } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

// Subscription form schema
const subscriptionSchema = z.object({
  plan: z.enum(["basic", "premium", "family"]),
  startDate: z.date({
    required_error: "Please select a start date",
  }),
  paymentMethod: z.enum(["card", "upi", "bank"]),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
  upiId: z.string().optional(),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

const Subscription = () => {
  const [location, navigate] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const selectedPlanFromParams = searchParams.get("plan");
  const { toast } = useToast();
  const { user } = useAuth();

  // Redirect to login if not authenticated
  if (!user) {
    navigate("/login");
    return null;
  }

  // Default form values
  const defaultValues: SubscriptionFormValues = {
    plan: (selectedPlanFromParams as "basic" | "premium" | "family") || "basic",
    startDate: new Date(),
    paymentMethod: "card",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    upiId: "",
  };

  // Form setup
  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues,
  });

  // Watch payment method to show relevant fields
  const paymentMethod = form.watch("paymentMethod");
  const selectedPlan = form.watch("plan");

  // Subscription creation mutation
  const subscriptionMutation = useMutation({
    mutationFn: async (data: SubscriptionFormValues) => {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === data.plan);
      const payload = {
        plan: data.plan,
        startDate: data.startDate.toISOString(),
        mealsPerMonth: plan?.mealsPerMonth || 0,
        price: plan?.price || 0,
        isActive: true,
      };
      
      const res = await apiRequest("POST", "/api/subscriptions", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Subscription created",
        description: "Your subscription has been created successfully",
      });
      navigate("/profile?tab=subscriptions");
    },
    onError: (error: any) => {
      toast({
        title: "Error creating subscription",
        description: error.message || "There was an error creating your subscription",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: SubscriptionFormValues) => {
    subscriptionMutation.mutate(values);
  };

  // Get current selected plan details
  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan) || SUBSCRIPTION_PLANS[0];

  // Set plan from URL params
  useEffect(() => {
    if (selectedPlanFromParams) {
      const validPlan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanFromParams);
      if (validPlan) {
        form.setValue("plan", validPlan.id as "basic" | "premium" | "family");
      }
    }
  }, [selectedPlanFromParams, form]);

  return (
    <div className="min-h-screen bg-neutral-light py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Subscribe to MealMillet</h1>
          <p className="text-gray-600 mb-8">Select a plan and customize your subscription</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <Card 
                key={plan.id} 
                className={`cursor-pointer transition duration-300 hover:shadow-md ${
                  selectedPlan === plan.id 
                    ? "border-2 border-primary ring-2 ring-primary ring-opacity-50"
                    : ""
                }`}
                onClick={() => form.setValue("plan", plan.id as "basic" | "premium" | "family")}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {selectedPlan === plan.id && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-primary mb-2">
                    ₹{(plan.price / 100).toFixed(0)}
                    <span className="text-sm text-gray-500">/month</span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                        )}
                        <span className={feature.included ? "" : "text-gray-400"}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Customize Your Subscription</CardTitle>
              <CardDescription>
                Set your preferences and payment details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <FormField
                        control={form.control}
                        name="plan"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Selected Plan</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a plan" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SUBSCRIPTION_PLANS.map((plan) => (
                                  <SelectItem key={plan.id} value={plan.id}>
                                    {plan.name} - ₹{(plan.price / 100).toFixed(0)}/month
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Start Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className="w-full flex justify-start text-left font-normal"
                                  >
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
                                  disabled={(date) => date < new Date()}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Payment Method</FormLabel>
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
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
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
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex justify-between mb-2">
                      <span>Plan Price</span>
                      <span>₹{(currentPlan.price / 100).toFixed(2)}/month</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Tax</span>
                      <span>₹{((currentPlan.price * 0.05) / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                      <span>Total</span>
                      <span className="text-primary">
                        ₹{((currentPlan.price + currentPlan.price * 0.05) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={subscriptionMutation.isPending}
                  >
                    {subscriptionMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {subscriptionMutation.isPending
                      ? "Processing..."
                      : "Subscribe Now"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
