import React from 'react';
import { RecipePricingCalculation, formatMAD } from '../lib/recipeCalculations';
import { Language } from '../types';
import { translations } from '../lib/i18n';
import { Percent, CheckCircle2, AlertTriangle, AlertOctagon, TrendingUp } from 'lucide-react';

interface PricingStatsBarProps {
  pricingList: RecipePricingCalculation[];
  targetFoodCost: number;
  language: Language;
}

export const PricingStatsBar: React.FC<PricingStatsBarProps> = ({
  pricingList,
  targetFoodCost,
  language,
}) => {
  const t = translations[language];

  const totalRecipes = pricingList.length;

  // Average food cost percentage across menu
  const validFoodCosts = pricingList
    .filter((p) => p.portionCost > 0 && p.effectivePriceExclTva > 0)
    .map((p) => p.actualFoodCostPercentage);

  const avgFoodCost =
    validFoodCosts.length > 0
      ? validFoodCosts.reduce((a, b) => a + b, 0) / validFoodCosts.length
      : targetFoodCost;

  // Breakdown of dishes within target, warning, critical
  const withinTargetCount = pricingList.filter((p) => p.foodCostStatus === 'target').length;
  const warningCount = pricingList.filter((p) => p.foodCostStatus === 'warning').length;
  const criticalCount = pricingList.filter((p) => p.foodCostStatus === 'critical').length;

  // Average margin in MAD across menu
  const totalMargins = pricingList.reduce((acc, curr) => acc + (curr.marginMAD > 0 ? curr.marginMAD : 0), 0);
  const avgMargin = totalRecipes > 0 ? totalMargins / totalRecipes : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Metric 1: [PRIMARY HERO] Average Food Cost % vs Target */}
      <div className="bg-slate-50 border-2 border-[#0A1F44]/20 rounded-[8px] p-3.5 flex flex-col justify-between shadow-xs">
        <div className="flex items-center space-x-1.5 text-[#0A1F44]">
          <Percent className="w-3.5 h-3.5 text-emerald-600" />
          <p className="text-[11px] uppercase tracking-wider font-bold text-[#0A1F44]">
            {t.avgFoodCostRatio}
          </p>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold font-mono tabular-nums tracking-tight text-[#0A1F44]">
            {avgFoodCost.toFixed(1)}%
          </span>
          <span className="text-xs font-mono text-slate-500">
            (cible: {targetFoodCost}%)
          </span>
        </div>
      </div>

      {/* Metric 2: Dishes within Target (<= 2% deviation) */}
      <div className="bg-white border border-slate-200/90 rounded-[8px] p-3.5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center space-x-1.5 text-slate-500">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <p className="text-[11px] uppercase tracking-wider font-semibold">
            {t.dishesWithinTarget}
          </p>
        </div>
        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-mono tabular-nums tracking-tight text-emerald-700">
            {withinTargetCount}
          </span>
          <span className="text-xs font-mono text-slate-400">
            / {totalRecipes} {language === 'fr' ? 'plats' : 'dishes'}
          </span>
        </div>
      </div>

      {/* Metric 3: Deviation counts (Warning 2-5% & Critical > 5%) */}
      <div className="bg-white border border-slate-200/90 rounded-[8px] p-3.5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center space-x-1.5 text-slate-500">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <p className="text-[11px] uppercase tracking-wider font-semibold">
            {language === 'fr' ? 'Plats hors cible' : 'Dishes off target'}
          </p>
        </div>
        <div className="mt-2 flex items-center space-x-1.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[11px] font-mono font-medium bg-amber-50 text-amber-900 border border-amber-200">
            {warningCount} {language === 'fr' ? 'écart 2-5%' : 'warn'}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[11px] font-mono font-medium bg-rose-50 text-rose-900 border border-rose-200">
            {criticalCount} {language === 'fr' ? 'écart >5%' : 'crit'}
          </span>
        </div>
      </div>

      {/* Metric 4: Average Gross Margin per Dish */}
      <div className="bg-white border border-slate-200/90 rounded-[8px] p-3.5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center space-x-1.5 text-slate-500">
          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
          <p className="text-[11px] uppercase tracking-wider font-semibold">
            {t.totalMenuRevenuePotential}
          </p>
        </div>
        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900">
            {formatMAD(avgMargin)}
          </span>
          <span className="text-xs font-mono font-semibold text-slate-600">
            MAD
          </span>
        </div>
      </div>
    </div>
  );
};
