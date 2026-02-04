import React from 'react';
import { usePLCDirect } from '@/hooks/usePLCDirect';

const Watering2: React.FC = () => {
  const { writeVariable, data, isLoading, connectionStatus } = usePLCDirect();

  return (
    <div className="p-4 border rounded shadow">
      <h3 className="font-bold mb-2">Watering 2 (Valve 2)</h3>
      <div className="mb-2">
        Status:&nbsp;
        <span className={data?.b_water2 ? 'text-green-600' : 'text-gray-500'}>
          {data?.b_water2 ? 'OPEN' : 'CLOSED'}
        </span>
      </div>
      <button
        className="btn btn-success mr-2"
        disabled={isLoading || connectionStatus !== 'connected'}
        onClick={() => writeVariable('b_water2', 1)}
      >
        Open Valve 2
      </button>
      <button
        className="btn btn-danger"
        disabled={isLoading || connectionStatus !== 'connected'}
        onClick={() => writeVariable('b_water2', 0)}
      >
        Close Valve 2
      </button>
    </div>
  );
};

export default Watering2;
