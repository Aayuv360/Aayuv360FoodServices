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
  // useEffect(() => {
  //   if (open) {
  //     setCurrentStep("cart");
  //   }
  // }, [open]);

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
        console.log(item, selectedCurryOption);
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

    if (meal.curryOptions.length > 0) {
      return true;
    }

    return false;
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

        const formattedAddress = `${selectedAddress.addressLine1}${selectedAddress.addressLine2 ? ", " + selectedAddress.addressLine2 : ""}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`;

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
                    {/* Quantity Controls */}
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
                        <Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </Button>
                      <span className="mx-1.5 sm:mx-2 text-xs sm:text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-5 w-5 sm:h-6 sm:w-6 rounded-full"
                        onClick={() => handleCustomizeItem(item)}
                      >
                        <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </Button>
                    </div>

                    {/* Customize Button */}
                    {hasCurryOptions(item.meal) && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-5 sm:h-6 text-[10px] sm:text-xs text-primary"
                        onClick={() => handleCustomizeItem(item)}
                      >
                        Customize
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-4 py-4 border-t">
            <h3 className="font-medium text-base mb-3">Bill Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Items Total</span>
                <span>{formatPrice(calculateCartTotal())}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Charge</span>
                <span>{formatPrice(deliveryType === "express" ? 60 : 40)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Taxes</span>
                <span>{formatPrice(20)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Grand Total</span>
                <span className="text-primary">
                  {formatPrice(
                    calculateCartTotal() +
                      (deliveryType === "express" ? 60 : 40) +
                      20,
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="px-3 sm:px-4 py-2 sm:py-3 border-t">
            <h3 className="font-medium text-xs sm:text-sm mb-0.5 sm:mb-1">
              Cancellation Policy
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-600">
              Orders can be cancelled before they are confirmed by the
              restaurant. Once confirmed, refunds will be processed as per our
              policy.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full overflow-hidden">
          <SheetHeader className="p-3 sm:p-4 border-b">
            <div className="flex justify-between items-center">
              <SheetTitle className="text-lg sm:text-xl">Your Cart</SheetTitle>
            </div>
          </SheetHeader>

          <div className="flex-grow overflow-auto">
            {currentStep === "cart" && renderCartSummary()}

            {currentStep === "delivery" && (
              <div className="p-3 sm:p-4">
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-medium text-sm sm:text-base">
                    Delivery Address
                  </h3>

                  {/* Display existing addresses */}
                  {addresses.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className={`border rounded-md p-2 sm:p-3 cursor-pointer ${
                            selectedAddressId === address.id
                              ? "border-primary bg-primary/5"
                              : ""
                          }`}
                          onClick={() => setSelectedAddressId(address.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <div className="font-medium text-xs sm:text-sm">
                                {address.name}
                              </div>
                              {address.isDefault && (
                                <span className="text-[10px] sm:text-xs bg-primary/10 text-primary px-1.5 sm:px-2 py-0.5 rounded">
                                  Default
                                </span>
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
                              {selectedAddressId === address.id && (
                                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 line-clamp-1">
                            {address.addressLine1}
                          </p>
                          {address.addressLine2 && (
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                              {address.addressLine2}
                            </p>
                          )}
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                            Phone: {address.phone}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No saved addresses found
                    </div>
                  )}

                  {/* Button to add a new address */}
                  <div className="mt-3 sm:mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center justify-center h-auto py-1.5 sm:py-2 text-xs sm:text-sm"
                      onClick={() => setAddressModalOpen(true)}
                    >
                      <PlusCircle className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                    editingAddress={editingAddress}
                  />

                  <div className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4">
                    <h3 className="font-medium text-xs sm:text-sm mb-1.5 sm:mb-2">
                      Delivery Type
                    </h3>
                    <div className="flex gap-1.5 sm:gap-2">
                      <Button
                        type="button"
                        variant={
                          deliveryType === "default" ? "default" : "outline"
                        }
                        className="flex-1 text-xs sm:text-sm h-auto py-1.5 sm:py-2"
                        onClick={() => setDeliveryType("default")}
                      >
                        Standard
                      </Button>
                      <Button
                        type="button"
                        variant={
                          deliveryType === "express" ? "default" : "outline"
                        }
                        className="flex-1 text-xs sm:text-sm h-auto py-1.5 sm:py-2"
                        onClick={() => setDeliveryType("express")}
                      >
                        Express (+ 60)
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
                    <p>
                      We currently deliver only in Hyderabad, within a 10km
                      radius of our service locations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === "payment" && renderCartSummary()}

            {currentStep === "success" && (
              <div className="p-3 sm:p-4 text-center">
                <div className="bg-primary/10 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Check className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold mb-1.5 sm:mb-2">
                  Order Placed Successfully!
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mb-5 sm:mb-6">
                  Your order #{orderId} has been placed successfully.
                </p>
                <div className="border p-3 sm:p-4 rounded-md mb-5 sm:mb-6">
                  <h3 className="font-medium text-sm sm:text-base text-left mb-1.5 sm:mb-2">
                    Order Details
                  </h3>
                  <div className="text-xs sm:text-sm text-left space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between">
                      <span>Order Number</span>
                      <span>#{orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Method</span>
                      <span>
                        {selectedPaymentMethod === "razorpay"
                          ? "Online Payment"
                          : "Cash on Delivery"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Amount</span>
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
                <Button
                  className="w-full mb-2 text-xs sm:text-sm h-auto py-1.5 sm:py-2"
                  onClick={() => {
                    onClose();
                    setCurrentStep("cart");
                    navigate("/menu");
                  }}
                >
                  Continue Shopping
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-xs sm:text-sm h-auto py-1.5 sm:py-2"
                  onClick={() => {
                    onClose();
                    setCurrentStep("cart");
                    navigate("/profile?tab=orders");
                  }}
                >
                  View Orders
                </Button>
              </div>
            )}
          </div>

          {/* Footer with proceed button */}
          {currentStep !== "success" && cartItems.length > 0 && (
            <div className="border-t">
              {currentStep === "cart" ? (
                <div className="p-3 sm:p-4">
                  <Button
                    onClick={handleNextStep}
                    className="w-full bg-primary text-white font-medium text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                    disabled={loading || cartItems.length === 0}
                  >
                    Proceed
                  </Button>
                </div>
              ) : (
                <>
                  {currentStep === "payment" && (
                    <Address selectedAddress={selectedAddress} />
                  )}
                  <div className="p-3 sm:p-4 flex gap-1.5 sm:gap-2">
                    <Button
                      variant="outline"
                      onClick={handlePreviousStep}
                      className="flex-1 text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                    >
                      <ChevronLeft className="mr-0.5 sm:mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                      Back
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      className="flex-1 text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                      disabled={loading || isCreatingOrder}
                    >
                      {currentStep === "delivery" && "Continue to Payment"}
                      {currentStep === "payment" && (
                        <>
                          {isCreatingOrder ? (
                            <>Processing...</>
                          ) : (
                            <>
                              <CreditCard className="mr-0.5 sm:mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                              Pay{" "}
                              {formatPrice(
                                calculateCartTotal() +
                                  (deliveryType === "express" ? 60 : 40) +
                                  20,
                              )}
                            </>
                          )}
                        </>
                      )}
                      {currentStep === "delivery" && (
                        <ChevronRight className="ml-1 h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
      <AuthModal isOpen={authModalOpen} onOpenChange={setAuthModalOpen} />

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
