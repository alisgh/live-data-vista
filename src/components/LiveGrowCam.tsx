
import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LiveGrowCamProps {
  streamUrl?: string;
}

const LiveGrowCam: React.FC<LiveGrowCamProps> = ({ 
  streamUrl = 'http://192.168.0.229:8088/' 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-refresh the stream every 10 seconds to prevent black screen
  useEffect(() => {
    if (isVisible) {
      refreshIntervalRef.current = setInterval(() => {
        console.log('Auto-refreshing camera stream to prevent timeout');
        setRefreshKey(prev => prev + 1);
      }, 10000); // Refresh every 10 seconds
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isVisible && isOnline) {
      // Update the "last updated" timestamp every 2 seconds when visible and online
      interval = setInterval(() => {
        setLastUpdate(new Date());
      }, 2000);
      
      // Set initial timestamp
      setLastUpdate(new Date());
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVisible, isOnline]);

  const handleImageLoad = () => {
    setIsOnline(true);
    console.log('Camera stream loaded successfully');
  };

  const handleImageError = () => {
    setIsOnline(false);
    console.log('Camera stream failed to load, will retry in 10s');
    // Try to refresh after a short delay
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 3000);
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const manualRefresh = () => {
    console.log('Manual refresh triggered');
    setRefreshKey(prev => prev + 1);
  };

  const getStatusText = () => {
    if (!isVisible) return 'Camera hidden';
    if (!isOnline) return 'Camera offline';
    if (lastUpdate) {
      const secondsAgo = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000);
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
              className="text-gray-400 hover:text-green-400 hover:bg-green-400/10 transition-all duration-200 active:scale-95"
              disabled={!isVisible}
            >
              <span className="text-lg">🔄</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleVisibility}
              className="text-gray-400 hover:text-green-400 hover:bg-green-400/10 transition-all duration-200 active:scale-95"
            >
              {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-3 text-sm ${getStatusColor()} transition-colors duration-300`}>
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
              isOnline && isVisible ? 'bg-green-400 shadow-green-400/50 animate-pulse' : 'bg-gray-500'
            }`}></div>
            <span className="font-medium">{getStatusText()}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {isVisible ? (
          <div className="relative group">
            <div className="aspect-video w-full bg-gray-900 rounded-xl overflow-hidden shadow-xl border border-gray-600 transition-all duration-300 group-hover:shadow-2xl group-hover:scale-[1.02]">
              <img
                ref={imgRef}
                src={`${streamUrl}?t=${refreshKey}`}
                alt="Live grow cam feed"
                className="w-full h-full object-cover transition-all duration-300"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              {!isOnline && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm">
                  <div className="text-center space-y-4 animate-fade-in">
                    <div className="p-4 bg-gray-800/50 rounded-full">
                      <Camera className="h-12 w-12 text-gray-500 mx-auto" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Camera offline</p>
                      <p className="text-gray-500 text-xs mt-1">Check connection to {streamUrl}</p>
                    </div>
                    <div className="flex gap-1 justify-center">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="aspect-video w-full bg-gray-900/30 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center transition-all duration-300 hover:bg-gray-900/40">
            <div className="text-center space-y-4 animate-fade-in">
              <div className="p-4 bg-gray-800/30 rounded-full">
                <EyeOff className="h-12 w-12 text-gray-500 mx-auto" />
              </div>
              <div>
                <p className="text-gray-400 text-sm font-medium">Camera hidden</p>
                <p className="text-gray-500 text-xs mt-1">Click the eye icon to show</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveGrowCam;
