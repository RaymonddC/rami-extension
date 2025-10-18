import { useState, useEffect } from 'react';

/**
 * Custom hook for Chrome storage with React state sync
 */
export function useChromeStorage(key, defaultValue) {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial value
    chrome.storage.local.get(key, (result) => {
      if (result[key] !== undefined) {
        setValue(result[key]);
      }
      setLoading(false);
    });

    // Listen for changes
    const listener = (changes, areaName) => {
      if (areaName === 'local' && changes[key]) {
        setValue(changes[key].newValue);
      }
    };

    chrome.storage.onChanged.addListener(listener);

    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, [key]);

  const updateValue = async (newValue) => {
    try {
      await chrome.storage.local.set({ [key]: newValue });
      setValue(newValue);
      return { success: true };
    } catch (error) {
      console.error('Failed to update storage:', error);
      return { success: false, error: error.message };
    }
  };

  return [value, updateValue, loading];
}

/**
 * Hook for managing user preferences
 */
export function usePreferences() {
  const [preferences, setPreferences, loading] = useChromeStorage('preferences', {
    persona: 'strategist',
    theme: 'light',
    mindmapMode: 'reactflow',
    autoSummarize: true,
  });

  return { preferences, setPreferences, loading };
}

/**
 * Hook for managing saved articles/readings
 */
export function useSavedReadings() {
  const [readings, setReadings, loading] = useChromeStorage('readings', []);

  const addReading = async (reading) => {
    const newReadings = [
      {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...reading
      },
      ...readings
    ];
    return await setReadings(newReadings);
  };

  const removeReading = async (id) => {
    const newReadings = readings.filter(r => r.id !== id);
    return await setReadings(newReadings);
  };

  const updateReading = async (id, updates) => {
    const newReadings = readings.map(r =>
      r.id === id ? { ...r, ...updates } : r
    );
    return await setReadings(newReadings);
  };

  return {
    readings,
    addReading,
    removeReading,
    updateReading,
    loading
  };
}

/**
 * Hook for managing highlights and notes
 */
export function useHighlights() {
  const [highlights, setHighlights, loading] = useChromeStorage('highlights', []);

  const addHighlight = async (highlight) => {
    const newHighlight = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...highlight
    };
    const newHighlights = [...highlights, newHighlight];
    await setHighlights(newHighlights);
    return newHighlight;
  };

  const removeHighlight = async (id) => {
    const newHighlights = highlights.filter(h => h.id !== id);
    return await setHighlights(newHighlights);
  };

  const updateHighlight = async (id, updates) => {
    const newHighlights = highlights.map(h =>
      h.id === id ? { ...h, ...updates } : h
    );
    return await setHighlights(newHighlights);
  };

  return {
    highlights,
    addHighlight,
    removeHighlight,
    updateHighlight,
    loading
  };
}
