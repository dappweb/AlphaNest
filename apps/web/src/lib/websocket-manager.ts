/**
 * WebSocket 连接管理器
 * 负责管理实时数据连接，包括价格更新、交易状态等
 */

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface PriceUpdate {
  token: string;
  chain: string;
  price: number;
  change24h: number;
  volume24h: number;
  timestamp: number;
}

export interface TransactionUpdate {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  from: string;
  to: string;
  amount: number;
  token: string;
  timestamp: number;
}

export interface MarketUpdate {
  type: 'price' | 'transaction' | 'volume' | 'liquidity';
  data: any;
}

class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private subscriptions = new Map<string, Set<(message: WebSocketMessage) => void>>();
  private pingInterval: NodeJS.Timeout | null = null;
  private isManualClose = false;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * 连接WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;
      this.isManualClose = false;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startPing();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.stopPing();
          
          if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        // 连接超时处理
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.isManualClose = true;
    this.stopPing();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.subscriptions.clear();
  }

  /**
   * 订阅消息类型
   */
  subscribe(type: string, callback: (message: WebSocketMessage) => void): () => void {
    if (!this.subscriptions.has(type)) {
      this.subscriptions.set(type, new Set());
    }
    
    this.subscriptions.get(type)!.add(callback);
    
    // 发送订阅消息
    this.send({
      type: 'subscribe',
      data: { channel: type },
      timestamp: Date.now()
    });

    // 返回取消订阅函数
    return () => {
      const callbacks = this.subscriptions.get(type);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(type);
          // 发送取消订阅消息
          this.send({
            type: 'unsubscribe',
            data: { channel: type },
            timestamp: Date.now()
          });
        }
      }
    };
  }

  /**
   * 发送消息
   */
  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: WebSocketMessage): void {
    const callbacks = this.subscriptions.get(message.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error in WebSocket callback:', error);
        }
      });
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    
    setTimeout(() => {
      if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  /**
   * 开始心跳
   */
  private startPing(): void {
    this.pingInterval = setInterval(() => {
      this.send({
        type: 'ping',
        data: {},
        timestamp: Date.now()
      });
    }, 30000); // 每30秒发送一次心跳
  }

  /**
   * 停止心跳
   */
  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * 获取连接状态
   */
  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * 获取连接状态文本
   */
  get connectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'unknown';
    }
  }
}

// 创建全局WebSocket管理器实例
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://alphanest-api.dappweb.workers.dev/ws';
export const wsManager = new WebSocketManager(WS_URL);

// 导出类型和实例
export { WebSocketManager };
export default wsManager;
