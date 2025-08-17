import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Bell, Search, Filter, Settings, Check, Trash2, Eye, Clock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { fetchNotifications, fetchNotificationTemplates, markNotificationAsRead, deleteNotification as deleteNotificationAPI } from '@/lib/api';
import type { NotificationItem, NotificationTemplate } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

// 通知类型图标映射 - 根据内容智能判断
const getNotificationIcon = (notification: NotificationItem) => {
  const { title, content } = notification;

  // 根据标题和内容智能判断图标
  if (title.includes('角色升级') || content.includes('角色升级')) {
    return <User className="h-4 w-4 text-purple-500" />;
  }
  if (title.includes('用户注册') || content.includes('用户注册')) {
    return <User className="h-4 w-4 text-blue-500" />;
  }
  if (title.includes('学员报名') || content.includes('学员报名')) {
    return <User className="h-4 w-4 text-green-500" />;
  }
  if (title.includes('奖励申请') || content.includes('奖励申请')) {
    return <CheckCircle2 className="h-4 w-4 text-orange-500" />;
  }
  if (title.includes('考试') || content.includes('考试')) {
    return <Clock className="h-4 w-4 text-blue-500" />;
  }
  if (title.includes('课程') || content.includes('课程')) {
    return <Bell className="h-4 w-4 text-green-500" />;
  }
  if (title.includes('测试') || content.includes('测试')) {
    return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }

  // 根据原始类型返回
  switch (notification.type) {
    case 1: return <AlertCircle className="h-4 w-4 text-red-500" />; // 审批类
    case 2: return <Bell className="h-4 w-4 text-yellow-500" />; // 系统类
    case 3: return <Clock className="h-4 w-4 text-blue-500" />; // 提醒类
    default: return <CheckCircle2 className="h-4 w-4 text-gray-500" />; // 其他
  }
};

// 通知类型名称映射
const getNotificationTypeName = (type: number) => {
  switch (type) {
    case 1: return '审批通知';
    case 2: return '系统通知';
    case 3: return '提醒通知';
    default: return '其他通知';
  }
};

// 通知类型文本映射 - 根据内容智能判断
const getNotificationTypeText = (notification: NotificationItem) => {
  const { title, content } = notification;

  // 根据标题和内容智能判断类型
  if (title.includes('角色升级') || content.includes('角色升级')) {
    return '角色审批';
  }
  if (title.includes('用户注册') || content.includes('用户注册')) {
    return '用户审批';
  }
  if (title.includes('学员报名') || content.includes('学员报名')) {
    return '学员审批';
  }
  if (title.includes('奖励申请') || content.includes('奖励申请')) {
    return '奖励审批';
  }
  if (title.includes('考试') || content.includes('考试')) {
    return '考试通知';
  }
  if (title.includes('课程') || content.includes('课程')) {
    return '课程通知';
  }
  if (title.includes('测试') || content.includes('测试')) {
    return '测试通知';
  }

  // 根据原始类型返回
  switch (notification.type) {
    case 1: return '审批通知';
    case 2: return '系统通知';
    case 3: return '提醒通知';
    default: return '通知';
  }
};

// 通知徽章变体映射
const getNotificationBadgeVariant = (type: number): "default" | "secondary" | "destructive" | "outline" => {
  switch (type) {
    case 1: return 'destructive'; // 审批类 - 红色
    case 2: return 'secondary'; // 系统类 - 灰色
    case 3: return 'default'; // 提醒类 - 蓝色
    default: return 'outline'; // 其他 - 边框
  }
};

// 格式化相对时间
const formatRelativeTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
  } catch {
    return dateString;
  }
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [notificationsData, templatesData] = await Promise.allSettled([
          fetchNotifications(),
          fetchNotificationTemplates()
        ]);

        if (notificationsData.status === 'fulfilled') {
          const data = notificationsData.value;
          if (data && data.items) {
            // API返回的数据结构是 {items: NotificationItem[], total: number, page: number, page_size: number}
            setNotifications(data.items);
          } else if (data && data.data) {
            setNotifications(data.data);
          } else if (Array.isArray(data)) {
            setNotifications(data);
          } else {
            setNotifications([]);
          }
        }

        if (templatesData.status === 'fulfilled') {
          setTemplates(templatesData.value || []);
        } else {
          console.error('获取通知模板失败:', templatesData.reason);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 筛选通知
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = !searchTerm ||
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === null || notification.type === selectedType;

    return matchesSearch && matchesType;
  });

  // 按日期分组
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = new Date(notification.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let groupKey: string;
    if (date.toDateString() === today.toDateString()) {
      groupKey = '今天';
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = '昨天';
    } else {
      groupKey = date.toLocaleDateString('zh-CN');
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
    return groups;
  }, {} as Record<string, NotificationItem[]>);

  // 统计数据
  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    today: notifications.filter(n => {
      const date = new Date(n.created_at);
      const today = new Date();
      return date.toDateString() === today.toDateString();
    }).length
  };

  // 通知类型统计
  const typeStats = notifications.reduce((acc, notification) => {
    const type = notification.type || 0;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // 分页逻辑
  const totalNotifications = filteredNotifications.length;
  const totalPages = Math.ceil(totalNotifications / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

  // 标记为已读
  const markAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      toast({
        title: "操作成功",
        description: "通知已标记为已读",
      });
    } catch (error) {
      console.error('标记已读失败:', error);
      toast({
        title: "操作失败",
        description: "标记已读失败，请重试",
        variant: "destructive",
      });
    }
  };

  // 删除通知
  const deleteNotification = async (id: number) => {
    try {
      await deleteNotificationAPI(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast({
        title: "操作成功",
        description: "通知已删除",
      });
    } catch (error) {
      console.error('删除通知失败:', error);
      toast({
        title: "操作失败",
        description: "删除通知失败，请重试",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 - 符合你的设计风格 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">通知中心</h1>
          <p className="text-muted-foreground">管理和查看所有系统通知</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            设置
          </Button>
          <Button size="sm">
            <Check className="h-4 w-4 mr-2" />
            全部已读
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>通知列表</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 统计信息卡片 - 使用你的渐变风格 */}
          {loading ? (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 animate-pulse">
                <div className="text-sm text-blue-600 font-medium">总通知</div>
                <div className="text-2xl font-bold text-blue-700">-</div>
              </div>
              <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4 border border-red-200 animate-pulse">
                <div className="text-sm text-red-600 font-medium">未读</div>
                <div className="text-2xl font-bold text-red-700">-</div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200 animate-pulse">
                <div className="text-sm text-green-600 font-medium">今天</div>
                <div className="text-2xl font-bold text-green-700">-</div>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200 animate-pulse">
                <div className="text-sm text-orange-600 font-medium">审批待处理</div>
                <div className="text-2xl font-bold text-orange-700">-</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-blue-600 font-medium">总通知</div>
                <div className="text-2xl font-bold text-blue-700">{stats.total || 0}</div>
              </div>
              <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                <div className="text-sm text-red-600 font-medium">未读</div>
                <div className="text-2xl font-bold text-red-700">{stats.unread || 0}</div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="text-sm text-green-600 font-medium">今天</div>
                <div className="text-2xl font-bold text-green-700">{stats.today || 0}</div>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <div className="text-sm text-orange-600 font-medium">审批待处理</div>
                <div className="text-2xl font-bold text-orange-700">{typeStats[1] || 0}</div>
              </div>
            </div>
          )}

          {/* 搜索和筛选区域 - 使用你的muted背景风格 */}
          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索通知标题或内容..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedType === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(null)}
                >
                  全部
                </Button>
                <Button
                  variant={selectedType === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(1)}
                  className={selectedType === 1 ? "" : "text-red-600"}
                >
                  审批 ({typeStats[1] || 0})
                </Button>
                <Button
                  variant={selectedType === 2 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(2)}
                  className={selectedType === 2 ? "" : "text-yellow-600"}
                >
                  系统 ({typeStats[2] || 0})
                </Button>
                <Button
                  variant={selectedType === 3 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(3)}
                  className={selectedType === 3 ? "" : "text-blue-600"}
                >
                  提醒 ({typeStats[3] || 0})
                </Button>
              </div>
            </div>
          </div>

          {/* 通知列表 - 使用表格风格 */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start space-x-4 p-4 border rounded-lg animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">暂无通知</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || selectedType !== null ? '没有找到符合条件的通知' : '您的通知将在这里显示'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">状态</TableHead>
                  <TableHead className="w-[80px]">类型</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>内容</TableHead>
                  <TableHead className="w-[120px]">时间</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedNotifications.map((notification) => (
                  <TableRow
                    key={notification.id}
                    className={!notification.is_read ? 'bg-blue-50' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!notification.is_read ? (
                          <>
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-xs text-red-600 font-medium">未读</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span className="text-xs text-gray-500">已读</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(notification)}
                        <span className="text-xs text-gray-600">
                          {getNotificationTypeText(notification)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {notification.title}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="truncate" title={notification.content}>
                        {notification.content}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: zhCN
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                            title="标记已读"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                共 {totalNotifications} 条通知，第 {currentPage} / {totalPages} 页
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <PaginationItem key={pageNum}>
                        <Button
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 通知模板部分 */}
      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              通知模板
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>场景</TableHead>
                  <TableHead>渠道</TableHead>
                  <TableHead>启用</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>{t.name}</TableCell>
                    <TableCell>{t.scene}</TableCell>
                    <TableCell>{t.channel}</TableCell>
                    <TableCell>
                      <Badge variant={t.enabled ? 'default' : 'secondary'}>
                        {t.enabled ? '启用' : '停用'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


