import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Recipe,
  RecipeCategory,
  RecipeIngredientItem,
  Ingredient,
  Language,
} from '../types';
import { translations, RECIPE_CATEGORY_COLORS, CATEGORY_COLORS } from '../lib/i18n';
import {
  getIngredientUnitCost,
  calculateRecipeItemCost,
  formatMAD,
} from '../lib/recipeCalculations';
import {
  X,
  Plus,
  Trash2,
  Search,
  Check,
  ChevronDown,
  Info,
  UtensilsCrossed,
  AlertCircle,
} from 'lucide-react';

interface RecipeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipeData: Omit<Recipe, 'id'>) => Promise<void>;
  editingRecipe: Recipe | null;
  ingredients: Ingredient[];
  onNavigateToIngredientsTab: () => void;
  language: Language;
}

const RECIPE_CATEGORIES: RecipeCategory[] = [
  'voorgerecht',
  'hoofdgerecht',
  'dessert',
  'drank',
  'bijgerecht',
];

export const RecipeFormModal: React.FC<RecipeFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRecipe,
  ingredients,
  onNavigateToIngredientsTab,
  language,
}) => {
  const t = translations[language];

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<RecipeCategory>('hoofdgerecht');
  const [portionSize, setPortionSize] = useState<number | ''>(350);
  const [portionUnit, setPortionUnit] = useState('g');
  const [monthlySalesVolume, setMonthlySalesVolume] = useState<number | ''>(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<RecipeIngredientItem[]>([]);

  // Ingredient search dropdown for adding row
  const [dropdownOpenIndex, setDropdownOpenIndex] = useState<number | null>(null);
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Errors & saving state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Map of ingredients by ID for fast lookup
  const ingredientsMap = useMemo(() => {
    const map = new Map<string, Ingredient>();
    ingredients.forEach((ing) => {
      if (ing.id) map.set(ing.id, ing);
    });
    return map;
  }, [ingredients]);

  // Prepopulate form when editing or resetting
  useEffect(() => {
    if (editingRecipe) {
      setName(editingRecipe.name || '');
      setCategory(editingRecipe.category || 'hoofdgerecht');
      setPortionSize(editingRecipe.portionSize || 350);
      setPortionUnit(editingRecipe.portionUnit || 'g');
      setMonthlySalesVolume(editingRecipe.monthlySalesVolume !== undefined ? editingRecipe.monthlySalesVolume : 0);
      setNotes(editingRecipe.notes || '');
      setItems(
        editingRecipe.recipeIngredients && editingRecipe.recipeIngredients.length > 0
          ? editingRecipe.recipeIngredients.map((item) => ({
              ingredientId: item.ingredientId,
              quantity: item.quantity,
              yieldPercent: item.yieldPercent || 100,
            }))
          : []
      );
    } else {
      setName('');
      setCategory('hoofdgerecht');
      setPortionSize(350);
      setPortionUnit('g');
      setMonthlySalesVolume(0);
      setNotes('');
      // If we have at least one ingredient, initialize with one empty row
      setItems([]);
    }
    setErrors({});
    setDropdownOpenIndex(null);
    setIngredientSearchQuery('');
  }, [editingRecipe, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpenIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Add a new empty row
  const handleAddIngredientRow = () => {
    setItems((prev) => [
      ...prev,
      {
        ingredientId: '',
        quantity: 100,
        yieldPercent: 100,
      },
    ]);
    // Automatically open the selector for the newly added row
    setDropdownOpenIndex(items.length);
    setIngredientSearchQuery('');
  };

  // Remove a row
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    if (dropdownOpenIndex === index) {
      setDropdownOpenIndex(null);
    }
  };

  // Update item field
  const handleUpdateItem = (index: number, updates: Partial<RecipeIngredientItem>) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  // Select an ingredient for a specific row
  const handleSelectIngredient = (index: number, ingredientId: string) => {
    handleUpdateItem(index, { ingredientId });
    setDropdownOpenIndex(null);
    setIngredientSearchQuery('');
  };

  // Calculate live item costs
  const calculatedItems = items.map((item) => {
    const ing = ingredientsMap.get(item.ingredientId);
    return calculateRecipeItemCost(item, ing);
  });

  // Calculate total recipe cost
  const totalRecipeCost = calculatedItems.reduce((acc, curr) => acc + curr.totalCost, 0);

  // Validate and submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = language === 'fr' ? 'Le nom du plat est requis.' : 'Dish name is required.';
    }

    if (!portionSize || Number(portionSize) <= 0) {
      newErrors.portionSize =
        language === 'fr' ? 'La taille de portion doit être > 0.' : 'Portion size must be > 0.';
    }

    if (!portionUnit.trim()) {
      newErrors.portionUnit =
        language === 'fr' ? 'L’unité de portion est requise.' : 'Portion unit is required.';
    }

    if (items.length === 0) {
      newErrors.items = t.mustHaveIngredients;
    } else {
      const hasUnselected = items.some((it) => !it.ingredientId);
      if (hasUnselected) {
        newErrors.items =
          language === 'fr'
            ? 'Veuillez sélectionner un ingrédient valide pour chaque ligne.'
            : 'Please select a valid ingredient for each row.';
      }
      const hasInvalidQty = items.some((it) => !it.quantity || it.quantity <= 0);
      if (hasInvalidQty) {
        newErrors.items =
          language === 'fr'
            ? 'Chaque ingrédient doit avoir une quantité supérieure à 0.'
            : 'Every ingredient must have a quantity greater than 0.';
      }
      const hasInvalidYield = items.some((it) => !it.yieldPercent || it.yieldPercent <= 0);
      if (hasInvalidYield) {
        newErrors.items =
          language === 'fr'
            ? 'Le rendement (Yield %) doit être supérieur à 0%.'
            : 'Yield % must be greater than 0%.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSaving(true);
      const recipeData: Omit<Recipe, 'id'> = {
        tenantId: '', // Set by App handler
        name: name.trim(),
        category,
        portionSize: Number(portionSize),
        portionUnit: portionUnit.trim(),
        monthlySalesVolume: typeof monthlySalesVolume === 'number' ? monthlySalesVolume : 0,
        notes: notes.trim(),
        currentMenuPrice: editingRecipe?.currentMenuPrice,
        manualPriceOverride: editingRecipe?.manualPriceOverride,
        recipeIngredients: items.map((it) => ({
          ingredientId: it.ingredientId,
          quantity: Number(it.quantity),
          yieldPercent: Number(it.yieldPercent) || 100,
        })),
        updatedAt: new Date().toISOString(),
      };

      await onSave(recipeData);
      onClose();
    } catch (err) {
      console.error('Error submitting recipe:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter available ingredients for search dropdown
  const filteredAvailableIngredients = ingredients.filter((ing) => {
    const q = ingredientSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      ing.name.toLowerCase().includes(q) ||
      (ing.supplier && ing.supplier.toLowerCase().includes(q)) ||
      (t.categories[ing.category] && t.categories[ing.category].toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-[#0A1F44] text-white px-6 py-4 flex items-center justify-between border-b border-[#153266]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-[#153266] border border-[#244580] flex items-center justify-center text-emerald-400">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {editingRecipe ? t.editRecipe : t.addRecipe}
              </h2>
              <p className="text-xs text-slate-300">
                {t.recipeTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Error Alert */}
          {errors.items && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2.5 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errors.items}</span>
            </div>
          )}

          {/* Section 1: Basic Recipe Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Dish Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                {t.recipeName} <span className="text-rose-500">*</span>
              </label>
              <input
                id="recipe-form-name-input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder={t.recipeNamePlaceholder}
                className={`w-full px-3.5 py-2 text-sm bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all ${
                  errors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200'
                }`}
              />
              {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
            </div>

            {/* Recipe Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                {t.recipeCategory} <span className="text-rose-500">*</span>
              </label>
              <select
                id="recipe-form-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as RecipeCategory)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              >
                {RECIPE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {t.recipeCategories[cat] || cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Portion Size & Unit */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  {t.portionSize} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="recipe-form-portion-size-input"
                  type="number"
                  step="any"
                  min="0.1"
                  value={portionSize}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    setPortionSize(val);
                    if (errors.portionSize) setErrors((prev) => ({ ...prev, portionSize: '' }));
                  }}
                  placeholder={t.portionSizePlaceholder}
                  className={`w-full px-3 py-2 text-sm font-mono bg-slate-50 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all ${
                    errors.portionSize ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  {t.portionUnit} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="recipe-form-portion-unit-input"
                  type="text"
                  value={portionUnit}
                  onChange={(e) => {
                    setPortionUnit(e.target.value);
                    if (errors.portionUnit) setErrors((prev) => ({ ...prev, portionUnit: '' }));
                  }}
                  placeholder={t.portionUnitPlaceholder}
                  className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all ${
                    errors.portionUnit ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200'
                  }`}
                />
              </div>
            </div>

            {/* Preparation Notes */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                {t.preparationNotes}
              </label>
              <textarea
                id="recipe-form-notes-input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.preparationNotesPlaceholder}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Monthly Sales Volume (for Menu Engineering) */}
            <div className="sm:col-span-2 bg-blue-50/40 p-3 rounded-lg border border-blue-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#0A1F44]">
                    {t.monthlySalesVolumeLabel}
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {t.monthlySalesVolumeHelp}
                  </p>
                </div>
                <div className="w-full sm:w-36">
                  <input
                    id="recipe-form-sales-volume-input"
                    type="number"
                    min="0"
                    step="1"
                    value={monthlySalesVolume}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                      setMonthlySalesVolume(isNaN(val as number) ? '' : val);
                    }}
                    placeholder={t.monthlySalesVolumePlaceholder}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A1F44] text-slate-900 transition-all"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Section 2: Recipe Ingredients Composition Builder */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#0A1F44]">
                  {t.recipeIngredientsSection}
                </h3>
                <p className="text-xs text-slate-500">
                  {t.yieldHelp}
                </p>
              </div>

              <button
                id="add-recipe-ingredient-row-btn"
                type="button"
                onClick={handleAddIngredientRow}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0A1F44] hover:bg-[#153266] rounded-lg transition-colors shadow-2xs self-start"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.addIngredientRow}</span>
              </button>
            </div>

            {/* Ingredients table rows */}
            {items.length === 0 ? (
              <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50/50">
                <p className="text-xs text-slate-500 mb-3">
                  {language === 'fr'
                    ? 'Aucun ingrédient ajouté pour le moment. Cliquez sur le bouton ci-dessous pour ajouter un ingrédient à cette fiche recette.'
                    : 'No ingredients added yet. Click below to add an ingredient to this recipe card.'}
                </p>
                <button
                  type="button"
                  onClick={handleAddIngredientRow}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.addIngredientRow}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {items.map((item, index) => {
                  const selectedIng = ingredientsMap.get(item.ingredientId);
                  const calc = calculatedItems[index];
                  const isDropdownOpen = dropdownOpenIndex === index;

                  return (
                    <div
                      key={index}
                      className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 space-y-3 relative hover:border-slate-300 transition-colors"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        
                        {/* Column 1: Ingredient Selector (Searchable Dropdown) */}
                        <div className="md:col-span-5 relative" ref={isDropdownOpen ? dropdownRef : undefined}>
                          <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                            {t.ingredientName} #{index + 1}
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              setDropdownOpenIndex(isDropdownOpen ? null : index);
                              setIngredientSearchQuery('');
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs bg-white border rounded-lg text-left transition-all ${
                              !item.ingredientId
                                ? 'border-amber-300 text-slate-500 bg-amber-50/30'
                                : 'border-slate-300 text-slate-900 font-medium'
                            }`}
                          >
                            <span className="truncate">
                              {selectedIng ? (
                                <span className="flex items-center space-x-1.5 truncate">
                                  <span>{selectedIng.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ({selectedIng.recipeUnit})
                                  </span>
                                </span>
                              ) : (
                                t.selectIngredient
                              )}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />
                          </button>

                          {/* Searchable Dropdown Popup */}
                          {isDropdownOpen && (
                            <div className="absolute left-0 top-full mt-1 w-full sm:w-80 bg-white border border-slate-300 rounded-xl shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
                              {/* Search Box inside dropdown */}
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  autoFocus
                                  value={ingredientSearchQuery}
                                  onChange={(e) => setIngredientSearchQuery(e.target.value)}
                                  placeholder={t.searchIngredientInSelect}
                                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>

                              {/* Ingredients list */}
                              <div className="max-h-52 overflow-y-auto space-y-0.5 py-1">
                                {filteredAvailableIngredients.length === 0 ? (
                                  <div className="p-3 text-center text-xs text-slate-500">
                                    {language === 'fr'
                                      ? 'Aucun ingrédient trouvé.'
                                      : 'No ingredient found.'}
                                  </div>
                                ) : (
                                  filteredAvailableIngredients.map((ing) => {
                                    const isSelected = item.ingredientId === ing.id;
                                    const unitCost = getIngredientUnitCost(ing);
                                    const catStyle = CATEGORY_COLORS[ing.category] || CATEGORY_COLORS['overig'];

                                    return (
                                      <button
                                        key={ing.id}
                                        type="button"
                                        onClick={() => ing.id && handleSelectIngredient(index, ing.id)}
                                        className={`w-full text-left px-2.5 py-2 rounded-md text-xs flex items-center justify-between hover:bg-slate-100 transition-colors ${
                                          isSelected ? 'bg-emerald-50 text-emerald-900 font-medium' : 'text-slate-800'
                                        }`}
                                      >
                                        <div className="truncate pr-2">
                                          <div className="flex items-center space-x-1.5">
                                            <span className="truncate">{ing.name}</span>
                                            <span
                                              className={`text-[9px] px-1 py-0.2 rounded border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                                            >
                                              {ing.recipeUnit}
                                            </span>
                                          </div>
                                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                            {formatMAD(unitCost, 3)} MAD / {ing.recipeUnit}
                                          </div>
                                        </div>
                                        {isSelected && (
                                          <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                        )}
                                      </button>
                                    );
                                  })
                                )}
                              </div>

                              {/* Footer link to switch to ingredients tab if ingredient is missing */}
                              <div className="border-t border-slate-100 pt-1.5 px-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onNavigateToIngredientsTab();
                                  }}
                                  className="w-full text-left text-[11px] text-emerald-700 hover:text-emerald-800 font-medium flex items-center space-x-1 py-1"
                                >
                                  <Plus className="w-3 h-3 text-emerald-600" />
                                  <span>{t.addIngredient} (tab)</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Column 2: Net Quantity */}
                        <div className="md:col-span-3">
                          <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                            {t.quantity} {selectedIng ? `(${selectedIng.recipeUnit})` : ''}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="any"
                              min="0.001"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                handleUpdateItem(index, { quantity: val });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-mono pointer-events-none">
                              {selectedIng?.recipeUnit || 'unit'}
                            </span>
                          </div>
                        </div>

                        {/* Column 3: Yield % */}
                        <div className="md:col-span-2">
                          <label
                            className="block text-[11px] font-mono uppercase text-slate-500 mb-1"
                            title={t.yieldHelp}
                          >
                            Yield %
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="1"
                              min="1"
                              max="100"
                              value={item.yieldPercent}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 100 : parseFloat(e.target.value);
                                handleUpdateItem(index, { yieldPercent: val });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-mono pointer-events-none">
                              %
                            </span>
                          </div>
                        </div>

                        {/* Column 4: Subtotal Cost & Delete Button */}
                        <div className="md:col-span-2 flex items-center justify-between md:justify-end space-x-2 pt-2 md:pt-4">
                          <div className="text-right">
                            <span className="block text-[10px] text-slate-400 font-mono uppercase">
                              {t.lineCost}
                            </span>
                            <span className="font-mono text-xs font-bold text-emerald-700">
                              {formatMAD(calc?.totalCost || 0)} MAD
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title={language === 'fr' ? 'Supprimer cette ligne' : 'Remove row'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>

                      {/* Line Helper Details (Gross quantity & formula breakdown) */}
                      {selectedIng && item.quantity > 0 && (
                        <div className="text-[11px] text-slate-500 font-mono flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 border-t border-slate-200/60">
                          <span>
                            {t.rawQuantity}:{' '}
                            <strong className="text-slate-800">
                              {calc?.rawQuantity.toFixed(2)} {selectedIng.recipeUnit}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            {t.unitCostLabel}:{' '}
                            <strong className="text-slate-800">
                              {formatMAD(calc?.unitCost || 0, 3)} MAD/{selectedIng.recipeUnit}
                            </strong>
                          </span>
                          {item.yieldPercent < 100 && (
                            <>
                              <span>•</span>
                              <span className="text-amber-700">
                                {100 - item.yieldPercent}% {language === 'fr' ? 'perte' : 'waste'}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Missing ingredient notice box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start space-x-2 text-xs text-slate-600">
            <Info className="w-4 h-4 text-[#0A1F44] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-800">
                {t.ingredientNeedsCreateNotice}
              </p>
            </div>
          </div>

        </form>

        {/* Modal Footer / Sticky Live Cost Summary */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Live Total Cost Badge */}
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                {t.totalRecipeCost}
              </p>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
                  {formatMAD(totalRecipeCost)}
                </span>
                <span className="text-sm font-semibold text-slate-600 font-sans">
                  {t.currencyMAD}
                </span>
                <span className="text-xs text-slate-400 font-normal">
                  / {portionSize || 1} {portionUnit}
                </span>
              </div>
            </div>

            <div className="sm:hidden text-right">
              <span className="text-xs font-mono text-slate-500">
                {items.length} ingr.
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            <button
              id="recipe-form-cancel-btn"
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
            >
              {t.cancel}
            </button>

            <button
              id="recipe-form-save-btn"
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 rounded-lg transition-colors shadow-2xs flex items-center space-x-2"
            >
              {isSaving && (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
              )}
              <span>{isSaving ? t.saving : t.save}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
