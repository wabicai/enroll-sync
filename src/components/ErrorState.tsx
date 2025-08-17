import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function ErrorState({ 
  title = "数据加载失败", 
  message = "无法获取数据，请检查网络连接或稍后重试",
  onRetry,
  showRetry = true 
}: ErrorStateProps) {
  return (
    <Card className="border-destructive/20">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-destructive mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
        {showRetry && onRetry && (
          <Button 
            onClick={onRetry} 
            variant="outline" 
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            重新加载
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function ChartErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-[250px] text-center">
      <AlertCircle className="h-8 w-8 text-destructive mb-2" />
      <p className="text-sm text-muted-foreground mb-4">图表加载失败</p>
      {onRetry && (
        <Button 
          onClick={onRetry} 
          variant="ghost" 
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-3 w-3" />
          重试
        </Button>
      )}
    </div>
  );
}
