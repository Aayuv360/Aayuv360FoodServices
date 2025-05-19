import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useCart } from "@/hooks/use-cart";
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
import { CurryOptionsModal } from "@/components/menu/CurryOptionsModal";
import { NewAddressModal } from "@/components/Modals/NewAddressModal";

// Import step components
import CartItems from "./CartItems";
import DeliveryAddressStep from "./DeliveryAddressStep";
import PaymentStep from "./PaymentStep";
import SuccessStep from "./SuccessStep";

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

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
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

type CheckoutStep = "cart" | "delivery" | "payment" | "success";

const CartSidebarRefactored = ({ open, onClose }: CartSidebarProps) => {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("cart");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("razorpay");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [deliveryType, setDeliveryType] = useState<string>("default");
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState<string>("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [customizingMeal, setCustomizingMeal] = useState<any | null>(null);
  const [formattedAddress, setFormattedAddress] = useState<string>("");

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState<string>("");
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const {
    cartItems,
    loading,
    updateCartItemNotes,
    updateCartItem,
    updateCartItemWithOptions,
    removeCartItem,
    clearCart,
  } = useCart();
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
      setCurrentStep("cart");
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

  const selectLocation = (location: Location) => {
    setLocationSearch(location.area);
  };

  const calculateCartTotal = (): number => {
    return cartItems.reduce((total, item) => {
      const itemPrice =
        (item?.meal?.price || 0) +
        (item?.meal?.curryOption?.priceAdjustment || 0);
      return total + itemPrice * item.quantity;
    }, 0);
  };

  const handleUpdateCurryOption = async (updatedMeal: any) => {
    const cartItem = cartItems.find((item) => item.meal?.id === updatedMeal.id);

    if (cartItem) {
      try {
        await updateCartItemWithOptions(cartItem.id, updatedMeal.curryOption);

        toast({
          title: "Item updated",
          description: `Your ${updatedMeal.name} has been updated with ${updatedMeal.curryOption.name}`,
        });

        setCustomizingMeal(null);
      } catch (error) {
        console.error("Error updating cart item:", error);
        toast({
          title: "Error",
          description: "Failed to update your selection",
          variant: "destructive",
        });
      }
    }
  };

  const handleCustomizeItem = (item: any) => {
    setCustomizingMeal(item.meal);
  };

  const handleNextStep = async () => {
    if (currentStep === "cart") {
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
        setIsCreatingOrder(true);
        const selectedAddress = addresses.find(
          (addr) => addr.id === selectedAddressId,
        );
        if (!selectedAddress) {
          throw new Error("Selected address not found");
        }
        const deliveryDetails = {
          name: selectedAddress.name,
          phoneNumber: selectedAddress.phone,
          completeAddress: selectedAddress.addressLine1,
          nearbyLandmark: selectedAddress.addressLine2 || "",
          zipCode: selectedAddress.pincode,
          addressType: selectedAddress.name.toLowerCase().includes("home")
            ? "home"
            : selectedAddress.name.toLowerCase().includes("work")
              ? "work"
              : "other",
          deliveryType,
        };

        const formatted = `${selectedAddress.addressLine1}${selectedAddress.addressLine2 ? ", " + selectedAddress.addressLine2 : ""}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`;
        setFormattedAddress(formatted);

        const total =
          calculateCartTotal() + (deliveryType === "express" ? 60 : 40) + 20;

        const orderPayload = {
          items: cartItems.map((item) => ({
            mealId: item.mealId,
            quantity: item.quantity,
            notes: item.notes,
            curryOptionId: item.meal?.curryOption?.id,
            curryOptionName: item.meal?.curryOption?.name,
            curryOptionPrice: item.meal?.curryOption?.priceAdjustment,
          })),
          deliveryDetails,
          paymentMethod: selectedPaymentMethod,
          totalPrice: total,
          deliveryAddress: formatted,
        };

        const res = await apiRequest("POST", "/api/orders", orderPayload);
        const orderData = await res.json();
        setOrderId(orderData.id);

        if (selectedPaymentMethod === "razorpay") {
          initiatePayment({
            amount: total,
            orderId: orderData.id,
            description: "Food Order",
            name: "Aayuv Millet Foods",
            theme: { color: "#9E6D38" },
            onSuccess: async (response) => {
              await apiRequest("PATCH", `/api/orders/${orderData.id}`, {
                status: "confirmed",
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              });

              await clearCart();

              toast({
                title: "Order Placed!",
                description:
                  "Your order has been placed successfully. You can track your order in your profile.",
                variant: "default",
              });

              navigate(`/payment-success?orderId=${orderData.id}`);
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
        console.error("Error creating order:", error);
        toast({
          title: "Error",
          description: "Failed to create order",
          variant: "destructive",
        });
      } finally {
        setIsCreatingOrder(false);
      }
    } else if (currentStep === "success") {
      onClose();
      setCurrentStep("cart");
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === "payment") {
      setCurrentStep("delivery");
    } else if (currentStep === "delivery") {
      setCurrentStep("cart");
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "cart":
        return (
          <CartItems 
            editingItemId={editingItemId}
            setEditingItemId={setEditingItemId}
            noteText={noteText}
            setNoteText={setNoteText}
            handleCustomizeItem={handleCustomizeItem}
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
          <PaymentStep 
            selectedPaymentMethod={selectedPaymentMethod}
            setSelectedPaymentMethod={setSelectedPaymentMethod}
            cartTotal={calculateCartTotal()}
            deliveryCharge={40}
            deliveryType={deliveryType}
          />
        );
      case "success":
        return (
          <SuccessStep 
            orderId={orderId}
            selectedPaymentMethod={selectedPaymentMethod}
            totalAmount={calculateCartTotal() + (deliveryType === "express" ? 60 : 40) + 20}
            deliveryAddress={formattedAddress}
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
                {currentStep === "cart"
                  ? "Your Cart"
                  : currentStep === "delivery"
                  ? "Delivery Address"
                  : currentStep === "payment"
                  ? "Payment"
                  : "Order Complete"}
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
                {currentStep !== "cart" ? (
                  <Button
                    variant="ghost"
                    onClick={handlePreviousStep}
                    className="flex items-center"
                    disabled={isCreatingOrder}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                ) : (
                  <div></div>
                )}
                <Button
                  onClick={handleNextStep}
                  className="flex items-center ml-auto"
                  disabled={isCreatingOrder || cartItems.length === 0}
                >
                  {isCreatingOrder ? (
                    <>Processing...</>
                  ) : currentStep === "cart" ? (
                    <>Checkout</>
                  ) : currentStep === "delivery" ? (
                    <>Continue to Payment</>
                  ) : (
                    <>Place Order</>
                  )}
                  {!isCreatingOrder && (
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
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        message="Login or create an account to continue with your order"
        onSuccess={() => {
          setAuthModalOpen(false);
          setCurrentStep("delivery");
        }}
      />

      <NewAddressModal
        open={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSubmit={handleAddressFormSubmit}
      />

      {customizingMeal && (
        <CurryOptionsModal
          open={!!customizingMeal}
          onClose={() => setCustomizingMeal(null)}
          meal={customizingMeal}
          onAddToCart={handleUpdateCurryOption}
          lastCurryOption={customizingMeal?.curryOption}
          isInCart={true}
        />
      )}
    </>
  );
};

export default CartSidebarRefactored;