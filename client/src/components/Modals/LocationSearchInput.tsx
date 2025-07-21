import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

export const LocationSearchInput = ({
  locationSearch,
  setLocationSearch,
  suggestions,
  fetchSuggestions,
  handleSuggestionClick,
}: {
  locationSearch: string;
  setLocationSearch: (value: string) => void;
  suggestions: google.maps.places.AutocompletePrediction[];
  fetchSuggestions: (input: string) => void;
  handleSuggestionClick: (placeId: string, description: string) => void;
}) => (
  <div className="relative">
    <Search
      strokeWidth={3}
      className="absolute left-3 top-[75%] -translate-y-1/2 text-orange-500 w-5 h-5"
    />

    {locationSearch !== "" && (
      <X
        className="absolute right-3 top-[75%] -translate-y-1/2 cursor-pointer text-muted-foreground w-4 h-4"
        onClick={() => setLocationSearch("")}
      />
    )}

    <Input
      className="w-full pl-9 pr-9"
      placeholder="Search for your location"
      value={locationSearch}
      onChange={(e) => {
        const val = e.target.value;
        setLocationSearch(val);
        fetchSuggestions(val);
      }}
    />

    {locationSearch !== "" && suggestions.length > 0 && (
      <div className="absolute z-50 w-full bg-white shadow-md border rounded-md max-h-[200px] overflow-y-auto mt-1">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.place_id}
            className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
            onClick={() =>
              handleSuggestionClick(suggestion.place_id, suggestion.description)
            }
          >
            {suggestion.description}
          </div>
        ))}
      </div>
    )}
  </div>
);
