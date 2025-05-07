import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import MenuCard from "@/components/menu/MenuCard";
import { format } from "date-fns";
import { Meal } from "@shared/schema";

const TodaysMenu = () => {
  const [filter, setFilter] = useState("all");
  const today = format(new Date(), "MMMM d, yyyy");

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

  const displayedMeals = filteredMeals.slice(0, 6);

  return (
    <section id="menu" className="bg-neutral-light">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Today's Menu</h2>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">{today}</span>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-white"
            >
              <Calendar className="h-5 w-5 text-primary" />
            </Button>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <FilterButton
            active={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All Meals
          </FilterButton>
          <FilterButton
            active={filter === "breakfast"}
            onClick={() => setFilter("breakfast")}
          >
            Breakfast
          </FilterButton>
          <FilterButton
            active={filter === "lunch"}
            onClick={() => setFilter("lunch")}
          >
            Lunch
          </FilterButton>
          <FilterButton
            active={filter === "dinner"}
            onClick={() => setFilter("dinner")}
          >
            Dinner
          </FilterButton>
          <FilterButton
            active={filter === "vegetarian"}
            onClick={() => setFilter("vegetarian")}
          >
            Vegetarian
          </FilterButton>
          <FilterButton
            active={filter === "gluten-free"}
            onClick={() => setFilter("gluten-free")}
          >
            Gluten-Free
          </FilterButton>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedMeals.map((meal) => (
              <MenuCard key={meal.id} meal={meal} />
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Button
            asChild
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-white"
          >
            <Link href="/menu">
              View Full Menu
            </Link>
          </Button>
        </div>
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
