import { useQuery } from "@tanstack/react-query";
import { Meal } from "@shared/schema";

export const useMeals = () => {
  return useQuery<Meal[]>({
    queryKey: ["/api/meals"],
    queryFn: async () => {
      const response = await fetch("/api/meals");
      if (!response.ok) throw new Error("Failed to fetch meals");
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });
};
