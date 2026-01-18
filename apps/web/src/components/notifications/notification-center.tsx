'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  Bell, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  AlertTriangle,
  Wallet,
  CheckCircle,
  Clock,
  Trash2,
  Settings,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWebSocket } from '@/hooks/use-websocket';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { getAuthHeaders } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';

type NotificationType = 'price_alert' | 'whale_alert' | 'insurance' | 'system' | 'trade' | 'points';
type NotificationPriority = 'high' | 'medium' | 'low';

interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'price_alert':
      return <TrendingUp className="h-4 w-4" />;
    case 'whale_alert':
      return <AlertTriangle className="h-4 w-4" />;
    case 'insurance':
      return <Shield className="h-4 w-4" />;
    case 'trade':
      return <Wallet className="h-4 w-4" />;
    case 'points':
      return <CheckCircle className="h-4 w-4" />;
    case 'system':
      return <Bell className="h-4 w-4" />;
  }
}

function getNotificationColor(type: NotificationType) {
  switch (type) {
    case 'price_alert':
      return 'bg-success/10 text-success';
    case 'whale_alert':
      return 'bg-warning/10 text-warning';
    case 'insurance':
      return 'bg-purple-500/10 text-purple-400';
    case 'trade':
      return 'bg-blue-500/10 text-blue-400';
    case 'points':
      return 'bg-primary/10 text-primary';
    case 'system':
      return 'bg-muted text-muted-foreground';
  }
}

function getPriorityIndicator(priority: NotificationPriority) {
  switch (priority) {
    case 'high':
      return 'border-l-4 border-l-destructive';
    case 'medium':
      return 'border-l-4 border-l-warning';
    case 'low':
      return '';
  }
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { publicKey, connected } = useWallet();
  const address = publicKey?.toBase58() || null;
  const isConnected = connected;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 从 API 获取通知数据
  const fetchNotifications = async () => {
    if (!isConnected || !address) {
      setNotifications([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/api/v1/notifications?unread=${filter === 'unread'}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setNotifications(data.data);
        } else {
          setNotifications([]);
        }
      } else {
        throw new Error('Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取通知数据
  useEffect(() => {
    if (isOpen && isConnected) {
      fetchNotifications();
    } else if (!isConnected) {
      setNotifications([]);
    }
  }, [isOpen, isConnected, address, filter]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  const markAsRead = async (id: string) => {
    // 乐观更新 UI
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );

    // 调用 API 标记为已读
    if (isConnected && address) {
      try {
        await fetch(`${API_URL}/api/v1/notifications/${id}/read`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
        });
      } catch (err) {
        console.error('Error marking notification as read:', err);
        // 回滚 UI 更新
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, read: false } : n)
        );
      }
    }
  };

  const markAllAsRead = async () => {
    // 乐观更新 UI
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    // 调用 API 标记所有为已读
    if (isConnected && address) {
      try {
        await fetch(`${API_URL}/api/v1/notifications/read-all`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
        });
      } catch (err) {
        console.error('Error marking all notifications as read:', err);
        // 重新获取通知以恢复状态
        fetchNotifications();
      }
    }
  };

  const deleteNotification = async (id: string) => {
    // 乐观更新 UI
    setNotifications(prev => prev.filter(n => n.id !== id));

    // 调用 API 删除通知
    if (isConnected && address) {
      try {
        await fetch(`${API_URL}/api/v1/notifications/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
        });
      } catch (err) {
        console.error('Error deleting notification:', err);
        // 重新获取通知以恢复状态
        fetchNotifications();
      }
    }
  };

  const clearAll = async () => {
    // 乐观更新 UI
    setNotifications([]);

    // 调用 API 清空所有通知
    if (isConnected && address) {
      try {
        await fetch(`${API_URL}/api/v1/notifications`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
        });
      } catch (err) {
        console.error('Error clearing notifications:', err);
        // 重新获取通知以恢复状态
        fetchNotifications();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-4 top-16 z-50 w-96 max-h-[80vh] overflow-hidden rounded-lg border bg-card shadow-xl animate-in slide-in-from-top-2">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <span className="font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center justify-between p-2 border-b bg-muted/30">
          <div className="flex gap-1">
            <Button
              variant={filter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7"
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </Button>
          </div>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={markAllAsRead}
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
          {isLoading ? (
            <div className="p-8">
              <Loading text="Loading notifications..." />
            </div>
          ) : error ? (
            <div className="p-8">
              <EmptyState
                icon={<AlertTriangle className="h-12 w-12 text-destructive" />}
                title="Error loading notifications"
                description={error}
                action={{
                  label: 'Retry',
                  onClick: () => {
                    // Trigger refetch
                    setError(null);
                  },
                }}
              />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<Bell className="h-12 w-12 text-muted-foreground" />}
                title="No notifications"
                description="You're all caught up! New notifications will appear here."
              />
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-primary/5' : ''
                  } ${getPriorityIndicator(notification.priority)}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      getNotificationColor(notification.type)
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-medium text-sm ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {notification.timestamp}
                        </span>
                        {notification.actionUrl && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs text-primary"
                            asChild
                          >
                            <a href={notification.actionUrl}>
                              {notification.actionLabel || 'View'}
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={clearAll}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

// Hook to use notifications
export function useNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount] = useState(0); // Will be fetched from API

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
    unreadCount,
  };
}
