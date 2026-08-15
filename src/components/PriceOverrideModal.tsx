import React, { useState, useEffect } from 'react';
import { Recipe, Language } from '../types';
import { translations } from '../lib/i18n';
import { RecipePricingCalculation, formatMAD } from '../lib/recipeCalculations';
import { X, Check, RotateCcw, AlertTriangle, HelpCircle, DollarSign } from 'lucide-react';

interface PriceOverrideModalProps {
  recipe: Recipe | null;
  pricingCalc: RecipePricingCalculation | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveOverride: (recipeId: string, newOverridePrice?: number) => Promise<void>;
  language: Language;
}

export const PriceOverrideModal: React.FC<PriceOverrideModalProps> = ({
  recipe,
  pricingCalc,
  isOpen,
  onClose,
  onSaveOverride,
  language,
}) => {
  const t = translations[language];

  const [priceInput, setPriceInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recipe && pricingCalc) {
      if (typeof recipe.manualPriceOverride === 'number' && recipe.manualPriceOverride > 0) {
        setPriceInput(recipe.manualPriceOverride.toString());
      } else {
        setPriceInput(pricingCalc.recommendedPriceInclTva.toFixed(2));
      }
      setError(null);
    }
  }, [recipe, pricingCalc, isOpen]);

  if (!isOpen || !recipe || !pricingCalc) return null;

  // Live calculation preview in modal
  const enteredPriceNum = parseFloat(priceInput) || 0;
  const tva = pricingCalc.tvaPercentage;
  const enteredPriceExclTva = tva >= 0 ? enteredPriceNum / (1 + tva / 100) : enteredPriceNum;
  const enteredFoodCost =
    enteredPriceExclTva > 0 && pricingCalc.portionCost > 0
      ? (pricingCalc.portionCost / enteredPriceExclTva) * 100
      : 0;
  const foodCostDelta = enteredFoodCost - pricingCalc.targetFoodCostPercentage;
  const absDelta = Math.abs(foodCostDelta);

  let previewStatus: 'target' | 'warning' | 'critical' = 'target';
  if (absDelta <= 2) previewStatus = 'target';
  else if (absDelta <= 5) previewStatus = 'warning';
  else previewStatus = 'critical';

  const previewMargin = enteredPriceExclTva - pricingCalc.portionCost;
  const previewGlovo =
    pricingCalc.deliveryCommissionPercentage < 100
      ? enteredPriceNum / (1 - pricingCalc.deliveryCommissionPercentage / 100)
      : 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipe.id) return;

    if (enteredPriceNum <= 0) {
      setError(language === 'fr' ? 'Le prix de vente doit être supérieur à 0' : 'Price must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveOverride(recipe.id, enteredPriceNum);
      onClose();
    } catch (err: any) {
      setError(err?.message || t.toastError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearOverride = async () => {
    if (!recipe.id) return;
    setIsSubmitting(true);
    try {
      await onSaveOverride(recipe.id, undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || t.toastError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-[#0A1F44] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#153266] border border-[#244580] flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {t.overrideModalTitle}
              </h3>
              <p className="text-xs text-slate-300 truncate max-w-xs">
                {recipe.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <p className="text-xs text-slate-600">
            {t.overrideModalDesc}
          </p>

          {/* Reference Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-slate-600">
              <span>{t.colPortionCost}:</span>
              <span className="font-bold text-slate-800">{formatMAD(pricingCalc.portionCost)} MAD</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{language === 'fr' ? 'Prix cible auto (HT)' : 'Target auto (Excl. VAT)'}:</span>
              <span>{formatMAD(pricingCalc.recommendedPriceExclTva)} MAD</span>
            </div>
            <div className="flex justify-between text-emerald-800 font-semibold bg-emerald-50/70 p-1 rounded">
              <span>{language === 'fr' ? 'Prix cible auto (TTC)' : 'Target auto (Incl. VAT)'}:</span>
              <span>{formatMAD(pricingCalc.recommendedPriceInclTva)} MAD</span>
            </div>
          </div>

          {/* Manual Input Field */}
          <div>
            <label
              htmlFor="manual-price-override-input"
              className="block text-xs font-bold text-slate-800 mb-1.5"
            >
              {t.overrideInputLabel}
            </label>
            <div className="relative">
              <input
                id="manual-price-override-input"
                type="number"
                step="0.5"
                min="1"
                required
                value={priceInput}
                onChange={(e) => {
                  setPriceInput(e.target.value);
                  setError(null);
                }}
                className="w-full px-3.5 py-2.5 text-base font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0A1F44] focus:border-transparent outline-none pr-14"
                placeholder="Ex: 85.00"
                autoFocus
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                MAD TTC
              </span>
            </div>
            {error && <p className="text-xs text-rose-600 font-medium mt-1">{error}</p>}
          </div>

          {/* Live Impact Preview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
              {language === 'fr' ? 'Impact direct sur la rentabilité' : 'Profitability Impact Preview'}
            </span>

            <div className="grid grid-cols-3 gap-2 text-center">
              {/* Actual Food Cost % */}
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 block">
                  {t.colActualFoodCost}
                </span>
                <span
                  className={`text-sm font-mono font-bold inline-block px-1.5 py-0.5 rounded mt-0.5 ${
                    previewStatus === 'target'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : previewStatus === 'warning'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {enteredFoodCost > 0 ? enteredFoodCost.toFixed(1) : '0.0'}%
                </span>
              </div>

              {/* Margin MAD */}
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 block">
                  {t.colMarginMAD}
                </span>
                <span className="text-sm font-mono font-bold text-slate-800 block mt-0.5">
                  {formatMAD(previewMargin)} MAD
                </span>
              </div>

              {/* Glovo Price */}
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 block">
                  Glovo (+{pricingCalc.deliveryCommissionPercentage}%)
                </span>
                <span className="text-sm font-mono font-bold text-amber-800 block mt-0.5">
                  {formatMAD(previewGlovo)} MAD
                </span>
              </div>
            </div>
          </div>

          {/* Buttons / Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <div>
              {recipe.manualPriceOverride ? (
                <button
                  type="button"
                  onClick={handleClearOverride}
                  disabled={isSubmitting}
                  className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.clearOverrideTooltip}</span>
                </button>
              ) : null}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {t.cancel}
              </button>
              <button
                id="save-price-override-btn"
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmitting ? t.saving : t.save}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
