// App-level configuration settings

export const appConfig = {
  // Whether to use cached menu results for faster parsing
  // Set to false to always parse menus fresh with AI
  useCache: true,
};

// Comprehensive list of all possible dish categories
// These categories are extracted from menu during parsing
// Used for filtering but not shown in UI
export const DISH_CATEGORIES = [
  "starter",
  "appetizer",
  "main",
  "main course",
  "dessert",
  "beverage",
  "side",
  "soup",
  "salad",
  "dumplings",
  "noodles",
  "rice",
  "pasta",
  "pizza",
  "sandwich",
  "burger",
  "taco",
  "wrap",
  "sushi",
  "dim sum",
  "breakfast",
  "brunch",
  "snack",
  "other",
] as const;

export type DishCategory = typeof DISH_CATEGORIES[number];
