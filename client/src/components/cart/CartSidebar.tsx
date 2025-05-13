import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  X,
  Minus,
  Plus,
  Trash2,
  Check,
  CreditCard,
  MapPin,
  Home,
  Building,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  ShoppingCart as ShoppingCartIcon,
  PlusCircle,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useRazorpay } from "@/hooks/use-razorpay";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { formatPrice } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

// Define delivery address form schema
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

// Define the Address type
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

// Define the Location type
interface Location {
  id: number;
  area: string;
  pincode: string;
  deliveryFee: number;
}

type CheckoutStep = "cart" | "delivery" | "payment" | "success";

const CartSidebar = ({ open, onClose }: CartSidebarProps) => {
  // Always start with cart step when component is opened
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
  
  // Add states for address management
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState<string>("");
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Get cart data from context
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

  // Use form hook for address data
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
  
  // Reset to cart view whenever the sidebar is opened
  useEffect(() => {
    if (open) {
      setCurrentStep("cart");
    }
  }, [open]);
  
  // Fetch addresses for the logged-in user
  useEffect(() => {
    if (user && open) {
      apiRequest("GET", "/api/addresses")
        .then((res) => res.json())
        .then((data) => {
          setAddresses(data);
          // Set default address if available
          const defaultAddress = data.find((addr: Address) => addr.isDefault);
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
          } else if (data.length > 0) {
            // If no default address, use the first one
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
  
  // Fetch delivery locations
  useEffect(() => {
    // Fetch locations from API
    apiRequest("GET", "/api/locations")
      .then((res) => res.json())
      .then((data) => {
        setLocations(data);
      })
      .catch((error) => {
        console.error("Error fetching locations:", error);
      });
  }, []);
  
  // Filter locations based on search
  useEffect(() => {
    if (locationSearch.trim()) {
      const filtered = locations.filter(
        (loc) =>
          loc.area.toLowerCase().includes(locationSearch.toLowerCase()) ||
          loc.pincode.includes(locationSearch)
      );
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations([]);
    }
  }, [locationSearch, locations]);
  
  // Handle new address form submission
  const handleAddressFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const addressData = {
      name: formData.get("addressName") as string,
      phone: formData.get("phone") as string,
      addressLine1: formData.get("addressLine1") as string,
      addressLine2: formData.get("addressLine2") as string || undefined,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      pincode: formData.get("pincode") as string,
      isDefault: Boolean(formData.get("isDefault"))
    };
    
    apiRequest("POST", "/api/addresses", addressData)
      .then((res) => res.json())
      .then((data) => {
        // Add the new address to the list
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
  
  // Handle selecting a location
  const selectLocation = (location: Location) => {
    setLocationSearch(location.area);
    // Optionally, you could populate a hidden field with the location ID
  };

  // Calculate cart total
  const calculateCartTotal = (): number => {
    return cartItems.reduce((total, item) => {
      const itemPrice =
        (item.meal?.price || 0) +
        ((item.meal as any)?.curryOption?.priceAdjustment || 0);
      return total + itemPrice * item.quantity;
    }, 0);
  };

  // Using imported formatPrice function from utils for consistent price formatting without decimals
  
  // Handle updating curry option for a cart item
  const handleUpdateCurryOption = async (updatedMeal: any) => {
    // Find the cart item that contains this meal
    const cartItem = cartItems.find(item => item.meal?.id === updatedMeal.id);
    
    if (cartItem) {
      try {
        // Update the cart item with the new curry option
        await updateCartItemWithOptions(cartItem.id, updatedMeal.curryOption);
        
        toast({
          title: "Item updated",
          description: `Your ${updatedMeal.name} has been updated with ${updatedMeal.curryOption.name}`,
        });
        
        // Close the curry options modal
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
  
  // Helper function to check if a meal is customizable with curry options
  const hasCurryOptions = (meal: any) => {
    if (!meal) return false;
    
    // Check several possible ways curry options might be stored:
    
    // 1. Direct curryOptions array
    if (meal.curryOptions && meal.curryOptions.length > 0) {
      return true;
    }
    
    // 2. Selected curry option (indicates the meal is customizable)
    if (meal.curryOption || meal.selectedCurry) {
      return true;
    }
    
    // 3. Check if meal name or category indicates curry
    const nameHasCurry = meal.name?.toLowerCase().includes('curry');
    const categoryHasCurry = meal.category?.toLowerCase().includes('curry');
    
    if (nameHasCurry || categoryHasCurry) {
      return true;
    }
    
    return false;
  };
  
  // Handle customizing an item
  const handleCustomizeItem = (item: any) => {
    // Set the customizing meal which will open the modal
    setCustomizingMeal(item.meal);
  };

  // Navigate through checkout steps
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
        // Get the selected address
        const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
        if (!selectedAddress) {
          throw new Error("Selected address not found");
        }
        
        // Construct the delivery details from the selected address
        const deliveryDetails = {
          name: selectedAddress.name,
          phoneNumber: selectedAddress.phone,
          completeAddress: selectedAddress.addressLine1,
          nearbyLandmark: selectedAddress.addressLine2 || "",
          zipCode: selectedAddress.pincode,
          addressType: selectedAddress.name.toLowerCase().includes("home") ? "home" : 
                      selectedAddress.name.toLowerCase().includes("work") ? "work" : "other",
          deliveryType,
        };
        
        // Format the address for the order
        const formattedAddress = `${selectedAddress.addressLine1}${selectedAddress.addressLine2 ? ', ' + selectedAddress.addressLine2 : ''}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`;
        
        // Calculate the total price including delivery and taxes
        const total = calculateCartTotal() + (deliveryType === "express" ? 40 : 0) + 20; // Cart total + delivery fee + taxes
        
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

        // Based on the selected payment method, process payment
        if (selectedPaymentMethod === "razorpay") {
          // Use the Razorpay hook to initiate payment directly
          initiatePayment({
            amount: total,
            orderId: orderData.id,
            description: "Food Order",
            name: "Aayuv Millet Foods",
            theme: { color: '#9E6D38' },
            onSuccess: async (response) => {
              // Update order status after successful payment
              await apiRequest('PATCH', `/api/orders/${orderData.id}`, {
                status: 'confirmed',
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature
              });
              
              // Clear cart items after successful payment
              await clearCart();
              
              toast({
                title: "Order Placed!",
                description: "Your order has been placed successfully. You can track your order in your profile.",
                variant: "default",
              });
              
              // Navigate to payment success page
              navigate(`/payment-success?orderId=${orderData.id}`);
              onClose();
            },
            onFailure: (error) => {
              toast({
                title: "Payment Failed",
                description: error.message || "Failed to process your payment. Please try again.",
                variant: "destructive",
              });
              
              // Stay on the cart page when payment fails or is cancelled
              // This allows the user to retry or change payment options
            }
          });
        } else {
          // COD or other payment method
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

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <SheetHeader className="p-3 sm:p-4 border-b">
            <div className="flex justify-between items-center">
              <SheetTitle className="text-lg sm:text-xl">
                Your Cart
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={onClose}
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Content based on current step */}
          <div className="flex-grow overflow-auto">
            {currentStep === "cart" && (
              <>
                {/* Cart Items */}
                <div className="flex-grow overflow-y-auto">
                  {cartItems.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 px-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4">
                        <ShoppingCartIcon className="w-full h-full" />
                      </div>
                      <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">Your cart is empty</p>
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
                      {/* Cart items */}
                      <div className="px-4 py-3">
                        {cartItems.map((item) => {
                          const isEditingNotes = editingItemId === item.id;

                          const handleEditNotes = () => {
                            setEditingItemId(isEditingNotes ? null : item.id);
                            setNoteText(item.notes || "");
                          };

                          const handleSaveNotes = () => {
                            updateCartItemNotes(item.id, noteText || null);
                            setEditingItemId(null);
                            toast({
                              title: "Notes saved",
                              description: noteText
                                ? "Your special instructions were saved"
                                : "Notes removed",
                            });
                          };

                          return (
                            <div
                              key={item.id}
                              className="flex items-start border-b py-2 sm:py-3"
                            >
                              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded overflow-hidden flex-shrink-0">
                                <img
                                  src={
                                    item.meal?.imageUrl ||
                                    "/placeholder-meal.jpg"
                                  }
                                  alt={item.meal?.name || "Meal item"}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-grow px-2 sm:px-3">
                                <h4 className="font-medium text-xs sm:text-sm line-clamp-1">
                                  {item.meal?.name}
                                </h4>
                                {/* Display curry option if available */}
                                {(item.meal as any)?.curryOption && (
                                  <p className="text-[10px] sm:text-xs text-gray-600">
                                    with{" "}
                                    {(item.meal as any).curryOption.name}
                                    {(item.meal as any).curryOption
                                      .priceAdjustment > 0 && (
                                      <span className="text-primary ml-1">
                                        (+
                                        {formatPrice(
                                          (item.meal as any).curryOption
                                            .priceAdjustment,
                                        )}
                                        )
                                      </span>
                                    )}
                                  </p>
                                )}
                                <div className="flex items-center mt-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-5 w-5 sm:h-6 sm:w-6 rounded-full"
                                    onClick={() => {
                                      if (item.quantity > 1) {
                                        updateCartItem(
                                          item.id,
                                          item.quantity - 1,
                                        );
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
                                    onClick={() =>
                                      updateCartItem(item.id, item.quantity + 1)
                                    }
                                  >
                                    <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  </Button>
                                  
                                  <div className="flex-grow"></div>
                                  
                                  <p className="text-primary text-xs sm:text-sm font-semibold">
                                    {formatPrice(
                                      ((item.meal?.price || 0) +
                                        ((item.meal as any)?.curryOption
                                          ?.priceAdjustment || 0)) *
                                        item.quantity,
                                    )}
                                  </p>
                                </div>
                                {/* Special instructions */}
                                <div className="mt-1.5 sm:mt-2">
                                  {isEditingNotes ? (
                                    <div className="space-y-1.5 sm:space-y-2">
                                      <Input
                                        value={noteText}
                                        onChange={(e) =>
                                          setNoteText(e.target.value)
                                        }
                                        placeholder="Add special instructions"
                                        className="h-7 sm:h-8 text-[10px] sm:text-xs"
                                      />
                                      <div className="flex justify-end gap-1.5 sm:gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 sm:h-7 text-[10px] sm:text-xs py-0.5 px-2"
                                          onClick={() => setEditingItemId(null)}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          variant="default"
                                          size="sm"
                                          className="h-6 sm:h-7 text-[10px] sm:text-xs py-0.5 px-2"
                                          onClick={handleSaveNotes}
                                        >
                                          Save
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex justify-between">
                                      <div
                                        className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-0.5 sm:gap-1 cursor-pointer hover:text-primary transition-colors"
                                        onClick={handleEditNotes}
                                      >
                                        <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                        {item.notes ? (
                                          <span className="line-clamp-1 max-w-[120px] sm:max-w-[180px]">{item.notes}</span>
                                        ) : (
                                          <span>Add instructions</span>
                                        )}
                                      </div>
                                      <div>
                                        {/* Only show Customize button if meal has curry options */}
                                        {hasCurryOptions(item.meal) && (
                                          <Button
                                            variant="link"
                                            size="sm"
                                            className="p-0 h-5 sm:h-6 text-[10px] sm:text-xs text-primary mr-1.5 sm:mr-2"
                                            onClick={() =>
                                              handleCustomizeItem(item)
                                            }
                                          >
                                            Customize
                                          </Button>
                                        )}
                                        <Button
                                          variant="link"
                                          size="sm"
                                          className="p-0 h-5 sm:h-6 text-[10px] sm:text-xs text-destructive"
                                          onClick={() => removeCartItem(item.id)}
                                        >
                                          Remove
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Bill Details Section */}
                      <div className="px-4 py-4 border-t">
                        <h3 className="font-medium text-base mb-3">Bill Details</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Items Total</span>
                            <span>{formatPrice(calculateCartTotal())}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Delivery Charge</span>
                            <span>{formatPrice(40)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Taxes</span>
                            <span>{formatPrice(20)}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between font-semibold">
                            <span>Grand Total</span>
                            <span className="text-primary">
                              {formatPrice(calculateCartTotal() + 40 + 20)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Cancellation Policy */}
                      <div className="px-3 sm:px-4 py-2 sm:py-3 border-t">
                        <h3 className="font-medium text-xs sm:text-sm mb-0.5 sm:mb-1">Cancellation Policy</h3>
                        <p className="text-[10px] sm:text-xs text-gray-600">
                          Orders can be cancelled before they are confirmed by the restaurant.
                          Once confirmed, refunds will be processed as per our policy.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {currentStep === "delivery" && (
              <div className="p-3 sm:p-4">
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-medium text-sm sm:text-base">Delivery Address</h3>
                  
                  {/* Display existing addresses */}
                  {addresses.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {addresses.map((address) => (
                        <div 
                          key={address.id}
                          className={`border rounded-md p-2 sm:p-3 cursor-pointer ${
                            selectedAddressId === address.id ? "border-primary bg-primary/5" : ""
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
                            {selectedAddressId === address.id && (
                              <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            )}
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
                  
                  {/* Address Modal */}
                  <NewAddressModal
                    addressModalOpen={addressModalOpen}
                    setAddressModalOpen={setAddressModalOpen}
                    locationSearch={locationSearch}
                    filteredLocations={filteredLocations}
                    handleAddressFormSubmit={handleAddressFormSubmit}
                    setLocationSearch={setLocationSearch}
                    selectLocation={selectLocation}
                  />
                  
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium text-sm mb-2">
                      Delivery Type
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={
                          deliveryType === "default" ? "default" : "outline"
                        }
                        className="flex-1"
                        onClick={() => setDeliveryType("default")}
                      >
                        Standard
                      </Button>
                      <Button
                        type="button"
                        variant={
                          deliveryType === "express" ? "default" : "outline"
                        }
                        className="flex-1"
                        onClick={() => setDeliveryType("express")}
                      >
                        Express (+₹40)
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 mt-4">
                    <p>
                      We currently deliver only in Hyderabad, within a 10km
                      radius of our service locations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === "payment" && (
              <div className="p-3 sm:p-4">
                <h3 className="font-medium text-sm sm:text-base mb-3 sm:mb-4">Choose Payment Method</h3>
                <RadioGroup
                  defaultValue={selectedPaymentMethod}
                  onValueChange={setSelectedPaymentMethod}
                >
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center space-x-1.5 sm:space-x-2 border p-2 sm:p-3 rounded-md">
                      <RadioGroupItem
                        value="razorpay"
                        id="razorpay"
                        checked={selectedPaymentMethod === "razorpay"}
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                      />
                      <Label htmlFor="razorpay" className="flex-grow text-xs sm:text-sm">
                        Razorpay (Credit/Debit Card, UPI, etc.)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 border p-2 sm:p-3 rounded-md">
                      <RadioGroupItem
                        value="cod"
                        id="cod"
                        checked={selectedPaymentMethod === "cod"}
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                      />
                      <Label htmlFor="cod" className="flex-grow text-xs sm:text-sm">
                        Cash on Delivery
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                <div className="mt-4 sm:mt-6">
                  <h3 className="font-medium text-sm sm:text-base mb-1.5 sm:mb-2">Order Summary</h3>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span>Item Total</span>
                      <span>{formatPrice(calculateCartTotal())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>{formatPrice(deliveryType === "express" ? 50 : 40)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes</span>
                      <span>{formatPrice(20)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 sm:pt-2 border-t font-medium">
                      <span>Total</span>
                      <span>
                        {formatPrice(
                          calculateCartTotal() +
                            (deliveryType === "express" ? 50 : 40) + 20
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === "success" && (
              <div className="p-4 text-center">
                <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">
                  Order Placed Successfully!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Your order #{orderId} has been placed successfully.
                </p>
                <div className="border p-4 rounded-md mb-6">
                  <h3 className="font-medium text-left mb-2">Order Details</h3>
                  <div className="text-sm text-left space-y-2">
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
                            (deliveryType === "express" ? 50 : 40) + 20
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <Button className="w-full mb-2" onClick={() => {
                  onClose();
                  setCurrentStep("cart");
                  navigate("/menu");
                }}>
                  Continue Shopping
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
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
                                (deliveryType === "express" ? 50 : 40) + 20
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
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
      <AuthModal isOpen={authModalOpen} onOpenChange={setAuthModalOpen} />
      
      {/* Curry Options Modal */}
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

export default CartSidebar;