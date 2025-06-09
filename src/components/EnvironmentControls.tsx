
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Lightbulb, Wind, Settings } from 'lucide-react';

interface PLCData {
  light1: number;
  vent1: number;
  temp1: number;
  humidity1: number;
}

interface EnvironmentControlsProps {
  data: PLCData | null;
  onToggleControl: (control: 'light1' | 'vent1', currentValue: number) => void;
  connectionStatus: string;
}

const EnvironmentControls: React.FC<EnvironmentControlsProps> = ({ 
  data, 
  onToggleControl, 
  connectionStatus 
}) => {
  const isConnected = connectionStatus === 'connected';
  
  const light1Value = data?.light1 ?? 0;
  const vent1Value = data?.vent1 ?? 0;

  return (
    <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/60 transition-all duration-300 backdrop-blur-sm">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-green-400">
          <div className="p-2 bg-green-400/10 rounded-lg">
            <Settings className="h-5 w-5" />
          </div>
          Environment Controls
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grow Light Control */}
          <div className="group p-6 bg-gray-700/30 rounded-xl border border-gray-600 transition-all duration-300 hover:bg-gray-700/50 hover:border-gray-500 hover:scale-[1.02] active:scale-[0.98]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-all duration-300 ${
                  light1Value === 1 
                    ? 'bg-yellow-500/20 text-yellow-400 shadow-yellow-400/20 shadow-lg' 
                    : 'bg-gray-600/50 text-gray-400'
                }`}>
                  <Lightbulb className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">Grow Light</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    PLC Output: light1
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Switch
                  checked={light1Value === 1}
                  onCheckedChange={() => onToggleControl('light1', light1Value)}
                  disabled={!isConnected}
                  className="data-[state=checked]:bg-green-600 transition-all duration-200 scale-125"
                />
                <span className={`text-xs font-medium transition-colors duration-200 ${
                  !isConnected ? 'text-gray-500' : light1Value === 1 ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {isConnected ? (light1Value === 1 ? 'ON' : 'OFF') : 'OFFLINE'}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Power Status:</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    light1Value === 1 ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                  }`} />
                  <span className={`font-medium ${light1Value === 1 ? 'text-green-400' : 'text-gray-400'}`}>
                    {light1Value === 1 ? 'Active' : 'Standby'}
                  </span>
                </div>
              </div>
              
              {light1Value === 1 && (
                <div className="mt-4">
                  <div className="h-2 bg-yellow-500/20 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 animate-pulse rounded-full" />
                  </div>
                  <p className="text-xs text-yellow-400 mt-2 text-center">Illuminating</p>
                </div>
              )}
            </div>
          </div>

          {/* Ventilation Control */}
          <div className="group p-6 bg-gray-700/30 rounded-xl border border-gray-600 transition-all duration-300 hover:bg-gray-700/50 hover:border-gray-500 hover:scale-[1.02] active:scale-[0.98]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-all duration-300 ${
                  vent1Value === 1 
                    ? 'bg-blue-500/20 text-blue-400 shadow-blue-400/20 shadow-lg' 
                    : 'bg-gray-600/50 text-gray-400'
                }`}>
                  <Wind className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">Ventilation</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    PLC Output: vent1
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Switch
                  checked={vent1Value === 1}
                  onCheckedChange={() => onToggleControl('vent1', vent1Value)}
                  disabled={!isConnected}
                  className="data-[state=checked]:bg-green-600 transition-all duration-200 scale-125"
                />
                <span className={`text-xs font-medium transition-colors duration-200 ${
                  !isConnected ? 'text-gray-500' : vent1Value === 1 ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {isConnected ? (vent1Value === 1 ? 'ON' : 'OFF') : 'OFFLINE'}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Fan Status:</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    vent1Value === 1 ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                  }`} />
                  <span className={`font-medium ${vent1Value === 1 ? 'text-green-400' : 'text-gray-400'}`}>
                    {vent1Value === 1 ? 'Running' : 'Stopped'}
                  </span>
                </div>
              </div>
              
              {vent1Value === 1 && (
                <div className="mt-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="h-2 bg-blue-400 rounded-full flex-1 animate-pulse transition-all duration-300"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-blue-400 mt-2 text-center">Circulating air</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {!isConnected && (
          <div className="mt-8 p-6 bg-orange-900/20 border border-orange-600/30 rounded-xl backdrop-blur-sm animate-fade-in">
            <div className="flex items-center gap-3 justify-center">
              <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center">
                <span className="text-orange-400 text-sm">🔌</span>
              </div>
              <p className="text-sm text-orange-300 font-medium">
                Connect to PLC WebSocket to control environment systems
              </p>
            </div>
          </div>
        )}

        {/* Real-time Data Status */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                data ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
              }`} />
              <span>{data ? 'Real-time PLC data' : 'Demo mode'}</span>
            </div>
            <div className="flex gap-4">
              <span>Light1: {light1Value}</span>
              <span>Vent1: {vent1Value}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnvironmentControls;
