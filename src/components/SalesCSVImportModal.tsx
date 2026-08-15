import React, { useState, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import { Recipe, Language, CSVDishMatch } from '../types';
import { translations } from '../lib/i18n';
import {
  UploadCloud,
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  HelpCircle,
  Table,
  CheckCheck,
} from 'lucide-react';

interface SalesCSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  onConfirmImport: (
    matches: { recipeId: string; volume: number }[]
  ) => Promise<void>;
  language: Language;
}

export const SalesCSVImportModal: React.FC<SalesCSVImportModalProps> = ({
  isOpen,
  onClose,
  recipes,
  onConfirmImport,
  language,
}) => {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Upload, Step 2: Mapping, Step 3: Matching
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState<string>('');
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);

  // Column Mapping state
  const [dishNameColumn, setDishNameColumn] = useState<string>('');
  const [volumeColumn, setVolumeColumn] = useState<string>('');

  // Dish matches state
  const [matches, setMatches] = useState<CSVDishMatch[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state on close
  const handleClose = () => {
    setCurrentStep(1);
    setFileName('');
    setParsedHeaders([]);
    setParsedRows([]);
    setDishNameColumn('');
    setVolumeColumn('');
    setMatches([]);
    setErrorMessage(null);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  // File parsing handler
  const handleFileChange = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setErrorMessage(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0 || !results.meta.fields) {
          setErrorMessage(t.parseErrorToast);
          return;
        }

        const headers = results.meta.fields.filter(Boolean);
        setParsedHeaders(headers);
        setParsedRows(results.data as Record<string, any>[]);

        // Smart column auto-detection
        const lowerHeaders = headers.map((h) => h.toLowerCase());

        // 1. Detect dish name column
        const dishKeywords = ['dish', 'name', 'item', 'plat', 'recette', 'product', 'produit', 'article', 'description', 'menu'];
        let detectedDishCol = headers[0];
        for (const kw of dishKeywords) {
          const idx = lowerHeaders.findIndex((h) => h.includes(kw));
          if (idx !== -1) {
            detectedDishCol = headers[idx];
            break;
          }
        }

        // 2. Detect sales volume / qty column
        const volumeKeywords = ['volume', 'qty', 'quantity', 'quantite', 'quantité', 'vendu', 'sold', 'units', 'unites', 'count', 'total sold', 'sales'];
        let detectedVolCol = headers.length > 1 ? headers[1] : headers[0];
        for (const kw of volumeKeywords) {
          const idx = lowerHeaders.findIndex((h) => h.includes(kw));
          if (idx !== -1) {
            detectedVolCol = headers[idx];
            break;
          }
        }

        setDishNameColumn(detectedDishCol);
        setVolumeColumn(detectedVolCol);
        setCurrentStep(2);
      },
      error: (err) => {
        console.error('Papa Parse Error:', err);
        setErrorMessage(t.parseErrorToast);
      },
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Build matchings when moving from Step 2 to Step 3
  const handleProceedToMatching = () => {
    if (!dishNameColumn || !volumeColumn) return;

    // Normalize helper: lowercase, remove accents, trim, remove parentheticals
    const cleanStr = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\(.*?\)/g, '')
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const newMatches: CSVDishMatch[] = [];

    // Aggregate by raw dish name in case the CSV has multiple line items per dish
    const volumeMap = new Map<string, number>();

    parsedRows.forEach((row) => {
      const rawName = row[dishNameColumn];
      const rawVol = row[volumeColumn];

      if (rawName !== undefined && rawName !== null && String(rawName).trim() !== '') {
        const dishStr = String(rawName).trim();
        // parse volume safely
        let volNum = typeof rawVol === 'number' ? rawVol : parseFloat(String(rawVol).replace(',', '.'));
        if (isNaN(volNum) || volNum < 0) volNum = 0;

        const currentTotal = volumeMap.get(dishStr) || 0;
        volumeMap.set(dishStr, currentTotal + volNum);
      }
    });

    volumeMap.forEach((vol, rawDishName) => {
      const cleanPOS = cleanStr(rawDishName);

      // 1. Exact match test
      let matchedRecipe = recipes.find(
        (r) => cleanStr(r.name) === cleanPOS || r.name.toLowerCase() === rawDishName.toLowerCase()
      );

      // 2. Substring match fallback (e.g. "Chicken Tikka" in "Chicken Tikka (Main)")
      let isSubstringMatch = false;
      if (!matchedRecipe) {
        matchedRecipe = recipes.find((r) => {
          const cleanR = cleanStr(r.name);
          return (
            cleanR.includes(cleanPOS) ||
            cleanPOS.includes(cleanR)
          );
        });
        if (matchedRecipe) isSubstringMatch = true;
      }

      newMatches.push({
        rawDishName,
        volume: Math.round(vol),
        matchedRecipeId: matchedRecipe ? matchedRecipe.id || null : null,
        matchType: matchedRecipe ? (isSubstringMatch ? 'manual' : 'exact') : 'unmatched',
      });
    });

    setMatches(newMatches);
    setCurrentStep(3);
  };

  // Change matching for a specific row
  const handleUpdateRowMatch = (rawDishName: string, selectedRecipeId: string) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.rawDishName !== rawDishName) return m;
        if (selectedRecipeId === 'IGNORE') {
          return { ...m, matchedRecipeId: null, matchType: 'ignored' };
        }
        if (!selectedRecipeId) {
          return { ...m, matchedRecipeId: null, matchType: 'unmatched' };
        }
        return {
          ...m,
          matchedRecipeId: selectedRecipeId,
          matchType: 'manual',
        };
      })
    );
  };

  // Count matches
  const matchStats = useMemo(() => {
    const validMatches = matches.filter((m) => m.matchedRecipeId !== null && m.matchType !== 'ignored');
    const unmatched = matches.filter((m) => m.matchType === 'unmatched');
    const ignored = matches.filter((m) => m.matchType === 'ignored');
    return {
      validCount: validMatches.length,
      unmatchedCount: unmatched.length,
      ignoredCount: ignored.length,
      total: matches.length,
    };
  }, [matches]);

  // Final confirmation
  const handleFinalImport = async () => {
    const validMatches = matches
      .filter((m) => m.matchedRecipeId !== null && m.matchType !== 'ignored')
      .map((m) => ({
        recipeId: m.matchedRecipeId as string,
        volume: m.volume,
      }));

    if (validMatches.length === 0) return;

    setIsSubmitting(true);
    try {
      await onConfirmImport(validMatches);
      handleClose();
    } catch (err: any) {
      console.error('Import confirmation error:', err);
      setErrorMessage(err?.message || t.toastError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="sales-csv-import-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        id="sales-csv-import-modal"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl my-6 flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* Modal Header with Amplify Navy / Green styling */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#0A1F44] text-white flex items-center justify-center shadow-xs">
              <UploadCloud className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {t.importSalesDataTitle}
              </h2>
              <p className="text-xs text-slate-500">
                {t.importSalesDataSubtitle}
              </p>
            </div>
          </div>
          <button
            id="close-csv-modal-btn"
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs font-mono select-none">
          <div
            className={`flex items-center space-x-1.5 ${
              currentStep >= 1 ? 'text-[#0A1F44] font-bold' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                currentStep >= 1 ? 'bg-[#0A1F44] text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              1
            </span>
            <span>{t.step1Upload}</span>
          </div>

          <span className="text-slate-300">→</span>

          <div
            className={`flex items-center space-x-1.5 ${
              currentStep >= 2 ? 'text-[#0A1F44] font-bold' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                currentStep >= 2 ? 'bg-[#0A1F44] text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              2
            </span>
            <span>{t.step2Mapping}</span>
          </div>

          <span className="text-slate-300">→</span>

          <div
            className={`flex items-center space-x-1.5 ${
              currentStep === 3 ? 'text-[#0A1F44] font-bold' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                currentStep === 3 ? 'bg-[#0A1F44] text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              3
            </span>
            <span>
              {t.step3Matching
                .replace('{matched}', String(matchStats.validCount))
                .replace('{total}', String(matchStats.total || recipes.length))}
            </span>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body Content depending on Step */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* STEP 1: UPLOAD CSV FILE */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-8 text-center cursor-pointer transition-all bg-slate-50/60 hover:bg-emerald-50/20 group"
              >
                <input
                  ref={fileInputRef}
                  id="csv-file-input"
                  type="file"
                  accept=".csv,text/csv,application/vnd.ms-excel"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-emerald-100 text-slate-500 group-hover:text-emerald-700 flex items-center justify-center mx-auto mb-3 transition-colors">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-emerald-900">
                  {t.dropCSVHere}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {t.orClickToBrowse} (format .csv)
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#0A1F44]" />
                  <span>Compatibilité & Formats :</span>
                </div>
                <p>
                  Compatible avec les exports de caisses POS (Lightspeed, Zelty, SumUp, Clover, Micros...) ainsi que les rapports de plateformes de livraison (Glovo, Deliveroo, UberEats).
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING & PREVIEW */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800 font-mono">
                    {t.csvFileLoaded
                      .replace('{fileName}', fileName)
                      .replace('{rowCount}', String(parsedRows.length))}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-[#0A1F44] hover:underline font-semibold"
                >
                  Changer de fichier
                </button>
              </div>

              {/* Column Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                {/* Dish Name Column */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    {t.selectDishNameColumn}
                  </label>
                  <select
                    id="mapping-dish-col-select"
                    value={dishNameColumn}
                    onChange={(e) => setDishNameColumn(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0A1F44] focus:border-transparent outline-none"
                  >
                    {parsedHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sales Volume Column */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    {t.selectVolumeColumn}
                  </label>
                  <select
                    id="mapping-vol-col-select"
                    value={volumeColumn}
                    onChange={(e) => setVolumeColumn(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0A1F44] focus:border-transparent outline-none"
                  >
                    {parsedHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview of first 5 rows */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                  <Table className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t.previewTop5Rows}</span>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/75 border-b border-slate-200 font-mono text-[11px] text-slate-600">
                        <th className="py-2 px-3 bg-emerald-50 text-emerald-950 font-bold border-r border-emerald-200">
                          {dishNameColumn} (Plat)
                        </th>
                        <th className="py-2 px-3 bg-blue-50 text-[#0A1F44] font-bold border-r border-blue-200 text-center">
                          {volumeColumn} (Volume)
                        </th>
                        {parsedHeaders
                          .filter((h) => h !== dishNameColumn && h !== volumeColumn)
                          .slice(0, 3)
                          .map((h) => (
                            <th key={h} className="py-2 px-3 text-slate-400 font-normal">
                              {h}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {parsedRows.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-semibold text-slate-900 border-r border-slate-100">
                            {String(row[dishNameColumn] ?? '—')}
                          </td>
                          <td className="py-1.5 px-3 font-bold text-[#0A1F44] text-center border-r border-slate-100">
                            {String(row[volumeColumn] ?? '0')}
                          </td>
                          {parsedHeaders
                            .filter((h) => h !== dishNameColumn && h !== volumeColumn)
                            .slice(0, 3)
                            .map((h) => (
                              <td key={h} className="py-1.5 px-3 text-slate-400 truncate max-w-[120px]">
                                {String(row[h] ?? '')}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DISH MATCHING TABLE */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <p className="text-slate-600">
                  {t.dishMatchingDesc}
                </p>
                <div className="flex items-center space-x-2 font-mono text-[11px] whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                    {matchStats.validCount} associés
                  </span>
                  {matchStats.unmatchedCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-200">
                      {matchStats.unmatchedCount} à vérifier
                    </span>
                  )}
                </div>
              </div>

              {matchStats.unmatchedCount > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    {t.unmatchedNotice.replace('{count}', String(matchStats.unmatchedCount))}
                  </span>
                </div>
              )}

              {/* Matching Rows Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="max-h-[340px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 z-10 font-mono text-[11px] uppercase tracking-wider text-slate-600">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">{t.posDishName}</th>
                        <th className="py-2.5 px-3 font-semibold text-center w-20">
                          {t.volumeImported}
                        </th>
                        <th className="py-2.5 px-3 font-semibold">{t.matchedAppRecipe}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {matches.map((item) => {
                        const isExact = item.matchType === 'exact';
                        const isManual = item.matchType === 'manual';
                        const isIgnored = item.matchType === 'ignored';
                        const isUnmatched = item.matchType === 'unmatched';

                        return (
                          <tr
                            key={item.rawDishName}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isUnmatched ? 'bg-amber-50/40' : isIgnored ? 'opacity-50' : ''
                            }`}
                          >
                            {/* Raw POS Dish Name */}
                            <td className="py-2 px-3 font-medium text-slate-900">
                              <div className="flex flex-col">
                                <span className="font-semibold">{item.rawDishName}</span>
                                <div className="mt-0.5">
                                  {isExact && (
                                    <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-700 font-bold">
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span>{t.matchExactBadge}</span>
                                    </span>
                                  )}
                                  {isManual && (
                                    <span className="inline-flex items-center space-x-1 text-[10px] text-[#0A1F44] font-bold">
                                      <CheckCircle2 className="w-3 h-3 text-[#0A1F44]" />
                                      <span>{t.matchManualBadge}</span>
                                    </span>
                                  )}
                                  {isUnmatched && (
                                    <span className="inline-flex items-center space-x-1 text-[10px] text-amber-800 font-bold">
                                      <AlertCircle className="w-3 h-3 text-amber-600" />
                                      <span>{t.matchUnmatchedBadge}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Volume */}
                            <td className="py-2 px-3 font-mono font-bold text-center text-slate-800 bg-slate-50/50">
                              {item.volume}
                            </td>

                            {/* Recipe Match Dropdown */}
                            <td className="py-2 px-3">
                              <select
                                id={`match-select-${item.rawDishName.replace(/[^a-zA-Z0-9]/g, '_')}`}
                                value={item.matchedRecipeId || (isIgnored ? 'IGNORE' : '')}
                                onChange={(e) =>
                                  handleUpdateRowMatch(item.rawDishName, e.target.value)
                                }
                                className={`w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border outline-none transition-all ${
                                  isUnmatched
                                    ? 'bg-amber-50/80 border-amber-300 text-amber-950 focus:ring-2 focus:ring-amber-500'
                                    : isIgnored
                                    ? 'bg-slate-100 border-slate-300 text-slate-400'
                                    : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-[#0A1F44]'
                                }`}
                              >
                                <option value="">— Associer à une fiche recette... —</option>
                                <option value="IGNORE" className="text-slate-400 font-normal">
                                  {t.ignoreItemOption}
                                </option>
                                <optgroup label="Fiches Recettes existantes :">
                                  {recipes.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.name} ({t.recipeCategories[r.category] || r.category})
                                    </option>
                                  ))}
                                </optgroup>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <div>
            {currentStep > 1 && (
              <button
                id="prev-step-csv-btn"
                type="button"
                onClick={() => setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2) : 1))}
                className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              id="cancel-csv-import-btn"
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              {t.cancel}
            </button>

            {currentStep === 2 && (
              <button
                id="proceed-matching-btn"
                type="button"
                onClick={handleProceedToMatching}
                disabled={!dishNameColumn || !volumeColumn}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0A1F44] hover:bg-[#122b5e] rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                <span>{t.continueToMatching}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                id="confirm-csv-import-btn"
                type="button"
                onClick={handleFinalImport}
                disabled={matchStats.validCount === 0 || isSubmitting}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-[#16A34A] hover:bg-emerald-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? t.saving
                    : t.confirmImportBtn.replace('{count}', String(matchStats.validCount))}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
