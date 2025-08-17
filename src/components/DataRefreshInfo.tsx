import { Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DataRefreshInfoProps {
  lastUpdated?: Date;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  autoRefresh?: boolean;
  nextRefresh?: Date;
}

export function DataRefreshInfo({ 
  lastUpdated, 
  isRefreshing = false, 
  onRefresh,
  autoRefresh = false,
  nextRefresh 
}: DataRefreshInfoProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return '刚刚';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分钟前`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}小时前`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)}天前`;
    }
  };

  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      {/* 最后更新时间 */}
      {lastUpdated && (
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>更新于: {getTimeAgo(lastUpdated)}</span>
          <span className="text-xs">({formatTime(lastUpdated)})</span>
        </div>
      )}

      {/* 自动刷新状态 */}
      {autoRefresh && (
        <Badge variant="secondary" className="text-xs">
          自动刷新
        </Badge>
      )}

      {/* 下次刷新时间 */}
      {nextRefresh && (
        <span className="text-xs">
          下次刷新: {formatTime(nextRefresh)}
        </span>
      )}

      {/* 手动刷新按钮 */}
      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-6 px-2 gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? '刷新中...' : '刷新'}
        </Button>
      )}
    </div>
  );
}
