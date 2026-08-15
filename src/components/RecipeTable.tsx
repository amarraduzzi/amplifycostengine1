import React, { useState, useMemo } from 'react';
import {
  Recipe,
  RecipeCategory,
  Ingredient,
  RecipeSortField,
  SortOrder,
  Language,
} from '../types';
import { translations, RECIPE_CATEGORY_COLORS } from '../lib/i18n';
import { calculateRecipeCostBreakdown, formatMAD } from '../lib/recipeCalculations';
import { exportRecipeCostSheetPDF } from '../lib/pdfExport';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Plus,
  Download,
  AlertTriangle,
  Eye,
  UtensilsCrossed,
  FileText,
  Printer,
  Sparkles,
} from 'lucide-react';

interface RecipeTableProps {
  recipes: Recipe[];
  ingredientsMap: Map<string, Ingredient>;
  isLoading: boolean;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => Promise<void>;
  onViewDetails: (recipe: Recipe) => void;
  onAddNew: () => void;
  onImportIndianFlavors?: () => void;
  language: Language;
}

const RECIPE_CATEGORIES: RecipeCategory[] = [
  'voorgerecht',
  'hoofdgerecht',
  'dessert',
  'drank',
  'bijgerecht',
];

export const RecipeTable: React.FC<RecipeTableProps> = ({
  recipes,
  ingredientsMap,
  isLoading,
  onEdit,
  onDelete,
  onViewDetails,
  onAddNew,
  onImportIndianFlavors,
  language,
}) => {
  const t = translations[language];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<RecipeSortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle sorting
  const handleSort = (field: RecipeSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Pre-calculate costs for sorting and filtering
  const calculatedRecipes = useMemo(() => {
    return recipes.map((recipe) => {
      const breakdown = calculateRecipeCostBreakdown(recipe, ingredientsMap);
      return {
        recipe,
        breakdown,
      };
    });
  }, [recipes, ingredientsMap]);

  // Filter & Sort logic
  const filteredAndSorted = useMemo(() => {
    return calculatedRecipes
      .filter(({ recipe }) => {
        const matchesCategory = selectedCategory === 'ALL' || recipe.category === selectedCategory;
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !query ||
          recipe.name.toLowerCase().includes(query) ||
          (recipe.notes && recipe.notes.toLowerCase().includes(query));
        return matchesCategory && matchesQuery;
      })
      .sort((a, b) => {
        let valA: any;
        let valB: any;

        if (sortField === 'name') {
          valA = a.recipe.name.toLowerCase();
          valB = b.recipe.name.toLowerCase();
        } else if (sortField === 'category') {
          valA = a.recipe.category;
          valB = b.recipe.category;
        } else if (sortField === 'portionSize') {
          valA = a.recipe.portionSize;
          valB = b.recipe.portionSize;
        } else if (sortField === 'currentMenuPrice') {
          valA = a.recipe.currentMenuPrice || 0;
          valB = b.recipe.currentMenuPrice || 0;
        } else if (sortField === 'cost') {
          valA = a.breakdown.totalCost;
          valB = b.breakdown.totalCost;
        } else if (sortField === 'ingredientsCount') {
          valA = a.recipe.recipeIngredients?.length || 0;
          valB = b.recipe.recipeIngredients?.length || 0;
        } else {
          valA = new Date(a.recipe.updatedAt).getTime();
          valB = new Date(b.recipe.updatedAt).getTime();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [calculatedRecipes, selectedCategory, searchQuery, sortField, sortOrder]);

  // Confirm delete handler
  const confirmDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await onDelete(id);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Export recipes to CSV
  const handleExportCSV = () => {
    const headers = [
      'Nom du Plat / Recipe Name',
      'Catégorie',
      'Portion',
      'Unité',
      'Prix Carte Réf (MAD)',
      'Nb Ingrédients',
      'Coût Matière / Portion (MAD)',
      'Dernière mise à jour',
      'Notes',
    ];

    const rows = filteredAndSorted.map(({ recipe, breakdown }) => [
      `"${recipe.name.replace(/"/g, '""')}"`,
      `"${t.recipeCategories[recipe.category] || recipe.category}"`,
      recipe.portionSize,
      `"${recipe.portionUnit}"`,
      recipe.currentMenuPrice !== undefined ? recipe.currentMenuPrice.toFixed(2) : '',
      recipe.recipeIngredients?.length || 0,
      breakdown.totalCost.toFixed(2),
      new Date(recipe.updatedAt).toLocaleDateString(),
      `"${(recipe.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `amplify_recipes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSortIcon = (field: RecipeSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 ml-1 inline" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-600 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-600 ml-1 inline" />
    );
  };

  return (
    <div className="space-y-3.5">
      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-[8px] p-3 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="recipe-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchRecipesPlaceholder}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0A1F44] focus:border-[#0A1F44] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {onImportIndianFlavors && (
              <button
                id="import-indian-flavors-recipes-btn"
                type="button"
                onClick={onImportIndianFlavors}
                disabled={isLoading}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-[#0A1F44] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-[6px] transition-colors shadow-2xs disabled:opacity-50"
                title={t.importIndianFlavorsBtn}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0A1F44]" />
                <span>{t.importIndianFlavorsShortBtn || 'Import Indian Flavors Menu'}</span>
              </button>
            )}

            <button
              id="export-recipes-csv-btn"
              type="button"
              onClick={handleExportCSV}
              disabled={filteredAndSorted.length === 0}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-[6px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">{t.exportCSV}</span>
            </button>

            <button
              id="add-recipe-btn"
              type="button"
              onClick={onAddNew}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-[6px] transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addRecipe}</span>
            </button>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-2.5 py-1 text-xs rounded-[5px] whitespace-nowrap transition-colors border ${
              selectedCategory === 'ALL'
                ? 'bg-[#0A1F44] text-white border-[#0A1F44] font-semibold shadow-2xs'
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
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs rounded-[5px] whitespace-nowrap transition-colors border flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-[#0A1F44] text-white border-[#0A1F44] font-semibold shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{t.recipeCategories[cat] || cat}</span>
                <span
                  className={`text-[10px] font-mono px-1 py-0.2 rounded-[3px] ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recipes Data Table */}
      <div className="bg-white border border-slate-200 rounded-[8px] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-emerald-600 mb-3" />
            <p className="text-sm font-medium text-slate-500">{t.loading}</p>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="py-14 px-4 text-center">
            <div className="w-10 h-10 rounded-[6px] bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-500">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">{t.noRecipesFound}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3.5 leading-relaxed">
              {recipes.length === 0
                ? (language === 'fr' 
                    ? 'Créez votre première fiche technique ou importez les 53 plats de la carte Indian Flavors pour démarrer immédiatement.'
                    : 'Create your first recipe card or import the 53 Indian Flavors menu dishes to get started immediately.')
                : t.noIngredientsFound}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={onAddNew}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-[6px] transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.createFirstRecipe}</span>
              </button>

              {onImportIndianFlavors && (
                <button
                  id="empty-state-import-indian-flavors-btn"
                  type="button"
                  onClick={onImportIndianFlavors}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#0A1F44] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-[6px] transition-colors shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#0A1F44]" />
                  <span>{t.importIndianFlavorsBtn}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-mono uppercase tracking-wider text-slate-600 select-none">
                  {/* Dish Name */}
                  <th
                    scope="col"
                    onClick={() => handleSort('name')}
                    className="py-2.5 px-3.5 font-semibold cursor-pointer hover:text-slate-800 transition-colors"
                  >
                    <div className="flex items-center">
                      <span>{t.recipeName}</span>
                      {renderSortIcon('name')}
                    </div>
                  </th>

                  {/* Category */}
                  <th
                    scope="col"
                    onClick={() => handleSort('category')}
                    className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-800 transition-colors hidden sm:table-cell"
                  >
                    <div className="flex items-center">
                      <span>{t.category}</span>
                      {renderSortIcon('category')}
                    </div>
                  </th>

                  {/* Portion Size */}
                  <th
                    scope="col"
                    onClick={() => handleSort('portionSize')}
                    className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-slate-800 transition-colors hidden md:table-cell"
                  >
                    <div className="flex items-center justify-end">
                      <span>{t.portionSize}</span>
                      {renderSortIcon('portionSize')}
                    </div>
                  </th>

                  {/* Reference Menu Price */}
                  <th
                    scope="col"
                    onClick={() => handleSort('currentMenuPrice')}
                    className="py-2.5 px-3.5 font-semibold text-right cursor-pointer hover:text-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-end">
                      <span>{t.colCurrentMenuPrice}</span>
                      {renderSortIcon('currentMenuPrice')}
                    </div>
                  </th>

                  {/* Ingredients Count */}
                  <th
                    scope="col"
                    onClick={() => handleSort('ingredientsCount')}
                    className="py-2.5 px-3 font-semibold text-center cursor-pointer hover:text-slate-800 transition-colors hidden lg:table-cell"
                  >
                    <div className="flex items-center justify-center">
                      <span>{t.recipeIngredientsSection}</span>
                      {renderSortIcon('ingredientsCount')}
                    </div>
                  </th>

                  {/* Raw Cost per Portion */}
                  <th
                    scope="col"
                    onClick={() => handleSort('cost')}
                    className="py-2.5 px-3.5 font-semibold text-right cursor-pointer hover:text-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-end">
                      <span>{t.costPerPortion}</span>
                      {renderSortIcon('cost')}
                    </div>
                  </th>

                  {/* Actions */}
                  <th scope="col" className="py-2.5 px-3.5 font-semibold text-right">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSorted.map(({ recipe, breakdown }) => {
                  const categoryStyle =
                    RECIPE_CATEGORY_COLORS[recipe.category] || RECIPE_CATEGORY_COLORS['hoofdgerecht'];
                  const isDeletingThis = deletingId === recipe.id;
                  const ingredientsCount = recipe.recipeIngredients?.length || 0;

                  return (
                    <tr
                      key={recipe.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Dish Name & Notes */}
                      <td className="py-2.5 px-3.5">
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => onViewDetails(recipe)}
                            className="text-left font-semibold text-slate-900 hover:text-emerald-700 transition-colors focus:outline-none"
                          >
                            {recipe.name}
                          </button>
                          {recipe.notes ? (
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 flex items-center space-x-1">
                              <FileText className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span>{recipe.notes}</span>
                            </p>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              {language === 'fr' ? 'Fiche technique standard' : 'Standard tech sheet'}
                            </span>
                          )}
                          {/* Mobile-only category badge */}
                          <div className="sm:hidden mt-1 flex items-center space-x-2">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
                            >
                              {t.recipeCategories[recipe.category] || recipe.category}
                            </span>
                            {ingredientsCount === 0 && (
                              <span className="text-[10px] text-amber-700 font-mono bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                                0 ingr.
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3 hidden sm:table-cell">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-medium border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
                        >
                          {t.recipeCategories[recipe.category] || recipe.category}
                        </span>
                      </td>

                      {/* Portion Size */}
                      <td className="py-2.5 px-3 text-right hidden md:table-cell">
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {recipe.portionSize}
                        </span>{' '}
                        <span className="text-[11px] text-slate-500 font-mono">
                          {recipe.portionUnit}
                        </span>
                      </td>

                      {/* Reference Menu Price */}
                      <td className="py-2.5 px-3.5 text-right">
                        {recipe.currentMenuPrice !== undefined && recipe.currentMenuPrice !== null ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="font-mono text-xs sm:text-sm font-bold tabular-nums text-[#0A1F44] bg-blue-50/80 px-2 py-0.5 rounded-[4px] border border-blue-200/70">
                              {formatMAD(recipe.currentMenuPrice)}{' '}
                              <span className="text-[10px] text-slate-500 font-sans font-normal">
                                {t.currencyMAD}
                              </span>
                            </span>
                            <span className="text-[9.5px] text-slate-400 font-sans mt-0.5 hidden sm:inline">
                              {language === 'fr' ? 'Réf. carte' : 'Menu ref.'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 font-mono italic">—</span>
                        )}
                      </td>

                      {/* Ingredients Count */}
                      <td className="py-2.5 px-3 text-center hidden lg:table-cell">
                        <button
                          type="button"
                          onClick={() => onViewDetails(recipe)}
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] text-xs font-mono font-medium border transition-colors ${
                            ingredientsCount === 0
                              ? 'bg-amber-50/90 hover:bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          }`}
                          title={language === 'fr' ? 'Voir la décomposition' : 'View breakdown'}
                        >
                          <UtensilsCrossed className="w-3 h-3 text-emerald-600" />
                          <span>
                            {ingredientsCount === 0
                              ? (language === 'fr' ? '0 ingr. (à saisir)' : '0 ingr. (pending)')
                              : `${ingredientsCount} ingr.`}
                          </span>
                        </button>
                      </td>

                      {/* Calculated Raw Cost Price */}
                      <td className="py-2.5 px-3.5 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-mono text-sm sm:text-base font-bold tabular-nums ${
                              ingredientsCount === 0
                                ? 'text-slate-400 font-normal'
                                : 'text-emerald-700'
                            }`}
                          >
                            {formatMAD(breakdown.totalCost)}{' '}
                            <span className="text-xs font-normal text-slate-400 font-sans">
                              {t.currencyMAD}
                            </span>
                          </span>
                          {ingredientsCount === 0 ? (
                            <span className="text-[10px] text-amber-600 font-medium mt-0.5">
                              {t.toPriceLabel}
                            </span>
                          ) : breakdown.hasMissingIngredients ? (
                            <span
                              className="text-[10px] text-amber-600 font-medium flex items-center space-x-0.5 mt-0.5"
                              title={t.missingIngredientsWarning}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              <span>{language === 'fr' ? 'Incomplet' : 'Incomplete'}</span>
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3.5 text-right">
                        {isDeletingThis ? (
                          <div className="flex items-center justify-end space-x-1.5 animate-in fade-in duration-100">
                            <span className="text-[11px] text-rose-600 font-medium hidden lg:inline">
                              {t.deleteConfirmTitle}
                            </span>
                            <button
                              type="button"
                              onClick={() => recipe.id && confirmDelete(recipe.id)}
                              disabled={isDeleting}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-[4px] text-xs font-medium transition-colors"
                            >
                              {isDeleting ? '...' : t.deleteIngredient}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              disabled={isDeleting}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[4px] text-xs font-medium transition-colors"
                            >
                              {t.cancel}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-1">
                            {/* Export PDF Cost Sheet Button */}
                            <button
                              id={`export-pdf-row-btn-${recipe.id}`}
                              type="button"
                              onClick={() =>
                                exportRecipeCostSheetPDF(
                                  recipe,
                                  ingredientsMap,
                                  30,
                                  20,
                                  27,
                                  language
                                )
                              }
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-[4px] transition-colors"
                              title={t.exportPDF}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* View Breakdown Button */}
                            <button
                              type="button"
                              onClick={() => onViewDetails(recipe)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-[4px] transition-colors"
                              title={t.viewRecipeDetails}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => onEdit(recipe)}
                              className="p-1.5 text-slate-500 hover:text-[#0A1F44] hover:bg-slate-100 rounded-[4px] transition-colors"
                              title={t.editRecipe}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => recipe.id && setDeletingId(recipe.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-[4px] transition-colors"
                              title={t.deleteRecipe}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-3.5 py-2 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
          <span>
            {filteredAndSorted.length}{' '}
            {language === 'fr'
              ? `recette(s) affichée(s) sur ${recipes.length}`
              : `recipe(s) shown of ${recipes.length}`}
          </span>
          <span className="text-[11px] text-slate-400">
            {t.rawCostFormulaNotice}
          </span>
        </div>
      </div>
    </div>
  );
};
