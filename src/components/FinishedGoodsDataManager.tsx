/**
 * Component to manage finished goods data lifecycle
 * Integrates with Clerk authentication to sync/clear data based on user state
 */

'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useCallback } from 'react';
import { finishedGoodsDB } from '@/lib/indexeddb';
import { fetchFinishedGoodsClient, IDempiereAPIError } from '@/lib/idempiere-api';
import { FinishedGoodsLoadingScreen } from './inventory/FinishedGoodsLoadingScreen';

interface SyncProgress {
  stage: 'fetching' | 'storing' | 'processing' | 'complete' | null;
  message: string;
  percentage: number;
}

export function FinishedGoodsDataManager({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  
  const [isInitializing, setIsInitializing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    stage: null,
    message: '',
    percentage: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const performInitialSync = useCallback(async () => {
    if (!isSignedIn) return;
    
    try {
      setIsInitializing(true);
      setError(null);
      setSyncProgress({
        stage: 'fetching',
        message: 'Initializing finished goods database...',
        percentage: 10,
      });

      // Initialize IndexedDB
      await finishedGoodsDB.init();
      
      setSyncProgress({
        stage: 'fetching',
        message: 'Syncing latest data from iDempiere...',
        percentage: 30,
      });

      // Perform sync with progress tracking
      setSyncProgress({
        stage: 'fetching',
        message: 'Fetching data from iDempiere API...',
        percentage: 40,
      });

      // Fetch data from API
      const data = await fetchFinishedGoodsClient();

      setSyncProgress({
        stage: 'storing',
        message: `Storing ${data.records.length} products in local database...`,
        percentage: 60,
      });

      // Store in IndexedDB
      await finishedGoodsDB.storeFinishedGoods(data);

      setSyncProgress({
        stage: 'processing',
        message: 'Processing categories and finalizing...',
        percentage: 80,
      });

      // Small delay to show processing stage
      await new Promise(resolve => setTimeout(resolve, 500));

      setSyncProgress({
        stage: 'complete',
        message: `Successfully synced ${data.records.length} finished goods`,
        percentage: 100,
      });

      console.log(`[FinishedGoodsDataManager] Successfully synced ${data.records.length} finished goods on login`);
      
      // Dispatch event to notify other components that sync is complete
      window.dispatchEvent(new CustomEvent('finishedGoodsSyncComplete'));
      
      // Hide loading screen after a brief success display
      setTimeout(() => {
        setIsInitializing(false);
        setSyncProgress({ stage: null, message: '', percentage: 0 });
      }, 1500);

    } catch (error) {
      console.error('[FinishedGoodsDataManager] Error during initial sync:', error);
      
      let errorMessage = 'Failed to sync finished goods data';
      if (error instanceof IDempiereAPIError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setSyncProgress({
        stage: null,
        message: '',
        percentage: 0,
      });
    }
  }, [isSignedIn]);

  const handleRetry = useCallback(() => {
    setError(null);
    performInitialSync();
  }, [performInitialSync]);

  const handleCancel = useCallback(() => {
    setIsInitializing(false);
    setError(null);
    setSyncProgress({ stage: null, message: '', percentage: 0 });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const handleUserStateChange = async () => {
      if (!isLoaded) return;

      try {
        if (isSignedIn && user && isMounted) {
          console.log('[FinishedGoodsDataManager] User signed in, starting automatic sync for user:', user.id);
          
          // Check if we need to sync (avoid duplicate syncs)
          const shouldSync = await checkIfSyncNeeded();
          if (shouldSync) {
            await performInitialSync();
          } else {
            console.log('[FinishedGoodsDataManager] Data already synced recently, skipping automatic sync');
          }
        } else if (isLoaded && !isSignedIn && isMounted) {
          // User is signed out - clear all finished goods data
          console.log('[FinishedGoodsDataManager] User signed out, clearing finished goods data');
          
          // Reset states
          setIsInitializing(false);
          setError(null);
          setSyncProgress({ stage: null, message: '', percentage: 0 });
          
          try {
            // Clear data from IndexedDB
            await finishedGoodsDB.clearAllData();
            console.log('[FinishedGoodsDataManager] Finished goods data cleared successfully');
          } catch (error) {
            console.error('[FinishedGoodsDataManager] Error clearing finished goods data:', error);
            
            // If clearing fails, try to delete the entire database as fallback
            try {
              await finishedGoodsDB.deleteDatabase();
              console.log('[FinishedGoodsDataManager] Finished goods database deleted as fallback');
            } catch (deleteError) {
              console.error('[FinishedGoodsDataManager] Error deleting finished goods database:', deleteError);
            }
          }
        }
      } catch (error) {
        // Only log errors if component is still mounted to avoid memory leaks
        if (isMounted) {
          console.error('[FinishedGoodsDataManager] Error managing finished goods data:', error);
        }
      }
    };

    const checkIfSyncNeeded = async (): Promise<boolean> => {
      try {
        await finishedGoodsDB.init();
        const metadata = await finishedGoodsDB.getSyncMetadata();
        
        if (!metadata || !metadata.value) {
          return true; // No sync data, needs sync
        }
        
        const lastSyncTime = new Date(metadata.value);
        const now = new Date();
        const timeDiff = now.getTime() - lastSyncTime.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        // Sync if last sync was more than 1 hour ago
        return hoursDiff > 1;
      } catch (error) {
        console.error('[FinishedGoodsDataManager] Error checking sync status:', error);
        return true; // If error checking, assume sync is needed
      }
    };

    handleUserStateChange();

    // Cleanup function to mark component as unmounted
    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, user?.id, performInitialSync]);

  // Add a cleanup effect for when the component unmounts (e.g., page refresh, navigation away)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Close database connection on page unload
      finishedGoodsDB.close();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      finishedGoodsDB.close();
    };
  }, []);

  // Add cleanup for visibility change (when user switches tabs or minimizes browser)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isSignedIn) {
        // If user is not signed in and tab becomes hidden, ensure data is cleared
        finishedGoodsDB.clearAllData().catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSignedIn]);

  return (
    <>
      {/* Global Loading Screen for Finished Goods Sync */}
      <FinishedGoodsLoadingScreen
        isVisible={isInitializing}
        progress={syncProgress}
        error={error}
        onRetry={handleRetry}
        onCancel={handleCancel}
      />
      {children}
    </>
  );
}