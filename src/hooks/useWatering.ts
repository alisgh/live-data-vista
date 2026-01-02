import { useState, useEffect } from 'react';

export interface WateringData {
  // Legacy/internal fields expected by UI
  totalWateredLitres: number; // cumulative liters dispensed
  waterTankLevelLitres: number; // current tank level in liters
  totalWateringSeconds: number; // cumulative watering time in seconds

  // Fields returned by the provided API
  waterLevel?: number; // same as waterTankLevelLitres
  lastWatering?: string;
  pumpActive?: boolean;
}

const API_BASE = 'http://192.168.0.158:3001/api'; // watering API host

export const useWatering = () => {
  const [data, setData] = useState<WateringData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapApiToData = (apiJson: Record<string, unknown>): WateringData => {
    return {
      totalWateredLitres: typeof apiJson.totalWateredLitres === 'number' ? apiJson.totalWateredLitres : 0,
      waterTankLevelLitres:
        typeof apiJson.waterTankLevelLitres === 'number'
          ? apiJson.waterTankLevelLitres
          : typeof apiJson.waterLevel === 'number'
            ? apiJson.waterLevel
            : 0,
      totalWateringSeconds: typeof apiJson.totalWateringSeconds === 'number' ? apiJson.totalWateringSeconds : 0,
      waterLevel: typeof apiJson.waterLevel === 'number' ? apiJson.waterLevel : 0,
      lastWatering: typeof apiJson.lastWatering === 'string' ? apiJson.lastWatering : '',
      pumpActive: typeof apiJson.pumpActive === 'boolean' ? apiJson.pumpActive : false,
    };
  };

  const fetchWatering = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/watering`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      const mapped = mapApiToData(json);
      setData(mapped);
      return mapped;
    } catch (err) {
      setError((err as Error)?.message ?? 'Unknown error');
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
      const mapped = mapApiToData(json);
      setData(mapped);
      return mapped;
    } catch (err) {
      setError((err as Error)?.message ?? 'Unknown error');
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
