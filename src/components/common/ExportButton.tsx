import React, { useState } from 'react';
import { Download, FileSpreadsheet, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getCurrentMode } from '@/hooks/useApi';

interface ExportButtonProps {
  /** 导出类型 */
  exportType: 'students' | 'exams' | 'rewards' | 'courses' | 'schedules';
  /** 按钮文本 */
  buttonText?: string;
  /** 按钮变体 */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  /** 按钮大小 */
  size?: 'default' | 'sm' | 'lg';
  /** 额外的筛选条件 */
  filters?: Record<string, any>;
  /** 导出成功回调 */
  onExportSuccess?: (data: any) => void;
  /** 导出失败回调 */
  onExportError?: (error: string) => void;
}

interface ExportConfig {
  startDate: string;
  endDate: string;
  format: 'xlsx' | 'csv';
  filters: Record<string, any>;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  exportType,
  buttonText = '导出',
  variant = 'outline',
  size = 'default',
  filters = {},
  onExportSuccess,
  onExportError
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ExportConfig>({
    startDate: '',
    endDate: '',
    format: 'xlsx',
    filters: {}
  });
  const { toast } = useToast();

  // 获取导出类型的中文名称
  const getExportTypeName = (type: string) => {
    const names = {
      students: '学员数据',
      exams: '考试数据',
      rewards: '奖励数据',
      courses: '课程数据',
      schedules: '排程数据'
    };
    return names[type as keyof typeof names] || '数据';
  };

  // 获取认证token
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

  // 获取API基础URL
  const getApiBaseUrl = () => {
    const mode = getCurrentMode();
    if (mode === 'mock') return null;
    return mode === 'local' ? 'http://localhost:8000' : 'https://chuangningpeixun.com';
  };

  // 执行导出
  const handleExport = async () => {
    const mode = getCurrentMode();
    
    if (mode === 'mock') {
      // Mock模式下模拟导出
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setShowDialog(false);
        toast({
          title: '导出成功',
          description: `${getExportTypeName(exportType)}已导出到下载文件夹`,
        });
        onExportSuccess?.({
          fileName: `${exportType}_export_${Date.now()}.xlsx`,
          recordCount: Math.floor(Math.random() * 100) + 1
        });
      }, 2000);
      return;
    }

    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      toast({
        title: '导出失败',
        description: '无法获取API地址',
        variant: 'destructive'
      });
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast({
        title: '导出失败',
        description: '请先登录',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // 构建导出请求数据
      const exportData = {
        export_type: exportType,
        start_date: config.startDate,
        end_date: config.endDate,
        format: config.format,
        filters: {
          ...filters,
          ...config.filters
        }
      };

      // 根据导出类型选择API端点
      const endpoints = {
        students: '/api/v1/students/export',
        exams: '/api/v1/exams/export',
        rewards: '/api/v1/rewards/export',
        courses: '/api/v1/courses/export',
        schedules: '/api/v1/schedules/export'
      };

      const endpoint = endpoints[exportType];
      if (!endpoint) {
        throw new Error(`不支持的导出类型: ${exportType}`);
      }

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exportData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `导出失败: ${response.status}`);
      }

      const result = await response.json();

      // 如果返回了文件URL，直接下载
      if (result.file_url) {
        const downloadUrl = result.file_url.startsWith('http') 
          ? result.file_url 
          : `${baseUrl}${result.file_url}`;
        
        // 创建下载链接
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = result.file_name || `${exportType}_export.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setShowDialog(false);
      toast({
        title: '导出成功',
        description: `${getExportTypeName(exportType)}已开始下载`,
      });

      onExportSuccess?.(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导出失败';
      toast({
        title: '导出失败',
        description: errorMessage,
        variant: 'destructive'
      });
      onExportError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 快速导出（使用默认配置）
  const handleQuickExport = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setConfig({
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
      format: 'xlsx',
      filters: {}
    });

    // 直接执行导出，不显示对话框
    setTimeout(handleExport, 100);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size}>
            <Download className="w-4 h-4 mr-2" />
            {buttonText}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>导出选项</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleQuickExport}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            快速导出 (最近30天)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowDialog(true)}>
            <Filter className="w-4 h-4 mr-2" />
            自定义导出
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>导出 {getExportTypeName(exportType)}</DialogTitle>
            <DialogDescription>
              请选择导出的时间范围和格式
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">开始日期</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={config.startDate}
                  onChange={(e) => setConfig(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">结束日期</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={config.endDate}
                  onChange={(e) => setConfig(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="format">导出格式</Label>
              <Select
                value={config.format}
                onValueChange={(value: 'xlsx' | 'csv') => 
                  setConfig(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              取消
            </Button>
            <Button onClick={handleExport} disabled={loading}>
              {loading ? '导出中...' : '开始导出'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
