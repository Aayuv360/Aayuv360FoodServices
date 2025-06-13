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
  Edit,
  Trash2,
  Sparkles,
  ClipboardList,
  CheckCircle,
  Home,
  ShoppingBag,
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
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

type FormStep = "plan" | "payment" | "success";

interface RazorpayPaymentData {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

const Subscription = () => {
  const [location, setLocation] = useLocation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { initiatePayment } = useRazorpay();
  const [formStep, setFormStep] = useState<FormStep>("plan");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [defaulMealModalOpen, setDefaulMealModalOpen] =
    useState<boolean>(false);
  const [addressModalOpen, setAddressModalOpen] = useState<boolean>(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null);
  const [locationSearch, setLocationSearch] = useState<string>("");
  const [filteredLocations, setFilteredLocations] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<any>([]);

  const { data: subscriptionPlans, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/subscription-plans"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/subscription-plans");
      return res.json();
    },
  });

  const defaultValues: SubscriptionFormValues = {
    plan: undefined as any,
    dietaryPreference: "veg",
    personCount: 1,
    subscriptionType: "default",
    startDate: new Date(),
    useNewAddress: false,
  };

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues,
  });
  const diet = form.watch("dietaryPreference");
  const selectedPlan = form.watch("plan");
  const subscriptionType = form.watch("subscriptionType");

  const subscriptionMutation = useMutation({
    mutationFn: async (data: SubscriptionFormValues) => {
      const payload = {
        userId: user?.id,
        plan: data.plan.planType,
        subscriptionType: data.subscriptionType,
        startDate: data.startDate.toISOString(),
        mealsPerMonth: data.plan.duration,
        price: data.plan.price || 0,
        status: "pending",
        dietaryPreference: data.dietaryPreference,
        personCount: data.personCount,
        paymentMethod: "razorpay",
        menuItems: data.plan.menuItems,
      };

      const response = await apiRequest("POST", "/api/subscriptions", payload);
      const subscription = await response.json();

      initiatePayment({
        amount: data.plan.price || 0,
        orderId: subscription.id,
        type: "subscription",
        description: `${data.plan.name} Millet Meal Subscription`,
        name: "Aayuv Millet Foods",
        theme: { color: "#9E6D38" },
        onSuccess: async (paymentData: RazorpayPaymentData) => {
          await apiRequest("PATCH", `/api/subscriptions/${subscription.id}`, {
            status: "active",
            razorpayPaymentId: paymentData.razorpay_payment_id,
            razorpayOrderId: paymentData.razorpay_order_id,
            razorpaySignature: paymentData.razorpay_signature,
          });

          toast({
            title: "Subscription Successful!",
            description: `You have successfully subscribed to the ${data.plan.name} plan. Your millet meals will be delivered according to your schedule.`,
            variant: "default",
          });

          localStorage.setItem(
            "lastSubscriptionId",
            subscription.id.toString(),
          );

          // navigate(
          //   `/payment-success?subscriptionId=${subscription.id}&type=subscription`,
          // );
          setFormStep("success");
        },
        onFailure: (error: Error) => {
          toast({
            title: "Payment Failed",
            description:
              error.message ||
              "Failed to process your payment. Please try again.",
            variant: "destructive",
          });
        },
      });

      return subscription;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      localStorage.setItem("lastSubscriptionId", data.id.toString());
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

  const selectLocation = (location: any) => {
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
    const addressData = {
      name: formData.get("addressName") as string,
      phone: formData.get("phone") as string,
      addressLine1: formData.get("addressLine1") as string,
      addressLine2: (formData.get("addressLine2") as string) || undefined,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      pincode: formData.get("pincode") as string,
      isDefault: Boolean(formData.get("isDefault")),
    };

    const isEditing = editingAddress !== null;
    const method = isEditing ? "PATCH" : "POST";
    const url = isEditing
      ? `/api/addresses/${editingAddress.id}`
      : "/api/addresses";

    apiRequest(method, url, addressData)
      .then((res) => res.json())
      .then((data) => {
        if (isEditing) {
          // Update the existing address in the list
          setAddresses((prev) =>
            prev.map((addr) => (addr.id === editingAddress.id ? data : addr)),
          );
          selectAddress(data.id);
        } else {
          // Add the new address to the list
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
        console.error(
          `Error ${isEditing ? "updating" : "creating"} address:`,
          error,
        );
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

      // Remove the address from the list
      setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));

      // If the deleted address was selected, clear the selection
      if (form.watch("selectedAddressId") === addressId) {
        form.setValue("selectedAddressId", undefined);
      }

      toast({
        title: "Address deleted",
        description: "Your delivery address has been deleted successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting address:", error);
      toast({
        title: "Error",
        description: "Failed to delete address. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (values: SubscriptionFormValues) => {
    if (formStep === "payment") {
      if (!values.selectedAddressId && !values.useNewAddress) {
        toast({
          title: "Address required",
          description: "Please select an existing address or add a new one",
          variant: "destructive",
        });
        return;
      }
    }

    toast({
      title: "Processing subscription...",
      description: "Your subscription request is being processed.",
    });

    subscriptionMutation.mutate(values);
  };

  const dietaryPreference = form.watch("dietaryPreference");
  const personCount = form.watch("personCount") || 1;
  const basePrice = selectedPlan?.price;
  const totalPricePerPerson = basePrice;
  const totalPrice = totalPricePerPerson * personCount;
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
      (plan: any) => plan.planType === "basic",
    );
    if (defaultPlan) {
      form.setValue("plan", defaultPlan);
    }
  }, [subscriptionPlans, diet]);

  useEffect(() => {
    if (user) {
      apiRequest("GET", "/api/addresses")
        .then((res) => res.json())
        .then((data) => {
          setAddresses(data);

          // Set default address in form if available
          const defaultAddress = data.find((addr: Address) => addr.isDefault);
          if (defaultAddress) {
            form.setValue("selectedAddressId", defaultAddress.id);
          } else if (data.length > 0) {
            form.setValue("selectedAddressId", data[0].id);
          }
        })
        .catch((error) => {
          console.error("Error fetching addresses:", error);
          toast({
            title: "Error",
            description: "Failed to load addresses",
            variant: "destructive",
          });
        });
    }
  }, [user, toast, form]);

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
    enabled: locationSearch.length > 1,
  });

  useEffect(() => {
    if (locations) {
      setFilteredLocations(locations);
    }
  }, [locations]);

  const renderStepContent = () => {
    switch (formStep) {
      case "plan":
        return (
          <div>
            <div className="mb-5 text-center">
              <h1 className="text-4xl font-bold inline-flex items-center gap-2">
                <Sparkles className="text-orange-500" /> Subscribe to Aayuv
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

            <div className="mt-5 bg-orange-50 border-l-4 border-orange-400 p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                {/* <h4 className="text-xl font-semibold">✨ Your Selection</h4>
                 */}
                <p className="text-xl font-semibold text-primary">
                  {selectedPlan?.name}
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

              <p className="text-sm text-gray-600 mt-1">
                {selectedPlan?.description}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 ">
                {/* Start Date */}
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

                {/* Person Count */}
                <FormField
                  control={form.control}
                  name="personCount"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel className="text-base font-medium">
                        Number of Persons
                      </FormLabel>
                      <div className="flex items-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 bg-white  shadow-sm rounded-r-none border-r"
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
                        <FormControl>
                          <Input
                            type="number"
                            className="h-9 w-12 text-center border-0 rounded-none shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 bg-white  shadow-sm rounded-l-none border-l"
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

              <div className="mt-3 p-3 rounded-md border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Price per person:</span>
                  <span className="text-sm">{formatPrice(basePrice)}</span>
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
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Default Meal Schedule Modal */}
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
              {addresses.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-end mb-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => setAddressModalOpen(true)}
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
                            <h5 className="text-xl font-semibold text-gray-800 mb-1">
                              {address.name}
                            </h5>
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
              <div className="mt-5 bg-orange-50 border-l-4 border-orange-400 p-6 rounded-xl shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="text-xl font-bold pb-4">
                      📦 Subscription Details
                    </div>
                    <ul className="text-sm text-gray-700 space-y-3">
                      <li>
                        <span className="font-medium text-gray-900">Plan:</span>{" "}
                        {selectedPlan?.name}
                      </li>
                      <li>
                        <span className="font-medium text-gray-900">
                          Start Date:
                        </span>
                        {format(form.watch("startDate"), "PPP")}
                      </li>
                      <li>
                        <span className="font-medium text-gray-900">
                          Number of Persons:
                        </span>{" "}
                        {personCount}
                      </li>
                      <li>
                        <span className="font-medium text-gray-900">
                          Meals Per Month:
                        </span>{" "}
                        {selectedPlan?.duration}
                      </li>
                      <li>
                        <span className="font-medium text-gray-900">
                          {" "}
                          Selected Diet:
                        </span>{" "}
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
                      </li>
                    </ul>
                  </div>
                  <div>
                    <div className="text-xl font-bold pb-4">
                      💰 Order Summary
                    </div>
                    <ul className="text-sm text-gray-700 space-y-3">
                      <li>
                        <span className="font-medium text-gray-900">
                          Base Price (per person):
                        </span>{" "}
                        {formatPrice(selectedPlan.price)}/month
                      </li>
                      {personCount > 1 && (
                        <li>
                          <span className="font-medium text-gray-900">
                            Number of persons:
                          </span>
                          × {personCount}
                        </li>
                      )}
                      <li>
                        <span className="font-medium text-gray-900">
                          Subtotal:
                        </span>{" "}
                        {formatPrice(basePrice * personCount)}
                        /month
                      </li>
                      <li>
                        <span className="font-medium text-gray-900">
                          Tax (5% GST):
                        </span>{" "}
                        {formatPrice(basePrice * personCount * 0.05)}
                      </li>
                      <li className="text-lg font-bold text-gray-900 border-t pt-3">
                        <span className="text-primary">Total:</span>{" "}
                        {formatPrice(basePrice * personCount * 1.05)}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <NewAddressModal
                addressModalOpen={addressModalOpen}
                setAddressModalOpen={(open) => {
                  setAddressModalOpen(open);
                  if (!open) {
                    setEditingAddress(null);
                  }
                }}
                locationSearch={locationSearch}
                filteredLocations={filteredLocations}
                handleAddressFormSubmit={handleAddressFormSubmit}
                setLocationSearch={setLocationSearch}
                selectLocation={selectLocation}
                editingAddress={editingAddress}
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

            <div className="flex justify-between items-center pt-4">
              {formStep === "payment" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                  className="rounded-full"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to Plan
                </Button>
              )}

              {formStep === "plan" && (
                <Button
                  type="button"
                  className="ml-auto bg-primary hover:bg-primary/90 rounded-full"
                  onClick={() => {
                    if (!user) {
                      setAuthModalOpen(true);
                    } else {
                      goToNextStep();
                    }
                  }}
                >
                  {!user ? "Login and continue" : "Continue to payment"}

                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              )}

              {formStep === "payment" && (
                <Button
                  type="button"
                  className="ml-auto bg-primary hover:bg-primary/90 rounded-full"
                  onClick={form.handleSubmit(onSubmit)}
                >
                  {subscriptionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
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

export default Subscription;
