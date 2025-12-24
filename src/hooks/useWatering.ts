import { useState, useEffect } from 'react';

export interface WateringData {
  totalWateredLitres: number; // cumulative liters dispensed
  waterTankLevelLitres: number; // current tank level in liters
  totalWateringSeconds: number; // cumulative watering time in seconds
}

const API_BASE = 'http://localhost:3001/api'; // use localhost when running server locally

export const useWatering = () => {
  const [data, setData] = useState<WateringData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWatering = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/watering`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      setData(json);
      return json as WateringData;
    } catch (err: any) {
      setError(err?.message ?? 'Unknown error');
      console.error('Failed to fetch watering data:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateWatering = async (updates: Partial<WateringData>): Promise<WateringData | null> => {
    try {
      const res = await fetch(`${API_BASE}/watering`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      setData(json);
      return json as WateringData;
    } catch (err: any) {
      setError(err?.message ?? 'Unknown error');
      console.error('Failed to update watering data:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchWatering();
  }, []);

  return {
    data,
    isLoading,
    error,
    fetchWatering,
    updateWatering,
  };
};
