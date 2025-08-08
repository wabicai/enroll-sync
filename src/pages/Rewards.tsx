import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Filter, MoreHorizontal, Check, X, DollarSign, Gift, Star, TrendingUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockRewards } from '@/mock';
import type { Reward, RewardType } from '@/types';

const typeLabels = {
  recruitment: '招生奖励',
  development: '发展奖励',
  performance: '绩效奖励',
  special: '特殊奖励',
};

const statusLabels = {
  pending: '待审核',
  approved: '已审核',
  rejected: '已拒绝',
  paid: '已发放',
};

export default function Rewards() {
  const [rewards, setRewards] = useState<Reward[]>(mockRewards);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = reward.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reward.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || reward.type === typeFilter;
    const matchesStatus = !statusFilter || reward.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleApprove = (rewardId: string) => {
    setRewards(prev => prev.map(reward => 
      reward.id === rewardId ? { 
        ...reward, 
        status: 'approved' as const,
        approvedBy: '2', // 假设是财务审核
        approvedAt: new Date().toISOString()
      } : reward
    ));
  };

  const handleReject = (rewardId: string) => {
    setRewards(prev => prev.map(reward => 
      reward.id === rewardId ? { ...reward, status: 'rejected' as const } : reward
    ));
  };

  const handlePay = (rewardId: string) => {
    setRewards(prev => prev.map(reward => 
      reward.id === rewardId ? { ...reward, status: 'paid' as const } : reward
    ));
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      case 'paid': return 'outline';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: RewardType) => {
    switch (type) {
      case 'recruitment': return DollarSign;
      case 'development': return TrendingUp;
      case 'performance': return Star;
      case 'special': return Gift;
      default: return DollarSign;
    }
  };

  const getTypeColor = (type: RewardType) => {
    switch (type) {
      case 'recruitment': return 'text-green-600';
      case 'development': return 'text-blue-600';
      case 'performance': return 'text-purple-600';
      case 'special': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">奖励管理</h1>
          <p className="text-muted-foreground">
            管理奖励申请、审核和发放流程
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary-hover">
          <Plus className="mr-2 h-4 w-4" />
          添加奖励
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">奖励总额</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{rewards.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              本月累计奖励
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审核</CardTitle>
            <Check className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rewards.filter(r => r.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              等待审核的申请
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已发放</CardTitle>
            <Gift className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rewards.filter(r => r.status === 'paid').length}
            </div>
            <p className="text-xs text-muted-foreground">
              本月已发放奖励
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均奖励</CardTitle>
            <Star className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{rewards.length > 0 ? Math.round(rewards.reduce((sum, r) => sum + r.amount, 0) / rewards.length) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              单笔奖励均值
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle>奖励列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索奖励..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部类型</SelectItem>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部状态</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              更多筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 奖励表格 */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>申请人</TableHead>
                <TableHead>奖励类型</TableHead>
                <TableHead>奖励金额</TableHead>
                <TableHead>奖励原因</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>申请时间</TableHead>
                <TableHead>审核信息</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRewards.map((reward) => {
                const TypeIcon = getTypeIcon(reward.type);
                
                return (
                  <TableRow key={reward.id}>
                    <TableCell>
                      <div className="font-medium">{reward.userName}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {reward.userId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TypeIcon className={`h-4 w-4 ${getTypeColor(reward.type)}`} />
                        <Badge variant="outline">
                          {typeLabels[reward.type]}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-green-600">
                        ¥{reward.amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={reward.reason}>
                        {reward.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(reward.status)}>
                        {statusLabels[reward.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(reward.createdAt).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      {reward.approvedBy ? (
                        <div className="text-sm">
                          <div>已审核</div>
                          <div className="text-xs text-muted-foreground">
                            {reward.approvedAt && new Date(reward.approvedAt).toLocaleDateString('zh-CN')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {reward.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(reward.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(reward.id)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        {reward.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePay(reward.id)}
                          >
                            发放
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>查看详情</DropdownMenuItem>
                            <DropdownMenuItem>编辑奖励</DropdownMenuItem>
                            <DropdownMenuItem>发放记录</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              删除奖励
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredRewards.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">未找到匹配的奖励记录</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}