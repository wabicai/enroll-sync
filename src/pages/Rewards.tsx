import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trophy, DollarSign, Users, Clock } from 'lucide-react';
import { fetchRewards, createReward } from '@/lib/api';
import type { Reward } from '@/types';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusLabels = {
  1: '待考务审核',
  2: '可申请',
  3: '申请中',
  4: '已批准',
  5: '已拒绝',
  6: '已发放',
  // 兼容旧的字符串状态
  pending: '待审核',
  approved: '已审核',
  paid: '已发放',
  rejected: '已拒绝'
};

const typeLabels = {
  recruitment: '招生奖励',
  performance: '业绩奖励',
  special: '特别奖励'
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
        const data = await fetchRewards();
        if (mounted) {
          setRewards(data || []);
        }
      } catch (err) {
        if (mounted) {
          console.error('Failed to fetch rewards:', err);
          setError('获取奖励数据失败');
          setRewards([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // 添加奖励
  const [addForm, setAddForm] = useState({
    student_enrollment_id: '',
    recruiter_user_id: '',
    total_fee: '',
    payment_type: '1' as '1' | '2',
    paid_amount: '',
    payment_date: '',
    reward_amount: '',
    tags: ''
  });

  const handleAddReward = async () => {
    if (!addForm.student_enrollment_id || !addForm.recruiter_user_id || !addForm.total_fee) {
      alert('请填写必填字段');
      return;
    }

    try {
      const newReward = await createReward({
        student_enrollment_id: Number(addForm.student_enrollment_id),
        recruiter_user_id: Number(addForm.recruiter_user_id),
        total_fee: Number(addForm.total_fee),
        payment_type: Number(addForm.payment_type) as 1 | 2,
        paid_amount: Number(addForm.paid_amount),
        payment_date: addForm.payment_date,
        reward_amount: addForm.reward_amount ? Number(addForm.reward_amount) : undefined,
        tags: addForm.tags || undefined
      });
      
      setRewards(prev => [newReward, ...prev]);
      setOpenAdd(false);
      setAddForm({
        student_enrollment_id: '',
        recruiter_user_id: '',
        total_fee: '',
        payment_type: '1',
        paid_amount: '',
        payment_date: '',
        reward_amount: '',
        tags: ''
      });
    } catch (error) {
      console.error('创建奖励失败:', error);
      alert('创建奖励失败，请重试');
    }
  };

  const getStatusVariant = (status: string | number) => {
    switch (status) {
      case 1: return 'outline'; // 待考务审核
      case 2: return 'secondary'; // 可申请
      case 3: return 'outline'; // 申请中
      case 4: return 'secondary'; // 已批准
      case 5: return 'destructive'; // 已拒绝
      case 6: return 'default'; // 已发放
      // 兼容旧的字符串状态
      case 'paid': return 'default';
      case 'approved': return 'secondary';
      case 'pending': return 'outline';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-64 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">奖励管理</h1>
          <p className="text-muted-foreground">管理奖励申请、审核和发放流程</p>
        </div>
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="mr-2 h-4 w-4" />
              添加奖励
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>添加奖励</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>学员报名ID *</Label>
                  <Input 
                    value={addForm.student_enrollment_id} 
                    onChange={(e) => setAddForm({...addForm, student_enrollment_id: e.target.value})} 
                    placeholder="学员报名ID"
                  />
                </div>
                <div>
                  <Label>招生人员ID *</Label>
                  <Input 
                    value={addForm.recruiter_user_id} 
                    onChange={(e) => setAddForm({...addForm, recruiter_user_id: e.target.value})} 
                    placeholder="招生人员ID"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>总费用 *</Label>
                  <Input 
                    type="number" 
                    value={addForm.total_fee} 
                    onChange={(e) => setAddForm({...addForm, total_fee: e.target.value})} 
                    placeholder="总费用"
                  />
                </div>
                <div>
                  <Label>支付方式 *</Label>
                  <Select value={addForm.payment_type} onValueChange={(value) => setAddForm({...addForm, payment_type: value as '1' | '2'})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">全款</SelectItem>
                      <SelectItem value="2">分期</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>已付金额</Label>
                  <Input 
                    type="number" 
                    value={addForm.paid_amount} 
                    onChange={(e) => setAddForm({...addForm, paid_amount: e.target.value})} 
                    placeholder="已付金额"
                  />
                </div>
                <div>
                  <Label>奖励金额</Label>
                  <Input 
                    type="number" 
                    value={addForm.reward_amount} 
                    onChange={(e) => setAddForm({...addForm, reward_amount: e.target.value})} 
                    placeholder="奖励金额"
                  />
                </div>
              </div>
              <div>
                <Label>支付日期</Label>
                <Input 
                  type="date" 
                  value={addForm.payment_date} 
                  onChange={(e) => setAddForm({...addForm, payment_date: e.target.value})} 
                />
              </div>
              <div>
                <Label>标签</Label>
                <Input 
                  value={addForm.tags} 
                  onChange={(e) => setAddForm({...addForm, tags: e.target.value})} 
                  placeholder="标签（可选）"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddReward}>创建奖励</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总奖励数</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rewards.length}</div>
            <p className="text-xs text-muted-foreground">
              待审核 {rewards.filter(r => r.status === 'pending').length} 个
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已发放</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rewards.filter(r => r.status === 'paid').length}
            </div>
            <p className="text-xs text-muted-foreground">
              已完成发放的奖励
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审核</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">总金额</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{rewards.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              已发放总金额
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 奖励列表 */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">全部奖励</TabsTrigger>
          <TabsTrigger value="pending">待审核</TabsTrigger>
          <TabsTrigger value="approved">已审核</TabsTrigger>
          <TabsTrigger value="paid">已发放</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>全部奖励记录</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>申请人</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>申请时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.map(reward => (
                    <TableRow key={reward.id}>
                      <TableCell className="font-medium">{reward.userName}</TableCell>
                      <TableCell>{typeLabels[reward.type] || reward.type}</TableCell>
                      <TableCell>¥{reward.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(reward.status)}>
                          {statusLabels[reward.status] || reward.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(reward.createdAt).toLocaleDateString('zh-CN')}</TableCell>
                    </TableRow>
                  ))}
                  {rewards.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">暂无奖励记录</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>待审核奖励</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>申请人</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>原因</TableHead>
                    <TableHead>申请时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.filter(r => r.status === 'pending').map(r => (
                    <TableRow key={`pending_${r.id}`}>
                      <TableCell>{r.userName}</TableCell>
                      <TableCell>{typeLabels[r.type]}</TableCell>
                      <TableCell>¥{r.amount.toLocaleString()}</TableCell>
                      <TableCell className="max-w-xs truncate" title={r.reason}>{r.reason}</TableCell>
                      <TableCell>{new Date(r.createdAt).toLocaleDateString('zh-CN')}</TableCell>
                    </TableRow>
                  ))}
                  {rewards.filter(r => r.status === 'pending').length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">暂无待审核记录</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>已审核奖励</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>申请人</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>原因</TableHead>
                    <TableHead>审核时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.filter(r => r.status === 'approved').map(r => (
                    <TableRow key={`approved_${r.id}`}>
                      <TableCell>{r.userName}</TableCell>
                      <TableCell>{typeLabels[r.type]}</TableCell>
                      <TableCell>¥{r.amount.toLocaleString()}</TableCell>
                      <TableCell className="max-w-xs truncate" title={r.reason}>{r.reason}</TableCell>
                      <TableCell>{new Date(r.updatedAt || r.createdAt).toLocaleDateString('zh-CN')}</TableCell>
                    </TableRow>
                  ))}
                  {rewards.filter(r => r.status === 'approved').length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">暂无已审核记录</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid">
          <Card>
            <CardHeader>
              <CardTitle>已发放奖励</CardTitle>
            </CardHeader>
            <CardContent>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}