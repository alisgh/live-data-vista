
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Lightbulb, Wind } from 'lucide-react';

interface OutputData {
  name: string;
  value: number;
}

interface EnvironmentControlsProps {
  outputs: OutputData[];
  onToggleControl: (name: string, currentValue: number) => void;
  connectionStatus: string;
}

const EnvironmentControls: React.FC<EnvironmentControlsProps> = ({ 
  outputs, 
  onToggleControl, 
  connectionStatus 
}) => {
  const isConnected = connectionStatus === 'connected';

  const getGrowLight = () => {
    return outputs.find(output => 
      output.name.toLowerCase().includes('light') || 
      output.name.toLowerCase().includes('growlight')
    ) || { name: 'GrowLight', value: 1 };
  };

  const getVentilation = () => {
    return outputs.find(output => 
      output.name.toLowerCase().includes('vent') || 
      output.name.toLowerCase().includes('fan')
    ) || { name: 'Ventilation', value: 1 };
  };

  const growLight = getGrowLight();
  const ventilation = getVentilation();

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-400">
          <Wind className="h-5 w-5" />
          Environment Controls
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Grow Light Control */}
          <div className="p-6 bg-gray-700/30 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${growLight.value === 1 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-600 text-gray-400'}`}>
                  <Lightbulb className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Grow Light</h3>
                  <p className="text-sm text-gray-400">
                    Full spectrum LED lighting
                  </p>
                </div>
              </div>
              <Switch
                checked={growLight.value === 1}
                onCheckedChange={() => onToggleControl(growLight.name, growLight.value)}
                disabled={!isConnected}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Status:</span>
              <span className={`font-medium ${growLight.value === 1 ? 'text-green-400' : 'text-gray-400'}`}>
                {growLight.value === 1 ? 'ON' : 'OFF'}
              </span>
            </div>
            {growLight.value === 1 && (
              <div className="mt-2 h-1 bg-yellow-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 animate-pulse" />
              </div>
            )}
          </div>

          {/* Ventilation Control */}
          <div className="p-6 bg-gray-700/30 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${ventilation.value === 1 ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-600 text-gray-400'}`}>
                  <Wind className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Ventilation</h3>
                  <p className="text-sm text-gray-400">
                    Air circulation & exhaust
                  </p>
                </div>
              </div>
              <Switch
                checked={ventilation.value === 1}
                onCheckedChange={() => onToggleControl(ventilation.name, ventilation.value)}
                disabled={!isConnected}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Status:</span>
              <span className={`font-medium ${ventilation.value === 1 ? 'text-green-400' : 'text-gray-400'}`}>
                {ventilation.value === 1 ? 'ON' : 'OFF'}
              </span>
            </div>
            {ventilation.value === 1 && (
              <div className="mt-2 flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-1 bg-blue-400 rounded-full flex-1 animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {!isConnected && (
          <div className="mt-6 p-4 bg-orange-900/20 border border-orange-600/30 rounded-lg">
            <p className="text-sm text-orange-300 text-center">
              🔌 Connect to WebSocket to control environment systems
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnvironmentControls;
