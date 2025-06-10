import { useState, useEffect } from 'react';

interface PlantData {
  id: number;
  name: string;
  growDays: number;
  startDate: string;
}

const API_BASE = 'http://192.168.0.229:3001/api';

export const usePlantData = () => {
  const [plantData, setPlantData] = useState<PlantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlantData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/plant`);
      
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

  useEffect(() => {
    fetchPlantData();
  }, []);

  return {
    plantData,
    isLoading,
    error,
    refetch: fetchPlantData,
    updatePlantName,
  };
};
