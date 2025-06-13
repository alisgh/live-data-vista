
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Lightbulb, Wind, Settings } from 'lucide-react';

interface PLCData {
  light1: number;
  light2: number;
  vent1: number;
  vent2: number;
  temp1: number;
  humidity1: number;
}

interface EnvironmentControlsProps {
  data: PLCData | null;
  onToggleControl: (control: 'light1' | 'light2' | 'vent1' | 'vent2', currentValue: number) => void;
  connectionStatus: string;
}

const EnvironmentControls: React.FC<EnvironmentControlsProps> = ({ 
  data, 
  onToggleControl, 
  connectionStatus 
}) => {
  const isConnected = connectionStatus === 'connected';
  
  const light1Value = data?.light1 ?? 0;
  const light2Value = data?.light2 ?? 0;
  const vent1Value = data?.vent1 ?? 0;
  const vent2Value = data?.vent2 ?? 0;

  const ControlCard = ({ 
    title, 
    variable, 
    value, 
    icon: Icon, 
    activeColor, 
    description 
  }: {
    title: string;
    variable: 'light1' | 'light2' | 'vent1' | 'vent2';
    value: number;
    icon: typeof Lightbulb;
    activeColor: string;
    description: string;
  }) => (
    <div className="group p-6 bg-gray-700/30 rounded-xl border border-gray-600 transition-all duration-300 hover:bg-gray-700/50 hover:border-gray-500 hover:scale-[1.02] active:scale-[0.98]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl transition-all duration-300 ${
            value === 1 
              ? `${activeColor} shadow-lg` 
              : 'bg-gray-600/50 text-gray-400'
          }`}>
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">{title}</h3>
            <p className="text-sm text-gray-400 mt-1">
              PLC Output: {variable}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Switch
            checked={value === 1}
            onCheckedChange={() => onToggleControl(variable, value)}
            disabled={!isConnected}
            className="data-[state=checked]:bg-green-600 transition-all duration-200 scale-125"
          />
          <span className={`text-xs font-medium transition-colors duration-200 ${
            !isConnected ? 'text-gray-500' : value === 1 ? 'text-green-400' : 'text-gray-400'
          }`}>
            {isConnected ? (value === 1 ? 'ON' : 'OFF') : 'OFFLINE'}
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Status:</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              value === 1 ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
            }`} />
            <span className={`font-medium ${value === 1 ? 'text-green-400' : 'text-gray-400'}`}>
              {description}
            </span>
          </div>
        </div>
        
        {value === 1 && (
          <div className="mt-4">
            <div className={`h-2 rounded-full overflow-hidden ${
              variable.includes('light') ? 'bg-yellow-500/20' : 'bg-blue-500/20'
            }`}>
              <div className={`h-full animate-pulse rounded-full ${
                variable.includes('light') ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-blue-400'
              }`} />
            </div>
            <p className={`text-xs mt-2 text-center ${
              variable.includes('light') ? 'text-yellow-400' : 'text-blue-400'
            }`}>
              {variable.includes('light') ? 'Illuminating' : 'Running'}
            </p>
          </div>
        )}
      </div>
    </div>
  );

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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          <ControlCard
            title="Light 1"
            variable="light1"
            value={light1Value}
            icon={Lightbulb}
            activeColor="bg-yellow-500/20 text-yellow-400 shadow-yellow-400/20"
            description={light1Value === 1 ? 'Active' : 'Standby'}
          />
          
          <ControlCard
            title="Light 2"
            variable="light2"
            value={light2Value}
            icon={Lightbulb}
            activeColor="bg-yellow-500/20 text-yellow-400 shadow-yellow-400/20"
            description={light2Value === 1 ? 'Active' : 'Standby'}
          />
          
          <ControlCard
            title="Vent 1"
            variable="vent1"
            value={vent1Value}
            icon={Wind}
            activeColor="bg-blue-500/20 text-blue-400 shadow-blue-400/20"
            description={vent1Value === 1 ? 'Running' : 'Stopped'}
          />
          
          <ControlCard
            title="Vent 2"
            variable="vent2"
            value={vent2Value}
            icon={Wind}
            activeColor="bg-blue-500/20 text-blue-400 shadow-blue-400/20"
            description={vent2Value === 1 ? 'Running' : 'Stopped'}
          />
        </div>

        {!isConnected && (
          <div className="mt-8 p-6 bg-orange-900/20 border border-orange-600/30 rounded-xl backdrop-blur-sm animate-fade-in">
            <div className="flex items-center gap-3 justify-center">
              <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center">
                <span className="text-orange-400 text-sm">🔌</span>
              </div>
              <p className="text-sm text-orange-300 font-medium">
                Connect to PLC to control environment systems
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
              <span>L1: {light1Value}</span>
              <span>L2: {light2Value}</span>
              <span>V1: {vent1Value}</span>
              <span>V2: {vent2Value}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnvironmentControls;
