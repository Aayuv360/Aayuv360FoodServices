import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRazorpay } from "@/hooks/use-razorpay";
import { getCurrentISTDate } from "@/lib/timezone-utils";
import { DefaulMealSheduleModal } from "@/components/Modals/DefaulMealSheduleModal";
import { NewAddressModal } from "@/components/Modals/NewAddressModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { Address } from "@shared/schema";
import DeleteAddressDialog from "@/components/Modals/DeleteAddressDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SuccessPage from "./SuccessPage";
import { useLocationManager } from "@/hooks/use-location-manager";
import { SubscriptionPlanCards } from "./subscriptionPlanCards";
import { useIsMobile } from "@/hooks/use-mobile";
import { deliveryTime } from "@/utils/subscribeConstants";
import {
  FormStep,
  SubscriptionFormValues,
  RazorpayPaymentData,
} from "@/utils/type";
import { subscriptionSchema } from "@/utils/schema";

const Subscription = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialPlan = searchParams.get("plan") || "basic";
  const { initiatePayment } = useRazorpay();
  const [formStep, setFormStep] = useState<FormStep>("plan");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [defaulMealModalOpen, setDefaulMealModalOpen] =
    useState<boolean>(false);
  const [addressModalOpen, setAddressModalOpen] = useState<boolean>(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [deletingAddress, setDeletingAddress] = useState<any>(null);
  const [filteredPlans, setFilteredPlans] = useState<any>([]);
  const [addressModalAction, setAddressModalAction] = useState<string>("");
  const { savedAddresses, selectAddress, deleteAddress, selectedAddress } =
    useLocationManager();
  const notSavedAddress = savedAddresses?.find(
    (item) => item.id === selectedAddress?.id,
  );
  const { data: subscriptionPlans, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/subscription-plans"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/subscription-plans");
      return res.json();
    },
  });
  const setSelectedPlan = (plan: any) => {
    form.setValue("plan", plan);
  };
  const defaultValues: SubscriptionFormValues = {
    plan: undefined as any,
    dietaryPreference: "veg",
    personCount: 1,
    subscriptionType: "default",
    startDate: getCurrentISTDate(),
    useNewAddress: false,
    timeSlot: deliveryTime[0].time,
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
        dietaryPreference: data.dietaryPreference,
        personCount: data.personCount,
        paymentMethod: "razorpay",
        menuItems: data.plan.menuItems,
        timeSlot: data.timeSlot,
        deliveryAddressId: selectedAddress?.id,
      };
      const response = await apiRequest(
        "POST",
        "/api/subscriptions/generate-id",
      );

      const { id: subscriptionId } = await response.json();

      return new Promise((resolve, reject) => {
        initiatePayment({
          amount: data.plan.price || 0,
          orderId: subscriptionId,
          type: "subscription",
          description: `${data.plan.name} Millet Meal Subscription`,
          name: "Aayuv Millet Foods",
          theme: { color: "#9E6D38" },

          onSuccess: async (paymentData: RazorpayPaymentData) => {
            try {
              const updatedSubscription = await apiRequest(
                "POST",
                `/api/subscriptions`,
                {
                  ...payload,
                  id: subscriptionId,
                  razorpayPaymentId: paymentData.razorpay_payment_id,
                  razorpayOrderId: paymentData.razorpay_order_id,
                  razorpaySignature: paymentData.razorpay_signature,
                },
              );

              toast({
                title: "Subscription Successful!",
                description: `You have successfully subscribed to the ${data.plan.name} plan. Your millet meals will be delivered according to your schedule.`,
                variant: "default",
              });

              navigate(`/success/${subscriptionId}/subscribed`);

              resolve(updatedSubscription);
            } catch (error) {
              reject(error);
            }
          },

          onFailure: (error: any) => {
            if (error.type !== "user_cancelled") {
              toast({
                title: "Payment Failed",
                description:
                  error.message ||
                  "Failed to process your payment. Please try again.",
                variant: "destructive",
              });
            }
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

  const handleDeleteAddress = async (addressId: number) => {
    deleteAddress(addressId);
  };

  const onSubmit = (values: SubscriptionFormValues) => {
    if (formStep === "payment") {
      if (!notSavedAddress) {
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
      (plan: any) => plan.planType === initialPlan,
    );
    if (defaultPlan) {
      form.setValue("plan", defaultPlan);
    }
  }, [subscriptionPlans, diet, location.search]);

  const renderStepContent = () => {
    switch (formStep) {
      case "plan":
        return (
          <div>
            <div className="mb-5 text-center">
              <h1 className="text-2xl font-bold inline-flex items-center gap-2">
                <Sparkles className="text-orange-500" /> Subscribe to Aayuv
              </h1>
              <p className="text-m text-gray-500">
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
                  🌿 Veg
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
              <SubscriptionPlanCards
                filteredPlans={filteredPlans}
                selectedPlan={selectedPlan}
                setSelectedPlan={setSelectedPlan}
                isMobile={isMobile}
                setDefaulMealModalOpen={setDefaulMealModalOpen}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-5 bg-orange-50 border-l-4 border-orange-400 p-6 rounded-xl shadow-sm ">
              <div className="col-span-2 space-y-4">
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
                              disabled={(date) => date < getCurrentISTDate()}
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
                      <span className="text-sm font-bold">
                        {formatPrice(basePrice)}
                      </span>
                    </div>
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
                    <div className="flex justify-between items-center mt-1 border-t pt-2">
                      <span className="text-sm font-extrabold">
                        Total monthly price:
                      </span>
                      <span className="text-sm font-extrabold">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <Button
                    type="button"
                    className="bg-primary hover:bg-primary/90 rounded-full text-sm sm:text-base px-4 py-2 whitespace-normal text-center"
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
                <>
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
                    {savedAddresses?.map((address) => (
                      <div
                        key={address.id}
                        className={`p-4 rounded-2xl cursor-pointer transition-transform hover:-translate-y-1 border-2 bg-white shadow-md ${
                          selectedAddress?.id === address.id
                            ? "border-primary"
                            : "border-gray-200 hover:border-primary/50"
                        }`}
                        onClick={() => {
                          selectAddress(address);
                          form.setValue("useNewAddress", false);
                          setAddressModalAction("addressAdd");
                        }}
                      >
                        <div className="flex justify-between">
                          <div className="flex gap-2 items-center">
                            <span className="text-xl font-bold text-gray-800 mb-1">
                              {address.label}
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
                            {selectedAddress?.id === address.id && (
                              <Check className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm text-gray-600">
                            {address?.address}
                          </p>

                          <p className="text-sm text-gray-600">
                            Phone: {address?.phone}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              </div>

              <div className="mt-5 bg-orange-50 border-l-4 border-orange-400 p-6 rounded-xl shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-8">
                    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-orange-100 shadow-sm w-full">
                      {(() => {
                        if (!notSavedAddress)
                          return (
                            <>
                              <div className="flex justify-center">
                                Add a new address and select an address to
                                proceed.
                              </div>
                            </>
                          );

                        return (
                          <div>
                            <div className="flex justify-between">
                              <span className="text-xl font-bold text-gray-800 mb-1">
                                🚚 Delivery Address
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <p className="text-sm text-gray-600">
                                {notSavedAddress?.address}
                              </p>

                              <p className="text-sm text-gray-600">
                                Phone: {notSavedAddress?.phone}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
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
                      <ul className="text-base text-gray-700 space-y-3">
                        <li>
                          <span className="font-medium text-gray-900">
                            Plan:
                          </span>{" "}
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
                  <div className="bg-white rounded-2xl p-4 sm:p-6 border border-orange-100 shadow-sm w-full">
                    <div className="text-xl font-bold pb-4">
                      💰 Order Summary
                    </div>
                    <ul className="text-base font-bold text-gray-900  space-y-3">
                      <li className="flex justify-between items-center">
                        <span>Base Price (per person):</span>{" "}
                        {formatPrice(selectedPlan.price)}/month
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">
                          Persons:
                        </span>
                        {personCount}
                      </li>

                      <li className="text-lg font-bold text-gray-900 flex justify-between items-center pt-3 border-t">
                        <span className="text-primary">Total:</span>{" "}
                        {formatPrice(basePrice * personCount)}
                      </li>
                    </ul>
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
                          <>Complete Subscription</>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <NewAddressModal
                addressModalOpen={addressModalOpen}
                setAddressModalOpen={(open) => {
                  setAddressModalOpen(open);
                }}
                setEditingAddress={setEditingAddress}
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
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto">
        <Form {...form}>
          <div className="max-w-7xl mx-auto py-6">{renderStepContent()}</div>
        </Form>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onOpenChange={setAuthModalOpen}
        mode="subscribe"
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
