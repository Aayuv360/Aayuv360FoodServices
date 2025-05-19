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
  MessageSquare,
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

const CartSidebarModern = ({ open, onClose }: CartSidebarProps) => {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("cart");
  const selectedPaymentMethod = "razorpay";
  const [orderId, setOrderId] = useState<number | null>(null);
  const [deliveryType, setDeliveryType] = useState<string>("default");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [customizingMeal, setCustomizingMeal] = useState<any | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState<string>("");

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
    if (meal.curryOptions && meal.curryOptions.length > 0) {
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

  const isEditingNotes = (id: number) => editingItemId === id;

  const handleEditNotes = (item: any) => {
    setEditingItemId(item.id);
    setNoteText(item.notes || "");
  };

  const handleSaveNotes = async (item: any) => {
    try {
      await apiRequest("PATCH", `/api/cart/${item.id}`, {
        notes: noteText,
      });
      
      // Update cart items locally
      const updatedItems = cartItems.map((cartItem) => {
        if (cartItem.id === item.id) {
          return { ...cartItem, notes: noteText };
        }
        return cartItem;
      });
      
      // This would normally be handled by the cart context
      // But for this example, we'll just show a toast
      
      toast({
        title: "Notes updated",
        description: "Your special instructions have been saved",
      });
      
      setEditingItemId(null);
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        title: "Error",
        description: "Failed to save your notes. Please try again.",
        variant: "destructive",
      });
    }
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
  
  // Modern Cart UI rendering
  const renderModernCart = () => (
    <div className="flex-grow overflow-y-auto flex flex-col h-full">
      {cartItems.length === 0 ? (
        <div className="text-center py-8 px-4 flex-grow flex flex-col items-center justify-center">
          <div className="w-20 h-20 mx-auto bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4">
            <ShoppingCartIcon className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
          <p className="text-gray-500 mb-6 text-sm">
            Add some delicious millet meals to get started
          </p>
          <Button
            onClick={() => {
              navigate("/menu");
              onClose();
            }}
            className="text-sm py-2 h-auto rounded-full px-6"
          >
            Browse Menu
          </Button>
        </div>
      ) : (
        <>
          <div className="px-4 py-3 space-y-4 flex-grow overflow-y-auto">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100"
              >
                <div className="flex p-3">
                  <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                    <img
                      src={item.meal?.imageUrl || "/placeholder-meal.jpg"}
                      alt={item.meal?.name || "Meal item"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow px-3">
                    <div className="flex justify-between">
                      <h4 className="font-medium text-sm">
                        {item.meal?.name}
                      </h4>
                      <p className="font-semibold text-sm text-primary">
                        {formatPrice(calculateMealPrice(item))}
                      </p>
                    </div>
                    
                    {((item.meal as any)?.curryOption ||
                      (item.meal as any)?.selectedCurry ||
                      item.curryOptionName) && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-800 border border-amber-200">
                          {(item.meal as any)?.curryOption?.name ||
                            (item.meal as any)?.selectedCurry?.name ||
                            item.curryOptionName}
                          {((item.meal as any)?.curryOption?.priceAdjustment > 0 ||
                            (item.meal as any)?.selectedCurry?.priceAdjustment > 0 ||
                            (item.curryOptionPrice && item.curryOptionPrice > 0)) && (
                            <span className="ml-1 font-medium">
                              (+
                              {formatPrice(
                                (item.meal as any)?.curryOption?.priceAdjustment ||
                                  (item.meal as any)?.selectedCurry?.priceAdjustment ||
                                  item.curryOptionPrice ||
                                  0
                              )}
                              )
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    
                    {item.notes && !isEditingNotes(item.id) && (
                      <p className="text-xs text-gray-600 mt-1 flex items-start">
                        <MessageSquare className="h-3 w-3 mr-1 mt-0.5 text-gray-400" />
                        {item.notes}
                      </p>
                    )}

                    {isEditingNotes(item.id) && (
                      <div className="mt-2">
                        <textarea
                          className="w-full text-xs p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Add special instructions..."
                          rows={2}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                        />
                        <div className="flex space-x-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8"
                            onClick={() => setEditingItemId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => handleSaveNotes(item)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-md"
                      onClick={() => {
                        if (item.quantity > 1) {
                          updateCartItem(item.id, item.quantity - 1);
                        } else {
                          removeCartItem(item.id);
                        }
                      }}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>

                    <span className="text-sm font-medium w-8 text-center">
                      {item.quantity}
                    </span>

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-md"
                      onClick={() => updateCartItem(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex space-x-1">
                    {hasCurryOptions(item.meal) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => handleCustomizeItem(item)}
                      >
                        <PlusCircle className="mr-1 h-3 w-3" />
                        Customize
                      </Button>
                    )}
                    
                    {!isEditingNotes(item.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => handleEditNotes(item)}
                      >
                        {item.notes ? "Edit Note" : "Add Note"}
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeCartItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bill Details Section */}
          <div className="px-4 py-4 border-t mt-auto">
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
                <span className="text-gray-600">Platform Fee</span>
                <span>{formatPrice(20)}</span>
              </div>

              <div className="flex justify-between font-medium text-base pt-2 border-t">
                <span>Total Amount</span>
                <span>
                  {formatPrice(calculateCartTotal() + (deliveryType === "express" ? 60 : 40) + 20)}
                </span>
              </div>
            </div>

            <Button
              className="w-full mt-4 rounded-md py-2 h-auto"
              onClick={handleNextStep}
            >
              Proceed to Checkout
            </Button>
          </div>
        </>
      )}
    </div>
  );

  const renderDeliveryDetails = () => (
    <div className="flex-grow overflow-y-auto">
      <div className="p-4">
        <button
          onClick={handlePreviousStep}
          className="flex items-center text-primary text-sm mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Cart
        </button>

        <h3 className="font-medium text-lg mb-4">Delivery Details</h3>

        <div className="mb-6">
          <h4 className="font-medium text-sm mb-2">Delivery Type</h4>
          <div className="space-y-2">
            <div
              className={`border rounded-md p-3 flex items-center cursor-pointer ${
                deliveryType === "default"
                  ? "border-primary bg-primary/5"
                  : "border-gray-200"
              }`}
              onClick={() => setDeliveryType("default")}
            >
              <div
                className={`w-4 h-4 rounded-full border mr-2 flex items-center justify-center ${
                  deliveryType === "default"
                    ? "border-primary"
                    : "border-gray-300"
                }`}
              >
                {deliveryType === "default" && (
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                )}
              </div>
              <div className="flex-grow">
                <h5 className="font-medium text-sm">Standard Delivery</h5>
                <p className="text-xs text-gray-500">
                  Delivered within 45-60 mins
                </p>
              </div>
              <div className="text-right text-sm font-medium">₹40</div>
            </div>

            <div
              className={`border rounded-md p-3 flex items-center cursor-pointer ${
                deliveryType === "express"
                  ? "border-primary bg-primary/5"
                  : "border-gray-200"
              }`}
              onClick={() => setDeliveryType("express")}
            >
              <div
                className={`w-4 h-4 rounded-full border mr-2 flex items-center justify-center ${
                  deliveryType === "express"
                    ? "border-primary"
                    : "border-gray-300"
                }`}
              >
                {deliveryType === "express" && (
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                )}
              </div>
              <div className="flex-grow">
                <h5 className="font-medium text-sm">Express Delivery</h5>
                <p className="text-xs text-gray-500">
                  Delivered within 25-30 mins
                </p>
              </div>
              <div className="text-right text-sm font-medium">₹60</div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-sm">Delivery Address</h4>
            <Button
              variant="link"
              className="p-0 h-auto text-xs text-primary"
              onClick={() => setAddressModalOpen(true)}
            >
              + Add New
            </Button>
          </div>

          {addresses.length === 0 ? (
            <div className="border border-gray-200 rounded-md p-4 text-center">
              <p className="text-sm text-gray-500 mb-2">
                You don't have any saved addresses
              </p>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setAddressModalOpen(true)}
              >
                Add Address
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`border rounded-md p-3 flex items-start cursor-pointer ${
                    selectedAddressId === address.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200"
                  }`}
                  onClick={() => setSelectedAddressId(address.id)}
                >
                  <div
                    className={`w-4 h-4 rounded-full border mt-0.5 mr-2 flex items-center justify-center ${
                      selectedAddressId === address.id
                        ? "border-primary"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedAddressId === address.id && (
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    )}
                  </div>
                  <div>
                    <h5 className="font-medium text-sm">{address.name}</h5>
                    <p className="text-xs text-gray-700">
                      {address.addressLine1}
                      {address.addressLine2 && `, ${address.addressLine2}`}
                    </p>
                    <p className="text-xs text-gray-700">
                      {address.city}, {address.state} - {address.pincode}
                    </p>
                    <p className="text-xs text-gray-700 mt-1">
                      Phone: {address.phone}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t mt-auto">
        <Button className="w-full" onClick={handleNextStep}>
          Proceed to Payment
        </Button>
      </div>
    </div>
  );

  const renderPaymentOptions = () => (
    <div className="flex-grow overflow-y-auto">
      <div className="p-4">
        <button
          onClick={handlePreviousStep}
          className="flex items-center text-primary text-sm mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Delivery
        </button>

        <h3 className="font-medium text-lg mb-4">Payment</h3>

        <div className="mb-6">
          <div className="border rounded-md p-3 flex items-center cursor-pointer border-primary bg-primary/5">
            <div className="w-4 h-4 rounded-full border border-primary mr-2 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
            </div>
            <div className="flex-grow">
              <h5 className="font-medium text-sm">Razorpay</h5>
              <p className="text-xs text-gray-500">
                Pay securely with credit/debit card or UPI
              </p>
            </div>
            <CreditCard className="h-5 w-5 text-gray-500" />
          </div>
        </div>

        <div className="p-3 border rounded-md mb-6">
          <h4 className="font-medium text-sm mb-2">Order Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Items Total</span>
              <span>{formatPrice(calculateCartTotal())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Charge</span>
              <span>{formatPrice(deliveryType === "express" ? 60 : 40)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform Fee</span>
              <span>{formatPrice(20)}</span>
            </div>
            <div className="flex justify-between font-medium pt-1 border-t mt-1">
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

        <div className="mb-6">
          <h4 className="font-medium text-sm mb-2">Delivery Address</h4>
          {selectedAddress && (
            <div className="border rounded-md p-3">
              <h5 className="font-medium text-sm">{selectedAddress.name}</h5>
              <p className="text-xs text-gray-700">
                {selectedAddress.addressLine1}
                {selectedAddress.addressLine2 &&
                  `, ${selectedAddress.addressLine2}`}
              </p>
              <p className="text-xs text-gray-700">
                {selectedAddress.city}, {selectedAddress.state} -{" "}
                {selectedAddress.pincode}
              </p>
              <p className="text-xs text-gray-700 mt-1">
                Phone: {selectedAddress.phone}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t">
        <Button
          className="w-full"
          onClick={handleNextStep}
          disabled={isCreatingOrder}
        >
          {isCreatingOrder ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            "Pay Now"
          )}
        </Button>
      </div>
    </div>
  );

  const renderSuccessView = () => (
    <div className="flex-grow overflow-y-auto">
      <div className="p-4 text-center">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="font-medium text-lg mb-2">Order Placed!</h3>
        <p className="text-gray-600 mb-4">
          Your order has been placed successfully. You can track your order in
          your profile.
        </p>
        <div className="bg-gray-50 p-3 rounded-md mb-6">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600">Order ID</span>
            <span className="text-sm font-medium">#{orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Amount Paid</span>
            <span className="text-sm font-medium">
              {formatPrice(
                calculateCartTotal() +
                  (deliveryType === "express" ? 60 : 40) +
                  20,
              )}
            </span>
          </div>
        </div>
        <div className="space-y-2">
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
      </div>
    </div>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="text-left flex items-center">
              {currentStep === "cart" ? (
                "Your Cart"
              ) : currentStep === "delivery" ? (
                "Delivery Details"
              ) : currentStep === "payment" ? (
                "Payment"
              ) : (
                "Order Confirmation"
              )}
              {currentStep !== "cart" && currentStep !== "success" && (
                <div className="ml-auto">
                  <button
                    onClick={handlePreviousStep}
                    className="text-sm text-gray-500 flex items-center"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </button>
                </div>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-grow flex flex-col h-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {currentStep === "cart" && renderModernCart()}
                {currentStep === "delivery" && renderDeliveryDetails()}
                {currentStep === "payment" && renderPaymentOptions()}
                {currentStep === "success" && renderSuccessView()}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <CurryOptionsModal
        isOpen={!!customizingMeal}
        onClose={() => setCustomizingMeal(null)}
        meal={customizingMeal}
        onSelectCurryOption={handleUpdateCurryOption}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          handleNextStep();
        }}
      />

      <NewAddressModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSubmit={handleAddressFormSubmit}
        locations={locations}
        locationSearch={locationSearch}
        setLocationSearch={setLocationSearch}
        filteredLocations={filteredLocations}
        onSelectLocation={selectLocation}
      />
    </>
  );
};

export default CartSidebarModern;