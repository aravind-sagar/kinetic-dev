export const isPersistentMode = (): boolean => {
  const mode = localStorage.getItem('kinetic_persistent_mode');
  // Default is ON
  return mode === null || mode === 'true';
};

export const setPersistentMode = (value: boolean) => {
  localStorage.setItem('kinetic_persistent_mode', value.toString());
  if (!value) {
    // Clear all other kinetic data when turned off
    const mode = localStorage.getItem('kinetic_persistent_mode');
    localStorage.clear();
    // Keep the setting itself
    localStorage.setItem('kinetic_persistent_mode', 'false');
  }
};

// A background queue for sync operations to avoid blocking
let syncQueue: Record<string, any> = {};
let syncTimeout: any = null;

const flushSyncQueue = async () => {
  const items = { ...syncQueue };
  syncQueue = {};
  if (Object.keys(items).length === 0) return;

  try {
    // Only attempt sync if we have local info that cloud sync is enabled
    if (localStorage.getItem('kinetic_cloud_sync_enabled') !== 'true') return;
    
    await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: items, timestamp: Date.now() })
    });
  } catch (err) {
    console.error('Failed to sync to cloud (optimistic write)', err);
  }
};

export const storage = {
  get: (key: string) => {
    if (!isPersistentMode()) return null;
    return localStorage.getItem(key);
  },
  set: (key: string, value: string) => {
    if (isPersistentMode()) {
      localStorage.setItem(key, value);
      
      // Enqueue optimistic push
      syncQueue[key] = value;
      if (syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(flushSyncQueue, 800); // 800ms debounce
    }
  },
  remove: (key: string) => {
    localStorage.removeItem(key);
    
    if (isPersistentMode()) {
      syncQueue[key] = null; // null represents a deletion
      if (syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(flushSyncQueue, 800);
    }
  }
};

export const enableCloudSyncTracking = () => {
  localStorage.setItem('kinetic_cloud_sync_enabled', 'true');
};

export const disableCloudSyncTracking = () => {
  localStorage.removeItem('kinetic_cloud_sync_enabled');
};
