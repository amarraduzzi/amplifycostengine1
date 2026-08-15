import React, { useState, useEffect } from 'react';
import { Ingredient, IngredientCategory, PurchaseUnit, RecipeUnit, Language } from '../types';
import { translations, CATEGORY_COLORS } from '../lib/i18n';
import { X, Save, AlertCircle, Calculator } from 'lucide-react';

interface IngredientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ingredientData: Omit<Ingredient, 'id'>) => Promise<void>;
  initialIngredient?: Ingredient | null;
  tenantId: string;
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

const PURCHASE_UNITS: PurchaseUnit[] = ['kg', 'g', 'l', 'ml', 'stuk'];
const RECIPE_UNITS: RecipeUnit[] = ['g', 'ml', 'stuk'];

export const IngredientFormModal: React.FC<IngredientFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialIngredient,
  tenantId,
  language,
}) => {
  const t = translations[language];
  const isEdit = Boolean(initialIngredient);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<IngredientCategory>('groente');
  const [purchaseUnit, setPurchaseUnit] = useState<PurchaseUnit>('kg');
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [recipeUnit, setRecipeUnit] = useState<RecipeUnit>('g');
  const [conversionFactor, setConversionFactor] = useState<string>('1000');
  const [supplier, setSupplier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form state when opening or switching initialIngredient
  useEffect(() => {
    if (initialIngredient) {
      setName(initialIngredient.name);
      setCategory(initialIngredient.category);
      setPurchaseUnit(initialIngredient.purchaseUnit);
      setPurchasePrice(initialIngredient.purchasePrice.toString());
      setRecipeUnit(initialIngredient.recipeUnit);
      setConversionFactor(initialIngredient.conversionFactor.toString());
      setSupplier(initialIngredient.supplier || '');
    } else {
      setName('');
      setCategory('groente');
      setPurchaseUnit('kg');
      setPurchasePrice('');
      setRecipeUnit('g');
      setConversionFactor('1000');
      setSupplier('');
    }
    setError(null);
  }, [initialIngredient, isOpen]);

  // Smart suggestion for conversion factor when units change
  const handlePurchaseUnitChange = (pUnit: PurchaseUnit) => {
    setPurchaseUnit(pUnit);
    if (pUnit === 'kg') {
      setRecipeUnit('g');
      setConversionFactor('1000');
    } else if (pUnit === 'g') {
      setRecipeUnit('g');
      setConversionFactor('1');
    } else if (pUnit === 'l') {
      setRecipeUnit('ml');
      setConversionFactor('1000');
    } else if (pUnit === 'ml') {
      setRecipeUnit('ml');
      setConversionFactor('1');
    } else if (pUnit === 'stuk') {
      setRecipeUnit('stuk');
      setConversionFactor('1');
    }
  };

  const parsedPrice = parseFloat(purchasePrice) || 0;
  const parsedFactor = parseFloat(conversionFactor) || 1;
  const calculatedCost = parsedFactor > 0 ? parsedPrice / parsedFactor : 0;

  const hasPriceChanged = isEdit && initialIngredient && Math.abs(initialIngredient.purchasePrice - parsedPrice) > 0.001;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(language === 'fr' ? 'Le nom de l’ingrédient est requis.' : 'Ingredient name is required.');
      return;
    }
    if (parsedPrice < 0 || isNaN(parsedPrice)) {
      setError(language === 'fr' ? 'Le prix d’achat doit être un nombre positif.' : 'Purchase price must be positive.');
      return;
    }
    if (parsedFactor <= 0 || isNaN(parsedFactor)) {
      setError(language === 'fr' ? 'Le facteur de conversion doit être supérieur à 0.' : 'Conversion factor must be > 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Handle automatic price history logging if price has changed during edit
      let updatedPriceHistory = [...(initialIngredient?.priceHistory || [])];
      if (isEdit && initialIngredient && hasPriceChanged) {
        updatedPriceHistory.push({
          price: initialIngredient.purchasePrice,
          date: new Date().toISOString(),
          note: `Ajusté vers ${parsedPrice} MAD`,
        });
      }

      await onSubmit({
        tenantId,
        name: name.trim(),
        category,
        purchaseUnit,
        purchasePrice: parsedPrice,
        recipeUnit,
        conversionFactor: parsedFactor,
        supplier: supplier.trim() || undefined,
        updatedAt: new Date().toISOString(),
        priceHistory: updatedPriceHistory,
      });

      onClose();
    } catch (err: any) {
      setError(err?.message || t.toastError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-semibold text-[#0A1F44]">
              {isEdit ? t.editIngredient : t.addIngredient}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Tenant: {tenantId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Ingredient Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t.ingredientName} <span className="text-rose-500">*</span>
            </label>
            <input
              id="ingredient-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.ingredientNamePlaceholder}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0A1F44] focus:border-[#0A1F44] transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t.category} <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition-all ${
                      isSelected
                        ? 'border-[#0A1F44] bg-slate-100 text-[#0A1F44] font-semibold ring-1 ring-[#0A1F44]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="block truncate">{t.categories[cat]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Purchasing Details (Unit & Price in MAD) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.purchaseUnit} <span className="text-rose-500">*</span>
              </label>
              <select
                id="purchase-unit-select"
                value={purchaseUnit}
                onChange={(e) => handlePurchaseUnitChange(e.target.value as PurchaseUnit)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0A1F44] focus:border-[#0A1F44]"
              >
                {PURCHASE_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {t.purchaseUnits[u]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.purchasePriceUnit} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="purchase-price-input"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-3 pr-14 py-2 font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0A1F44] focus:border-[#0A1F44]"
                />
                <span className="absolute right-3 top-2 text-xs font-mono font-medium text-slate-400">
                  MAD
                </span>
              </div>
            </div>
          </div>

          {/* Automatic Price Change Archiving Alert */}
          {hasPriceChanged && (
            <div className="bg-slate-100 border border-slate-300 p-3 rounded-lg text-xs text-slate-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#0A1F44]" />
              <div>
                <p className="font-medium">
                  {t.priceChangeNotice.replace('{oldPrice}', initialIngredient.purchasePrice.toString())}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  Ancien prix: {initialIngredient.purchasePrice} MAD ➔ Nouveau prix: {parsedPrice} MAD
                </p>
              </div>
            </div>
          )}

          {/* Recipe Unit & Conversion Factor */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#0A1F44]">
              <Calculator className="w-3.5 h-3.5 text-emerald-600" />
              <span>Conversion & Coût recette</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  {t.recipeUnit}
                </label>
                <select
                  id="recipe-unit-select"
                  value={recipeUnit}
                  onChange={(e) => setRecipeUnit(e.target.value as RecipeUnit)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-900"
                >
                  {RECIPE_UNITS.map((ru) => (
                    <option key={ru} value={ru}>
                      {t.recipeUnits[ru]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  {t.conversionFactor}
                </label>
                <input
                  id="conversion-factor-input"
                  type="number"
                  step="any"
                  min="0.0001"
                  required
                  value={conversionFactor}
                  onChange={(e) => setConversionFactor(e.target.value)}
                  placeholder="1000"
                  className="w-full px-2.5 py-1.5 font-mono tabular-nums bg-white border border-slate-300 rounded-md text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
              <span className="text-slate-500">
                1 {purchaseUnit} = {parsedFactor} {recipeUnit}
              </span>
              <span className="font-mono font-bold tabular-nums text-[#0A1F44]">
                {calculatedCost > 0 ? calculatedCost.toFixed(4) : '0.0000'} MAD / {recipeUnit}
              </span>
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t.supplierOptional}
            </label>
            <input
              id="supplier-input"
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder={t.supplierPlaceholder}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0A1F44] focus:border-[#0A1F44] transition-colors"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              id="cancel-ingredient-modal-btn"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {t.cancel}
            </button>
            <button
              id="save-ingredient-modal-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? t.saving : t.save}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
