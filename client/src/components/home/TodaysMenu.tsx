import { useState } from "react";
import { Link } from "wouter";
import { Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import MenuCard from "@/components/menu/MenuCard";
import { format } from "date-fns";
import { Meal } from "@shared/schema";
const tabs = [
  { id: "all", name: "All Meals" },
  { id: "breakfast", name: "Breakfast" },
  { id: "lunch", name: "Lunch" },
  { id: "dinner", name: "Dinner" },
  { id: "vegetarian", name: "Vegetarian" },
  { id: "gluten-free", name: "Gluten-Free" },
];
const TodaysMenu = () => {
  const [filter, setFilter] = useState("all");
  const currentDate = new Date();
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

  const filteredMeals = meals
    ? filter === "all"
      ? meals
      : meals.filter((meal) => {
          if (
            filter === "breakfast" ||
            filter === "lunch" ||
            filter === "dinner"
          ) {
            return meal.mealType === filter;
          }
          return meal.dietaryPreferences?.includes(filter as any);
        })
    : [];

  const displayedMeals = filteredMeals;

  return (
    <section id="menu" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-0">
            Today's Menu
          </h2>
          <div className="flex items-center text-gray-600">
            <Calendar size={18} className="mr-2" />
            <span>{formattedDate}</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayedMeals.map((meal) => (
              <MenuCard key={meal.id} meal={meal} />
            ))}
          </div>
        )}

        {/* <div className="text-center mt-8">
          <Button
            asChild
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-white"
          >
            <Link href="/menu">View Full Menu</Link>
          </Button>
        </div> */}
      </div>
    </section>
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
    className={`rounded-full text-sm ${
      active
        ? "bg-primary text-white"
        : "bg-white text-neutral-dark hover:bg-gray-100"
    }`}
    onClick={onClick}
  >
    {children}
  </Button>
);

export default TodaysMenu;
