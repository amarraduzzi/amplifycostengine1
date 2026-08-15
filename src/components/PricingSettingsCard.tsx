import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { translations } from '../lib/i18n';
import { Sliders, Percent, Truck, Check, RefreshCw, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface PricingSettingsCardProps {
  targetFoodCost: number;
  tvaPercentage: number;
  deliveryCommission: number;
  onSaveSettings: (settings: {
    targetFoodCostPercentage: number;
    tvaPercentage: number;
    deliveryCommissionPercentage: number;
  }) => Promise<void>;
  language: Language;
}

export const PricingSettingsCard: React.FC<PricingSettingsCardProps> = ({
  targetFoodCost,
  tvaPercentage,
  deliveryCommission,
  onSaveSettings,
  language,
}) => {
  const t = translations[language];

  const [isOpen, setIsOpen] = useState(true);
  const [targetFC, setTargetFC] = useState<number>(targetFoodCost);
  const [tva, setTva] = useState<number>(tvaPercentage);
  const [deliveryComm, setDeliveryComm] = useState<number>(deliveryCommission);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Sync with prop updates
  useEffect(() => {
    setTargetFC(targetFoodCost);
    setTva(tvaPercentage);
    setDeliveryComm(deliveryCommission);
    setIsDirty(false);
  }, [targetFoodCost, tvaPercentage, deliveryCommission]);

  const handleTargetChange = (val: number) => {
    setTargetFC(val);
    setIsDirty(true);
  };

  const handleTvaChange = (val: number) => {
    setTva(val);
    setIsDirty(true);
  };

  const handleDeliveryChange = (val: number) => {
    setDeliveryComm(val);
    setIsDirty(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSettings({
        targetFoodCostPercentage: Number(targetFC),
        tvaPercentage: Number(tva),
        deliveryCommissionPercentage: Number(deliveryComm),
      });
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[8px] shadow-xs overflow-hidden transition-all duration-150">
      {/* Header bar with toggle */}
      <div
        className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-[4px] bg-[#0A1F44] text-white flex items-center justify-center shadow-2xs">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-[#0A1F44] flex items-center space-x-2">
              <span>{t.pricingSettingsTitle}</span>
              {isDirty && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[3px] bg-amber-100 text-amber-800 border border-amber-200">
                  Modifications non enregistrées
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              {t.pricingSettingsDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            className="text-slate-400 hover:text-slate-700 p-1 rounded-[4px]"
            aria-label="Toggle settings"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable settings form */}
      {isOpen && (
        <form onSubmit={handleSave} className="p-4 sm:p-4.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* 1. Target Food Cost % */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-[6px] p-3">
              <label
                htmlFor="target-food-cost-input"
                className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between"
              >
                <span>{t.targetFoodCostLabel}</span>
                <span className="text-[11px] font-mono font-bold text-emerald-700">
                  {targetFC}%
                </span>
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                {t.targetFoodCostHelp}
              </p>
              <div className="flex items-center space-x-2">
                <input
                  id="target-food-cost-input"
                  type="number"
                  min="5"
                  max="90"
                  step="0.5"
                  value={targetFC}
                  onChange={(e) => handleTargetChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold bg-white border border-slate-300 rounded-[5px] focus:ring-1 focus:ring-[#0A1F44] focus:border-[#0A1F44] outline-none"
                />
                <span className="text-xs font-mono text-slate-500">%</span>
              </div>
            </div>

            {/* 2. TVA % */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-[6px] p-3">
              <label
                htmlFor="tva-percentage-input"
                className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between"
              >
                <span>{t.tvaLabel}</span>
                <span className="text-[11px] font-mono font-bold text-[#0A1F44]">
                  {tva}%
                </span>
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                {t.tvaHelp}
              </p>
              <div className="flex items-center space-x-2">
                <input
                  id="tva-percentage-input"
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={tva}
                  onChange={(e) => handleTvaChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold bg-white border border-slate-300 rounded-[5px] focus:ring-1 focus:ring-[#0A1F44] focus:border-[#0A1F44] outline-none"
                />
                <span className="text-xs font-mono text-slate-500">%</span>
              </div>
            </div>

            {/* 3. Delivery Commission (Glovo) % */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-[6px] p-3">
              <label
                htmlFor="delivery-commission-input"
                className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between"
              >
                <span>{t.deliveryCommissionLabel}</span>
                <span className="text-[11px] font-mono font-bold text-amber-700">
                  {deliveryComm}%
                </span>
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                {t.deliveryCommissionHelp}
              </p>
              <div className="flex items-center space-x-2">
                <input
                  id="delivery-commission-input"
                  type="number"
                  min="0"
                  max="90"
                  step="0.5"
                  value={deliveryComm}
                  onChange={(e) => handleDeliveryChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold bg-white border border-slate-300 rounded-[5px] focus:ring-1 focus:ring-[#0A1F44] focus:border-[#0A1F44] outline-none"
                />
                <span className="text-xs font-mono text-slate-500">%</span>
              </div>
            </div>
          </div>

          {/* Action bar */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <Info className="w-3.5 h-3.5 text-[#0A1F44] flex-shrink-0" />
              <span>
                {language === 'fr'
                  ? 'Les modifications de taux sont recalculées en temps réel sur toute la carte.'
                  : 'Rate adjustments are dynamically recalculated across the full menu in real time.'}
              </span>
            </div>

            <button
              id="save-tenant-pricing-settings-btn"
              type="submit"
              disabled={isSaving || !isDirty}
              className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold rounded-[6px] transition-colors shadow-xs ${
                isDirty
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{t.saving}</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{t.saveSettingsBtn}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
