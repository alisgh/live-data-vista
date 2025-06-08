
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
        {data ? (
          <>
            {/* Digital Inputs */}
            {data.inputs && data.inputs.length > 0 && (
              <InputDisplay inputs={data.inputs} />
            )}

            {/* Analog Inputs */}
            {data.analog && data.analog.length > 0 && (
              <AnalogDisplay analog={data.analog} />
            )}

            {/* Digital Outputs */}
            {data.outputs && data.outputs.length > 0 && (
              <OutputControl
                outputs={data.outputs}
                onToggleOutput={handleToggleOutput}
                connectionStatus={connectionStatus}
              />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <div>
                <h3 className="text-lg font-medium">Waiting for data...</h3>
                <p className="text-muted-foreground">
                  {connectionStatus === 'connected' 
                    ? 'Connected to WebSocket, waiting for first message'
                    : 'Connecting to WebSocket server at ws://192.168.0.229:8085'
                  }
                </p>
              </div>
            </div>
          </div>
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
              <strong>Last Update:</strong> {data ? new Date().toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
