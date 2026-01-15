/**
 * 实时数据Hooks
 * 提供价格、交易状态等实时数据更新
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { wsManager, type PriceUpdate, type TransactionUpdate } from '@/lib/websocket-manager';

/**
 * 实时价格Hook
 */
export function useRealtimePrice(tokenAddress: string, chain: string) {
  const [price, setPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number>(0);
  const [volume24h, setVolume24h] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const connect = async () => {
      try {
        await wsManager.connect();
        setIsConnected(true);

        // 订阅价格更新
        unsubscribe = wsManager.subscribe('price_update', (message) => {
          const data: PriceUpdate = message.data;
          
          // 只处理指定代币的价格更新
          if (data.token === tokenAddress && data.chain === chain) {
            setPrice(data.price);
            setChange24h(data.change24h);
            setVolume24h(data.volume24h);
            setLastUpdate(data.timestamp);
          }
        });

        // 请求当前价格
        wsManager.send({
          type: 'get_price',
          data: { token: tokenAddress, chain },
          timestamp: Date.now()
        });

      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [tokenAddress, chain]);

  return {
    price,
    change24h,
    volume24h,
    lastUpdate,
    isConnected,
  };
}

/**
 * 实时交易状态Hook
 */
export function useRealtimeTransaction(transactionHash?: string) {
  const [transaction, setTransaction] = useState<TransactionUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!transactionHash) return;

    let unsubscribe: (() => void) | null = null;

    const connect = async () => {
      try {
        await wsManager.connect();
        setIsConnected(true);

        // 订阅交易更新
        unsubscribe = wsManager.subscribe('transaction_update', (message) => {
          const data: TransactionUpdate = message.data;
          
          // 只处理指定交易的状态更新
          if (data.hash === transactionHash) {
            setTransaction(data);
          }
        });

        // 请求交易状态
        wsManager.send({
          type: 'get_transaction',
          data: { hash: transactionHash },
          timestamp: Date.now()
        });

      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [transactionHash]);

  return {
    transaction,
    isConnected,
  };
}

/**
 * 实时市场数据Hook
 */
export function useRealtimeMarket() {
  const [marketData, setMarketData] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const connect = async () => {
      try {
        await wsManager.connect();
        setIsConnected(true);

        // 订阅市场数据更新
        unsubscribe = wsManager.subscribe('market_update', (message) => {
          const data = message.data;
          const now = Date.now();
          
          // 防止过于频繁的更新（每秒最多更新一次）
          if (now - lastUpdateRef.current > 1000) {
            setMarketData(prev => {
              // 合并新数据，避免重复
              const existingIndex = prev.findIndex(item => 
                item.token === data.token && item.chain === data.chain
              );
              
              if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = data;
                return updated;
              } else {
                return [...prev, data];
              }
            });
            lastUpdateRef.current = now;
          }
        });

        // 请求市场数据
        wsManager.send({
          type: 'get_market_data',
          data: {},
          timestamp: Date.now()
        });

      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return {
    marketData,
    isConnected,
  };
}

/**
 * WebSocket连接状态Hook
 */
export function useWebSocketStatus() {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    const checkStatus = () => {
      const state = wsManager.connectionState;
      setStatus(state as any);
    };

    // 定期检查连接状态
    const interval = setInterval(checkStatus, 1000);

    // 监听连接状态变化
    const handleConnectionChange = () => {
      checkStatus();
      setReconnectAttempts(prev => prev + 1);
    };

    // 这里可以添加更详细的状态监听逻辑

    return () => {
      clearInterval(interval);
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      await wsManager.connect();
    } catch (error) {
      console.error('Failed to connect:', error);
      setStatus('error');
    }
  }, []);

  const disconnect = useCallback(() => {
    wsManager.disconnect();
    setStatus('disconnected');
  }, []);

  return {
    status,
    reconnectAttempts,
    connect,
    disconnect,
    isConnected: status === 'connected',
  };
}

/**
 * 实时通知Hook
 */
export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const connect = async () => {
      try {
        await wsManager.connect();
        setIsConnected(true);

        // 订阅通知
        unsubscribe = wsManager.subscribe('notification', (message) => {
          const notification = message.data;
          setNotifications(prev => [notification, ...prev].slice(0, 50)); // 保留最新50条
        });

      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    isConnected,
    clearNotifications,
  };
}
