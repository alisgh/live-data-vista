import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  wsUrl?: string;
}

const LiveGrowCam: React.FC<Props> = ({
  wsUrl = 'ws://192.168.0.158:8090'
}) => {
  const [visible, setVisible] = useState(true);
  const [online, setOnline] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const lastUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!visible) return;

    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => setOnline(true);
    ws.onclose = () => setOnline(false);
    ws.onerror = () => setOnline(false);

    ws.onmessage = event => {
      const blob = new Blob([event.data], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);

      if (imgRef.current) {
        imgRef.current.src = url;
      }

      if (lastUrlRef.current) {
        URL.revokeObjectURL(lastUrlRef.current);
      }

      lastUrlRef.current = url;
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [visible, wsUrl]);

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex gap-2 items-center text-green-400">
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
              ref={imgRef}
              className="w-full h-full object-cover"
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
