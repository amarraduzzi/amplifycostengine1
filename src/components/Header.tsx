import React from 'react';
import { Tenant, Language } from '../types';
import { translations } from '../lib/i18n';
import { Building2, Plus, ChevronDown, Check } from 'lucide-react';

interface HeaderProps {
  tenants: Tenant[];
  currentTenant: Tenant | null;
  onSelectTenant: (tenant: Tenant) => void;
  onOpenNewTenantModal: () => void;
  language: Language;
  onToggleLanguage: (lang: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({
  tenants,
  currentTenant,
  onSelectTenant,
  onOpenNewTenantModal,
  language,
  onToggleLanguage,
}) => {
  const t = translations[language];
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-[#0A1F44] border-b border-[#153266] text-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Logo Section */}
          <div className="flex items-center space-x-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-[4px] bg-[#153266] border border-[#244580] flex items-center justify-center text-white shadow-xs">
                {/* Geometric waveform icon for Amplify */}
                <svg className="w-4.5 h-4.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14v-4" />
                  <path d="M8 18V6" />
                  <path d="M12 21V3" />
                  <path d="M16 17V7" />
                  <path d="M20 13v-2" />
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-extrabold tracking-wider text-white uppercase font-mono">
                    AMPLIFY
                  </span>
                  <span className="text-slate-500 text-xs font-light">/</span>
                  <span className="text-sm font-semibold tracking-tight text-slate-100">
                    Cost Engine
                  </span>
                  <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded-[3px] bg-[#153266] text-emerald-300 border border-[#244580]">
                    v1.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-normal hidden sm:block tracking-normal">
                  Amplify Growth Studio • {t.appSubtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Controls: Tenant Selector & Language Switcher */}
          <div className="flex items-center space-x-2.5">
            
            {/* Tenant Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                id="tenant-selector-btn"
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 bg-[#153266]/90 hover:bg-[#153266] border border-[#244580] text-slate-100 px-3 py-1.5 rounded-[6px] text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="max-w-[140px] sm:max-w-[200px] truncate font-medium">
                  {currentTenant ? currentTenant.name : t.tenantSelectorPlaceholder}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-64 bg-[#0A1F44] border border-[#1e4282] rounded-[6px] shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-[#153266]">
                    {t.tenantLabel}
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto py-1">
                    {tenants.map((tenant) => (
                      <button
                        key={tenant.id}
                        type="button"
                        onClick={() => {
                          onSelectTenant(tenant);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#153266] transition-colors ${
                          currentTenant?.id === tenant.id ? 'bg-[#153266] text-white font-semibold' : 'text-slate-200'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="truncate font-medium">{tenant.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {tenant.id}
                          </span>
                        </div>
                        {currentTenant?.id === tenant.id && (
                          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-[#153266] pt-1 px-1 mt-1">
                    <button
                      id="add-tenant-dropdown-btn"
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenNewTenantModal();
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-emerald-400 hover:bg-[#153266] rounded-[4px] transition-colors font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.addTenant}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-[#153266] border border-[#244580] rounded-[5px] p-0.5">
              <button
                id="lang-fr-btn"
                type="button"
                onClick={() => onToggleLanguage('fr')}
                className={`px-2 py-0.5 text-xs font-mono font-semibold rounded-[3px] transition-colors ${
                  language === 'fr'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Français (FR)"
              >
                FR
              </button>
              <button
                id="lang-en-btn"
                type="button"
                onClick={() => onToggleLanguage('en')}
                className={`px-2 py-0.5 text-xs font-mono font-semibold rounded-[3px] transition-colors ${
                  language === 'en'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="English (EN)"
              >
                EN
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
