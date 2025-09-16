'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export function UserSyncWrapper({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [syncAttempted, setSyncAttempted] = useState(false);

  useEffect(() => {
    const syncUser = async () => {
      if (isLoaded && isSignedIn && user && !syncAttempted) {
        setSyncAttempted(true);
        
        try {
          const response = await fetch('/api/auth/sync-user', {
            method: 'POST',
          });
          
          if (response.ok) {
            console.log('User synced successfully');
          } else {
            console.error('Failed to sync user');
          }
        } catch (error) {
          console.error('Error syncing user:', error);
        }
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, user, syncAttempted]);

  return <>{children}</>;
}