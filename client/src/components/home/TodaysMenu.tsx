import { useState } from "react";
import { getCurrentISTDate } from "@/lib/timezone-utils";
import { Calendar, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import MenuCard from "@/components/menu/MenuCard";
import { Meal } from "@shared/schema";
import NutritionModal from "../menu/NutritionModal";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";

const tabs = [
  { id: "all", name: "All Meals" },
  // { id: "breakfast", name: "Breakfast" },
  // { id: "lunch", name: "Lunch" },
  // { id: "dinner", name: "Dinner" },
  { id: "vegetarian", name: "Vegetarian" },
  { id: "gluten-free", name: "Gluten-Free" },
  { id: "high-protein", name: "High-protein" },
];
const TodaysMenu = () => {
  const [filter, setFilter] = useState("all");
  const [nutritionModalOpen, setNutritionModalOpen] = useState(false);
  const [mealData, setMealData] = useState<any>();
  const currentDate = getCurrentISTDate();
  const [searchQuery, setSearchQuery] = useState("");

  const formattedDate = currentDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const {
    data: meals,
    isLoading,
    error,
  } = useQuery<Meal[]>({
    queryKey: ["/api/meals"],
  });

  const displayedMeals = meals
    ? meals
        .filter((meal) => {
          if (filter === "all") return true;
          return meal.dietaryPreferences?.includes(filter as any);
        })
        .filter((meal) => {
          if (!searchQuery) return true;

          const query = searchQuery.toLowerCase();

          return (
            meal?.name?.toLowerCase()?.includes(query) ||
            meal?.description?.toLowerCase()?.includes(query) ||
            meal?.category?.toLowerCase()?.includes(query) ||
            meal?.price?.toString()?.includes(query) ||
            meal?.dietaryPreferences?.some((pref) =>
              pref?.toLowerCase()?.includes(query),
            )
          );
        })
    : [];
  return (
    <section id="menu" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-0">
            Today's Menu
          </h2>
          <form className="flex-grow max-w-xl relative order-last md:order-none my-2 md:my-0">
            <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              placeholder="Search meals..."
              className="w-full py-1.5 sm:py-2 pl-8 sm:pl-10 pr-8 sm:pr-10 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                }}
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </form>
          {/* <div className="flex items-center text-gray-600">
            <Calendar size={18} className="mr-2" />
            <span>{formattedDate}</span>
          </div> */}
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
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">
              Error loading menu. Please try again later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
            {displayedMeals.map((meal) => (
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
    </section>
  );
};

export default TodaysMenu;
