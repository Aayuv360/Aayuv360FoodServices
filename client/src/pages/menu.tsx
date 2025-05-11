import { useState, useEffect } from "react";
import { Calendar, Loader2, Search, Filter, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import MenuCard from "@/components/menu/MenuCard";
import { format } from "date-fns";
import { Meal } from "@shared/schema";
import { useLocation } from "wouter";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Menu = () => {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [location] = useLocation();
  const today = format(new Date(), "MMMM d, yyyy");
  
  // Available millet categories
  const categories = [
    { id: "all", name: "All Categories" },
    { id: "Finger Millet", name: "Finger Millet" },
    { id: "Kodo Millet", name: "Kodo Millet" },
    { id: "Mixed Millet", name: "Mixed Millet" }
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get("search");
    if (searchParam) {
      setSearchQuery(searchParam);
    }

    const mealId = params.get("id");
    if (mealId) {
      console.log("Viewing meal ID:", mealId);
    }

    const filterParam = params.get("filter");
    if (filterParam) {
      setFilter(filterParam);
    }
    
    const categoryParam = params.get("category");
    if (categoryParam) {
      setCategoryFilter(categoryParam);
    }
    
    // Calculate active filters
    let count = 0;
    if (searchQuery) count++;
    if (filter !== "all") count++;
    if (categoryFilter !== "all") count++;
    setActiveFiltersCount(count);
  }, [location, filter, searchQuery, categoryFilter]);

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

  // Group meals by category for tabbed view
  const getMealsByCategory = () => {
    const mealsByCategory: Record<string, Meal[]> = {};
    
    if (!meals) return mealsByCategory;
    
    // Initialize categories
    categories.forEach(category => {
      if (category.id !== "all") {
        mealsByCategory[category.id] = [];
      }
    });
    
    // Add meals to their respective categories
    meals.forEach(meal => {
      if (meal.category && mealsByCategory[meal.category]) {
        mealsByCategory[meal.category].push(meal);
      }
    });
    
    return mealsByCategory;
  };
  
  // Apply all filters to meals
  const filteredMeals = meals
    ? meals
        .filter((meal) => {
          // Apply dietary preference filter
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
          // Apply category filter
          if (categoryFilter === "all") return true;
          return meal.category === categoryFilter;
        })
        .filter((meal) => {
          // Apply search query filter
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
          {/* <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
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
          </div> */}
        </div>

        {/* Menu Filters */}
        <div className="mb-8 flex flex-wrap gap-2">
          <FilterButton
            active={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All Meals
          </FilterButton>
          {/* <FilterButton
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
          </FilterButton> */}
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
          {/* <FilterButton active={filter === "spicy"} onClick={() => setFilter("spicy")}>
            Spicy
          </FilterButton> */}
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
              No meals match your current filters. Try adjusting your search or
              filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMeals.map((meal: any) => (
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
