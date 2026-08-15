import React from 'react';
import { Ingredient, Language } from '../types';
import { translations, CATEGORY_COLORS } from '../lib/i18n';
import { X, History, Clock } from 'lucide-react';

interface PriceHistoryModalProps {
  ingredient: Ingredient | null;
  onClose: () => void;
  language: Language;
}

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({
  ingredient,
  onClose,
  language,
}) => {
  const t = translations[language];

  if (!ingredient) return null;

  const history = ingredient.priceHistory || [];
  const color = CATEGORY_COLORS[ingredient.category];

  // Helper to format dates
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0A1F44]">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#0A1F44]">
                {t.priceHistoryTitle}
              </h2>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-xs font-medium text-slate-700">
                  {ingredient.name}
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${color.bg} ${color.text} ${color.border}`}>
                  {t.categories[ingredient.category]}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Current Active Price Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                {language === 'fr' ? 'Prix d’achat actuel' : 'Current Purchase Price'}
              </span>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-2xl font-bold font-mono tabular-nums text-[#0A1F44]">
                  {ingredient.purchasePrice.toFixed(2)}
                </span>
                <span className="text-xs font-mono font-medium text-emerald-700">
                  MAD / {ingredient.purchaseUnit}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                = {(ingredient.purchasePrice / ingredient.conversionFactor).toFixed(4)} MAD / {ingredient.recipeUnit}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 block">
                {t.lastUpdated}
              </span>
              <span className="text-xs font-mono text-slate-700">
                {formatDate(ingredient.updatedAt)}
              </span>
            </div>
          </div>

          {/* Price History Timeline */}
          <div>
            <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-slate-500 mb-3">
              {language === 'fr' ? 'Évolution des tarifs' : 'Price Adjustments'} ({history.length})
            </h3>

            {history.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <Clock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">
                  {t.noPriceHistory}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  {language === 'fr'
                    ? 'Chaque fois que vous modifiez le prix d’achat d’un ingrédient, l’ancien tarif est archivé ici.'
                    : 'Whenever you edit this ingredient’s price, the previous rate is archived here.'}
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                
                {/* Current entry on top of timeline */}
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
                  <div className="bg-white border border-slate-200 p-3 rounded-lg flex items-center justify-between shadow-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold font-mono tabular-nums text-[#0A1F44]">
                          {ingredient.purchasePrice.toFixed(2)} MAD
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                          {language === 'fr' ? 'Actif' : 'Active'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatDate(ingredient.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Historical entries */}
                {[...history].reverse().map((entry, index) => {
                  return (
                    <div key={index} className="relative">
                      <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold font-mono tabular-nums text-slate-700">
                              {entry.price.toFixed(2)} MAD
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              / {ingredient.purchaseUnit}
                            </span>
                          </div>
                          {entry.note && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {entry.note}
                            </p>
                          )}
                          <span className="text-[11px] text-slate-400 font-mono">
                            {formatDate(entry.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

              </div>
            )}

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            id="close-history-modal-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};
