
import { useState, useEffect, useRef, useCallback } from 'react';

interface PLCData {
  light1: number;
  light2: number;
  vent1: number;
  vent2: number;
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
  const abortControllerRef = useRef<AbortController | null>(null);

  // Direct URLs - proxy will handle the routing
  const getUrl = `/getvar.csv`;
  const setUrl = `/setvar.csv`;

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

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      console.log(`Attempting to fetch PLC data from: ${getUrl}`);
      
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
      console.log('PLC response received, length:', csvText.length);
      
      const lines = csvText.trim().split('\n');
      console.log('CSV lines count:', lines.length);
      
      // Skip header row
      const dataLines = lines.slice(1);
      
      const plcData: Partial<PLCData> = {};
      const foundVariables: string[] = [];
      
      for (const line of dataLines) {
        const row = parseCsvLine(line);
        if (row.length < 6) continue;
        
        const name = row[0];
        const dataType = row[3];
        const valueStr = row[5];
        
        // Log all variable names for debugging
        if (name && (name.toLowerCase().includes('light') || name.toLowerCase().includes('vent') || 
                     name.toLowerCase().includes('temp') || name.toLowerCase().includes('humid'))) {
          console.log(`Found potential variable: "${name}" = "${valueStr}" (type: ${dataType})`);
        }
        
        let value: number;
        if (dataType.includes('REAL')) {
          value = parseFloat(valueStr);
        } else if (dataType.includes('BOOL')) {
          value = parseInt(valueStr, 10);
        } else {
          continue;
        }
        
        // Map to our data structure with exact PLC variable names
        if (name === 'light1') {
          plcData.light1 = value;
          foundVariables.push('light1');
        } else if (name === 'light2') {
          plcData.light2 = value;
          foundVariables.push('light2');
        } else if (name === 'Vent1') {
          plcData.vent1 = value;
          foundVariables.push('vent1');
        } else if (name === 'Vent2') {
          plcData.vent2 = value;
          foundVariables.push('vent2');
        } else if (name === 'temp1') {
          plcData.temp1 = value;
          foundVariables.push('temp1');
        } else if (name === 'humidity1') {
          plcData.humidity1 = value;
          foundVariables.push('humidity1');
        }
      }
      
      console.log('Found variables:', foundVariables);
      console.log('Parsed PLC data:', plcData);
      
      // Check if we have all required fields
      const requiredFields = ['light1', 'light2', 'vent1', 'vent2', 'temp1', 'humidity1'];
      const missingFields = requiredFields.filter(field => plcData[field as keyof PLCData] === undefined);
      
      if (missingFields.length === 0) {
        const result: PLCData = {
          light1: plcData.light1!,
          light2: plcData.light2!,
          vent1: plcData.vent1!,
          vent2: plcData.vent2!,
          temp1: plcData.temp1!,
          humidity1: plcData.humidity1!,
        };
        
        console.log('✓ PLC data parsed successfully:', result);
        setConnectionStatus('connected');
        return result;
      } else {
        console.warn('Missing required PLC variables:', missingFields);
        console.warn('Available data:', plcData);
        setConnectionStatus('error');
        return null;
      }
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('PLC request aborted');
        return null;
      }
      
      console.error('Error fetching PLC data:', error);
      setConnectionStatus('error');
      return null;
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [controllerIp, getUrl]);

  // Write variable to PLC - matching your PHP implementation
  const writeVariable = useCallback(async (name: string, value: number): Promise<void> => {
    if (!controllerIp) {
      throw new Error('No controller IP configured');
    }

    // Map our internal names to PLC variable names
    const plcVariableMap: { [key: string]: string } = {
      'light1': 'light1',
      'light2': 'light2', 
      'vent1': 'Vent1',
      'vent2': 'Vent2'
    };

    const plcVariableName = plcVariableMap[name];
    if (!plcVariableName) {
      throw new Error(`Invalid variable name: ${name}. Valid names: ${Object.keys(plcVariableMap).join(', ')}`);
    }

    try {
      console.log(`Writing ${plcVariableName}=${value} to PLC...`);
      
      // Create form data similar to your PHP implementation
      const formData = new URLSearchParams();
      formData.append(plcVariableName, value.toString());

      const response = await fetch(setUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log(`✔ Wrote ${value} to ${plcVariableName}. PLC response:`, responseText.trim());
      
      // Refresh data after write
      setTimeout(() => {
        refreshData();
      }, 100);
      
    } catch (error) {
      console.error(`Error writing ${plcVariableName}=${value}:`, error);
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

    console.log(`Setting up PLC connection to: ${controllerIp}`);
    setConnectionStatus('connecting');
    
    // Initial fetch
    refreshData();
    
    // Setup polling interval (reduced frequency to avoid overwhelming the PLC)
    pollIntervalRef.current = setInterval(() => {
      refreshData();
    }, 2000); // Increased from 1000ms to 2000ms

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
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
