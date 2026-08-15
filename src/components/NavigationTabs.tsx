import React from 'react';
import { ActiveTab, Language } from '../types';
import { translations } from '../lib/i18n';
import { Package, UtensilsCrossed, Calculator, LayoutGrid } from 'lucide-react';

interface NavigationTabsProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  ingredientsCount: number;
  recipesCount: number;
  language: Language;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onChangeTab,
  ingredientsCount,
  recipesCount,
  language,
}) => {
  const t = translations[language];

  return (
    <div className="w-full overflow-x-auto scrollbar-none pb-0.5">
      {/* Continuous Segmented Control Track */}
      <div className="inline-flex p-1 bg-slate-200/80 border border-slate-300/80 rounded-[8px] shadow-xs">
        
        {/* Ingredients Tab */}
        <button
          id="tab-ingredients-btn"
          type="button"
          onClick={() => onChangeTab('ingredients')}
          className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-[6px] transition-all whitespace-nowrap ${
            activeTab === 'ingredients'
              ? 'bg-[#0A1F44] text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-300/50'
          }`}
        >
          <Package
            className={`w-3.5 h-3.5 flex-shrink-0 ${
              activeTab === 'ingredients' ? 'text-emerald-400' : 'text-slate-500'
            }`}
          />
          <span>{t.tabIngredients}</span>
          <span
            className={`text-[11px] font-mono font-medium ${
              activeTab === 'ingredients' ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            ({ingredientsCount})
          </span>
        </button>

        {/* Recipes Tab */}
        <button
          id="tab-recipes-btn"
          type="button"
          onClick={() => onChangeTab('recipes')}
          className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-[6px] transition-all whitespace-nowrap ${
            activeTab === 'recipes'
              ? 'bg-[#0A1F44] text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-300/50'
          }`}
        >
          <UtensilsCrossed
            className={`w-3.5 h-3.5 flex-shrink-0 ${
              activeTab === 'recipes' ? 'text-emerald-400' : 'text-slate-500'
            }`}
          />
          <span>{t.tabRecipes}</span>
          <span
            className={`text-[11px] font-mono font-medium ${
              activeTab === 'recipes' ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            ({recipesCount})
          </span>
        </button>

        {/* Pricing & Margins Tab */}
        <button
          id="tab-pricing-btn"
          type="button"
          onClick={() => onChangeTab('pricing')}
          className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-[6px] transition-all whitespace-nowrap ${
            activeTab === 'pricing'
              ? 'bg-[#0A1F44] text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-300/50'
          }`}
        >
          <Calculator
            className={`w-3.5 h-3.5 flex-shrink-0 ${
              activeTab === 'pricing' ? 'text-emerald-400' : 'text-slate-500'
            }`}
          />
          <span>{t.tabPricing}</span>
          <span
            className={`text-[11px] font-mono font-medium ${
              activeTab === 'pricing' ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            ({recipesCount})
          </span>
        </button>

        {/* Menu Engineering Tab (Kasavana & Smith) */}
        <button
          id="tab-engineering-btn"
          type="button"
          onClick={() => onChangeTab('engineering')}
          className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-[6px] transition-all whitespace-nowrap ${
            activeTab === 'engineering'
              ? 'bg-[#0A1F44] text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-300/50'
          }`}
        >
          <LayoutGrid
            className={`w-3.5 h-3.5 flex-shrink-0 ${
              activeTab === 'engineering' ? 'text-emerald-400' : 'text-slate-500'
            }`}
          />
          <span>{t.tabEngineering}</span>
          <span
            className={`text-[11px] font-mono font-medium ${
              activeTab === 'engineering' ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            ({recipesCount})
          </span>
        </button>

      </div>
    </div>
  );
};

