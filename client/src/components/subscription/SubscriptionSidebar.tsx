import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useRazorpay } from "@/hooks/use-razorpay";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AuthModal } from "@/components/auth/AuthModal";
import { NewAddressModal } from "@/components/Modals/NewAddressModal";

// Import step components
import PlanSelectionStep from "./components/PlanSelectionStep";
import DeliveryAddressStep from "../cart/components/DeliveryAddressStep";
import SubscriptionPaymentStep from "./components/SubscriptionPaymentStep";
import SubscriptionSuccessStep from "./components/SubscriptionSuccessStep";

const addressSchema = z.object({
  name: z.string().min(3, "Full name is required"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number too long"),
  addressType: z.enum(["home", "work", "other"]),
  completeAddress: z.string().min(5, "Complete address is required"),
  nearbyLandmark: z.string().optional(),
  zipCode: z.string().min(5, "Zip code is required"),
  locationId: z.number().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface SubscriptionSidebarProps {
  open: boolean;
  onClose: () => void;
  plan?: any;
}

interface Address {
  id: number;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface Location {
  id: number;
  area: string;
  pincode: string;
  deliveryFee: number;
}

type CheckoutStep = "plan" | "delivery" | "payment" | "success";

const SubscriptionSidebar = ({ open, onClose, plan }: SubscriptionSidebarProps) => {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("plan");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("razorpay");
  const [subscriptionId, setSubscriptionId] = useState<number | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState<string>("");
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { initiatePayment } = useRazorpay();

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      addressType: "home",
      completeAddress: "",
      nearbyLandmark: "",
      zipCode: "",
    },
  });

  useEffect(() => {
    if (open) {
      setCurrentStep("plan");
    }
  }, [open]);

  useEffect(() => {
    if (user && open) {
      apiRequest("GET", "/api/addresses")
        .then((res) => res.json())
        .then((data) => {
          setAddresses(data);
          const defaultAddress = data.find((addr: Address) => addr.isDefault);
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
          } else if (data.length > 0) {
            setSelectedAddressId(data[0].id);
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
  }, [user, open, toast]);

  useEffect(() => {
    apiRequest("GET", "/api/locations")
      .then((res) => res.json())
      .then((data) => {
        setLocations(data);
      })
      .catch((error) => {
        console.error("Error fetching locations:", error);
      });
  }, []);

  useEffect(() => {
    if (locationSearch.trim()) {
      const filtered = locations.filter(
        (loc) =>
          loc.area.toLowerCase().includes(locationSearch.toLowerCase()) ||
          loc.pincode.includes(locationSearch),
      );
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations([]);
    }
  }, [locationSearch, locations]);

  const handleAddressFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
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

    apiRequest("POST", "/api/addresses", addressData)
      .then((res) => res.json())
      .then((data) => {
        setAddresses((prev) => [...prev, data]);
        setSelectedAddressId(data.id);
        setAddressModalOpen(false);

        toast({
          title: "Address added",
          description: "Your new delivery address has been added successfully.",
        });
      })
      .catch((error) => {
        console.error("Error creating address:", error);
        toast({
          title: "Error",
          description: "Failed to add address. Please try again.",
          variant: "destructive",
        });
      });
  };

  const handleNextStep = async () => {
    if (currentStep === "plan") {
      if (!user) {
        setAuthModalOpen(true);
        return;
      }
      setCurrentStep("delivery");
    } else if (currentStep === "delivery") {
      if (!selectedAddressId) {
        toast({
          title: "Address required",
          description: "Please select an existing address or add a new one",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep("payment");
    } else if (currentStep === "payment") {
      try {
        setIsCreatingSubscription(true);
        const selectedAddress = addresses.find(
          (addr) => addr.id === selectedAddressId,
        );
        if (!selectedAddress) {
          throw new Error("Selected address not found");
        }

        const formattedAddress = `${selectedAddress.addressLine1}${selectedAddress.addressLine2 ? ", " + selectedAddress.addressLine2 : ""}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`;

        const subscriptionPayload = {
          plan: plan.name,
          price: plan.price,
          deliveryAddress: formattedAddress,
          paymentMethod: selectedPaymentMethod,
          startDate: new Date().toISOString(),
          subscriptionType: plan.type || "monthly",
          isActive: true,
          mealsPerMonth: plan.mealsPerMonth || 30,
        };

        const res = await apiRequest("POST", "/api/subscriptions", subscriptionPayload);
        const subscriptionData = await res.json();
        setSubscriptionId(subscriptionData.id);

        if (selectedPaymentMethod === "razorpay") {
          initiatePayment({
            amount: plan.price,
            orderId: subscriptionData.id,
            type: "subscription",
            description: `${plan.name} Subscription`,
            name: "Aayuv Millet Foods",
            theme: { color: "#9E6D38" },
            onSuccess: async (response) => {
              await apiRequest("PATCH", `/api/subscriptions/${subscriptionData.id}`, {
                status: "active",
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              });

              toast({
                title: "Subscription Activated!",
                description:
                  "Your subscription has been activated successfully. You can view your subscription details in your profile.",
                variant: "default",
              });

              navigate(`/payment-success?subscriptionId=${subscriptionData.id}&type=subscription`);
              onClose();
            },
            onFailure: (error) => {
              toast({
                title: "Payment Failed",
                description:
                  error.message ||
                  "Failed to process your payment. Please try again.",
                variant: "destructive",
              });
            },
          });
        } else {
          setCurrentStep("success");
        }
      } catch (error) {
        console.error("Error creating subscription:", error);
        toast({
          title: "Error",
          description: "Failed to create subscription",
          variant: "destructive",
        });
      } finally {
        setIsCreatingSubscription(false);
      }
    } else if (currentStep === "success") {
      onClose();
      setCurrentStep("plan");
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === "payment") {
      setCurrentStep("delivery");
    } else if (currentStep === "delivery") {
      setCurrentStep("plan");
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "plan":
        return (
          <PlanSelectionStep 
            plan={plan}
            onClose={onClose}
          />
        );
      case "delivery":
        return (
          <DeliveryAddressStep 
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            setSelectedAddressId={setSelectedAddressId}
            setAddressModalOpen={setAddressModalOpen}
          />
        );
      case "payment":
        return (
          <SubscriptionPaymentStep 
            selectedPaymentMethod={selectedPaymentMethod}
            setSelectedPaymentMethod={setSelectedPaymentMethod}
            planPrice={plan?.price || 0}
          />
        );
      case "success":
        return (
          <SubscriptionSuccessStep 
            subscriptionId={subscriptionId}
            plan={plan}
            selectedPaymentMethod={selectedPaymentMethod}
          />
        );
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent
          side="right"
          className="w-full sm:w-[450px] p-0 flex flex-col"
        >
          <SheetHeader className="px-4 py-3 border-b">
            <div className="flex justify-between items-center">
              <SheetTitle>
                {currentStep === "plan"
                  ? "Selected Plan"
                  : currentStep === "delivery"
                  ? "Delivery Address"
                  : currentStep === "payment"
                  ? "Payment"
                  : "Subscription Complete"}
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          {renderCurrentStep()}

          <div className="p-4 border-t mt-auto">
            {currentStep !== "success" && (
              <div className="flex justify-between items-center">
                {currentStep !== "plan" ? (
                  <Button
                    variant="ghost"
                    onClick={handlePreviousStep}
                    className="flex items-center"
                    disabled={isCreatingSubscription}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                ) : (
                  <div></div>
                )}
                <Button
                  onClick={handleNextStep}
                  className="flex items-center ml-auto"
                  disabled={isCreatingSubscription || !plan}
                >
                  {isCreatingSubscription ? (
                    <>Processing...</>
                  ) : currentStep === "plan" ? (
                    <>Continue to Delivery</>
                  ) : currentStep === "delivery" ? (
                    <>Continue to Payment</>
                  ) : (
                    <>Complete Subscription</>
                  )}
                  {!isCreatingSubscription && (
                    <ChevronRight className="ml-1 h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
            {currentStep === "success" && (
              <Button
                onClick={onClose}
                className="w-full"
              >
                Done
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AuthModal
        isOpen={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultTab="login"
        mode="subscribe"
        onSuccess={() => {
          setCurrentStep("delivery");
        }}
      />

      <NewAddressModal
        open={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSubmit={handleAddressFormSubmit}
      />
    </>
  );
};

export default SubscriptionSidebar;