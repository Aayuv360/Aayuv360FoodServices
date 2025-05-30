import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Minus,
  Plus,
  Check,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  ShoppingCart as ShoppingCartIcon,
  PlusCircle,
  Trash2,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useRazorpay } from "@/hooks/use-razorpay";
import { formatPrice } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AuthModal } from "@/components/auth/AuthModal";
import { Separator } from "@/components/ui/separator";
import { NewAddressModal } from "@/components/Modals/NewAddressModal";
import { CurryOptionsModal } from "@/components/menu/CurryOptionsModal";
import { Meal } from "@shared/schema";
import { Address } from "./Address";
import DeleteAddressDialog from "../Modals/DeleteAddressDialog";

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

const CartSidebar = ({ open, onClose }: CartSidebarProps) => {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("cart");
  const selectedPaymentMethod = "razorpay";
  const [orderId, setOrderId] = useState<number | null>(null);
  const [deliveryType, setDeliveryType] = useState<string>("default");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [customizingMeal, setCustomizingMeal] = useState<any | null>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState<string>("");
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null);

  const {
    cartItems,
    loading,
    updateCartItem,
    addToCart,
    removeCartItem,
    clearCart,
  } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { initiatePayment } = useRazorpay();
  const selectedAddress = addresses.find(
    (addr) => addr.id === selectedAddressId,
  );

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

  const selectAddress = (addressId: number) => {
    setSelectedAddressId(addressId);
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

      setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));

      if (selectedAddressId === addressId) {
        setSelectedAddressId(null);
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

  const selectLocation = (location: Location) => {
    setLocationSearch(location.area);
  };

  const calculateCartTotal = (): number => {
    let total = 0;

    for (const item of cartItems) {
      const itemPrice =
        (item?.meal?.price || 0) +
        (item?.meal?.selectedCurry?.priceAdjustment || 0);
      total += itemPrice * item.quantity;
    }

    return total;
  };

  const handleUpdateCurryOption = async (
    selectedMeal: Meal,
    selectedCurryOption: any,
  ) => {
    try {
      const existingItem = cartItems.find((item) => {
        return (
          item.meal?.id === selectedMeal.id &&
          item.meal?.selectedCurry?.id === selectedCurryOption?.id
        );
      });

      if (existingItem) {
        await updateCartItem(existingItem.id, existingItem.quantity + 1);
        setCustomizingMeal(null);

        toast({
          title: "Quantity increased",
          description: `${selectedMeal.name} with ${selectedCurryOption?.name} quantity increased`,
        });
      } else {
        const mealWithCurry = {
          ...selectedMeal,
          curryOption: selectedCurryOption,
        };
        await addToCart(mealWithCurry, 1);
        setCustomizingMeal(null);

        toast({
          title: "Added to cart",
          description: `${selectedMeal.name} with ${selectedCurryOption?.name} added to your cart`,
        });
      }

      setCustomizingMeal(null);
    } catch (error) {
      console.error("Error adding item to cart:", error);

      if (
        error instanceof Error &&
        error.message === "authentication_required"
      ) {
        setCustomizingMeal(null);
        return;
      }

      toast({
        title: "Error",
        description: "There was an error updating your cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const hasCurryOptions = (meal: any) => {
    if (!meal) return false;
    return meal.curryOptions && meal.curryOptions.length > 0;
  };

  const handleCustomizeItem = (item: any) => {
    setCustomizingMeal(item.meal);
  };

  function calculateMealPrice(item: any): number {
    const basePrice = item.meal?.price || 0;
    const curryAdjustment =
      (item.meal as any)?.curryOption?.priceAdjustment ??
      (item.meal as any)?.selectedCurry?.priceAdjustment ??
      item.curryOptionPrice ??
      0;
    return (basePrice + curryAdjustment) * item.quantity;
  }

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
        const selectedAddressObj = addresses.find(
          (addr) => addr.id === selectedAddressId,
        );
        if (!selectedAddressObj) {
          throw new Error("Selected address not found");
        }
        const deliveryDetails = {
          name: selectedAddressObj.name,
          phoneNumber: selectedAddressObj.phone,
          completeAddress: selectedAddressObj.addressLine1,
          nearbyLandmark: selectedAddressObj.addressLine2 || "",
          zipCode: selectedAddressObj.pincode,
          addressType: selectedAddressObj.name.toLowerCase().includes("home")
            ? "home"
            : selectedAddressObj.name.toLowerCase().includes("work")
              ? "work"
              : "other",
          deliveryType,
        };

        const formattedAddress = `${selectedAddressObj.addressLine1}${selectedAddressObj.addressLine2 ? ", " + selectedAddressObj.addressLine2 : ""}, ${selectedAddressObj.city}, ${selectedAddressObj.state} - ${selectedAddressObj.pincode}`;

        const total =
          calculateCartTotal() + (deliveryType === "express" ? 60 : 40) + 20;

        const orderPayload = {
          items: cartItems.map((item) => ({
            mealId: item.mealId,
            quantity: item.quantity,
            notes: item.notes,
            curryOptionId: (item.meal as any)?.curryOption?.id,
            curryOptionName: (item.meal as any)?.curryOption?.name,
            curryOptionPrice: (item.meal as any)?.curryOption?.priceAdjustment,
          })),
          deliveryDetails,
          paymentMethod: selectedPaymentMethod,
          totalPrice: total,
          deliveryAddress: formattedAddress,
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

  const renderCartSummary = () => (
    <div className="flex-grow overflow-y-auto">
      {cartItems.length === 0 ? (
        <div className="text-center py-6 sm:py-8 px-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4">
            <ShoppingCartIcon className="w-full h-full" />
          </div>
          <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">
            Your cart is empty
          </p>
          <Button
            onClick={() => {
              navigate("/menu");
              onClose();
            }}
            className="text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
          >
            Browse Menu
          </Button>
        </div>
      ) : (
        <div>
          <div className="px-4 py-3">
            {cartItems.map((item) => {
              return (
                <div
                  key={item.id}
                  className="flex items-start border-b py-2 sm:py-3"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={item.meal?.imageUrl || "/placeholder-meal.jpg"}
                      alt={item.meal?.name || "Meal item"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow px-2 sm:px-3">
                    <h4 className="font-medium text-xs sm:text-sm line-clamp-1">
                      {item.meal?.name}
                    </h4>
                    {((item.meal as any)?.curryOption ||
                      (item.meal as any)?.selectedCurry ||
                      item.curryOptionName) && (
                      <p className="text-[10px] sm:text-xs text-gray-600">
                        with{" "}
                        {(item.meal as any)?.curryOption?.name ||
                          (item.meal as any)?.selectedCurry?.name ||
                          item.curryOptionName}
                        {((item.meal as any)?.curryOption?.priceAdjustment >
                          0 ||
                          (item.meal as any)?.selectedCurry?.priceAdjustment >
                            0 ||
                          (item.curryOptionPrice &&
                            item.curryOptionPrice > 0)) && (
                          <span className="text-primary ml-1">
                            (+
                            {formatPrice(
                              (item.meal as any)?.curryOption
                                ?.priceAdjustment ||
                                (item.meal as any)?.selectedCurry
                                  ?.priceAdjustment ||
                                item.curryOptionPrice ||
                                0,
                            )}
                            )
                          </span>
                        )}
                      </p>
                    )}
                    <p className="text-primary text-xs sm:text-sm font-semibold">
                      {formatPrice(calculateMealPrice(item))}
                    </p>
                  </div>

                  <div className="flex flex-col items-start space-y-1 sm:space-y-1.5">
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-5 w-5 sm:h-6 sm:w-6 rounded-full"
                        onClick={() => {
                          if (item.quantity > 1) {
                            updateCartItem(item.id, item.quantity - 1);
                          } else {
                            removeCartItem(item.id);
                          }
                        }}
                      >
                        <Minus className="h-2 w-2 sm:h-3 sm:w-3" />
                      </Button>
                      <span className="px-2 text-xs sm:text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-5 w-5 sm:h-6 sm:w-6 rounded-full"
                        onClick={() =>
                          updateCartItem(item.id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-2 w-2 sm:h-3 sm:w-3" />
                      </Button>
                    </div>

                    <div className="flex items-center space-x-1">
                      {hasCurryOptions(item.meal) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[10px] sm:text-xs"
                          onClick={() => handleCustomizeItem(item)}
                        >
                          <Edit className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5" />
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-[10px] sm:text-xs text-red-600 hover:text-red-700"
                        onClick={() => removeCartItem(item.id)}
                      >
                        <Trash2 className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t px-4 py-3 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(calculateCartTotal())}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>{formatPrice(deliveryType === "express" ? 60 : 40)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST</span>
              <span>{formatPrice(20)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>
                {formatPrice(
                  calculateCartTotal() +
                    (deliveryType === "express" ? 60 : 40) +
                    20,
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:w-96 p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="text-sm sm:text-base">
              {currentStep === "cart" && "Your Order"}
              {currentStep === "delivery" && "Delivery Details"}
              {currentStep === "payment" && "Payment"}
              {currentStep === "success" && "Order Placed!"}
            </SheetTitle>
          </SheetHeader>

          {currentStep === "cart" && renderCartSummary()}

          {currentStep === "delivery" && (
            <div className="flex-grow overflow-y-auto px-4 py-3">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Select Address</h3>
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`border rounded-lg p-3 mb-2 cursor-pointer transition-colors ${
                        selectedAddressId === address.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => selectAddress(address.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{address.name}</p>
                          <p className="text-sm text-gray-600">
                            {address.phone}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.addressLine1}
                            {address.addressLine2 && `, ${address.addressLine2}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAddress(address);
                              setAddressModalOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingAddress(address);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setEditingAddress(null);
                      setAddressModalOpen(true);
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add New Address
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStep === "payment" && (
            <div className="flex-grow overflow-y-auto px-4 py-3">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Payment Method</h3>
                  <div className="border rounded-lg p-3 bg-primary/5 border-primary">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      <span>Razorpay (Cards, UPI, NetBanking)</span>
                      <Check className="h-4 w-4 ml-auto text-primary" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(calculateCartTotal())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>{formatPrice(deliveryType === "express" ? 60 : 40)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST</span>
                      <span>{formatPrice(20)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>
                        {formatPrice(
                          calculateCartTotal() +
                            (deliveryType === "express" ? 60 : 40) +
                            20,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {cartItems.length > 0 && (
            <div className="border-t p-4">
              <div className="flex space-x-2">
                {currentStep !== "cart" && (
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                    className="flex-1"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
                <Button
                  onClick={handleNextStep}
                  disabled={isCreatingOrder}
                  className="flex-1"
                >
                  {isCreatingOrder ? (
                    "Processing..."
                  ) : (
                    <>
                      {currentStep === "cart" && "Proceed to Delivery"}
                      {currentStep === "delivery" && "Proceed to Payment"}
                      {currentStep === "payment" && (
                        <>
                          Pay{" "}
                          {formatPrice(
                            calculateCartTotal() +
                              (deliveryType === "express" ? 60 : 40) +
                              20,
                          )}
                        </>
                      )}
                      {currentStep === "delivery" && (
                        <ChevronRight className="ml-1 h-4 w-4" />
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AuthModal isOpen={authModalOpen} onOpenChange={setAuthModalOpen} />

      <NewAddressModal
        open={addressModalOpen}
        onOpenChange={setAddressModalOpen}
        onSubmit={handleAddressFormSubmit}
        editingAddress={editingAddress}
        locationSearch={locationSearch}
        setLocationSearch={setLocationSearch}
        filteredLocations={filteredLocations}
        selectLocation={selectLocation}
      />

      {customizingMeal && (
        <CurryOptionsModal
          open={!!customizingMeal}
          onClose={() => setCustomizingMeal(null)}
          meal={customizingMeal}
          onAddToCart={handleUpdateCurryOption}
          lastCurryOption={customizingMeal?.selectedCurry}
          isInCart={true}
        />
      )}

      <DeleteAddressDialog
        open={!!deletingAddress}
        address={deletingAddress}
        onCancel={() => setDeletingAddress(null)}
        onConfirm={(id) => {
          handleDeleteAddress(id);
          setDeletingAddress(null);
        }}
      />
    </>
  );
};

export default CartSidebar;