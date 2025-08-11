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
import { Progress } from '@/components/ui/progress';
import { Search, Plus, Filter, MoreHorizontal, Eye, Edit, Trash2, Phone } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { fetchStudents, setStudentStatus, updateStudent, createStudent } from '@/lib/api';
import type { Student, StudentCategory } from '@/types';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useEffect } from 'react';

const categoryLabels = {
  safety_officer: '安全员',
  electrician: '电工',
  welder: '焊工',
  crane_operator: '起重工',
  other: '其他',
};

const statusLabels = {
  pending: '待审核',
  approved: '已审核',
  rejected: '已拒绝',
  graduated: '已毕业',
};

const paymentLabels = {
  unpaid: '未缴费',
  partial: '部分缴费',
  paid: '已缴费',
};

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState<Partial<Student>>({ status: 'pending', paymentStatus: 'unpaid', amount: 0, paidAmount: 0, tags: [] });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);
  const [sortKey, setSortKey] = useState<'createdAt' | 'name' | 'amount' | 'paidAmount'>('createdAt');

  const filteredStudents = students
    .filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.phone.includes(searchTerm) ||
                         student.idCard.includes(searchTerm) ||
                         student.recruiterName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || student.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || student.paymentStatus === paymentFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesPayment;
    })
    .sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'amount':
          return b.amount - a.amount;
        case 'paidAmount':
          return b.paidAmount - a.paidAmount;
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginated = filteredStudents.slice((page - 1) * pageSize, page * pageSize);

  // URL 持久化 - 初始化
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setSearchTerm(sp.get('q') || '');
    setCategoryFilter(sp.get('category') || 'all');
    setStatusFilter(sp.get('status') || 'all');
    setPaymentFilter(sp.get('payment') || 'all');
    setSortKey((sp.get('sort') as any) || 'createdAt');
    setPage(Number(sp.get('page') || '1'));
  }, []);

  // 首次加载真实/模拟学员列表
  useEffect(() => {
    fetchStudents().then(setStudents).catch(() => setStudents([]));
  }, []);

  // URL 持久化 - 写入
  useEffect(() => {
    const sp = new URLSearchParams();
    if (searchTerm) sp.set('q', searchTerm);
    if (categoryFilter !== 'all') sp.set('category', categoryFilter);
    if (statusFilter !== 'all') sp.set('status', statusFilter);
    if (paymentFilter !== 'all') sp.set('payment', paymentFilter);
    if (sortKey !== 'createdAt') sp.set('sort', sortKey);
    if (page !== 1) sp.set('page', String(page));
    const url = `${location.pathname}?${sp.toString()}`;
    window.history.replaceState({}, '', url);
  }, [searchTerm, categoryFilter, statusFilter, paymentFilter, sortKey, page]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      case 'graduated': return 'outline';
      default: return 'outline';
    }
  };

  const getPaymentVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'partial': return 'secondary';
      case 'unpaid': return 'destructive';
      default: return 'outline';
    }
  };

  const getPaymentProgress = (student: Student) => {
    return (student.paidAmount / student.amount) * 100;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">学员管理</h1>
          <p className="text-muted-foreground">
            管理学员信息、审核状态和缴费情况
          </p>
        </div>
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="mr-2 h-4 w-4" />
              添加学员
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加学员</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>姓名</Label>
                  <Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>手机号</Label>
                  <Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>身份证号</Label>
                <Input value={form.idCard ?? ''} onChange={(e) => setForm({ ...form, idCard: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>工种</Label>
                  <Select value={(form.category as string) || 'safety_officer'} onValueChange={(v) => setForm({ ...form, category: v as StudentCategory })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择工种" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([value, label]) => (
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>招生人员ID</Label>
                  <Input value={form.recruiterId ?? ''} onChange={(e) => setForm({ ...form, recruiterId: e.target.value })} />
                </div>
                <div>
                  <Label>招生人员姓名</Label>
                  <Input value={form.recruiterName ?? ''} onChange={(e) => setForm({ ...form, recruiterName: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!form.name || !form.phone || !form.idCard || !form.category || form.amount === undefined) return;
                const created = await createStudent(form as any);
                setStudents(prev => [created, ...prev]);
                setOpenAdd(false);
                setForm({ status: 'pending', paymentStatus: 'unpaid', amount: 0, paidAmount: 0, tags: [] });
              }}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总学员数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              已审核 {students.filter(s => s.status === 'approved').length} 人
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审核</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => s.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              需要审核的学员
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">缴费完成</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => s.paymentStatus === 'paid').length}
            </div>
            <p className="text-xs text-muted-foreground">
              完成缴费的学员
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">收入总额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{students.reduce((sum, s) => sum + s.paidAmount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              已收费用
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle>学员列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索学员..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="工种" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部工种</SelectItem>
                  {Object.entries(categoryLabels).map(([value, label]) => (
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
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="缴费" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部缴费</SelectItem>
                  {Object.entries(paymentLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="排序" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">按创建时间</SelectItem>
                  <SelectItem value="name">按姓名</SelectItem>
                  <SelectItem value="amount">按应收金额</SelectItem>
                  <SelectItem value="paidAmount">按已收金额</SelectItem>
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

      {/* 学员表格 */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学员信息</TableHead>
                <TableHead>工种</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>缴费情况</TableHead>
                <TableHead>招生人员</TableHead>
                <TableHead>标签</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {student.phone}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {student.idCard.replace(/(.{6})(.*)(.{4})/, '$1****$3')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {categoryLabels[student.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(student.status)}>
                      {statusLabels[student.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <Badge variant={getPaymentVariant(student.paymentStatus)}>
                          {paymentLabels[student.paymentStatus]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ¥{student.paidAmount} / ¥{student.amount}
                        </span>
                      </div>
                      <Progress value={getPaymentProgress(student)} className="h-1" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{student.recruiterName}</div>
                      <div className="text-xs text-muted-foreground">招生人员</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {student.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {student.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{student.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(student.createdAt).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelected(student); setDetailOpen(true); }}>
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情/编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={async () => {
                          const next = prompt('修改审核状态(pending/approved/rejected/graduated)', student.status);
                          if (!next) return;
                          const updated = await setStudentStatus(student.id, next as any);
                          const idx = students.findIndex(s => s.id === student.id);
                          const copy = [...students];
                          copy[idx] = updated ? updated : { ...copy[idx], status: next as any };
                          setStudents(copy);
                        }}>
                          修改审核状态
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除学员
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">未找到匹配的学员</p>
            </div>
          )}
          {filteredStudents.length > 0 && (
            <div className="py-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(p => Math.max(1, p - 1)); }} />
                  </PaginationItem>
                  <span className="px-3 text-sm text-muted-foreground">{page} / {totalPages}</span>
                  <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage(p => Math.min(totalPages, p + 1)); }} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 详情/编辑对话框 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>学员详情</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid gap-4">
              {/* 基础信息 */}
              <div className="grid gap-3">
                <div className="text-sm font-semibold">基础信息</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>姓名</Label>
                    <Input value={selected.name} onChange={(e) => setSelected({ ...selected, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>手机号</Label>
                    <Input value={selected.phone} onChange={(e) => setSelected({ ...selected, phone: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>身份证号</Label>
                  <Input value={selected.idCard} onChange={(e) => setSelected({ ...selected, idCard: e.target.value })} />
                </div>
              </div>

              {/* 课程信息 */}
              <div className="grid gap-3">
                <div className="text-sm font-semibold">课程信息</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>工种</Label>
                    <Input value={categoryLabels[selected.category]} readOnly />
                  </div>
                  <div>
                    <Label>标签</Label>
                    <Input value={selected.tags?.join('、') || ''} readOnly />
                  </div>
                </div>
              </div>

              {/* 缴费信息 */}
              <div className="grid gap-3">
                <div className="text-sm font-semibold">缴费信息</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>应收金额(¥)</Label>
                    <Input type="number" value={selected.amount} onChange={(e) => setSelected({ ...selected, amount: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>已缴金额(¥)</Label>
                    <Input type="number" value={selected.paidAmount} onChange={(e) => setSelected({ ...selected, paidAmount: Number(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <Label>缴费状态</Label>
                  <Input value={paymentLabels[selected.paymentStatus]} readOnly />
                </div>
              </div>

              {/* 招生信息 */}
              <div className="grid gap-3">
                <div className="text-sm font-semibold">招生信息</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>招生人员ID</Label>
                    <Input value={selected.recruiterId} onChange={(e) => setSelected({ ...selected, recruiterId: e.target.value })} />
                  </div>
                  <div>
                    <Label>招生人员姓名</Label>
                    <Input value={selected.recruiterName} onChange={(e) => setSelected({ ...selected, recruiterName: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={async () => {
              if (!selected) return;
              const updated = await updateStudent(selected.id, selected);
              if (updated) {
                const idx = students.findIndex(s => s.id === selected.id);
                const copy = [...students];
                copy[idx] = updated;
                setStudents(copy);
                setDetailOpen(false);
              }
            }}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}