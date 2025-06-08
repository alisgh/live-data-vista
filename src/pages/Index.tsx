
import React, { useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import ConnectionStatus from '@/components/ConnectionStatus';
import GrowStats from '@/components/GrowStats';
import EnvironmentControls from '@/components/EnvironmentControls';
import SystemStatus from '@/components/SystemStatus';
import PlantInfo from '@/components/PlantInfo';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { data, connectionStatus, sendMessage, reconnect } = useWebSocket('ws://192.168.0.229:8085');
  const { toast } = useToast();
  
  // Plant info state
  const [plantName, setPlantName] = useState('Green Dream');
  const [startDate] = useState(new Date('2024-06-01'));

  // Calculate grow days
  const growDays = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Default data for demo/offline mode
  const defaultData = {
    inputs: [
      { name: 'Temperature', value: 24.5 },
      { name: 'Humidity', value: 65 }
    ],
    analog: [
      { name: 'Temperature', value: 245 }, // representing 24.5°C
      { name: 'Humidity', value: 650 }     // representing 65%
    ],
    outputs: [
      { name: 'GrowLight', value: 1 },
      { name: 'Ventilation', value: 1 }
    ]
  };

  const displayData = data || defaultData;

  const handleToggleControl = (controlName: string, currentValue: number) => {
    const newValue = currentValue === 1 ? 0 : 1;
    const message = { name: controlName, value: newValue };
    
    sendMessage(message);
    
    toast({
      title: "Control Updated",
      description: `${controlName} turned ${newValue === 1 ? 'ON' : 'OFF'}`,
      duration: 3000,
    });
    
    console.log('Sent control message:', message);
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
      <header className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-green-400">🌿 Smart Grow Box</h1>
              <p className="text-gray-400">Intelligent cultivation monitoring</p>
            </div>
            <ConnectionStatus status={connectionStatus} onReconnect={reconnect} />
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {connectionStatus === 'blocked' ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4 max-w-lg">
              <div className="w-16 h-16 bg-orange-900/20 rounded-full flex items-center justify-center mx-auto border border-orange-600">
                <span className="text-orange-400 text-2xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-lg font-medium text-orange-400">Connection Blocked</h3>
                <p className="text-gray-400 mt-2">
                  Cannot connect to insecure WebSocket (ws://) from a secure page (https://).
                </p>
                <div className="mt-4 p-4 bg-orange-900/10 border border-orange-600/20 rounded-lg text-sm text-orange-300">
                  <p className="font-medium mb-2">To fix this issue:</p>
                  <ul className="text-left space-y-1">
                    <li>• Use a secure WebSocket (wss://) on your server, or</li>
                    <li>• Access this dashboard via http:// instead of https://</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Plant Info & Grow Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PlantInfo 
                plantName={plantName}
                growDays={growDays}
                onNameChange={handlePlantNameChange}
              />
              <GrowStats data={displayData} />
            </div>

            {/* Environment Controls */}
            <EnvironmentControls
              outputs={displayData.outputs}
              onToggleControl={handleToggleControl}
              connectionStatus={connectionStatus}
            />

            {/* System Status */}
            <SystemStatus 
              connectionStatus={connectionStatus}
              lastUpdate={data ? new Date() : null}
            />
          </>
        )}

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
            <div>
              <strong className="text-green-400">Server:</strong> ws://192.168.0.229:8085
            </div>
            <div>
              <strong className="text-green-400">Status:</strong> {connectionStatus}
            </div>
            <div>
              <strong className="text-green-400">Mode:</strong> {data ? 'Live Data' : 'Demo Mode'}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
