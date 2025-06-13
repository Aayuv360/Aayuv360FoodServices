import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import MenuCard from "@/components/menu/MenuCard";
import { format } from "date-fns";
import { Meal } from "@shared/schema";
import NutritionModal from "@/components/menu/NutritionModal";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { useDebounce } from "use-debounce";

const tabs = [
  { id: "all", name: "All Meals" },
  { id: "vegetarian", name: "Vegetarian" },
  { id: "gluten-free", name: "Gluten-Free" },
  { id: "high-protein", name: "High-protein" },
  { id: "Mixed Millet", name: "Mixed Millet" },
  { id: "Finger Millet", name: "Finger Millet" },
];

const Menu = () => {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const today = format(new Date(), "MMMM d, yyyy");
  const [nutritionModalOpen, setNutritionModalOpen] = useState(false);
  const [mealData, setMealData] = useState<any>();

  const {
    data: meals,
    isLoading,
    error,
  } = useQuery<Meal[]>({
    queryKey: ["/api/meals"],
    queryFn: async () => {
      const response = await fetch(`/api/meals`);
      if (!response.ok) throw new Error("Failed to fetch meals");
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  const filteredMeals = useMemo(() => {
    if (!meals) return [];

    return meals
      .filter((meal) => {
        if (filter === "all") return true;
        const matchesDietary = meal.dietaryPreferences?.includes(filter as any);
        const matchesCategory =
          meal.category?.toLowerCase() === filter.toLowerCase();
        return matchesDietary || matchesCategory;
      })
      .filter((meal) => {
        if (!debouncedSearch) return true;
        const query = debouncedSearch.toLowerCase();
        return (
          meal?.name?.toLowerCase()?.includes(query) ||
          meal?.description?.toLowerCase()?.includes(query) ||
          meal?.category?.toLowerCase()?.includes(query) ||
          meal?.price?.toString()?.includes(query) ||
          meal?.dietaryPreferences?.some((pref) =>
            pref?.toLowerCase()?.includes(query),
          )
        );
      });
  }, [meals, filter, debouncedSearch]);

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

          <form className="flex-grow max-w-xl relative order-last md:order-none my-2 md:my-0">
            <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meals..."
              className="w-full py-1.5 sm:py-2 pl-8 sm:pl-10 pr-8 sm:pr-10 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </form>
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
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-40 bg-white rounded-lg shadow animate-pulse"
              ></div>
            ))}
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
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
            {filteredMeals.map((meal) => (
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

      {/* Nutrition Modal */}
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

export default Menu;
