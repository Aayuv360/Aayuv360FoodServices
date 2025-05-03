import { useState, useEffect } from "react";
import { Calendar, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import MenuCard from "@/components/menu/MenuCard";
import { format } from "date-fns";
import { Meal } from "@shared/schema";

const Menu = () => {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const today = format(new Date(), "MMMM d, yyyy");

  // Fetch all meals
  const { data: meals, isLoading, error } = useQuery<Meal[]>({
    queryKey: ["/api/meals"],
  });

  // Filter meals based on selected filter and search query
  const filteredMeals = meals
    ? meals
        .filter((meal) => {
          // Filter by meal type or dietary preference
          if (filter === "all") return true;
          if (filter === "breakfast" || filter === "lunch" || filter === "dinner") {
            return meal.mealType === filter;
          }
          return meal.dietaryPreferences?.includes(filter as any);
        })
        .filter((meal) => {
          // Filter by search query
          if (!searchQuery) return true;
          return (
            meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            meal.description.toLowerCase().includes(searchQuery.toLowerCase())
          );
        })
    : [];

  return (
    <div className="py-12 bg-neutral-light min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Our Menu</h1>
            <p className="text-gray-600">
              Explore our delicious millet-based dishes for {today}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search meals..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="rounded-full bg-white">
              <Calendar className="h-5 w-5 text-primary" />
            </Button>
          </div>
        </div>

        {/* Menu Filters */}
        <div className="mb-8 flex flex-wrap gap-2">
          <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
            All Meals
          </FilterButton>
          <FilterButton
            active={filter === "breakfast"}
            onClick={() => setFilter("breakfast")}
          >
            Breakfast
          </FilterButton>
          <FilterButton active={filter === "lunch"} onClick={() => setFilter("lunch")}>
            Lunch
          </FilterButton>
          <FilterButton active={filter === "dinner"} onClick={() => setFilter("dinner")}>
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
          <FilterButton
            active={filter === "high-protein"}
            onClick={() => setFilter("high-protein")}
          >
            High Protein
          </FilterButton>
          <FilterButton active={filter === "spicy"} onClick={() => setFilter("spicy")}>
            Spicy
          </FilterButton>
        </div>

        {/* Menu Items Grid */}
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
        ) : filteredMeals.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow p-8">
            <h3 className="text-lg font-medium mb-2">No meals found</h3>
            <p className="text-gray-600">
              No meals match your current filters. Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMeals.map((meal) => (
              <MenuCard key={meal.id} meal={meal} />
            ))}
          </div>
        )}
      </div>
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

export default Menu;
