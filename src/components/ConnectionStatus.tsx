
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'blocked';
  onReconnect: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status, onReconnect }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
      case 'error':
        return 'bg-red-600';
      case 'blocked':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      case 'blocked':
        return 'Connection Blocked';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} ${status === 'connecting' ? 'animate-pulse' : ''}`} />
        <Badge variant={status === 'connected' ? 'default' : 'secondary'}>
          {getStatusText()}
        </Badge>
      </div>
      {status === 'blocked' && (
        <div className="text-xs text-orange-600 max-w-xs">
          HTTPS → WS blocked by browser
        </div>
      )}
      {(status === 'disconnected' || status === 'error') && (
        <Button onClick={onReconnect} size="sm" variant="outline">
          Reconnect
        </Button>
      )}
    </div>
  );
};

export default ConnectionStatus;
