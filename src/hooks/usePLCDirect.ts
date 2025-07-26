import { useState, useEffect, useRef, useCallback } from 'react';

interface PLCData {
  halogenLight: number;    // b_Halogene (BOOL)
  haloTemp: number;        // r_Halo_Temp (REAL)
  ambientTemp: number;     // r_Temperatur (REAL)
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UsePLCDirectReturn {
  data: PLCData | null;
  connectionStatus: ConnectionStatus;
  writeVariable: (name: keyof PLCData, value: number) => Promise<void>;
  refreshData: () => void;
  isLoading: boolean;
}

export const usePLCDirect = (_controllerIp: string): UsePLCDirectReturn => {
  const [data, setData] = useState<PLCData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController | null>(null);

  // ⚠️ Use relative URLs so Vite proxy handles CORS
  const getUrl = '/getvar.csv';
  const setUrl = '/setvar.csv';

  // PLC → Internal mapping
  const plcToInternalMap: Record<string, keyof PLCData> = {
    'b_Halogene': 'halogenLight',
    'r_Halo_Temp': 'haloTemp',
    'r_Temperatur': 'ambientTemp',
  };

  const internalToPlcMap: Record<keyof PLCData, string> = {
    halogenLight: 'b_Halogene',
    haloTemp: 'r_Halo_Temp',
    ambientTemp: 'r_Temperatur',
  };

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
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

  const fetchPLCData = useCallback(async (): Promise<PLCData | null> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      const response = await fetch(getUrl, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const csvText = await response.text();
      const lines = csvText.trim().split('\n').slice(1); // skip header

      const plcData: Partial<PLCData> = {};

      for (const line of lines) {
        const row = parseCsvLine(line);
        if (row.length < 6) continue;

        const name = row[0];
        const type = row[3];
        const valueStr = row[5];

        const internalName = plcToInternalMap[name];
        if (!internalName) continue;

        let value: number;

        if (type === 'BOOL') {
          value = valueStr.trim() === '1' ? 1 : 0;
        } else if (type === 'REAL') {
          value = parseFloat(valueStr);
        } else {
          continue;
        }

        plcData[internalName] = value;
      }

      if (
        plcData.halogenLight !== undefined &&
        plcData.haloTemp !== undefined &&
        plcData.ambientTemp !== undefined
      ) {
        const finalData: PLCData = {
          halogenLight: plcData.halogenLight,
          haloTemp: plcData.haloTemp,
          ambientTemp: plcData.ambientTemp,
        };
        setConnectionStatus('connected');
        return finalData;
      } else {
        console.warn('Missing PLC variables:', plcData);
        setConnectionStatus('error');
        return null;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return null;
      }

      console.error('Fetch error:', error);
      setConnectionStatus('error');
      return null;
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [getUrl]);

  const writeVariable = useCallback(async (name: keyof PLCData, value: number): Promise<void> => {
    const plcName = internalToPlcMap[name];
    if (!plcName) {
      throw new Error(`Invalid variable name: ${name}`);
    }

    try {
      const formData = new URLSearchParams();
      formData.append(plcName, value.toString());

      const response = await fetch(setUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`✔ ${name}=${value} written successfully`);

      // Delay slightly to allow PLC to update
      setTimeout(() => refreshData(), 150);
    } catch (error) {
      console.error(`Failed to write ${name}:`, error);
      throw error;
    }
  }, [setUrl]);

  const refreshData = useCallback(async () => {
    const newData = await fetchPLCData();
    if (newData) setData(newData);
  }, [fetchPLCData]);

  useEffect(() => {
    setConnectionStatus('connecting');
    refreshData();

    pollIntervalRef.current = setInterval(() => {
      refreshData();
    }, 2000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [refreshData]);

  return {
    data,
    connectionStatus,
    writeVariable,
    refreshData,
    isLoading,
  };
};
