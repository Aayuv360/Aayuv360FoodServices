import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
interface Charges {
  itemTotal: number;
  selectedLocationRange: number;
  data: {
    delivery: {
      baseFee: number;
      extraPerKm: number;
      peakCharge?: number;
      freeDeliveryThreshold: number;
      DeliveryFeeFreePercentage?: number;
      minDistance?: number;
    };
    discount: {
      flatDiscount: number;
      minOrderValue: number;
    };
    tax: {
      gstPercent: number;
      serviceTax: number;
    };
    fees: {
      smallOrderFee: number;
      packagingFee: number;
    };
  };
}
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(
  price: number | undefined,
  currency: string = "INR",
): string {
  if (price === undefined) return "₹0";

  const finalPrice = price;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(finalPrice);
}

export const calculateTotalPayable = ({
  itemTotal,
  selectedLocationRange,
  data,
}: Charges) => {
  const { delivery, discount, tax, fees } = data;

  let fullDeliveryFee;

  if (selectedLocationRange <= (delivery?.minDistance ?? 5)) {
    fullDeliveryFee = delivery.baseFee;
  } else {
    fullDeliveryFee =
      delivery.baseFee +
      (selectedLocationRange - (delivery?.minDistance ?? 5)) *
        delivery.extraPerKm;
  }

  let deliveryFee = fullDeliveryFee;
  let deliveryDiscount = 0;

  if (itemTotal > delivery.freeDeliveryThreshold) {
    const discountPercentage = delivery?.DeliveryFeeFreePercentage ?? 50;
    deliveryFee = fullDeliveryFee * (discountPercentage / 100);
    deliveryDiscount = fullDeliveryFee - deliveryFee;
  }

  const discountAmount =
    itemTotal >= discount.minOrderValue ? discount.flatDiscount : 0;

  const smallOrderFee =
    itemTotal < discount.minOrderValue ? fees.smallOrderFee : 0;
  const packagingFee = fees.packagingFee;

  const subTotal =
    itemTotal - discountAmount + deliveryFee + smallOrderFee + packagingFee;

  const gstAmount = (subTotal * tax.gstPercent) / 100;
  const serviceTaxAmount = (subTotal * tax.serviceTax) / 100;
  const totalTax = gstAmount + serviceTaxAmount;

  const toPay = subTotal + totalTax;

  return {
    toPay: toPay.toFixed(2),
    itemTotal: itemTotal.toFixed(2),
    gst: gstAmount.toFixed(2),
    serviceTax: serviceTaxAmount.toFixed(2),
    discount: discountAmount.toFixed(2),
    deliveryFee: deliveryFee.toFixed(2),
    deliveryDiscount:
      deliveryDiscount > 0 ? deliveryDiscount.toFixed(2) : undefined,
    smallOrderFee: smallOrderFee.toFixed(2),
    packagingFee: packagingFee.toFixed(2),
    taxesAndCharges: (
      deliveryFee +
      smallOrderFee +
      packagingFee +
      totalTax
    ).toFixed(2),
  };
};
