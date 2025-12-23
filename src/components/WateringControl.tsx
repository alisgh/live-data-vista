import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Square as Stop, Droplet, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWatering } from '@/hooks/useWatering';
import { usePLCDirect } from '@/hooks/usePLCDirect';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';

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

const WateringControl: React.FC<Props> = ({ litresPerFiveMinutes = 2, syncIntervalMs = 15000, tankCapacity = 100 }) => {
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
          setLastSync(Date.now());
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Left: visual tank */}
          <div className="md:col-span-1 flex flex-col items-center gap-4 p-4 bg-gray-900/30 rounded">
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-400">Tank Level</div>
                <Badge variant="outline">{tankPercent.toFixed(0)}%</Badge>
              </div>
              <Progress value={tankPercent} className="h-4" />
              <div className="mt-3 text-center">
                <div className="text-lg font-semibold">{local.waterTankLevelLitres.toFixed(2)} L</div>
                <div className="text-sm text-gray-400">Capacity {tankCapacity} L</div>
                <div className="text-sm text-gray-400 mt-2">Est. remaining: <span className="font-medium">{estimated}</span></div>
              </div>
            </div>
          </div>

          {/* Middle: main controls */}
          <div className="md:col-span-1 flex flex-col gap-4 p-4 bg-gray-900/30 rounded">
            <div className="flex flex-col gap-2 w-full">
              <Button onClick={handleToggle} disabled={!watering && local.waterTankLevelLitres <= 0} className={`w-full py-4 ${watering ? 'bg-red-500' : 'bg-green-500'} text-lg disabled:opacity-60 disabled:cursor-not-allowed`}>
                {watering ? <Stop className="w-5 h-5 mr-3 inline" /> : <Play className="w-5 h-5 mr-3 inline" />}
                {watering ? 'Stop watering' : 'Start watering'}
              </Button>
              {local.waterTankLevelLitres <= 0 && (
                <div className="text-sm text-yellow-400">Tank empty — refill before starting</div>
              )}
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 w-full">
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => handleRefill(1)}>+1L</Button>
                <Button variant="ghost" onClick={() => handleRefill(5)}>+5L</Button>
                <Button variant="ghost" onClick={() => handleRefill(10)}>+10L</Button>
              </div>

              <div className="ml-auto flex items-center gap-2 min-w-0">
                <Input type="number" min={0} step={0.1} value={refillAmount} onChange={(e) => setRefillAmount(Number(e.target.value))} className="w-full md:w-24 min-w-0" />
                <Button variant="outline" onClick={() => handleRefill(refillAmount)} disabled={refillAmount <= 0}>Refill</Button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-2 items-center w-full">
              <Input type="number" min={0} step={0.1} value={manualLevel} onChange={(e) => setManualLevel(Number(e.target.value))} className="w-full md:w-36" />
              <Button variant="secondary" onClick={() => handleSetLevel(manualLevel)} disabled={manualLevel < 0}>Set Level</Button>
            </div>

            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" disabled={connectionStatus !== 'connected'}>Open Valve</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Open valve now?</DialogTitle>
                    <DialogDescription>This will immediately open the water valve.</DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={() => { handleOpenValve(); }}>
                      Confirm
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={connectionStatus !== 'connected'}>Close Valve</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Close valve?</DialogTitle>
                    <DialogDescription>This will immediately close the water valve.</DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={() => { handleCloseValve(); }}>
                      Confirm
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Right: meta / status */}
          <div className="md:col-span-1 flex flex-col gap-3 p-4 bg-gray-900/30 rounded">
            <div className="text-xs text-gray-400">Stats</div>
            <div className="text-sm">Total dispensed: <span className="font-medium">{local.totalWateredLitres.toFixed(2)} L</span></div>
            <div className="text-sm">Total watering time: <span className="font-medium">{formatTime(local.totalWateringSeconds)}</span></div>
            <div className="text-sm">Flow: <span className="font-medium">{flowPerSecond.toFixed(4)} L/s</span></div>

            <div className="mt-2">
              <div className="text-xs text-gray-400">Last sync</div>
              <div className="text-sm font-medium">{formatDate(lastSync)}</div>
            </div>

            {error && <div className="text-sm text-red-400">Error: {error} <Button size="sm" variant="ghost" onClick={handleRetry}>Retry</Button></div>}
            {isLoading && <div className="text-sm text-gray-400">Loading watering data…</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WateringControl;