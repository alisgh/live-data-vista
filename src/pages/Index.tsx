
import React from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import ConnectionStatus from '@/components/ConnectionStatus';
import InputDisplay from '@/components/InputDisplay';
import AnalogDisplay from '@/components/AnalogDisplay';
import OutputControl from '@/components/OutputControl';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { data, connectionStatus, sendMessage, reconnect } = useWebSocket('ws://192.168.0.229:8085');
  const { toast } = useToast();

  // Default data with 0 values when no WebSocket data is available
  const defaultData = {
    inputs: Array.from({ length: 8 }, (_, i) => ({ name: `Input${i + 1}`, value: 0 })),
    analog: Array.from({ length: 4 }, (_, i) => ({ name: `Analog${i + 1}`, value: 0 })),
    outputs: Array.from({ length: 8 }, (_, i) => ({ name: `Output${i + 1}`, value: 0 }))
  };

  const displayData = data || defaultData;

  const handleToggleOutput = (name: string, currentValue: number) => {
    const newValue = currentValue === 1 ? 0 : 1;
    const message = { name, value: newValue };
    
    sendMessage(message);
    
    toast({
      title: "Output Control",
      description: `${name} set to ${newValue === 1 ? 'ON' : 'OFF'}`,
      duration: 2000,
    });
    
    console.log('Sent message:', message);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">WebSocket Dashboard</h1>
              <p className="text-muted-foreground">Real-time monitoring and control</p>
            </div>
            <ConnectionStatus status={connectionStatus} onReconnect={reconnect} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {connectionStatus === 'blocked' ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4 max-w-lg">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-orange-600 text-2xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-lg font-medium text-orange-900">Connection Blocked</h3>
                <p className="text-muted-foreground mt-2">
                  Cannot connect to insecure WebSocket (ws://) from a secure page (https://).
                </p>
                <div className="mt-4 p-4 bg-orange-50 rounded-lg text-sm text-orange-800">
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
            {/* Digital Inputs */}
            {displayData.inputs && displayData.inputs.length > 0 && (
              <InputDisplay inputs={displayData.inputs} />
            )}

            {/* Analog Inputs */}
            {displayData.analog && displayData.analog.length > 0 && (
              <AnalogDisplay analog={displayData.analog} />
            )}

            {/* Digital Outputs */}
            {displayData.outputs && displayData.outputs.length > 0 && (
              <OutputControl
                outputs={displayData.outputs}
                onToggleOutput={handleToggleOutput}
                connectionStatus={connectionStatus}
              />
            )}
          </>
        )}

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Server:</strong> ws://192.168.0.229:8085
            </div>
            <div>
              <strong>Status:</strong> {connectionStatus}
            </div>
            <div>
              <strong>Last Update:</strong> {data ? new Date().toLocaleTimeString() : 'Using default values'}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
