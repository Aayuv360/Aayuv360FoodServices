import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";

interface OrderSummaryModalProps {
  order: any;
  open: boolean;
  onClose: () => void;
}

const OrderSummaryModal = ({ order, open, onClose }: OrderSummaryModalProps) => {
  if (!open) return null;

  // Calculate subtotals and total
  const calculateSubtotal = (item: any) => {
    const basePrice = item.meal?.price || 0;
    const adjustedPrice = item.curryOptionPrice ? basePrice + item.curryOptionPrice : basePrice;
    return adjustedPrice * item.quantity;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-auto p-6 fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-medium">Order Summary</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Order header */}
        <div className="mb-6">
          <h4 className="font-bold text-2xl mb-2">Order #{order.id}</h4>
          <div className="text-sm text-gray-600">
            <p>Placed on {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}</p>
            <p className="mt-1">
              <span className={`px-2 py-0.5 rounded-full capitalize text-xs font-medium 
                ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 
                order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                'bg-gray-100 text-gray-800'}`}>
                {order.status}
              </span>
            </p>
          </div>
        </div>

        {/* Item details */}
        <div className="mb-6">
          <h5 className="font-medium mb-3 text-lg">Item Details</h5>
          <div className="space-y-3">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between bg-neutral-50 p-3 rounded-md">
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={item.meal?.imageUrl || "https://via.placeholder.com/64?text=Meal"}
                      alt={item.meal?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{item.meal?.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    {item.curryOptionName && (
                      <p className="text-sm text-gray-600">
                        Curry: {item.curryOptionName}
                        {item.curryOptionPrice > 0 && ` (+${formatPrice(item.curryOptionPrice)})`}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-sm text-gray-600">Notes: {item.notes}</p>
                    )}
                  </div>
                </div>
                <p className="font-medium">
                  {formatPrice(calculateSubtotal(item))}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Bill details */}
        <div className="mb-6">
          <h5 className="font-medium mb-3 text-lg">Bill Details</h5>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Item Total</span>
              <span>{formatPrice(order.totalPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Delivery Fee</span>
              <span>{formatPrice(order.deliveryFee || 0)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatPrice(order.totalPrice + (order.deliveryFee || 0) - (order.discount || 0))}</span>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Order details */}
        <div className="mb-6">
          <h5 className="font-medium mb-3 text-lg">Order Details</h5>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-medium w-32">Payment Method:</span>
              <span className="capitalize">{order.paymentMethod || 'Online payment'}</span>
            </div>
            {order.razorpayOrderId && (
              <div className="flex items-start gap-2">
                <span className="font-medium w-32">Transaction ID:</span>
                <span className="text-xs font-mono bg-gray-100 p-1 rounded">{order.razorpayOrderId}</span>
              </div>
            )}
            {order.deliveryAddress && (
              <div className="flex items-start gap-2">
                <span className="font-medium w-32">Delivery Address:</span>
                <span>{order.deliveryAddress}</span>
              </div>
            )}
            {order.deliveryTime && (
              <div className="flex items-start gap-2">
                <span className="font-medium w-32">Delivery Time:</span>
                <span>{format(new Date(order.deliveryTime), "MMMM d, yyyy 'at' h:mm a")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Support section */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-medium mb-2">Need Help?</h5>
          <p className="text-sm mb-3">If you have any questions about your order, please contact our support team.</p>
          <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderSummaryModal;