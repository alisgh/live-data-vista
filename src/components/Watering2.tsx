import React from 'react';
import { usePLCDirect } from '@/hooks/usePLCDirect';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

const Watering2: React.FC = () => {
  const { writeVariable, data, isLoading, connectionStatus } = usePLCDirect();

  const isOpen = !!data?.b_water2;

  return (
    <Card className="max-w-sm mx-auto my-4">
      <CardHeader>
        <CardTitle>Watering 2 (Valve 2)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium">Status:</span>
          <span className={isOpen ? 'text-green-600 font-semibold' : 'text-gray-500'}>
            {isOpen ? 'OPEN' : 'CLOSED'}
          </span>
          <span
            className={`ml-2 h-3 w-3 rounded-full ${
              isOpen ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="default"
          disabled={isLoading || connectionStatus !== 'connected' || isOpen}
          onClick={() => writeVariable('b_water2', 1)}
        >
          Open Valve
        </Button>
        <Button
          variant="destructive"
          disabled={isLoading || connectionStatus !== 'connected' || !isOpen}
          onClick={() => writeVariable('b_water2', 0)}
        >
          Close Valve
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Watering2;
