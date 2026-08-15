import React, { useState, useMemo } from 'react';
import {
  Recipe,
  RecipeCategory,
  Ingredient,
  PricingSortField,
  SortOrder,
  Language,
} from '../types';
import { translations, RECIPE_CATEGORY_COLORS } from '../lib/i18n';
import {
  calculateRecipePricing,
  RecipePricingCalculation,
  formatMAD,
} from '../lib/recipeCalculations';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit3,
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Info,
  DollarSign,
  UtensilsCrossed,
  RotateCcw,
} from 'lucide-react';

interface PricingTableProps {
  recipes: Recipe[];
  ingredientsMap: Map<string, Ingredient>;
  targetFoodCost: number;
  tvaPercentage: number;
  deliveryCommission: number;
  isLoading: boolean;
  onOpenOverrideModal: (recipe: Recipe, pricingCalc: RecipePricingCalculation) => void;
  onClearOverride: (recipeId: string) => Promise<void>;
  language: Language;
}

const RECIPE_CATEGORIES: RecipeCategory[] = [
  'voorgerecht',
  'hoofdgerecht',
  'dessert',
  'drank',
  'bijgerecht',
];

export const PricingTable: React.FC<PricingTableProps> = ({
  recipes,
  ingredientsMap,
  targetFoodCost,
  tvaPercentage,
  deliveryCommission,
  isLoading,
  onOpenOverrideModal,
  onClearOverride,
  language,
}) => {
  const t = translations[language];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<PricingSortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Calculate pricing for all recipes
  const pricingCalculations = useMemo(() => {
    return recipes.map((recipe) => ({
      recipe,
      calc: calculateRecipePricing(
        recipe,
        ingredientsMap,
        targetFoodCost,
        tvaPercentage,
        deliveryCommission
      ),
    }));
  }, [recipes, ingredientsMap, targetFoodCost, tvaPercentage, deliveryCommission]);

  // Filter & Sort
  const filteredAndSortedList = useMemo(() => {
    return pricingCalculations
      .filter(({ recipe }) => {
        const matchesCategory =
          selectedCategory === 'ALL' || recipe.category === selectedCategory;
        const matchesSearch =
          searchQuery.trim() === '' ||
          recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (recipe.notes && recipe.notes.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'name') {
          comp = a.recipe.name.localeCompare(b.recipe.name);
        } else if (sortField === 'category') {
          comp = a.recipe.category.localeCompare(b.recipe.category);
        } else if (sortField === 'portionCost') {
          comp = a.calc.portionCost - b.calc.portionCost;
        } else if (sortField === 'recommendedPriceExclTva') {
          comp = a.calc.recommendedPriceExclTva - b.calc.recommendedPriceExclTva;
        } else if (sortField === 'effectivePriceInclTva') {
          comp = a.calc.effectivePriceInclTva - b.calc.effectivePriceInclTva;
        } else if (sortField === 'effectiveGlovoPrice') {
          comp = a.calc.effectiveGlovoPrice - b.calc.effectiveGlovoPrice;
        } else if (sortField === 'actualFoodCostPercentage') {
          comp = a.calc.actualFoodCostPercentage - b.calc.actualFoodCostPercentage;
        } else if (sortField === 'marginMAD') {
          comp = a.calc.marginMAD - b.calc.marginMAD;
        }
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [pricingCalculations, searchQuery, selectedCategory, sortField, sortOrder]);

  const handleSort = (field: PricingSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: PricingSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 ml-1 inline-block" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-600 ml-1 inline-block" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-600 ml-1 inline-block" />
    );
  };

  // CSV Export for Menu Pricing Table
  const exportToCSV = () => {
    if (pricingCalculations.length === 0) return;

    const headers = [
      'Nom du Plat / Recipe',
      'Catégorie',
      'Coût Matière Portion (MAD)',
      'Prix Recommandé HT (MAD)',
      'Prix Recommandé TTC (MAD)',
      'Prix Carte TTC (MAD)',
      'Prix Glovo Compensé (MAD)',
      'Food Cost Réel %',
      'Cible Food Cost %',
      'Statut Ecart',
      'Marge Brute HT (MAD)',
      'Type de Prix',
    ];

    const rows = pricingCalculations.map(({ recipe, calc }) => {
      const catLabel = t.recipeCategories[recipe.category] || recipe.category;
      return [
        `"${recipe.name.replace(/"/g, '""')}"`,
        `"${catLabel}"`,
        calc.portionCost.toFixed(2),
        calc.recommendedPriceExclTva.toFixed(2),
        calc.recommendedPriceInclTva.toFixed(2),
        calc.effectivePriceInclTva.toFixed(2),
        calc.effectiveGlovoPrice.toFixed(2),
        calc.actualFoodCostPercentage.toFixed(1) + '%',
        calc.targetFoodCostPercentage + '%',
        calc.foodCostStatus,
        calc.marginMAD.toFixed(2),
        calc.isManualOverride ? 'Manuel' : 'Auto Target',
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `amplify_menu_pricing_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[8px] shadow-xs overflow-hidden flex flex-col">
      {/* Controls Header: Category Filter Pills, Search Bar & CSV Export */}
      <div className="p-3 sm:p-4 border-b border-slate-200 bg-white space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              id="filter-cat-all-pricing-btn"
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-2.5 py-1 rounded-[5px] text-xs font-semibold whitespace-nowrap transition-colors border ${
                selectedCategory === 'ALL'
                  ? 'bg-[#0A1F44] text-white border-[#0A1F44] shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {t.allCategories} ({recipes.length})
            </button>
            {RECIPE_CATEGORIES.map((cat) => {
              const count = recipes.filter((r) => r.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  id={`filter-cat-${cat}-pricing-btn`}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-[5px] text-xs font-semibold whitespace-nowrap transition-colors border ${
                    isSelected
                      ? 'bg-[#0A1F44] text-white border-[#0A1F44] shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {t.recipeCategories[cat]} ({count})
                </button>
              );
            })}
          </div>

          {/* Export CSV button */}
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              id="export-pricing-csv-btn"
              type="button"
              onClick={exportToCSV}
              disabled={recipes.length === 0}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-[6px] transition-colors shadow-2xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.exportCSV}</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Glovo info tip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-0.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="pricing-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPricingPlaceholder}
              className="w-full pl-9 pr-4 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-[6px] focus:bg-white focus:ring-1 focus:ring-[#0A1F44] focus:border-[#0A1F44] outline-none transition-all"
            />
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-500 bg-amber-50/70 border border-amber-200/80 px-2.5 py-1.5 rounded-[6px]">
            <Info className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
            <span className="text-[11px] font-mono text-amber-900">
              {t.glovoExplanationTitle} : +{deliveryCommission}% compensé
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-mono uppercase tracking-wider text-slate-600 select-none">
              {/* Dish Name */}
              <th
                onClick={() => handleSort('name')}
                className="py-2.5 px-3.5 font-semibold cursor-pointer hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center">
                  <span>{t.colDishName}</span>
                  {renderSortIcon('name')}
                </div>
              </th>

              {/* Portion Cost (MAD) */}
              <th
                onClick={() => handleSort('portionCost')}
                className="py-2.5 px-3.5 font-semibold text-right cursor-pointer hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center justify-end">
                  <span>{t.colPortionCost}</span>
                  {renderSortIcon('portionCost')}
                </div>
              </th>

              {/* Recommended Excl. VAT (HT) */}
              <th
                onClick={() => handleSort('recommendedPriceExclTva')}
                className="py-2.5 px-3.5 font-semibold text-right cursor-pointer hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center justify-end">
                  <span>{t.colRecommendedExclTva}</span>
                  {renderSortIcon('recommendedPriceExclTva')}
                </div>
              </th>

              {/* In-House Menu Price (Incl. VAT) */}
              <th
                onClick={() => handleSort('effectivePriceInclTva')}
                className="py-2.5 px-3.5 font-semibold text-right cursor-pointer hover:text-slate-900 transition-colors bg-slate-100/70"
              >
                <div className="flex items-center justify-end">
                  <span className="text-[#0A1F44]">{t.colEffectivePriceInclTva}</span>
                  {renderSortIcon('effectivePriceInclTva')}
                </div>
              </th>

              {/* Glovo Price (Compensated) */}
              <th
                onClick={() => handleSort('effectiveGlovoPrice')}
                className="py-2.5 px-3.5 font-semibold text-right cursor-pointer hover:text-slate-900 transition-colors bg-amber-50/40"
              >
                <div className="flex items-center justify-end text-amber-900">
                  <span>{t.colGlovoPrice}</span>
                  {renderSortIcon('effectiveGlovoPrice')}
                </div>
              </th>

              {/* Actual Food Cost % with Status Color */}
              <th
                onClick={() => handleSort('actualFoodCostPercentage')}
                className="py-2.5 px-3.5 font-semibold text-center cursor-pointer hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center justify-center">
                  <span>{t.colActualFoodCost}</span>
                  {renderSortIcon('actualFoodCostPercentage')}
                </div>
              </th>

              {/* Gross Margin MAD (Excl. VAT) */}
              <th
                onClick={() => handleSort('marginMAD')}
                className="py-2.5 px-3.5 font-semibold text-right cursor-pointer hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center justify-end">
                  <span>{t.colMarginMAD}</span>
                  {renderSortIcon('marginMAD')}
                </div>
              </th>

              {/* Actions: Price Override */}
              <th className="py-2.5 px-3.5 font-semibold text-center">
                <span>{t.colPriceAction}</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-mono">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-100" />
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-200" />
                    <span className="ml-2">{t.loading}</span>
                  </div>
                </td>
              </tr>
            ) : filteredAndSortedList.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center text-slate-500">
                  <div className="max-w-sm mx-auto flex flex-col items-center space-y-2">
                    <UtensilsCrossed className="w-7 h-7 text-slate-400" />
                    <p className="text-sm font-bold text-slate-700">
                      {recipes.length === 0 ? t.noRecipesFound : t.noIngredientsFound}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedList.map(({ recipe, calc }) => {
                const catStyle =
                  RECIPE_CATEGORY_COLORS[recipe.category] || RECIPE_CATEGORY_COLORS['overig' as any];

                // Badge styling for food cost deviation
                let statusBadge = {
                  bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                  dot: 'bg-emerald-600',
                  label: 'Optimal (≤2%)',
                };
                if (calc.foodCostStatus === 'warning') {
                  statusBadge = {
                    bg: 'bg-amber-50 text-amber-800 border-amber-200',
                    dot: 'bg-amber-600',
                    label: 'Écart 2-5%',
                  };
                } else if (calc.foodCostStatus === 'critical') {
                  statusBadge = {
                    bg: 'bg-rose-50 text-rose-800 border-rose-200',
                    dot: 'bg-rose-600',
                    label: 'Écart >5%',
                  };
                }

                return (
                  <tr
                    key={recipe.id}
                    id={`pricing-row-${recipe.id}`}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Dish Name & Category Pill */}
                    <td className="py-2.5 px-3.5 font-medium text-slate-900">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                            {recipe.name}
                          </span>
                          {calc.isManualOverride && (
                            <span
                              className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-[3px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold"
                              title="Prix fixé manuellement (override)"
                            >
                              {t.manualOverrideBadge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-[3px] border font-medium ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                          >
                            {t.recipeCategories[recipe.category] || recipe.category}
                          </span>
                          <span className="text-[10.5px] text-slate-400 font-mono">
                            Portion: {recipe.portionSize} {recipe.portionUnit}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Cost per Portion (MAD) */}
                    <td className="py-2.5 px-3.5 text-right font-mono font-medium text-slate-700">
                      <div className="flex flex-col items-end">
                        <span className="tabular-nums font-semibold">
                          {formatMAD(calc.portionCost)} <span className="text-[10px] text-slate-400 font-normal">MAD</span>
                        </span>
                        {calc.hasMissingIngredients && (
                          <span className="text-[9px] text-amber-600 font-sans flex items-center mt-0.5">
                            <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                            Ingr. manquant
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Recommended Excl. VAT (HT) */}
                    <td className="py-2.5 px-3.5 text-right font-mono text-slate-600">
                      <span className="tabular-nums">
                        {formatMAD(calc.recommendedPriceExclTva)} <span className="text-[10px] text-slate-400">MAD</span>
                      </span>
                    </td>

                    {/* Effective Menu Selling Price (Incl. VAT) */}
                    <td className="py-2.5 px-3.5 text-right font-mono bg-slate-50/50">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center space-x-1 justify-end">
                          <span className="text-xs sm:text-sm font-bold font-mono text-[#0A1F44] tabular-nums">
                            {formatMAD(calc.effectivePriceInclTva)}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">MAD</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          (HT: {formatMAD(calc.effectivePriceExclTva)})
                        </span>
                      </div>
                    </td>

                    {/* Glovo Price (Compensated) */}
                    <td className="py-2.5 px-3.5 text-right font-mono bg-amber-50/20">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center space-x-1 justify-end">
                          <span className="text-xs sm:text-sm font-bold font-mono text-amber-900 tabular-nums">
                            {formatMAD(calc.effectiveGlovoPrice)}
                          </span>
                          <span className="text-[10px] font-semibold text-amber-700/60">MAD</span>
                        </div>
                        <span className="text-[10px] text-amber-700/70 font-mono">
                          net: {formatMAD(calc.glovoNetRevenueExclCommission)} MAD
                        </span>
                      </div>
                    </td>

                    {/* Actual Food Cost % with Status Indicator */}
                    <td className="py-2.5 px-3.5 text-center font-mono">
                      <div
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] border text-xs font-bold font-mono shadow-2xs ${statusBadge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                        <span>{calc.actualFoodCostPercentage > 0 ? calc.actualFoodCostPercentage.toFixed(1) : '0.0'}%</span>
                      </div>
                    </td>

                    {/* Gross Margin MAD (Excl. VAT) */}
                    <td className="py-2.5 px-3.5 text-right font-mono font-medium text-emerald-800">
                      <span className="tabular-nums font-semibold">
                        +{formatMAD(calc.marginMAD)} <span className="text-[10px] text-slate-400 font-normal">MAD</span>
                      </span>
                    </td>

                    {/* Actions: Price Override Button */}
                    <td className="py-2.5 px-3.5 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          id={`btn-edit-price-${recipe.id}`}
                          type="button"
                          onClick={() => onOpenOverrideModal(recipe, calc)}
                          className="flex items-center space-x-1 px-2 py-0.5 text-xs font-semibold text-[#0A1F44] bg-slate-100 hover:bg-[#0A1F44] hover:text-white rounded-[4px] transition-colors shadow-2xs"
                          title={t.setOverrideTooltip}
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{calc.isManualOverride ? 'Modifier' : 'Ajuster'}</span>
                        </button>

                        {calc.isManualOverride && (
                          <button
                            id={`btn-clear-price-${recipe.id}`}
                            type="button"
                            onClick={() => recipe.id && onClearOverride(recipe.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-[4px] transition-colors"
                            title={t.clearOverrideTooltip}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary Counter */}
      <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
        <span>
          {filteredAndSortedList.length} / {recipes.length}{' '}
          {language === 'fr' ? 'recettes affichées' : 'recipes shown'}
        </span>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>≤ 2% {language === 'fr' ? 'écart' : 'deviation'}</span>
          </span>
          <span className="flex items-center space-x-1 text-amber-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            <span>2-5% {language === 'fr' ? 'écart' : 'deviation'}</span>
          </span>
          <span className="flex items-center space-x-1 text-rose-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            <span>&gt; 5% {language === 'fr' ? 'écart' : 'deviation'}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
