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
          
          {/* Search and Filters */}
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
            
            {/* Filter Menu */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="rounded-full bg-white relative">
                  <SlidersHorizontal className="h-5 w-5 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Filter Menu</SheetTitle>
                  <SheetDescription>
                    Select filters to find the perfect meal for you
                  </SheetDescription>
                </SheetHeader>
                
                <div className="py-6 space-y-6">
                  {/* Meal Category Filter */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Millet Category</h3>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center">
                          <Button
                            variant={categoryFilter === category.id ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => setCategoryFilter(category.id)}
                          >
                            {category.name}
                            {categoryFilter === category.id && (
                              <Check className="ml-2 h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Dietary Preferences */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Dietary Preferences</h3>
                    <div className="space-y-2">
                      <Button
                        variant={filter === "all" ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setFilter("all")}
                      >
                        All Diets
                        {filter === "all" && <Check className="ml-2 h-4 w-4" />}
                      </Button>
                      <Button
                        variant={filter === "vegetarian" ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setFilter("vegetarian")}
                      >
                        Vegetarian
                        {filter === "vegetarian" && <Check className="ml-2 h-4 w-4" />}
                      </Button>
                      <Button
                        variant={filter === "gluten-free" ? "default" : "outline"}
                        className="w-full justify-start" 
                        onClick={() => setFilter("gluten-free")}
                      >
                        Gluten-Free
                        {filter === "gluten-free" && <Check className="ml-2 h-4 w-4" />}
                      </Button>
                      <Button
                        variant={filter === "high-protein" ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setFilter("high-protein")}
                      >
                        High Protein
                        {filter === "high-protein" && <Check className="ml-2 h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <SheetFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setFilter("all");
                      setCategoryFilter("all");
                      setSearchQuery("");
                      setIsFilterOpen(false);
                    }}
                  >
                    Reset Filters
                  </Button>
                  <SheetClose asChild>
                    <Button>Apply Filters</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {searchQuery && (
              <Badge variant="secondary" className="py-2 px-3">
                Search: {searchQuery}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-2 p-0" 
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {filter !== "all" && (
              <Badge variant="secondary" className="py-2 px-3">
                Diet: {filter}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-2 p-0" 
                  onClick={() => setFilter("all")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {categoryFilter !== "all" && (
              <Badge variant="secondary" className="py-2 px-3">
                Category: {categoryFilter}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-2 p-0" 
                  onClick={() => setCategoryFilter("all")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto text-sm" 
              onClick={() => {
                setFilter("all");
                setCategoryFilter("all");
                setSearchQuery("");
              }}
            >
              Clear All
            </Button>
          </div>
        )}

        {/* Menu Content */}
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
          <>
            {/* Category Pills (Quick Category Selection) */}
            <div className="mb-8 overflow-x-auto pb-2">
              <div className="flex gap-2">
                <FilterButton
                  active={categoryFilter === "all"}
                  onClick={() => setCategoryFilter("all")}
                >
                  All Categories
                </FilterButton>
                
                {categories.slice(1).map((category) => (
                  <FilterButton
                    key={category.id}
                    active={categoryFilter === category.id}
                    onClick={() => setCategoryFilter(category.id)}
                  >
                    {category.name}
                  </FilterButton>
                ))}
              </div>
            </div>
            
            {/* Tabbed View (when no filters applied) */}
            {categoryFilter === "all" && filter === "all" && !searchQuery ? (
              <Tabs defaultValue={categories[1].id} className="w-full">
                <TabsList className="mb-6 w-full justify-start overflow-auto">
                  {categories.slice(1).map((category) => (
                    <TabsTrigger key={category.id} value={category.id} className="px-4 py-2">
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {categories.slice(1).map((category) => {
                  const categoryMeals = getMealsByCategory()[category.id] || [];
                  
                  return (
                    <TabsContent key={category.id} value={category.id} className="mt-0">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">{category.name}</h2>
                        <Badge variant="outline">{categoryMeals.length} items</Badge>
                      </div>
                      
                      {categoryMeals.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">No meals in this category</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {categoryMeals.map((meal: any) => (
                            <MenuCard key={meal.id} meal={meal} />
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            ) : (
              /* Filtered View */
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">
                    {categoryFilter !== "all" ? categoryFilter : "All Meals"}
                  </h2>
                  <Badge variant="outline">{filteredMeals.length} items</Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredMeals.map((meal: any) => (
                    <MenuCard key={meal.id} meal={meal} />
                  ))}
                </div>
              </div>
            )}
          </>
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
