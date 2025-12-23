import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Square as Stop, Droplet, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWatering } from '@/hooks/useWatering';

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

  const [watering, setWatering] = useState(false);
  const [local, setLocal] = useState({
    totalWateredLitres: 0,
    waterTankLevelLitres: 0,
    totalWateringSeconds: 0,
  });

  // Keep local up-to-date when remote data arrives
  useEffect(() => {
    if (data) setLocal(data);
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
      await fetchWatering();
      if (data && data.waterTankLevelLitres <= 0) {
        // nothing to do
        setWatering(false);
        return;
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
    setLocal(prev => ({ ...prev, waterTankLevelLitres: prev.waterTankLevelLitres + amount }));
    // push to server
    try {
      await updateWatering({ ...local, waterTankLevelLitres: local.waterTankLevelLitres + amount });
    } catch (err) {
      console.error('Failed to refill tank:', err);
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

            <Button variant="outline" onClick={() => handleRefill(10)}>
              Refill +10L
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