import { useCallback, useEffect, useState } from 'react';

export type NutrientEntry = {
  id: number;
  nutrientId?: string | null;
  nutrientName: string;
  amountMl: number;
  applicationDate: string; // ISO date string
  notes?: string | null;
  stage: 'veg' | 'flower';
  createdAt?: string;
  updatedAt?: string;
};

const API_BASE = 'http://192.168.0.158:3001/api';

export function useNutrientSchedules() {
  const [entries, setEntries] = useState<NutrientEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

  const fetchAll = useCallback(async (start?: string, end?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `${API_BASE}/nutrients`;
      if (start && end) url += `?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
      else if (start) url += `?start=${encodeURIComponent(start)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      const data = await res.json();
      setEntries(data || []);
    } catch (err: unknown) {
      setError(toMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createEntry = useCallback(async (payload: Omit<NutrientEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/nutrients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed to create: ${res.status} ${res.statusText}`);
      const created = await res.json();
      setEntries((s) => [...s, created]);
      return created;
    } catch (err: unknown) {
      const msg = toMessage(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateEntry = useCallback(async (id: number, payload: Partial<NutrientEntry>) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/nutrients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed to update: ${res.status} ${res.statusText}`);
      const updated = await res.json();
      setEntries((s) => s.map((e) => (e.id === updated.id ? updated : e)));
      return updated;
    } catch (err: unknown) {
      const msg = toMessage(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteEntry = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/nutrients/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to delete: ${res.status} ${res.statusText}`);
      // remove locally
      setEntries((s) => s.filter((e) => e.id !== id));
      return true;
    } catch (err: unknown) {
      const msg = toMessage(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    entries,
    isLoading,
    error,
    fetchAll,
    createEntry,
    updateEntry,
    deleteEntry,
  };
}
