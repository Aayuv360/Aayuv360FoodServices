import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Check,
  X,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
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
  SelectValue,
} from "@/components/ui/select";
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
  CardFooter,
} from "@/components/ui/card";
import { format, addMonths, addDays, startOfWeek, getDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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

const subscriptionSchema = z.object({
  plan: z.enum(["basic", "premium", "family"]),
  dietaryPreference: z.enum(["vegetarian", "veg-with-egg", "non-vegetarian"]),
  personCount: z.number().min(1, "At least 1 person required").max(10, "Maximum 10 persons allowed").default(1),
  subscriptionType: z.enum(["default", "customized"]).default("default"),
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
  customMealSelections: z
    .array(
      z.object({
        dayOfWeek: z.number(),
        mealId: z.number(),
      }),
    )
    .optional(),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

type FormStep = "plan" | "address" | "payment";

const Subscription = () => {
  const [location, navigate] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const selectedPlanFromParams = searchParams.get("plan");
  const { toast } = useToast();
  const { user } = useAuth();

  if (!user) {
    navigate("/login");
    return null;
  }

  const [formStep, setFormStep] = useState<FormStep>("plan");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealsByDay, setSelectedMealsByDay] = useState<{
    [key: number]: number;
  }>({});
  const [mealOptionsByDay, setMealOptionsByDay] = useState<{
    [key: number]: any[];
  }>({});

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
      isDefault: true,
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
      isDefault: false,
    },
  ]);

  const { data: meals, isLoading: mealsLoading } = useQuery({
    queryKey: ["/api/meals"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/meals");
      return res.json();
    },
  });

  const defaultValues: SubscriptionFormValues = {
    plan: (selectedPlanFromParams as any) || "basic",
    dietaryPreference: "vegetarian",
    personCount: 1,
    subscriptionType: "default",
    startDate: new Date(),
    useNewAddress: false,
    paymentMethod: "card",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    upiId: "",
    customMealSelections: [],
  };

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues,
  });

  const paymentMethod = form.watch("paymentMethod");
  const selectedPlan = form.watch("plan");
  const subscriptionType = form.watch("subscriptionType");

  const [isSuccess, setIsSuccess] = useState(false);
  const [subscribedDetails, setSubscribedDetails] = useState<{
    planName: string;
    startDate: Date;
    dietaryPreference: string;
    personCount: number;
    totalPrice: number;
  } | null>(null);

  const subscriptionMutation = useMutation({
    mutationFn: async (data: SubscriptionFormValues) => {
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === data.plan);

      if (!plan) {
        throw new Error("Invalid plan selected");
      }

      const payload = {
        userId: user?.id,
        plan: data.plan,
        subscriptionType: data.subscriptionType,
        startDate: data.startDate.toISOString(),
        mealsPerMonth: plan.mealsPerMonth || 0,
        price: plan.price || 0,
        status: "active",
        paymentMethod: data.paymentMethod,
        dietaryPreference: data.dietaryPreference,
        personCount: data.personCount,
      };

      const response = await apiRequest("POST", "/api/subscriptions", payload);
      const subscription = await response.json();

      if (
        data.subscriptionType === "customized" &&
        data.customMealSelections &&
        data.customMealSelections.length > 0
      ) {
        for (const mealSelection of data.customMealSelections) {
          await apiRequest("POST", "/api/custom-meal-plans", {
            subscriptionId: subscription.id,
            dayOfWeek: mealSelection.dayOfWeek,
            mealId: mealSelection.mealId,
          });
        }
      }

      // Save subscription details for success page
      setSubscribedDetails({
        planName: plan.name,
        startDate: data.startDate,
        dietaryPreference: data.dietaryPreference,
        personCount: data.personCount,
        totalPrice: totalPrice,
      });

      toast({
        title: "Subscription Successful!",
        description: `You have successfully subscribed to the ${plan.name} plan. Your millet meals will be delivered according to your schedule.`,
        variant: "default",
      });

      return subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      setIsSuccess(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error processing subscription",
        description:
          error.message || "There was an error with your subscription",
        variant: "destructive",
      });
    },
  });

  const updateMealSelection = (dayOfWeek: number, mealId: number) => {
    setSelectedMealsByDay((prev) => ({
      ...prev,
      [dayOfWeek]: mealId,
    }));

    const mealSelections = Object.entries(selectedMealsByDay).map(
      ([day, mealId]) => ({
        dayOfWeek: parseInt(day),
        mealId: mealId as number,
      }),
    );

    form.setValue("customMealSelections", mealSelections);
  };

  const getDayName = (dayNumber: number): string => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[dayNumber];
  };

  const goToNextStep = () => {
    if (formStep === "plan") {
      setFormStep("address");
    } else if (formStep === "address") {
      setFormStep("payment");
    }
  };

  const goToPreviousStep = () => {
    if (formStep === "payment") {
      setFormStep("address");
    } else if (formStep === "address") {
      setFormStep("plan");
    }
  };

  const selectAddress = (addressId: number) => {
    form.setValue("selectedAddressId", addressId);
    form.setValue("useNewAddress", false);
  };

  const toggleNewAddressForm = () => {
    form.setValue("useNewAddress", !form.watch("useNewAddress"));
    if (form.watch("useNewAddress")) {
      form.setValue("selectedAddressId", undefined);
    }
  };

  const onSubmit = (values: SubscriptionFormValues) => {
    if (formStep === "plan") {
      if (
        values.subscriptionType === "customized" &&
        Object.keys(selectedMealsByDay).length === 0
      ) {
        toast({
          title: "Meal selection required",
          description:
            "Please select at least one meal for your customized plan",
          variant: "destructive",
        });
        return;
      }

      goToNextStep();
      return;
    }

    if (formStep === "address") {
      if (!values.selectedAddressId && !values.useNewAddress) {
        toast({
          title: "Address required",
          description: "Please select an existing address or add a new one",
          variant: "destructive",
        });
        return;
      }

      if (values.useNewAddress && !values.newAddress) {
        toast({
          title: "New address details required",
          description: "Please fill in all the required address fields",
          variant: "destructive",
        });
        return;
      }

      goToNextStep();
      return;
    }

    if (
      values.subscriptionType === "customized" &&
      Object.keys(selectedMealsByDay).length > 0
    ) {
      const mealSelections = Object.entries(selectedMealsByDay).map(
        ([day, mealId]) => ({
          dayOfWeek: parseInt(day),
          mealId: mealId as number,
        }),
      );

      values.customMealSelections = mealSelections;
    }

    toast({
      title: "Processing subscription...",
      description: "Your subscription request is being processed.",
    });

    subscriptionMutation.mutate(values);
  };

  const getPriceAdjustment = (preference: string) => {
    switch (preference) {
      case "vegetarian":
        return 0;
      case "veg-with-egg":
        return 200;
      case "non-vegetarian":
        return 500;
      default:
        return 0;
    }
  };

  const basePlan =
    SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlan) ||
    SUBSCRIPTION_PLANS[0];
  const dietaryPreference = form.watch("dietaryPreference");
  const personCount = form.watch("personCount") || 1;
  const priceAdjustment = getPriceAdjustment(dietaryPreference);
  
  // Calculate price based on plan, dietary preference, and person count
  const basePrice = basePlan.price;
  const dietaryAddOn = priceAdjustment;
  const totalPricePerPerson = basePrice + dietaryAddOn;
  const totalPrice = totalPricePerPerson * personCount;

  const currentPlan = {
    ...basePlan,
    price: totalPrice,
    adjustedPrice: true,
    basePrice: basePrice,
    dietaryAddOn: dietaryAddOn,
    personCount: personCount,
    pricePerPerson: totalPricePerPerson,
    basePriceText: `₹${(basePrice / 100).toFixed(0)}${dietaryAddOn > 0 ? ` + ₹${(dietaryAddOn / 100).toFixed(0)}` : ''}${personCount > 1 ? ` × ${personCount} persons` : ''}`,
  };

  useEffect(() => {
    if (selectedPlanFromParams) {
      const validPlan = SUBSCRIPTION_PLANS.find(
        (p) => p.id === selectedPlanFromParams,
      );
      if (validPlan) {
        form.setValue("plan", validPlan.id as any);
      }
    }
  }, [selectedPlanFromParams, form]);

  useEffect(() => {
    if (meals && meals.length > 0) {
      const shuffledMeals = [...meals].sort(() => Math.random() - 0.5);
      const mealCount = shuffledMeals.length;
      const mealsPerDay = 7;

      const mealsByDay: { [key: number]: any[] } = {};

      for (let day = 0; day < 7; day++) {
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

  const renderStepContent = () => {
    switch (formStep) {
      case "plan":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex space-x-2 mb-4">
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <Button
                      key={plan.id}
                      type="button"
                      variant={
                        form.watch("plan") === plan.id ? "default" : "outline"
                      }
                      className={`flex-1 ${form.watch("plan") === plan.id ? "bg-primary" : ""}`}
                      onClick={() =>
                        form.setValue(
                          "plan",
                          plan.id as "basic" | "premium" | "family",
                        )
                      }
                    >
                      {plan.name}
                    </Button>
                  ))}
                </div>

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
                          <Label htmlFor="customized">
                            Customized (Select meals for each day)
                          </Label>
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
                  name="personCount"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Number of Persons</FormLabel>
                      <div className="flex items-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            const newValue = Math.max(1, field.value - 1);
                            form.setValue("personCount", newValue);
                          }}
                          disabled={field.value <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <FormControl>
                          <Input
                            type="number"
                            className="h-8 w-16 mx-2 text-center"
                            {...field}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value) && value >= 1 && value <= 10) {
                                field.onChange(value);
                              }
                            }}
                            min={1}
                            max={10}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            const newValue = Math.min(10, field.value + 1);
                            form.setValue("personCount", newValue);
                          }}
                          disabled={field.value >= 10}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <span className="ml-3 text-sm text-gray-500">
                          (1-10 persons)
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <div className="bg-neutral-light p-4 rounded-lg">
                  <h3 className="font-medium">Selected Plan Details</h3>
                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-semibold text-primary">
                        {currentPlan.name}
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          form.watch("dietaryPreference") === "vegetarian"
                            ? "bg-green-100 text-green-800"
                            : form.watch("dietaryPreference") === "veg-with-egg"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                        }
                      >
                        {form.watch("dietaryPreference") === "vegetarian"
                          ? "Vegetarian"
                          : form.watch("dietaryPreference") === "veg-with-egg"
                            ? "Veg with Egg"
                            : "Non-Vegetarian"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {currentPlan.description}
                    </p>
                    <div className="mt-3 bg-white p-3 rounded-md border border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Price per person:</span>
                        <span className="text-sm">₹{((basePrice + dietaryAddOn) / 100).toFixed(0)}</span>
                      </div>
                      {personCount > 1 && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm font-medium">Number of persons:</span>
                          <span className="text-sm">{personCount}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-1 border-t pt-2">
                        <span className="text-sm font-medium">Total monthly price:</span>
                        <span className="text-sm font-semibold">₹{(totalPrice / 100).toFixed(0)}</span>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {currentPlan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start text-sm">
                          {feature.included ? (
                            <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                          )}
                          <span>{feature.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {subscriptionType !== "customized" && (
              <div className="border-t pt-6 mb-2">
                <h4 className="font-medium text-sm mb-2">
                  Meal Schedule ({currentPlan.duration} days)
                </h4>
                <div className="flex flex-wrap gap-3 max-h-72 overflow-y-auto pr-2">
                  {currentPlan.weeklyMeals &&
                    Array.from({
                      length: Math.min(currentPlan.duration, 30),
                    }).map((_, index) => {
                      const startDate = new Date(form.watch("startDate"));
                      const mealDate = new Date(startDate);
                      mealDate.setDate(startDate.getDate() + index);
                      const dayOfWeek = mealDate.getDay();
                      const dayNames = [
                        "sunday",
                        "monday",
                        "tuesday",
                        "wednesday",
                        "thursday",
                        "friday",
                        "saturday",
                      ];
                      const dayName = dayNames[dayOfWeek];

                      const formattedDate = format(mealDate, "MMM d");
                      const meals =
                        currentPlan.weeklyMeals[
                          dayName as keyof typeof currentPlan.weeklyMeals
                        ];

                      const curryType =
                        form.watch("dietaryPreference") === "vegetarian"
                          ? "Vegetable curry"
                          : form.watch("dietaryPreference") === "veg-with-egg"
                            ? "Egg curry"
                            : "Chicken curry";

                      return (
                        <div
                          key={index}
                          className="bg-white p-2 rounded border w-64"
                        >
                          <p className="font-medium capitalize flex justify-between">
                            <span>
                              Day {index + 1}: {dayName}
                            </span>
                            <span className="text-gray-500 text-sm">
                              {formattedDate}
                            </span>
                          </p>
                          <div className="mt-1">
                            <p className="text-sm font-medium">{meals.main}</p>
                            <p className="text-xs text-gray-600">
                              With: {curryType}, {meals.sides.join(", ")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {subscriptionType === "customized" && (
              <div className="border-t pt-6 mb-2">
                <h3 className="text-lg font-semibold mb-4">
                  Customize Your Weekly Meal Plan
                </h3>
                {mealsLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <div>
                        <p className="text-sm text-gray-600 mb-3">
                          Select a day to customize your meal (Plan duration:{" "}
                          {currentPlan.duration} days):
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {Array.from({
                            length: Math.min(currentPlan.duration, 30),
                          }).map((_, index) => {
                            const startDate = new Date(form.watch("startDate"));
                            const mealDate = new Date(startDate);
                            mealDate.setDate(startDate.getDate() + index);

                            // Calculate which day of the week this is (0-6)
                            const dayOfWeek = mealDate.getDay();

                            // Map to the day name
                            const dayName = getDayName(dayOfWeek);

                            // Get a formatted date string
                            const formattedDate = format(mealDate, "d");

                            return (
                              <Button
                                key={index}
                                type="button"
                                variant={
                                  selectedDate &&
                                  selectedDate.getDate() ===
                                    mealDate.getDate() &&
                                  selectedDate.getMonth() ===
                                    mealDate.getMonth()
                                    ? "default"
                                    : "outline"
                                }
                                onClick={() => {
                                  setSelectedDate(mealDate);
                                }}
                                className="flex-1"
                              >
                                <span className="text-xs">Day {index + 1}</span>
                                <span className="block text-xs">
                                  {dayName} {formattedDate}
                                </span>
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Meal selection */}
                      {selectedDate && (
                        <div>
                          <p className="text-sm text-gray-600 mb-3">
                            Select a meal for{" "}
                            {getDayName(selectedDate.getDay())}:
                          </p>
                          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                            {mealOptionsByDay[selectedDate.getDay()]?.map(
                              (meal: any) => (
                                <Card
                                  key={meal.id}
                                  className={`cursor-pointer transition-all ${
                                    selectedMealsByDay[
                                      selectedDate.getDay()
                                    ] === meal.id
                                      ? "border-primary"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    updateMealSelection(
                                      selectedDate.getDay(),
                                      meal.id,
                                    )
                                  }
                                >
                                  <div className="flex items-center p-2">
                                    <div className="w-16 h-16 rounded-md overflow-hidden mr-3 flex-shrink-0">
                                      <img
                                        src={
                                          meal.image ||
                                          "https://via.placeholder.com/150?text=Millet+Meal"
                                        }
                                        alt={meal.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-medium text-sm">
                                        {meal.name}
                                      </h4>
                                      <p className="text-xs text-gray-500 line-clamp-2">
                                        {meal.description}
                                      </p>
                                      <div className="flex gap-1 mt-1">
                                        {meal.dietaryPreferences?.map(
                                          (pref: string) => (
                                            <Badge
                                              key={pref}
                                              variant="outline"
                                              className="text-xs px-1 py-0"
                                            >
                                              {pref}
                                            </Badge>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                    {selectedMealsByDay[
                                      selectedDate.getDay()
                                    ] === meal.id && (
                                      <Check className="h-5 w-5 text-primary ml-2" />
                                    )}
                                  </div>
                                </Card>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Your Selected Meals</h4>
                      {Object.keys(selectedMealsByDay).length > 0 ? (
                        <ul className="space-y-2">
                          {Object.entries(selectedMealsByDay).map(
                            ([day, mealId]) => {
                              const selectedMeal = meals?.find(
                                (m: any) => m.id === mealId,
                              );
                              return (
                                <li
                                  key={day}
                                  className="flex justify-between items-center p-2 bg-neutral-light rounded-lg"
                                >
                                  <div>
                                    <span className="font-medium">
                                      {getDayName(parseInt(day))}
                                    </span>
                                    <p className="text-sm">
                                      {selectedMeal?.name}
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedMealsByDay((prev) => {
                                        const newState = { ...prev };
                                        delete newState[parseInt(day)];
                                        return newState;
                                      });
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </li>
                              );
                            },
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No meals selected yet. Select a day and choose your
                          meal.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="border-t pt-6">
              <div className="flex justify-between mb-2">
                <span>Base Plan Price</span>
                <span>₹{(basePlan.price / 100).toFixed(2)}/month</span>
              </div>
              {priceAdjustment > 0 && (
                <div className="flex justify-between mb-2">
                  <span>
                    {dietaryPreference === "veg-with-egg"
                      ? "Egg Option"
                      : "Non-Veg Option"}
                  </span>
                  <span>+ ₹{(priceAdjustment / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between mb-2">
                <span>Tax</span>
                <span>₹{((currentPlan.price * 0.05) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span>Total</span>
                <span className="text-primary">
                  ₹
                  {(
                    (currentPlan.price + currentPlan.price * 0.05) /
                    100
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
            >
              Continue to Delivery Address
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case "address":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Delivery Address</h3>

              {/* Existing addresses */}
              {addresses.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-sm mb-3">
                    Select an existing address
                  </h4>
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          form.watch("selectedAddressId") === address.id
                            ? "border-primary ring-1 ring-primary"
                            : "hover:border-gray-400"
                        }`}
                        onClick={() => selectAddress(address.id)}
                      >
                        <div className="flex justify-between">
                          <div className="flex gap-2 items-center">
                            <h5 className="font-medium">{address.name}</h5>
                            {address.isDefault && (
                              <Badge variant="outline" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center">
                            {form.watch("selectedAddressId") === address.id && (
                              <Check className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {address.addressLine1}
                        </p>
                        {address.addressLine2 && (
                          <p className="text-sm text-gray-600">
                            {address.addressLine2}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Phone: {address.phone}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="add-new-address"
                  checked={form.watch("useNewAddress")}
                  onCheckedChange={() => toggleNewAddressForm()}
                />
                <label
                  htmlFor="add-new-address"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Add a new address
                </label>
              </div>

              {form.watch("useNewAddress") && (
                <div className="space-y-4 border p-4 rounded-lg">
                  <h4 className="font-medium">New Address Details</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="newAddress.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Home, Office, etc."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="newAddress.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="10-digit mobile number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="newAddress.addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="House/Flat No., Street, Locality"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="newAddress.addressLine2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 2 (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Landmark, Area, etc."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="newAddress.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="City"
                              defaultValue="Hyderabad"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="newAddress.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="State"
                              defaultValue="Telangana"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="newAddress.pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode</FormLabel>
                          <FormControl>
                            <Input placeholder="6-digit pincode" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="newAddress.isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Set as default address</FormLabel>
                          <FormDescription>
                            This address will be used for all future deliveries
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="border-t pt-4 mt-6">
                <div className="text-sm text-gray-500 mb-4">
                  <p>
                    Note: We currently deliver only in Hyderabad, within a 10km
                    radius of our service locations.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Plan
                  </Button>

                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90"
                  >
                    Continue to Payment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case "payment":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Delivery Address</h3>
                  <div className="bg-neutral-light p-4 rounded-lg">
                    {form.watch("useNewAddress") && form.watch("newAddress") ? (
                      <>
                        <p className="text-sm font-medium">{form.watch("newAddress.name")}</p>
                        <p className="text-sm mt-1">{form.watch("newAddress.addressLine1")}</p>
                        {form.watch("newAddress.addressLine2") && (
                          <p className="text-sm">{form.watch("newAddress.addressLine2")}</p>
                        )}
                        <p className="text-sm">
                          {form.watch("newAddress.city")}, {form.watch("newAddress.state")} - {form.watch("newAddress.pincode")}
                        </p>
                        <p className="text-sm mt-1">Phone: {form.watch("newAddress.phone")}</p>
                      </>
                    ) : (
                      <>
                        {form.watch("selectedAddressId") !== undefined && (
                          <>
                            {addresses.filter(a => a.id === form.watch("selectedAddressId")).map(address => (
                              <div key={address.id}>
                                <p className="text-sm font-medium">{address.name}</p>
                                <p className="text-sm mt-1">{address.addressLine1}</p>
                                {address.addressLine2 && (
                                  <p className="text-sm">{address.addressLine2}</p>
                                )}
                                <p className="text-sm">
                                  {address.city}, {address.state} - {address.pincode}
                                </p>
                                <p className="text-sm mt-1">Phone: {address.phone}</p>
                              </div>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
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
                          <SelectItem value="card">
                            Credit/Debit Card
                          </SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {paymentMethod === "card" && (
                  <div className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="cardNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="1234 5678 9012 3456"
                              {...field}
                            />
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
                      <FormItem className="mt-4">
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
                  <div className="bg-neutral-light p-4 rounded-lg mt-4">
                    <h3 className="font-medium mb-2">Bank Transfer Details</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      Account Name: Aayuv Services
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      Account Number: 1234567890
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      IFSC Code: MEAL0001234
                    </p>
                    <p className="text-sm text-gray-600">Bank: Millet Bank</p>
                  </div>
                )}
              </div>

              <div>
                <div className="bg-neutral-light p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Order Summary</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Plan:</span>{" "}
                    {currentPlan.name}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Type:</span>{" "}
                    {subscriptionType === "default" ? "Default" : "Customized"}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Start Date:</span>{" "}
                    {format(form.watch("startDate"), "PPP")}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Persons:</span>{" "}
                    {personCount}
                  </p>

                  <div className="border-t my-3"></div>

                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Base Plan Price</span>
                    <span className="text-sm">
                      ₹{(basePlan.price / 100).toFixed(2)}/month
                    </span>
                  </div>
                  {priceAdjustment > 0 && (
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">
                        {dietaryPreference === "veg-with-egg"
                          ? "Egg Option"
                          : "Non-Veg Option"}
                      </span>
                      <span className="text-sm">
                        + ₹{(priceAdjustment / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Price per person</span>
                    <span className="text-sm">
                      ₹{((basePrice + dietaryAddOn) / 100).toFixed(2)}/month
                    </span>
                  </div>
                  
                  {personCount > 1 && (
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Number of persons</span>
                      <span className="text-sm">× {personCount}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Subtotal</span>
                    <span className="text-sm">
                      ₹{(((basePrice + dietaryAddOn) * personCount) / 100).toFixed(2)}/month
                    </span>
                  </div>
                  
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Tax (5%)</span>
                    <span className="text-sm">
                      ₹{(((basePrice + dietaryAddOn) * personCount * 0.05) / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      ₹
                      {(
                        ((basePrice + dietaryAddOn) * personCount * 1.05) /
                        100
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Address
                </Button>

                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                  disabled={subscriptionMutation.isPending}
                >
                  {subscriptionMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {subscriptionMutation.isPending
                    ? "Processing..."
                    : "Subscribe"}
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  // Render a success page when subscription is successful
  if (isSuccess && subscribedDetails) {
    return (
      <div className="min-h-screen bg-neutral-light py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-green-500 border-2">
              <CardHeader className="bg-green-50">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-center text-2xl">Subscription Successful!</CardTitle>
                <CardDescription className="text-center">
                  Your subscription has been processed successfully. You'll start receiving your millet meals soon.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-neutral-light p-6 rounded-lg mb-6">
                  <h3 className="font-semibold text-lg mb-4">Subscription Summary</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium">{subscribedDetails.planName}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">{format(subscribedDetails.startDate, "PPP")}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dietary Preference:</span>
                      <span className="font-medium capitalize">
                        {subscribedDetails.dietaryPreference === "vegetarian" 
                          ? "Vegetarian" 
                          : subscribedDetails.dietaryPreference === "veg-with-egg" 
                            ? "Vegetarian with Egg" 
                            : "Non-Vegetarian"}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Number of Persons:</span>
                      <span className="font-medium">{subscribedDetails.personCount}</span>
                    </div>
                    
                    <div className="border-t my-2 pt-2">
                      <div className="flex justify-between font-semibold">
                        <span className="text-gray-600">Total:</span>
                        <span className="text-primary">₹{(subscribedDetails.totalPrice / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button 
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => {
                      setIsSuccess(false);
                      form.reset(defaultValues);
                      setFormStep("plan");
                    }}
                  >
                    Back to Subscription Plans
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between flex-wrap">
            <h1 className="text-3xl font-bold mr-4">Subscribe to Aayuv</h1>
          </div>

          <p className="text-gray-600 mb-4">
            {formStep === "plan" 
              ? "Select a plan and customize your subscription" 
              : "Your subscription details"}
          </p>
          
          <FormField
            control={form.control}
            name="dietaryPreference"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <div className="flex flex-wrap gap-2 mb-[20px]">
                  <Button
                    type="button"
                    variant={
                      field.value === "vegetarian" ? "default" : "outline"
                    }
                    className={`flex items-center gap-2 ${field.value === "vegetarian" ? "bg-green-600 hover:bg-green-700" : ""} 
                      ${formStep !== "plan" && field.value !== "vegetarian" ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => formStep === "plan" && field.onChange("vegetarian")}
                    size="sm"
                    disabled={formStep !== "plan" && field.value !== "vegetarian"}
                  >
                    <Check
                      className={`h-4 w-4 ${field.value === "vegetarian" ? "opacity-100" : "opacity-0"}`}
                    />
                    Vegetarian
                  </Button>
                  <Button
                    type="button"
                    variant={
                      field.value === "veg-with-egg" ? "default" : "outline"
                    }
                    className={`flex items-center gap-2 ${field.value === "veg-with-egg" ? "bg-amber-600 hover:bg-amber-700" : ""}
                      ${formStep !== "plan" && field.value !== "veg-with-egg" ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => formStep === "plan" && field.onChange("veg-with-egg")}
                    size="sm"
                    disabled={formStep !== "plan" && field.value !== "veg-with-egg"}
                  >
                    <Check
                      className={`h-4 w-4 ${field.value === "veg-with-egg" ? "opacity-100" : "opacity-0"}`}
                    />
                    Veg with Egg
                  </Button>
                  <Button
                    type="button"
                    variant={
                      field.value === "non-vegetarian" ? "default" : "outline"
                    }
                    className={`flex items-center gap-2 ${field.value === "non-vegetarian" ? "bg-red-600 hover:bg-red-700" : ""}
                      ${formStep !== "plan" && field.value !== "non-vegetarian" ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => formStep === "plan" && field.onChange("non-vegetarian")}
                    size="sm"
                    disabled={formStep !== "plan" && field.value !== "non-vegetarian"}
                  >
                    <Check
                      className={`h-4 w-4 ${field.value === "non-vegetarian" ? "opacity-100" : "opacity-0"}`}
                    />
                    Non-Veg
                  </Button>
                </div>
              </FormItem>
            )}
          />
          
          {formStep !== "plan" && (
            <div className="mt-2 mb-4">
              <span className="text-sm font-medium mr-2">Selected Diet:</span>
              <Badge
                variant="outline"
                className={
                  dietaryPreference === "vegetarian"
                    ? "bg-green-100 text-green-800"
                    : dietaryPreference === "veg-with-egg"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                }
              >
                {dietaryPreference === "vegetarian"
                  ? "Vegetarian"
                  : dietaryPreference === "veg-with-egg"
                    ? "Veg with Egg"
                    : "Non-Vegetarian"}
              </Badge>
              <span className="ml-4 text-sm font-medium mr-2">Persons:</span>
              <Badge variant="outline" className="bg-gray-100">
                {personCount}
              </Badge>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`transition duration-300 ${
                  selectedPlan === plan.id
                    ? "border-2 border-primary ring-2 ring-primary ring-opacity-50"
                    : ""
                } ${formStep !== "plan" && selectedPlan !== plan.id ? "opacity-50" : ""} 
                ${formStep === "plan" ? "cursor-pointer hover:shadow-md" : ""}`}
                onClick={() => formStep === "plan" && form.setValue("plan", plan.id as any)}
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
                  <div>
                    <div className="text-2xl font-semibold text-primary">
                      ₹
                      {(
                        ((plan.price + getPriceAdjustment(dietaryPreference)) * personCount) /
                        100
                      ).toFixed(0)}
                      <span className="text-sm text-gray-500">/month</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {personCount > 1 ? (
                        <>
                          ₹{((plan.price + getPriceAdjustment(dietaryPreference)) / 100).toFixed(0)} per person × {personCount} persons
                        </>
                      ) : (
                        <>
                          Base: ₹{(plan.price / 100).toFixed(0)}
                          {priceAdjustment > 0 && (
                            <> + {dietaryPreference === "veg-with-egg" ? "Egg" : "Non-veg"}: 
                            ₹{(getPriceAdjustment(dietaryPreference) / 100).toFixed(0)}</>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                        )}
                        <span
                          className={feature.included ? "" : "text-gray-400"}
                        >
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
              <CardTitle>
                {formStep === "plan" && "Choose Your Plan"}
                {formStep === "address" && "Delivery Address"}
                {formStep === "payment" && "Payment Information"}
              </CardTitle>
              <CardDescription>
                {formStep === "plan" &&
                  "Select a plan and customize your meals"}
                {formStep === "address" && "Choose delivery location"}
                {formStep === "payment" &&
                  "Complete your subscription purchase"}
              </CardDescription>

              <div className="mt-4">
                <div className="flex justify-between">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${formStep === "plan" ? "bg-primary text-white" : "bg-gray-200"}`}
                    >
                      1
                    </div>
                    <span className="text-xs mt-1">Plan</span>
                  </div>
                  <div className="flex-1 flex items-center mx-2 mb-[18px]">
                    <div
                      className={`h-1 w-full ${formStep !== "plan" ? "bg-primary" : "bg-gray-200"}`}
                    ></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${formStep === "address" ? "bg-primary text-white" : formStep === "payment" ? "bg-primary text-white" : "bg-gray-200"}`}
                    >
                      2
                    </div>
                    <span className="text-xs mt-1">Address</span>
                  </div>
                  <div className="flex-1 flex items-center mx-2 mb-[18px]">
                    <div
                      className={`h-1 w-full ${formStep === "payment" ? "bg-primary" : "bg-gray-200"}`}
                    ></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${formStep === "payment" ? "bg-primary text-white" : "bg-gray-200"}`}
                    >
                      3
                    </div>
                    <span className="text-xs mt-1">Payment</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {renderStepContent()}
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
