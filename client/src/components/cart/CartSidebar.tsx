import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Minus,
  Plus,
  Check,
  ShoppingCart as ShoppingCartIcon,
  Trash2,
  Edit,
  Info,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useRazorpay } from "@/hooks/use-razorpay";
import { formatPrice } from "@/lib/utils";
import { AuthModal } from "@/components/auth/AuthModal";
import { NewAddressModal } from "@/components/Modals/NewAddressModal";
import { CurryOptionsModal } from "@/components/menu/CurryOptionsModal";
import { Meal } from "@shared/schema";
import { Address } from "./Address";
import DeleteAddressDialog from "../Modals/DeleteAddressDialog";
import { useLocationManager } from "@/hooks/use-location-manager";
import { Drawer } from "./Drawer";

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
  isDefault: boolean;
}

type CheckoutStep = "cart" | "delivery" | "payment" | "success";

const CartSidebar = ({ open, onClose }: CartSidebarProps) => {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("cart");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [deliveryType, setDeliveryType] = useState<string>("default");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [customizingMeal, setCustomizingMeal] = useState<any | null>(null);
  const [addressModalAction, setAddressModalAction] = useState<string>("");
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [deletingAddress, setDeletingAddress] = useState<any>(null);
  const [isPaymentInProgress, setIsPaymentInProgress] = useState(false);

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
  const navigate = useNavigate();
  const { initiatePayment } = useRazorpay();
  const { savedAddresses, selectAddress, deleteAddress, selectedAddress } =
    useLocationManager();
  const notSavedAddress = savedAddresses?.find(
    (item) => item.id === selectedAddress?.id,
  );

  const handleDeleteAddress = async (addressId: number) => {
    deleteAddress(addressId);
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
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!notSavedAddress) {
      toast({
        title: "Address required",
        description: "Please select an existing address or add a new one",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingOrder(true);

      if (!selectedAddress) {
        throw new Error("Selected address not found");
      }

      const total =
        calculateCartTotal() + (deliveryType === "express" ? 60 : 40) + 20;

      const orderIdRes = await apiRequest("POST", "/api/orders/generate-id");
      const { orderId } = await orderIdRes.json();

      if (!orderIdRes.ok) {
        toast({
          title: "Error",
          description: "Failed to generate order ID",
          variant: "destructive",
        });
        return;
      }

      const orderPayload = {
        items: cartItems.map((item) => ({
          mealId: item.mealId,
          quantity: item.quantity,
          notes: item.notes,
          curryOptionId: (item.meal as any)?.curryOption?.id,
          curryOptionName: (item.meal as any)?.curryOption?.name,
          curryOptionPrice: (item.meal as any)?.curryOption?.priceAdjustment,
        })),
        paymentMethod: "razorpay",
        totalPrice: total,
        deliveryAddressId: selectedAddress?.id,
      };

      setOrderId(orderId);
      setIsPaymentInProgress(true);

      initiatePayment({
        amount: total,
        orderId: orderId,
        description: "Food Order",
        name: "Aayuv Millet Foods",
        theme: { color: "#9E6D38" },
        onSuccess: async (response) => {
          setIsPaymentInProgress(false);

          try {
            const finalOrderPayload = {
              ...orderPayload,
              status: "confirmed",
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            };

            const res = await apiRequest(
              "POST",
              "/api/orders",
              finalOrderPayload,
            );

            if (!res.ok) {
              throw new Error("Failed to update order after payment");
            }

            await clearCart();

            toast({
              title: "Order Placed!",
              description:
                "Your order has been placed successfully. You can track your order in your profile.",
              variant: "default",
            });
            setCurrentStep("success");
            // navigate(`/profile?tab=orders`);
          } catch (error) {
            toast({
              title: "Order Update Failed",
              description:
                "Payment successful but order update failed. Please contact support.",
              variant: "destructive",
            });
          }
        },
        onFailure: (error) => {
          setIsPaymentInProgress(false);

          if (error.type === "user_cancelled") {
            toast({
              title: "Payment Cancelled",
              description: "You can try payment again from your cart.",
              variant: "default",
            });
            return;
          }

          toast({
            title: "Payment Failed",
            description:
              error.message ||
              "Failed to process your payment. Please try again.",
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep("cart");
  };
  const addressChange = () => {
    setCurrentStep("delivery");
  };
  const renderCartSummary = () => (
    <div className="flex flex-col max-h-[92.5vh]">
      <div className="flex-1 overflow-y-auto pl-4 pb-4">
        {cartItems.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
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
          <>
            <div>
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-4">
                  <div>
                    <img
                      src={item.meal?.imageUrl || "/placeholder-meal.jpg"}
                      alt={item.meal?.name || "Meal item"}
                      className="w-16 h-16 rounded-2xl object-cover shadow-md"
                    />
                  </div>
                  <div className="flex-grow px-2 sm:px-3">
                    <div className="font-semibold text-base">
                      {item.meal?.name}
                    </div>
                    {item?.meal?.selectedCurry && (
                      <p className="text-sm text-gray-600">
                        with {item.meal?.selectedCurry?.name}
                        {item.meal?.selectedCurry?.priceAdjustment > 0 && (
                          <span className="text-primary ml-1">
                            (+
                            {formatPrice(
                              item.meal?.curryOption?.priceAdjustment ||
                                item.meal?.selectedCurry?.priceAdjustment ||
                                item.curryOptionPrice ||
                                0,
                            )}
                            )
                          </span>
                        )}
                      </p>
                    )}
                    <p className="text-primary text-md font-extrabold">
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
              ))}
            </div>

            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-xl text-sm font-medium mb-4 flex items-center justify-center shadow-sm animate-bounce">
              🎉 You saved ₹25 on this order!
            </div>

            <div className="border-t border-orange-200 pt-4">
              <h3 className="font-bold mb-3 text-gray-800 text-lg">
                💰 Bill Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-700">
                  <span>Items Total</span>
                  <span>{formatPrice(calculateCartTotal())}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Delivery Charge</span>
                  <span>
                    {formatPrice(deliveryType === "express" ? 60 : 40)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Taxes</span>
                  <span>{formatPrice(20)}</span>
                </div>
                <div className="border-t border-dashed border-orange-300 pt-3 flex justify-between font-extrabold text-lg">
                  <span className="text-gray-900">Total</span>
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

            <div className="mt-6 bg-yellow-50 p-4 rounded-xl text-sm text-gray-700 flex items-start gap-3 shadow-inner border border-yellow-200">
              <Info size={18} className="text-orange-600 mt-0.5" />
              <p>
                Orders can be cancelled before confirmation. Once confirmed,
                refunds follow our refund policy.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="sticky bottom-0 bg-white px-4 py-2 border-t border-gray-200 z-10 shadow-md">
        {selectedAddress && notSavedAddress ? (
          <Address selectedAddress={selectedAddress} onEdit={addressChange} />
        ) : (
          <div className="flex justify-end w-full mb-4 mt-1">
            <Button
              variant="link"
              className="text-xs sm:text-sm flex items-center"
              onClick={addressChange}
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>Add Address</span>
            </Button>
          </div>
        )}

        <Button
          onClick={handleNextStep}
          className="w-full flex-1 text-xs sm:text-sm h-auto rounded-xl shadow-md"
          disabled={loading || isCreatingOrder || isPaymentInProgress}
        >
          {isCreatingOrder ? (
            <>Processing...</>
          ) : isPaymentInProgress ? (
            <>Payment in progress...</>
          ) : (
            <>
              💳 Pay{" "}
              {formatPrice(
                calculateCartTotal() +
                  (deliveryType === "express" ? 60 : 40) +
                  20,
              )}
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Drawer open={open} onClose={onClose} title="🛒 Your Cart">
        <div className="flex-grow overflow-auto">
          {currentStep === "cart" && renderCartSummary()}

          {currentStep === "delivery" && (
            <div className="flex flex-col h-full px-4">
              <div className="flex items-center justify-between mt-4">
                <div className="flex justify-between items-center">
                  <div
                    className="group flex items-center cursor-pointer hover:opacity-90 transition-opacity duration-200"
                    onClick={handlePreviousStep}
                  >
                    <ArrowLeft className="transition-transform duration-200 group-hover:-translate-x-1" />
                    <h2 className="font-bold text-lg ">Delivery Address</h2>
                  </div>
                </div>
                <Button
                  variant="link"
                  className="flex items-center h-auto py-1.5 sm:py-2 text-xs sm:text-sm"
                  onClick={() => {
                    setAddressModalOpen(true);
                    setAddressModalAction("addressAdd");
                  }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Address</span>
                </Button>
              </div>

              {savedAddresses.length > 0 ? (
                <div className="space-y-2 sm:space-y-3 mt-4">
                  {savedAddresses.map((address) => (
                    <div
                      key={address.id}
                      className={`border rounded-xl p-3 sm:p-4 cursor-pointer transition hover:shadow-sm ${
                        selectedAddress?.id === address.id
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                      onClick={() => selectAddress(address)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold   text-base sm:text-sm">
                            {address.label}
                          </div>
                          {address.isDefault && (
                            <span className="text-[10px] sm:text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Edit
                            className="h-4 w-4 text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAddress(address);
                              setAddressModalOpen(true);
                              setAddressModalAction("addressEdit");
                            }}
                          />
                          <Trash2
                            className="h-4 w-4 text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingAddress(address);
                            }}
                          />
                          {selectedAddress?.id === address.id && (
                            <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          )}
                        </div>
                      </div>

                      <div className="text-xs sm:text-sm text-gray-600 space-y-0.5">
                        <p className="line-clamp-1">{address.address}</p>

                        <p>Phone: {address.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 mt-4">
                  No saved addresses found
                </div>
              )}

              <NewAddressModal
                addressModalOpen={addressModalOpen}
                setAddressModalOpen={setAddressModalOpen}
                setEditingAddress={setEditingAddress}
                editingAddress={editingAddress}
                addressModalAction={addressModalAction}
              />

              <div className="text-xs sm:text-sm text-gray-500 mt-6 sm:mt-8">
                <p>
                  We currently deliver only in Hyderabad, within a 10km radius
                  of our service locations.
                </p>
              </div>
            </div>
          )}

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
                <h3 className="font-bold text-sm sm:text-base text-left mb-1.5 sm:mb-2">
                  Order Details
                </h3>
                <div className="text-xs sm:text-sm text-left space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between">
                    <span>Order Number</span>
                    <span>#{orderId}</span>
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
      </Drawer>

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
