
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Wifi, WifiOff } from 'lucide-react';

interface PLCConfigProps {
  currentIp: string;
  onIpChange: (ip: string) => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  onTestConnection: () => void;
}

const PLCConfig: React.FC<PLCConfigProps> = ({ 
  currentIp, 
  onIpChange, 
  connectionStatus,
  onTestConnection 
}) => {
  const [inputIp, setInputIp] = useState(currentIp);

  const handleSave = () => {
    if (inputIp.trim()) {
      onIpChange(inputIp.trim());
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-600';
      case 'connecting':
        return 'bg-yellow-600';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Error';
      default:
        return 'Disconnected';
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-400">
          <Settings className="h-5 w-5" />
          PLC Configuration
          <Badge className={`ml-auto ${getStatusColor()}`}>
            <div className="flex items-center gap-1">
              {connectionStatus === 'connected' ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {getStatusText()}
            </div>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              Controller IP Address
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={inputIp}
                onChange={(e) => setInputIp(e.target.value)}
                placeholder="192.168.0.213"
                className="bg-gray-700 border-gray-600 text-white"
              />
              <Button 
                onClick={handleSave}
                variant="outline"
                className="border-green-600 text-green-400 hover:bg-green-600/20"
              >
                Apply
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-gray-700">
            <div className="text-sm text-gray-400">
              Current: <span className="text-white font-mono">{currentIp || 'Not set'}</span>
            </div>
            <Button 
              onClick={onTestConnection}
              size="sm"
              variant="outline"
              disabled={!currentIp || connectionStatus === 'connecting'}
              className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
            >
              Test Connection
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PLCConfig;
