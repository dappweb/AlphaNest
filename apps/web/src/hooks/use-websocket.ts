'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  channel?: string;
  data?: unknown;
}

interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  send: (message: WebSocketMessage) => void;
}

export function useWebSocket({
  url,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  reconnectInterval = 5000,
  maxReconnectAttempts = 2, // 减少重试次数
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttemptsRef = useRef(0);
  const subscribedChannelsRef = useRef<Set<string>>(new Set());
  const [isEnabled, setIsEnabled] = useState(true); // 用于禁用 WebSocket

  const connect = useCallback(() => {
    // 如果已禁用或已达最大重试次数，不再尝试连接
    if (!isEnabled || reconnectAttemptsRef.current >= maxReconnectAttempts) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        onConnect?.();

        // Re-subscribe to all channels after reconnect
        subscribedChannelsRef.current.forEach((channel) => {
          wsRef.current?.send(JSON.stringify({ type: 'subscribe', channel }));
        });
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        onDisconnect?.();

        // Attempt reconnect with backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const backoff = reconnectInterval * reconnectAttemptsRef.current;
          setTimeout(connect, backoff);
        } else {
          // 静默禁用 WebSocket，不再尝试
          setIsEnabled(false);
        }
      };

      wsRef.current.onerror = () => {
        // 静默处理错误，不打印到控制台
        // 增加重试计数
        reconnectAttemptsRef.current++;
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setIsEnabled(false);
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          onMessage?.(message);
        } catch {
          // 静默忽略解析错误
        }
      };
    } catch {
      // 静默处理连接错误
      setIsEnabled(false);
    }
  }, [url, onMessage, onConnect, onDisconnect, onError, reconnectInterval, maxReconnectAttempts, isEnabled]);

  const subscribe = useCallback((channel: string) => {
    subscribedChannelsRef.current.add(channel);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', channel }));
    }
  }, []);

  const unsubscribe = useCallback((channel: string) => {
    subscribedChannelsRef.current.delete(channel);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', channel }));
    }
  }, []);

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { isConnected, subscribe, unsubscribe, send };
}

// Hook for subscribing to token price updates
export function useTokenPrice(tokenAddress: string) {
  const [price, setPrice] = useState<number | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';
  const wsUrl = apiUrl.replace('http', 'ws') + '/ws';

  const { isConnected, subscribe, unsubscribe } = useWebSocket({
    url: wsUrl,
    onMessage: (message) => {
      if (message.type === 'price' && message.channel === `price:${tokenAddress}`) {
        const data = message.data as { price: number; change24h: number };
        setPrice(data.price);
        setPriceChange24h(data.change24h);
      }
    },
  });

  useEffect(() => {
    if (tokenAddress && isConnected) {
      subscribe(`price:${tokenAddress}`);
      return () => unsubscribe(`price:${tokenAddress}`);
    }
  }, [tokenAddress, isConnected, subscribe, unsubscribe]);

  return { price, priceChange24h, isConnected };
}

// Hook for subscribing to whale alerts
export function useWhaleAlerts(tokenAddress: string) {
  const [alerts, setAlerts] = useState<WhaleAlert[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';
  const wsUrl = apiUrl.replace('http', 'ws') + '/ws';

  const { isConnected, subscribe, unsubscribe } = useWebSocket({
    url: wsUrl,
    onMessage: (message) => {
      if (message.type === 'whale' && message.channel === `whale:${tokenAddress}`) {
        const alert = message.data as WhaleAlert;
        setAlerts((prev) => [alert, ...prev].slice(0, 50));
      }
    },
  });

  useEffect(() => {
    if (tokenAddress && isConnected) {
      subscribe(`whale:${tokenAddress}`);
      return () => unsubscribe(`whale:${tokenAddress}`);
    }
  }, [tokenAddress, isConnected, subscribe, unsubscribe]);

  return { alerts, isConnected };
}

interface WhaleAlert {
  id: string;
  type: 'buy' | 'sell';
  amount: string;
  amountUsd: string;
  walletAddress: string;
  timestamp: number;
}

// Hook for subscribing to Dev activity
export function useDevActivity(devAddress: string) {
  const [activities, setActivities] = useState<DevActivity[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';
  const wsUrl = apiUrl.replace('http', 'ws') + '/ws';

  const { isConnected, subscribe, unsubscribe } = useWebSocket({
    url: wsUrl,
    onMessage: (message) => {
      if (message.type === 'dev' && message.channel === `dev:${devAddress}`) {
        const activity = message.data as DevActivity;
        setActivities((prev) => [activity, ...prev].slice(0, 20));
      }
    },
  });

  useEffect(() => {
    if (devAddress && isConnected) {
      subscribe(`dev:${devAddress}`);
      return () => unsubscribe(`dev:${devAddress}`);
    }
  }, [devAddress, isConnected, subscribe, unsubscribe]);

  return { activities, isConnected };
}

interface DevActivity {
  id: string;
  type: 'launch' | 'sell' | 'buy';
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  amount?: string;
  timestamp: number;
}
