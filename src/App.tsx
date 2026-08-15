/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { db, COLLECTIONS } from './lib/firebase';
import { Tenant, Ingredient, Recipe, ActiveTab, Language } from './types';
import { translations } from './lib/i18n';
import {
  INITIAL_DEMO_TENANTS,
  INITIAL_DEMO_INGREDIENTS,
  INITIAL_DEMO_RECIPES,
  INDIAN_FLAVORS_MENU_ITEMS,
  INDIAN_FLAVORS_BASE_INGREDIENTS,
  DUTCH_TO_FRENCH_INGREDIENTS_MAP,
} from './lib/seedData';
import {
  calculateRecipePricing,
  calculateMenuEngineering,
  RecipePricingCalculation,
} from './lib/recipeCalculations';
import { Header } from './components/Header';
import { NavigationTabs } from './components/NavigationTabs';
import { StatsBar } from './components/StatsBar';
import { RecipeStatsBar } from './components/RecipeStatsBar';
import { PricingStatsBar } from './components/PricingStatsBar';
import { PricingSettingsCard } from './components/PricingSettingsCard';
import { PricingTable } from './components/PricingTable';
import { PriceOverrideModal } from './components/PriceOverrideModal';
import { MenuEngineeringHeaderCard } from './components/MenuEngineeringHeaderCard';
import { MenuEngineeringMatrix } from './components/MenuEngineeringMatrix';
import { MenuEngineeringTable } from './components/MenuEngineeringTable';
import { SalesCSVImportModal } from './components/SalesCSVImportModal';
import { IngredientTable } from './components/IngredientTable';
import { IngredientFormModal } from './components/IngredientFormModal';
import { PriceHistoryModal } from './components/PriceHistoryModal';
import { RecipeTable } from './components/RecipeTable';
import { RecipeFormModal } from './components/RecipeFormModal';
import { RecipeDetailsModal } from './components/RecipeDetailsModal';
import { TenantModal } from './components/TenantModal';
import { CheckCircle2, AlertCircle, RefreshCw, Database } from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<Language>('fr');
  const t = translations[language];

  // Active navigation tab ('ingredients' | 'recipes' | 'pricing')
  const [activeTab, setActiveTab] = useState<ActiveTab>('pricing');

  // Tenants state
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoadingTenants, setIsLoadingTenants] = useState(true);

  // Ingredients state
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(false);

  // Recipes state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);

  // Modals state: Ingredients
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [historyIngredient, setHistoryIngredient] = useState<Ingredient | null>(null);

  // Modals state: Recipes
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [detailsRecipe, setDetailsRecipe] = useState<Recipe | null>(null);

  // Modals state: Pricing Price Override
  const [overrideRecipe, setOverrideRecipe] = useState<Recipe | null>(null);
  const [overridePricingCalc, setOverridePricingCalc] = useState<RecipePricingCalculation | null>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

  // Modals state: CSV Sales Volume Import
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);

  // Tenant modal state
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Map of ingredients for fast lookup across recipe calculations
  const ingredientsMap = useMemo(() => {
    const map = new Map<string, Ingredient>();
    ingredients.forEach((ing) => {
      if (ing.id) map.set(ing.id, ing);
    });
    return map;
  }, [ingredients]);

  // Derived tenant financial settings with strict standard fallbacks
  const tenantTargetFoodCost = currentTenant?.targetFoodCostPercentage ?? 30;
  const tenantTvaPercentage = currentTenant?.tvaPercentage ?? 20;
  const tenantDeliveryCommission = currentTenant?.deliveryCommissionPercentage ?? 27;

  // Pre-calculated pricing list for current tenant recipes
  const pricingList = useMemo(() => {
    return recipes.map((rec) =>
      calculateRecipePricing(
        rec,
        ingredientsMap,
        tenantTargetFoodCost,
        tenantTvaPercentage,
        tenantDeliveryCommission
      )
    );
  }, [recipes, ingredientsMap, tenantTargetFoodCost, tenantTvaPercentage, tenantDeliveryCommission]);

  // Selected Category for Menu Engineering tab
  const [engineeringCategory, setEngineeringCategory] = useState<any>('ALL');

  // Pre-calculated Menu Engineering (Kasavana & Smith) list
  const menuEngineeringItems = useMemo(() => {
    return calculateMenuEngineering(
      recipes,
      ingredientsMap,
      tenantTargetFoodCost,
      tenantTvaPercentage,
      tenantDeliveryCommission
    );
  }, [recipes, ingredientsMap, tenantTargetFoodCost, tenantTvaPercentage, tenantDeliveryCommission]);

  // Compute most recent sales volume update date and source
  const latestSalesVolumeInfo = useMemo(() => {
    let latestDate: string | null = null;
    let latestSource: 'import' | 'manual' | null = null;

    recipes.forEach((r) => {
      if (r.salesVolumeLastUpdated) {
        if (!latestDate || new Date(r.salesVolumeLastUpdated) > new Date(latestDate)) {
          latestDate = r.salesVolumeLastUpdated;
          latestSource = r.salesVolumeImportSource || 'manual';
        }
      }
    });

    return { latestDate, latestSource };
  }, [recipes]);

  // 1. Fetch / Sync Tenants from Firestore
  useEffect(() => {
    setIsLoadingTenants(true);
    const tenantsRef = collection(db, COLLECTIONS.TENANTS);

    const unsubscribe = onSnapshot(
      tenantsRef,
      async (snapshot) => {
        if (snapshot.empty) {
          // Auto-seed initial demo tenants, ingredients, and recipes on first start
          try {
            console.log('Seeding initial demo data to Firestore...');
            for (const tenant of INITIAL_DEMO_TENANTS) {
              const tenantDocRef = doc(db, COLLECTIONS.TENANTS, tenant.id);
              await setDoc(tenantDocRef, tenant);
            }
            for (const ing of INITIAL_DEMO_INGREDIENTS) {
              const ingDocRef = doc(db, COLLECTIONS.INGREDIENTS, ing.id);
              await setDoc(ingDocRef, ing);
            }
            for (const rec of INITIAL_DEMO_RECIPES) {
              const recDocRef = doc(db, COLLECTIONS.RECIPES, rec.id);
              await setDoc(recDocRef, rec);
            }
          } catch (seedErr) {
            console.error('Error seeding initial data:', seedErr);
          }
        } else {
          const tenantList: Tenant[] = snapshot.docs.map((d) => ({
            id: d.id,
            targetFoodCostPercentage: 30,
            tvaPercentage: 20,
            deliveryCommissionPercentage: 27,
            ...(d.data() as Omit<Tenant, 'id'>),
          }));
          setTenants(tenantList);

          // Select default tenant if none selected
          if (!currentTenant && tenantList.length > 0) {
            setCurrentTenant(tenantList[0]);
          } else if (currentTenant) {
            const updated = tenantList.find((t) => t.id === currentTenant.id);
            if (updated) setCurrentTenant(updated);
          }
          setIsLoadingTenants(false);
        }
      },
      (error) => {
        console.error('Error listening to tenants:', error);
        setTenants(INITIAL_DEMO_TENANTS);
        setCurrentTenant(INITIAL_DEMO_TENANTS[0]);
        setIsLoadingTenants(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Fetch / Sync Ingredients for currentTenant from Firestore
  useEffect(() => {
    if (!currentTenant) {
      setIngredients([]);
      return;
    }

    setIsLoadingIngredients(true);
    const ingredientsQuery = query(
      collection(db, COLLECTIONS.INGREDIENTS),
      where('tenantId', '==', currentTenant.id)
    );

    const unsubscribe = onSnapshot(
      ingredientsQuery,
      (snapshot) => {
        const ingList: Ingredient[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Ingredient, 'id'>),
        }));
        setIngredients(ingList);
        setIsLoadingIngredients(false);
      },
      (error) => {
        console.error('Error listening to ingredients:', error);
        setIsLoadingIngredients(false);
      }
    );

    return () => unsubscribe();
  }, [currentTenant?.id]);

  // Auto-correct existing Dutch ingredient names to French in Firestore (modifies name only)
  useEffect(() => {
    if (!ingredients || ingredients.length === 0) return;

    const mapNormalized: Record<string, string> = {};
    Object.entries(DUTCH_TO_FRENCH_INGREDIENTS_MAP).forEach(([nl, fr]) => {
      mapNormalized[nl.trim().toLowerCase()] = fr;
    });

    const toUpdate: { id: string; newName: string }[] = [];
    ingredients.forEach((ing) => {
      if (!ing.id) return;
      const lower = ing.name.trim().toLowerCase();
      const mappedFrench = mapNormalized[lower];
      if (mappedFrench && ing.name !== mappedFrench) {
        toUpdate.push({ id: ing.id, newName: mappedFrench });
      }
    });

    if (toUpdate.length > 0) {
      const nowIso = new Date().toISOString();
      toUpdate.forEach(async ({ id, newName }) => {
        try {
          const docRef = doc(db, COLLECTIONS.INGREDIENTS, id);
          await updateDoc(docRef, {
            name: newName,
            updatedAt: nowIso,
          });
        } catch (err) {
          console.error(`Failed to update ingredient ${id} to ${newName}:`, err);
        }
      });
    }
  }, [ingredients]);

  // 3. Fetch / Sync Recipes for currentTenant from Firestore
  useEffect(() => {
    if (!currentTenant) {
      setRecipes([]);
      return;
    }

    setIsLoadingRecipes(true);
    const recipesQuery = query(
      collection(db, COLLECTIONS.RECIPES),
      where('tenantId', '==', currentTenant.id)
    );

    const unsubscribe = onSnapshot(
      recipesQuery,
      (snapshot) => {
        const recList: Recipe[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Recipe, 'id'>),
        }));
        setRecipes(recList);
        setIsLoadingRecipes(false);
      },
      (error) => {
        console.error('Error listening to recipes:', error);
        setIsLoadingRecipes(false);
      }
    );

    return () => unsubscribe();
  }, [currentTenant?.id]);

  // Handler: Update Tenant Settings (targetFoodCost, tva, deliveryCommission)
  const handleSaveTenantSettings = async (settings: {
    targetFoodCostPercentage: number;
    tvaPercentage: number;
    deliveryCommissionPercentage: number;
  }) => {
    if (!currentTenant || !currentTenant.id) return;
    try {
      const tenantDocRef = doc(db, COLLECTIONS.TENANTS, currentTenant.id);
      await updateDoc(tenantDocRef, {
        ...settings,
      });
      setCurrentTenant((prev) => (prev ? { ...prev, ...settings } : prev));
      showToast(t.toastTenantSettingsUpdated, 'success');
    } catch (err: any) {
      console.error('Error updating tenant settings:', err);
      showToast(err?.message || t.toastError, 'error');
      throw err;
    }
  };

  // Handler: Update / Clear Recipe Price Override
  const handleSaveRecipePriceOverride = async (recipeId: string, manualPriceOverride?: number) => {
    try {
      const recDocRef = doc(db, COLLECTIONS.RECIPES, recipeId);
      if (typeof manualPriceOverride === 'number' && manualPriceOverride > 0) {
        await updateDoc(recDocRef, {
          manualPriceOverride,
          updatedAt: new Date().toISOString(),
        });
        showToast(t.toastPriceOverrideUpdated, 'success');
      } else {
        await updateDoc(recDocRef, {
          manualPriceOverride: null as any,
          updatedAt: new Date().toISOString(),
        });
        showToast(t.toastPriceOverrideCleared, 'success');
      }
    } catch (err: any) {
      console.error('Error updating recipe price override:', err);
      showToast(err?.message || t.toastError, 'error');
      throw err;
    }
  };

  // Handler: Update Recipe Monthly Sales Volume (for Menu Engineering)
  const handleUpdateRecipeSalesVolume = async (recipeId: string, volume: number) => {
    try {
      const nowIso = new Date().toISOString();
      const recDocRef = doc(db, COLLECTIONS.RECIPES, recipeId);
      await updateDoc(recDocRef, {
        monthlySalesVolume: Math.max(0, volume),
        salesVolumeLastUpdated: nowIso,
        salesVolumeImportSource: 'manual',
        updatedAt: nowIso,
      });
      showToast(
        language === 'fr' ? 'Volume de ventes mis à jour' : 'Sales volume updated',
        'success'
      );
    } catch (err: any) {
      console.error('Error updating sales volume:', err);
      showToast(err?.message || t.toastError, 'error');
      throw err;
    }
  };

  // Handler: Batch Import Sales Volumes via CSV
  const handleBatchImportSalesVolumes = async (
    matches: { recipeId: string; volume: number }[]
  ) => {
    try {
      const nowIso = new Date().toISOString();
      for (const item of matches) {
        const recDocRef = doc(db, COLLECTIONS.RECIPES, item.recipeId);
        await updateDoc(recDocRef, {
          monthlySalesVolume: Math.max(0, item.volume),
          salesVolumeLastUpdated: nowIso,
          salesVolumeImportSource: 'import',
          updatedAt: nowIso,
        });
      }
      showToast(
        t.importSuccessToast.replace('{count}', String(matches.length)),
        'success'
      );
    } catch (err: any) {
      console.error('Error batch importing sales volumes:', err);
      showToast(err?.message || t.toastError, 'error');
      throw err;
    }
  };

  // Handler: Add or Update Ingredient
  const handleSaveIngredient = async (ingredientData: Omit<Ingredient, 'id'>) => {
    if (!currentTenant) return;

    try {
      if (editingIngredient && editingIngredient.id) {
        const docRef = doc(db, COLLECTIONS.INGREDIENTS, editingIngredient.id);
        await updateDoc(docRef, {
          ...ingredientData,
          updatedAt: new Date().toISOString(),
        });
        showToast(t.toastUpdated, 'success');
      } else {
        await addDoc(collection(db, COLLECTIONS.INGREDIENTS), {
          ...ingredientData,
          tenantId: currentTenant.id,
          updatedAt: new Date().toISOString(),
        });
        showToast(t.toastAdded, 'success');
      }
      setEditingIngredient(null);
    } catch (err: any) {
      console.error('Error saving ingredient:', err);
      showToast(err?.message || t.toastError, 'error');
      throw err;
    }
  };

  // Handler: Delete Ingredient
  const handleDeleteIngredient = async (id: string) => {
    try {
      const docRef = doc(db, COLLECTIONS.INGREDIENTS, id);
      await deleteDoc(docRef);
      showToast(t.toastDeleted, 'success');
    } catch (err: any) {
      console.error('Error deleting ingredient:', err);
      showToast(err?.message || t.toastError, 'error');
      throw err;
    }
  };

  // Handler: Add or Update Recipe
  const handleSaveRecipe = async (recipeData: Omit<Recipe, 'id'>) => {
    if (!currentTenant) return;

    try {
      if (editingRecipe && editingRecipe.id) {
        const docRef = doc(db, COLLECTIONS.RECIPES, editingRecipe.id);
        await updateDoc(docRef, {
          ...recipeData,
          tenantId: currentTenant.id,
          updatedAt: new Date().toISOString(),
        });
        showToast(t.toastRecipeUpdated, 'success');
      } else {
        await addDoc(collection(db, COLLECTIONS.RECIPES), {
          ...recipeData,
          tenantId: currentTenant.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        showToast(t.toastRecipeAdded, 'success');
      }
      setEditingRecipe(null);
    } catch (err: any) {
      console.error('Error saving recipe:', err);
      showToast(err?.message || t.toastError, 'error');
      throw err;
    }
  };

  // Handler: Delete Recipe
  const handleDeleteRecipe = async (id: string) => {
    try {
      const docRef = doc(db, COLLECTIONS.RECIPES, id);
      await deleteDoc(docRef);
      showToast(t.toastRecipeDeleted, 'success');
    } catch (err: any) {
      console.error('Error deleting recipe:', err);
      showToast(err?.message || t.toastError, 'error');
      throw err;
    }
  };

  // Handler: Create New Tenant
  const handleCreateTenant = async (tenantData: Omit<Tenant, 'id'>) => {
    try {
      const newTenantPayload = {
        targetFoodCostPercentage: 30,
        tvaPercentage: 20,
        deliveryCommissionPercentage: 27,
        ...tenantData,
      };
      const docRef = await addDoc(collection(db, COLLECTIONS.TENANTS), newTenantPayload);
      const newTenant: Tenant = {
        id: docRef.id,
        ...newTenantPayload,
      };
      setCurrentTenant(newTenant);
      showToast(t.toastTenantAdded, 'success');
    } catch (err: any) {
      console.error('Error creating tenant:', err);
      showToast(err?.message || t.toastError, 'error');
      throw err;
    }
  };

  // Quick Seed Trigger for manual test
  const handleSeedMoreSampleData = async () => {
    if (!currentTenant) return;
    try {
      for (const ing of INITIAL_DEMO_INGREDIENTS) {
        const ingDocRef = doc(db, COLLECTIONS.INGREDIENTS, ing.id);
        await setDoc(ingDocRef, {
          ...ing,
          tenantId: currentTenant.id,
        });
      }
      for (const rec of INITIAL_DEMO_RECIPES) {
        const recDocRef = doc(db, COLLECTIONS.RECIPES, rec.id);
        await setDoc(recDocRef, {
          ...rec,
          tenantId: currentTenant.id,
        });
      }
      showToast(
        language === 'fr' ? 'Données démo chargées avec succès' : 'Demo data loaded successfully',
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || t.toastError, 'error');
    }
  };

  // Handler: Import Indian Flavors Menu (53 items with currentMenuPrice, idempotent)
  const handleSeedIndianFlavors = async () => {
    if (!currentTenant || !currentTenant.id) {
      showToast(language === 'fr' ? 'Aucun restaurant sélectionné' : 'No restaurant selected', 'error');
      return;
    }

    try {
      // Build a set of existing lowercase trimmed names for this tenant to ensure idempotency
      const existingNames = new Set(
        recipes.map((r) => r.name.toLowerCase().trim())
      );

      const itemsToInsert = INDIAN_FLAVORS_MENU_ITEMS.filter(
        (item) => !existingNames.has(item.name.toLowerCase().trim())
      );

      if (itemsToInsert.length === 0) {
        showToast(
          language === 'fr'
            ? 'Tous les 53 plats de la carte Indian Flavors existent déjà dans ce restaurant.'
            : 'All 53 Indian Flavors menu dishes already exist in this restaurant.',
          'success'
        );
        return;
      }

      const nowIso = new Date().toISOString();
      const recipesCollectionRef = collection(db, COLLECTIONS.RECIPES);

      for (const item of itemsToInsert) {
        await addDoc(recipesCollectionRef, {
          tenantId: currentTenant.id,
          name: item.name,
          category: item.category,
          portionSize: item.portionSize ?? 1,
          portionUnit: item.portionUnit ?? 'portion',
          monthlySalesVolume: 0,
          notes: item.notes || '',
          currentMenuPrice: item.currentMenuPrice,
          recipeIngredients: [],
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }

      const msg =
        language === 'fr'
          ? `${itemsToInsert.length} plats Indian Flavors importés (${53 - itemsToInsert.length} existaient déjà)`
          : `Successfully imported ${itemsToInsert.length} Indian Flavors dishes (${53 - itemsToInsert.length} already existed)`;
      showToast(msg, 'success');
    } catch (err: any) {
      console.error('Error importing Indian Flavors menu:', err);
      showToast(err?.message || t.toastError, 'error');
    }
  };

  /**
   * Seed Indian Flavors base ingredients for the selected tenant
   * Idempotent: checks for existing ingredient names
   */
  const handleSeedIndianFlavorsIngredients = async () => {
    if (!currentTenant) {
      showToast(language === 'fr' ? 'Veuillez sélectionner un établissement' : 'Please select a restaurant', 'error');
      return;
    }

    try {
      const existingNames = new Set(
        ingredients.map((i) => i.name.trim().toLowerCase())
      );

      // Also map Dutch equivalents to avoid re-inserting if old Dutch names are still present
      const reverseMap: Record<string, string> = {};
      Object.entries(DUTCH_TO_FRENCH_INGREDIENTS_MAP).forEach(([nl, fr]) => {
        reverseMap[fr.trim().toLowerCase()] = nl.trim().toLowerCase();
      });

      const itemsToInsert = INDIAN_FLAVORS_BASE_INGREDIENTS.filter((item) => {
        const frLower = item.name.trim().toLowerCase();
        const nlLower = reverseMap[frLower];
        return !existingNames.has(frLower) && (!nlLower || !existingNames.has(nlLower));
      });

      if (itemsToInsert.length === 0) {
        showToast(
          t.importIndianFlavorsIngredientsAllExist ||
            (language === 'fr'
              ? 'Tous les ingrédients de base Indian Flavors existent déjà pour cet établissement.'
              : 'All Indian Flavors base ingredients already exist for this restaurant.'),
          'success'
        );
        return;
      }

      const nowIso = new Date().toISOString();
      const ingredientsCollectionRef = collection(db, COLLECTIONS.INGREDIENTS);

      for (const item of itemsToInsert) {
        await addDoc(ingredientsCollectionRef, {
          tenantId: currentTenant.id,
          name: item.name,
          category: item.category,
          purchaseUnit: item.purchaseUnit,
          purchasePrice: 0,
          recipeUnit: item.recipeUnit,
          conversionFactor: item.conversionFactor,
          supplier: item.supplier || '',
          updatedAt: nowIso,
          priceHistory: [],
        });
      }

      const skippedCount = INDIAN_FLAVORS_BASE_INGREDIENTS.length - itemsToInsert.length;
      const msg =
        language === 'fr'
          ? `${itemsToInsert.length} ingrédients de base Indian Flavors importés avec succès (${skippedCount} déjà existants)`
          : `Successfully imported ${itemsToInsert.length} Indian Flavors base ingredients (${skippedCount} already existed)`;
      showToast(msg, 'success');
    } catch (err: any) {
      console.error('Error importing Indian Flavors base ingredients:', err);
      showToast(err?.message || t.toastError, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-600 selection:text-white">
      
      {/* App Header */}
      <Header
        tenants={tenants}
        currentTenant={currentTenant}
        onSelectTenant={(t) => setCurrentTenant(t)}
        onOpenNewTenantModal={() => setIsTenantModalOpen(true)}
        language={language}
        onToggleLanguage={(l) => setLanguage(l)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        
        {/* Tenant Status & Context Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#0A1F44] font-semibold">
                {t.tenantLabel}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-mono text-slate-400">
                DB: amplify-cost-engine
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-0.5">
              {currentTenant ? currentTenant.name : t.tenantSelectorPlaceholder}
            </h1>
            {currentTenant?.description && (
              <p className="text-xs text-slate-500 mt-0.5">
                {currentTenant.description}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5 animate-pulse" />
              {t.tenantActive}
            </span>

            {ingredients.length === 0 && !isLoadingIngredients && (
              <>
                <button
                  id="banner-import-indian-flavors-ingredients-btn"
                  type="button"
                  onClick={handleSeedIndianFlavorsIngredients}
                  className="px-3 py-1 text-xs font-semibold text-[#0A1F44] bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors shadow-2xs flex items-center space-x-1"
                >
                  <span>{t.importIndianFlavorsIngredientsShortBtn}</span>
                </button>
                <button
                  id="load-demo-seed-btn"
                  type="button"
                  onClick={handleSeedMoreSampleData}
                  className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors shadow-2xs"
                >
                  {t.demoSeedBtn}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs (Ingredients vs Recipes vs Pricing) */}
        <NavigationTabs
          activeTab={activeTab}
          onChangeTab={(tab) => setActiveTab(tab)}
          ingredientsCount={ingredients.length}
          recipesCount={recipes.length}
          language={language}
        />

        {/* Dynamic Content Based on Tab */}
        {activeTab === 'ingredients' ? (
          <div className="space-y-5 animate-in fade-in duration-100">
            {/* Ingredients Stats Bar */}
            <StatsBar ingredients={ingredients} language={language} />

            {/* Ingredients Table */}
            <IngredientTable
              ingredients={ingredients}
              isLoading={isLoadingIngredients}
              onEdit={(ing) => {
                setEditingIngredient(ing);
                setIsFormModalOpen(true);
              }}
              onDelete={handleDeleteIngredient}
              onViewHistory={(ing) => setHistoryIngredient(ing)}
              onAddNew={() => {
                setEditingIngredient(null);
                setIsFormModalOpen(true);
              }}
              onImportIndianFlavors={handleSeedIndianFlavorsIngredients}
              language={language}
            />
          </div>
        ) : activeTab === 'recipes' ? (
          <div className="space-y-5 animate-in fade-in duration-100">
            {/* Recipes Stats Bar */}
            <RecipeStatsBar
              recipes={recipes}
              ingredientsMap={ingredientsMap}
              language={language}
            />

            {/* Recipes Table */}
            <RecipeTable
              recipes={recipes}
              ingredientsMap={ingredientsMap}
              isLoading={isLoadingRecipes}
              onEdit={(recipe) => {
                setEditingRecipe(recipe);
                setIsRecipeModalOpen(true);
              }}
              onDelete={handleDeleteRecipe}
              onViewDetails={(recipe) => setDetailsRecipe(recipe)}
              onAddNew={() => {
                setEditingRecipe(null);
                setIsRecipeModalOpen(true);
              }}
              onImportIndianFlavors={handleSeedIndianFlavors}
              language={language}
            />
          </div>
        ) : activeTab === 'pricing' ? (
          /* Pricing & Margins Module Tab */
          <div className="space-y-5 animate-in fade-in duration-100">
            {/* 1. Summary Stats Bar: Menu Avg Food Cost, Target count, Critical count, Avg Margin */}
            <PricingStatsBar
              pricingList={pricingList}
              targetFoodCost={tenantTargetFoodCost}
              language={language}
            />

            {/* 2. Top Settings Panel: Target Food Cost %, TVA %, Glovo Commission % */}
            <PricingSettingsCard
              targetFoodCost={tenantTargetFoodCost}
              tvaPercentage={tenantTvaPercentage}
              deliveryCommission={tenantDeliveryCommission}
              onSaveSettings={handleSaveTenantSettings}
              language={language}
            />

            {/* 3. Pricing Interactive Table */}
            <PricingTable
              recipes={recipes}
              ingredientsMap={ingredientsMap}
              targetFoodCost={tenantTargetFoodCost}
              tvaPercentage={tenantTvaPercentage}
              deliveryCommission={tenantDeliveryCommission}
              isLoading={isLoadingRecipes || isLoadingIngredients}
              onOpenOverrideModal={(recipe, calc) => {
                setOverrideRecipe(recipe);
                setOverridePricingCalc(calc);
                setIsOverrideModalOpen(true);
              }}
              onClearOverride={(recipeId) => handleSaveRecipePriceOverride(recipeId, undefined)}
              language={language}
            />
          </div>
        ) : (
          /* Menu Engineering Module Tab (Kasavana & Smith Matrix) */
          <div className="space-y-5 animate-in fade-in duration-100">
            {/* Header Card with Kasavana Title, Last CSV Import Timestamp & Import Button */}
            <MenuEngineeringHeaderCard
              items={menuEngineeringItems}
              lastUpdatedDate={latestSalesVolumeInfo.latestDate}
              lastUpdatedSource={latestSalesVolumeInfo.latestSource}
              onOpenImportModal={() => setIsCSVModalOpen(true)}
              language={language}
            />

            {/* 1. Kasavana & Smith 2x2 Scatter Matrix Visualizer */}
            <MenuEngineeringMatrix
              items={menuEngineeringItems}
              selectedCategory={engineeringCategory}
              language={language}
              onSelectItem={(item) => {
                setDetailsRecipe(item.recipe);
              }}
            />

            {/* 2. Menu Engineering Analysis Table with Inline Volume Editing & CSV Export */}
            <MenuEngineeringTable
              items={menuEngineeringItems}
              selectedCategory={engineeringCategory}
              onChangeCategory={(cat) => setEngineeringCategory(cat)}
              onUpdateSalesVolume={handleUpdateRecipeSalesVolume}
              language={language}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Amplify Cost Engine v1.2 • Recipes, Costs & Menu Pricing Engineering
          </span>
          <span className="text-slate-400">
            Devise: MAD • Firestore Database: amplify-cost-engine
          </span>
        </div>
      </footer>

      {/* CSV Sales Volume Import Modal */}
      <SalesCSVImportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        recipes={recipes}
        onConfirmImport={handleBatchImportSalesVolumes}
        language={language}
      />

      {/* Add / Edit Ingredient Modal */}
      {currentTenant && (
        <IngredientFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingIngredient(null);
          }}
          onSubmit={handleSaveIngredient}
          initialIngredient={editingIngredient}
          tenantId={currentTenant.id}
          language={language}
        />
      )}

      {/* Price History Timeline Modal */}
      <PriceHistoryModal
        ingredient={historyIngredient}
        onClose={() => setHistoryIngredient(null)}
        language={language}
      />

      {/* Add / Edit Recipe Modal */}
      {currentTenant && (
        <RecipeFormModal
          isOpen={isRecipeModalOpen}
          onClose={() => {
            setIsRecipeModalOpen(false);
            setEditingRecipe(null);
          }}
          onSave={handleSaveRecipe}
          editingRecipe={editingRecipe}
          ingredients={ingredients}
          onNavigateToIngredientsTab={() => {
            setActiveTab('ingredients');
            setIsFormModalOpen(true);
          }}
          language={language}
        />
      )}

      {/* Recipe Details / Breakdown Modal */}
      <RecipeDetailsModal
        recipe={detailsRecipe}
        ingredientsMap={ingredientsMap}
        targetFoodCost={tenantTargetFoodCost}
        tvaPercentage={tenantTvaPercentage}
        deliveryCommission={tenantDeliveryCommission}
        restaurantName={currentTenant?.name}
        isOpen={!!detailsRecipe}
        onClose={() => setDetailsRecipe(null)}
        onEdit={(rec) => {
          setDetailsRecipe(null);
          setEditingRecipe(rec);
          setIsRecipeModalOpen(true);
        }}
        language={language}
      />

      {/* Price Override Modal for Pricing Tab */}
      <PriceOverrideModal
        recipe={overrideRecipe}
        pricingCalc={overridePricingCalc}
        isOpen={isOverrideModalOpen}
        onClose={() => {
          setIsOverrideModalOpen(false);
          setOverrideRecipe(null);
          setOverridePricingCalc(null);
        }}
        onSaveOverride={handleSaveRecipePriceOverride}
        language={language}
      />

      {/* New Tenant Modal */}
      <TenantModal
        isOpen={isTenantModalOpen}
        onClose={() => setIsTenantModalOpen(false)}
        onSubmit={handleCreateTenant}
        language={language}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          id="app-toast-notification"
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-xl border flex items-center space-x-2.5 text-xs font-medium animate-in slide-in-from-bottom-5 duration-150 ${
            toast.type === 'success'
              ? 'bg-[#0A1F44] text-white border-slate-800'
              : 'bg-rose-900 text-rose-100 border-rose-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-300 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}
