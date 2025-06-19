import { Meal } from "@shared/schema";
import { atom } from "recoil";

type MealsQueryState = {
  data: Meal[];
  isLoading: boolean;
  error: Error | null;
};

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
