import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Minus,
  Plus,
  Check,
  ShoppingCart as ShoppingCartIcon,
  Trash2,
  Edit,
  Info,
} from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useRazorpay } from "@/hooks/use-razorpay";
import { calculateTotalPayable, formatPrice } from "@/lib/utils";
import { AuthModal } from "@/components/auth/AuthModal";
import { NewAddressModal } from "@/components/Modals/NewAddressModal";
import { CurryOptionsModal } from "@/components/menu/CurryOptionsModal";
import { Meal } from "@shared/schema";
import { Address } from "./Address";
import DeleteAddressDialog from "../Modals/DeleteAddressDialog";
import { useLocationManager } from "@/hooks/use-location-manager";
import { Drawer } from "./Drawer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useDiscountAndDeliverySettings } from "@/hooks/use-commonServices";
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

type CheckoutStep = "cart" | "delivery";

const CartSidebar = ({ open, onClose }: CartSidebarProps) => {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("cart");
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
    data: discountCharges,
    isLoading,
    isError,
  } = useDiscountAndDeliverySettings();
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

  const calculateCartTotal = useMemo((): number => {
    let total = 0;

    for (const item of cartItems) {
      const itemPrice =
        (item?.meal?.price || 0) +
        (item?.meal?.selectedCurry?.priceAdjustment || 0);
      total += itemPrice * item.quantity;
    }

    return total;
  }, [cartItems]);

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

  const handleCustomizeItem = (item: any) => {
    if (!item.meal.curryOptions.length) {
      addMealDirectlyToCart(item.meal);
    } else {
      setCustomizingMeal(item.meal);
    }
  };
  const calculateMealPrice = useCallback((item: any): number => {
    const basePrice = item.meal?.price || 0;

    const curryAdjustment =
      (item.meal as any)?.curryOption?.priceAdjustment ??
      (item.meal as any)?.selectedCurry?.priceAdjustment ??
      item.curryOptionPrice ??
      0;

    return (basePrice + curryAdjustment) * item.quantity;
  }, []);
  const priceResult =
    !isLoading && discountCharges
      ? calculateTotalPayable({
          itemTotal: calculateCartTotal,
          selectedLocationRange: 5,
          data: discountCharges,
        })
      : null;

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
        calculateCartTotal + (deliveryType === "express" ? 60 : 40) + 20;

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

      setIsPaymentInProgress(true);
      initiatePayment({
        amount: total,
        orderId: orderId,
        description: "Food Order",
        name: "Aayuv Millet Foods",
        theme: { color: "#9E6D38" },
        onSuccess: async (response) => {
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
            setIsPaymentInProgress(false);

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
            onClose();
            setCurrentStep("cart");
          } catch (error) {
            setIsPaymentInProgress(false);

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
  const addMealDirectlyToCart = async (meal: any) => {
    try {
      const defaultCurryOption = {
        id: "regular",
        name: "Regular Curry",
        priceAdjustment: 0,
      };

      const mealWithDefaultCurry = {
        ...meal,
        curryOption: defaultCurryOption,
      };

      const existingItem = cartItems.find((item) => item.meal?.id === meal.id);

      if (existingItem) {
        await updateCartItem(existingItem.id, existingItem.quantity + 1);

        toast({
          title: "Quantity increased",
          description: `${meal.name} quantity increased`,
        });
      } else {
        await addToCart(mealWithDefaultCurry);

        toast({
          title: "Added to cart",
          description: `${meal.name} added to your cart`,
        });
      }
    } catch (error) {
      console.error("Error adding item to cart:", error);
      toast({
        title: "Error",
        description: "There was an error updating your cart. Please try again.",
        variant: "destructive",
      });
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
      <div className="flex-1 overflow-y-auto pb-4">
        {cartItems.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4">
              <ShoppingCartIcon className="w-full h-full" />
            </div>
            <p className="text-gray-500 mb-3 sm:mb-4 text-xs sm:text-sm">
              Your cart is empty
            </p>
            <Button
              onClick={() => {
                navigate("/");
                onClose();
              }}
              className="text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
            >
              Browse Menu
            </Button>
          </div>
        ) : (
          <>
            <div className="max-h-96 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-4">
                  <div>
                    <img
                      src={item.meal?.imageUrl || "/placeholder-meal.jpg"}
                      alt={item.meal?.name || "Meal item"}
                      className="w-16 h-16 rounded-2xl object-cover shadow-md"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="flex-grow px-2 sm:px-3">
                    <span className="text-sm sm:text-base font-bold text-gray-900">
                      {item.meal?.name}
                    </span>
                    {item?.meal?.selectedCurry && (
                      <p className="text-xs sm:text-sm text-gray-600">
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
                    <p className="text-sm sm:text-md text-primary font-extrabold">
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
                    {(item?.meal?.curryOptions?.length ?? 0) > 0 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-5 sm:h-6 font-semibold text-xs sm:text-sm text-primary"
                        onClick={() => handleCustomizeItem(item)}
                      >
                        Customize
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {(Number(priceResult?.discount) > 0 ||
              Number(priceResult?.deliveryDiscount) > 0) && (
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium mb-4 flex items-center justify-center shadow-sm animate-bounce">
                🎉 You saved ₹
                {Number(priceResult?.discount) +
                  Number(priceResult?.deliveryDiscount || 0)}{" "}
                on this order!
              </div>
            )}

            <Accordion
              type="single"
              collapsible
              className="border-t border-orange-200"
            >
              <AccordionItem value="bill-details">
                <AccordionTrigger className="px-4 pt-4">
                  <div>
                    <div className="flex gap-2 text-sm sm:text-base font-bold text-gray-900">
                      <span>💰 To pay</span>
                      <span className="text-primary">
                        ₹{priceResult?.toPay}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 pl-7">
                      Incl. all taxes & charges
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4">
                    <div className="px-4 space-y-2 text-xs sm:text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span>Items Total</span>
                        <span>₹{priceResult?.itemTotal}</span>
                      </div>

                      {priceResult?.discount !== "0.00" && (
                        <div className="flex justify-between text-green-700">
                          <span>Item Discount</span>
                          <span>- ₹{priceResult?.discount}</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span>Delivery Charge</span>
                        <span>₹{priceResult?.deliveryFee}</span>
                      </div>

                      {priceResult?.deliveryDiscount && (
                        <div className="flex justify-between text-green-700">
                          <span>Delivery Fee Discount</span>
                          <span>- ₹{priceResult?.deliveryDiscount}</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span>GST</span>
                        <span>₹{priceResult?.gst}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Tax</span>
                        <span>₹{priceResult?.serviceTax}</span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-orange-300 px-4 pt-2 mt-2 flex justify-between font-extrabold text-sm sm:text-base">
                      <span className="text-gray-900">To pay</span>
                      <span className="text-primary">
                        ₹{priceResult?.toPay}
                      </span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="mt-6 bg-yellow-50 p-4 mx-4 rounded-xl flex items-start gap-3 shadow-inner border border-yellow-200">
              <Info className="text-orange-600 mt-0.5 w-5 h-5" />
              <p className="text-xs text-gray-700">
                Please double-check your order and delivery details before
                placing it. Orders are non-refundable once confirmed.
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
                calculateCartTotal +
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
                    <ArrowLeft className="transition-transform duration-200 group-hover:-translate-x-1 w-4 h-4 sm:w-5 sm:h-5" />
                    <h2 className="font-bold text-sm sm:text-lg ml-1">
                      Delivery Address
                    </h2>
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
                  <Plus className="w-4 h-4 mr-1" />
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
                      onClick={() => {
                        selectAddress(address);
                        handlePreviousStep();
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-sm sm:text-base">
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
                          {/* {selectedAddress?.id === address.id && (
                            <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          )} */}
                        </div>
                      </div>

                      <div className="text-xs sm:text-sm text-gray-600 space-y-0.5 mt-1">
                        <p className="line-clamp-1">{address.address}</p>
                        <p>Phone: {address.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs sm:text-sm text-gray-500 mt-4">
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
