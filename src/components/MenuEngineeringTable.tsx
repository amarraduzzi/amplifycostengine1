import React, { useState, useMemo } from 'react';
import {
  MenuEngineeringItem,
  RecipeCategory,
  MenuEngineeringQuadrant,
  EngineeringSortField,
  SortOrder,
  Language,
} from '../types';
import { translations, QUADRANT_STYLES, RECIPE_CATEGORY_COLORS } from '../lib/i18n';
import { formatMAD } from '../lib/recipeCalculations';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Download,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Layers,
  Save,
} from 'lucide-react';

interface MenuEngineeringTableProps {
  items: MenuEngineeringItem[];
  selectedCategory: RecipeCategory | 'ALL';
  onChangeCategory: (category: RecipeCategory | 'ALL') => void;
  onUpdateSalesVolume: (recipeId: string, volume: number) => Promise<void>;
  language: Language;
}

const RECIPE_CATEGORIES: RecipeCategory[] = [
  'voorgerecht',
  'hoofdgerecht',
  'dessert',
  'drank',
  'bijgerecht',
];

export const MenuEngineeringTable: React.FC<MenuEngineeringTableProps> = ({
  items,
  selectedCategory,
  onChangeCategory,
  onUpdateSalesVolume,
  language,
}) => {
  const t = translations[language];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuadrant, setSelectedQuadrant] = useState<MenuEngineeringQuadrant | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<EngineeringSortField>('marginMAD');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Inline volume edit tracking
  const [editingVolumeMap, setEditingVolumeMap] = useState<Record<string, number>>({});
  const [savingRecipeId, setSavingRecipeId] = useState<string | null>(null);

  // Filter & Sort
  const filteredAndSortedItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesCategory =
          selectedCategory === 'ALL' || item.recipe.category === selectedCategory;
        const matchesQuadrant =
          selectedQuadrant === 'ALL' || item.classification === selectedQuadrant;
        const matchesSearch =
          searchQuery.trim() === '' ||
          item.recipe.name.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesQuadrant && matchesSearch;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'name') {
          comp = a.recipe.name.localeCompare(b.recipe.name);
        } else if (sortField === 'category') {
          comp = a.recipe.category.localeCompare(b.recipe.category);
        } else if (sortField === 'salesVolume') {
          comp = a.salesVolume - b.salesVolume;
        } else if (sortField === 'marginMAD') {
          comp = a.marginMAD - b.marginMAD;
        } else if (sortField === 'revenueMAD') {
          comp = a.revenueMAD - b.revenueMAD;
        } else if (sortField === 'classification') {
          comp = a.classification.localeCompare(b.classification);
        }
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [items, searchQuery, selectedCategory, selectedQuadrant, sortField, sortOrder]);

  const handleSort = (field: EngineeringSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const renderSortIcon = (field: EngineeringSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 ml-1 inline-block" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-600 ml-1 inline-block" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-600 ml-1 inline-block" />
    );
  };

  // Handle saving inline sales volume
  const handleSaveVolume = async (recipeId: string) => {
    const vol = editingVolumeMap[recipeId];
    if (typeof vol !== 'number' || isNaN(vol) || vol < 0) return;

    setSavingRecipeId(recipeId);
    try {
      await onUpdateSalesVolume(recipeId, vol);
      setEditingVolumeMap((prev) => {
        const next = { ...prev };
        delete next[recipeId];
        return next;
      });
    } finally {
      setSavingRecipeId(null);
    }
  };

  // Export Matrix Data to CSV
  const exportMatrixCSV = () => {
    if (items.length === 0) return;

    const headers = [
      'Nom du Plat / Recipe',
      'Catégorie',
      'Volume Ventes Mensuel',
      'Prix Carte TTC (MAD)',
      'Prix Carte HT (MAD)',
      'Coût Portion HT (MAD)',
      'Marge Unitaire HT (MAD)',
      'Marge Totale Mensuelle (MAD)',
      'Chiffre d’Affaires Mensuel HT (MAD)',
      'Classification Kasavana',
      'Recommandation Stratégique',
    ];

    const rows = items.map((item) => {
      const catLabel = t.recipeCategories[item.recipe.category] || item.recipe.category;
      let recText = t.recommendationPromote;
      if (item.recommendationKey === 'reprice') recText = t.recommendationReprice;
      if (item.recommendationKey === 'visible') recText = t.recommendationVisible;
      if (item.recommendationKey === 'remove') recText = t.recommendationRemove;

      return [
        `"${item.recipe.name.replace(/"/g, '""')}"`,
        `"${catLabel}"`,
        item.salesVolume,
        item.effectivePriceInclTva.toFixed(2),
        item.effectivePriceExclTva.toFixed(2),
        item.portionCost.toFixed(2),
        item.marginMAD.toFixed(2),
        item.totalGrossMarginMAD.toFixed(2),
        item.revenueMAD.toFixed(2),
        item.classification,
        `"${recText}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `amplify_menu_engineering_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[8px] shadow-xs overflow-hidden flex flex-col">
      {/* Controls Bar: Category filter pills & Search bar */}
      <div className="p-3 sm:p-4 border-b border-slate-200 bg-white space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              id="filter-eng-cat-all-btn"
              type="button"
              onClick={() => onChangeCategory('ALL')}
              className={`px-2.5 py-1 rounded-[5px] text-xs font-semibold whitespace-nowrap transition-colors border ${
                selectedCategory === 'ALL'
                  ? 'bg-[#0A1F44] text-white border-[#0A1F44] shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {t.allCategories} ({items.length})
            </button>
            {RECIPE_CATEGORIES.map((cat) => {
              const count = items.filter((i) => i.recipe.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  id={`filter-eng-cat-${cat}-btn`}
                  type="button"
                  onClick={() => onChangeCategory(cat)}
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

          {/* Export CSV Button */}
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              id="export-engineering-csv-btn"
              type="button"
              onClick={exportMatrixCSV}
              disabled={items.length === 0}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-[6px] transition-colors shadow-2xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.exportCSV}</span>
            </button>
          </div>
        </div>

        {/* Quadrant Quick Filters & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-0.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="engineering-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchEngineeringPlaceholder}
              className="w-full pl-9 pr-4 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-[6px] focus:bg-white focus:ring-1 focus:ring-[#0A1F44] focus:border-[#0A1F44] outline-none transition-all"
            />
          </div>

          {/* Quadrant Segmented Filter */}
          <div className="flex items-center space-x-0.5 bg-slate-100 p-0.5 rounded-[6px] border border-slate-200 self-start md:self-auto text-xs">
            <button
              type="button"
              onClick={() => setSelectedQuadrant('ALL')}
              className={`px-2.5 py-1 rounded-[4px] text-[11px] font-semibold transition-all ${
                selectedQuadrant === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => setSelectedQuadrant('STAR')}
              className={`px-2 py-1 rounded-[4px] text-[11px] font-semibold transition-all ${
                selectedQuadrant === 'STAR'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              ★ Stars
            </button>
            <button
              type="button"
              onClick={() => setSelectedQuadrant('PLOWHORSE')}
              className={`px-2 py-1 rounded-[4px] text-[11px] font-semibold transition-all ${
                selectedQuadrant === 'PLOWHORSE'
                  ? 'bg-[#0A1F44] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-[#0A1F44]'
              }`}
            >
              Plowhorses
            </button>
            <button
              type="button"
              onClick={() => setSelectedQuadrant('PUZZLE')}
              className={`px-2 py-1 rounded-[4px] text-[11px] font-semibold transition-all ${
                selectedQuadrant === 'PUZZLE'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              Puzzles
            </button>
            <button
              type="button"
              onClick={() => setSelectedQuadrant('DOG')}
              className={`px-2 py-1 rounded-[4px] text-[11px] font-semibold transition-all ${
                selectedQuadrant === 'DOG'
                  ? 'bg-slate-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dogs
            </button>
          </div>
        </div>
      </div>

      {/* Engineering Table */}
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

              {/* Monthly Sales Volume (Editable) */}
              <th
                onClick={() => handleSort('salesVolume')}
                className="py-2.5 px-3.5 font-semibold text-center cursor-pointer hover:text-slate-900 transition-colors bg-blue-50/40"
              >
                <div className="flex items-center justify-center">
                  <span className="text-[#0A1F44]">{t.colSalesVolume}</span>
                  {renderSortIcon('salesVolume')}
                </div>
              </th>

              {/* Unit Gross Margin MAD */}
              <th
                onClick={() => handleSort('marginMAD')}
                className="py-2.5 px-3.5 font-semibold text-right cursor-pointer hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center justify-end">
                  <span>{t.colMarginUnitMAD}</span>
                  {renderSortIcon('marginMAD')}
                </div>
              </th>

              {/* Total Monthly Gross Margin (MAD) */}
              <th className="py-2.5 px-3.5 font-semibold text-right text-slate-600">
                <div className="flex items-center justify-end">
                  <span>{t.colTotalGrossMargin}</span>
                </div>
              </th>

              {/* Kasavana Classification Quadrant */}
              <th
                onClick={() => handleSort('classification')}
                className="py-2.5 px-3.5 font-semibold text-center cursor-pointer hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center justify-center">
                  <span>{t.colClassification}</span>
                  {renderSortIcon('classification')}
                </div>
              </th>

              {/* Strategic Action Recommendation */}
              <th className="py-2.5 px-3.5 font-semibold text-left">
                <span>{t.colActionRecommendation}</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredAndSortedItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-14 text-center text-slate-500">
                  <div className="max-w-sm mx-auto flex flex-col items-center space-y-2">
                    <Layers className="w-7 h-7 text-slate-400" />
                    <p className="text-sm font-bold text-slate-700">
                      {t.noRecipesFound}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedItems.map((item) => {
                const style = QUADRANT_STYLES[item.classification];
                const catStyle =
                  RECIPE_CATEGORY_COLORS[item.recipe.category] || RECIPE_CATEGORY_COLORS['hoofdgerecht'];

                const isInlineEditing = editingVolumeMap[item.recipe.id!] !== undefined;
                const currentEditVal = isInlineEditing
                  ? editingVolumeMap[item.recipe.id!]
                  : item.salesVolume;

                // Action recommendation text & badge
                let recText = t.recommendationPromote;
                let recBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                if (item.recommendationKey === 'reprice') {
                  recText = t.recommendationReprice;
                  recBadge = 'bg-blue-50 text-[#0A1F44] border-blue-200';
                } else if (item.recommendationKey === 'visible') {
                  recText = t.recommendationVisible;
                  recBadge = 'bg-amber-50 text-amber-900 border-amber-200';
                } else if (item.recommendationKey === 'remove') {
                  recText = t.recommendationRemove;
                  recBadge = 'bg-slate-100 text-slate-700 border-slate-300';
                }

                return (
                  <tr
                    key={item.recipe.id}
                    id={`engineering-row-${item.recipe.id}`}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Dish Name & Category Pill */}
                    <td className="py-2.5 px-3.5 font-medium text-slate-900">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                          {item.recipe.name}
                        </span>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-[3px] border font-medium ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                          >
                            {t.recipeCategories[item.recipe.category] || item.recipe.category}
                          </span>
                          <span className="text-[10.5px] text-slate-400 font-mono">
                            Carte: {formatMAD(item.effectivePriceInclTva)} MAD TTC
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Monthly Sales Volume (Inline Editable) */}
                    <td className="py-2.5 px-3.5 text-center bg-blue-50/20">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <div className="flex items-center justify-center space-x-1.5">
                          <input
                            id={`input-vol-${item.recipe.id}`}
                            type="number"
                            min="0"
                            step="1"
                            value={currentEditVal}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setEditingVolumeMap((prev) => ({
                                ...prev,
                                [item.recipe.id!]: isNaN(val) ? 0 : val,
                              }));
                            }}
                            className="w-18 px-2 py-0.5 text-center font-mono font-bold text-xs bg-white border border-slate-300 rounded-[4px] focus:ring-1 focus:ring-[#0A1F44] focus:border-[#0A1F44] outline-none transition-all"
                          />
                          {isInlineEditing && (
                            <button
                              id={`btn-save-vol-${item.recipe.id}`}
                              type="button"
                              onClick={() => handleSaveVolume(item.recipe.id!)}
                              disabled={savingRecipeId === item.recipe.id}
                              className="p-1 rounded-[4px] bg-[#16A34A] text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                              title={t.save}
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {item.recipe.salesVolumeLastUpdated && (
                          <span
                            className="text-[9.5px] text-slate-400 font-mono"
                            title={`${new Date(item.recipe.salesVolumeLastUpdated).toLocaleString()}`}
                          >
                            {item.recipe.salesVolumeImportSource === 'import' ? 'via CSV' : 'manuel'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Unit Gross Margin MAD */}
                    <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-emerald-800">
                      <span className="tabular-nums">
                        +{formatMAD(item.marginMAD)} <span className="text-[10px] text-slate-400 font-normal">MAD</span>
                      </span>
                    </td>

                    {/* Total Monthly Gross Margin (MAD) */}
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-800">
                      <span className="tabular-nums">
                        {formatMAD(item.totalGrossMarginMAD)} <span className="text-[10px] text-slate-400 font-normal">MAD</span>
                      </span>
                    </td>

                    {/* Kasavana Classification Quadrant Badge */}
                    <td className="py-2.5 px-3.5 text-center">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] text-xs font-bold font-mono border shadow-2xs ${style.badgeBg} ${style.badgeBorder} ${style.badgeText}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        <span>{item.classification}</span>
                      </span>
                    </td>

                    {/* Strategic Action Recommendation */}
                    <td className="py-2.5 px-3.5 text-left">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-[4px] text-xs font-semibold border ${recBadge}`}
                      >
                        {recText}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary */}
      <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
        <span>
          {filteredAndSortedItems.length} / {items.length}{' '}
          {language === 'fr' ? 'plats analysés' : 'dishes analyzed'}
        </span>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="text-slate-600">
            Total Marge Mensuelle :{' '}
            <strong className="text-slate-900 font-mono font-bold">
              {formatMAD(
                filteredAndSortedItems.reduce((acc, i) => acc + i.totalGrossMarginMAD, 0)
              )}{' '}
              MAD
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};
