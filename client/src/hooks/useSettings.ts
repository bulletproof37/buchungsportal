import { useState, useEffect, useCallback } from 'react';
import { Settings, ApiResponse } from '../types';
import { API, ERRORS, DEFAULTS } from '../utils/constants';

interface UseSettingsResult {
  settings: Settings;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateSettings: (data: Partial<Settings>) => Promise<boolean>;
}

const defaultSettings: Settings = {
  company_name: 'Bioferienhof Loreley GbR',
  company_address: 'Auf dem Flürchen',
  company_zip: '56329',
  company_city: 'St. Goar-Biebernheim',
  company_phone: '',
  company_mobile: '0173 9267942',
  company_email: 'bioferienhof.loreley@gmail.com',
  surcharge_first_night: DEFAULTS.SURCHARGE_FIRST_NIGHT,
  price_per_dog_night: DEFAULTS.PRICE_PER_DOG_NIGHT,
  min_nights: DEFAULTS.MIN_NIGHTS
};

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API.SETTINGS);

      if (!response.ok) {
        throw new Error(ERRORS.LOAD_ERROR);
      }

      const data: ApiResponse<Settings> = await response.json();

      if (data.success && data.data) {
        setSettings(data.data);
      } else {
        throw new Error(data.error || ERRORS.LOAD_ERROR);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : ERRORS.NETWORK_ERROR);
      // Bei Fehler: Default-Settings verwenden
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (data: Partial<Settings>): Promise<boolean> => {
    try {
      const response = await fetch(API.SETTINGS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(ERRORS.SAVE_ERROR);
      const result: ApiResponse<Settings> = await response.json();
      if (result.success && result.data) {
        setSettings(result.data);
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : ERRORS.NETWORK_ERROR);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    updateSettings
  };
}
