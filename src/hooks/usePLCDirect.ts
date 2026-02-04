import { useState, useEffect, useRef, useCallback } from 'react';

// Update PLCData interface to match new variables
export interface PLCData {
  b_water: number;    // BOOL
  b_water2: number;   // BOOL
  r_Temp: number;     // REAL
  r_light: number;    // REAL
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UsePLCDirectReturn {
  data: PLCData | null;
  connectionStatus: ConnectionStatus;
  writeVariable: (name: keyof PLCData, value: number) => Promise<void>;
  triggerPulse: (name: keyof PLCData, durationMs: number) => Promise<void>;
  refreshData: () => void;
  isLoading: boolean;
}

export const usePLCDirect = (): UsePLCDirectReturn => {
  const [data, setData] = useState<PLCData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isLoading, setIsLoading] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController | null>(null);

  const getUrl = '/getvar.csv';
  const setUrl = '/setvar.csv';

  // Update mapping to match new variable names
  const plcToInternalMap: Record<string, keyof PLCData> = {
    'b_water': 'b_water',
    'b_water2': 'b_water2',
    'r_Temp': 'r_Temp',
    'r_light': 'r_light',
  };

  // Update mapping to match new variable IDs
  const internalToPlcMap: Record<keyof PLCData, string> = {
    b_water: '20',
    b_water2: '21',
    r_Temp: '23',
    r_light: '24',
  };

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '', inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        result.push(current.replace(/"/g, ''));
        current = '';
      } else current += char;
    }
    result.push(current.replace(/"/g, ''));
    return result;
  };

  const fetchPLCData = useCallback(async (): Promise<PLCData | null> => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      const response = await fetch(getUrl, { signal: abortControllerRef.current.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const csv = await response.text();
      const lines = csv.trim().split('\n').slice(1);

      const plcData: Partial<PLCData> = {};

      for (const line of lines) {
        const row = parseCsvLine(line);
        if (row.length < 6) continue;

        const [name, , , type, , valueStr] = row;
        const key = plcToInternalMap[name];
        if (!key) continue;

        plcData[key] = type === 'REAL' ? parseFloat(valueStr) : parseInt(valueStr, 10);
      }

      // Update required fields check
      if (
        plcData.b_water !== undefined &&
        plcData.b_water2 !== undefined &&
        plcData.r_Temp !== undefined &&
        plcData.r_light !== undefined
      ) {
        setConnectionStatus('connected');
        return plcData as PLCData;
      } else {
        setConnectionStatus('error');
        return null;
      }
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return null;
      setConnectionStatus('error');
      return null;
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const refreshData = useCallback(async () => {
    const newData = await fetchPLCData();
    if (newData) setData(newData);
  }, [fetchPLCData]);

  const writeVariable = useCallback(async (name: keyof PLCData, value: number): Promise<void> => {
    const id = internalToPlcMap[name];
    const body = `${id}=${value}`; // Matches your working PHP format

    try {
      await fetch(setUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      setTimeout(() => refreshData(), 150);
    } catch (error) {
      console.error(`Failed to write ${name}:`, error);
    }
  }, [refreshData]);

  const triggerPulse = useCallback(async (name: keyof PLCData, durationMs: number): Promise<void> => {
    await writeVariable(name, 1);
    setTimeout(() => writeVariable(name, 0), durationMs);
  }, [writeVariable]);

  useEffect(() => {
    setConnectionStatus('connecting');
    refreshData();
    pollIntervalRef.current = setInterval(() => refreshData(), 2000);
    return () => {
      clearInterval(pollIntervalRef.current);
      abortControllerRef.current?.abort();
    };
  }, [refreshData]);

  return {
    data,
    connectionStatus,
    writeVariable,
    triggerPulse,
    refreshData,
    isLoading,
  };
};
