import { useState, useEffect } from 'react';
import { House, ApiResponse } from '../types';
import { API, ERRORS } from '../utils/constants';

interface UseHousesResult {
  houses: House[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useHouses(): UseHousesResult {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHouses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API.HOUSES);

      if (!response.ok) {
        throw new Error(ERRORS.LOAD_ERROR);
      }

      const data: ApiResponse<House[]> = await response.json();

      if (data.success && data.data) {
        // Sortieren nach sort_order
        const sortedHouses = data.data.sort((a, b) => a.sort_order - b.sort_order);
        setHouses(sortedHouses);
      } else {
        throw new Error(data.error || ERRORS.LOAD_ERROR);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : ERRORS.NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouses();
  }, []);

  return {
    houses,
    loading,
    error,
    refetch: fetchHouses
  };
}
