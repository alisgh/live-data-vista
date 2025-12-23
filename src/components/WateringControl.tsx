import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Square as Stop, Droplet, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWatering } from '@/hooks/useWatering';
import { usePLCDirect } from '@/hooks/usePLCDirect';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

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
  // Tank capacity in litres for progress calculation
  tankCapacity?: number;
}

const WateringControl: React.FC<Props> = ({ litresPerFiveMinutes = 2, syncIntervalMs = 15000, tankCapacity = 10 }) => {
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

  const [lastSync, setLastSync] = useState<number | null>(null);

  // Helper: format seconds -> human readable
  function formatTime(seconds: number) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  }

  // Derived / UI values
  const tankPercent = Math.min(100, Math.max(0, (local.waterTankLevelLitres / tankCapacity) * 100));
  const estimatedSeconds = flowPerSecond > 0 ? Math.floor(local.waterTankLevelLitres / flowPerSecond) : 0;
  const estimated = formatTime(estimatedSeconds);
  const formatDate = (ts: number | null) => (ts ? new Date(ts).toLocaleTimeString() : '—');

  // Keep local up-to-date when remote data arrives
  useEffect(() => {
    if (data) {
      setLocal(data);
      setManualLevel(data.waterTankLevelLitres ?? 0);
      setLastSync(Date.now());
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
        toast({ title: 'Watering API unreachable', description: 'Proceeding with local simulation', duration: 4000 });
        if (local.waterTankLevelLitres <= 0) {
          return; // nothing to start
        }
      } else {
        if (remote.waterTankLevelLitres <= 0) {
          return; // nothing to start
        }
      }
    }

    if (!watering) {
      // starting: attempt to open the valve on PLC
      const ok = await handleOpenValve();
      if (!ok) return; // failed to open PLC valve
      // sync state
      try {
        await updateWatering(local);
        setLastSync(Date.now());
      } catch (err) {
        console.error('Immediate sync failed after open:', err);
      }
    } else {
      // stopping: attempt to close the valve on PLC
      const ok = await handleCloseValve();
      if (!ok) return;
      try {
        await updateWatering(local);
        setLastSync(Date.now());
      } catch (err) {
        console.error('Immediate sync failed after close:', err);
      }
    }
  };

  const handleRefill = async (amount = 10) => {
    // Compute new local state based on current value to avoid stale closure issues
    const newLocal = { ...local, waterTankLevelLitres: +(local.waterTankLevelLitres + amount) };
    setLocal(newLocal);
    // push to server
    try {
      await updateWatering(newLocal);
      setLastSync(Date.now());
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
      setLastSync(Date.now());
      toast({ title: 'Water level set', description: `${level} L`, duration: 3000 });
    } catch (err) {
      console.error('Failed to set water level:', err);
      toast({ title: 'Set level failed', description: String(err), variant: 'destructive' });
    }
  };  

  const handleOpenValve = async (): Promise<boolean> => {
    if (connectionStatus !== 'connected') {
      toast({ title: 'PLC not connected', description: 'Cannot open valve while PLC is disconnected', variant: 'destructive' });
      return false;
    }
    try {
      await writeVariable('b_water', 1);
      toast({ title: 'Valve Opened', description: 'Open command sent', duration: 3000 });
      setWatering(true);
      return true;
    } catch (err) {
      toast({ title: 'Open Failed', description: String(err), variant: 'destructive' });
      console.error('Failed to open valve:', err);
      return false;
    }
  };

  const handleCloseValve = async (): Promise<boolean> => {
    if (connectionStatus !== 'connected') {
      toast({ title: 'PLC not connected', description: 'Cannot close valve while PLC is disconnected', variant: 'destructive' });
      return false;
    }
    try {
      await writeVariable('b_water', 0);
      toast({ title: 'Valve Closed', description: 'Close command sent', duration: 3000 });
      setWatering(false);
      return true;
    } catch (err) {
      toast({ title: 'Close Failed', description: String(err), variant: 'destructive' });
      console.error('Failed to close valve:', err);
      return false;
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
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex-1">
            <div className="text-xs text-gray-400 mb-1">Tank</div>
            <div className="flex items-center gap-3">
              <div className="w-36">
                <Progress value={tankPercent} className="h-3 rounded" />
              </div>
              <div className="text-sm font-medium">{local.waterTankLevelLitres.toFixed(2)} L</div>
              <div className="text-xs text-gray-400 ml-auto">{tankPercent.toFixed(0)}%</div>
            </div>
            <div className="text-xs text-gray-400 mt-2">Est: {estimated}</div>
          </div>

          <div className="w-48 flex flex-col gap-2">
            <Button onClick={handleToggle} disabled={!watering && local.waterTankLevelLitres <= 0} className={`py-2 ${watering ? 'bg-red-500' : 'bg-green-500'} text-sm`}>
              {watering ? 'Stop' : 'Start'}
            </Button>

            <div className="flex gap-2">
              <Input type="number" min={0} step={0.1} value={refillAmount} onChange={(e) => setRefillAmount(Number(e.target.value))} className="w-20" />
              <Button variant="outline" onClick={() => handleRefill(refillAmount)} disabled={refillAmount <= 0}>Refill</Button>
            </div>

            <div className="flex gap-2">
              <Input type="number" min={0} step={0.1} value={manualLevel} onChange={(e) => setManualLevel(Number(e.target.value))} className="w-20" />
              <Button variant="outline" onClick={() => handleSetLevel(manualLevel)} disabled={manualLevel < 0}>Set</Button>
            </div>

            <div className="flex gap-2 text-sm">
              <button className="text-gray-400 hover:text-white" onClick={() => { if (connectionStatus === 'connected' && window.confirm('Open valve?')) handleOpenValve(); }} disabled={connectionStatus !== 'connected'}>Open</button>
              <button className="text-gray-400 hover:text-white" onClick={() => { if (connectionStatus === 'connected' && window.confirm('Close valve?')) handleCloseValve(); }} disabled={connectionStatus !== 'connected'}>Close</button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-400 flex justify-between">
          <div>Total: {local.totalWateredLitres.toFixed(2)} L</div>
          <div>Last: {formatDate(lastSync)}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WateringControl;