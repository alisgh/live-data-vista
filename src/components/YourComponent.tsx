import React from 'react';
import { usePLCDirect } from '@/hooks/usePLCDirect';

export const PLCControlPanel = () => {
  const { triggerPulse, isLoading, connectionStatus } = usePLCDirect();

  return (
    <div>
      {/* ...existing controls... */}
      <button
        className="btn btn-primary"
        disabled={isLoading || connectionStatus !== 'connected'}
        onClick={() => triggerPulse('b_water2', 500)}
      >
        Trigger b_water2
      </button>
      {/* ...existing controls... */}
    </div>
  );
};