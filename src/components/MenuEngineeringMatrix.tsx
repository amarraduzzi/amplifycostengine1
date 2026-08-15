import React, { useMemo, useState } from 'react';
import { MenuEngineeringItem, RecipeCategory, Language } from '../types';
import { QUADRANT_STYLES, translations } from '../lib/i18n';
import { formatMAD } from '../lib/recipeCalculations';
import { Sparkles, Utensils, HelpCircle, AlertCircle, Info } from 'lucide-react';

interface MenuEngineeringMatrixProps {
  items: MenuEngineeringItem[];
  selectedCategory: RecipeCategory | 'ALL';
  language: Language;
  onSelectItem?: (item: MenuEngineeringItem) => void;
}

export const MenuEngineeringMatrix: React.FC<MenuEngineeringMatrixProps> = ({
  items,
  selectedCategory,
  language,
  onSelectItem,
}) => {
  const t = translations[language];
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // Benchmarks for plotting
  const { maxVolume, maxMargin, volumeThreshold, marginThreshold } = useMemo(() => {
    if (items.length === 0) {
      return { maxVolume: 100, maxMargin: 100, volumeThreshold: 50, marginThreshold: 50 };
    }

    const volumes = items.map((i) => i.salesVolume);
    const margins = items.map((i) => i.marginMAD);

    const highestVol = Math.max(...volumes, 10);
    const highestMarg = Math.max(...margins, 10);

    // Dynamic thresholds (average if ALL, or specific category threshold)
    const vThresh = items[0]?.categoryVolumeThreshold || highestVol * 0.4;
    const mThresh = items[0]?.categoryMarginThreshold || highestMarg * 0.4;

    return {
      maxVolume: Math.max(highestVol * 1.15, vThresh * 1.3),
      maxMargin: Math.max(highestMarg * 1.15, mThresh * 1.3),
      volumeThreshold: vThresh,
      marginThreshold: mThresh,
    };
  }, [items]);

  // SVG viewBox coordinates
  const svgWidth = 800;
  const svgHeight = 440;
  const padding = { top: 30, right: 30, bottom: 45, left: 60 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Scale functions
  const scaleX = (volume: number) => {
    if (maxVolume === 0) return padding.left + plotWidth / 2;
    return padding.left + (Math.max(0, volume) / maxVolume) * plotWidth;
  };

  const scaleY = (margin: number) => {
    if (maxMargin === 0) return padding.top + plotHeight / 2;
    // Y-axis inverted in SVG: 0 at top, maxMargin at top
    return padding.top + plotHeight - (Math.max(0, margin) / maxMargin) * plotHeight;
  };

  const thresholdX = scaleX(volumeThreshold);
  const thresholdY = scaleY(marginThreshold);

  // Group counts for quadrant summary pills
  const counts = useMemo(() => {
    return {
      STAR: items.filter((i) => i.classification === 'STAR').length,
      PLOWHORSE: items.filter((i) => i.classification === 'PLOWHORSE').length,
      PUZZLE: items.filter((i) => i.classification === 'PUZZLE').length,
      DOG: items.filter((i) => i.classification === 'DOG').length,
    };
  }, [items]);

  return (
    <div className="bg-white border border-slate-200 rounded-[8px] shadow-xs p-4 sm:p-5 space-y-4">
      {/* Matrix Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <span>{t.engineeringTitle}</span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[3px] bg-slate-100 text-slate-600 border border-slate-200">
              Kasavana & Smith
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.engineeringSubtitle}
          </p>
        </div>

        {/* Quadrant Quick Counts */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] border text-[11px] font-semibold bg-emerald-50 text-emerald-800 border-emerald-200 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Stars: {counts.STAR}</span>
          </span>
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] border text-[11px] font-semibold bg-blue-50 text-[#0A1F44] border-blue-200 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0A1F44]" />
            <span>Plowhorses: {counts.PLOWHORSE}</span>
          </span>
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] border text-[11px] font-semibold bg-amber-50 text-amber-900 border-amber-200 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            <span>Puzzles: {counts.PUZZLE}</span>
          </span>
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] border text-[11px] font-semibold bg-slate-100 text-slate-700 border-slate-200 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <span>Dogs: {counts.DOG}</span>
          </span>
        </div>
      </div>

      {/* SVG Scatter / Quadrant Visualizer */}
      <div className="relative w-full overflow-hidden bg-slate-50/50 rounded-[6px] border border-slate-200">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none font-sans"
        >
          {/* Background Quadrant Rectangles */}
          {/* Top-Left: PUZZLE (Low Volume, High Margin) */}
          <rect
            x={padding.left}
            y={padding.top}
            width={Math.max(0, thresholdX - padding.left)}
            height={Math.max(0, thresholdY - padding.top)}
            fill="#FEF3C7"
            fillOpacity="0.25"
          />

          {/* Top-Right: STAR (High Volume, High Margin) */}
          <rect
            x={thresholdX}
            y={padding.top}
            width={Math.max(0, svgWidth - padding.right - thresholdX)}
            height={Math.max(0, thresholdY - padding.top)}
            fill="#D1FAE5"
            fillOpacity="0.3"
          />

          {/* Bottom-Left: DOG (Low Volume, Low Margin) */}
          <rect
            x={padding.left}
            y={thresholdY}
            width={Math.max(0, thresholdX - padding.left)}
            height={Math.max(0, svgHeight - padding.bottom - thresholdY)}
            fill="#F1F5F9"
            fillOpacity="0.5"
          />

          {/* Bottom-Right: PLOWHORSE (High Volume, Low Margin) */}
          <rect
            x={thresholdX}
            y={thresholdY}
            width={Math.max(0, svgWidth - padding.right - thresholdX)}
            height={Math.max(0, svgHeight - padding.bottom - thresholdY)}
            fill="#E0E7FF"
            fillOpacity="0.25"
          />

          {/* Quadrant Background Watermark Titles */}
          {/* PUZZLE Label */}
          <text
            x={padding.left + 12}
            y={padding.top + 22}
            className="text-[12px] font-bold fill-amber-900/50 tracking-wider uppercase font-mono"
          >
            PUZZLES (Marge Haute • Faible Vol.)
          </text>

          {/* STAR Label */}
          <text
            x={svgWidth - padding.right - 12}
            y={padding.top + 22}
            textAnchor="end"
            className="text-[12px] font-bold fill-emerald-900/60 tracking-wider uppercase font-mono"
          >
            ★ ÉTOILES / STARS (Marge Haute • Fort Vol.)
          </text>

          {/* DOG Label */}
          <text
            x={padding.left + 12}
            y={svgHeight - padding.bottom - 12}
            className="text-[12px] font-bold fill-slate-500/60 tracking-wider uppercase font-mono"
          >
            POIDS MORTS / DOGS (Faible Marge • Faible Vol.)
          </text>

          {/* PLOWHORSE Label */}
          <text
            x={svgWidth - padding.right - 12}
            y={svgHeight - padding.bottom - 12}
            textAnchor="end"
            className="text-[12px] font-bold fill-[#0A1F44]/50 tracking-wider uppercase font-mono"
          >
            CHEVAUX DE BATAILLE (Faible Marge • Fort Vol.)
          </text>

          {/* Threshold Lines (Dashed) */}
          {/* Vertical Popularity Threshold Line */}
          <line
            x1={thresholdX}
            y1={padding.top}
            x2={thresholdX}
            y2={svgHeight - padding.bottom}
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          {/* Horizontal Profitability Threshold Line */}
          <line
            x1={padding.left}
            y1={thresholdY}
            x2={svgWidth - padding.right}
            y2={thresholdY}
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {/* Threshold Values Markers */}
          <text
            x={thresholdX + 4}
            y={padding.top + 38}
            className="text-[9.5px] fill-slate-500 font-mono font-medium"
          >
            Seuil Vol.: {Math.round(volumeThreshold)} u/m
          </text>
          <text
            x={padding.left + 6}
            y={thresholdY - 5}
            className="text-[9.5px] fill-slate-500 font-mono font-medium"
          >
            Seuil Marge: {formatMAD(marginThreshold)} MAD
          </text>

          {/* Axes Lines */}
          <line
            x1={padding.left}
            y1={svgHeight - padding.bottom}
            x2={svgWidth - padding.right}
            y2={svgHeight - padding.bottom}
            stroke="#64748B"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={svgHeight - padding.bottom}
            stroke="#64748B"
            strokeWidth="1.5"
          />

          {/* Axis Labels */}
          <text
            x={svgWidth / 2}
            y={svgHeight - 12}
            textAnchor="middle"
            className="text-[11px] font-bold fill-slate-700 uppercase tracking-wider font-mono"
          >
            Popularité → Volume de Ventes Mensuel (Portions / mois)
          </text>
          <text
            x={-svgHeight / 2}
            y={18}
            textAnchor="middle"
            transform="rotate(-90)"
            className="text-[11px] font-bold fill-slate-700 uppercase tracking-wider font-mono"
          >
            Rentabilité → Marge Brute HT (MAD / portion)
          </text>

          {/* Data Points (Plotted Recipes) */}
          {items.map((item) => {
            const x = scaleX(item.salesVolume);
            const y = scaleY(item.marginMAD);
            const isHovered = hoveredItemId === item.recipe.id;
            const style = QUADRANT_STYLES[item.classification];

            // Truncate label if too long for clean canvas
            const shortName =
              item.recipe.name.length > 20
                ? item.recipe.name.substring(0, 18) + '...'
                : item.recipe.name;

            return (
              <g
                key={item.recipe.id || item.recipe.name}
                id={`scatter-item-${item.recipe.id}`}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredItemId(item.recipe.id || null)}
                onMouseLeave={() => setHoveredItemId(null)}
                onClick={() => onSelectItem && onSelectItem(item)}
              >
                {/* Glow / Pulse ring on hover */}
                {isHovered && (
                  <circle
                    cx={x}
                    cy={y}
                    r="12"
                    fill={style.scatterColor}
                    fillOpacity="0.2"
                    className="animate-ping"
                  />
                )}

                {/* Main point dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 7 : 5.5}
                  fill={style.scatterColor}
                  stroke="#FFFFFF"
                  strokeWidth="1.8"
                  className="shadow-md"
                />

                {/* Point Label with subtle white backdrop box for high contrast legibility */}
                <g transform={`translate(${x + 8}, ${y - 4})`}>
                  <rect
                    x="-2"
                    y="-9"
                    width={shortName.length * 5.8 + 8}
                    height="13"
                    fill="#FFFFFF"
                    fillOpacity="0.88"
                    rx="3"
                    stroke={isHovered ? style.scatterColor : '#E2E8F0'}
                    strokeWidth="0.8"
                  />
                  <text
                    x="2"
                    y="1"
                    className={`text-[9px] font-semibold ${
                      isHovered ? 'fill-slate-950 font-bold' : 'fill-slate-700'
                    }`}
                  >
                    {shortName}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Threshold Explanation Banner */}
      <div className="flex items-start space-x-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
        <Info className="w-4 h-4 text-[#0A1F44] flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-slate-800">
            {t.thresholdNoticeTitle} :
          </span>{' '}
          <span>{t.thresholdNoticeDesc}</span>
        </div>
      </div>
    </div>
  );
};
