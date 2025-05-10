import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRazorpay } from "@/hooks/use-razorpay";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { CustomMealSheduleModal } from "@/components/Modals/CustomMealSheduleModal";
import { DefaulMealSheduleModal } from "@/components/Modals/DefaulMealSheduleModal";
import { NewAddressModal } from "@/components/Modals/NewAddressModal";
import { AuthModal } from "@/components/auth/AuthModal";

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

const Subscription = () => {
  const [location, navigate] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const selectedPlanFromParams = searchParams.get("plan");
  const { toast } = useToast();
  const { user } = useAuth();
  const [formStep, setFormStep] = useState<FormStep>("plan");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedMealsByDay, setSelectedMealsByDay] = useState<{
    [key: number]: number;
  }>({});
  const [mealOptionsByDay, setMealOptionsByDay] = useState<{
    [key: number]: any[];
  }>({});
  const [defaulMealModalOpen, setDefaulMealModalOpen] =
    useState<boolean>(false);
  const [customMealModalOpen, setCustomMealModalOpen] =
    useState<boolean>(false);
  const [addressModalOpen, setAddressModalOpen] = useState<boolean>(false);
  const [locationSearch, setLocationSearch] = useState<string>("");
  const [filteredLocations, setFilteredLocations] = useState<any[]>([]);
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

  const openNewAddressModal = () => {
    setAddressModalOpen(true);
  };

  const selectLocation = (location: any) => {
    // Pre-fill the pincode field based on selected location
    const addressForm = document.getElementById(
      "address-form",
    ) as HTMLFormElement;
    if (addressForm) {
      const pincodeInput = addressForm.querySelector(
        "#address-pincode",
      ) as HTMLInputElement;
      if (pincodeInput) {
        pincodeInput.value = location.pincode;
      }
    }
    setLocationSearch("");
  };

  const handleAddressFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newAddress = {
      id: addresses.length + 1,
      name: formData.get("addressName") as string,
      phone: formData.get("phone") as string,
      addressLine1: formData.get("addressLine1") as string,
      addressLine2: (formData.get("addressLine2") as string) || "",
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      pincode: formData.get("pincode") as string,
      isDefault: Boolean(formData.get("isDefault")),
    };

    setAddresses([...addresses, newAddress]);
    selectAddress(newAddress.id);
    setAddressModalOpen(false);
    toast({
      title: "Address added",
      description: "Your new delivery address has been added successfully.",
      variant: "default",
    });
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
    basePriceText: `₹${(basePrice / 100).toFixed(0)}${
      dietaryAddOn > 0 ? ` + ₹${(dietaryAddOn / 100).toFixed(0)}` : ""
    }${personCount > 1 ? ` × ${personCount} persons` : ""}`,
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

  const { data: locations } = useQuery({
    queryKey: ["/api/locations", locationSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (locationSearch) {
        params.append("query", locationSearch);
      }
      const response = await fetch(`/api/locations?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch locations");
      }
      return response.json();
    },
    enabled: locationSearch.length > 1, // Only fetch when search query is more than 1 character
  });

  useEffect(() => {
    if (locations) {
      setFilteredLocations(locations);
    }
  }, [locations]);

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
                      className={`flex-1 ${
                        form.watch("plan") === plan.id ? "bg-primary" : ""
                      }`}
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

                <div className="mt-4">
                  <FormLabel className="text-base font-medium">
                    Subscription Type
                  </FormLabel>
                  <div className="mt-3">
                    <div className="flex items-center bg-neutral-50 border rounded-lg overflow-hidden">
                      <div
                        className={`flex-1 p-4 cursor-pointer transition-all ${
                          form.watch("subscriptionType") === "default"
                            ? "bg-primary text-white"
                            : "hover:bg-neutral-100"
                        }`}
                        onClick={() => {
                          form.setValue("subscriptionType", "default");
                        }}
                      >
                        <div className="flex items-center mb-1">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                              form.watch("subscriptionType") === "default"
                                ? "bg-white"
                                : "border border-primary"
                            }`}
                          >
                            {form.watch("subscriptionType") === "default" && (
                              <Check className="h-3 w-3 text-primary" />
                            )}
                          </div>
                          <h3 className="font-medium">Default Plan</h3>
                        </div>
                        <p
                          className={`text-sm ${form.watch("subscriptionType") === "default" ? "text-white/80" : "text-gray-600"}`}
                        >
                          Pre-selected meals based on your preferences
                        </p>

                        {form.watch("subscriptionType") === "default" && (
                          <Button
                            type="button"
                            size="sm"
                            className="mt-2 bg-white text-primary hover:bg-white/90"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDefaulMealModalOpen(true);
                            }}
                          >
                            View Meal Schedule
                          </Button>
                        )}
                      </div>

                      <div
                        className={`flex-1 p-4 cursor-pointer transition-all ${
                          form.watch("subscriptionType") === "customized"
                            ? "bg-primary text-white"
                            : "hover:bg-neutral-100"
                        }`}
                        onClick={() => {
                          form.setValue("subscriptionType", "customized");
                          setCustomMealModalOpen(true);
                        }}
                      >
                        <div className="flex items-center mb-1">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                              form.watch("subscriptionType") === "customized"
                                ? "bg-white"
                                : "border border-primary"
                            }`}
                          >
                            {form.watch("subscriptionType") ===
                              "customized" && (
                              <Check className="h-3 w-3 text-primary" />
                            )}
                          </div>
                          <h3 className="font-medium">Customized Plan</h3>
                        </div>
                        <p
                          className={`text-sm ${form.watch("subscriptionType") === "customized" ? "text-white/80" : "text-gray-600"}`}
                        >
                          Select your own meals for each day
                        </p>

                        {form.watch("subscriptionType") === "customized" &&
                          Object.keys(selectedMealsByDay).length === 0 && (
                            <Button
                              type="button"
                              size="sm"
                              className="mt-2 bg-white text-primary hover:bg-white/90"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCustomMealModalOpen(true);
                              }}
                            >
                              Select Meals
                            </Button>
                          )}
                      </div>
                    </div>
                  </div>
                </div>

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
                      <FormLabel className="text-base font-medium">
                        Number of Persons
                      </FormLabel>
                      <div className="mt-2">
                        <div className="bg-neutral-50 rounded-lg border">
                          <div className="flex items-center justify-between p-3">
                            <div>
                              <span className="text-sm text-gray-600">
                                Select how many people will be eating
                              </span>
                              <div className="mt-1 text-primary font-semibold">
                                {field.value}{" "}
                                {field.value === 1 ? "person" : "people"}
                              </div>
                            </div>

                            <div className="flex items-center bg-white rounded-md border shadow-sm">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-r-none border-r"
                                onClick={() => {
                                  const newValue = Math.max(1, field.value - 1);
                                  form.setValue("personCount", newValue);
                                }}
                                disabled={field.value <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>

                              <FormControl>
                                <Input
                                  type="number"
                                  className="h-9 w-12 text-center border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                  {...field}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (
                                      !isNaN(value) &&
                                      value >= 1 &&
                                      value <= 10
                                    ) {
                                      field.onChange(value);
                                    }
                                  }}
                                  min={1}
                                  max={10}
                                />
                              </FormControl>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-l-none border-l"
                                onClick={() => {
                                  const newValue = Math.min(
                                    10,
                                    field.value + 1,
                                  );
                                  form.setValue("personCount", newValue);
                                }}
                                disabled={field.value >= 10}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center p-3 bg-neutral-100 rounded-b-lg border-t">
                            <div className="flex-1">
                              <div className="text-xs text-gray-500">
                                Price multiplier
                              </div>
                              <div className="text-sm font-medium">
                                {field.value}x base price
                              </div>
                            </div>
                            <div className="w-28">
                              <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="absolute top-0 left-0 h-full bg-primary"
                                  style={{
                                    width: `${(field.value / 10) * 100}%`,
                                  }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>1</span>
                                <span>10</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <div className="bg-neutral-light rounded-lg">
                  {/* <h3 className="font-medium">Selected Plan Details</h3> */}
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
              <DefaulMealSheduleModal
                currentPlan={currentPlan}
                form={form}
                defaulMealModalOpen={defaulMealModalOpen}
                setDefaulMealModalOpen={setDefaulMealModalOpen}
              />
            )}

            {subscriptionType === "customized" && (
              <CustomMealSheduleModal
                mealsLoading={mealsLoading}
                currentPlan={currentPlan}
                form={form}
                getDayName={getDayName}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                mealOptionsByDay={mealOptionsByDay}
                selectedMealsByDay={selectedMealsByDay}
                setSelectedMealsByDay={setSelectedMealsByDay}
                updateMealSelection={updateMealSelection}
                meals={meals}
                customMealModalOpen={customMealModalOpen}
                setCustomMealModalOpen={setCustomMealModalOpen}
              />
            )}

            {/* Summary of custom meal selections if any */}
            {subscriptionType === "customized" &&
              Object.keys(selectedMealsByDay).length > 0 && (
                <div className="mt-4 bg-neutral-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">
                      Your Customized Meal Selections
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCustomMealModalOpen(true)}
                      className="text-xs h-8"
                    >
                      Edit Selections
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    You've selected {Object.keys(selectedMealsByDay).length}{" "}
                    meals for your custom plan.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(selectedMealsByDay)
                      .slice(0, 5)
                      .map(([day, mealId]) => {
                        const dayName = getDayName(parseInt(day));
                        const selectedMeal = meals?.find(
                          (m: any) => m.id === mealId,
                        );
                        return (
                          <Badge
                            key={day}
                            variant="secondary"
                            className="text-xs"
                          >
                            {dayName.substring(0, 3)}:{" "}
                            {selectedMeal?.name.substring(0, 15)}
                            {selectedMeal?.name.length > 15 ? "..." : ""}
                          </Badge>
                        );
                      })}
                    {Object.keys(selectedMealsByDay).length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{Object.keys(selectedMealsByDay).length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

            <div className="mt-6 ml-[450px]">
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
        );

      case "address":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Delivery Address</h3>
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

              <div className="mt-4 mb-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center"
                  onClick={() => setAddressModalOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Address
                </Button>
              </div>

              <NewAddressModal
                addressModalOpen={addressModalOpen}
                setAddressModalOpen={setAddressModalOpen}
                locationSearch={locationSearch}
                filteredLocations={filteredLocations}
                handleAddressFormSubmit={handleAddressFormSubmit}
                setLocationSearch={setLocationSearch}
                selectLocation={selectLocation}
              />

              <div className="border-t pt-4 mt-6">
                <div className="text-sm text-gray-500 mb-4">
                  <p>
                    Note: We currently deliver only in Hyderabad, within a 10km
                    radius of our service locations.
                  </p>
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
                  <div className="bg-neutral-light rounded-lg">
                    {form.watch("useNewAddress") && form.watch("newAddress") ? (
                      <>
                        <p className="text-sm font-medium">
                          {form.watch("newAddress.name")}
                        </p>
                        <p className="text-sm mt-1">
                          {form.watch("newAddress.addressLine1")}
                        </p>
                        {form.watch("newAddress.addressLine2") && (
                          <p className="text-sm">
                            {form.watch("newAddress.addressLine2")}
                          </p>
                        )}
                        <p className="text-sm">
                          {form.watch("newAddress.city")},{" "}
                          {form.watch("newAddress.state")} -{" "}
                          {form.watch("newAddress.pincode")}
                        </p>
                        <p className="text-sm mt-1">
                          Phone: {form.watch("newAddress.phone")}
                        </p>
                      </>
                    ) : (
                      <>
                        {form.watch("selectedAddressId") !== undefined && (
                          <>
                            {addresses
                              .filter(
                                (a) => a.id === form.watch("selectedAddressId"),
                              )
                              .map((address) => (
                                <div key={address.id}>
                                  <p className="text-sm font-medium">
                                    {address.name}
                                  </p>
                                  <p className="text-sm mt-1">
                                    {address.addressLine1}
                                  </p>
                                  {address.addressLine2 && (
                                    <p className="text-sm">
                                      {address.addressLine2}
                                    </p>
                                  )}
                                  <p className="text-sm">
                                    {address.city}, {address.state} -{" "}
                                    {address.pincode}
                                  </p>
                                  <p className="text-sm mt-1">
                                    Phone: {address.phone}
                                  </p>
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
                <div className="bg-neutral-light rounded-lg">
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
                    <span className="font-medium">Persons:</span> {personCount}
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
                      ₹
                      {(
                        ((basePrice + dietaryAddOn) * personCount) /
                        100
                      ).toFixed(2)}
                      /month
                    </span>
                  </div>

                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Tax (5%)</span>
                    <span className="text-sm">
                      ₹
                      {(
                        ((basePrice + dietaryAddOn) * personCount * 0.05) /
                        100
                      ).toFixed(2)}
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
              <p className="text-sm text-gray-500 mb-4">
                Please verify all details before completing your subscription.
              </p>
            </div>
          </div>
        );
    }
  };

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
                <CardTitle className="text-center text-2xl">
                  Subscription Successful!
                </CardTitle>
                <CardDescription className="text-center">
                  Your subscription has been processed successfully. You'll
                  start receiving your millet meals soon.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-neutral-light p-6 rounded-lg mb-6">
                  <h3 className="font-semibold text-lg mb-4">
                    Subscription Summary
                  </h3>

                  <div className="space-y-2">
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
                      <span className="font-medium capitalize">
                        {subscribedDetails.dietaryPreference === "vegetarian"
                          ? "Vegetarian"
                          : subscribedDetails.dietaryPreference ===
                              "veg-with-egg"
                            ? "Vegetarian with Egg"
                            : "Non-Vegetarian"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Number of Persons:</span>
                      <span className="font-medium">
                        {subscribedDetails.personCount}
                      </span>
                    </div>

                    <div className="border-t my-2 pt-2">
                      <div className="flex justify-between font-semibold">
                        <span className="text-gray-600">Total:</span>
                        <span className="text-primary">
                          ₹{(subscribedDetails.totalPrice / 100).toFixed(2)}
                        </span>
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

          {formStep === "plan" ? (
            <></>
          ) : (
            <div className="mb-8">
              <Card className="border-2 border-primary mb-4">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">
                      {currentPlan.name}
                    </CardTitle>
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <CardDescription>{currentPlan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="text-xl font-semibold text-primary">
                      ₹{(totalPrice / 100).toFixed(0)}
                      <span className="text-sm text-gray-500">/month</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {personCount > 1 ? (
                        <>
                          ₹{((basePrice + dietaryAddOn) / 100).toFixed(0)} per
                          person × {personCount} persons
                        </>
                      ) : (
                        <>
                          Base: ₹{(basePrice / 100).toFixed(0)}
                          {dietaryAddOn > 0 && (
                            <>
                              {" "}
                              +{" "}
                              {dietaryPreference === "veg-with-egg"
                                ? "Egg"
                                : "Non-veg"}
                              : ₹{(dietaryAddOn / 100).toFixed(0)}
                            </>
                          )}
                        </>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Start Date:</span>{" "}
                      {format(form.watch("startDate"), "PPP")}
                    </div>
                    {/* <div className="text-sm text-gray-600">
                      <span className="font-medium">Persons:</span>{" "}
                      {personCount}
                    </div> */}
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="text-sm font-medium mr-2">
                        Selected Diet:
                      </span>
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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
                      className={`h-1 w-full ${
                        formStep !== "plan" ? "bg-primary" : "bg-gray-200"
                      }`}
                    ></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        formStep === "address"
                          ? "bg-primary text-white"
                          : formStep === "payment"
                            ? "bg-primary text-white"
                            : "bg-gray-200"
                      }`}
                    >
                      2
                    </div>
                    <span className="text-xs mt-1">Address</span>
                  </div>
                  <div className="flex-1 flex items-center mx-2 mb-[18px]">
                    <div
                      className={`h-1 w-full ${
                        formStep === "payment" ? "bg-primary" : "bg-gray-200"
                      }`}
                    ></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        formStep === "payment"
                          ? "bg-primary text-white"
                          : "bg-gray-200"
                      }`}
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
                <div className="space-y-6">
                  {renderStepContent()}

                  {/* Navigation buttons outside the step content */}
                  <div className="flex justify-between items-center mt-6">
                    {formStep !== "plan" && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goToPreviousStep}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {formStep === "address"
                          ? "Back to Plan"
                          : "Back to Address"}
                      </Button>
                    )}

                    {formStep === "plan" && (
                      <Button
                        type="button"
                        className="ml-auto bg-primary hover:bg-primary/90"
                        onClick={() => {
                          if (!user) {
                            setAuthModalOpen(true);
                          } else {
                            if (
                              form.watch("subscriptionType") === "customized" &&
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
                          }
                        }}
                      >
                        {!user ? "Login and continue" : "Continue"}

                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}

                    {formStep === "address" && (
                      <Button
                        type="button"
                        className="ml-auto bg-primary hover:bg-primary/90"
                        onClick={() => {
                          if (!form.watch("selectedAddressId")) {
                            toast({
                              title: "Address required",
                              description:
                                "Please select an existing address or add a new one",
                              variant: "destructive",
                            });
                            return;
                          }
                          goToNextStep();
                        }}
                      >
                        Continue to Payment
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}

                    {formStep === "payment" && (
                      <Button
                        type="button"
                        className="ml-auto bg-primary hover:bg-primary/90"
                        onClick={form.handleSubmit(onSubmit)}
                      >
                        {subscriptionMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>Complete Subscription</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onOpenChange={setAuthModalOpen}
        redirectUrl={`/subscription?plan=${form.watch("plan")}`}
      />
    </div>
  );
};

export default Subscription;
