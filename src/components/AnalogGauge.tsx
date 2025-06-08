
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface AnalogGaugeProps {
  name: string;
  value: number;
  min?: number;
  max?: number;
}

const AnalogGauge: React.FC<AnalogGaugeProps> = ({ 
  name, 
  value, 
  min = 0, 
  max = 1023 
}) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  const getBarColor = () => {
    if (percentage < 30) return 'bg-green-500';
    if (percentage < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">{name}</span>
        <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
          {value}
        </span>
      </div>
      <Progress value={percentage} className="h-3" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}</span>
        <span>{Math.round(percentage)}%</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export default AnalogGauge;
