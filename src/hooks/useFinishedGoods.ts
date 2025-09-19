/**
 * React hook for managing finished goods data with IndexedDB
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  finishedGoodsDB, 
  FinishedGood, 
  FinishedGoodCategory
} from '@/lib/indexeddb';
import { fetchFinishedGoodsClient, IDempiereAPIError } from '@/lib/idempiere-api';

interface UseFinishedGoodsState {
  finishedGoods: FinishedGood[];
  categories: FinishedGoodCategory[];
  loading: boolean;
  error: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncTime: string | null;
  recordCount: number;
  isInitializing: boolean;
  syncProgress: {
    stage: 'fetching' | 'storing' | 'processing' | 'complete' | null;
    message: string;
    percentage: number;
  };
}

interface UseFinishedGoodsActions {
  syncData: () => Promise<void>;
  searchProducts: (searchTerm: string) => Promise<FinishedGood[]>;
  getProductsByCategory: (categoryId: number) => Promise<FinishedGood[]>;
  clearData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

export function useFinishedGoods(): UseFinishedGoodsState & UseFinishedGoodsActions {
  const { isSignedIn, isLoaded } = useUser();
  
  const [state, setState] = useState<UseFinishedGoodsState>({
    finishedGoods: [],
    categories: [],
    loading: false,
    error: null,
    syncStatus: 'idle',
    lastSyncTime: null,
    recordCount: 0,
    isInitializing: false,
    syncProgress: {
      stage: null,
      message: '',
      percentage: 0,
    },
  });

  // Initialize IndexedDB and load data when user signs in
  useEffect(() => {
    let mounted = true;
    
    const handleUserAuth = async () => {
      if (isLoaded && isSignedIn && mounted) {
        try {
          setState(prev => ({ 
            ...prev, 
            loading: true, 
            error: null
          }));

          // Initialize IndexedDB
          await finishedGoodsDB.init();
          
          // Load existing data from IndexedDB (no automatic sync here since FinishedGoodsDataManager handles it)
          await loadExistingData();
          
          if (!mounted) return;
          
          setState(prev => ({
            ...prev,
            loading: false,
          }));

        } catch (error) {
          if (!mounted) return;
          
          console.error('Error loading finished goods:', error);
          setState(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load finished goods data',
          }));
        }
      } else if (isLoaded && !isSignedIn && mounted) {
        // Clear local state when user signs out (FinishedGoodsDataManager handles IndexedDB clearing)
        setState({
          finishedGoods: [],
          categories: [],
          loading: false,
          error: null,
          syncStatus: 'idle',
          lastSyncTime: null,
          recordCount: 0,
          isInitializing: false,
          syncProgress: {
            stage: null,
            message: '',
            percentage: 0,
          },
        });
      }
    };

    const loadExistingData = async () => {
      try {
        const [finishedGoods, categories, metadata] = await Promise.all([
          finishedGoodsDB.getFinishedGoods(),
          finishedGoodsDB.getCategories(),
          finishedGoodsDB.getSyncMetadata()
        ]);

        if (mounted) {
          setState(prev => ({
            ...prev,
            finishedGoods,
            categories,
            lastSyncTime: metadata?.value || null,
            recordCount: metadata?.record_count || 0,
            syncStatus: finishedGoods.length > 0 ? 'success' : 'idle',
          }));
          
          console.log(`[useFinishedGoods] Loaded ${finishedGoods.length} finished goods from IndexedDB`);
        }
      } catch (error) {
        console.error('[useFinishedGoods] Error loading existing data:', error);
        if (mounted) {
          setState(prev => ({
            ...prev,
            error: 'Failed to load existing data'
          }));
        }
      }
    };

    handleUserAuth();
    
    return () => {
      mounted = false;
    };
  }, [isSignedIn, isLoaded]);

  /**
   * Search products by name or code
   */
  const searchProducts = useCallback(async (searchTerm: string): Promise<FinishedGood[]> => {
    try {
      return await finishedGoodsDB.searchFinishedGoods(searchTerm);
    } catch (error) {
      console.error('Error searching products:', error);
      setState(prev => ({ ...prev, error: 'Failed to search products' }));
      return [];
    }
  }, []);

  /**
   * Get products by category
   */
  const getProductsByCategory = useCallback(async (categoryId: number): Promise<FinishedGood[]> => {
    try {
      return await finishedGoodsDB.getFinishedGoodsByCategory(categoryId);
    } catch (error) {
      console.error('Error getting products by category:', error);
      setState(prev => ({ ...prev, error: 'Failed to get products by category' }));
      return [];
    }
  }, []);

  /**
   * Clear all data from IndexedDB (called on logout)
   */
  const clearData = useCallback(async () => {
    try {
      await finishedGoodsDB.clearAllData();
      setState({
        finishedGoods: [],
        categories: [],
        loading: false,
        error: null,
        syncStatus: 'idle',
        lastSyncTime: null,
        recordCount: 0,
        isInitializing: false,
        syncProgress: {
          stage: null,
          message: '',
          percentage: 0,
        },
      });
      console.log('Finished goods data cleared from IndexedDB');
    } catch (error) {
      console.error('Error clearing finished goods data:', error);
    }
  }, []);

  /**
   * Load data from IndexedDB without syncing from server
   */
  const loadDataFromIndexedDB = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const [finishedGoods, categories, metadata] = await Promise.all([
        finishedGoodsDB.getFinishedGoods(),
        finishedGoodsDB.getCategories(),
        finishedGoodsDB.getSyncMetadata()
      ]);

      setState(prev => ({
        ...prev,
        finishedGoods,
        categories,
        lastSyncTime: metadata?.value || null,
        recordCount: metadata?.record_count || 0,
        loading: false,
      }));
    } catch (error) {
      console.error('Error loading data from IndexedDB:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load data from local storage'
      }));
    }
  }, []);

  /**
   * Refresh data by loading from IndexedDB
   */
  const refreshData = useCallback(async () => {
    await loadDataFromIndexedDB();
  }, [loadDataFromIndexedDB]);

  // Listen for external sync completion (from FinishedGoodsDataManager)
  useEffect(() => {
    const handleSyncComplete = () => {
      console.log('[useFinishedGoods] External sync detected, refreshing data');
      loadDataFromIndexedDB();
    };

    // Listen for custom event dispatched by FinishedGoodsDataManager
    window.addEventListener('finishedGoodsSyncComplete', handleSyncComplete);
    
    return () => {
      window.removeEventListener('finishedGoodsSyncComplete', handleSyncComplete);
    };
  }, [loadDataFromIndexedDB]);

  /**
   * Sync data with progress tracking (external API)
   */
  const syncDataWithProgress = useCallback(async () => {
    if (!isSignedIn) {
      setState(prev => ({ ...prev, error: 'User not signed in' }));
      return;
    }

    try {
      setState(prev => ({ 
        ...prev, 
        syncStatus: 'syncing', 
        error: null,
        syncProgress: {
          stage: 'fetching',
          message: 'Fetching data from iDempiere...',
          percentage: 40,
        }
      }));

      // Fetch data from API
      const data = await fetchFinishedGoodsClient();

      setState(prev => ({
        ...prev,
        syncProgress: {
          stage: 'storing',
          message: `Storing ${data.records.length} products...`,
          percentage: 60,
        }
      }));

      // Store in IndexedDB
      await finishedGoodsDB.storeFinishedGoods(data);

      setState(prev => ({
        ...prev,
        syncProgress: {
          stage: 'processing',
          message: 'Processing categories and metadata...',
          percentage: 80,
        }
      }));

      // Update state with new data
      const [finishedGoods, categories, metadata] = await Promise.all([
        finishedGoodsDB.getFinishedGoods(),
        finishedGoodsDB.getCategories(),
        finishedGoodsDB.getSyncMetadata()
      ]);

      setState(prev => ({
        ...prev,
        finishedGoods,
        categories,
        lastSyncTime: metadata?.value || null,
        recordCount: metadata?.record_count || 0,
        syncStatus: 'success',
        syncProgress: {
          stage: 'complete',
          message: `Successfully synced ${data.records.length} products`,
          percentage: 100,
        }
      }));

      console.log(`Successfully synced ${data.records.length} finished goods`);
    } catch (error) {
      console.error('Error syncing finished goods:', error);
      
      let errorMessage = 'Failed to sync finished goods data';
      if (error instanceof IDempiereAPIError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setState(prev => ({
        ...prev,
        syncStatus: 'error',
        error: errorMessage,
        syncProgress: {
          stage: null,
          message: '',
          percentage: 0,
        }
      }));
      
      throw error;
    }
  }, [isSignedIn]);

  /**
   * Manual sync data (exposed for external use)
   */
  const syncData = useCallback(async () => {
    try {
      await syncDataWithProgress();
    } catch (error) {
      // Error is already handled in syncDataWithProgress
      console.error('Sync failed:', error);
    }
  }, [syncDataWithProgress]);

  return {
    ...state,
    syncData,
    searchProducts,
    getProductsByCategory,
    clearData,
    refreshData,
  };
}