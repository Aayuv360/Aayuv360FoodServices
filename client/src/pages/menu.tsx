import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MenuCard from "@/components/menu/MenuCard";
import NutritionModal from "@/components/menu/NutritionModal";
import { Meal } from "@shared/schema";
import { format } from "date-fns";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { useDebounce } from "use-debounce";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import { getCurrentISTDate } from "@/lib/timezone-utils";

const tabs = [
  { id: "all", name: "All Meals" },
  { id: "vegetarian", name: "Vegetarian" },
  { id: "gluten-free", name: "Gluten-Free" },
  { id: "high-protein", name: "High Protein" },
  { id: "Mixed Millet", name: "Mixed Millet" },
  { id: "Finger Millet", name: "Finger Millet" },
];

const Menu = () => {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const today = format(getCurrentISTDate(), "MMMM d, yyyy");
  const [nutritionModalOpen, setNutritionModalOpen] = useState(false);
  const [mealData, setMealData] = useState<any>();
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();

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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredMeals = useMemo(() => {
    if (!meals) return [];

    return meals
      .filter((meal) => {
        if (filter === "all") return true;
        const normalizedFilter = filter.toLowerCase();
        const matchesDietary = meal.dietaryPreferences?.some(
          (pref) => pref?.toLowerCase() === normalizedFilter,
        );
        const matchesCategory = meal.category
          ?.toLowerCase()
          .includes(normalizedFilter);
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
    <div
      id="menu-section"
      className="py-0 bg-neutral-light min-h-screen bg-gray-50"
    >
      <div className="container mx-auto">
        <div className="max-w-7xl mx-auto py-6">
          <div
            className={`${isMobile ? "top-14" : "top-16"} z-40 bg-gray-50 transition-shadow ${
              scrolled ? "shadow-sm border-b border-gray-200" : ""
            }`}
          >
            <div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
                    Discover Our Menu
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Enjoy our millet-powered meals for {today}
                  </p>
                </div>

                <form
                  className="flex-grow max-w-xl relative order-last md:order-none"
                  role="search"
                >
                  <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    aria-label="Search meals"
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

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`mt-4 ${
                  isMobile
                    ? "flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-1 -mx-1"
                    : "flex flex-wrap gap-2"
                }`}
              >
                {tabs.map((tab, index) => (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className={`snap-start shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
                      filter === tab.id
                        ? "bg-orange-500 text-white"
                        : "bg-white text-gray-700 hover:bg-orange-100"
                    }`}
                    onClick={() => setFilter(tab.id)}
                  >
                    {tab.name}
                  </motion.button>
                ))}
              </motion.div>
            </div>
          </div>

          <div className="pt-6">
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
              <div className="text-center py-12">
                <p className="text-destructive text-sm sm:text-base">
                  Error loading menu. Please try again later.
                </p>
              </div>
            ) : filteredMeals.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow p-6 sm:p-8">
                <h3 className="text-base sm:text-lg font-medium mb-2">
                  No meals found
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  No meals match your current filters. Try adjusting your search
                  or filters.
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

          {nutritionModalOpen && (
            <NutritionModal
              meal={mealData}
              open={nutritionModalOpen}
              onClose={() => setNutritionModalOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;
