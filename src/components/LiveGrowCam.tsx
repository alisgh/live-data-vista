import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LiveGrowCamProps {
  streamUrl?: string;
}

const LiveGrowCam: React.FC<LiveGrowCamProps> = ({
  streamUrl = 'http://192.168.0.158:8088/'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVisible && isOnline) {
      interval = setInterval(() => {
        setLastUpdate(new Date());
      }, 2000);
      setLastUpdate(new Date());
    }
    return () => clearInterval(interval);
  }, [isVisible, isOnline]);

  const handleImageLoad = () => {
    setIsOnline(true);
  };

  const handleImageError = () => {
    setIsOnline(false);
    setTimeout(() => setRefreshKey(prev => prev + 1), 3000);
  };

  const toggleVisibility = () => {
    setIsVisible(prev => !prev);
  };

  const manualRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getStatusText = () => {
    if (!isVisible) return 'Camera hidden';
    if (!isOnline) return 'Camera offline';
    if (lastUpdate) {
      const secondsAgo = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
      return `Live • ${secondsAgo}s ago`;
    }
    return 'Connecting...';
  };

  const getStatusColor = () => {
    if (!isVisible) return 'text-gray-400';
    if (!isOnline) return 'text-red-400';
    return 'text-green-400';
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/60 transition-all duration-300 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-green-400 flex items-center gap-3">
            <div className="p-2 bg-green-400/10 rounded-lg">
              <Camera className="h-5 w-5" />
            </div>
            Live Grow Cam
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={manualRefresh}
              className="text-gray-400 hover:text-green-400 hover:bg-green-400/10 active:scale-95"
              disabled={!isVisible}
            >
              <span className="text-lg">🔄</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleVisibility}
              className="text-gray-400 hover:text-green-400 hover:bg-green-400/10 active:scale-95"
            >
              {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className={`flex items-center gap-3 text-sm ${getStatusColor()}`}>
          <div className={`w-3 h-3 rounded-full ${isOnline && isVisible ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
          <span>{getStatusText()}</span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isVisible ? (
          <div className="relative group">
            <div className="aspect-video w-full bg-black rounded-xl overflow-hidden border border-gray-600">
              <img
                ref={imgRef}
                src={`${streamUrl}stream`}
                alt="Live grow cam feed"
                className="w-full h-full object-cover"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              {!isOnline && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-center space-y-4">
                    <Camera className="w-12 h-12 text-gray-500 mx-auto" />
                    <p className="text-gray-400">Camera offline</p>
                    <p className="text-gray-600 text-sm">{streamUrl}</p>
                    <div className="flex gap-1 justify-center">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="aspect-video w-full bg-gray-900/30 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center">
            <EyeOff className="w-10 h-10 text-gray-500" />
            <p className="text-gray-400 text-sm mt-2">Camera hidden</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveGrowCam;
