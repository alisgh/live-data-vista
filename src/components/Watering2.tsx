import React from 'react';
import { usePLCDirect } from '@/hooks/usePLCDirect';

const Watering2: React.FC = () => {
  const { triggerPulse, data, isLoading, connectionStatus } = usePLCDirect();

  const handleWater = () => {
    // Pulse for 500ms, adjust as needed
    triggerPulse('b_water2', 500);
  };

  return (
    <div className="p-4 border rounded shadow">
      <h3 className="font-bold mb-2">Watering 2 (Valve 2)</h3>
      <div className="mb-2">
        Status:&nbsp;
        <span className={data?.b_water2 ? 'text-green-600' : 'text-gray-500'}>
          {data?.b_water2 ? 'ON' : 'OFF'}
        </span>
      </div>
      <button
        className="btn btn-primary"
        disabled={isLoading || connectionStatus !== 'connected'}
        onClick={handleWater}
      >
        Activate Valve 2
      </button>
    </div>
  );
};

export default Watering2;
