import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketData {
  light1: number;
  vent1: number;
  temp1: number;
  humidity1: number;
}

interface UseWebSocketReturn {
  data: WebSocketData | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' | 'blocked';
  sendMessage: (message: any) => void;
  reconnect: () => void;
  writeVariable: (name: string, value: number) => void;
}

export const useWebSocket = (url: string): UseWebSocketReturn => {
  const [data, setData] = useState<WebSocketData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error' | 'blocked'>('connecting');
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Check if we've exceeded max attempts
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      setConnectionStatus('error');
      return;
    }

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
      
      // Close existing connection if any
      if (ws.current) {
        ws.current.close();
      }
      
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('WebSocket connected to PLC server');
        setConnectionStatus('connected');
        reconnectAttempts.current = 0; // Reset attempts on successful connection
      };

      ws.current.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          console.log('Received PLC data:', parsedData);
          setData(parsedData);
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        setConnectionStatus('disconnected');
        
        // Only auto-reconnect if it wasn't a manual close and we haven't exceeded attempts
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000); // Exponential backoff
          console.log(`Attempting reconnection ${reconnectAttempts.current}/${maxReconnectAttempts} in ${delay}ms`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
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
  }, [url]);

  const sendMessage = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      console.log('Sent WebSocket message:', message);
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }, []);

  const writeVariable = useCallback((name: string, value: number) => {
    const command = {
      type: 'write',
      name,
      value
    };
    sendMessage(command);
    console.log(`Writing variable ${name} = ${value}`);
  }, [sendMessage]);

  const reconnect = useCallback(() => {
    console.log('Manual reconnection initiated');
    reconnectAttempts.current = 0; // Reset attempts for manual reconnection
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
    writeVariable,
  };
};
