import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { NotificationItem } from '@/types';
import { getCurrentMode } from '@/hooks/useApi';
import {
  fetchRecentNotifications,
  fetchUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as deleteNotificationApi
} from '@/lib/api';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const unreadCountIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastNotificationTimeRef = useRef<string | null>(null);

  // 获取最新通知 (HTTP轮询)
  const fetchRecentNotificationsData = useCallback(async (useTimestamp: boolean = false) => {
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

    try {
      const since = useTimestamp ? lastNotificationTimeRef.current : undefined;
      // 只获取未读通知
      const data = await fetchRecentNotifications(10, since, true);

      if (useTimestamp && since) {
        // 增量更新：只添加新通知
        if (data.items && data.items.length > 0) {
          setNotifications(prev => {
            const newNotifications = data.items.filter(newItem =>
              !prev.some(existingItem => existingItem.id === newItem.id)
            );

            // 显示新通知的toast
            newNotifications.forEach(notification => {
              toast({
                title: notification.title,
                description: notification.content,
                duration: 5000,
              });
            });

            return [...newNotifications, ...prev];
          });

          // 更新最新时间戳
          const latestTime = data.items[0]?.created_at;
          if (latestTime) {
            lastNotificationTimeRef.current = latestTime;
          }
        }
      } else {
        // 全量更新：初始加载，只显示未读通知
        setNotifications(data.items || []);

        // 设置最新时间戳
        if (data.items && data.items.length > 0) {
          lastNotificationTimeRef.current = data.items[0].created_at;
        }
      }
    } catch (error) {
      console.error('获取通知失败:', error);
    }
  }, [toast]);

  // 获取未读数量
  const fetchUnreadCount = useCallback(async () => {
    const mode = getCurrentMode();
    if (mode === 'mock') {
      setUnreadCount(notifications.filter(n => !n.is_read).length);
      return;
    }

    try {
      const data = await fetchUnreadNotificationCount();
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('获取未读数量失败:', error);
    }
  }, [notifications]);

  // 标记为已读
  const markAsRead = useCallback(async (id: number) => {
    const mode = getCurrentMode();
    if (mode === 'mock') {
      // 从列表中移除已读通知，因为我们只显示未读通知
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      return;
    }

    try {
      await markNotificationAsRead(id);

      // 从列表中移除已读通知，因为我们只显示未读通知
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('标记已读失败:', error);
      toast({
        title: '操作失败',
        description: '标记已读失败，请重试',
        variant: 'destructive',
        duration: 3000,
      });
    }
  }, [toast]);

  // 标记全部为已读
  const markAllAsRead = useCallback(async () => {
    const mode = getCurrentMode();
    if (mode === 'mock') {
      // 清空通知列表，因为我们只显示未读通知
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      await markAllNotificationsAsRead();

      // 清空通知列表，因为我们只显示未读通知
      setNotifications([]);
      setUnreadCount(0);

      toast({
        title: '操作成功',
        description: '所有通知已标记为已读',
        duration: 3000,
      });
    } catch (error) {
      console.error('标记全部已读失败:', error);
      toast({
        title: '操作失败',
        description: '标记全部已读失败，请重试',
        variant: 'destructive',
        duration: 3000,
      });
    }
  }, [toast]);

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
      await deleteNotificationApi(id);

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

  // 开始轮询
  const startPolling = useCallback(() => {
    const mode = getCurrentMode();
    if (mode === 'mock') return;

    // 轮询获取最新通知 (30秒间隔)
    pollingIntervalRef.current = setInterval(() => {
      fetchRecentNotificationsData(true); // 使用时间戳增量获取
    }, 30000);

    // 轮询获取未读数量 (15秒间隔)
    unreadCountIntervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, 15000);

    console.log('📡 通知轮询已启动');
  }, [fetchRecentNotificationsData, fetchUnreadCount]);

  // 停止轮询
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (unreadCountIntervalRef.current) {
      clearInterval(unreadCountIntervalRef.current);
      unreadCountIntervalRef.current = null;
    }
    console.log('📡 通知轮询已停止');
  }, []);

  // 初始化
  useEffect(() => {
    setLoading(true);

    // 初始加载通知
    fetchRecentNotificationsData(false).finally(() => {
      setLoading(false);
    });

    // 初始加载未读数量
    fetchUnreadCount();

    // 启动轮询
    startPolling();

    return () => {
      stopPolling();
    };
  }, []); // 移除依赖，只在组件挂载时执行一次

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications: fetchRecentNotificationsData,
    refreshNotifications: () => fetchRecentNotificationsData(false),
    refreshUnreadCount: fetchUnreadCount
  };
};
