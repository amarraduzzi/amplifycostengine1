import { Tenant, Ingredient, Recipe, RecipeCategory, IngredientCategory, PurchaseUnit, RecipeUnit } from '../types';

export const INITIAL_DEMO_TENANTS: Tenant[] = [
  {
    id: 'tenant-indian-flavors',
    name: 'Indian Flavors',
    active: true,
    currency: 'MAD',
    createdAt: new Date().toISOString(),
    description: 'Saveurs et spécialités culinaires indiennes authentiques',
    targetFoodCostPercentage: 30,
    tvaPercentage: 20,
    deliveryCommissionPercentage: 27,
  },
  {
    id: 'tenant-le-jardin',
    name: 'Le Jardin de Marrakech',
    active: true,
    currency: 'MAD',
    createdAt: new Date().toISOString(),
    description: 'Cuisine traditionnelle marocaine & méditerranéenne',
    targetFoodCostPercentage: 30,
    tvaPercentage: 20,
    deliveryCommissionPercentage: 27,
  },
  {
    id: 'tenant-bistrot-casa',
    name: 'Bistrot du Port Casablanca',
    active: true,
    currency: 'MAD',
    createdAt: new Date().toISOString(),
    description: 'Poissons frais et cuisine bistronomique',
    targetFoodCostPercentage: 32,
    tvaPercentage: 20,
    deliveryCommissionPercentage: 27,
  },
];

export const INITIAL_DEMO_INGREDIENTS: (Omit<Ingredient, 'id'> & { id: string })[] = [
  {
    id: 'ing-safran',
    tenantId: 'tenant-le-jardin',
    name: 'Safran pur de Taliouine (AOP)',
    category: 'specerijen',
    purchaseUnit: 'g',
    purchasePrice: 45,
    recipeUnit: 'g',
    conversionFactor: 1,
    supplier: 'Coopérative Taliouine Or Rouge',
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    priceHistory: [
      { price: 38, date: '2026-02-10T10:00:00.000Z', note: 'Prix initial saison' },
      { price: 42, date: '2026-05-18T14:30:00.000Z', note: 'Ajustement cours safran' },
    ],
  },
  {
    id: 'ing-cumin',
    tenantId: 'tenant-le-jardin',
    name: 'Cumin Beldi de l’Atlas',
    category: 'specerijen',
    purchaseUnit: 'kg',
    purchasePrice: 115,
    recipeUnit: 'g',
    conversionFactor: 1000,
    supplier: 'Épices du Souk Marrakech',
    updatedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    priceHistory: [
      { price: 98, date: '2026-03-01T09:15:00.000Z', note: 'Tarif grossiste' },
    ],
  },
  {
    id: 'ing-huile-olive',
    tenantId: 'tenant-le-jardin',
    name: 'Huile d’Olive Vierge Extra (Bidon 5L)',
    category: 'olie/vet',
    purchaseUnit: 'l',
    purchasePrice: 430,
    recipeUnit: 'ml',
    conversionFactor: 5000,
    supplier: 'Moulin d’Essaouira',
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    priceHistory: [
      { price: 390, date: '2026-01-15T11:00:00.000Z', note: 'Ancienne récolte' },
    ],
  },
  {
    id: 'ing-agneau',
    tenantId: 'tenant-le-jardin',
    name: 'Épaule d’Agneau Frais',
    category: 'vlees',
    purchaseUnit: 'kg',
    purchasePrice: 135,
    recipeUnit: 'g',
    conversionFactor: 1000,
    supplier: 'Boucherie Al Baraka',
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    priceHistory: [
      { price: 120, date: '2026-02-14T08:00:00.000Z', note: 'Tarif hiver' },
      { price: 128, date: '2026-06-20T08:30:00.000Z', note: 'Hausse marché bétail' },
    ],
  },
  {
    id: 'ing-boeuf',
    tenantId: 'tenant-le-jardin',
    name: 'Filet de Bœuf Élevage Local',
    category: 'vlees',
    purchaseUnit: 'kg',
    purchasePrice: 165,
    recipeUnit: 'g',
    conversionFactor: 1000,
    supplier: 'Boucherie Al Baraka',
    updatedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    priceHistory: [],
  },
  {
    id: 'ing-loup-mer',
    tenantId: 'tenant-le-jardin',
    name: 'Loup de Mer Sauvage Frais',
    category: 'vis',
    purchaseUnit: 'kg',
    purchasePrice: 130,
    recipeUnit: 'g',
    conversionFactor: 1000,
    supplier: 'Criée Port d’Agadir',
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    priceHistory: [
      { price: 115, date: '2026-04-10T07:45:00.000Z', note: 'Arrivage printanier' },
    ],
  },
  {
    id: 'ing-tomates',
    tenantId: 'tenant-le-jardin',
    name: 'Tomates Grappes de Souss (Caisse 10kg)',
    category: 'groente',
    purchaseUnit: 'kg',
    purchasePrice: 75,
    recipeUnit: 'g',
    conversionFactor: 10000,
    supplier: 'Coop Souss Primeurs',
    updatedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    priceHistory: [
      { price: 60, date: '2026-05-01T06:00:00.000Z' },
    ],
  },
  {
    id: 'ing-amandes',
    tenantId: 'tenant-le-jardin',
    name: 'Amandes Beldi Mondées',
    category: 'granen',
    purchaseUnit: 'kg',
    purchasePrice: 125,
    recipeUnit: 'g',
    conversionFactor: 1000,
    supplier: 'Fruits Secs de l’Atlas',
    updatedAt: new Date(Date.now() - 86400000 * 18).toISOString(),
    priceHistory: [],
  },
  {
    id: 'ing-beurre',
    tenantId: 'tenant-le-jardin',
    name: 'Beurre Fermier Pur Beldi (Pasteurisé)',
    category: 'zuivel',
    purchaseUnit: 'kg',
    purchasePrice: 95,
    recipeUnit: 'g',
    conversionFactor: 1000,
    supplier: 'Domaine Laitier Chaouia',
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    priceHistory: [
      { price: 88, date: '2026-03-12T10:00:00.000Z' },
    ],
  },
  {
    id: 'ing-citrons-confits',
    tenantId: 'tenant-le-jardin',
    name: 'Citrons Beldi Confits au Sel (Bocal 2kg)',
    category: 'overig',
    purchaseUnit: 'kg',
    purchasePrice: 55,
    recipeUnit: 'g',
    conversionFactor: 2000,
    supplier: 'Conserverie Traditionnelle Fès',
    updatedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    priceHistory: [],
  },
  {
    id: 'ing-gambas',
    tenantId: 'tenant-bistrot-casa',
    name: 'Gambas Royales Fraîches',
    category: 'vis',
    purchaseUnit: 'kg',
    purchasePrice: 220,
    recipeUnit: 'g',
    conversionFactor: 1000,
    supplier: 'Marée Royale Casa Port',
    updatedAt: new Date().toISOString(),
    priceHistory: [
      { price: 195, date: '2026-04-01T08:00:00.000Z' },
    ],
  },
  {
    id: 'ing-creme',
    tenantId: 'tenant-bistrot-casa',
    name: 'Crème Liquide 35% MG (Brique 1L)',
    category: 'zuivel',
    purchaseUnit: 'l',
    purchasePrice: 48,
    recipeUnit: 'ml',
    conversionFactor: 1000,
    supplier: 'Distributeur Horeca Maroc',
    updatedAt: new Date().toISOString(),
    priceHistory: [],
  },
];

export const INITIAL_DEMO_RECIPES: (Omit<Recipe, 'id'> & { id: string })[] = [
  {
    id: 'rec-tajine-agneau',
    tenantId: 'tenant-le-jardin',
    name: 'Tajine d’Agneau aux Pruneaux & Amandes Beldi',
    category: 'hoofdgerecht',
    portionSize: 450,
    portionUnit: 'g',
    notes: 'Cuisson lente à feu doux (2h). Dorer la viande avec l’huile et les épices, garnir d’amandes frites et graines de sésame.',
    manualPriceOverride: 185, // Example manual price override
    monthlySalesVolume: 240, // High Volume & High Margin => STAR
    salesVolumeLastUpdated: new Date(Date.now() - 86400000 * 2).toISOString(),
    salesVolumeImportSource: 'import',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    recipeIngredients: [
      {
        ingredientId: 'ing-agneau',
        quantity: 260,
        yieldPercent: 92, // 8% perte dégraissage/os
      },
      {
        ingredientId: 'ing-huile-olive',
        quantity: 25,
        yieldPercent: 100,
      },
      {
        ingredientId: 'ing-safran',
        quantity: 0.15,
        yieldPercent: 100,
      },
      {
        ingredientId: 'ing-cumin',
        quantity: 3.5,
        yieldPercent: 100,
      },
      {
        ingredientId: 'ing-amandes',
        quantity: 35,
        yieldPercent: 95, // 5% perte émondage
      },
      {
        ingredientId: 'ing-beurre',
        quantity: 15,
        yieldPercent: 100,
      },
    ],
  },
  {
    id: 'rec-loup-mer-citron',
    tenantId: 'tenant-le-jardin',
    name: 'Loup de Mer Sauvage Rôti aux Citrons Confits',
    category: 'hoofdgerecht',
    portionSize: 380,
    portionUnit: 'g',
    notes: 'Filets poêlés côté peau, réduction de tomates fraîches au cumin et quartiers de citrons confits de Fès.',
    monthlySalesVolume: 65, // Lower Volume, Good Margin => PUZZLE
    salesVolumeLastUpdated: new Date(Date.now() - 86400000 * 2).toISOString(),
    salesVolumeImportSource: 'import',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    recipeIngredients: [
      {
        ingredientId: 'ing-loup-mer',
        quantity: 240,
        yieldPercent: 85, // 15% perte ébarbage / parage filet
      },
      {
        ingredientId: 'ing-tomates',
        quantity: 110,
        yieldPercent: 90, // 10% perte peau/graines
      },
      {
        ingredientId: 'ing-citrons-confits',
        quantity: 20,
        yieldPercent: 100,
      },
      {
        ingredientId: 'ing-huile-olive',
        quantity: 20,
        yieldPercent: 100,
      },
      {
        ingredientId: 'ing-cumin',
        quantity: 2,
        yieldPercent: 100,
      },
    ],
  },
  {
    id: 'rec-salade-marocaine',
    tenantId: 'tenant-le-jardin',
    name: 'Salade Marocaine Traditionnelle de Fès',
    category: 'voorgerecht',
    portionSize: 220,
    portionUnit: 'g',
    notes: 'Brunoise de tomates mûres, assaisonnement froid à l’huile d’olive extra vierge et cumin moulu.',
    manualPriceOverride: 45, // Example manual price override
    monthlySalesVolume: 320, // Very Popular Starter => STAR / PLOWHORSE
    salesVolumeLastUpdated: new Date(Date.now() - 86400000 * 2).toISOString(),
    salesVolumeImportSource: 'import',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    recipeIngredients: [
      {
        ingredientId: 'ing-tomates',
        quantity: 180,
        yieldPercent: 88, // 12% perte émondage
      },
      {
        ingredientId: 'ing-huile-olive',
        quantity: 25,
        yieldPercent: 100,
      },
      {
        ingredientId: 'ing-cumin',
        quantity: 3,
        yieldPercent: 100,
      },
    ],
  },
  {
    id: 'rec-gambas-creme',
    tenantId: 'tenant-bistrot-casa',
    name: 'Poêlée de Gambas Royales à la Crème et Épices',
    category: 'hoofdgerecht',
    portionSize: 320,
    portionUnit: 'g',
    notes: 'Gambas fraîches saisies au beurre fermier, déglaçage et réduction minute à la crème liquide.',
    monthlySalesVolume: 180,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    recipeIngredients: [
      {
        ingredientId: 'ing-gambas',
        quantity: 220,
        yieldPercent: 78, // 22% décorticage / têtes
      },
      {
        ingredientId: 'ing-creme',
        quantity: 80,
        yieldPercent: 100,
      },
      {
        ingredientId: 'ing-beurre',
        quantity: 20,
        yieldPercent: 100,
      },
    ],
  },
];

export interface IndianFlavorsMenuItemSeed {
  name: string;
  sourceCategory: string;
  category: RecipeCategory;
  currentMenuPrice: number;
  portionSize?: number;
  portionUnit?: string;
  notes?: string;
}

/**
 * 53 Indian Flavors menu dishes to seed as blank recipe cards
 * with currentMenuPrice reference (MAD), empty ingredient lists,
 * and mapped categories.
 */
export const INDIAN_FLAVORS_MENU_ITEMS: IndianFlavorsMenuItemSeed[] = [
  // veg_starters -> voorgerecht (Starter / Appetizer)
  { name: 'Vegetable Samosa (2 pcs)', sourceCategory: 'veg_starters', category: 'voorgerecht', currentMenuPrice: 40 },
  { name: 'Vegetable Pani Puri (6 pcs)', sourceCategory: 'veg_starters', category: 'voorgerecht', currentMenuPrice: 45 },
  { name: 'Vegetable Pakoras', sourceCategory: 'veg_starters', category: 'voorgerecht', currentMenuPrice: 60 },
  { name: 'Raita', sourceCategory: 'veg_starters', category: 'voorgerecht', currentMenuPrice: 30 },

  // nonveg_starters -> voorgerecht (Starter / Appetizer)
  { name: 'Chicken 65 (Boneless)', sourceCategory: 'nonveg_starters', category: 'voorgerecht', currentMenuPrice: 80 },
  { name: 'Chicken Lollipop', sourceCategory: 'nonveg_starters', category: 'voorgerecht', currentMenuPrice: 75 },
  { name: 'Chilli Chicken (Boneless)', sourceCategory: 'nonveg_starters', category: 'voorgerecht', currentMenuPrice: 80 },
  { name: 'Chicken Manchurian (Boneless)', sourceCategory: 'nonveg_starters', category: 'voorgerecht', currentMenuPrice: 80 },

  // veg_mains -> hoofdgerecht (Main Course)
  { name: 'Kadai Paneer', sourceCategory: 'veg_mains', category: 'hoofdgerecht', currentMenuPrice: 80 },
  { name: 'Paneer Makhni', sourceCategory: 'veg_mains', category: 'hoofdgerecht', currentMenuPrice: 80 },
  { name: 'Mushroom Masala', sourceCategory: 'veg_mains', category: 'hoofdgerecht', currentMenuPrice: 80 },
  { name: 'Mushroom Kadai', sourceCategory: 'veg_mains', category: 'hoofdgerecht', currentMenuPrice: 80 },
  { name: 'Tadka Daal', sourceCategory: 'veg_mains', category: 'hoofdgerecht', currentMenuPrice: 70 },
  { name: 'Rajma Daal', sourceCategory: 'veg_mains', category: 'hoofdgerecht', currentMenuPrice: 75 },
  { name: 'Palak Paneer', sourceCategory: 'veg_mains', category: 'hoofdgerecht', currentMenuPrice: 80 },
  { name: 'Mixed Vegetable Curry', sourceCategory: 'veg_mains', category: 'hoofdgerecht', currentMenuPrice: 70 },
  { name: 'Aloo Gobi', sourceCategory: 'veg_mains', category: 'hoofdgerecht', currentMenuPrice: 70 },

  // main_courses -> hoofdgerecht (Main Course)
  { name: 'Butter Chicken', sourceCategory: 'main_courses', category: 'hoofdgerecht', currentMenuPrice: 80 },
  { name: 'Chicken Tikka Masala', sourceCategory: 'main_courses', category: 'hoofdgerecht', currentMenuPrice: 80 },
  { name: 'Kadai Chicken', sourceCategory: 'main_courses', category: 'hoofdgerecht', currentMenuPrice: 80 },
  { name: 'Prawn Curry / Fish Curry', sourceCategory: 'main_courses', category: 'hoofdgerecht', currentMenuPrice: 120 },
  { name: 'Prawn Masala / Fish Masala', sourceCategory: 'main_courses', category: 'hoofdgerecht', currentMenuPrice: 120 },
  { name: 'Lamb Kadai', sourceCategory: 'main_courses', category: 'hoofdgerecht', currentMenuPrice: 100 },
  { name: 'Lamb Keema', sourceCategory: 'main_courses', category: 'hoofdgerecht', currentMenuPrice: 100 },

  // tandoori -> hoofdgerecht (Main Course)
  { name: 'Tandoori Chicken', sourceCategory: 'tandoori', category: 'hoofdgerecht', currentMenuPrice: 100 },
  { name: 'Chicken Tikka', sourceCategory: 'tandoori', category: 'hoofdgerecht', currentMenuPrice: 95 },
  { name: 'Boti Kabab', sourceCategory: 'tandoori', category: 'hoofdgerecht', currentMenuPrice: 100 },

  // biryani -> hoofdgerecht (Main Course)
  { name: 'Lamb Biryani', sourceCategory: 'biryani', category: 'hoofdgerecht', currentMenuPrice: 110 },
  { name: 'Chicken Biryani', sourceCategory: 'biryani', category: 'hoofdgerecht', currentMenuPrice: 95 },
  { name: 'Prawn Biryani', sourceCategory: 'biryani', category: 'hoofdgerecht', currentMenuPrice: 120 },
  { name: 'Fish Biryani', sourceCategory: 'biryani', category: 'hoofdgerecht', currentMenuPrice: 120 },
  { name: 'Vegetable Biryani', sourceCategory: 'biryani', category: 'hoofdgerecht', currentMenuPrice: 85 },

  // naan_rice -> bijgerecht (Side Dish)
  { name: 'Papadoms', sourceCategory: 'naan_rice', category: 'bijgerecht', currentMenuPrice: 15 },
  { name: 'Butter Naan', sourceCategory: 'naan_rice', category: 'bijgerecht', currentMenuPrice: 25 },
  { name: 'Garlic Naan', sourceCategory: 'naan_rice', category: 'bijgerecht', currentMenuPrice: 29 },
  { name: 'Cheese Naan', sourceCategory: 'naan_rice', category: 'bijgerecht', currentMenuPrice: 35 },
  { name: 'Roti', sourceCategory: 'naan_rice', category: 'bijgerecht', currentMenuPrice: 20 },
  { name: 'Ghee Rice', sourceCategory: 'naan_rice', category: 'bijgerecht', currentMenuPrice: 40 },
  { name: 'Basmati Rice', sourceCategory: 'naan_rice', category: 'bijgerecht', currentMenuPrice: 30 },
  { name: 'Veg Fried Rice', sourceCategory: 'naan_rice', category: 'bijgerecht', currentMenuPrice: 50 },
  { name: 'Cumin Rice', sourceCategory: 'naan_rice', category: 'bijgerecht', currentMenuPrice: 35 },
  { name: 'Chicken Fried Rice', sourceCategory: 'naan_rice', category: 'bijgerecht', currentMenuPrice: 80 },
  { name: 'Chicken Hakka Noodles', sourceCategory: 'naan_rice', category: 'bijgerecht', currentMenuPrice: 80 },
  { name: 'Veg Hakka Noodles', sourceCategory: 'naan_rice', category: 'bijgerecht', currentMenuPrice: 60 },
  { name: 'Biryani Plain Rice', sourceCategory: 'naan_rice', category: 'bijgerecht', currentMenuPrice: 50 },

  // desserts -> dessert (Dessert)
  { name: 'Kulfi (Mangue / Pistache / Malai)', sourceCategory: 'desserts', category: 'dessert', currentMenuPrice: 50 },
  { name: 'Kulfi Mango', sourceCategory: 'desserts', category: 'dessert', currentMenuPrice: 50 },

  // cold_drinks -> drank (Beverage)
  { name: 'Mango Lassi', sourceCategory: 'cold_drinks', category: 'drank', currentMenuPrice: 40 },
  { name: 'Lassi Sucré ou Salé', sourceCategory: 'cold_drinks', category: 'drank', currentMenuPrice: 35 },
  { name: 'Soda (330ml)', sourceCategory: 'cold_drinks', category: 'drank', currentMenuPrice: 20 },
  { name: 'Eau Minérale (50cl / 1.5L)', sourceCategory: 'cold_drinks', category: 'drank', currentMenuPrice: 15 },
  { name: 'Eau Gazeuse (50cl / 1.5L)', sourceCategory: 'cold_drinks', category: 'drank', currentMenuPrice: 15 },

  // hot_drinks -> drank (Beverage)
  { name: 'Masala Chai', sourceCategory: 'hot_drinks', category: 'drank', currentMenuPrice: 35 },
];

export interface IndianFlavorsIngredientSeed {
  name: string;
  category: IngredientCategory;
  purchaseUnit: PurchaseUnit;
  recipeUnit: RecipeUnit;
  conversionFactor: number;
  purchasePrice: number; // 0 MAD
  supplier?: string;
}

export const DUTCH_TO_FRENCH_INGREDIENTS_MAP: Record<string, string> = {
  // Meat & Poultry
  'Kip (filet/boneless)': 'Poulet (filet/sans os)',
  'Lamsvlees': 'Agneau',
  'Lamsgehakt': 'Agneau haché',

  // Fish & Seafood
  'Garnalen': 'Crevettes',
  'Visfilet': 'Filet de poisson',

  // Dairy Products
  'Paneer': 'Paneer',
  'Yoghurt': 'Yaourt',
  'Boter': 'Beurre',
  'Room': 'Crème fraîche',
  'Melk': 'Lait',
  'Ghee': 'Ghee',
  'Kaas (voor naan)': 'Fromage (pour naan)',

  // Grains & Starches
  'Basmati rijst': 'Riz basmati',
  'Bloem (voor naan/roti)': 'Farine (pour naan/roti)',
  'Kikkererwtenmeel (besan)': 'Farine de pois chiches (besan)',
  'Eiernoodles': 'Nouilles aux œufs',

  // Vegetables & Produce
  'Ui': 'Oignon',
  'Knoflook': 'Ail',
  'Gember': 'Gingembre',
  'Tomaat': 'Tomate',
  'Aardappel': 'Pomme de terre',
  'Bloemkool': 'Chou-fleur',
  'Champignons': 'Champignons',
  'Spinazie': 'Épinards',
  'Rode kidneybonen': 'Haricots rouges',
  'Gele linzen': 'Lentilles jaunes',
  'Groene chilipeper': 'Piment vert',
  'Komkommer': 'Concombre',
  'Paprika': 'Poivron',
  'Mango': 'Mangue',
  'Munt (vers)': 'Menthe (fraîche)',
  'Koriander (vers)': 'Coriandre (fraîche)',

  // Spices & Seasoning
  'Garam masala': 'Garam masala',
  'Kurkuma': 'Curcuma',
  'Komijnpoeder': 'Cumin en poudre',
  'Komijnzaad': 'Graines de cumin',
  'Chilipoeder': 'Piment en poudre',
  'Korianderpoeder': 'Coriandre en poudre',
  'Kardemom': 'Cardamome',
  'Kaneel': 'Cannelle',
  'Kruidnagel': 'Clou de girofle',

  // Oils & Fats
  'Zonnebloemolie/frituurolie': 'Huile de tournesol/friture',

  // Other Ingredients
  'Sojasaus': 'Sauce soja',
  'Suiker': 'Sucre',
  'Thee (voor masala chai)': 'Thé (pour masala chai)',
  'Koffie': 'Café',
  'Frisdrank (blikje/fles, kant-en-klaar)': 'Soda (canette/bouteille)',
  'Mineraalwater plat (fles)': 'Eau minérale plate (bouteille)',
  'Mineraalwater bruisend (fles)': 'Eau minérale gazeuse (bouteille)',
};

/**
 * Common base ingredients used across Indian cuisine for Indian Flavors in French.
 * Seeded with purchasePrice 0 MAD (to be filled in by the restaurant manager).
 */
export const INDIAN_FLAVORS_BASE_INGREDIENTS: IndianFlavorsIngredientSeed[] = [
  // Categorie "Meat & Poultry" (vlees)
  { name: 'Poulet (filet/sans os)', category: 'vlees', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Agneau', category: 'vlees', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Agneau haché', category: 'vlees', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },

  // Categorie "Fish & Seafood" (vis)
  { name: 'Crevettes', category: 'vis', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Filet de poisson', category: 'vis', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },

  // Categorie "Dairy Products" (zuivel)
  { name: 'Paneer', category: 'zuivel', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Yaourt', category: 'zuivel', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Beurre', category: 'zuivel', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Crème fraîche', category: 'zuivel', purchaseUnit: 'l', recipeUnit: 'ml', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Lait', category: 'zuivel', purchaseUnit: 'l', recipeUnit: 'ml', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Ghee', category: 'zuivel', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Fromage (pour naan)', category: 'zuivel', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },

  // Categorie "Grains & Starches" (granen)
  { name: 'Riz basmati', category: 'granen', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Farine (pour naan/roti)', category: 'granen', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Farine de pois chiches (besan)', category: 'granen', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Nouilles aux œufs', category: 'granen', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },

  // Categorie "Vegetables & Produce" (groente)
  { name: 'Oignon', category: 'groente', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Ail', category: 'groente', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Gingembre', category: 'groente', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Tomate', category: 'groente', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Pomme de terre', category: 'groente', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Chou-fleur', category: 'groente', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Champignons', category: 'groente', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Épinards', category: 'groente', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Haricots rouges', category: 'groente', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Lentilles jaunes', category: 'groente', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Piment vert', category: 'groente', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Concombre', category: 'groente', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Poivron', category: 'groente', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Mangue', category: 'groente', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Menthe (fraîche)', category: 'groente', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Coriandre (fraîche)', category: 'groente', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },

  // Categorie "Spices & Seasoning" (specerijen)
  { name: 'Garam masala', category: 'specerijen', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Curcuma', category: 'specerijen', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Cumin en poudre', category: 'specerijen', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Graines de cumin', category: 'specerijen', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Piment en poudre', category: 'specerijen', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Coriandre en poudre', category: 'specerijen', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Cardamome', category: 'specerijen', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Cannelle', category: 'specerijen', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Clou de girofle', category: 'specerijen', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },

  // Categorie "Oils & Fats" (olie/vet)
  { name: 'Huile de tournesol/friture', category: 'olie/vet', purchaseUnit: 'l', recipeUnit: 'ml', conversionFactor: 1000, purchasePrice: 0 },

  // Categorie "Other Ingredients" (overig)
  { name: 'Sauce soja', category: 'overig', purchaseUnit: 'l', recipeUnit: 'ml', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Sucre', category: 'overig', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Thé (pour masala chai)', category: 'overig', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Café', category: 'overig', purchaseUnit: 'kg', recipeUnit: 'g', conversionFactor: 1000, purchasePrice: 0 },
  { name: 'Soda (canette/bouteille)', category: 'overig', purchaseUnit: 'stuk', recipeUnit: 'stuk', conversionFactor: 1, purchasePrice: 0 },
  { name: 'Eau minérale plate (bouteille)', category: 'overig', purchaseUnit: 'stuk', recipeUnit: 'stuk', conversionFactor: 1, purchasePrice: 0 },
  { name: 'Eau minérale gazeuse (bouteille)', category: 'overig', purchaseUnit: 'stuk', recipeUnit: 'stuk', conversionFactor: 1, purchasePrice: 0 },
];
