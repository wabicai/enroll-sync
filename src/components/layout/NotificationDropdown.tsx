import React from 'react';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export const NotificationDropdown: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loading
  } = useNotifications();
  const navigate = useNavigate();

  // 根据通知内容判断跳转页面
  const getNavigationPath = (notification: any) => {
    const { title, content } = notification;

    if (title.includes('角色升级') || content.includes('角色升级')) {
      return '/approvals?type=roles';
    }
    if (title.includes('用户注册') || content.includes('用户注册')) {
      return '/approvals?type=users';
    }
    if (title.includes('学员报名') || content.includes('学员报名')) {
      return '/approvals?type=students';
    }
    if (title.includes('奖励申请') || content.includes('奖励申请')) {
      return '/approvals?type=rewards';
    }
    if (title.includes('考试') || content.includes('考试')) {
      return '/schedules';
    }
    if (title.includes('课程') || content.includes('课程')) {
      return '/courses';
    }

    // 默认跳转到通知中心
    return '/notifications';
  };

  const handleNotificationClick = (notification: any) => {
    // 如果是未读通知，标记为已读
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // 跳转到对应页面
    const path = getNavigationPath(notification);
    navigate(path);
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: zhCN
      });
    } catch {
      return '刚刚';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'warning':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      case 'error':
        return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
      case 'info':
      default:
        return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
    }
  };

  const getNotificationColor = (type: string) => {
    // 不再需要颜色类，因为我们使用圆点
    return '';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <Bell className="h-3 w-3 text-white" />
            </div>
            <span className="font-medium text-gray-900 dark:text-gray-100">通知</span>
            {unreadCount > 0 && (
              <span className="text-xs text-gray-500">({unreadCount}条未读)</span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 px-3 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-md"
            >
              全部已读
            </Button>
          )}
        </DropdownMenuLabel>
        
        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="flex items-center justify-center p-6">
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-sm">加载中...</span>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">暂无新通知</p>
              <p className="text-xs text-gray-500 mt-1">所有通知都已处理完毕</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="p-0 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start w-full p-4 border-l-3 border-l-blue-500">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                        {notification.title}
                      </h4>
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0 mt-1"></div>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-2">
                      {notification.content}
                    </p>

                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {formatTime(notification.created_at)}
                    </span>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700 mx-2" />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/50 font-medium text-sm rounded-md"
                onClick={() => navigate('/notifications')}
              >
                查看全部通知
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
