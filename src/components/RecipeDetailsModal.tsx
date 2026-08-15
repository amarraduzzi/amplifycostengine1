import React from 'react';
import { Recipe, Ingredient, Language } from '../types';
import { translations, RECIPE_CATEGORY_COLORS, CATEGORY_COLORS } from '../lib/i18n';
import { calculateRecipeCostBreakdown, calculateRecipePricing, formatMAD } from '../lib/recipeCalculations';
import { exportRecipeCostSheetPDF } from '../lib/pdfExport';
import {
  X,
  UtensilsCrossed,
  Edit2,
  FileText,
  AlertTriangle,
  Printer,
  Calendar,
  Layers,
  Scale,
  Download,
} from 'lucide-react';

interface RecipeDetailsModalProps {
  recipe: Recipe | null;
  ingredientsMap: Map<string, Ingredient>;
  targetFoodCost?: number;
  tvaPercentage?: number;
  deliveryCommission?: number;
  restaurantName?: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (recipe: Recipe) => void;
  language: Language;
}

export const RecipeDetailsModal: React.FC<RecipeDetailsModalProps> = ({
  recipe,
  ingredientsMap,
  targetFoodCost = 30,
  tvaPercentage = 20,
  deliveryCommission = 27,
  restaurantName,
  isOpen,
  onClose,
  onEdit,
  language,
}) => {
  const t = translations[language];

  if (!isOpen || !recipe) return null;

  const breakdown = calculateRecipeCostBreakdown(recipe, ingredientsMap);
  const pricing = calculateRecipePricing(
    recipe,
    ingredientsMap,
    targetFoodCost,
    tvaPercentage,
    deliveryCommission
  );
  const categoryStyle = RECIPE_CATEGORY_COLORS[recipe.category] || RECIPE_CATEGORY_COLORS['hoofdgerecht'];

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    exportRecipeCostSheetPDF(
      recipe,
      ingredientsMap,
      targetFoodCost,
      tvaPercentage,
      deliveryCommission,
      language,
      restaurantName
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150 print:p-0 print:bg-white">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none">
        
        {/* Header */}
        <div className="bg-[#0A1F44] text-white px-6 py-4 flex items-center justify-between border-b border-[#153266] print:bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-[#153266] border border-[#244580] flex items-center justify-center text-emerald-400">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border mb-1 ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
              >
                {t.recipeCategories[recipe.category] || recipe.category}
              </span>
              <h2 className="text-base font-bold text-white leading-tight">
                {recipe.name}
              </h2>
            </div>
          </div>
          <div className="flex items-center space-x-2 print:hidden">
            {/* PDF Export Button */}
            <button
              id="recipe-export-pdf-header-btn"
              type="button"
              onClick={handleExportPDF}
              className="flex items-center space-x-1.5 bg-[#16A34A] hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
              title="Exporter la fiche technique en PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.exportPDF}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="text-slate-300 hover:text-white p-1.5 rounded-md hover:bg-white/10 transition-colors"
              title={language === 'fr' ? 'Imprimer la fiche technique' : 'Print recipe sheet'}
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1.5 rounded-md hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Total Cost */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-center">
              <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-900 font-semibold">
                {t.costPerPortion}
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-800 mt-0.5">
                {formatMAD(breakdown.totalCost)}{' '}
                <span className="text-xs font-sans font-normal text-emerald-700">{t.currencyMAD}</span>
              </p>
            </div>

            {/* Current Menu Reference Price */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-center">
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#0A1F44] font-semibold">
                {t.colCurrentMenuPrice}
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-[#0A1F44] mt-0.5">
                {recipe.currentMenuPrice !== undefined ? formatMAD(recipe.currentMenuPrice) : '—'}{' '}
                <span className="text-xs font-sans font-normal text-slate-500">{t.currencyMAD}</span>
              </p>
            </div>

            {/* Portion Size */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                {t.portionSize}
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-slate-800 mt-0.5">
                {recipe.portionSize}{' '}
                <span className="text-xs font-sans font-normal text-slate-500">{recipe.portionUnit}</span>
              </p>
            </div>

            {/* Recommended Selling Price Incl. VAT */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-600 font-semibold">
                {t.colRecommendedInclTva}
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-slate-800 mt-0.5">
                {formatMAD(pricing.recommendedPriceInclTva)}{' '}
                <span className="text-xs font-sans font-normal text-slate-500">{t.currencyMAD}</span>
              </p>
            </div>
          </div>

          {/* Missing Ingredients Warning */}
          {breakdown.hasMissingIngredients && (
            <div className="flex items-start space-x-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{t.missingIngredientsWarning}</span>
            </div>
          )}

          {/* Preparation Notes */}
          {recipe.notes && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono mb-1.5 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.preparationNotes}</span>
              </h4>
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {recipe.notes}
              </p>
            </div>
          )}

          {/* Composition & Ingredients Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 font-mono flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0A1F44]" />
                <span>{t.compositionBreakdown}</span>
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                {breakdown.items.length} {language === 'fr' ? 'ingrédients' : 'ingredients'}
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-3 font-semibold">{t.ingredientName}</th>
                    <th className="py-2.5 px-3 font-semibold text-right">{t.quantity}</th>
                    <th className="py-2.5 px-2.5 font-semibold text-center hidden sm:table-cell">{t.yieldPercent}</th>
                    <th className="py-2.5 px-2.5 font-semibold text-right hidden sm:table-cell">{t.rawQuantity}</th>
                    <th className="py-2.5 px-3 font-semibold text-right">{t.lineCost}</th>
                    <th className="py-2.5 px-3 font-semibold text-right">% Coût</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-mono">
                  {breakdown.items.map((item, idx) => {
                    const costShare =
                      breakdown.totalCost > 0
                        ? ((item.totalCost / breakdown.totalCost) * 100).toFixed(1)
                        : '0.0';

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        {/* Name & Category */}
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                          <div className="flex items-center space-x-2">
                            <span>{item.ingredientName}</span>
                            {item.ingredientNotFound && (
                              <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-mono">
                                Supprimé
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Net Quantity */}
                        <td className="py-2.5 px-3 text-right text-slate-700">
                          {item.quantity} <span className="text-slate-400">{item.recipeUnit}</span>
                        </td>

                        {/* Yield % */}
                        <td className="py-2.5 px-2.5 text-center text-slate-600 hidden sm:table-cell">
                          {item.yieldPercent}%
                        </td>

                        {/* Gross Quantity */}
                        <td className="py-2.5 px-2.5 text-right text-slate-600 hidden sm:table-cell">
                          {item.rawQuantity.toFixed(2)}{' '}
                          <span className="text-slate-400">{item.recipeUnit}</span>
                        </td>

                        {/* Line Cost (MAD) */}
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                          {formatMAD(item.totalCost)}{' '}
                          <span className="text-[10px] font-normal text-slate-400">{t.currencyMAD}</span>
                        </td>

                        {/* Cost % Share */}
                        <td className="py-2.5 px-3 text-right text-slate-500 text-[11px]">
                          {costShare}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/80 border-t border-slate-200 font-semibold text-xs">
                    <td className="py-2.5 px-3 text-slate-900 font-sans">
                      {t.totalRecipeCost}
                    </td>
                    <td colSpan={3} className="hidden sm:table-cell"></td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm font-bold text-emerald-800">
                      {formatMAD(breakdown.totalCost)} {t.currencyMAD}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      100%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Last updated footer date */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>
                {t.lastUpdated}: {new Date(recipe.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <span>Amplify Cost Engine • Technical Sheet</span>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
          >
            {t.close}
          </button>

          <div className="flex items-center space-x-2">
            <button
              id="recipe-export-pdf-bottom-btn"
              type="button"
              onClick={handleExportPDF}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors shadow-2xs flex items-center space-x-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.exportPDF}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(recipe);
              }}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0A1F44] hover:bg-[#153266] rounded-lg transition-colors shadow-2xs flex items-center space-x-2"
            >
              <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.editRecipe}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
