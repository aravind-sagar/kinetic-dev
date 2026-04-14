import React, { useEffect, useState } from 'react';
import { useSession } from '../lib/auth-client';
import { storage, enableCloudSyncTracking, disableCloudSyncTracking } from '../lib/storage';

export function SyncManager() {
  const { data: sessionData } = useSession();
  const user = sessionData?.user;
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!user) {
      // If logged out, stop tracking cloud sync
      disableCloudSyncTracking();
      return;
    }

    const hasSetPreference = localStorage.getItem('kinetic_sync_preference_set');
    const hasLocalData = !!localStorage.getItem('editor_docs') || !!localStorage.getItem('saved_pages');

    if (!hasSetPreference && hasLocalData) {
      // First login, local data exists, prompt for migration
      setShowPrompt(true);
    } else if (hasSetPreference) {
      // Already set preference. If opted in, pull from cloud silently.
      if (localStorage.getItem('kinetic_cloud_sync_enabled') === 'true') {
        pullFromCloud();
      }
    } else if (!hasLocalData) {
      // First login, no local data, just enable cloud sync safely
      localStorage.setItem('kinetic_sync_preference_set', 'true');
      enableCloudSyncTracking();
      pullFromCloud();
    }
  }, [user]);

  const pullFromCloud = async () => {
    try {
      const res = await fetch('/api/sync/pull');
      if (!res.ok) return;
      const data = await res.json();
      
      if (data.payload) {
        // Merge cloud to local
        for (const [key, value] of Object.entries(data.payload)) {
          // In a real conflict strategy, we'd compare updatedAt. 
          // For now, cloud wins silently on initial pull.
          localStorage.setItem(key, value as string);
        }
        // Dispatch event to re-render local states
        window.dispatchEvent(new Event('local-storage'));
      }
    } catch (e) {
      console.error('Failed to pull from cloud', e);
    }
  };

  const pushAllLocalToCloud = async () => {
    const keysToSync = ['editor_docs', 'saved_pages', 'json_formatter_input', 'diff_input_1', 'diff_input_2', 'vscode_shortcuts_custom'];
    const payload: Record<string, string> = {};
    
    keysToSync.forEach(k => {
      const val = localStorage.getItem(k);
      if (val) payload[k] = val;
    });

    if (Object.keys(payload).length > 0) {
      try {
        await fetch('/api/sync/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload, timestamp: Date.now() })
        });
      } catch (err) {
        console.error('Migration push failed', err);
      }
    }
  };

  const handleMigrate = async () => {
    setIsSyncing(true);
    enableCloudSyncTracking();
    localStorage.setItem('kinetic_sync_preference_set', 'true');
    await pushAllLocalToCloud(); // merge local to cloud
    await pullFromCloud(); // make sure we have any other cloud data
    setIsSyncing(false);
    setShowPrompt(false);
  };

  const handleSkip = () => {
    disableCloudSyncTracking();
    localStorage.setItem('kinetic_sync_preference_set', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-surface-container-high border border-outline-variant/30 rounded-2xl shadow-2xl z-50 p-6">
      <h3 className="font-bold font-headline text-on-surface mb-2">Sync local data?</h3>
      <p className="text-sm font-body text-on-surface-variant mb-6">
        We found local configurations on this browser. Would you like to merge them with your cloud account?
      </p>
      <div className="flex justify-end gap-3">
        <button 
          onClick={handleSkip}
          disabled={isSyncing}
          className="px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest rounded-lg transition-colors"
        >
          SKIP
        </button>
        <button 
          onClick={handleMigrate}
          disabled={isSyncing}
          className="kinetic-gradient text-on-primary px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          {isSyncing ? 'SYNCING...' : 'SYNC DATA'}
        </button>
      </div>
    </div>
  );
}
