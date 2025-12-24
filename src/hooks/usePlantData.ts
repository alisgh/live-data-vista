
import { useState, useEffect } from 'react';

interface PlantData {
  id: number;
  name: string;
  growDays: number;
  startDate: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CreatePlantData {
  name: string;
  start_date: string;
}

interface UpdatePlantData {
  name?: string;
  start_date?: string;
}

const API_BASE = 'http://192.168.0.158:3001/api';

export const usePlantData = (plantId?: number) => {
  const [plantData, setPlantData] = useState<PlantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlantData = async (id?: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const url = id ? `${API_BASE}/plant?id=${id}` : `${API_BASE}/plant`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPlantData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to fetch plant data: ${errorMessage}`);
      console.error('Error fetching plant data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createPlant = async (plantData: CreatePlantData): Promise<PlantData | null> => {
    try {
      const response = await fetch(`${API_BASE}/plant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(plantData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.plant;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to create plant: ${errorMessage}`);
      console.error('Error creating plant:', err);
      return null;
    }
  };

  const updatePlantName = async (newName: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/plant/name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Update local state
      if (plantData) {
        setPlantData({ ...plantData, name: newName });
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to update plant name: ${errorMessage}`);
      console.error('Error updating plant name:', err);
      return false;
    }
  };

  const updatePlant = async (id: number, updates: UpdatePlantData): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/plant/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Update local state if this is the current plant
      if (plantData && plantData.id === id) {
        setPlantData(result.plant);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to update plant: ${errorMessage}`);
      console.error('Error updating plant:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchPlantData(plantId);
  }, [plantId]);

  return {
    plantData,
    isLoading,
    error,
    refetch: () => fetchPlantData(plantId),
    createPlant,
    updatePlantName,
    updatePlant,
    fetchPlantById: fetchPlantData,
  };
};
