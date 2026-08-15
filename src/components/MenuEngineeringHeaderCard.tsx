import React from 'react';
import { MenuEngineeringItem, Language } from '../types';
import { translations } from '../lib/i18n';
import { UploadCloud, Clock, Calendar, BarChart3 } from 'lucide-react';

interface MenuEngineeringHeaderCardProps {
  items: MenuEngineeringItem[];
  lastUpdatedDate: string | null;
  lastUpdatedSource: 'import' | 'manual' | null;
  onOpenImportModal: () => void;
  language: Language;
}

export const MenuEngineeringHeaderCard: React.FC<MenuEngineeringHeaderCardProps> = ({
  items,
  lastUpdatedDate,
  lastUpdatedSource,
  onOpenImportModal,
  language,
}) => {
  const t = translations[language];

  // Format date nicely
  const formattedDate = lastUpdatedDate
    ? new Date(lastUpdatedDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-[8px] shadow-xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Title & Description */}
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <span>{t.tabEngineering}</span>
          </h2>
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-800 border border-emerald-200">
            Kasavana & Smith
          </span>
        </div>
        <p className="text-xs text-slate-500 max-w-2xl">
          {t.engineeringSubtitle}
        </p>

        {/* Last Updated Timestamp status */}
        <div className="flex items-center space-x-2 pt-1 text-xs text-slate-500 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {t.lastVolumeUpdated}{' '}
            {formattedDate ? (
              <strong className="text-slate-800 font-semibold">
                {formattedDate} (
                {lastUpdatedSource === 'import' ? t.updatedViaImport : t.updatedManually})
              </strong>
            ) : (
              <span className="text-slate-400 italic">{t.noVolumeUpdateRecorded}</span>
            )}
          </span>
        </div>
      </div>

      {/* Primary Action Button: CSV Import */}
      <div className="flex items-center space-x-3 self-start md:self-auto flex-shrink-0">
        <button
          id="open-csv-import-modal-btn"
          type="button"
          onClick={onOpenImportModal}
          className="flex items-center space-x-2 px-3.5 py-2 text-xs font-bold text-white bg-[#0A1F44] hover:bg-[#122b5e] border border-transparent rounded-[6px] shadow-xs transition-all duration-150"
        >
          <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t.importSalesDataBtn}</span>
        </button>
      </div>
    </div>
  );
};
