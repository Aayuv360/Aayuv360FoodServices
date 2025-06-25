import { Meal } from "@shared/schema";
import { atom, selector } from "recoil";

type MealsQueryState = {
  data: Meal[];
  isLoading: boolean;
  error: Error | null;
};

export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface SavedAddress {
  id: number;
  label: string;
  address: string;
  coords: LocationCoords;
  pincode?: string;
  isDefault?: boolean;
}

export interface LocationState {
  currentLocation: LocationCoords | null;
  selectedAddress: SavedAddress | null;
  isWithinServiceArea: boolean;
  distanceFromCurrent: number | null;
  serviceMessage: string;
  isLoading: boolean;
  error: string | null;
}

export const globalSearch = atom<string>({
  default: "",
  key: "globalSearch",
});

export const mealsQueryState = atom<MealsQueryState>({
  key: "mealsQueryState",
  default: {
    data: [],
    isLoading: false,
    error: null,
  },
});

export const mapLoadState = atom<boolean>({
  key: "mapLoadState",
  default: false,
});

// Location Management State
export const currentLocationState = atom<LocationCoords | null>({
  key: "currentLocationState",
  default: null,
});

export const selectedAddressState = atom<SavedAddress | null>({
  key: "selectedAddressState",
  default: null,
});

export const savedAddressesState = atom<SavedAddress[]>({
  key: "savedAddressesState",
  default: [],
});

export const locationLoadingState = atom<boolean>({
  key: "locationLoadingState",
  default: false,
});

export const locationErrorState = atom<string | null>({
  key: "locationErrorState",
  default: null,
});

export const serviceAreaState = atom<{
  isWithinServiceArea: boolean;
  distanceFromCurrent: number | null;
  serviceMessage: string;
}>({
  key: "serviceAreaState",
  default: {
    isWithinServiceArea: false,
    distanceFromCurrent: null,
    serviceMessage: "",
  },
});

// Computed state for the active location (either selected address or current location)
export const activeLocationState = selector<LocationCoords | null>({
  key: "activeLocationState",
  get: ({ get }) => {
    const selectedAddress = get(selectedAddressState);
    const currentLocation = get(currentLocationState);
    
    return selectedAddress?.coords || currentLocation;
  },
});

// Computed state for location display text
export const locationDisplayTextState = selector<string>({
  key: "locationDisplayTextState",
  get: ({ get }) => {
    const selectedAddress = get(selectedAddressState);
    
    if (selectedAddress) {
      return selectedAddress.address;
    }
    
    return "Select Location";
  },
});
