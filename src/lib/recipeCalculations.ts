import {
  Ingredient,
  Recipe,
  RecipeIngredientItem,
  CalculatedRecipeIngredient,
  RecipeCostBreakdown,
  MenuEngineeringItem,
  MenuEngineeringQuadrant,
  RecipeCategory,
} from '../types';

/**
 * Calculates raw unit cost of an ingredient in its recipe unit (MAD / recipeUnit)
 */
export function getIngredientUnitCost(ingredient: Ingredient): number {
  if (!ingredient || !ingredient.conversionFactor || ingredient.conversionFactor <= 0) {
    return 0;
  }
  return ingredient.purchasePrice / ingredient.conversionFactor;
}

/**
 * Calculates line item cost for a recipe ingredient:
 * rawQuantity = quantity / (yieldPercent / 100)
 * totalCost = rawQuantity * unitCost
 */
export function calculateRecipeItemCost(
  item: RecipeIngredientItem,
  ingredient?: Ingredient
): CalculatedRecipeIngredient {
  if (!ingredient) {
    return {
      ingredientId: item.ingredientId,
      ingredientName: 'Ingrédient introuvable / Inconnu',
      quantity: item.quantity || 0,
      recipeUnit: 'g',
      yieldPercent: item.yieldPercent || 100,
      unitCost: 0,
      rawQuantity: item.quantity || 0,
      totalCost: 0,
      ingredientNotFound: true,
    };
  }

  const unitCost = getIngredientUnitCost(ingredient);
  const yieldRatio = (item.yieldPercent && item.yieldPercent > 0 ? item.yieldPercent : 100) / 100;
  const rawQuantity = (item.quantity || 0) / yieldRatio;
  const totalCost = rawQuantity * unitCost;

  return {
    ingredientId: ingredient.id || item.ingredientId,
    ingredientName: ingredient.name,
    category: ingredient.category,
    quantity: item.quantity || 0,
    recipeUnit: ingredient.recipeUnit,
    yieldPercent: item.yieldPercent || 100,
    unitCost,
    rawQuantity,
    totalCost,
    ingredientNotFound: false,
  };
}

/**
 * Calculates complete cost breakdown for a recipe based on the current ingredient prices
 */
export function calculateRecipeCostBreakdown(
  recipe: Recipe,
  ingredientsMap: Map<string, Ingredient>
): RecipeCostBreakdown {
  if (!recipe || !recipe.recipeIngredients || recipe.recipeIngredients.length === 0) {
    return {
      totalCost: 0,
      costPerPortion: 0,
      items: [],
      hasMissingIngredients: false,
    };
  }

  let totalCost = 0;
  let hasMissingIngredients = false;
  const items: CalculatedRecipeIngredient[] = [];

  for (const item of recipe.recipeIngredients) {
    const ingredient = ingredientsMap.get(item.ingredientId);
    if (!ingredient) {
      hasMissingIngredients = true;
    }
    const calculated = calculateRecipeItemCost(item, ingredient);
    totalCost += calculated.totalCost;
    items.push(calculated);
  }

  return {
    totalCost,
    costPerPortion: totalCost, // Standard portion cost for this recipe
    items,
    hasMissingIngredients,
  };
}

/**
 * Interface for complete Recipe Pricing & Margin Calculations
 */
export interface RecipePricingCalculation {
  recipeId?: string;
  recipeName: string;
  category: Recipe['category'];
  portionCost: number; // Raw cost per portion in MAD
  targetFoodCostPercentage: number; // e.g. 30
  tvaPercentage: number; // e.g. 20
  deliveryCommissionPercentage: number; // e.g. 27

  // Theoretical / Recommended Prices
  recommendedPriceExclTva: number; // portionCost / (targetFoodCostPercentage / 100)
  recommendedPriceInclTva: number; // recommendedPriceExclTva * (1 + tvaPercentage / 100)
  recommendedGlovoPrice: number;   // recommendedPriceInclTva / (1 - deliveryCommissionPercentage / 100)

  // Effective Prices (respecting manualPriceOverride if present and valid)
  isManualOverride: boolean;
  manualPriceOverride?: number; // In-house price incl. TVA
  effectivePriceInclTva: number;
  effectivePriceExclTva: number; // effectivePriceInclTva / (1 + tvaPercentage / 100)
  effectiveGlovoPrice: number;   // effectivePriceInclTva / (1 - deliveryCommissionPercentage / 100)

  // Margins & Actual Food Cost
  actualFoodCostPercentage: number; // (portionCost / effectivePriceExclTva) * 100
  foodCostDelta: number; // actualFoodCostPercentage - targetFoodCostPercentage
  foodCostStatus: 'target' | 'warning' | 'critical'; // <=2% = target (green), 2-5% = warning (yellow), >5% = critical (red)
  marginMAD: number; // effectivePriceExclTva - portionCost
  glovoNetRevenueExclCommission: number; // effectiveGlovoPrice * (1 - deliveryCommissionPercentage / 100)
  hasMissingIngredients: boolean;
}

/**
 * Calculates pricing for a recipe given tenant settings
 */
export function calculateRecipePricing(
  recipe: Recipe,
  ingredientsMap: Map<string, Ingredient>,
  targetFoodCostPercentage: number = 30,
  tvaPercentage: number = 20,
  deliveryCommissionPercentage: number = 27
): RecipePricingCalculation {
  const breakdown = calculateRecipeCostBreakdown(recipe, ingredientsMap);
  const portionCost = breakdown.costPerPortion;

  // Safe parameters
  const targetFC = targetFoodCostPercentage > 0 ? targetFoodCostPercentage : 30;
  const tva = tvaPercentage >= 0 ? tvaPercentage : 20;
  const deliveryComm = deliveryCommissionPercentage >= 0 && deliveryCommissionPercentage < 100
    ? deliveryCommissionPercentage
    : 27;

  // 1. Recommended price excl. TVA = portionCost / (targetFC / 100)
  const recommendedPriceExclTva = targetFC > 0 ? portionCost / (targetFC / 100) : 0;

  // 2. Recommended price incl. TVA = recommendedPriceExclTva * (1 + tva / 100)
  const recommendedPriceInclTva = recommendedPriceExclTva * (1 + tva / 100);

  // 3. Recommended Glovo price = recommendedPriceInclTva / (1 - deliveryComm / 100)
  const deliveryFactor = 1 - deliveryComm / 100;
  const recommendedGlovoPrice = deliveryFactor > 0 ? recommendedPriceInclTva / deliveryFactor : 0;

  // 4. Effective Price determination (Manual override is defined as final customer in-house price incl. TVA)
  const hasOverride = typeof recipe.manualPriceOverride === 'number' && recipe.manualPriceOverride > 0;
  const effectivePriceInclTva = hasOverride ? (recipe.manualPriceOverride as number) : recommendedPriceInclTva;
  const effectivePriceExclTva = (1 + tva / 100) > 0 ? effectivePriceInclTva / (1 + tva / 100) : 0;
  const effectiveGlovoPrice = deliveryFactor > 0 ? effectivePriceInclTva / deliveryFactor : 0;

  // 5. Actual Food Cost % = (portionCost / effectivePriceExclTva) * 100
  const actualFoodCostPercentage = effectivePriceExclTva > 0 ? (portionCost / effectivePriceExclTva) * 100 : 0;

  // 6. Delta from target
  const foodCostDelta = actualFoodCostPercentage - targetFC;
  const absDelta = Math.abs(foodCostDelta);

  let foodCostStatus: 'target' | 'warning' | 'critical' = 'target';
  if (portionCost > 0 && effectivePriceExclTva > 0) {
    if (absDelta <= 2) {
      foodCostStatus = 'target';
    } else if (absDelta <= 5) {
      foodCostStatus = 'warning';
    } else {
      foodCostStatus = 'critical';
    }
  }

  // 7. Margin in MAD = effectivePriceExclTva - portionCost
  const marginMAD = effectivePriceExclTva - portionCost;
  const glovoNetRevenueExclCommission = effectiveGlovoPrice * deliveryFactor;

  return {
    recipeId: recipe.id,
    recipeName: recipe.name,
    category: recipe.category,
    portionCost,
    targetFoodCostPercentage: targetFC,
    tvaPercentage: tva,
    deliveryCommissionPercentage: deliveryComm,
    recommendedPriceExclTva,
    recommendedPriceInclTva,
    recommendedGlovoPrice,
    isManualOverride: hasOverride,
    manualPriceOverride: recipe.manualPriceOverride,
    effectivePriceInclTva,
    effectivePriceExclTva,
    effectiveGlovoPrice,
    actualFoodCostPercentage,
    foodCostDelta,
    foodCostStatus,
    marginMAD,
    glovoNetRevenueExclCommission,
    hasMissingIngredients: breakdown.hasMissingIngredients,
  };
}

/**
 * Kasavana & Smith Menu Engineering Calculations
 * Evaluates recipes by category against popularity (sales volume) and profitability (margin in MAD).
 *
 * Thresholds per category:
 * - Popularity threshold = Category average sales volume * 0.7 (70% of fair share)
 * - Profitability threshold = Category average margin in MAD
 */
export function calculateMenuEngineering(
  recipes: Recipe[],
  ingredientsMap: Map<string, Ingredient>,
  targetFoodCostPercentage: number = 30,
  tvaPercentage: number = 20,
  deliveryCommissionPercentage: number = 27
): MenuEngineeringItem[] {
  // First calculate pricing and margin for all recipes
  const initialCalculations = recipes.map((recipe) => {
    const pricing = calculateRecipePricing(
      recipe,
      ingredientsMap,
      targetFoodCostPercentage,
      tvaPercentage,
      deliveryCommissionPercentage
    );
    const salesVolume = recipe.monthlySalesVolume || 0;
    const revenueMAD = pricing.effectivePriceExclTva * salesVolume;
    const totalGrossMarginMAD = pricing.marginMAD * salesVolume;

    return {
      recipe,
      portionCost: pricing.portionCost,
      effectivePriceInclTva: pricing.effectivePriceInclTva,
      effectivePriceExclTva: pricing.effectivePriceExclTva,
      marginMAD: pricing.marginMAD,
      salesVolume,
      revenueMAD,
      totalGrossMarginMAD,
    };
  });

  // Group items by category to compute Kasavana & Smith category benchmarks
  const categoryGroups = new Map<RecipeCategory, typeof initialCalculations>();
  for (const item of initialCalculations) {
    const cat = item.recipe.category;
    if (!categoryGroups.has(cat)) {
      categoryGroups.set(cat, []);
    }
    categoryGroups.get(cat)!.push(item);
  }

  // Calculate benchmarks per category
  const categoryBenchmarks = new Map<
    RecipeCategory,
    { volumeThreshold: number; marginThreshold: number }
  >();

  categoryGroups.forEach((items, cat) => {
    const count = items.length;
    if (count === 0) {
      categoryBenchmarks.set(cat, { volumeThreshold: 0, marginThreshold: 0 });
      return;
    }

    const totalVolume = items.reduce((sum, i) => sum + i.salesVolume, 0);
    const totalMargin = items.reduce((sum, i) => sum + i.marginMAD, 0);

    const avgVolume = totalVolume / count;
    const avgMargin = totalMargin / count;

    // Standard Kasavana threshold: 70% of fair share average volume
    const volumeThreshold = avgVolume * 0.7;
    const marginThreshold = avgMargin;

    categoryBenchmarks.set(cat, {
      volumeThreshold,
      marginThreshold,
    });
  });

  // Map each recipe to its Kasavana quadrant & recommendation
  return initialCalculations.map((item) => {
    const benchmarks = categoryBenchmarks.get(item.recipe.category) || {
      volumeThreshold: 0,
      marginThreshold: 0,
    };

    const isAboveVolumeThreshold = item.salesVolume >= benchmarks.volumeThreshold;
    const isAboveMarginThreshold = item.marginMAD >= benchmarks.marginThreshold;

    let classification: MenuEngineeringQuadrant;
    let recommendationKey: 'promote' | 'reprice' | 'visible' | 'remove';

    if (isAboveVolumeThreshold && isAboveMarginThreshold) {
      // STAR: High volume, High margin
      classification = 'STAR';
      recommendationKey = 'promote';
    } else if (isAboveVolumeThreshold && !isAboveMarginThreshold) {
      // PLOWHORSE: High volume, Low margin
      classification = 'PLOWHORSE';
      recommendationKey = 'reprice';
    } else if (!isAboveVolumeThreshold && isAboveMarginThreshold) {
      // PUZZLE: Low volume, High margin
      classification = 'PUZZLE';
      recommendationKey = 'visible';
    } else {
      // DOG: Low volume, Low margin
      classification = 'DOG';
      recommendationKey = 'remove';
    }

    return {
      recipe: item.recipe,
      portionCost: item.portionCost,
      effectivePriceInclTva: item.effectivePriceInclTva,
      effectivePriceExclTva: item.effectivePriceExclTva,
      marginMAD: item.marginMAD,
      salesVolume: item.salesVolume,
      revenueMAD: item.revenueMAD,
      totalGrossMarginMAD: item.totalGrossMarginMAD,
      categoryVolumeThreshold: benchmarks.volumeThreshold,
      categoryMarginThreshold: benchmarks.marginThreshold,
      classification,
      recommendationKey,
      isAboveVolumeThreshold,
      isAboveMarginThreshold,
    };
  });
}

/**
 * Format currency with 2 decimal precision
 */
export function formatMAD(amount: number, precision: number = 2): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0.00';
  return amount.toLocaleString('fr-FR', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}
