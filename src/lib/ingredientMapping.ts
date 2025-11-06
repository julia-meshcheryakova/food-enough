// Internal mapping between ingredient categories and specific ingredients
export const INGREDIENT_CATEGORIES: Record<string, string[]> = {
  // Meat categories
  meat: ["chicken", "turkey", "duck", "goose", "beef", "pork", "lamb", "veal", "venison"],
  poultry: ["chicken", "turkey", "duck", "goose", "quail"],
  "red meat": ["beef", "pork", "lamb", "veal", "venison"],
  
  // Seafood categories
  seafood: ["salmon", "tuna", "cod", "halibut", "trout", "shrimp", "crab", "lobster", "oysters", "mussels", "clams", "scallops"],
  fish: ["salmon", "tuna", "cod", "halibut", "trout", "bass", "tilapia", "sardines", "mackerel"],
  shellfish: ["shrimp", "crab", "lobster", "oysters", "mussels", "clams", "scallops"],
  
  // Dairy categories
  dairy: ["milk", "cheese", "yogurt", "butter", "cream", "ice cream", "sour cream", "greek yogurt", "cottage cheese"],
  
  // Animal products (using specific ingredients only)
  "animal products": ["chicken", "turkey", "beef", "pork", "lamb", "salmon", "tuna", "shrimp", "crab", "eggs", "milk", "cheese", "yogurt", "butter", "honey"],
  
  // Nuts and seeds
  nuts: ["peanuts", "almonds", "walnuts", "cashews", "pecans", "pistachios", "hazelnuts", "macadamia nuts"],
  seeds: ["sunflower seeds", "pumpkin seeds", "chia seeds", "flax seeds", "sesame seeds"],
  
  // Grains
  grains: ["wheat", "rice", "oats", "barley", "quinoa", "corn", "pasta", "bread"],
  "whole grains": ["brown rice", "quinoa", "oats", "whole wheat", "barley", "bulgur"],
  
  // Vegetables
  vegetables: ["leafy greens", "broccoli", "carrots", "tomatoes", "peppers", "onions", "garlic", "spinach", "kale", "lettuce"],
  "leafy greens": ["spinach", "kale", "lettuce", "arugula", "swiss chard", "collard greens"],
  
  // Fruits
  fruits: ["apples", "bananas", "oranges", "berries", "grapes", "melons"],
  berries: ["strawberries", "blueberries", "raspberries", "blackberries"],
  
  // Legumes
  legumes: ["beans", "lentils", "chickpeas", "peas", "soybeans", "tofu", "tempeh"],
};

// Expands categories to include all specific ingredients
export function expandIngredientCategories(ingredients: string[]): string[] {
  const expanded = new Set<string>();
  
  ingredients.forEach(ingredient => {
    const lowerIngredient = ingredient.toLowerCase();
    expanded.add(ingredient);
    
    // Check if this ingredient is a category and expand it
    if (INGREDIENT_CATEGORIES[lowerIngredient]) {
      INGREDIENT_CATEGORIES[lowerIngredient].forEach(specific => {
        expanded.add(specific);
      });
    }
  });
  
  return Array.from(expanded);
}

// Checks if an ingredient belongs to a category
export function ingredientMatchesCategory(ingredient: string, category: string): boolean {
  const lowerIngredient = ingredient.toLowerCase();
  const lowerCategory = category.toLowerCase();
  
  // Direct match
  if (lowerIngredient === lowerCategory) {
    return true;
  }
  
  // Check if category contains this ingredient
  if (INGREDIENT_CATEGORIES[lowerCategory]?.some(item => item.toLowerCase() === lowerIngredient)) {
    return true;
  }
  
  // Check if ingredient is a category that contains the category we're looking for
  if (INGREDIENT_CATEGORIES[lowerIngredient]?.some(item => item.toLowerCase() === lowerCategory)) {
    return true;
  }
  
  return false;
}

// Filters out ingredients that conflict with restrictions
export function filterConflictingIngredients(
  ingredients: string[],
  restrictions: string[]
): string[] {
  const expandedRestrictions = expandIngredientCategories(restrictions);
  
  return ingredients.filter(ingredient => {
    return !expandedRestrictions.some(restriction => 
      ingredientMatchesCategory(ingredient, restriction)
    );
  });
}
