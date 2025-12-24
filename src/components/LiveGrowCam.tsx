import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  // kept for compatibility; not used for USB camera
  wsUrl?: string;
}

const LiveGrowCam: React.FC<Props> = ({ wsUrl }) => {
  const [visible, setVisible] = useState(true);
  const [online, setOnline] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;

    async function startCamera() {
      if (!visible) return;

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setOnline(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (!active) {
          // component unmounted before camera started
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // some browsers require play() to be called programmatically
          const playPromise = videoRef.current.play();
          if (playPromise && typeof playPromise.then === 'function') {
            playPromise.catch(() => {});
          }
        }

        setOnline(true);
      } catch (err) {
        console.error('Failed to access camera', err);
        setOnline(false);
      }
    }

    if (visible) {
      startCamera();
    } else {
      // stop camera when hidden
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setOnline(false);
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setOnline(false);
    };
  }, [visible]);

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
            {visible ? (online ? 'Live' : 'No camera') : 'Hidden'}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        {visible ? (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
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
