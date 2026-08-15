import React, { useState, useMemo } from 'react';
import { Ingredient, IngredientCategory, SortField, SortOrder, Language } from '../types';
import { translations, CATEGORY_COLORS } from '../lib/i18n';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  History,
  Edit2,
  Trash2,
  Plus,
  Download,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface IngredientTableProps {
  ingredients: Ingredient[];
  isLoading: boolean;
  onEdit: (ingredient: Ingredient) => void;
  onDelete: (id: string) => Promise<void>;
  onViewHistory: (ingredient: Ingredient) => void;
  onAddNew: () => void;
  onImportIndianFlavors?: () => void;
  language: Language;
}

const CATEGORIES: IngredientCategory[] = [
  'specerijen',
  'vlees',
  'vis',
  'groente',
  'zuivel',
  'granen',
  'olie/vet',
  'overig',
];

export const IngredientTable: React.FC<IngredientTableProps> = ({
  ingredients,
  isLoading,
  onEdit,
  onDelete,
  onViewHistory,
  onAddNew,
  onImportIndianFlavors,
  language,
}) => {
  const t = translations[language];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IngredientCategory | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter & Sort logic
  const filteredAndSortedIngredients = useMemo(() => {
    return ingredients
      .filter((item) => {
        const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !query ||
          item.name.toLowerCase().includes(query) ||
          (item.supplier && item.supplier.toLowerCase().includes(query));
        return matchesCategory && matchesQuery;
      })
      .sort((a, b) => {
        let valA: any;
        let valB: any;

        if (sortField === 'name') {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (sortField === 'category') {
          valA = a.category;
          valB = b.category;
        } else if (sortField === 'purchasePrice') {
          valA = a.purchasePrice;
          valB = b.purchasePrice;
        } else if (sortField === 'unitCost') {
          valA = a.purchasePrice / (a.conversionFactor || 1);
          valB = b.purchasePrice / (b.conversionFactor || 1);
        } else if (sortField === 'supplier') {
          valA = (a.supplier || '').toLowerCase();
          valB = (b.supplier || '').toLowerCase();
        } else {
          valA = new Date(a.updatedAt).getTime();
          valB = new Date(b.updatedAt).getTime();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [ingredients, searchQuery, selectedCategory, sortField, sortOrder]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!ingredients.length) return;
    const headers = ['Nom', 'Categorie', 'Prix Achat (MAD)', 'Unite Achat', 'Unite Recette', 'Facteur Conversion', 'Cout Unitaire Recette (MAD)', 'Fournisseur', 'Derniere Modif'];
    const rows = filteredAndSortedIngredients.map((i) => [
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      i.purchasePrice,
      `"${i.purchaseUnit}"`,
      `"${i.recipeUnit}"`,
      i.conversionFactor,
      (i.purchasePrice / (i.conversionFactor || 1)).toFixed(4),
      `"${(i.supplier || '').replace(/"/g, '""')}"`,
      `"${i.updatedAt}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `amplify_ingredients_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      await onDelete(deletingId);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-600 ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-600 ml-1" />
    );
  };

  return (
    <div className="space-y-3.5">
      
      {/* Controls Bar: Search, Category Filter, Export, Add Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-3 border border-slate-200 rounded-[8px] shadow-xs">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="ingredient-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0A1F44] focus:border-[#0A1F44]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 self-end md:self-auto flex-wrap gap-y-2">
          {onImportIndianFlavors && (
            <button
              id="import-indian-flavors-ingredients-btn"
              type="button"
              onClick={onImportIndianFlavors}
              className="px-3 py-1.5 text-xs font-semibold text-[#0A1F44] bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 rounded-[6px] flex items-center space-x-1.5 transition-colors shadow-2xs"
              title={t.importIndianFlavorsIngredientsBtn}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{t.importIndianFlavorsIngredientsShortBtn}</span>
              <span className="sm:hidden">{t.importIndianFlavorsIngredientsShortBtn}</span>
            </button>
          )}

          {ingredients.length > 0 && (
            <button
              id="export-csv-btn"
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-[6px] flex items-center space-x-1.5 transition-colors"
              title={t.exportCSV}
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">{t.exportCSV}</span>
            </button>
          )}

          <button
            id="add-ingredient-btn"
            type="button"
            onClick={onAddNew}
            className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-[6px] flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addIngredient}</span>
          </button>
        </div>

      </div>

      {/* Category Filter Controls */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-thin">
        <button
          id="cat-filter-all"
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          className={`px-2.5 py-1 text-xs rounded-[5px] whitespace-nowrap transition-colors border ${
            selectedCategory === 'ALL'
              ? 'bg-[#0A1F44] text-white border-[#0A1F44] font-semibold shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          {t.allCategories} ({ingredients.length})
        </button>

        {CATEGORIES.map((cat) => {
          const count = ingredients.filter((i) => i.category === cat).length;
          const isSelected = selectedCategory === cat;
          const col = CATEGORY_COLORS[cat];
          return (
            <button
              key={cat}
              id={`cat-filter-${cat}`}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-xs rounded-[5px] whitespace-nowrap transition-colors border flex items-center space-x-1.5 ${
                isSelected
                  ? `${col.bg} ${col.text} ${col.border} ring-1 ring-[#0A1F44] font-semibold`
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span>{t.categories[cat]}</span>
              <span className="text-[10px] opacity-70 font-mono">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Main Ingredient Table */}
      <div className="bg-white border border-slate-200 rounded-[8px] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10.5px] font-mono uppercase tracking-wider text-slate-600 select-none">
                
                {/* Column: Name */}
                <th
                  scope="col"
                  className="py-2.5 px-3.5 cursor-pointer group hover:text-slate-900"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    <span>{t.ingredientName}</span>
                    {renderSortIcon('name')}
                  </div>
                </th>

                {/* Column: Category */}
                <th
                  scope="col"
                  className="py-2.5 px-3.5 cursor-pointer group hover:text-slate-900"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center">
                    <span>{t.category}</span>
                    {renderSortIcon('category')}
                  </div>
                </th>

                {/* Column: Purchase Price (MAD) */}
                <th
                  scope="col"
                  className="py-2.5 px-3.5 text-right cursor-pointer group hover:text-slate-900"
                  onClick={() => handleSort('purchasePrice')}
                >
                  <div className="flex items-center justify-end">
                    <span>{t.purchasePrice}</span>
                    {renderSortIcon('purchasePrice')}
                  </div>
                </th>

                {/* Column: Recipe Unit Cost (MAD/g or ml) */}
                <th
                  scope="col"
                  className="py-2.5 px-3.5 text-right cursor-pointer group hover:text-slate-900"
                  onClick={() => handleSort('unitCost')}
                >
                  <div className="flex items-center justify-end">
                    <span>{t.recipeUnitCost}</span>
                    {renderSortIcon('unitCost')}
                  </div>
                </th>

                {/* Column: Supplier */}
                <th
                  scope="col"
                  className="py-2.5 px-3.5 cursor-pointer group hover:text-slate-900 hidden sm:table-cell"
                  onClick={() => handleSort('supplier')}
                >
                  <div className="flex items-center">
                    <span>{t.supplier}</span>
                    {renderSortIcon('supplier')}
                  </div>
                </th>

                {/* Column: Price History */}
                <th scope="col" className="py-2.5 px-3.5 text-center">
                  <span>{t.history}</span>
                </th>

                {/* Column: Actions */}
                <th scope="col" className="py-2.5 px-3.5 text-right">
                  <span>{t.actions}</span>
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span>{t.loading}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAndSortedIngredients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-2">
                      <p className="text-sm font-bold text-slate-800">
                        {t.noIngredientsFound}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {language === 'fr'
                          ? 'Aucun ingrédient enregistré pour cet établissement. Commencez par ajouter vos matières premières (ex: viandes, épices, huiles) pour calculer précisément le coût de vos fiches techniques.'
                          : 'No ingredients found for this establishment. Add your base ingredients to calculate precise recipe costs.'}
                      </p>
                      <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={onAddNew}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-[6px] transition-colors shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t.createFirstIngredient}</span>
                        </button>
                        {onImportIndianFlavors && (
                          <button
                            id="empty-import-indian-flavors-ingredients-btn"
                            type="button"
                            onClick={onImportIndianFlavors}
                            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#0A1F44] hover:bg-[#153266] text-white rounded-[6px] transition-colors shadow-xs"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{t.importIndianFlavorsIngredientsBtn}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedIngredients.map((item) => {
                  const catColor = CATEGORY_COLORS[item.category];
                  const factor = item.conversionFactor || 1;
                  const unitCost = item.purchasePrice / factor;
                  const historyCount = item.priceHistory?.length || 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Name */}
                      <td className="py-2.5 px-3.5 font-medium text-slate-900">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            1 {item.purchaseUnit} = {factor} {item.recipeUnit}
                          </span>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-2.5 px-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium border ${catColor.bg} ${catColor.text} ${catColor.border}`}
                        >
                          {t.categories[item.category]}
                        </span>
                      </td>

                      {/* Purchase Price */}
                      <td className="py-2.5 px-3.5 text-right">
                        {item.purchasePrice === 0 ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <span
                              className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-[4px] text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"
                              title={t.priceMissingTooltip}
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                              <span>{t.priceMissingBadge}</span>
                            </span>
                            <span className="font-mono text-[10.5px] text-amber-600/70 font-medium">
                              0.00 MAD / {item.purchaseUnit}
                            </span>
                          </div>
                        ) : (
                          <div className="font-mono font-bold tabular-nums text-slate-900">
                            {item.purchasePrice.toFixed(2)}{' '}
                            <span className="text-[10px] font-normal text-slate-500">
                              MAD / {item.purchaseUnit}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Recipe Unit Cost */}
                      <td className="py-2.5 px-3.5 text-right">
                        {item.purchasePrice === 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="font-mono text-xs text-slate-400 italic">
                              0.0000 <span className="text-[10px] font-normal text-slate-400">MAD / {item.recipeUnit}</span>
                            </span>
                            <span className="text-[9.5px] text-amber-600/80 font-mono">
                              ({t.toPriceLabel || 'à chiffrer'})
                            </span>
                          </div>
                        ) : (
                          <div className="font-mono font-bold tabular-nums text-[#0A1F44]">
                            {unitCost.toFixed(4)}{' '}
                            <span className="text-[10px] font-normal text-slate-500">
                              MAD / {item.recipeUnit}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Supplier */}
                      <td className="py-2.5 px-3.5 hidden sm:table-cell text-slate-600">
                        {item.supplier ? (
                          <span>{item.supplier}</span>
                        ) : (
                          <span className="text-slate-300 italic">—</span>
                        )}
                      </td>

                      {/* Price History Action */}
                      <td className="py-2.5 px-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => onViewHistory(item)}
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] text-xs font-mono transition-colors ${
                            historyCount > 0
                              ? 'bg-slate-100 text-[#0A1F44] hover:bg-slate-200 border border-slate-200 font-semibold'
                              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                          }`}
                          title={t.priceHistoryTitle}
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>{historyCount}</span>
                        </button>
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td className="py-2.5 px-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-[#0A1F44] hover:bg-slate-100 rounded-[4px] transition-colors"
                            title={t.editIngredient}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(item.id || null)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-[4px] transition-colors"
                            title={t.deleteIngredient}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Counter */}
        <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>
            {filteredAndSortedIngredients.length} / {ingredients.length} {language === 'fr' ? 'ingrédients affichés' : 'ingredients shown'}
          </span>
          <span>
            Devise: MAD (Dirham marocain)
          </span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white border border-slate-200 rounded-[8px] p-5 max-w-sm w-full shadow-xl space-y-3">
            <div className="flex items-center space-x-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-slate-900">
                {t.deleteConfirmTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              {t.deleteConfirmText}
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-[6px] transition-colors"
              >
                {t.cancel}
              </button>
              <button
                id="confirm-delete-ingredient-btn"
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-[6px] transition-colors disabled:opacity-50"
              >
                {isDeleting ? '...' : t.deleteIngredient}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
