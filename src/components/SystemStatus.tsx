
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Wifi, Database } from 'lucide-react';

interface SystemStatusProps {
  connectionStatus: string;
  lastUpdate: Date | null;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ connectionStatus, lastUpdate }) => {
  const getUptimeDisplay = () => {
    // Mock uptime for demo
    const uptimeHours = 47;
    const uptimeDays = Math.floor(uptimeHours / 24);
    const remainingHours = uptimeHours % 24;
    
    if (uptimeDays > 0) {
      return `${uptimeDays}d ${remainingHours}h`;
    }
    return `${remainingHours}h`;
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
      case 'connecting':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' };
      case 'disconnected':
        return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
      case 'error':
        return { bg: 'bg-red-600/20', text: 'text-red-300', border: 'border-red-600/30' };
      case 'blocked':
        return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' };
    }
  };

  const statusColors = getStatusColor();

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'System Online';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Offline';
      case 'error': return 'System Error';
      case 'blocked': return 'Connection Blocked';
      default: return 'Unknown Status';
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-400">
          <Activity className="h-5 w-5" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Connection Status */}
          <div className={`p-4 rounded-lg border ${statusColors.bg} ${statusColors.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <Wifi className={`h-4 w-4 ${statusColors.text}`} />
              <span className="text-sm text-gray-400">Connection</span>
            </div>
            <div className={`font-semibold ${statusColors.text}`}>
              {getStatusText()}
            </div>
            {connectionStatus === 'connecting' && (
              <div className="mt-2 h-1 bg-gray-600 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 animate-pulse" />
              </div>
            )}
          </div>

          {/* System Uptime */}
          <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-400">Uptime</span>
            </div>
            <div className="font-semibold text-white">
              {getUptimeDisplay()}
            </div>
          </div>

          {/* Last Update */}
          <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-gray-400">Last Update</span>
            </div>
            <div className="font-semibold text-white text-sm">
              {lastUpdate ? lastUpdate.toLocaleTimeString() : 'No updates'}
            </div>
          </div>

          {/* System Health */}
          <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-green-400" />
              <span className="text-sm text-gray-400">Health</span>
            </div>
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'} 
                   className={connectionStatus === 'connected' ? 'bg-green-600 hover:bg-green-700' : ''}>
              {connectionStatus === 'connected' ? 'Healthy' : 'Degraded'}
            </Badge>
          </div>
        </div>

        {/* Additional System Info */}
        <div className="mt-6 p-4 bg-gray-700/20 rounded-lg border border-gray-600/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">PLC Model:</span>
              <span className="ml-2 text-white">GrowBox Pro v2.1</span>
            </div>
            <div>
              <span className="text-gray-400">Firmware:</span>
              <span className="ml-2 text-white">v1.4.2</span>
            </div>
            <div>
              <span className="text-gray-400">Last Maintenance:</span>
              <span className="ml-2 text-white">3 days ago</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemStatus;
