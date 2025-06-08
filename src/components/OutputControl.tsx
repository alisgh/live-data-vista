
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LEDIndicator from './LEDIndicator';

interface OutputData {
  name: string;
  value: number;
}

interface OutputControlProps {
  outputs: OutputData[];
  onToggleOutput: (name: string, currentValue: number) => void;
  connectionStatus: string;
}

const OutputControl: React.FC<OutputControlProps> = ({ 
  outputs, 
  onToggleOutput, 
  connectionStatus 
}) => {
  const isConnected = connectionStatus === 'connected';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Digital Outputs</span>
          <span className="text-sm font-normal text-muted-foreground">
            ({outputs.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {outputs.map((output) => (
            <div
              key={output.name}
              className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <LEDIndicator isOn={output.value === 1} color="green" size="lg" />
                <span className="font-mono text-sm font-medium">{output.name}</span>
              </div>
              <Button
                onClick={() => onToggleOutput(output.name, output.value)}
                disabled={!isConnected}
                variant={output.value === 1 ? "default" : "outline"}
                size="sm"
              >
                {output.value === 1 ? 'ON' : 'OFF'}
              </Button>
            </div>
          ))}
        </div>
        {!isConnected && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Connect to WebSocket to control outputs
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default OutputControl;
