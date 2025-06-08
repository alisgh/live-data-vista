
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
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isVisible) {
      // Update the "last updated" timestamp every 2 seconds when visible
      interval = setInterval(() => {
        setLastUpdate(new Date());
      }, 2000);
      
      // Set initial timestamp
      setLastUpdate(new Date());
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVisible]);

  const handleImageLoad = () => {
    setIsOnline(true);
    console.log('Camera stream loaded successfully');
  };

  const handleImageError = () => {
    setIsOnline(false);
    console.log('Camera stream failed to load');
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const getStatusText = () => {
    if (!isVisible) return 'Camera hidden';
    if (!isOnline) return 'Camera offline';
    if (lastUpdate) {
      const secondsAgo = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000);
      return `Last updated ${secondsAgo}s ago`;
    }
    return 'Connecting...';
  };

  const getStatusColor = () => {
    if (!isVisible) return 'text-gray-400';
    if (!isOnline) return 'text-red-400';
    return 'text-green-400';
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-green-400 flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Live Grow Cam
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleVisibility}
            className="text-gray-400 hover:text-green-400 hover:bg-green-400/10"
          >
            {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 text-sm ${getStatusColor()}`}>
            <div className={`w-2 h-2 rounded-full ${isOnline && isVisible ? 'bg-green-400 pulse-green' : 'bg-gray-500'}`}></div>
            {getStatusText()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isVisible ? (
          <div className="relative">
            <div className="aspect-video w-full bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-600">
              <img
                ref={imgRef}
                src={streamUrl}
                alt="Live grow cam feed"
                className="w-full h-full object-cover"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              {!isOnline && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                  <div className="text-center space-y-2">
                    <Camera className="h-12 w-12 text-gray-500 mx-auto" />
                    <p className="text-gray-400 text-sm">Camera offline</p>
                    <p className="text-gray-500 text-xs">Check connection to {streamUrl}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="aspect-video w-full bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
            <div className="text-center space-y-2">
              <EyeOff className="h-12 w-12 text-gray-500 mx-auto" />
              <p className="text-gray-400 text-sm">Camera hidden</p>
              <p className="text-gray-500 text-xs">Click the eye icon to show</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveGrowCam;
