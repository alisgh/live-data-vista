
import React from 'react';
import { usePLCDirect } from '@/hooks/usePLCDirect';
import ConnectionStatus from '@/components/ConnectionStatus';
import LiveGrowCam from '@/components/LiveGrowCam';
import { useToast } from '@/hooks/use-toast';


const Index = () => {
  const { data, connectionStatus, writeVariable, refreshData, isLoading } = usePLCDirect();
  const { toast } = useToast();

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

      {/* Main - only Live Grow Cam */}
      <main className="container mx-auto px-4 lg:px-6 py-6">
        <div className="max-w-3xl mx-auto">
          <LiveGrowCam />
        </div>
      </main>
    </div>
  );
};

export default Index;
