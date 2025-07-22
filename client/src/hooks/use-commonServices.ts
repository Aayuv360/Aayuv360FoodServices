import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
interface Review {
  id?: number;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  rating: number;
  submittedAt: any;
  status: string;
}
export interface Kitchen {
  id: number;
  area: string;
  pincode: string;
  deliveryFee: number;
  lnt: number;
  lng: number;
  serviceRadius: number;
  status?: string;
}

export const useKitchens = () => {
  return useQuery<Kitchen[]>({
    queryKey: ["/api/locations"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/locations");
      if (!res.ok) throw new Error("Failed to fetch kitchens");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const useReviews = () => {
  return useQuery<Review[]>({
    queryKey: ["contact-reviews"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/contact-review");
      if (!res.ok) {
        throw new Error("Failed to fetch reviews");
      }
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });
};

export async function updateDiscountAndDeliverySettings(settingsData: any) {
  try {
    const response = await apiRequest(
      "POST",
      "/api/DiscountAndDeliverySettings",
      settingsData,
    );

    return response;
  } catch (error) {
    console.error("Failed to update settings", error);
    throw error;
  }
}

export const useDiscountAndDeliverySettings = () => {
  return useQuery<any>({
    queryKey: ["DiscountAndDeliverySettings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/DiscountAndDeliverySettings");
      if (!res.ok) {
        throw new Error("Failed to fetch reviews");
      }
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });
};
