import React from 'react';
import { Recipe, Ingredient, Language } from '../types';
import { translations } from '../lib/i18n';
import { calculateRecipeCostBreakdown, formatMAD } from '../lib/recipeCalculations';
import { UtensilsCrossed, Layers, Coins, PieChart } from 'lucide-react';

interface RecipeStatsBarProps {
  recipes: Recipe[];
  ingredientsMap: Map<string, Ingredient>;
  language: Language;
}

export const RecipeStatsBar: React.FC<RecipeStatsBarProps> = ({
  recipes,
  ingredientsMap,
  language,
}) => {
  const t = translations[language];

  const totalCount = recipes.length;
  const categoriesCount = new Set(recipes.map((r) => r.category)).size;

  // Calculate costs across recipes
  const recipeCosts = recipes.map((r) => calculateRecipeCostBreakdown(r, ingredientsMap).totalCost);
  const totalCostSum = recipeCosts.reduce((acc, curr) => acc + curr, 0);
  const avgCostPerDish = totalCount > 0 ? totalCostSum / totalCount : 0;

  const totalIngredientsUsed = recipes.reduce(
    (acc, curr) => acc + (curr.recipeIngredients?.length || 0),
    0
  );
  const avgIngredientsPerDish = totalCount > 0 ? (totalIngredientsUsed / totalCount).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Metric 1: Total Recipes */}
      <div className="bg-white border border-slate-200/90 rounded-[8px] p-3.5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center space-x-1.5 text-slate-500">
          <UtensilsCrossed className="w-3.5 h-3.5 text-slate-400" />
          <p className="text-[11px] uppercase tracking-wider font-semibold">
            {t.totalRecipes}
          </p>
        </div>
        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900">
            {totalCount}
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            {language === 'fr' ? 'fiches' : 'dishes'}
          </span>
        </div>
      </div>

      {/* Metric 2: Categories Used */}
      <div className="bg-white border border-slate-200/90 rounded-[8px] p-3.5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center space-x-1.5 text-slate-500">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <p className="text-[11px] uppercase tracking-wider font-semibold">
            {t.categoriesCount}
          </p>
        </div>
        <div className="mt-2 flex items-baseline space-x-1">
          <span className="text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900">
            {categoriesCount}
          </span>
          <span className="text-xs text-slate-400 font-mono">/ 5</span>
        </div>
      </div>

      {/* Metric 3: [PRIMARY HERO] Avg Raw Cost per Dish */}
      <div className="bg-slate-50 border-2 border-[#0A1F44]/20 rounded-[8px] p-3.5 flex flex-col justify-between shadow-xs">
        <div className="flex items-center space-x-1.5 text-[#0A1F44]">
          <Coins className="w-3.5 h-3.5 text-emerald-600" />
          <p className="text-[11px] uppercase tracking-wider font-bold text-[#0A1F44]">
            {t.avgCostPerDish}
          </p>
        </div>
        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="text-3xl font-extrabold font-mono tabular-nums tracking-tight text-[#0A1F44]">
            {formatMAD(avgCostPerDish)}
          </span>
          <span className="text-xs font-mono font-semibold text-emerald-700">
            MAD
          </span>
        </div>
      </div>

      {/* Metric 4: Avg Ingredients per Dish */}
      <div className="bg-white border border-slate-200/90 rounded-[8px] p-3.5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center space-x-1.5 text-slate-500">
          <PieChart className="w-3.5 h-3.5 text-slate-400" />
          <p className="text-[11px] uppercase tracking-wider font-semibold">
            {t.ingredientsPerDishAvg}
          </p>
        </div>
        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900">
            {avgIngredientsPerDish}
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            {language === 'fr' ? 'ingr./plat' : 'items/dish'}
          </span>
        </div>
      </div>
    </div>
  );
};
