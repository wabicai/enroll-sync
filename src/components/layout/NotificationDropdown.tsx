import React from 'react';
import { Bell, Check, X } from 'lucide-react';
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

export const NotificationDropdown: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loading
  } = useNotifications();

  const handleMarkAsRead = (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    markAsRead(id);
  };

  const handleDelete = (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    deleteNotification(id);
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
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      case 'info':
      default:
        return 'text-blue-600';
    }
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
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>通知</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-1 text-xs"
            >
              全部已读
            </Button>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              加载中...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              暂无通知
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-3 cursor-pointer ${
                  !notification.is_read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                }`}
              >
                <div className="flex items-start space-x-3 w-full">
                  <div className={`text-lg ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-medium truncate">
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                            className="h-6 w-6 p-0"
                            title="标记为已读"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(notification.id, e)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          title="删除"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.content}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(notification.created_at)}
                      </span>
                      {notification.category && (
                        <Badge variant="outline" className="text-xs">
                          {notification.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center">
              <Button variant="ghost" size="sm" className="w-full">
                查看全部通知
              </Button>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
