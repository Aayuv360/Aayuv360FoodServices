import { useEffect, useState } from "react";
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
  Edit,
  Trash2,
  Sparkles,
  ClipboardList,
  CheckCircle,
  Home,
  CalendarDays,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

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
import { DefaulMealSheduleModal } from "@/components/Modals/DefaulMealSheduleModal";
import { NewAddressModal } from "@/components/Modals/NewAddressModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { Address } from "@shared/schema";
import DeleteAddressDialog from "@/components/Modals/DeleteAddressDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SuccessPage from "./SuccessPage";

const plansEmoji = [
  {
    id: "basic",
    name: "Basic",
    emoji: "🌱",
  },
  {
    id: "premium",
    name: "Premium",
    emoji: "🌾",
  },
  {
    id: "family",
    name: "Family",
    emoji: "👑",
  },
];
const deliveryTime = [
  { id: 1, time: "7:00 PM - 8:00 PM" },
  { id: 2, time: "8:00 PM - 9:00 PM" },
];
const modifyDelivaryAddress = [
  { id: 1, name: "Yes" },
  { id: 2, name: "No" },
];
const addressSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  addressLine1: z.string().min(5, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  isDefault: z.boolean().default(false),
});

const menuItemSchema = z.object({
  day: z.number(),
  main: z.string(),
  sides: z.array(z.string()),
});

const planSchema = z.object({
  _id: z.string(),
  id: z.string(),
  name: z.string(),
  price: z.number(),
  duration: z.number(),
  description: z.string(),
  features: z.array(z.string()),
  dietaryPreference: z.enum(["veg", "veg_with_egg", "nonveg"]),
  planType: z.string(),
  menuItems: z.array(menuItemSchema).optional(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  __v: z.number(),
});
const subscriptionSchema = z.object({
  plan: planSchema,
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
  timeSlot: z.string().optional(),
  modifydelivaryAdrs: z.string().optional(),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

type FormStep = "plan" | "payment" | "success";

interface RazorpayPaymentData {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

const SubscriptionCRUD = ({ previousPlansData }: any) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { initiatePayment } = useRazorpay();
  const [formStep, setFormStep] = useState<FormStep>("plan");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [defaulMealModalOpen, setDefaulMealModalOpen] =
    useState<boolean>(false);
  const [addressModalOpen, setAddressModalOpen] = useState<boolean>(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<any>(null);
  const [addressModalAction, setAddressModalAction] = useState<string>("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<any>([]);
  const [determinedAction, setDeterminedAction] =
    useState<string>("NONE / DEFAULT");
  const { data: subscriptionPlans, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/subscription-plans"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/subscription-plans");
      return res.json();
    },
  });
  const [exictingAdrs, setExictingAdrs] = useState<Address | null>(null);
  const defaultValues: SubscriptionFormValues = {
    plan: undefined as any,
    dietaryPreference: "veg",
    personCount: previousPlansData?.[0]?.personCount || 1,
    subscriptionType: "default",
    startDate:
      determinedAction === "RENEW"
        ? new Date()
        : new Date(previousPlansData?.[0]?.startDate) || new Date(),
    useNewAddress: false,
    timeSlot: deliveryTime[0].time,
    modifydelivaryAdrs: modifyDelivaryAddress[0].name,
  };

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues,
  });
  const diet = form.watch("dietaryPreference");
  const selectedPlan = form.watch("plan");
  const subscriptionType = form.watch("subscriptionType");
  const modifydelivaryAdrs = form.watch("modifydelivaryAdrs");
  const dietaryPreference = form.watch("dietaryPreference");
  const personCount = form.watch("personCount") || 1;
  const deliveryAddressId = form.watch("selectedAddressId");
  const basePrice = selectedPlan?.price;
  const totalPricePerPerson = basePrice;
  const totalPrice = totalPricePerPerson * personCount;
  type PriceChangeResult = {
    price: number;
    changeType: "priceUp" | "priceDown" | "noChange" | "invalidPlanData";
    unitsConsumed: number | null;
  };

  function calculatePlanPriceChange(): PriceChangeResult {
    const previousPlan = previousPlansData?.[0];

    let unitsConsumed: number | null = null;

    if (
      typeof selectedPlan?.price !== "number" ||
      typeof previousPlan?.price !== "number"
    ) {
      return { price: 0, changeType: "invalidPlanData", unitsConsumed };
    }

    let netPriceDifference: number;

    if (previousPlan.status === "inactive") {
      netPriceDifference = selectedPlan.price - previousPlan.price;
      unitsConsumed = 0; // or null, depending on business logic
    } else if (previousPlan.status === "active") {
      const { mealsPerMonth, startDate } = previousPlan;

      if (typeof mealsPerMonth !== "number" || mealsPerMonth <= 0) {
        return { price: 0, changeType: "invalidPlanData", unitsConsumed };
      }

      if (!startDate || isNaN(new Date(startDate).getTime())) {
        return { price: 0, changeType: "invalidPlanData", unitsConsumed };
      }

      const now = new Date();
      const planStartDate = new Date(startDate);
      unitsConsumed = Math.max(
        0,
        Math.floor(
          (now.getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );

      if (unitsConsumed > mealsPerMonth) {
      }

      const costPerUnit =
        (previousPlan.price * previousPlan.personCount) / mealsPerMonth;
      const consumedValue = costPerUnit * unitsConsumed;
      const remainingValue = previousPlan.price - consumedValue;

      if (
        typeof selectedPlan.duration !== "number" ||
        selectedPlan.duration <= 0
      ) {
        return { price: 0, changeType: "invalidPlanData", unitsConsumed };
      }

      const costPerNewUnit =
        (selectedPlan.price * personCount) / selectedPlan.duration;
      const selectedPlanActualPrice =
        selectedPlan.price - costPerNewUnit * unitsConsumed;

      netPriceDifference = selectedPlanActualPrice - remainingValue;
    } else {
      return { price: 0, changeType: "invalidPlanData", unitsConsumed };
    }

    const changeType: PriceChangeResult["changeType"] =
      netPriceDifference > 0
        ? "priceUp"
        : netPriceDifference < 0
          ? "priceDown"
          : "noChange";

    return {
      price: Math.abs(netPriceDifference),
      changeType,
      unitsConsumed,
    };
  }

  const upgradePrice = calculatePlanPriceChange();
  const subscriptionMutation = useMutation({
    mutationFn: async (data: SubscriptionFormValues) => {
      const payload = {
        plan: data.plan.planType,
        subscriptionType: data.subscriptionType,
        startDate: data.startDate.toISOString(),
        mealsPerMonth: data.plan.duration,
        price: data.plan.price || 0,
        dietaryPreference: data.dietaryPreference,
        personCount: data.personCount,
        menuItems: data.plan.menuItems,
        timeSlot: data.timeSlot,
        increasedPrice:
          upgradePrice?.changeType === "priceUp" ? upgradePrice?.price : 0,
        walletPrice:
          upgradePrice?.changeType === "priceDown" ? upgradePrice?.price : 0,
      };

      const previousPlanId = previousPlansData?.[0]?.id;

      const subscriptionType =
        determinedAction === "UPGRADE"
          ? "subscriptionUpgrade"
          : determinedAction === "RENEW"
            ? "subscriptionRenewal"
            : "subscription";
      const subscriptionPrice =
        upgradePrice?.changeType === "priceUp"
          ? (upgradePrice?.price ?? 0)
          : (data?.plan?.price ?? 0);
      return new Promise((resolve, reject) => {
        initiatePayment({
          amount: subscriptionPrice,
          orderId: previousPlanId,
          type: subscriptionType,
          description: `${data.plan.name} Millet Meal Subscription`,
          name: "Aayuv Millet Foods",
          theme: { color: "#9E6D38" },

          onSuccess: async (paymentData: RazorpayPaymentData) => {
            try {
              const subscription = await apiRequest(
                "PATCH",
                `/api/subscriptions/${previousPlanId}`,
                {
                  // status: "active",
                  razorpayPaymentId: paymentData.razorpay_payment_id,
                  razorpayOrderId: paymentData.razorpay_order_id,
                  razorpaySignature: paymentData.razorpay_signature,
                  ...payload,
                },
              );

              toast({
                title: "Subscription Successful!",
                description: `You have successfully subscribed to the ${data.plan.name} plan. Your millet meals will be delivered according to your schedule.`,
                variant: "default",
              });

              // navigate(
              //   `/payment-success?subscriptionId=${previousPlanId}&type=subscription`,
              // );
              setFormStep("success");

              resolve(subscription);
            } catch (error) {
              reject(error);
            }
          },

          onFailure: (error: Error) => {
            toast({
              title: "Payment Failed",
              description:
                error.message ||
                "Failed to process your payment. Please try again.",
              variant: "destructive",
            });
            reject(error);
          },
        });
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
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

  const goToNextStep = () => {
    if (formStep === "plan") {
      setFormStep("payment");
    }
  };

  const goToPreviousStep = () => {
    if (formStep === "payment") {
      setFormStep("plan");
    }
  };

  const selectAddress = (addressId: number) => {
    form.setValue("selectedAddressId", addressId);
    form.setValue("useNewAddress", false);
  };

  const handleAddressFormSubmit = (addressData: any) => {
    const isEditing = editingAddress !== null;
    const method = isEditing ? "PATCH" : "POST";
    const url = isEditing
      ? `/api/addresses/${editingAddress.id}`
      : "/api/addresses";

    apiRequest(method, url, addressData)
      .then((res) => res.json())
      .then((data) => {
        if (isEditing) {
          setAddresses((prev) =>
            prev.map((addr) => (addr.id === editingAddress.id ? data : addr)),
          );
          selectAddress(data.id);
        } else {
          setAddresses((prev) => [...prev, data]);
          selectAddress(data.id);
        }

        setAddressModalOpen(false);
        setEditingAddress(null);

        toast({
          title: isEditing ? "Address updated" : "Address added",
          description: isEditing
            ? "Your delivery address has been updated successfully."
            : "Your new delivery address has been added successfully.",
          variant: "default",
        });
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: `Failed to ${isEditing ? "update" : "add"} address. Please try again.`,
          variant: "destructive",
        });
      });
  };

  const handleDeleteAddress = async (addressId: number) => {
    try {
      await apiRequest("DELETE", `/api/addresses/${addressId}`);

      setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));

      if (form.watch("selectedAddressId") === addressId) {
        form.setValue("selectedAddressId", undefined);
      }

      toast({
        title: "Address deleted",
        description: "Your delivery address has been deleted successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete address. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const plans =
      subscriptionPlans?.find((group: any) => group.dietaryPreference === diet)
        ?.plans || [];

    const sortedPlans = [
      plans?.find((p: any) => p.planType === "basic"),
      plans?.find((p: any) => p.planType === "premium"),
      plans?.find((p: any) => p.planType === "family"),
    ].filter(Boolean);

    setFilteredPlans(sortedPlans);

    const defaultPlan = sortedPlans?.find(
      (plan: any) => plan.planType === previousPlansData?.[0]?.plan,
    );
    if (defaultPlan) {
      form.setValue("plan", defaultPlan);
    }
  }, [subscriptionPlans, diet, previousPlansData]);
  useEffect(() => {
    if (determinedAction === "RENEW") {
      const date = new Date();
      form.setValue("startDate", date);
    }
  }, [determinedAction]);
  useEffect(() => {
    if (user) {
      apiRequest("GET", "/api/addresses")
        .then((res) => res.json())
        .then((data) => {
          setAddresses(data);
          const exicting = data?.find(
            (address: any) =>
              address.id === previousPlansData[0]?.deliveryAddressId,
          );
          setExictingAdrs(exicting);
          // Set default address in form if available
          const defaultAddress = data.find((addr: Address) => addr.isDefault);
          if (defaultAddress) {
            form.setValue("selectedAddressId", defaultAddress.id);
          } else if (data.length > 0) {
            form.setValue("selectedAddressId", data[0].id);
          }
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: "Failed to load addresses",
            variant: "destructive",
          });
        });
    }
  }, [user, toast, form]);

  useEffect(() => {
    determineAction();
  }, [diet, selectedPlan, previousPlansData]);

  const determineAction = () => {
    const previousActivePlan = previousPlansData?.find(
      (p: any) => p.status === "active" || p.status === "inactive",
    );

    const previousCompletedPlan = previousPlansData?.find(
      (p: any) => p.status === "completed",
    );

    let action = "NONE / DEFAULT";

    if (previousActivePlan) {
      const prevDiet = previousActivePlan.dietaryPreference;
      const prevPlanType = previousActivePlan.plan;

      if (prevDiet === diet && prevPlanType === selectedPlan?.planType) {
        action = "MODIFY";
      } else {
        action = "UPGRADE";
      }
    } else if (previousCompletedPlan) {
      action = "RENEW";
    }

    setDeterminedAction(action);
  };

  const ModifySubscriptionMutation = useMutation({
    mutationFn: async ({
      subscriptionId,
      resumeDate,
      timeSlot,
      deliveryAddressId,
      personCount,
    }: {
      subscriptionId: number;
      resumeDate: any;
      timeSlot: any;
      deliveryAddressId: number;
      personCount: number;
    }) => {
      const payload = {
        resumeDate: resumeDate,
        timeSlot: timeSlot,
        deliveryAddressId: deliveryAddressId,
        personCount: personCount,
      };

      const res = await apiRequest(
        "POST",
        `/api/subscriptions/${subscriptionId}/modify`,
        payload,
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to modify subscription");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Subscription updated",
        description: "Your subscription has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description:
          error.message || "There was an error updating your subscription",
        variant: "destructive",
      });
    },
  });
  const getButtonLabel = (user: any, action: any, addressStatus: any) => {
    if (!user) return "Login & Continue";
    if (addressStatus === "No") return "Delivery Info";
    switch (action) {
      case "MODIFY":
        return "Update Subscription";
      case "UPGRADE":
        return "Upgrade Plan";
      case "RENEW":
        return "Renew Plan";
      default:
        return "Continue";
    }
  };

  const getAdrsButtonLabel = (action: any) => {
    switch (action) {
      case "MODIFY":
        return "Update Subscription";
      case "UPGRADE":
        return "Upgrade Plan";
      case "RENEW":
        return "Renew Plan";
      default:
        return "Continue";
    }
  };

  const onModifySubmit = (data: SubscriptionFormValues) => {
    const previousPlanId = previousPlansData?.[0]?.id;
    if (modifydelivaryAdrs === "No") {
      goToNextStep();
    } else if (previousPlanId) {
      if (determinedAction === "MODIFY") {
        ModifySubscriptionMutation.mutate({
          subscriptionId: previousPlanId,
          resumeDate: new Date(data.startDate).toISOString(),
          timeSlot: data.timeSlot,
          deliveryAddressId:
            modifydelivaryAdrs === "Yes"
              ? previousPlansData?.[0]?.deliveryAddressId
              : deliveryAddressId,
          personCount: personCount,
        });
      } else if (determinedAction === "UPGRADE") {
        subscriptionMutation.mutate(data);
      } else if (determinedAction === "RENEW") {
        subscriptionMutation.mutate(data);
      }
    } else {
      toast({
        title: "No Previous Plan Found",
        description: "Unable to proceed without a valid subscription.",
        variant: "destructive",
      });
    }
  };
  const onSubmit = (data: SubscriptionFormValues) => {
    const previousPlanId = previousPlansData?.[0]?.id;
    if (previousPlanId) {
      if (determinedAction === "MODIFY") {
        ModifySubscriptionMutation.mutate({
          subscriptionId: previousPlanId,
          resumeDate: new Date(data.startDate).toISOString(),
          timeSlot: data.timeSlot,
          deliveryAddressId:
            modifydelivaryAdrs === "Yes"
              ? previousPlansData?.[0]?.deliveryAddressId
              : deliveryAddressId,
          personCount: personCount,
        });
      } else if (determinedAction === "UPGRADE") {
        subscriptionMutation.mutate(data);
      } else if (determinedAction === "RENEW") {
        subscriptionMutation.mutate(data);
      }
    }
  };
  const renderStepContent = () => {
    switch (formStep) {
      case "plan":
        return (
          <div>
            <div className="mb-5 text-center">
              <h1 className="text-4xl font-bold inline-flex items-center gap-2">
                <Sparkles className="text-orange-500" /> Manage Your
                Subscription
              </h1>
              <p className="text-lg text-gray-500 mt-2">
                Custom millet meal plans tailored to your lifestyle
              </p>
            </div>
            <Tabs
              defaultValue="vegetarian"
              className="mb-5 flex flex-col items-center"
            >
              <TabsList className="bg-white p-1 rounded-full shadow-md flex gap-4">
                <TabsTrigger
                  value="vegetarian"
                  onClick={() =>
                    form.setValue(
                      "dietaryPreference",
                      "veg" as "veg" | "veg_with_egg" | "nonveg",
                    )
                  }
                >
                  🌿 Vegetarian
                </TabsTrigger>
                <TabsTrigger
                  value="egg"
                  onClick={() =>
                    form.setValue(
                      "dietaryPreference",
                      "veg_with_egg" as "veg" | "veg_with_egg" | "nonveg",
                    )
                  }
                >
                  🥚 With Egg
                </TabsTrigger>
                <TabsTrigger
                  value="nonveg"
                  onClick={() =>
                    form.setValue(
                      "dietaryPreference",
                      "nonveg" as "veg" | "veg_with_egg" | "nonveg",
                    )
                  }
                >
                  🍗 Non-Veg
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                {filteredPlans?.map((plan: any) => (
                  <Card
                    key={plan.id}
                    className={`rounded-2xl cursor-pointer transition-transform hover:-translate-y-1 border-2 bg-white shadow-md   ${
                      selectedPlan?.planType === plan.planType
                        ? "border-primary"
                        : "border-gray-200 hover:border-primary/50"
                    }`}
                    onClick={() => form.setValue("plan", plan)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center w-full">
                        <CardTitle className="text-lg font-bold">
                          {
                            plansEmoji.find(
                              (item: any) => item.name === plan.name,
                            )?.emoji
                          }{" "}
                          {plan.name === "Family" ? "Elite" : plan.name}
                        </CardTitle>

                        {selectedPlan?.planType === plan.planType && (
                          <div className="flex items-center space-x-2 ml-auto">
                            <span
                              role="button"
                              className="text-primary hover:underline cursor-pointer font-medium text-sm"
                              onClick={() => {
                                setDefaulMealModalOpen(true);
                              }}
                            >
                              Meal info
                            </span>
                            <Check className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </div>

                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-2xl font-bold text-primary">
                          {formatPrice(plan.price)}
                          <span className="text-sm font-normal text-gray-600">
                            /month
                          </span>
                        </div>
                        <div className="space-y-2">
                          {plan.features.map((feature: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-sm"
                            >
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5 bg-orange-50 border-l-4 border-orange-400 p-6 rounded-xl shadow-sm ">
              <div className="col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold text-primary">
                    ✨ {selectedPlan?.name}
                  </p>

                  <Badge
                    variant="outline"
                    className={
                      form.watch("dietaryPreference") === "veg"
                        ? "bg-green-100 text-green-800"
                        : form.watch("dietaryPreference") === "veg_with_egg"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                    }
                  >
                    {form.watch("dietaryPreference") === "veg"
                      ? "Vegetarian"
                      : form.watch("dietaryPreference") === "veg_with_egg"
                        ? "Veg with Egg"
                        : "Non-Vegetarian"}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-base font-medium">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          Start Date
                        </FormLabel>
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
                    name="timeSlot"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-base font-medium">
                          <Clock className="h-4 w-4 text-primary" />
                          Delivery Time Slot
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue=""
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a time slot" />
                            </SelectTrigger>
                            <SelectContent>
                              {deliveryTime.map(({ id, time }) => (
                                <SelectItem key={id} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="modifydelivaryAdrs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-base font-medium">
                          <Home className="h-4 w-4 text-primary" />
                          Confirm Address
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue=""
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a time slot" />
                            </SelectTrigger>
                            <SelectContent>
                              {modifyDelivaryAddress.map(({ id, name }) => (
                                <SelectItem key={id} value={name}>
                                  {name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                        {modifydelivaryAdrs !== "No" && (
                          <div className="flex flex-col">
                            <p className="text-sm text-gray-600">
                              {exictingAdrs?.addressLine1}
                            </p>
                            {exictingAdrs?.addressLine2 && (
                              <p className="text-sm text-gray-600">
                                {exictingAdrs?.addressLine2}
                              </p>
                            )}

                            <p className="text-sm text-gray-600">
                              Phone: {exictingAdrs?.phone}
                            </p>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-orange-100 shadow-sm w-full max-w-md mx-auto">
                <div>
                  <span className="text-lg font-bold block mb-3">
                    {" "}
                    💰 Order Summary
                  </span>
                  <div className="space-y-2 text-base font-medium text-gray-900">
                    <div className="flex justify-between items-center">
                      <span>Base Price (per person):</span>
                      <span>{formatPrice(basePrice)}</span>
                    </div>

                    {determinedAction === "UPGRADE" && (
                      <>
                        <div className="flex justify-between items-center">
                          <span>Previous Price per person:</span>
                          <span>
                            {formatPrice(previousPlansData?.[0]?.price)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Previous days consumed:</span>
                          <span>{upgradePrice?.unitsConsumed}</span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between items-center">
                      <span>Persons:</span>
                      <FormField
                        control={form.control}
                        name="personCount"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6 sm:h-7 sm:w-7 rounded-full"
                                onClick={() =>
                                  form.setValue(
                                    "personCount",
                                    Math.max(1, field.value - 1),
                                  )
                                }
                                disabled={field.value <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>

                              <span className="text-sm font-medium w-3 text-center">
                                {personCount}
                              </span>

                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6 sm:h-7 sm:w-7 rounded-full"
                                onClick={() =>
                                  form.setValue(
                                    "personCount",
                                    Math.min(10, field.value + 1),
                                  )
                                }
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

                    <div className="text-lg font-bold text-gray-900 flex justify-between items-center pt-3 border-t">
                      <span>Total:</span>
                      <span>
                        {determinedAction === "UPGRADE"
                          ? formatPrice(upgradePrice?.price * personCount)
                          : formatPrice(totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-center">
                  <Button
                    type="button"
                    className="bg-primary hover:bg-primary/90 rounded-full text-sm sm:text-base px-4 py-2 whitespace-normal text-center"
                    onClick={form.handleSubmit(onModifySubmit)}
                  >
                    {getButtonLabel(user, determinedAction, modifydelivaryAdrs)}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {subscriptionType === "default" && (
              <DefaulMealSheduleModal
                currentPlan={selectedPlan}
                form={form}
                defaulMealModalOpen={defaulMealModalOpen}
                setDefaulMealModalOpen={setDefaulMealModalOpen}
              />
            )}
          </div>
        );

      case "payment":
        return (
          <div>
            <div className="flex items-center justify-center mb-6">
              <ClipboardList className="h-8 w-8 text-orange-500 mr-3" />
              <h1 className="text-3xl font-bold text-gray-800">
                Complete Your Subscription
              </h1>
            </div>
            <div>
              <div className="mb-6">
                {addresses.length > 0 ? (
                  <>
                    <div className="flex justify-end mb-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => {
                          setAddressModalOpen(true),
                            setAddressModalAction("addressAdd");
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add New Address
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className={`p-4 rounded-2xl cursor-pointer transition-transform hover:-translate-y-1 border-2 bg-white shadow-md ${
                            form.watch("selectedAddressId") === address.id
                              ? "border-primary"
                              : "border-gray-200 hover:border-primary/50"
                          }`}
                          onClick={() => selectAddress(address.id)}
                        >
                          <div className="flex justify-between">
                            <div className="flex gap-2 items-center">
                              <span className="text-xl font-bold text-gray-800 mb-1">
                                {address.name}
                              </span>
                              {address.isDefault && (
                                <Badge variant="outline" className="text-xs">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingAddress(address);
                                  setAddressModalOpen(true);
                                  setAddressModalAction("addressEdit");
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingAddress(address);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              {form.watch("selectedAddressId") ===
                                address.id && (
                                <Check className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <p className="text-sm text-gray-600">
                              {address?.addressLine1}
                            </p>
                            {address?.addressLine2 && (
                              <p className="text-sm text-gray-600">
                                {address?.addressLine2}, {address?.city}
                              </p>
                            )}

                            <p className="text-sm text-gray-600">
                              Phone: {address?.phone}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <></>
                )}
              </div>

              <div className="mt-5 bg-orange-50 border-l-4 border-orange-400 p-6 rounded-xl shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-8">
                    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-orange-100 shadow-sm w-full">
                      {(() => {
                        const address = addresses.find(
                          (address) => address.id === deliveryAddressId,
                        );
                        if (!address)
                          return (
                            <>
                              <div className="flex justify-center">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="rounded-full"
                                  onClick={() => {
                                    setAddressModalOpen(true),
                                      setAddressModalAction("addressAdd");
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add New Address
                                </Button>
                              </div>
                            </>
                          );

                        return (
                          <div>
                            <div className="flex justify-between">
                              <span className="text-xl font-bold text-gray-800 mb-1">
                                🚚 Delivary Address
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <p className="text-sm text-gray-600">
                                {address?.addressLine1}
                              </p>
                              {address?.addressLine2 && (
                                <p className="text-sm text-gray-600">
                                  {address.addressLine2}
                                </p>
                              )}
                              <p className="text-sm text-gray-600">
                                Phone: {address?.phone}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Subscription Details Card */}
                    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-orange-100 shadow-sm w-full">
                      <div className="flex justify-between items-center pb-4">
                        <div className="text-xl font-bold">
                          📦 Subscription Details
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            dietaryPreference === "veg"
                              ? "bg-green-100 text-green-800"
                              : dietaryPreference === "veg_with_egg"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {dietaryPreference === "veg"
                            ? "Vegetarian"
                            : dietaryPreference === "veg_with_egg"
                              ? "Veg with Egg"
                              : "Non-Vegetarian"}
                        </Badge>
                      </div>

                      <ul className="text-base text-gray-700 space-y-1">
                        <li>
                          <span className="font-medium text-gray-900">
                            Plan:
                          </span>{" "}
                          {selectedPlan?.name}
                        </li>
                        <li>
                          <span className="font-medium text-gray-900">
                            Start Date:
                          </span>{" "}
                          {format(form.watch("startDate"), "PPP")}
                        </li>
                        <li>
                          <span className="font-medium text-gray-900">
                            Meals Per Month:
                          </span>{" "}
                          {selectedPlan?.duration}
                        </li>
                      </ul>

                      <div className="mt-6 flex justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={goToPreviousStep}
                          className="rounded-full"
                        >
                          <ArrowLeft className="mr-1 h-4 w-4" />
                          Change Plan
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Order Summary */}
                  <div className="bg-white rounded-2xl p-4 sm:p-6 border border-orange-100 shadow-sm w-full">
                    <div className="text-xl font-bold pb-4">
                      💰 Order Summary
                    </div>
                    <ul className="text-base font-medium text-gray-900 space-y-1">
                      <li className="flex justify-between items-center">
                        <span>Base Price (per person):</span>
                        {formatPrice(selectedPlan.price)}/month
                      </li>

                      {determinedAction === "UPGRADE" && (
                        <>
                          <li className="flex justify-between items-center">
                            <span>Previous Price per person:</span>
                            <span>
                              {formatPrice(previousPlansData?.[0]?.price)}
                            </span>
                          </li>
                          <li className="flex justify-between items-center">
                            <span>Previous days consumed:</span>
                            <span>{upgradePrice?.unitsConsumed}</span>
                          </li>
                        </>
                      )}

                      <li className="flex justify-between items-center">
                        <span>Persons:</span>
                        {personCount}
                      </li>

                      <li className="text-lg font-bold text-gray-900 flex justify-between items-center pt-3 border-t">
                        <span>Total:</span>
                        {determinedAction === "UPGRADE"
                          ? formatPrice(upgradePrice?.price * personCount)
                          : formatPrice(basePrice * personCount)}
                      </li>
                    </ul>

                    {/* Button */}
                    <div className="mt-6 flex justify-center">
                      <Button
                        type="button"
                        className="bg-primary hover:bg-primary/90 rounded-full text-sm sm:text-base px-4 py-2 whitespace-normal text-center"
                        onClick={form.handleSubmit(onSubmit)}
                      >
                        {subscriptionMutation.isPending ? (
                          <>
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>{getAdrsButtonLabel(determinedAction)}</>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <NewAddressModal
                addressModalOpen={addressModalOpen}
                setAddressModalOpen={(open: boolean) => {
                  setAddressModalOpen(open);
                }}
                handleAddressFormSubmit={handleAddressFormSubmit}
                editingAddress={editingAddress}
                addressModalAction={addressModalAction}
              />

              <div className="text-gray-600 text-sm mt-6 mb-10 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p>
                  <CheckCircle className="inline-block h-4 w-4 text-green-500 mr-2" />
                  Note: We currently deliver only in Hyderabad, within a 10km
                  radius of our service locations.
                </p>
              </div>
            </div>
          </div>
        );
      case "success":
        return (
          <div>
            <SuccessPage />
          </div>
        );
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto">
        <Form {...form}>
          <div className="max-w-7xl mx-auto px-5 py-6">
            {renderStepContent()}
          </div>
        </Form>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onOpenChange={setAuthModalOpen}
        redirectUrl={`/subscription?plan=${selectedPlan?.planType}`}
      />
      <DeleteAddressDialog
        open={!!deletingAddress}
        address={deletingAddress}
        onCancel={() => setDeletingAddress(null)}
        onConfirm={(id) => {
          handleDeleteAddress(id);
          setDeletingAddress(null);
        }}
      />
    </div>
  );
};

export default SubscriptionCRUD;
