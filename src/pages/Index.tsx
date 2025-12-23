
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePLCDirect } from '@/hooks/usePLCDirect';
import ConnectionStatus from '@/components/ConnectionStatus';
import LiveGrowCam from '@/components/LiveGrowCam';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [controllerIp, setControllerIp] = useState('192.168.100.70');
  const { data, connectionStatus, writeVariable, refreshData, isLoading, triggerPulse } = usePLCDirect();
  const { toast } = useToast();

  const handleWater = async () => {
    try {
      await triggerPulse('b_water', 5000);
      toast({
        title: 'Water Pulse Sent',
        description: 'Opened water valve for 5 seconds',
        duration: 3000,
      });
      console.log('Water pulse triggered for 5s');
    } catch (err) {
      toast({ title: 'Water Error', description: String(err), variant: 'destructive', duration: 5000 });
      console.error('Failed to trigger water valve:', err);
    }
  };

  const reconnect = () => {
    refreshData();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-700 bg-gray-800/80 backdrop-blur-md">
        <div className="container mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🌿</div>
            <div>
              <h1 className="text-2xl font-bold text-green-400 tracking-tight">BudBox</h1>
              <p className="text-gray-400 text-sm">Water & Camera</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ConnectionStatus status={connectionStatus} onReconnect={reconnect} />
          </div>
        </div>
      </header>

      {/* Main - only webcam + water control */}
      <main className="container mx-auto px-4 lg:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 transition-all duration-300 hover:scale-[1.01]">
            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
              <h2 className="text-lg font-semibold text-gray-200 mb-4">Live Camera</h2>
              <LiveGrowCam />
            </div>
          </div>

          <div className="transition-all duration-300 hover:scale-[1.01]">
            <div className="p-6 bg-gray-700/30 rounded-xl border border-gray-600">
              <h3 className="text-lg font-semibold text-gray-200 mb-4">Water Control</h3>
              <p className="text-sm text-gray-400 mb-4">Trigger a 5-second water pulse to water the plant.</p>
              <div className="flex flex-col gap-3">
                <Button onClick={handleWater} className="bg-blue-500 text-white hover:bg-blue-600" disabled={connectionStatus !== 'connected'}>
                  Open 5s
                </Button>
                <Button variant="outline" onClick={() => writeVariable('b_water', 1)} disabled={connectionStatus !== 'connected'}>
                  Open (Manual Write 1)
                </Button>
                <Button variant="ghost" onClick={() => writeVariable('b_water', 0)} disabled={connectionStatus !== 'connected'}>
                  Close (Manual Write 0)
                </Button>
              </div>

              <div className="mt-4 text-xs text-gray-400">
                <div>PLC: <span className="font-mono">{controllerIp}</span></div>
                <div>Status: <span className="capitalize">{connectionStatus}</span></div>
                <div>Data: {data ? 'Live (Available)' : 'No Data'}</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
