import React, { useState } from 'react';
import { Tenant, Language } from '../types';
import { translations } from '../lib/i18n';
import { X, Building2, Plus, AlertCircle } from 'lucide-react';

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tenantData: Omit<Tenant, 'id'>) => Promise<void>;
  language: Language;
}

export const TenantModal: React.FC<TenantModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  language,
}) => {
  const t = translations[language];
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(language === 'fr' ? 'Le nom du restaurant est obligatoire.' : 'Restaurant name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        active,
        currency: 'MAD',
        createdAt: new Date().toISOString(),
      });
      setName('');
      setDescription('');
      setActive(true);
      onClose();
    } catch (err: any) {
      setError(err?.message || t.toastError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0A1F44]">
              <Building2 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-[#0A1F44]">
              {t.newTenantModalTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t.restaurantName} <span className="text-rose-500">*</span>
            </label>
            <input
              id="new-restaurant-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.restaurantNamePlaceholder}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0A1F44] focus:border-[#0A1F44]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {language === 'fr' ? 'Description / Concept (optionnel)' : 'Description / Concept (optional)'}
            </label>
            <input
              id="new-restaurant-desc-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'fr' ? 'Ex: Riad Gastronomique, Pizzeria...' : 'e.g. Fine Dining Riad, Pizzeria...'}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0A1F44] focus:border-[#0A1F44]"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              id="tenant-active-checkbox"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <label htmlFor="tenant-active-checkbox" className="text-xs font-medium text-slate-700 cursor-pointer">
              {language === 'fr' ? 'Établissement actif' : 'Active Restaurant'}
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {t.cancel}
            </button>
            <button
              id="create-tenant-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? t.saving : t.createTenantBtn}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
