import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Check, X, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { format, addMonths, addDays, startOfWeek, getDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Address schema
const addressSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  addressLine1: z.string().min(5, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().min(6, "Valid pincode is required"),
  isDefault: z.boolean().default(false),
});

// Subscription form schema
const subscriptionSchema = z.object({
  plan: z.enum(["basic", "premium", "family"]),
  subscriptionType: z.enum(["default", "customized"]).default("default"),
  startDate: z.date({
    required_error: "Please select a start date",
  }),
  // Address information
  selectedAddressId: z.number().optional(),
  useNewAddress: z.boolean().default(false),
  newAddress: addressSchema.optional(),
  // Payment information
  paymentMethod: z.enum(["card", "upi", "bank"]),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
  upiId: z.string().optional(),
  customMealSelections: z.array(z.object({
    dayOfWeek: z.number(),
    mealId: z.number()
  })).optional(),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

// Type definition for subscription steps
type FormStep = "plan" | "address" | "payment";

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

  // State for multi-step form
  const [formStep, setFormStep] = useState<FormStep>("plan");
  
  // State for selected meal plan date and selected meals
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealsByDay, setSelectedMealsByDay] = useState<{[key: number]: number}>({});
  // State to store meal options for each day of the week
  const [mealOptionsByDay, setMealOptionsByDay] = useState<{[key: number]: any[]}>({});
  
  // Mock user addresses (in a real app, these would come from the API)
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      name: "Home",
      addressLine1: "123 Millet Street",
      addressLine2: "Apt 456",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500032",
      phone: "9876543210",
      isDefault: true
    },
    {
      id: 2,
      name: "Office",
      addressLine1: "789 Work Avenue",
      addressLine2: "Floor 3",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500081",
      phone: "9876543210",
      isDefault: false
    }
  ]);
  
  // Fetch available meals
  const { data: meals, isLoading: mealsLoading } = useQuery({
    queryKey: ["/api/meals"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/meals");
      return res.json();
    }
  });

  // Default form values
  const defaultValues: SubscriptionFormValues = {
    plan: (selectedPlanFromParams as "basic" | "premium" | "family") || "basic",
    subscriptionType: "default",
    startDate: new Date(),
    paymentMethod: "card",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    upiId: "",
    customMealSelections: [],
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
        subscriptionType: data.subscriptionType,
        startDate: data.startDate.toISOString(), // Convert to ISO string for consistency
        mealsPerMonth: plan?.mealsPerMonth || 0,
        price: plan?.price || 0,
        isActive: true,
        customMealSelections: data.customMealSelections || []
      };
      
      // First create the subscription
      const res = await apiRequest("POST", "/api/subscriptions", payload);
      const subscription = await res.json();
      
      // If customized plan and has meal selections, save the custom meal plans
      if (data.subscriptionType === "customized" && data.customMealSelections && data.customMealSelections.length > 0) {
        // Save each meal selection
        const customMealPromises = data.customMealSelections.map(selection => 
          apiRequest("POST", "/api/custom-meal-plans", {
            subscriptionId: subscription.id,
            dayOfWeek: selection.dayOfWeek,
            mealId: selection.mealId
          })
        );
        
        await Promise.all(customMealPromises);
      }
      
      return subscription;
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

  // Watch subscription type to show custom meal selection
  const subscriptionType = form.watch("subscriptionType");

  // Update custom meal selections when user makes changes
  const updateMealSelection = (dayOfWeek: number, mealId: number) => {
    setSelectedMealsByDay(prev => ({
      ...prev,
      [dayOfWeek]: mealId
    }));
    
    // Convert to array format for the form
    const mealSelections = Object.entries(selectedMealsByDay).map(([day, mealId]) => ({
      dayOfWeek: parseInt(day),
      mealId: mealId as number
    }));
    
    form.setValue("customMealSelections", mealSelections);
  };

  // Get day name from day number (0-6)
  const getDayName = (dayNumber: number): string => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dayNumber];
  };

  // Form submission handler
  const onSubmit = (values: SubscriptionFormValues) => {
    // Add the meal selections to the form data if using a customized plan
    if (values.subscriptionType === "customized" && Object.keys(selectedMealsByDay).length > 0) {
      const mealSelections = Object.entries(selectedMealsByDay).map(([day, mealId]) => ({
        dayOfWeek: parseInt(day),
        mealId: mealId as number
      }));
      
      values.customMealSelections = mealSelections;
    }
    
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
  
  // Distribute meals for each day when meals data is loaded
  useEffect(() => {
    if (meals && meals.length > 0) {
      // Shuffle meals to get a random distribution
      const shuffledMeals = [...meals].sort(() => Math.random() - 0.5);
      const mealCount = shuffledMeals.length;
      const mealsPerDay = 7; // Show 7 unique meals per day
      
      // Create a distribution of meals for each day of the week
      const mealsByDay: {[key: number]: any[]} = {};
      
      for (let day = 0; day < 7; day++) {
        // Get a unique set of meals for this day, cycling through the array if needed
        const startIndex = (day * mealsPerDay) % mealCount;
        let dayMeals = [];
        
        for (let i = 0; i < mealsPerDay; i++) {
          const index = (startIndex + i) % mealCount;
          dayMeals.push(shuffledMeals[index]);
        }
        
        mealsByDay[day] = dayMeals;
      }
      
      setMealOptionsByDay(mealsByDay);
    }
  }, [meals]);

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
                        name="subscriptionType"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Subscription Type</FormLabel>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="default" id="default" />
                                <Label htmlFor="default">Default Plan</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="customized" id="customized" />
                                <Label htmlFor="customized">Customized (Select meals for each day)</Label>
                              </div>
                            </RadioGroup>
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

                  {subscriptionType === "customized" && (
                    <div className="border-t pt-6 mb-6">
                      <h3 className="text-lg font-semibold mb-4">Customize Your Weekly Meal Plan</h3>
                      {mealsLoading ? (
                        <div className="flex items-center justify-center h-40">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 gap-4">
                            {/* Day selection */}
                            <div>
                              <p className="text-sm text-gray-600 mb-3">
                                Each day of the week features 7 unique meal options. Select a day to see its special menu.
                              </p>
                              <div className="flex flex-wrap gap-2 mb-4">
                                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                                  <Button
                                    key={day}
                                    type="button"
                                    variant={selectedDate && getDay(selectedDate) === day ? "default" : "outline"}
                                    onClick={() => {
                                      // Set the selected date to the next occurrence of this day
                                      const today = new Date();
                                      const currentDay = getDay(today);
                                      const daysUntilNext = (day - currentDay + 7) % 7;
                                      const nextOccurrence = addDays(today, daysUntilNext);
                                      setSelectedDate(nextOccurrence);
                                    }}
                                  >
                                    {getDayName(day)}
                                  </Button>
                                ))}
                              </div>
                            </div>

                            {/* Meal options for selected day */}
                            {selectedDate && (
                              <div>
                                <h4 className="text-md font-medium mb-3">
                                  Select meal for {format(selectedDate, "EEEE")}:
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                  {mealOptionsByDay[getDay(selectedDate)] && mealOptionsByDay[getDay(selectedDate)].map((meal: any) => (
                                    <Card 
                                      key={meal.id}
                                      className={`cursor-pointer hover:border-primary ${
                                        selectedMealsByDay[getDay(selectedDate)] === meal.id 
                                          ? "border-2 border-primary" 
                                          : ""
                                      }`}
                                      onClick={() => updateMealSelection(getDay(selectedDate), meal.id)}
                                    >
                                      <CardContent className="p-3">
                                        <div className="flex items-start gap-2">
                                          {selectedMealsByDay[getDay(selectedDate)] === meal.id && (
                                            <div className="bg-primary text-white rounded-full p-1 mt-1">
                                              <Check className="h-3 w-3" />
                                            </div>
                                          )}
                                          <div>
                                            <h5 className="font-medium text-sm">{meal.name}</h5>
                                            <p className="text-xs text-gray-500 line-clamp-2">{meal.description}</p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Selected meal summary */}
                          <div className="bg-neutral-light p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Your Weekly Meal Selections</h4>
                            {Object.keys(selectedMealsByDay).length > 0 ? (
                              <ul className="space-y-1">
                                {Object.entries(selectedMealsByDay).map(([day, mealId]) => {
                                  const meal = meals?.find((m: any) => m.id === mealId);
                                  return (
                                    <li key={day} className="flex justify-between">
                                      <span className="font-medium">{getDayName(parseInt(day))}:</span>
                                      <span>{meal ? meal.name : "No meal selected"}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500">No meals selected yet. Select a day and choose your meal.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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
