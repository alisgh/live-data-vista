
import React, { useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import ConnectionStatus from '@/components/ConnectionStatus';
import GrowStats from '@/components/GrowStats';
import EnvironmentControls from '@/components/EnvironmentControls';
import SystemStatus from '@/components/SystemStatus';
import PlantInfo from '@/components/PlantInfo';
import LiveGrowCam from '@/components/LiveGrowCam';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { data, connectionStatus, reconnect, writeVariable } = useWebSocket('ws://192.168.0.143:8085');
  const { toast } = useToast();
  
  // Plant info state
  const [plantName, setPlantName] = useState('Green Dream');
  const [startDate] = useState(new Date('2024-06-01'));

  // Calculate grow days
  const growDays = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const handleToggleControl = (control: 'light1' | 'vent1', currentValue: number) => {
    const newValue = currentValue === 1 ? 0 : 1;
    
    writeVariable(control, newValue);
    
    toast({
      title: "Control Command Sent",
      description: `${control.toUpperCase()} → ${newValue === 1 ? 'ON' : 'OFF'}`,
      duration: 3000,
    });
    
    console.log(`Toggling ${control}: ${currentValue} → ${newValue}`);
  };

  const handlePlantNameChange = (newName: string) => {
    setPlantName(newName);
    toast({
      title: "Plant Info Updated",
      description: `Plant name changed to "${newName}"`,
      duration: 2000,
    });
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
            <ConnectionStatus status={connectionStatus} onReconnect={reconnect} />
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="container mx-auto px-4 lg:px-6 py-6 space-y-8">
        {connectionStatus === 'blocked' ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-6 max-w-lg animate-fade-in">
              <div className="w-20 h-20 bg-orange-900/20 rounded-full flex items-center justify-center mx-auto border border-orange-600 shadow-lg">
                <span className="text-orange-400 text-3xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-orange-400 mb-3">Connection Blocked</h3>
                <p className="text-gray-400 leading-relaxed">
                  Cannot connect to insecure WebSocket (ws://) from a secure page (https://).
                </p>
                <div className="mt-6 p-6 bg-orange-900/10 border border-orange-600/20 rounded-xl text-sm text-orange-300">
                  <p className="font-medium mb-3">To fix this issue:</p>
                  <ul className="text-left space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      Use a secure WebSocket (wss://) on your server, or
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      Access this dashboard via http:// instead of https://
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Plant Overview Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-8 bg-green-400 rounded-full"></div>
                <h2 className="text-xl font-semibold text-gray-200">Plant Overview</h2>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="transition-all duration-300 hover:scale-[1.02]">
                  <PlantInfo 
                    plantName={plantName}
                    growDays={growDays}
                    onNameChange={handlePlantNameChange}
                  />
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
          </>
        )}

        {/* Footer Info */}
        <footer className="mt-12 p-6 bg-gray-800/30 border border-gray-700 rounded-xl backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <strong className="text-green-400">PLC Server:</strong> 
              <span className="font-mono">ws://192.168.0.143:8085</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <strong className="text-green-400">Status:</strong> 
              <span className="capitalize">{connectionStatus}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <strong className="text-green-400">Data:</strong> 
              <span>{data ? `Live (T:${data.temp1?.toFixed(1)}°C H:${data.humidity1?.toFixed(0)}%)` : 'Demo Mode'}</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
