import { useState, useEffect, useRef, useCallback } from 'react';

export interface PLCData {
  halogenLight: number;  // b_Halogene
  b_water: number;       // b_water
  haloTemp: number;      // r_Halo_Temp
  ambientTemp: number;   // r_Temperatur
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

  // Map PLC variable names to internal state keys
  const plcToInternalMap: Record<string, keyof PLCData> = {
    'b_Halogene': 'halogenLight',
    'b_water': 'b_water',
    'r_Halo_Temp': 'haloTemp',
    'r_Temperatur': 'ambientTemp',
  };

  const internalToPlcMap: Record<keyof PLCData, string> = {
    halogenLight: 'b_Halogene',
    b_water: 'b_water',
    haloTemp: 'r_Halo_Temp',
    ambientTemp: 'r_Temperatur',
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

      if (
        plcData.halogenLight !== undefined &&
        plcData.b_water !== undefined &&
        plcData.haloTemp !== undefined &&
        plcData.ambientTemp !== undefined
      ) {
        setConnectionStatus('connected');
        return plcData as PLCData;
      } else {
        setConnectionStatus('error');
        return null;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return null;
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
    const plcName = internalToPlcMap[name];
    const body = new URLSearchParams();
    body.append(plcName, value.toString());

    try {
      await fetch(setUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      });

      // Refresh shortly after writing to get new value
      setTimeout(() => refreshData(), 150);
    } catch (error) {
      console.error(`Failed to write ${plcName}:`, error);
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
    isLoading
  };
};
