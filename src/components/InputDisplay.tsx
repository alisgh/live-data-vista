
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LEDIndicator from './LEDIndicator';

interface InputData {
  name: string;
  value: number;
}

interface InputDisplayProps {
  inputs: InputData[];
}

const InputDisplay: React.FC<InputDisplayProps> = ({ inputs }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Digital Inputs</span>
          <span className="text-sm font-normal text-muted-foreground">
            ({inputs.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {inputs.map((input) => (
            <div
              key={input.name}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <span className="font-mono text-sm">{input.name}</span>
              <LEDIndicator isOn={input.value === 1} color="blue" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default InputDisplay;
