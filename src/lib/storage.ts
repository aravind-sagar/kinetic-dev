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

export const storage = {
  get: (key: string) => {
    if (!isPersistentMode()) return null;
    return localStorage.getItem(key);
  },
  set: (key: string, value: string) => {
    if (isPersistentMode()) {
      localStorage.setItem(key, value);
    }
  },
  remove: (key: string) => {
    localStorage.removeItem(key);
  }
};
