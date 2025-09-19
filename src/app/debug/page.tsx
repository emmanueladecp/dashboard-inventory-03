'use client';

import { useUser } from '@clerk/nextjs';
import { useState } from 'react';

export default function DebugPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  type SyncResult = { status: number; data: unknown } | { error: string };
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [loading, setLoading] = useState(false);

  const testSync = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      setSyncResult({ status: response.status, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setSyncResult({ error: message });
    }
    setLoading(false);
  };

  const checkSupabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/check-user', {
        method: 'POST',
      });
      
      const result = await response.json();
      setSyncResult({ status: response.status, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setSyncResult({ error: message });
    }
    setLoading(false);
  };

  const testDB = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-db', {
        method: 'GET',
      });
      
      const result = await response.json();
      setSyncResult({ status: response.status, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setSyncResult({ error: message });
    }
    setLoading(false);
  };

  if (!isLoaded) return <div className="p-8">Loading...</div>;
  if (!isSignedIn) return <div className="p-8">Please sign in to debug</div>;

  // Extract user data safely
  const userData = {
    id: user?.id,
    email: user?.emailAddresses?.[0]?.emailAddress || 'No email available',
    emailAddresses: user?.emailAddresses?.map(e => ({
      id: e.id,
      emailAddress: e.emailAddress,
      verification: e.verification?.status
    })) || [],
    firstName: user?.firstName || 'No first name',
    lastName: user?.lastName || 'No last name',
    createdAt: user?.createdAt,
    primaryEmailId: user?.primaryEmailAddressId
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug User Sync</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Clerk User Info:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(userData, null, 2)}
          </pre>
        </div>
        
        <div className="space-x-4">
          <button 
            onClick={testSync} 
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Manual Sync'}
          </button>
          <button 
            onClick={checkSupabase} 
            disabled={loading}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Supabase User'}
          </button>
          <button 
            onClick={testDB} 
            disabled={loading}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Database'}
          </button>
        </div>
        
        {syncResult && (
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold mb-2">Result:</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(syncResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}