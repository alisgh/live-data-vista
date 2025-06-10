
import { useState, useEffect, useRef, useCallback } from 'react';

interface PLCData {
  light1: number;
  vent1: number;
  temp1: number;
  humidity1: number;
}

interface UsePLCDirectReturn {
  data: PLCData | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  writeVariable: (name: string, value: number) => Promise<void>;
  refreshData: () => void;
  isLoading: boolean;
}

export const usePLCDirect = (controllerIp: string): UsePLCDirectReturn => {
  const [data, setData] = useState<PLCData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout>();

  const getUrl = `http://${controllerIp}/getvar.csv`;
  const setUrl = `http://${controllerIp}/setvar.csv`;

  // Parse CSV data
  const parseCsvLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.replace(/"/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.replace(/"/g, ''));
    return result;
  };

  // Fetch data from PLC
  const fetchPLCData = useCallback(async (): Promise<PLCData | null> => {
    if (!controllerIp) return null;

    try {
      setIsLoading(true);
      const response = await fetch(getUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const csvText = await response.text();
      const lines = csvText.trim().split('\n');
      
      // Skip header row
      const dataLines = lines.slice(1);
      
      const plcData: Partial<PLCData> = {};
      
      for (const line of dataLines) {
        const row = parseCsvLine(line);
        if (row.length < 6) continue;
        
        const name = row[0];
        const dataType = row[3];
        const valueStr = row[5];
        
        let value: number;
        if (dataType.includes('REAL')) {
          value = parseFloat(valueStr);
        } else if (dataType.includes('BOOL')) {
          value = parseInt(valueStr, 10);
        } else {
          continue;
        }
        
        // Map to our data structure
        if (name === 'humidity1' || name === 'light1' || name === 'temp1' || name === 'vent1') {
          plcData[name as keyof PLCData] = value;
        }
      }
      
      // Ensure we have all required fields
      const result: PLCData = {
        humidity1: plcData.humidity1 ?? -999.9,
        light1: plcData.light1 ?? 0,
        temp1: plcData.temp1 ?? 0,
        vent1: plcData.vent1 ?? 0,
      };
      
      setConnectionStatus('connected');
      return result;
      
    } catch (error) {
      console.error('Error fetching PLC data:', error);
      setConnectionStatus('error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [controllerIp, getUrl]);

  // Write variable to PLC
  const writeVariable = useCallback(async (name: string, value: number): Promise<void> => {
    if (!controllerIp) {
      throw new Error('No controller IP configured');
    }

    const validVariables = ['light1', 'vent1'];
    if (!validVariables.includes(name)) {
      throw new Error(`Invalid variable name: ${name}. Valid names: ${validVariables.join(', ')}`);
    }

    try {
      const formData = new URLSearchParams();
      formData.append(name, value.toString());

      const response = await fetch(setUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log(`✔ Wrote ${value} to ${name}. PLC response:`, responseText.trim());
      
      // Refresh data after write
      setTimeout(() => {
        refreshData();
      }, 100);
      
    } catch (error) {
      console.error(`Error writing ${name}=${value}:`, error);
      throw error;
    }
  }, [controllerIp, setUrl]);

  // Refresh data manually
  const refreshData = useCallback(async () => {
    if (!controllerIp) return;
    
    const newData = await fetchPLCData();
    if (newData) {
      setData(newData);
    }
  }, [fetchPLCData, controllerIp]);

  // Setup polling
  useEffect(() => {
    if (!controllerIp) {
      setConnectionStatus('disconnected');
      setData(null);
      return;
    }

    setConnectionStatus('connecting');
    
    // Initial fetch
    refreshData();
    
    // Setup polling interval
    pollIntervalRef.current = setInterval(() => {
      refreshData();
    }, 1000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [controllerIp, refreshData]);

  return {
    data,
    connectionStatus,
    writeVariable,
    refreshData,
    isLoading,
  };
};
