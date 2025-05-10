import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { z } from "zod";
import { useForm } from "react-hook-form";
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

type CheckoutStep = "cart" | "delivery" | "payment" | "success";

const CartSidebar = ({ open, onClose }: CartSidebarProps) => {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("cart");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("razorpay");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [deliveryType, setDeliveryType] = useState<string>("default");
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState<string>("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Get cart data from context
  const {
    cartItems,
    loading,
    updateCartItemNotes,
    updateCartItem,
    removeCartItem,
    clearCart,
  } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [navigate] = useLocation();

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

  // Calculate cart total
  const calculateCartTotal = (): number => {
    return cartItems.reduce((total, item) => {
      const itemPrice =
        (item.meal?.price || 0) +
        ((item.meal as any)?.curryOption?.priceAdjustment || 0);
      return total + itemPrice * item.quantity;
    }, 0);
  };

  // Format prices in rupees (without decimal)
  const formatPrice = (price: number): string => {
    return `₹${Math.round(price / 100)}`;
  };

  // Handle customizing an item
  const handleCustomizeItem = (item: any) => {
    navigate(`/menu?customizeItem=${item.mealId}`);
    onClose();
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
      const isValid = await form.trigger();
      if (!isValid) {
        toast({
          title: "Invalid address",
          description: "Please complete the delivery address form",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep("payment");
    } else if (currentStep === "payment") {
      try {
        setIsCreatingOrder(true);
        const formValues = form.getValues();
        const orderPayload = {
          items: cartItems.map((item) => ({
            mealId: item.mealId,
            quantity: item.quantity,
            notes: item.notes,
            curryOptionId: (item.meal as any)?.curryOption?.id,
            curryOptionName: (item.meal as any)?.curryOption?.name,
            curryOptionPrice: (item.meal as any)?.curryOption?.priceAdjustment,
          })),
          deliveryDetails: {
            ...formValues,
            deliveryType,
          },
          paymentMethod: selectedPaymentMethod,
        };

        const res = await apiRequest("POST", "/api/orders", orderPayload);
        const orderData = await res.json();
        setOrderId(orderData.id);

        // Based on the selected payment method, navigate to appropriate payment flow
        if (selectedPaymentMethod === "razorpay") {
          // Create payment intent for Razorpay
          const paymentRes = await apiRequest("POST", `/api/payments/create-order`, {
            amount: calculateCartTotal() + (deliveryType === "express" ? 4000 : 0) + 2000, // Add delivery fee and taxes
            orderId: orderData.id,
            notes: {
              orderType: "food",
            },
          });
          
          const paymentData = await paymentRes.json();
          
          // Navigate to the payment page with the order ID
          navigate(`/checkout?orderId=${orderData.id}&paymentId=${paymentData.id}`);
          onClose();
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
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-4 border-b">
            <div className="flex justify-between items-center">
              <SheetTitle>
                Your Cart
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
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
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto text-gray-300 mb-4">
                        <ShoppingCartIcon className="w-full h-full" />
                      </div>
                      <p className="text-gray-500 mb-4">Your cart is empty</p>
                      <Button
                        onClick={() => {
                          navigate("/menu");
                          onClose();
                        }}
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
                              className="flex items-start border-b py-3"
                            >
                              <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                                <img
                                  src={
                                    item.meal?.imageUrl ||
                                    "/placeholder-meal.jpg"
                                  }
                                  alt={item.meal?.name || "Meal item"}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-grow px-3">
                                <h4 className="font-medium text-sm">
                                  {item.meal?.name}
                                </h4>
                                {/* Display curry option if available */}
                                {(item.meal as any)?.curryOption && (
                                  <p className="text-xs text-gray-600">
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
                                    className="h-6 w-6 rounded-full"
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
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="mx-2 text-sm font-medium">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6 rounded-full"
                                    onClick={() =>
                                      updateCartItem(item.id, item.quantity + 1)
                                    }
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  
                                  <div className="flex-grow"></div>
                                  
                                  <p className="text-primary text-sm font-semibold">
                                    {formatPrice(
                                      ((item.meal?.price || 0) +
                                        ((item.meal as any)?.curryOption
                                          ?.priceAdjustment || 0)) *
                                        item.quantity,
                                    )}
                                  </p>
                                </div>
                                {/* Special instructions */}
                                <div className="mt-2">
                                  {isEditingNotes ? (
                                    <div className="space-y-2">
                                      <Input
                                        value={noteText}
                                        onChange={(e) =>
                                          setNoteText(e.target.value)
                                        }
                                        placeholder="Add special instructions"
                                        className="h-8 text-xs"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 text-xs"
                                          onClick={() => setEditingItemId(null)}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          variant="default"
                                          size="sm"
                                          className="h-7 text-xs"
                                          onClick={handleSaveNotes}
                                        >
                                          Save
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex justify-between">
                                      <div
                                        className="text-xs text-gray-500 flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                                        onClick={handleEditNotes}
                                      >
                                        <MessageSquare className="h-3 w-3" />
                                        {item.notes ? (
                                          <span>{item.notes}</span>
                                        ) : (
                                          <span>Add instructions</span>
                                        )}
                                      </div>
                                      <div>
                                        <Button
                                          variant="link"
                                          size="sm"
                                          className="p-0 h-6 text-xs text-primary mr-2"
                                          onClick={() =>
                                            handleCustomizeItem(item)
                                          }
                                        >
                                          Customize
                                        </Button>
                                        <Button
                                          variant="link"
                                          size="sm"
                                          className="p-0 h-6 text-xs text-destructive"
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
                            <span>{formatPrice(4000)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Taxes</span>
                            <span>{formatPrice(2000)}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between font-semibold">
                            <span>Grand Total</span>
                            <span className="text-primary">
                              {formatPrice(calculateCartTotal() + 4000 + 2000)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Cancellation Policy */}
                      <div className="px-4 py-3 border-t">
                        <h3 className="font-medium text-sm mb-1">Cancellation Policy</h3>
                        <p className="text-xs text-gray-600">
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
              <div className="p-4">
                <Form {...form}>
                  <form className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your phone number"
                              type="tel"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="addressType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Type</FormLabel>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={
                                field.value === "home" ? "default" : "outline"
                              }
                              className="flex items-center gap-1 flex-1"
                              onClick={() => field.onChange("home")}
                            >
                              <Home className="h-4 w-4" />
                              Home
                            </Button>
                            <Button
                              type="button"
                              variant={
                                field.value === "work" ? "default" : "outline"
                              }
                              className="flex items-center gap-1 flex-1"
                              onClick={() => field.onChange("work")}
                            >
                              <Building className="h-4 w-4" />
                              Work
                            </Button>
                            <Button
                              type="button"
                              variant={
                                field.value === "other" ? "default" : "outline"
                              }
                              className="flex items-center gap-1 flex-1"
                              onClick={() => field.onChange("other")}
                            >
                              <MapPin className="h-4 w-4" />
                              Other
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="completeAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complete Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="House/Flat No., Street, Locality"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nearbyLandmark"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nearby Landmark (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Any nearby landmark"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Zip Code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
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
                  </form>
                </Form>
              </div>
            )}

            {currentStep === "payment" && (
              <div className="p-4">
                <h3 className="font-medium mb-4">Choose Payment Method</h3>
                <RadioGroup
                  defaultValue={selectedPaymentMethod}
                  onValueChange={setSelectedPaymentMethod}
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 border p-3 rounded-md">
                      <RadioGroupItem
                        value="razorpay"
                        id="razorpay"
                        checked={selectedPaymentMethod === "razorpay"}
                      />
                      <Label htmlFor="razorpay" className="flex-grow">
                        Razorpay (Credit/Debit Card, UPI, etc.)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-md">
                      <RadioGroupItem
                        value="cod"
                        id="cod"
                        checked={selectedPaymentMethod === "cod"}
                      />
                      <Label htmlFor="cod" className="flex-grow">
                        Cash on Delivery
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                <div className="mt-6">
                  <h3 className="font-medium mb-2">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Item Total</span>
                      <span>{formatPrice(calculateCartTotal())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>{formatPrice(deliveryType === "express" ? 5000 : 4000)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes</span>
                      <span>{formatPrice(2000)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-medium">
                      <span>Total</span>
                      <span>
                        {formatPrice(
                          calculateCartTotal() +
                            (deliveryType === "express" ? 5000 : 4000) + 2000
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
                            (deliveryType === "express" ? 5000 : 4000) + 2000
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
                <div className="p-4">
                  <Button
                    onClick={handleNextStep}
                    className="w-full bg-primary text-white font-medium"
                    disabled={loading || cartItems.length === 0}
                  >
                    Proceed
                  </Button>
                </div>
              ) : (
                <div className="p-4 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                    className="flex-1"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    className="flex-1"
                    disabled={loading || isCreatingOrder}
                  >
                    {currentStep === "delivery" && "Continue to Payment"}
                    {currentStep === "payment" && (
                      <>
                        {isCreatingOrder ? (
                          <>Processing...</>
                        ) : (
                          <>
                            <CreditCard className="mr-1 h-4 w-4" />
                            Pay{" "}
                            {formatPrice(
                              calculateCartTotal() +
                                (deliveryType === "express" ? 5000 : 4000) + 2000
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
    </>
  );
};

export default CartSidebar;