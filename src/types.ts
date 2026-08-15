export type IngredientCategory =
  | 'specerijen' // Spices
  | 'vlees'       // Meat
  | 'vis'         // Fish
  | 'groente'     // Vegetables & fruits
  | 'zuivel'      // Dairy
  | 'granen'      // Grains & starches
  | 'olie/vet'    // Oils & fats
  | 'overig';     // Other

export type PurchaseUnit = 'kg' | 'g' | 'l' | 'ml' | 'stuk';
export type RecipeUnit = 'g' | 'ml' | 'stuk';

export interface PriceHistoryEntry {
  price: number;
  date: string; // ISO String
  note?: string;
}

export interface Ingredient {
  id?: string;
  tenantId: string;
  name: string;
  category: IngredientCategory;
  purchaseUnit: PurchaseUnit;
  purchasePrice: number; // in MAD
  recipeUnit: RecipeUnit;
  conversionFactor: number; // number of recipe units per 1 purchase unit
  supplier?: string;
  updatedAt: string; // ISO string
  priceHistory: PriceHistoryEntry[];
}

export interface Tenant {
  id: string;
  name: string;
  active: boolean;
  createdAt?: string;
  currency?: string; // default "MAD"
  description?: string;
  // Pricing module tenant-level settings
  targetFoodCostPercentage?: number; // default 30
  tvaPercentage?: number; // default 20
  deliveryCommissionPercentage?: number; // default 27 (Glovo)
}

export type SortField = 'name' | 'category' | 'purchasePrice' | 'unitCost' | 'updatedAt' | 'supplier';
export type RecipeSortField = 'name' | 'category' | 'portionSize' | 'currentMenuPrice' | 'cost' | 'ingredientsCount' | 'updatedAt';
export type PricingSortField =
  | 'name'
  | 'category'
  | 'portionCost'
  | 'recommendedPriceExclTva'
  | 'effectivePriceInclTva'
  | 'effectiveGlovoPrice'
  | 'actualFoodCostPercentage'
  | 'marginMAD';
export type EngineeringSortField =
  | 'name'
  | 'category'
  | 'salesVolume'
  | 'marginMAD'
  | 'classification'
  | 'revenueMAD';
export type SortOrder = 'asc' | 'desc';

export type RecipeCategory =
  | 'voorgerecht'  // Entrée / Starter
  | 'hoofdgerecht' // Plat principal / Main course
  | 'dessert'      // Dessert
  | 'drank'        // Boisson / Beverage
  | 'bijgerecht';   // Accompagnement / Side dish

export interface RecipeIngredientItem {
  ingredientId: string;
  quantity: number; // In the ingredient's recipeUnit (e.g. grams, ml, units)
  yieldPercent: number; // Yield / Rendement % (e.g. 100%, 90% if 10% trim loss)
}

export interface Recipe {
  id?: string;
  tenantId: string;
  name: string;
  category: RecipeCategory;
  portionSize: number; // e.g. 350
  portionUnit: string; // e.g. 'g', 'ml', 'portion', 'pièce'
  notes?: string; // Optional preparation notes
  recipeIngredients: RecipeIngredientItem[];
  currentMenuPrice?: number; // Current menu selling price in MAD (reference price from Indian Flavors menu)
  manualPriceOverride?: number; // Optional manual selling price override (incl. TVA in MAD)
  monthlySalesVolume?: number; // Monthly sales volume (Kasavana & Smith Menu Engineering)
  salesVolumeLastUpdated?: string; // ISO string timestamp of last update/import
  salesVolumeImportSource?: string; // e.g. "import" or "manual"
  createdAt?: string;
  updatedAt: string;
}

export interface CSVImportMapping {
  dishNameColumn: string;
  salesVolumeColumn: string;
}

export interface CSVRawRow {
  [columnName: string]: string | number;
}

export interface CSVDishMatch {
  rawDishName: string;
  volume: number;
  matchedRecipeId: string | null; // recipe id, or null if ignored / unmatched
  matchType: 'exact' | 'manual' | 'unmatched' | 'ignored';
}

export interface CalculatedRecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  category?: IngredientCategory;
  quantity: number;
  recipeUnit: RecipeUnit;
  yieldPercent: number;
  unitCost: number; // MAD / recipeUnit
  rawQuantity: number; // quantity / (yieldPercent / 100)
  totalCost: number; // rawQuantity * unitCost
  ingredientNotFound?: boolean;
}

export interface RecipeCostBreakdown {
  totalCost: number;
  costPerPortion: number;
  items: CalculatedRecipeIngredient[];
  hasMissingIngredients: boolean;
}

// Menu Engineering Classification (Kasavana & Smith Matrix)
export type MenuEngineeringQuadrant = 'STAR' | 'PLOWHORSE' | 'PUZZLE' | 'DOG';

export interface MenuEngineeringItem {
  recipe: Recipe;
  portionCost: number;
  effectivePriceInclTva: number;
  effectivePriceExclTva: number;
  marginMAD: number;
  salesVolume: number;
  revenueMAD: number; // effectivePriceExclTva * salesVolume
  totalGrossMarginMAD: number; // marginMAD * salesVolume
  // Category Benchmarks
  categoryVolumeThreshold: number; // Category average volume * 0.7
  categoryMarginThreshold: number; // Category average margin in MAD
  // Classification
  classification: MenuEngineeringQuadrant;
  recommendationKey: 'promote' | 'reprice' | 'visible' | 'remove';
  isAboveVolumeThreshold: boolean;
  isAboveMarginThreshold: boolean;
}

export type ActiveTab = 'ingredients' | 'recipes' | 'pricing' | 'engineering';

export type Language = 'fr' | 'en';
