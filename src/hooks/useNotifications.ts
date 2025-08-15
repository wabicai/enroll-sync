import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { NotificationItem } from '@/types';
import { getCurrentMode, API_CONFIG } from '@/hooks/useApi';
import { api } from '@/lib/api';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // 获取认证token (WebSocket需要)
  const getAuthToken = () => {
    try {
      const authData = localStorage.getItem('auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.token?.access_token;
      }
    } catch (error) {
      console.error('获取token失败:', error);
    }
    return null;
  };

  // 获取WebSocket URL
  const getWebSocketUrl = () => {
    const mode = getCurrentMode();
    if (mode === 'mock') return null;
    
    const baseUrl = mode === 'local' ? API_CONFIG.LOCAL : API_CONFIG.PRODUCTION;
    const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    return wsUrl;
  };

  // 获取通知列表
  const fetchNotifications = useCallback(async () => {
    const mode = getCurrentMode();
    if (mode === 'mock') {
      // 使用mock数据
      const mockNotifications: NotificationItem[] = [
        {
          id: 1,
          title: '新学员注册',
          content: '张三申请安全员考试',
          type: 'info',
          category: 'system',
          is_read: false,
          created_at: new Date().toISOString(),
          priority: 1
        },
        {
          id: 2,
          title: '考试提醒',
          content: '明天有电工考试',
          type: 'warning',
          category: 'exam',
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          priority: 2
        },
        {
          id: 3,
          title: '奖励审核',
          content: '待审核奖励申请',
          type: 'success',
          category: 'reward',
          is_read: true,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          priority: 1
        }
      ];
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.is_read).length);
      return;
    }

    setLoading(true);
    try {
      // 使用统一的API调用，自动处理token和错误，自动添加/api/v1前缀
      const data = await api.get('notifications/');
      setNotifications(data.items || []);

      // 获取未读数量
      const unreadData = await api.get('notifications/unread-count');
      setUnreadCount(unreadData.count || 0);

    } catch (error) {
      console.error('获取通知失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 标记为已读
  const markAsRead = useCallback(async (id: number) => {
    const mode = getCurrentMode();
    if (mode === 'mock') {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      return;
    }

    try {
      // 使用统一的API调用，路径更简洁
      await api.post(`notifications/${id}/read`);

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  }, []);

  // 标记全部为已读
  const markAllAsRead = useCallback(async () => {
    const mode = getCurrentMode();
    if (mode === 'mock') {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      return;
    }

    try {
      // 使用统一的API调用，路径更简洁
      await api.post('notifications/read-all');

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('标记全部已读失败:', error);
    }
  }, []);

  // 删除通知
  const deleteNotification = useCallback(async (id: number) => {
    const mode = getCurrentMode();
    if (mode === 'mock') {
      setNotifications(prev => {
        const notification = prev.find(n => n.id === id);
        const filtered = prev.filter(n => n.id !== id);
        if (notification && !notification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return filtered;
      });
      return;
    }

    try {
      // 使用统一的API调用，路径更简洁
      await api.delete(`notifications/${id}`);

      setNotifications(prev => {
        const notification = prev.find(n => n.id === id);
        const filtered = prev.filter(n => n.id !== id);
        if (notification && !notification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return filtered;
      });
    } catch (error) {
      console.error('删除通知失败:', error);
    }
  }, []);

  // WebSocket连接
  const connectWebSocket = useCallback(() => {
    const mode = getCurrentMode();
    if (mode === 'mock') return;

    const wsUrl = getWebSocketUrl();
    if (!wsUrl) return;

    const token = getAuthToken();
    if (!token) return;

    try {
      const ws = new WebSocket(`${wsUrl}/ws/notifications?token=${token}`);
      
      ws.onopen = () => {
        console.log('WebSocket连接成功');
        setConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'notification') {
            // 新通知
            setNotifications(prev => [data, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // 显示toast通知
            toast({
              title: data.title,
              description: data.content,
              duration: 5000,
            });
          }
        } catch (error) {
          console.error('解析WebSocket消息失败:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket连接关闭');
        setConnected(false);
        
        // 自动重连
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000 * reconnectAttempts.current);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket错误:', error);
        setConnected(false);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('WebSocket连接失败:', error);
    }
  }, [toast]);

  // 断开WebSocket连接
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setConnected(false);
  }, []);

  // 初始化
  useEffect(() => {
    fetchNotifications();
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, [fetchNotifications, connectWebSocket, disconnectWebSocket]);

  return {
    notifications,
    unreadCount,
    loading,
    connected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    connectWebSocket,
    disconnectWebSocket
  };
};
