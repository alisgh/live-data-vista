import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Square as Stop, Droplet, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWatering } from '@/hooks/useWatering';
import { usePLCDirect } from '@/hooks/usePLCDirect';
import { useToast } from '@/hooks/use-toast';

/**
 * DB / API contract (suggested)
 *
 * Table: watering_stats
 * - total_watered_litres REAL NOT NULL DEFAULT 0
 * - water_tank_level_litres REAL NOT NULL DEFAULT 0
 * - total_watering_seconds INTEGER NOT NULL DEFAULT 0
 * - updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
 *
 * Endpoints:
 * - GET  /api/watering -> { totalWateredLitres, waterTankLevelLitres, totalWateringSeconds }
 * - POST /api/watering -> accepts partial { totalWateredLitres?, waterTankLevelLitres?, totalWateringSeconds? } and returns updated object
 */

export const DB_WATERING_COLUMNS = {
  total_watered_litres: 'total_watered_litres',
  water_tank_level_litres: 'water_tank_level_litres',
  total_watering_seconds: 'total_watering_seconds',
};

interface Props {
  // Flow configuration: 2 litres every 5 minutes by default
  litresPerFiveMinutes?: number;
  // How often to auto-sync with the server (ms)
  syncIntervalMs?: number;
}

const WateringControl: React.FC<Props> = ({ litresPerFiveMinutes = 2, syncIntervalMs = 15000 }) => {
  // Flow per second
  const flowPerSecond = useMemo(() => litresPerFiveMinutes / (5 * 60), [litresPerFiveMinutes]);

  const { data, isLoading, error, fetchWatering, updateWatering } = useWatering();
  const { writeVariable, connectionStatus } = usePLCDirect();
  const { toast } = useToast();

  const [watering, setWatering] = useState(false);
  const [local, setLocal] = useState({
    totalWateredLitres: 0,
    waterTankLevelLitres: 0,
    totalWateringSeconds: 0,
  });

  const [refillAmount, setRefillAmount] = useState<number>(10);

  const [manualLevel, setManualLevel] = useState<number>(0);

  // Keep local up-to-date when remote data arrives
  useEffect(() => {
    if (data) {
      setLocal(data);
      setManualLevel(data.waterTankLevelLitres ?? 0);
    }
  }, [data]);

  // Interval that simulates flow when valve is open
  const tickRef = useRef<number | null>(null);
  useEffect(() => {
    if (!watering) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }

    tickRef.current = window.setInterval(() => {
      setLocal(prev => {
        const added = flowPerSecond;
        let nextTank = prev.waterTankLevelLitres - added;
        let stopped = false;
        if (nextTank <= 0) {
          nextTank = 0;
          stopped = true;
        }

        const next = {
          totalWateredLitres: +(prev.totalWateredLitres + added),
          waterTankLevelLitres: +nextTank,
          totalWateringSeconds: prev.totalWateringSeconds + 1,
        };

        // If tank drained, stop watering
        if (stopped) setWatering(false);

        return next;
      });
    }, 1000);

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [watering, flowPerSecond]);

  // Sync local -> server periodically
  const syncRef = useRef<number | null>(null);
  useEffect(() => {
    // Sync function
    const sync = async () => {
      try {
        if (!data) return;
        const payload = { ...local };
        await updateWatering(payload);
      } catch (err) {
        console.error('Failed to sync watering data:', err);
      }
    };

    // Start periodic sync
    syncRef.current = window.setInterval(sync, syncIntervalMs);
    return () => {
      if (syncRef.current) {
        clearInterval(syncRef.current);
        syncRef.current = null;
      }
    };
  }, [local, updateWatering, data, syncIntervalMs]);

  // Helper actions
  const handleToggle = async () => {
    // If starting and tank is empty, attempt to fetch remote data first
    if (!watering && local.waterTankLevelLitres <= 0) {
      const remote = await fetchWatering();
      if (remote === null) {
        // API unreachable — let user proceed locally only if tank has some water
        toast({ title: 'Watering API unreachable', description: 'Proceeding with local simulation', duration: 4000 });
        if (local.waterTankLevelLitres <= 0) {
          setWatering(false);
          return;
        }
      } else {
        if (remote.waterTankLevelLitres <= 0) {
          // nothing to do
          setWatering(false);
          return;
        }
      }
    }

    setWatering(v => {
      const next = !v;
      // Immediate sync when toggling
      (async () => {
        try {
          await updateWatering(local);
        } catch (err) {
          console.error('Immediate sync failed:', err);
        }
      })();
      return next;
    });
  };

  const handleRefill = async (amount = 10) => {
    // Compute new local state based on current value to avoid stale closure issues
    const newLocal = { ...local, waterTankLevelLitres: +(local.waterTankLevelLitres + amount) };
    setLocal(newLocal);
    // push to server
    try {
      await updateWatering(newLocal);
      toast({ title: 'Tank refilled', description: `Added ${amount} L`, duration: 3000 });
    } catch (err) {
      console.error('Failed to refill tank:', err);
      toast({ title: 'Refill failed', description: String(err), variant: 'destructive' });
    }
  };

  const handleSetLevel = async (level: number) => {
    if (level < 0) {
      toast({ title: 'Invalid level', description: 'Water level must be 0 or greater', variant: 'destructive' });
      return;
    }

    const newLocal = { ...local, waterTankLevelLitres: +level };
    setLocal(newLocal);
    setManualLevel(level);

    try {
      await updateWatering(newLocal);
      toast({ title: 'Water level set', description: `${level} L`, duration: 3000 });
    } catch (err) {
      console.error('Failed to set water level:', err);
      toast({ title: 'Set level failed', description: String(err), variant: 'destructive' });
    }
  };  

  const handleOpenValve = async () => {
    if (connectionStatus !== 'connected') {
      toast({ title: 'PLC not connected', description: 'Cannot open valve while PLC is disconnected', variant: 'destructive' });
      return;
    }
    try {
      await writeVariable('b_water', 1);
      toast({ title: 'Valve Opened', description: 'Open command sent', duration: 3000 });
      setWatering(true);
    } catch (err) {
      toast({ title: 'Open Failed', description: String(err), variant: 'destructive' });
      console.error('Failed to open valve:', err);
    }
  };

  const handleCloseValve = async () => {
    if (connectionStatus !== 'connected') {
      toast({ title: 'PLC not connected', description: 'Cannot close valve while PLC is disconnected', variant: 'destructive' });
      return;
    }
    try {
      await writeVariable('b_water', 0);
      toast({ title: 'Valve Closed', description: 'Close command sent', duration: 3000 });
      setWatering(false);
    } catch (err) {
      toast({ title: 'Close Failed', description: String(err), variant: 'destructive' });
      console.error('Failed to close valve:', err);
    }
  };

  const handleRetry = async () => {
    const result = await fetchWatering();
    if (result) {
      toast({ title: 'Reconnected', description: 'Watering API is reachable', duration: 3000 });
    } else {
      toast({ title: 'Still offline', description: 'Failed to reach API', variant: 'destructive' });
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-green-300">
            <Droplet className="w-5 h-5" /> Watering
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Sync: every {Math.round(syncIntervalMs / 1000)}s</span>
            <Button size="sm" variant="ghost" onClick={() => fetchWatering()}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-4">
          {error && (
            <div className="flex items-center gap-2 text-yellow-400">
              <div className="text-sm">Watering API offline</div>
              <Button size="sm" variant="ghost" onClick={handleRetry}>Retry</Button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900/40 p-3 rounded">
              <div className="text-xs text-gray-400">Total Dispensed</div>
              <div className="text-xl font-semibold">{local.totalWateredLitres.toFixed(3)} L</div>
            </div>
            <div className="bg-gray-900/40 p-3 rounded">
              <div className="text-xs text-gray-400">Tank Level</div>
              <div className="text-xl font-semibold">{local.waterTankLevelLitres.toFixed(3)} L</div>
            </div>
            <div className="bg-gray-900/40 p-3 rounded col-span-2">
              <div className="text-xs text-gray-400">Total Watering Time</div>
              <div className="text-xl font-semibold">{formatTime(local.totalWateringSeconds)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleToggle} className={watering ? 'bg-red-500' : 'bg-green-500'}>
              {watering ? <Stop className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {watering ? 'Stop' : 'Start'}
            </Button>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={0.1}
                value={refillAmount}
                onChange={(e) => setRefillAmount(Number(e.target.value))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRefill(refillAmount); }}
                className="w-20 bg-gray-900/30 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                aria-label="Refill amount (litres)"
              />

              <Button variant="outline" onClick={() => handleRefill(refillAmount)} disabled={refillAmount <= 0}>
                Refill
              </Button>

              <input
                type="number"
                min={0}
                step={0.1}
                value={manualLevel}
                onChange={(e) => setManualLevel(Number(e.target.value))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSetLevel(manualLevel); }}
                className="w-24 bg-gray-900/30 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                aria-label="Set tank level (litres)"
              />

              <Button variant="secondary" onClick={() => handleSetLevel(manualLevel)} disabled={manualLevel < 0}>
                Set Level
              </Button>
            </div>

            <Button size="sm" variant="ghost" onClick={handleOpenValve} disabled={connectionStatus !== 'connected'}>
              Open Valve
            </Button>

            <Button size="sm" variant="outline" onClick={handleCloseValve} disabled={connectionStatus !== 'connected'}>
              Close Valve
            </Button>

            <div className="text-sm text-gray-400 ml-auto">Flow: {flowPerSecond.toFixed(4)} L/s ({litresPerFiveMinutes} L / 5m)</div>
          </div>

          {error && <div className="text-sm text-red-400">Error: {error}</div>}
          {isLoading && <div className="text-sm text-gray-400">Loading watering data…</div>}
        </div>
      </CardContent>
    </Card>
  );
};

export default WateringControl;