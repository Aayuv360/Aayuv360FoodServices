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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { AuthModal } from "@/components/auth/AuthModal";

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
}

type CheckoutStep = "cart" | "delivery" | "payment" | "success";

const addressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().min(6, "Valid pincode is required"),
});

const paymentSchema = z.object({
  method: z.enum(["card", "upi", "cod"]),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
  upiId: z.string().optional(),
});

const userAddresses = [
  {
    id: 1,
    name: "Home",
    phone: "9876543210",
    address: "123 Millet Street, Apt 456",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500032",
  },
  {
    id: 2,
    name: "Office",
    phone: "9876543210",
    address: "789 Work Avenue, Floor 3",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500081",
  },
];

const CartSidebar = ({ open, onClose }: CartSidebarProps) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("cart");
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [addingNewAddress, setAddingNewAddress] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [_, navigate] = useLocation();
  const { cartItems, updateCartItem, removeCartItem, clearCart } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const addressForm = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "",
    },
  });

  const paymentForm = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      method: "cod",
    },
  });

  const paymentMethod = paymentForm.watch("method");

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.meal?.price || 0) * item.quantity,
    0,
  );
  const deliveryFee = 4000;
  const tax = 2000;
  const total = subtotal + deliveryFee + tax;

  const formatPrice = (price: number) => {
    return `₹${(price / 100).toFixed(2)}`;
  };

  const handleQuantityChange = async (id: number, quantity: number) => {
    if (quantity < 1) return;
    updateCartItem(id, quantity);
  };

  const handleRemoveItem = (id: number) => {
    removeCartItem(id);
  };

  const handleProceed = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Empty cart",
        description: "Your cart is empty. Add some items first.",
        variant: "destructive",
      });
      return;
    }

    setCurrentStep("delivery");
  };

  const handleProceedToPayment = () => {
    if (!selectedAddress && !addingNewAddress) {
      toast({
        title: "Select address",
        description: "Please select a delivery address or add a new one",
        variant: "destructive",
      });
      return;
    }

    if (addingNewAddress) {
      addressForm.handleSubmit(() => {
        setCurrentStep("payment");
      })();
      return;
    }

    setCurrentStep("payment");
  };

  const handleCheckout = () => {
    paymentForm.handleSubmit(async (paymentData) => {
      setLoading(true);

      try {
        toast({
          title: "Processing your order",
          description: "Please wait while we process your order...",
        });

        let deliveryAddress = "";
        if (selectedAddress) {
          const address = userAddresses.find((a) => a.id === selectedAddress);
          if (address) {
            deliveryAddress = `${address.name}, ${address.address}, ${address.city}, ${address.state} - ${address.pincode}, ${address.phone}`;
          }
        } else {
          const newAddress = addressForm.getValues();
          deliveryAddress = `${newAddress.name}, ${newAddress.address}, ${newAddress.city}, ${newAddress.state} - ${newAddress.pincode}, ${newAddress.phone}`;
        }

        const orderData = {
          userId: user?.id,
          totalPrice: total,
          deliveryAddress,
          deliveryTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: "confirmed",
        };

        const response = await apiRequest("POST", "/api/orders", orderData);
        const order = await response.json();

        await clearCart();

        setOrderComplete(true);
        setCurrentStep("success");
      } catch (error) {
        toast({
          title: "Failed to place order",
          description:
            "There was an error processing your order. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  };

  const resetCart = () => {
    setCurrentStep("cart");
    setSelectedAddress(null);
    setAddingNewAddress(false);
    setOrderComplete(false);
    addressForm.reset();
    paymentForm.reset();
  };

  const goBack = () => {
    if (currentStep === "delivery") {
      setCurrentStep("cart");
    } else if (currentStep === "payment") {
      setCurrentStep("delivery");
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetCart, 300);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleClose}
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-xl z-50 transform transition duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {currentStep !== "cart" && currentStep !== "success" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goBack}
                    className="mr-2"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                <h3 className="text-lg font-medium">
                  {currentStep === "cart" && "Your Cart"}
                  {currentStep === "delivery" && "Delivery Information"}
                  {currentStep === "payment" && "Payment Information"}
                  {currentStep === "success" && "Order Complete"}
                </h3>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {currentStep === "cart" && (
            <>
              {/* Cart Items */}
              <div className="flex-grow overflow-y-auto p-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto text-gray-300 mb-4">
                      <ShoppingCart />
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
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-4 bg-neutral-light p-3 rounded-lg"
                      >
                        <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                          <img
                            src={item.meal?.imageUrl || "/placeholder-meal.jpg"}
                            alt={item.meal?.name || "Meal item"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-medium text-sm">
                            {item.meal?.name}
                          </h4>
                          <p className="text-primary text-sm font-semibold">
                            {formatPrice(item.meal?.price || 0)}
                          </p>
                        </div>
                        <div className="flex items-center border rounded">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity - 1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-2 py-1">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-destructive"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Summary */}
              <div className="p-4 border-t">
                <h3 className="font-medium text-lg mb-3">Bill Details</h3>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items Total</span>
                    <span className="font-semibold">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Charge</span>
                    <span className="font-semibold">
                      {formatPrice(deliveryFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taxes</span>
                    <span className="font-semibold">{formatPrice(tax)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2"></div>
                  <div className="flex justify-between font-bold">
                    <span>Grand Total</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>
                </div>

                <div className="bg-neutral-light p-3 rounded-lg mb-6">
                  <h4 className="font-medium text-sm mb-1">
                    Cancellation Policy
                  </h4>
                  <p className="text-xs text-gray-600">
                    Orders can be cancelled before they are confirmed by the
                    restaurant. Once confirmed, refunds will be processed as per
                    our policy.
                  </p>
                </div>

                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={handleProceed}
                  disabled={cartItems.length === 0}
                >
                  {user ? "Proceed" : "Login & Proceed"}
                </Button>
              </div>
            </>
          )}

          {/* Delivery Information Step */}
          {currentStep === "delivery" && (
            <div className="flex-grow overflow-y-auto p-4">
              <div className="space-y-4">
                <h3 className="font-medium">Select Delivery Address</h3>

                {/* Saved addresses */}
                {userAddresses.map((address) => (
                  <div
                    key={address.id}
                    className={`p-4 border rounded-lg cursor-pointer ${
                      selectedAddress === address.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-gray-400"
                    }`}
                    onClick={() => {
                      setSelectedAddress(address.id);
                      setAddingNewAddress(false);
                    }}
                  >
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        {address.name === "Home" ? (
                          <Home className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Building className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="font-medium">{address.name}</span>
                      </div>
                      {selectedAddress === address.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {address.address}
                    </p>
                    <p className="text-sm text-gray-600">
                      {address.city}, {address.state} - {address.pincode}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {address.phone}
                    </p>
                  </div>
                ))}

                {/* Add new address option */}
                {!addingNewAddress ? (
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      setAddingNewAddress(true);
                      setSelectedAddress(null);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add New Address
                  </Button>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Add New Address</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...addressForm}>
                        <form className="space-y-4">
                          <FormField
                            control={addressForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Full Name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={addressForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="10-digit phone number"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={addressForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="House/Flat No., Street, Landmark"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={addressForm.control}
                              name="city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City</FormLabel>
                                  <FormControl>
                                    <Input placeholder="City" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={addressForm.control}
                              name="state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State</FormLabel>
                                  <FormControl>
                                    <Input placeholder="State" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={addressForm.control}
                            name="pincode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Pincode</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="6-digit pincode"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </form>
                      </Form>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setAddingNewAddress(false);
                          addressForm.reset();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={() => addressForm.trigger()}>
                        Save Address
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </div>

              <div className="pt-4 mt-6 border-t">
                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={handleProceedToPayment}
                >
                  Proceed
                </Button>
              </div>
            </div>
          )}

          {/* Payment Information Step */}
          {currentStep === "payment" && (
            <div className="flex-grow overflow-y-auto p-4">
              <Form {...paymentForm}>
                <form className="space-y-6">
                  <FormField
                    control={paymentForm.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Payment Method</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2 rounded-lg border p-3">
                              <RadioGroupItem value="card" id="card" />
                              <Label
                                htmlFor="card"
                                className="flex items-center"
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Credit/Debit Card
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 rounded-lg border p-3">
                              <RadioGroupItem value="upi" id="upi" />
                              <Label htmlFor="upi">UPI Payment</Label>
                            </div>
                            <div className="flex items-center space-x-2 rounded-lg border p-3">
                              <RadioGroupItem value="cod" id="cod" />
                              <Label htmlFor="cod">Cash on Delivery</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Card payment details */}
                  {paymentMethod === "card" && (
                    <div className="space-y-4">
                      <FormField
                        control={paymentForm.control}
                        name="cardNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Card Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="1234 5678 9012 3456"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={paymentForm.control}
                          name="cardExpiry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expiry (MM/YY)</FormLabel>
                              <FormControl>
                                <Input placeholder="MM/YY" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={paymentForm.control}
                          name="cardCvv"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CVV</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="123"
                                  type="password"
                                  maxLength={3}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* UPI Payment details */}
                  {paymentMethod === "upi" && (
                    <FormField
                      control={paymentForm.control}
                      name="upiId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UPI ID</FormLabel>
                          <FormControl>
                            <Input placeholder="username@upi" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Order summary */}
                  <div className="bg-neutral-light rounded-lg p-4">
                    <h3 className="font-medium mb-2">Order Summary</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Items ({cartItems.length})
                        </span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Charge</span>
                        <span>{formatPrice(deliveryFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Taxes</span>
                        <span>{formatPrice(tax)}</span>
                      </div>
                      <div className="border-t mt-2 pt-2"></div>
                      <div className="flex justify-between font-semibold">
                        <span>Total Amount</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                    </div>
                  </div>
                </form>
              </Form>

              <div className="pt-4 mt-6">
                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Proceed to Checkout"}
                </Button>
              </div>
            </div>
          )}

          {/* Success Step */}
          {currentStep === "success" && (
            <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                Order Placed Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Your millet meals will be delivered according to the schedule.
                Thank you for choosing Aayuv!
              </p>
              <div className="space-y-3 w-full">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigate("/");
                    handleClose();
                  }}
                >
                  Back to Home
                </Button>
                <Button
                  className="w-full"
                  onClick={() => {
                    navigate("/menu");
                    handleClose();
                  }}
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <AuthModal isOpen={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
};

// Fallback component for cart icon
const ShoppingCart = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    className="w-full h-full"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

export default CartSidebar;
