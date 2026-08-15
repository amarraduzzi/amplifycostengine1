import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Recipe, Ingredient, Language } from '../types';
import { calculateRecipePricing, formatMAD } from './recipeCalculations';
import { translations } from './i18n';

/**
 * Generates and downloads a clean, professional, high-contrast PDF Cost Sheet
 * for kitchen operations and restaurant audits.
 */
export function exportRecipeCostSheetPDF(
  recipe: Recipe,
  ingredientsMap: Map<string, Ingredient>,
  targetFoodCost: number = 30,
  tvaPercentage: number = 20,
  deliveryCommission: number = 27,
  language: Language = 'fr',
  restaurantName?: string
) {
  const t = translations[language];
  const pricing = calculateRecipePricing(
    recipe,
    ingredientsMap,
    targetFoodCost,
    tvaPercentage,
    deliveryCommission
  );

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors based on Amplify design system
  const colorNavy = [10, 31, 68];      // #0A1F44
  const colorGreen = [22, 163, 74];    // #16A34A
  const colorSlate = [71, 85, 105];    // #475569
  const colorLightBg = [248, 250, 252]; // #F8FAFC
  const colorBorder = [226, 232, 240];  // #E2E8F0

  // 1. Top Header Banner
  doc.setFillColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Title & Subtitle in White
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('AMPLIFY COST ENGINE', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('FICHE TECHNIQUE DE COÛT & RECEPTURE', 14, 20);

  // Restaurant & Date info on top right
  doc.setFontSize(8.5);
  doc.text(
    restaurantName ? `${restaurantName}` : 'Restaurant Partner',
    pageWidth - 14,
    13,
    { align: 'right' }
  );
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Édité le ${new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}`,
    pageWidth - 14,
    20,
    { align: 'right' }
  );

  // 2. Dish Overview Box
  doc.setFillColor(colorLightBg[0], colorLightBg[1], colorLightBg[2]);
  doc.roundedRect(14, 38, pageWidth - 28, 28, 2, 2, 'F');
  doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
  doc.roundedRect(14, 38, pageWidth - 28, 28, 2, 2, 'S');

  // Dish Name
  doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(recipe.name, 18, 47);

  // Dish Details Line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
  const catLabel = t.recipeCategories[recipe.category] || recipe.category;
  doc.text(
    `Catégorie : ${catLabel.toUpperCase()}   |   Portion : ${recipe.portionSize} ${recipe.portionUnit}   |   Composants : ${recipe.recipeIngredients.length} ingrédients`,
    18,
    55
  );

  if (recipe.notes) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const splitNotes = doc.splitTextToSize(`Notes : ${recipe.notes}`, pageWidth - 36);
    doc.text(splitNotes, 18, 62);
  }

  // 3. Ingredients Table using AutoTable
  let startTableY = recipe.notes ? 70 : 70;

  const tableHeaders = [
    'Ingrédient',
    'Qté Nette',
    'Yield %',
    'Qté Brute',
    'Prix Unitaire (MAD)',
    'Coût Ligne (MAD)',
  ];

  const tableRows = recipe.recipeIngredients.map((item) => {
    const ing = ingredientsMap.get(item.ingredientId);
    const ingName = ing ? ing.name : 'Ingrédient Inconnu';
    const unit = ing ? ing.recipeUnit : 'g';
    const yieldPct = item.yieldPercent || 100;
    const rawQty = (item.quantity || 0) / (yieldPct / 100);
    const unitCost = ing && ing.conversionFactor ? ing.purchasePrice / ing.conversionFactor : 0;
    const lineCost = rawQty * unitCost;

    return [
      ingName,
      `${item.quantity} ${unit}`,
      `${yieldPct}%`,
      `${rawQty.toFixed(2)} ${unit}`,
      `${unitCost.toFixed(3)} /${unit}`,
      `${formatMAD(lineCost)} MAD`,
    ];
  });

  autoTable(doc, {
    startY: startTableY,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: colorBorder as [number, number, number],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: colorNavy as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { halign: 'right', cellWidth: 24 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 26 },
      4: { halign: 'right', cellWidth: 32 },
      5: { halign: 'right', cellWidth: 25, fontStyle: 'bold', textColor: colorNavy as [number, number, number] },
    },
    foot: [
      [
        { content: 'COÛT TOTAL MATIÈRE / PORTION', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: `${formatMAD(pricing.portionCost)} MAD`, styles: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] } },
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
    },
  });

  // 4. Financial & Pricing Summary Block
  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Box for financial KPI summary
  doc.setFillColor(colorLightBg[0], colorLightBg[1], colorLightBg[2]);
  doc.roundedRect(14, finalY, pageWidth - 28, 48, 2, 2, 'F');
  doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
  doc.roundedRect(14, finalY, pageWidth - 28, 48, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  doc.text('ANALYSE FINANCIÈRE & PRIX DE VENTE CONSEILLÉS', 18, finalY + 7);

  // 4 KPI Columns
  const colWidth = (pageWidth - 36) / 4;
  const startX = 18;

  // Col 1: Coût Portion
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
  doc.text('COÛT MATIÈRE HT', startX, finalY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`${formatMAD(pricing.portionCost)} MAD`, startX, finalY + 23);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
  doc.text(`Food Cost Cible: ${targetFoodCost}%`, startX, finalY + 28);

  // Col 2: Prix Recommandé TTC
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
  doc.text('PRIX RECOMMANDÉ TTC', startX + colWidth, finalY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  doc.text(`${formatMAD(pricing.recommendedPriceInclTva)} MAD`, startX + colWidth, finalY + 23);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
  doc.text(`(HT: ${formatMAD(pricing.recommendedPriceExclTva)} MAD | TVA ${tvaPercentage}%)`, startX + colWidth, finalY + 28);

  // Col 3: Prix Carte Effectif & Food Cost Réel
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
  doc.text('PRIX CARTE EFFECTIF TTC', startX + colWidth * 2, finalY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(colorGreen[0], colorGreen[1], colorGreen[2]);
  doc.text(`${formatMAD(pricing.effectivePriceInclTva)} MAD`, startX + colWidth * 2, finalY + 23);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
  doc.text(
    `Food Cost Réel: ${pricing.actualFoodCostPercentage.toFixed(1)}% ${pricing.isManualOverride ? '(Manuel)' : ''}`,
    startX + colWidth * 2,
    finalY + 28
  );

  // Col 4: Prix Glovo & Marge
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
  doc.text('PRIX GLOVO COMPENSÉ', startX + colWidth * 3, finalY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(180, 83, 9); // Amber
  doc.text(`${formatMAD(pricing.effectiveGlovoPrice)} MAD`, startX + colWidth * 3, finalY + 23);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
  doc.text(`Marge Nette: +${formatMAD(pricing.marginMAD)} MAD`, startX + colWidth * 3, finalY + 28);

  // Explanation note at bottom of KPI box
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `* Marge brute unitaire : ${formatMAD(pricing.marginMAD)} MAD HT par portion vendue en salle. Prix Glovo calculé avec compensation de ${deliveryCommission}% de commission.`,
    18,
    finalY + 41
  );

  // 5. Footer Line
  doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
  doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Amplify Growth Studio • Cost Engine & Menu Engineering • Document d’exploitation confidentiel',
    14,
    pageHeight - 9
  );
  doc.text(
    `Page 1 / 1`,
    pageWidth - 14,
    pageHeight - 9,
    { align: 'right' }
  );

  // Save / Download PDF
  const sanitizedName = recipe.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  doc.save(`fiche_cout_${sanitizedName}.pdf`);
}
