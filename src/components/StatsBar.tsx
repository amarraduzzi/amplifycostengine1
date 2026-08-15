import React from 'react';
import { Ingredient, Language } from '../types';
import { translations } from '../lib/i18n';
import { Layers, History, Hash, Coins } from 'lucide-react';

interface StatsBarProps {
  ingredients: Ingredient[];
  language: Language;
}

export const StatsBar: React.FC<StatsBarProps> = ({ ingredients, language }) => {
  const t = translations[language];

  const totalCount = ingredients.length;
  const categoriesCount = new Set(ingredients.map((i) => i.category)).size;
  const priceChangesCount = ingredients.reduce((acc, curr) => acc + (curr.priceHistory?.length || 0), 0);
  
  // Calculate average recipe unit cost
  const avgCost = totalCount > 0
    ? (ingredients.reduce((acc, curr) => acc + (curr.purchasePrice / (curr.conversionFactor || 1)), 0) / totalCount).toFixed(3)
    : '0.000';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      
      {/* Metric 1: Total Ingredients */}
      <div className="bg-white border border-slate-200/90 rounded-[8px] p-3.5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center space-x-1.5 text-slate-500">
          <Hash className="w-3.5 h-3.5 text-slate-400" />
          <p className="text-[11px] uppercase tracking-wider font-semibold">
            {t.totalIngredients}
          </p>
        </div>
        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900">
            {totalCount}
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            {language === 'fr' ? 'matières' : 'items'}
          </span>
        </div>
      </div>

      {/* Metric 2: Categories Count */}
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
          <span className="text-xs text-slate-400 font-mono">/ 8</span>
        </div>
      </div>

      {/* Metric 3: [PRIMARY HERO] Avg Cost per Recipe Unit */}
      <div className="bg-slate-50 border-2 border-[#0A1F44]/20 rounded-[8px] p-3.5 flex flex-col justify-between shadow-xs">
        <div className="flex items-center space-x-1.5 text-[#0A1F44]">
          <Coins className="w-3.5 h-3.5 text-emerald-600" />
          <p className="text-[11px] uppercase tracking-wider font-bold text-[#0A1F44]">
            {t.avgCostPerRecipeUnit}
          </p>
        </div>
        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="text-3xl font-extrabold font-mono tabular-nums tracking-tight text-[#0A1F44]">
            {avgCost}
          </span>
          <span className="text-xs font-mono font-semibold text-emerald-700">
            MAD
          </span>
        </div>
      </div>

      {/* Metric 4: Price History Changes */}
      <div className="bg-white border border-slate-200/90 rounded-[8px] p-3.5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center space-x-1.5 text-slate-500">
          <History className="w-3.5 h-3.5 text-slate-400" />
          <p className="text-[11px] uppercase tracking-wider font-semibold">
            {t.priceHistoryTitle}
          </p>
        </div>
        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900">
            {priceChangesCount}
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            {language === 'fr' ? 'ajustements' : 'updates'}
          </span>
        </div>
      </div>

    </div>
  );
};

