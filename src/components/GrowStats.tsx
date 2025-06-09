
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Thermometer, Droplets, AlertTriangle } from 'lucide-react';

interface GrowStatsProps {
  data: {
    temp1?: number;
    humidity1?: number;
  } | null;
}

const GrowStats: React.FC<GrowStatsProps> = ({ data }) => {
  const temperature = data?.temp1 ?? 24.5;
  const humidity = data?.humidity1 ?? 65;

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

  const isOutOfRange = tempStatus !== 'Optimal' || humidityStatus !== 'Optimal';

  return (
    <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/60 transition-all duration-300 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-green-400">
          <div className="p-2 bg-green-400/10 rounded-lg">
            <Thermometer className="h-5 w-5" />
          </div>
          Environmental Conditions
          {isOutOfRange && (
            <div className="flex items-center gap-1 text-orange-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">Alert</span>
            </div>
          )}
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
              <div className={`text-xs font-medium transition-colors duration-200 ${
                tempStatus === 'Optimal' ? 'text-green-400' : 'text-orange-400'
              }`}>
                {tempStatus}
              </div>
            </div>
          </div>
          <div className="relative">
            <Progress 
              value={Math.min((temperature / 40) * 100, 100)} 
              className="h-3 bg-gray-700"
            />
            <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${getTempColor()}`} 
                 style={{ width: `${Math.min((temperature / 40) * 100, 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0°C</span>
            <span className="text-green-400 font-medium">Ideal: 20-30°C</span>
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
              <div className={`text-xs font-medium transition-colors duration-200 ${
                humidityStatus === 'Optimal' ? 'text-green-400' : 'text-orange-400'
              }`}>
                {humidityStatus}
              </div>
            </div>
          </div>
          <div className="relative">
            <Progress 
              value={humidity} 
              className="h-3 bg-gray-700"
            />
            <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${getHumidityColor()}`} 
                 style={{ width: `${Math.min(humidity, 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span className="text-green-400 font-medium">Ideal: 50-70%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Live Data Indicator */}
        <div className="pt-4 border-t border-gray-700">
          <div className="flex items-center justify-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              data ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
            }`} />
            <span className="text-gray-400">
              {data ? 'Live data from PLC' : 'Demo data'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GrowStats;
