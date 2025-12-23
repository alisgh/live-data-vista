import React, { useState } from 'react';
import { Eye, EyeOff, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LiveGrowCamProps {
  streamUrl?: string;
}

const LiveGrowCam: React.FC<LiveGrowCamProps> = ({
  streamUrl = 'http://192.168.0.135:8087/stream'
}) => {
  const [visible, setVisible] = useState(true);
  const [online, setOnline] = useState(false);

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Camera className="w-5 h-5" />
            Live Grow Cam
          </CardTitle>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setVisible(v => !v)}
          >
            {visible ? <Eye /> : <EyeOff />}
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span
            className={`w-3 h-3 rounded-full ${
              online && visible ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
            }`}
          />
          <span className={online ? 'text-green-400' : 'text-red-400'}>
            {visible ? (online ? 'Live' : 'Offline') : 'Hidden'}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        {visible ? (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <img
              src={streamUrl}
              className="w-full h-full object-cover"
              onLoad={() => setOnline(true)}
              onError={() => setOnline(false)}
            />
          </div>
        ) : (
          <div className="aspect-video flex items-center justify-center border border-dashed border-gray-600 rounded-lg">
            <EyeOff className="text-gray-500" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveGrowCam;
