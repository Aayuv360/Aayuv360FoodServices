import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import MenuCard from "@/components/menu/MenuCard";
import { format } from "date-fns";
import { Meal } from "@shared/schema";
import { useLocation } from "wouter";
import NutritionModal from "@/components/menu/NutritionModal";

const tabs = [
  { id: "all", name: "All Meals" },
  // { id: "breakfast", name: "Breakfast" },
  // { id: "lunch", name: "Lunch" },
  // { id: "dinner", name: "Dinner" },
  { id: "vegetarian", name: "Vegetarian" },
  { id: "gluten-free", name: "Gluten-Free" },
  { id: "high-protein", name: "High-protein" },
];
const Menu = () => {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [location] = useLocation();
  const today = format(new Date(), "MMMM d, yyyy");
  const [nutritionModalOpen, setNutritionModalOpen] = useState(false);
  const [mealData, setMealData] = useState<any>();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    console.log(params);
    const searchParam = params.get("search");
    console.log(searchParam);

    if (searchParam) {
      setSearchQuery(searchParam);
    }

    const mealId = params.get("id");
    if (mealId) {
    }

    const filterParam = params.get("filter");
    if (filterParam) {
      setFilter(filterParam);
    }
  }, [location]);

  const {
    data: meals,
    isLoading,
    error,
  } = useQuery<Meal[]>({
    queryKey: ["/api/meals", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("query", searchQuery);
      }
      const response = await fetch(
        `/api/meals${params.toString() ? `?${params.toString()}` : ""}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch meals");
      }

      return response.json();
    },
  });

  const filteredMeals = meals
    ? meals
        .filter((meal) => {
          if (filter === "all") return true;
          if (
            filter === "breakfast" ||
            filter === "lunch" ||
            filter === "dinner"
          ) {
            return meal.mealType === filter;
          }
          return meal.dietaryPreferences?.includes(filter as any);
        })
        .filter((meal) => {
          if (!searchQuery) return true;
          return (
            meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            meal.description.toLowerCase().includes(searchQuery.toLowerCase())
          );
        })
    : [];

  return (
    <div className="py-8 sm:py-12 bg-neutral-light min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
              Our Menu
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Explore our delicious millet-based dishes for {today}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
                filter === tab.id
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-700 hover:bg-orange-100"
              }`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8 sm:py-12">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-destructive text-sm sm:text-base">
              Error loading menu. Please try again later.
            </p>
          </div>
        ) : filteredMeals.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-white rounded-lg shadow p-6 sm:p-8">
            <h3 className="text-base sm:text-lg font-medium mb-1.5 sm:mb-2">
              No meals found
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              No meals match your current filters. Try adjusting your search or
              filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
            {filteredMeals.map((meal: any) => (
              <MenuCard
                key={meal.id}
                meal={meal}
                setNutritionModalOpen={setNutritionModalOpen}
                setMealData={setMealData}
              />
            ))}
          </div>
        )}
      </div>
      {nutritionModalOpen && (
        <NutritionModal
          meal={mealData}
          open={nutritionModalOpen}
          onClose={() => setNutritionModalOpen(false)}
        />
      )}
    </div>
  );
};

interface FilterButtonProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

const FilterButton = ({ children, active, onClick }: FilterButtonProps) => (
  <Button
    variant={active ? "default" : "outline"}
    className={`rounded-full text-xs sm:text-sm h-auto py-1.5 sm:py-2 px-3 sm:px-4 ${
      active
        ? "bg-primary text-white"
        : "bg-white text-neutral-dark hover:bg-gray-100"
    }`}
    onClick={onClick}
  >
    {children}
  </Button>
);

export default Menu;
