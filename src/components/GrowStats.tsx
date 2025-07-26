import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Thermometer, AlertTriangle, Lightbulb } from 'lucide-react';

interface GrowStatsProps {
  data: {
    halogenLight?: number;
    haloTemp?: number;
    ambientTemp?: number;
  } | null;
}

const GrowStats: React.FC<GrowStatsProps> = ({ data }) => {
  const halogenOn = data?.halogenLight === 1;
  const haloTemp = data?.haloTemp ?? 26.5;
  const ambientTemp = data?.ambientTemp ?? 27;

  const getTempColor = (temp: number) => {
    if (temp < 18) return 'bg-blue-500';
    if (temp < 22) return 'bg-green-500';
    if (temp < 28) return 'bg-green-400';
    if (temp < 32) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTempStatus = (temp: number) => {
    if (temp >= 20 && temp <= 30) return 'Optimal';
    if (temp < 20) return 'Too Cold';
    return 'Too Hot';
  };

  const haloStatus = getTempStatus(haloTemp);
  const ambientStatus = getTempStatus(ambientTemp);

  const isOutOfRange = haloStatus !== 'Optimal' || ambientStatus !== 'Optimal';

  return (
    <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/60 transition-all duration-300 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-green-400">
          <div className="p-2 bg-green-400/10 rounded-lg">
            <Thermometer className="h-5 w-5" />
          </div>
          Growbox Conditions
          {isOutOfRange && (
            <div className="flex items-center gap-1 text-orange-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">Alert</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Halogen Light */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className={`h-4 w-4 ${halogenOn ? 'text-yellow-400' : 'text-gray-500'}`} />
            <span className="text-sm text-gray-400">Halogen Light</span>
          </div>
          <div className={`text-sm font-medium ${halogenOn ? 'text-yellow-400' : 'text-gray-500'}`}>
            {halogenOn ? 'ON' : 'OFF'}
          </div>
        </div>

        {/* Halogen Temperature */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-orange-400" />
              <span className="text-sm text-gray-400">Halogen Temp</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{haloTemp.toFixed(1)}°C</div>
              <div className={`text-xs font-medium transition-colors duration-200 ${
                haloStatus === 'Optimal' ? 'text-green-400' : 'text-orange-400'
              }`}>
                {haloStatus}
              </div>
            </div>
          </div>
          <div className="relative">
            <Progress 
              value={Math.min((haloTemp / 40) * 100, 100)} 
              className="h-3 bg-gray-700"
            />
            <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${getTempColor(haloTemp)}`} 
                 style={{ width: `${Math.min((haloTemp / 40) * 100, 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0°C</span>
            <span className="text-green-400 font-medium">Ideal: 20-30°C</span>
            <span>40°C</span>
          </div>
        </div>

        {/* Ambient Temperature */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-400">Growbox Temp</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{ambientTemp.toFixed(1)}°C</div>
              <div className={`text-xs font-medium transition-colors duration-200 ${
                ambientStatus === 'Optimal' ? 'text-green-400' : 'text-orange-400'
              }`}>
                {ambientStatus}
              </div>
            </div>
          </div>
          <div className="relative">
            <Progress 
              value={Math.min((ambientTemp / 40) * 100, 100)} 
              className="h-3 bg-gray-700"
            />
            <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${getTempColor(ambientTemp)}`} 
                 style={{ width: `${Math.min((ambientTemp / 40) * 100, 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0°C</span>
            <span className="text-green-400 font-medium">Ideal: 20-30°C</span>
            <span>40°C</span>
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
