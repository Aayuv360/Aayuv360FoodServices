import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

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
  MapPin,
  Search,
  PlusCircle,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
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
  personCount: z
    .number()
    .min(1, "At least 1 person required")
    .max(10, "Maximum 10 persons allowed")
    .default(1),
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

// Location interface based on API
interface Location {
  id: number;
  name: string;
  pincode: string;
  lat: number;
  lng: number;
  available: boolean;
}

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
  
  // State for address modal
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");

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

  // Query meals
  const { data: meals, isLoading: mealsLoading } = useQuery({
    queryKey: ["/api/meals"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/meals");
      return res.json();
    },
  });
  
  // Query locations
  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/locations");
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
  
  // Handler for opening address modal
  const openAddressModal = () => {
    setAddressModalOpen(true);
  };
  
  // Handler for saving an address from the modal
  const saveAddressFromModal = (addressData: any) => {
    // Add address to the addresses list
    const newAddressId = addresses.length + 1;
    const newAddress = {
      id: newAddressId,
      ...addressData,
    };
    
    setAddresses([...addresses, newAddress]);
    
    // Auto-select the new address
    form.setValue("selectedAddressId", newAddressId);
    form.setValue("useNewAddress", false);
    
    // Close the modal
    setAddressModalOpen(false);
    
    toast({
      title: "Address Added",
      description: "Your new delivery address has been added successfully.",
    });
  };
  
  // Filter locations based on search
  const filteredLocations = locations?.filter((location: Location) => 
    location.name.toLowerCase().includes(locationSearch.toLowerCase())
  ) || [];

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
    basePriceText: `₹${(basePrice / 100).toFixed(0)}${dietaryAddOn > 0 ? ` + ₹${(dietaryAddOn / 100).toFixed(0)}` : ""}${personCount > 1 ? ` × ${personCount} persons` : ""}`,
  };
  
  // Handle form submission for new address from modal
  const handleAddressFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const addressData = {
      name: formData.get('addressName') as string,
      phone: formData.get('phone') as string,
      addressLine1: formData.get('addressLine1') as string,
      addressLine2: formData.get('addressLine2') as string || undefined,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      pincode: formData.get('pincode') as string,
      isDefault: Boolean(formData.get('isDefault')),
    };
    
    saveAddressFromModal(addressData);
  };
  
  // Select a location from search results
  const selectLocation = (location: Location) => {
    // Auto-fill the form fields with the location info
    const pincodeInput = document.getElementById('address-pincode') as HTMLInputElement;
    if (pincodeInput) pincodeInput.value = location.pincode;
    
    const cityInput = document.getElementById('address-city') as HTMLInputElement;
    if (cityInput) cityInput.value = 'Hyderabad';
    
    const stateInput = document.getElementById('address-state') as HTMLInputElement;
    if (stateInput) stateInput.value = 'Telangana';
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
                        <span className="text-sm font-medium">
                          Price per person:
                        </span>
                        <span className="text-sm">
                          ₹{((basePrice + dietaryAddOn) / 100).toFixed(0)}
                        </span>
                      </div>
                      {personCount > 1 && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm font-medium">
                            Number of persons:
                          </span>
                          <span className="text-sm">{personCount}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-1 border-t pt-2">
                        <span className="text-sm font-medium">
                          Total monthly price:
                        </span>
                        <span className="text-sm font-semibold">
                          ₹{(totalPrice / 100).toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {currentPlan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start text-sm">
                          {feature.included ? (
                            <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mr-2 shrink-0" />
                          )}
                          <span
                            className={
                              feature.included ? "" : "text-gray-400"
                            }
                          >
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium mb-2">Dietary Preference</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className={`flex-1 ${
                        form.watch("dietaryPreference") === "vegetarian"
                          ? "bg-green-100 text-green-800 border-green-300"
                          : ""
                      }`}
                      onClick={() =>
                        form.setValue("dietaryPreference", "vegetarian")
                      }
                    >
                      Vegetarian
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={`flex-1 ${
                        form.watch("dietaryPreference") === "veg-with-egg"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : ""
                      }`}
                      onClick={() =>
                        form.setValue("dietaryPreference", "veg-with-egg")
                      }
                    >
                      Veg with Egg
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={`flex-1 ${
                        form.watch("dietaryPreference") === "non-vegetarian"
                          ? "bg-red-100 text-red-800 border-red-300"
                          : ""
                      }`}
                      onClick={() =>
                        form.setValue("dietaryPreference", "non-vegetarian")
                      }
                    >
                      Non-Vegetarian
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {form.watch("dietaryPreference") === "vegetarian"
                      ? "Pure vegetarian meals with no eggs or meat."
                      : form.watch("dietaryPreference") === "veg-with-egg"
                      ? "Vegetarian meals that may include eggs. +₹200/month"
                      : "Meals that include meat options. +₹500/month"}
                  </p>
                </div>
              </div>
            </div>

            {subscriptionType === "customized" && (
              <div className="mt-6">
                <h3 className="font-medium mb-4">
                  Customize Your Weekly Meal Plan
                </h3>
                <div className="space-y-6">
                  {mealsLoading ? (
                    <div className="flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div>
                      <Tabs defaultValue="0">
                        <TabsList className="mb-4 flex w-full justify-around overflow-x-auto">
                          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                            <TabsTrigger
                              key={day}
                              value={day.toString()}
                              className="flex-1"
                            >
                              {getDayName(day)}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                          <TabsContent
                            key={day}
                            value={day.toString()}
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {mealOptionsByDay[day]?.map((meal) => (
                                <div
                                  key={meal.id}
                                  className={`border rounded-lg overflow-hidden cursor-pointer transition-colors ${
                                    selectedMealsByDay[day] === meal.id
                                      ? "border-primary bg-primary/5"
                                      : "hover:border-gray-300"
                                  }`}
                                  onClick={() =>
                                    updateMealSelection(day, meal.id)
                                  }
                                >
                                  <div className="aspect-video bg-gray-100 relative">
                                    {meal.imageUrl ? (
                                      <img
                                        src={meal.imageUrl}
                                        alt={meal.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        No Image
                                      </div>
                                    )}
                                    {selectedMealsByDay[day] === meal.id && (
                                      <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                                        <Check className="h-4 w-4" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="p-3">
                                    <div className="flex justify-between">
                                      <h4 className="font-medium">
                                        {meal.name}
                                      </h4>
                                      <Badge variant="outline" className="text-xs">
                                        {meal.type}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                      {meal.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button type="submit" className="w-full md:w-auto">
                Continue to Delivery
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      case "address":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-4">Delivery Addresses</h3>
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    onClick={() => selectAddress(address.id)}
                    className={`border rounded-lg p-4 cursor-pointer ${
                      form.watch("selectedAddressId") === address.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start">
                      <div
                        className={`rounded-full w-5 h-5 border flex-shrink-0 mr-3 mt-1 ${
                          form.watch("selectedAddressId") === address.id
                            ? "border-primary bg-primary"
                            : "border-gray-300"
                        }`}
                      >
                        {form.watch("selectedAddressId") === address.id && (
                          <Check className="h-3 w-3 text-white m-auto" />
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{address.name}</h4>
                          {address.isDefault && (
                            <Badge variant="outline" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                          {address.addressLine1}
                          {address.addressLine2 && `, ${address.addressLine2}`}
                        </p>
                        <p className="text-sm text-gray-700">
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          Phone: {address.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center"
                  onClick={openAddressModal}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add New Address
                </Button>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Plan
              </Button>
              <Button type="submit">
                Continue to Payment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      case "payment":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4">Payment Method</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-3"
                            >
                              <div className="border rounded-lg p-3 cursor-pointer hover:border-gray-300">
                                <div className="flex items-center">
                                  <RadioGroupItem
                                    value="card"
                                    id="card"
                                    className="mr-3"
                                  />
                                  <Label
                                    htmlFor="card"
                                    className="flex items-center font-medium cursor-pointer"
                                  >
                                    Credit / Debit Card
                                  </Label>
                                </div>
                                {paymentMethod === "card" && (
                                  <div className="mt-4 space-y-4 pl-6">
                                    <div>
                                      <Label htmlFor="cardNumber">
                                        Card Number
                                      </Label>
                                      <Input
                                        id="cardNumber"
                                        placeholder="1234 5678 9012 3456"
                                        {...form.register("cardNumber")}
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor="expiry">
                                          Expiry Date
                                        </Label>
                                        <Input
                                          id="expiry"
                                          placeholder="MM/YY"
                                          {...form.register("cardExpiry")}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="cvv">CVV</Label>
                                        <Input
                                          id="cvv"
                                          placeholder="123"
                                          {...form.register("cardCvv")}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="border rounded-lg p-3 cursor-pointer hover:border-gray-300">
                                <div className="flex items-center">
                                  <RadioGroupItem
                                    value="upi"
                                    id="upi"
                                    className="mr-3"
                                  />
                                  <Label
                                    htmlFor="upi"
                                    className="flex items-center font-medium cursor-pointer"
                                  >
                                    UPI Payment
                                  </Label>
                                </div>
                                {paymentMethod === "upi" && (
                                  <div className="mt-4 pl-6">
                                    <Label htmlFor="upiId">UPI ID</Label>
                                    <Input
                                      id="upiId"
                                      placeholder="name@upi"
                                      {...form.register("upiId")}
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="border rounded-lg p-3 cursor-pointer hover:border-gray-300">
                                <div className="flex items-center">
                                  <RadioGroupItem
                                    value="bank"
                                    id="bank"
                                    className="mr-3"
                                  />
                                  <Label
                                    htmlFor="bank"
                                    className="flex items-center font-medium cursor-pointer"
                                  >
                                    Net Banking
                                  </Label>
                                </div>
                                {paymentMethod === "bank" && (
                                  <div className="mt-4 pl-6">
                                    <p className="text-sm text-gray-600">
                                      You will be redirected to your bank's website
                                      to complete the payment.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-neutral-light p-4 rounded-lg">
                  <h3 className="font-medium">Order Summary</h3>
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium">{currentPlan.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dietary Preference:</span>
                      <span className="font-medium">
                        {dietaryPreference === "vegetarian"
                          ? "Vegetarian"
                          : dietaryPreference === "veg-with-egg"
                          ? "Veg with Egg"
                          : "Non-Vegetarian"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">
                        {format(form.watch("startDate"), "PPP")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Number of Persons:</span>
                      <span className="font-medium">{personCount}</span>
                    </div>
                    {form.watch("subscriptionType") === "customized" && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Customized Selections:
                        </span>
                        <span className="font-medium">
                          {Object.keys(selectedMealsByDay).length} days
                        </span>
                      </div>
                    )}
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Base price:</span>
                        <span>₹{(basePrice / 100).toFixed(0)}</span>
                      </div>
                      {dietaryAddOn > 0 && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-gray-600">
                            Dietary preference addon:
                          </span>
                          <span>₹{(dietaryAddOn / 100).toFixed(0)}</span>
                        </div>
                      )}
                      {personCount > 1 && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-gray-600">
                            Multiple persons (×{personCount}):
                          </span>
                          <span>
                            ₹
                            {(
                              (totalPricePerPerson * personCount -
                                totalPricePerPerson) /
                              100
                            ).toFixed(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="pt-3 border-t flex justify-between items-center">
                      <span className="font-medium">Total (monthly):</span>
                      <span className="text-xl font-semibold text-primary">
                        ₹{(totalPrice / 100).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-800 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Important Note
                  </h4>
                  <p className="text-sm text-amber-700 mt-2">
                    Your subscription will begin on{" "}
                    {format(form.watch("startDate"), "MMMM d, yyyy")}. The amount
                    shown will be billed on a monthly basis. You can cancel or
                    modify your subscription at any time from your profile.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Delivery
              </Button>
              <Button
                type="submit"
                disabled={subscriptionMutation.isPending}
                className="min-w-[150px]"
              >
                {subscriptionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Subscribe Now</>
                )}
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div>
        <h1 className="text-3xl font-bold text-center mb-2">
          Subscribe to MealMillet
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Enjoy authentic millet meals delivered to your doorstep
        </p>

        <div className="max-w-4xl mx-auto">
          {isSuccess && subscribedDetails ? (
            <div className="space-y-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-700 mb-2">
                  Subscription Successful!
                </h2>
                <p className="text-green-700 mb-6">
                  Thank you for subscribing to our millet meal service.
                </p>

                <div className="bg-white rounded-md p-6 max-w-md mx-auto text-left">
                  <h3 className="font-medium text-lg mb-4">
                    Subscription Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium">
                        {subscribedDetails.planName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">
                        {format(subscribedDetails.startDate, "PPP")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dietary Preference:</span>
                      <span className="font-medium">
                        {subscribedDetails.dietaryPreference === "vegetarian"
                          ? "Vegetarian"
                          : subscribedDetails.dietaryPreference === "veg-with-egg"
                          ? "Veg with Egg"
                          : "Non-Vegetarian"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Number of Persons:</span>
                      <span className="font-medium">
                        {subscribedDetails.personCount}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-bold">
                        ₹{(subscribedDetails.totalPrice / 100).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-sm text-gray-600 mb-4">
                    Your first millet meal will be delivered on{" "}
                    <span className="font-semibold">
                      {format(subscribedDetails.startDate, "PPP")}
                    </span>
                    . You can track and customize your upcoming meals in your
                    profile.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      className="font-medium"
                      onClick={() => navigate("/menu")}
                    >
                      Explore Menu
                    </Button>
                    <Button
                      variant="default"
                      className="font-medium"
                      onClick={() => navigate("/profile")}
                    >
                      View Your Subscriptions
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
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
                        className={`w-8 h-8 rounded-full flex items-center justify-center bg-primary text-white`}
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
          )}
        </div>
      </div>
      
      {/* Address Modal with Map */}
      <Dialog open={addressModalOpen} onOpenChange={setAddressModalOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Add New Delivery Address</DialogTitle>
            <DialogDescription>
              Search for your location on the map or enter address details manually.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Left side - Map and Location Search */}
            <div className="space-y-4">
              <div className="relative">
                <Input 
                  placeholder="Search for location in Hyderabad" 
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              
              {locationSearch && filteredLocations.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <div className="max-h-[200px] overflow-y-auto">
                    {filteredLocations.map((location: Location) => (
                      <div 
                        key={location.id}
                        className={`p-2 cursor-pointer hover:bg-gray-100 ${!location.available ? 'opacity-50' : ''}`}
                        onClick={() => location.available && selectLocation(location)}
                      >
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 text-primary mt-0.5 mr-2 shrink-0" />
                          <div>
                            <p className="font-medium">{location.name}</p>
                            <p className="text-sm text-gray-600">Pincode: {location.pincode}</p>
                            {!location.available && (
                              <p className="text-xs text-red-600 mt-1">Currently not serviceable</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Map placeholder - in a real app, this would be integrated with Google Maps or similar */}
              <div className="h-[300px] bg-gray-100 rounded-md border flex items-center justify-center">
                <div className="text-center p-4">
                  <MapPin className="h-10 w-10 text-primary/50 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Map view would appear here</p>
                  <p className="text-xs text-gray-400 mt-1">We deliver in select areas of Hyderabad</p>
                </div>
              </div>
            </div>
            
            {/* Right side - Address Form */}
            <div className="space-y-4">
              <form id="address-form" onSubmit={handleAddressFormSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="address-name">Address Name</Label>
                      <Input 
                        id="address-name" 
                        name="addressName" 
                        placeholder="Home, Office, etc." 
                        required 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="address-phone">Phone Number</Label>
                      <Input 
                        id="address-phone" 
                        name="phone" 
                        placeholder="10-digit mobile number" 
                        required 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="address-line1">Address Line 1</Label>
                    <Input 
                      id="address-line1" 
                      name="addressLine1" 
                      placeholder="House/Flat No., Street, Locality" 
                      required 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address-line2">Address Line 2 (Optional)</Label>
                    <Input 
                      id="address-line2" 
                      name="addressLine2" 
                      placeholder="Landmark, Area, etc." 
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="address-city">City</Label>
                      <Input 
                        id="address-city" 
                        name="city" 
                        placeholder="City" 
                        defaultValue="Hyderabad" 
                        required 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="address-state">State</Label>
                      <Input 
                        id="address-state" 
                        name="state" 
                        placeholder="State" 
                        defaultValue="Telangana" 
                        required 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="address-pincode">Pincode</Label>
                      <Input 
                        id="address-pincode" 
                        name="pincode" 
                        placeholder="6-digit pincode" 
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="address-default" name="isDefault" />
                    <Label htmlFor="address-default" className="font-normal">
                      Set as default address
                    </Label>
                  </div>
                </div>
                
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setAddressModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Save Address
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Subscription;