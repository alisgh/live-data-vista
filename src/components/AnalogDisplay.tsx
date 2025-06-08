
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AnalogGauge from './AnalogGauge';

interface AnalogData {
  name: string;
  value: number;
}

interface AnalogDisplayProps {
  analog: AnalogData[];
}

const AnalogDisplay: React.FC<AnalogDisplayProps> = ({ analog }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Analog Inputs</span>
          <span className="text-sm font-normal text-muted-foreground">
            ({analog.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analog.map((item) => (
            <AnalogGauge
              key={item.name}
              name={item.name}
              value={item.value}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalogDisplay;
