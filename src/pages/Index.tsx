
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePLCDirect } from '@/hooks/usePLCDirect';
import ConnectionStatus from '@/components/ConnectionStatus';
import GrowStats from '@/components/GrowStats';
import EnvironmentControls from '@/components/EnvironmentControls';
import SystemStatus from '@/components/SystemStatus';
import PlantInfo from '@/components/PlantInfo';
import LiveGrowCam from '@/components/LiveGrowCam';
import PLCConfig from '@/components/PLCConfig';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

const Index = () => {
  const [controllerIp, setControllerIp] = useState('192.168.0.213');
  const { data, connectionStatus, writeVariable, refreshData, isLoading } = usePLCDirect(controllerIp);
  const { toast } = useToast();
  
  // Plant info state
  const [plantName, setPlantName] = useState('Green Dream');
  const [startDate] = useState(new Date('2024-06-01'));

  // Calculate grow days
  const growDays = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const handleToggleControl = async (control: 'light1' | 'light2' | 'vent1' | 'vent2', currentValue: number) => {
    const newValue = currentValue === 1 ? 0 : 1;
    
    try {
      await writeVariable(control, newValue);
      
      toast({
        title: "Control Command Sent",
        description: `${control.toUpperCase()} → ${newValue === 1 ? 'ON' : 'OFF'}`,
        duration: 3000,
      });
      
      console.log(`Toggling ${control}: ${currentValue} → ${newValue}`);
    } catch (error) {
      toast({
        title: "Control Error",
        description: `Failed to toggle ${control}: ${error}`,
        variant: "destructive",
        duration: 5000,
      });
      console.error(`Error toggling ${control}:`, error);
    }
  };

  const handlePlantNameChange = (newName: string) => {
    setPlantName(newName);
    toast({
      title: "Plant Info Updated",
      description: `Plant name changed to "${newName}"`,
      duration: 2000,
    });
  };

  const handleIpChange = (newIp: string) => {
    setControllerIp(newIp);
    toast({
      title: "IP Address Updated",
      description: `Controller IP set to ${newIp}. Note: You may need to restart the dev server for proxy changes to take effect.`,
      duration: 5000,
    });
  };

  const handleTestConnection = () => {
    refreshData();
    toast({
      title: "Testing Connection",
      description: "Attempting to connect to PLC...",
      duration: 2000,
    });
  };

  const reconnect = () => {
    refreshData();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-700 bg-gray-800/80 backdrop-blur-md transition-all duration-300">
        <div className="container mx-auto px-4 lg:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🌿</div>
              <div>
                <h1 className="text-2xl font-bold text-green-400 tracking-tight">BudBox</h1>
                <p className="text-gray-400 text-sm">Smart grow box dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/plc-config">
                <Button variant="outline" className="border-purple-600 text-purple-400 hover:bg-purple-600/20">
                  <Settings className="h-4 w-4 mr-2" />
                  PLC Variables
                </Button>
              </Link>
              <ConnectionStatus status={connectionStatus} onReconnect={reconnect} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="container mx-auto px-4 lg:px-6 py-6 space-y-8">
        {/* PLC Configuration Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-orange-400 rounded-full"></div>
            <h2 className="text-xl font-semibold text-gray-200">PLC Configuration</h2>
          </div>
          <PLCConfig
            currentIp={controllerIp}
            onIpChange={handleIpChange}
            connectionStatus={connectionStatus}
            onTestConnection={handleTestConnection}
          />
        </section>

        {/* Plant Overview Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-green-400 rounded-full"></div>
            <h2 className="text-xl font-semibold text-gray-200">Plant Overview</h2>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="transition-all duration-300 hover:scale-[1.02]">
              <PlantInfo />
            </div>
            <div className="transition-all duration-300 hover:scale-[1.02]">
              <GrowStats data={data} />
            </div>
          </div>
        </section>

        {/* Live Monitoring Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-blue-400 rounded-full"></div>
            <h2 className="text-xl font-semibold text-gray-200">Live Monitoring</h2>
          </div>
          <div className="transition-all duration-300 hover:scale-[1.01]">
            <LiveGrowCam />
          </div>
        </section>

        {/* Controls Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-yellow-400 rounded-full"></div>
            <h2 className="text-xl font-semibold text-gray-200">Environment Controls</h2>
          </div>
          <div className="transition-all duration-300 hover:scale-[1.01]">
            <EnvironmentControls
              data={data}
              onToggleControl={handleToggleControl}
              connectionStatus={connectionStatus}
            />
          </div>
        </section>

        {/* System Health Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-purple-400 rounded-full"></div>
            <h2 className="text-xl font-semibold text-gray-200">System Health</h2>
          </div>
          <div className="transition-all duration-300 hover:scale-[1.01]">
            <SystemStatus 
              connectionStatus={connectionStatus}
              lastUpdate={data ? new Date() : null}
            />
          </div>
        </section>

        {/* Footer Info */}
        <footer className="mt-12 p-6 bg-gray-800/30 border border-gray-700 rounded-xl backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <strong className="text-green-400">PLC Controller:</strong> 
              <span className="font-mono">{controllerIp}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <strong className="text-green-400">Status:</strong> 
              <span className="capitalize">{connectionStatus}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <strong className="text-green-400">Data:</strong> 
              <span>{data ? `Live (Available)` : 'No Data'}</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
