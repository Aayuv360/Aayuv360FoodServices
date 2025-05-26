import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { formatPrice } from "@/lib/utils";
import {
  Loader2,
  Check,
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  PlusCircle,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRazorpay } from "@/hooks/use-razorpay";
import { apiRequest } from "@/lib/queryClient";

const addressSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().min(6, "Valid pincode is required"),
  isDefault: z.boolean().default(false),
});

const subscriptionSchema = z.object({
  plan: z.enum(["basic", "premium", "family"]),
  dietaryPreference: z.enum(["veg", "veg_with_egg", "nonveg"]),
  personCount: z
    .number()
    .min(1, "At least 1 person required")
    .max(10, "Maximum 10 persons allowed")
    .default(1),
  subscriptionType: z.enum(["default"]).default("default"),
  startDate: z.date({
    required_error: "Please select a start date",
  }),
  selectedAddressId: z.number().optional(),
  useNewAddress: z.boolean().default(false),
  newAddress: addressSchema.optional(),
  paymentMethod: z.enum(["card", "upi", "bank"]),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
  upiId: z.string().optional(),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;
type FormStep = "plan" | "address" | "payment";

const Subscription = () => {
  const [location, navigate] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const selectedPlanFromParams = searchParams.get("plan");
  const { toast } = useToast();
  const { user } = useAuth();
  const { initiatePayment } = useRazorpay();
  const [formStep, setFormStep] = useState<FormStep>("plan");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedDietaryFilter, setSelectedDietaryFilter] = useState<'veg' | 'veg_with_egg' | 'nonveg'>('veg');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const { data: subscriptionPlans, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/subscription-plans"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/subscription-plans");
      return res.json();
    },
  });

  // Filter plans based on selected dietary preference
  const filteredPlans = subscriptionPlans
    ? subscriptionPlans.filter(
        (plan: any) => plan.dietaryPreference === selectedDietaryFilter,
      )
    : [];

  const defaultValues: SubscriptionFormValues = {
    plan: "basic",
    dietaryPreference: "veg",
    personCount: 1,
    subscriptionType: "default",
    startDate: new Date(),
    useNewAddress: false,
    paymentMethod: "card",
  };

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues,
  });

  // Set default vegetarian plan when data loads
  useEffect(() => {
    if (subscriptionPlans && !selectedPlan) {
      const vegPlans = subscriptionPlans.filter((plan: any) => plan.dietaryPreference === 'veg');
      if (vegPlans.length > 0) {
        const basicPlan = vegPlans.find((plan: any) => plan.planType === 'basic') || vegPlans[0];
        setSelectedPlan(basicPlan);
        form.setValue("plan", basicPlan.planType as "basic" | "premium" | "family");
      }
    }
  }, [subscriptionPlans, selectedPlan, form]);

  const subscriptionMutation = useMutation({
    mutationFn: async (values: SubscriptionFormValues) => {
      const res = await apiRequest("POST", "/api/subscriptions", values);
      return res.json();
    },
  });

  const onSubmit = async (values: SubscriptionFormValues) => {
    if (formStep === "plan") {
      if (!selectedPlan) {
        toast({
          title: "Error",
          description: "Please select a subscription plan",
          variant: "destructive",
        });
        return;
      }
      setFormStep("address");
    } else if (formStep === "address") {
      setFormStep("payment");
    } else if (formStep === "payment") {
      // Handle payment
      try {
        setPaymentLoading(true);
        await subscriptionMutation.mutateAsync(values);
        toast({
          title: "Success",
          description: "Subscription created successfully!",
        });
        navigate("/dashboard");
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create subscription",
          variant: "destructive",
        });
      } finally {
        setPaymentLoading(false);
      }
    }
  };

  const renderStepContent = () => {
    switch (formStep) {
      case "plan":
        return (
          <div className="space-y-6">
            {/* Dietary Preference Selection */}
            <div>
              <h3 className="text-lg font-medium mb-4">Dietary Preference</h3>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant={selectedDietaryFilter === "veg" ? "default" : "outline"}
                  className={`p-4 h-auto flex flex-col items-center gap-2 ${
                    selectedDietaryFilter === "veg" ? "bg-green-600 hover:bg-green-700" : ""
                  }`}
                  onClick={() => {
                    setSelectedDietaryFilter("veg");
                    setSelectedPlan(null);
                  }}
                >
                  <span className="font-medium">Vegetarian</span>
                  <span className="text-xs text-center opacity-80">
                    Pure vegetarian meals with no eggs or meat
                  </span>
                </Button>
                
                <Button
                  type="button"
                  variant={selectedDietaryFilter === "veg_with_egg" ? "default" : "outline"}
                  className={`p-4 h-auto flex flex-col items-center gap-2 ${
                    selectedDietaryFilter === "veg_with_egg" ? "bg-orange-600 hover:bg-orange-700" : ""
                  }`}
                  onClick={() => {
                    setSelectedDietaryFilter("veg_with_egg");
                    setSelectedPlan(null);
                  }}
                >
                  <span className="font-medium">Veg with Egg</span>
                  <span className="text-xs text-center opacity-80">
                    Vegetarian meals with egg options
                  </span>
                </Button>
                
                <Button
                  type="button"
                  variant={selectedDietaryFilter === "nonveg" ? "default" : "outline"}
                  className={`p-4 h-auto flex flex-col items-center gap-2 ${
                    selectedDietaryFilter === "nonveg" ? "bg-red-600 hover:bg-red-700" : ""
                  }`}
                  onClick={() => {
                    setSelectedDietaryFilter("nonveg");
                    setSelectedPlan(null);
                  }}
                >
                  <span className="font-medium">Non-Vegetarian</span>
                  <span className="text-xs text-center opacity-80">
                    Complete non-vegetarian meal experience
                  </span>
                </Button>
              </div>
            </div>

            {/* Plan Selection based on Dietary Preference */}
            <div>
              <h3 className="text-lg font-medium mb-4">Choose Your Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredPlans.map((plan: any) => (
                  <Card
                    key={plan.id}
                    className={`cursor-pointer transition-all border-2 ${
                      selectedPlan?.id === plan.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-primary/50"
                    }`}
                    onClick={() => {
                      setSelectedPlan(plan);
                      form.setValue("plan", plan.planType as "basic" | "premium" | "family");
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        {selectedPlan?.id === plan.id && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-2xl font-bold text-primary">
                          {formatPrice(plan.price)}
                          <span className="text-sm font-normal text-gray-600">/month</span>
                        </div>
                        
                        <div className="space-y-2">
                          {plan.features.map((feature: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Check className="h-4 w-4 text-green-600" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Start Date and Person Count */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="personCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Persons</FormLabel>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => field.onChange(Math.max(1, field.value - 1))}
                        disabled={field.value <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="flex-1">
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          className="text-center"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => field.onChange(Math.min(10, field.value + 1))}
                        disabled={field.value >= 10}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Order Summary */}
            {selectedPlan && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-4">Order Summary</h3>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Plan:</span> {selectedPlan.name}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Dietary Preference:</span>{" "}
                  {selectedDietaryFilter === 'veg' ? 'Vegetarian' : 
                   selectedDietaryFilter === 'veg_with_egg' ? 'Veg with Egg' : 'Non-Vegetarian'}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Start Date:</span>{" "}
                  {format(form.watch("startDate"), "PPP")}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Persons:</span> {form.watch("personCount")}
                </p>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Plan Price</span>
                    <span className="text-sm">{formatPrice(selectedPlan.price)}/month</span>
                  </div>

                  {form.watch("personCount") > 1 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Number of persons</span>
                      <span className="text-sm">× {form.watch("personCount")}</span>
                    </div>
                  )}

                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total Monthly Price</span>
                      <span className="text-lg text-primary">
                        {formatPrice(selectedPlan.price * form.watch("personCount"))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "address":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Delivery Address</h3>
            <p className="text-sm text-gray-600">Please provide your delivery address</p>
            {/* Address form would go here */}
          </div>
        );

      case "payment":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Payment Details</h3>
            <p className="text-sm text-gray-600">Complete your subscription payment</p>
            {/* Payment form would go here */}
          </div>
        );

      default:
        return null;
    }
  };

  if (plansLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Loading subscription plans...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-gray-600">Select a plan and customize your meals</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {["Plan", "Address", "Payment"].map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index === 0 && formStep === "plan"
                    ? "bg-primary text-white"
                    : index === 1 && formStep === "address"
                    ? "bg-primary text-white"
                    : index === 2 && formStep === "payment"
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {index + 1}
              </div>
              <span className="ml-2 text-sm font-medium">{step}</span>
              {index < 2 && <ArrowRight className="ml-4 h-4 w-4 text-gray-400" />}
            </div>
          ))}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {renderStepContent()}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (formStep === "address") setFormStep("plan");
                else if (formStep === "payment") setFormStep("address");
              }}
              disabled={formStep === "plan"}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <Button
              type="submit"
              disabled={paymentLoading || (formStep === "plan" && !selectedPlan)}
              className="min-w-[120px]"
            >
              {paymentLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : formStep === "payment" ? (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay Now
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Subscription;