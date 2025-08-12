import { useEffect, useState } from 'react';
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
import { Search, Plus, Filter, MoreHorizontal, Check, X, DollarSign, Gift, Star, TrendingUp, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Reward, RewardType } from '@/types';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { fetchRewards, createReward, updateReward, deleteReward, applyReward } from '@/lib/api';

const typeLabels = {
  recruitment: '招生奖励',
  development: '发展奖励',
  performance: '绩效奖励',
  special: '特殊奖励',
};

// backend mapping reminder: 1=pending(AVAILABLE/APPLYING), 3=approved, 4=rejected, 5=paid
const statusLabels = {
  pending: '待审核',
  approved: '已审核',
  rejected: '已拒绝',
  paid: '已发放',
};

export default function Rewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // initial load from backend
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const list = await fetchRewards();
        if (mounted) setRewards(list);
      } catch (e: any) {
        setError(e?.message || '加载失败');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  const [form, setForm] = useState<Partial<Reward>>({ type: 'recruitment', status: 'pending', amount: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = reward.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reward.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || reward.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || reward.status === statusFilter;
    const created = new Date(reward.createdAt).toISOString().slice(0,10);
    const matchesFrom = !fromDate || created >= fromDate;
    const matchesTo = !toDate || created <= toDate;
    return matchesSearch && matchesType && matchesStatus && matchesFrom && matchesTo;
  });

  const handleApprove = async (_rewardId: string) => {
    alert('奖励审批已迁移至统一审批中心，请通过“审批中心”处理。');
  };

  const handleReject = async (_rewardId: string) => {
    alert('奖励审批已迁移至统一审批中心，请通过“审批中心”处理。');
  };

  const handlePay = async (_rewardId: string) => {
    alert('奖励发放请使用财务批量发放或对应后端接口。');
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
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="mr-2 h-4 w-4" />
              添加奖励
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加奖励</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>申请人ID</Label>
                  <Input value={form.userId ?? ''} onChange={(e) => setForm({ ...form, userId: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label>申请人姓名</Label>
                  <Input value={form.userName ?? ''} onChange={(e) => setForm({ ...form, userName: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>奖励类型</Label>
                  <Select value={(form.type as string) || 'recruitment'} onValueChange={(v) => setForm({ ...form, type: v as RewardType })}>
                    <SelectTrigger>
                      <SelectValue placeholder="类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>金额(¥)</Label>
                  <Input type="number" value={form.amount ?? 0} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label>奖励原因</Label>
                <Input value={form.reason ?? ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                // For real backend: need student_enrollment_id, recruiter_user_id, amounts, etc.
                const enrollmentIdStr = prompt('关联报考记录ID (student_enrollment_id)');
                const recruiterIdStr = prompt('招生员用户ID (recruiter_user_id)');
                const totalFeeStr = prompt('总学费(¥)', '2000');
                const paidAmountStr = prompt('已付金额(¥)', '2000');
                const paymentDateStr = prompt('缴费日期(YYYY-MM-DD)', new Date().toISOString().slice(0,10));
                const rewardAmountStr = prompt('奖励金额(¥)', String(form.amount ?? 0));
                if (!enrollmentIdStr || !recruiterIdStr || !totalFeeStr || !paidAmountStr || !paymentDateStr) return;
                const created = await createReward({
                  student_enrollment_id: Number(enrollmentIdStr),
                  recruiter_user_id: Number(recruiterIdStr),
                  total_fee: Number(totalFeeStr),
                  payment_type: 1,
                  paid_amount: Number(paidAmountStr),
                  payment_date: paymentDateStr,
                  reward_amount: Number(rewardAmountStr || 0),
                  tags: String(form.reason ?? '')
                });
                setRewards(prev => [created, ...prev]);
                setOpenAdd(false);
                setForm({ type: 'recruitment', status: 'pending', amount: 0 });
              }}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                  <SelectItem value="all">全部类型</SelectItem>
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
                  <SelectItem value="all">全部状态</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
                <span className="text-muted-foreground text-sm">至</span>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
              </div>
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
                              onClick={async () => {
                                const month = prompt('申请月份(YYYY-MM)');
                                const reason = prompt('申请原因', '按规则发放') || '';
                                if (!month) return;
                                await applyReward(reward.id, month, reason);
                                alert('已提交申请，等待审批');
                              }}
                            >
                              提交申请
                            </Button>
                          </>
                        )}
                        {reward.status === 'approved' && (
                          <span className="text-muted-foreground text-sm">待财务发放</span>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={async () => {
                            const amount = prompt('调整金额(¥)', String(reward.amount));
                            if (amount == null) return;
                            const reason = prompt('调整原因', reward.reason ?? '') ?? reward.reason ?? '';
                            const updated = await updateReward(reward.id, { amount: Number(amount), reason });
                            if (updated) setRewards(prev => prev.map(r => r.id === reward.id ? updated : r));
                          }}>编辑奖励</DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => {
                            const ok = confirm('确认删除奖励记录？');
                            if (!ok) return;
                            const success = await deleteReward(reward.id);
                            if (success) setRewards(prev => prev.filter(r => r.id !== reward.id));
                          }} className="text-destructive">
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

      {/* 发放记录（已发放） */}
      <Card>
        <CardHeader>
          <CardTitle>发放记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-2">
            <Button variant="outline" onClick={() => {
              const sp = new URLSearchParams();
              if (typeFilter !== 'all') sp.set('type', typeFilter);
              if (fromDate) sp.set('from', fromDate);
              if (toDate) sp.set('to', toDate);
              window.location.href = `/exports?${sp.toString()}`;
            }}>导出奖励</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>申请人</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>原因</TableHead>
                <TableHead>发放时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rewards.filter(r => r.status === 'paid').map(r => (
                <TableRow key={`paid_${r.id}`}>
                  <TableCell>{r.userName}</TableCell>
                  <TableCell>{typeLabels[r.type]}</TableCell>
                  <TableCell>¥{r.amount.toLocaleString()}</TableCell>
                  <TableCell className="max-w-xs truncate" title={r.reason}>{r.reason}</TableCell>
                  <TableCell>{new Date(r.updatedAt || r.createdAt).toLocaleDateString('zh-CN')}</TableCell>
                </TableRow>
              ))}
              {rewards.filter(r => r.status === 'paid').length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">暂无发放记录</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}