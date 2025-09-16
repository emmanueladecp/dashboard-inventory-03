'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function UserSyncWrapper({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [syncAttempted, setSyncAttempted] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const router = useRouter();

  useEffect(() => {
    const syncUser = async () => {
      if (isLoaded && isSignedIn && user && !syncAttempted) {
        setSyncAttempted(true);
        setSyncStatus('syncing');
        
        console.log('Attempting to sync user:', user.id, user.emailAddresses[0]?.emailAddress);
        
        try {
          const response = await fetch('/api/auth/sync-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          const result = await response.json();
          console.log('Sync response:', result);
          
          if (response.ok) {
            console.log('User synced successfully');
            setSyncStatus('success');
            
            // If user just signed in/up and we're on home page, redirect to dashboard
            if (window.location.pathname === '/') {
              router.push('/dashboard');
            }
          } else {
            console.error('Failed to sync user:', result);
            setSyncStatus('error');
          }
        } catch (error) {
          console.error('Error syncing user:', error);
          setSyncStatus('error');
        }
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, user, syncAttempted, router]);

  // Debug info - remove in production
  if (isLoaded && isSignedIn && syncStatus !== 'idle') {
    console.log('Sync status:', syncStatus, 'User ID:', user?.id);
  }

  return <>{children}</>;
}