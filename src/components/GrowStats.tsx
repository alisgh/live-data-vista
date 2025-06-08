
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Thermometer, Droplets } from 'lucide-react';

interface GrowStatsProps {
  data: {
    inputs?: Array<{ name: string; value: number }>;
    analog?: Array<{ name: string; value: number }>;
  };
}

const GrowStats: React.FC<GrowStatsProps> = ({ data }) => {
  // Extract temperature and humidity from either inputs or analog data
  const getTemperature = () => {
    const tempFromInputs = data.inputs?.find(item => item.name.toLowerCase().includes('temperature'));
    const tempFromAnalog = data.analog?.find(item => item.name.toLowerCase().includes('temperature'));
    
    if (tempFromInputs) return tempFromInputs.value;
    if (tempFromAnalog) return tempFromAnalog.value / 10; // Assuming analog is in tenths
    return 24.5; // Default
  };

  const getHumidity = () => {
    const humidityFromInputs = data.inputs?.find(item => item.name.toLowerCase().includes('humidity'));
    const humidityFromAnalog = data.analog?.find(item => item.name.toLowerCase().includes('humidity'));
    
    if (humidityFromInputs) return humidityFromInputs.value;
    if (humidityFromAnalog) return humidityFromAnalog.value / 10; // Assuming analog is in tenths
    return 65; // Default
  };

  const temperature = getTemperature();
  const humidity = getHumidity();

  const getTempColor = () => {
    if (temperature < 18) return 'bg-blue-500';
    if (temperature < 22) return 'bg-green-500';
    if (temperature < 28) return 'bg-green-400';
    if (temperature < 32) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getHumidityColor = () => {
    if (humidity < 40) return 'bg-red-500';
    if (humidity < 60) return 'bg-yellow-500';
    if (humidity < 80) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const tempStatus = temperature >= 20 && temperature <= 30 ? 'Optimal' : 
                   temperature < 20 ? 'Too Cold' : 'Too Hot';
  
  const humidityStatus = humidity >= 50 && humidity <= 70 ? 'Optimal' : 
                        humidity < 50 ? 'Too Dry' : 'Too Humid';

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-400">
          <Thermometer className="h-5 w-5" />
          Environmental Conditions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Temperature */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-orange-400" />
              <span className="text-sm text-gray-400">Temperature</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{temperature.toFixed(1)}°C</div>
              <div className={`text-xs ${tempStatus === 'Optimal' ? 'text-green-400' : 'text-yellow-400'}`}>
                {tempStatus}
              </div>
            </div>
          </div>
          <div className="relative">
            <Progress 
              value={Math.min((temperature / 40) * 100, 100)} 
              className="h-2"
            />
            <div className={`absolute inset-0 rounded-full ${getTempColor()}`} 
                 style={{ width: `${Math.min((temperature / 40) * 100, 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0°C</span>
            <span>Ideal: 20-30°C</span>
            <span>40°C</span>
          </div>
        </div>

        {/* Humidity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-400">Humidity</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{humidity.toFixed(0)}%</div>
              <div className={`text-xs ${humidityStatus === 'Optimal' ? 'text-green-400' : 'text-yellow-400'}`}>
                {humidityStatus}
              </div>
            </div>
          </div>
          <div className="relative">
            <Progress 
              value={humidity} 
              className="h-2"
            />
            <div className={`absolute inset-0 rounded-full ${getHumidityColor()}`} 
                 style={{ width: `${Math.min(humidity, 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>Ideal: 50-70%</span>
            <span>100%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GrowStats;
