
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePLCDirect } from '@/hooks/usePLCDirect';
import ConnectionStatus from '@/components/ConnectionStatus';
import LiveGrowCam from '@/components/LiveGrowCam';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import WateringControl from '@/components/WateringControl';
import NutrientSchedule from '@/components/NutrientSchedule';


const Index = () => {
  const [controllerIp, setControllerIp] = useState('192.168.100.70');
  const { data, connectionStatus, writeVariable, refreshData, isLoading, triggerPulse } = usePLCDirect();
  const { toast } = useToast();
  const [lightValue, setLightValue] = useState(0);

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

  const handleLightChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setLightValue(value);
    try {
      await writeVariable('r_light', value);
      toast({
        title: 'Light Intensity Updated',
        description: `Set to ${value}%`,
        duration: 2000,
      });
    } catch (err) {
      toast({ title: 'Light Error', description: String(err), variant: 'destructive', duration: 5000 });
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

          <div className="transition-all duration-300 hover:scale-[1.01] flex flex-col gap-4">
            {/* Light Control */}
            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
              <h2 className="text-lg font-semibold text-gray-200 mb-2">Light Control</h2>
              <input
                type="range"
                min={0}
                max={100}
                value={data?.r_light ?? lightValue}
                onChange={handleLightChange}
                className="w-full"
              />
              <div className="flex justify-between text-sm mt-1">
                <span>0%</span>
                <span>{data?.r_light ?? lightValue}%</span>
                <span>100%</span>
              </div>
            </div>
            <WateringControl />
            <NutrientSchedule />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
