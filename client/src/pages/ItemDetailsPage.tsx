import React from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { MealCardActions } from "@/components/menu/MealCardActions";

export const ItemDetailsPage = () => {
  const [location] = useLocation();
  const id = location.split("/").pop();
  const {
    data: item,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["meal", id],
    queryFn: async () => {
      const res = await fetch(`/api/meals/${id}`);
      if (!res.ok) throw new Error("Failed to fetch meal");
      return res.json();
    },
    enabled: !!id,
  });
  const dietaryBadgeColor = (preference: string) => {
    switch (preference) {
      case "vegetarian":
        return "bg-green-100 text-green-800";
      case "gluten-free":
        return "bg-yellow-100 text-yellow-800";
      case "high-protein":
        return "bg-blue-100 text-blue-800";
      case "spicy":
        return "bg-red-100 text-red-800";
      case "low-carb":
        return "bg-purple-100 text-purple-800";
      case "vegan":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError)
    return <div className="p-6 text-red-500">Error loading meal.</div>;

  return (
    <div className="bg-neutral-light min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="max-w-7xl mx-auto px-5 py-6">
          <nav className="text-sm font-inter mb-6">
            <Button
              variant="link"
              onClick={() => window.history.back()}
              className="text-primary p-1"
            >
              Back
            </Button>
            <span className="text-gray-500 mx-1">/</span>
            <span className="text-gray-900">{item?.name}</span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <img
                src={item?.imageUrl}
                alt={item?.name}
                className="w-full h-auto rounded-lg object-cover shadow-lg border border-gray-200"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mt-3">
                <h2 className="text-4xl font-extrabold text-gray-900 font-inter mb-4">
                  {item?.name}
                </h2>

                <div className="flex flex-col space-y-1 ml-2">
                  <MealCardActions meal={item} />
                </div>
              </div>

              <p className="text-gray-700 text-lg font-inter mb-4 leading-relaxed">
                {item?.description}
              </p>
              <p className="text-3xl font-bold text-orange-500 font-inter mb-6">
                Price: ${item?.price?.toFixed(2)}
              </p>

              {/* Nutrition Facts */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 shadow-sm">
                <h4 className="text-xl font-bold text-gray-900 mb-3 font-inter">
                  Nutrition Facts (per serving)
                </h4>
                <ul className="text-gray-700 text-base grid grid-cols-2 gap-x-6 gap-y-2">
                  {item?.calories !== undefined && (
                    <li>
                      <strong className="text-gray-800">Calories:</strong>{" "}
                      {item.calories}
                    </li>
                  )}
                  {item?.protein !== undefined && (
                    <li>
                      <strong className="text-gray-800">Protein:</strong>{" "}
                      {item.protein}g
                    </li>
                  )}
                  {item?.carbs !== undefined && (
                    <li>
                      <strong className="text-gray-800">Carbs:</strong>{" "}
                      {item.carbs}g
                    </li>
                  )}
                  {item?.fat !== undefined && (
                    <li>
                      <strong className="text-gray-800">Fat:</strong> {item.fat}
                      g
                    </li>
                  )}
                  {item?.fiber !== undefined && (
                    <li>
                      <strong className="text-gray-800">Fiber:</strong>{" "}
                      {item.fiber}g
                    </li>
                  )}
                  {item?.sugar !== undefined && (
                    <li>
                      <strong className="text-gray-800">Sugar:</strong>{" "}
                      {item.sugar}g
                    </li>
                  )}
                </ul>
              </div>
              <div className="flex flex-wrap gap-1 mt-3 mb-4">
                {item?.dietaryPreferences?.map((pref: any, index: number) => (
                  <span
                    key={index}
                    className={`text-md px-2 py-0.5 rounded-full ${dietaryBadgeColor(pref)}`}
                  >
                    {pref}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
