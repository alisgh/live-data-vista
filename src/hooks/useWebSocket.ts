
import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketData {
  inputs: Array<{ name: string; value: number }>;
  analog: Array<{ name: string; value: number }>;
  outputs: Array<{ name: string; value: number }>;
}

interface UseWebSocketReturn {
  data: WebSocketData | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' | 'blocked';
  sendMessage: (message: any) => void;
  reconnect: () => void;
}

export const useWebSocket = (url: string): UseWebSocketReturn => {
  const [data, setData] = useState<WebSocketData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error' | 'blocked'>('connecting');
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      setConnectionStatus('connecting');
      
      // Check if we're on HTTPS and trying to connect to ws://
      const isSecurePage = window.location.protocol === 'https:';
      const isInsecureWebSocket = url.startsWith('ws://');
      
      if (isSecurePage && isInsecureWebSocket) {
        console.warn('Cannot connect to insecure WebSocket from HTTPS page');
        setConnectionStatus('blocked');
        return;
      }
      
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
      };

      ws.current.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          setData(parsedData);
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        
        // Auto-reconnect after 3 seconds only if not blocked
        if (connectionStatus !== 'blocked') {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      
      // Check if it's a security error
      if (error instanceof Error && error.name === 'SecurityError') {
        setConnectionStatus('blocked');
      } else {
        setConnectionStatus('error');
      }
    }
  }, [url, connectionStatus]);

  const sendMessage = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  const reconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
    }
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return {
    data,
    connectionStatus,
    sendMessage,
    reconnect,
  };
};
