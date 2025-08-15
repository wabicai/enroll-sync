import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, Filter, MoreHorizontal, Check, X, UserCheck, UserX } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { fetchStudents, createStudent, setStudentStatus, updateStudent } from '@/lib/api';
import type { Student } from '@/types';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const statusLabels = {
  enrolled: '已报名',
  studying: '在读',
  graduated: '已毕业',
  dropped: '退学',
  suspended: '休学'
};

const statusVariants = {
  enrolled: 'secondary',
  studying: 'default', 
  graduated: 'default',
  dropped: 'destructive',
  suspended: 'outline'
} as const;

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [openAdd, setOpenAdd] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 初始化从后端拉取学员列表
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        const data = await fetchStudents();
        setStudents(data || []);
      } catch (error) {
        console.error('Failed to fetch students:', error);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, []);

  const [addForm, setAddForm] = useState<Partial<Student>>({
    status: 'enrolled',
    paymentStatus: 'unpaid'
  });

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (studentId: string, newStatus: Student['status']) => {
    try {
      const updated = await setStudentStatus(studentId, newStatus);
      if (updated) {
        setStudents(prev => prev.map(s => s.id === studentId ? updated : s));
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleAddStudent = async () => {
    if (!addForm.name || !addForm.email || !addForm.phone) {
      alert('请填写必填字段');
      return;
    }

    try {
      const created = await createStudent({
        name: addForm.name!,
        email: addForm.email!,
        phone: addForm.phone!,
        course: addForm.course || '',
        status: (addForm.status as Student['status']) || 'enrolled',
        paymentStatus: (addForm.paymentStatus as Student['paymentStatus']) || 'unpaid',
        enrollmentDate: addForm.enrollmentDate || new Date().toISOString().split('T')[0],
        tuitionFee: addForm.tuitionFee || 0,
        paidAmount: addForm.paidAmount || 0,
        avatar: addForm.avatar,
        idCard: addForm.idCard
      } as Omit<Student, 'id' | 'createdAt' | 'updatedAt'>);
      
      setStudents(prev => [created, ...prev]);
      setOpenAdd(false);
      setAddForm({ status: 'enrolled', paymentStatus: 'unpaid' });
    } catch (error) {
      console.error('创建学员失败:', error);
      alert('创建学员失败，请重试');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">学员管理</h1>
          <p className="text-muted-foreground">管理学员信息、学习状态和缴费情况</p>
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
                  <Label>姓名 *</Label>
                  <Input 
                    value={addForm.name || ''} 
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} 
                    placeholder="学员姓名"
                  />
                </div>
                <div>
                  <Label>手机号 *</Label>
                  <Input 
                    value={addForm.phone || ''} 
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} 
                    placeholder="手机号码"
                  />
                </div>
              </div>
              <div>
                <Label>邮箱 *</Label>
                <Input 
                  value={addForm.email || ''} 
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} 
                  placeholder="邮箱地址"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>课程</Label>
                  <Input 
                    value={addForm.course || ''} 
                    onChange={(e) => setAddForm({ ...addForm, course: e.target.value })} 
                    placeholder="所学课程"
                  />
                </div>
                <div>
                  <Label>状态</Label>
                  <Select value={addForm.status || 'enrolled'} onValueChange={(v) => setAddForm({ ...addForm, status: v as Student['status'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>学费</Label>
                  <Input 
                    type="number" 
                    value={addForm.tuitionFee || ''} 
                    onChange={(e) => setAddForm({ ...addForm, tuitionFee: Number(e.target.value) })} 
                    placeholder="学费金额"
                  />
                </div>
                <div>
                  <Label>已付金额</Label>
                  <Input 
                    type="number" 
                    value={addForm.paidAmount || ''} 
                    onChange={(e) => setAddForm({ ...addForm, paidAmount: Number(e.target.value) })} 
                    placeholder="已付金额"
                  />
                </div>
                <div>
                  <Label>报名日期</Label>
                  <Input 
                    type="date" 
                    value={addForm.enrollmentDate || ''} 
                    onChange={(e) => setAddForm({ ...addForm, enrollmentDate: e.target.value })} 
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddStudent}>添加学员</Button>
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
              在读 {students.filter(s => s.status === 'studying').length} 人
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已毕业</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => s.status === 'graduated').length}
            </div>
            <p className="text-xs text-muted-foreground">完成学业的学员</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">新报名</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => s.status === 'enrolled').length}
            </div>
            <p className="text-xs text-muted-foreground">待开课的学员</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">收入总计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{students.reduce((sum, s) => sum + (s.paidAmount || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">已收取的学费</p>
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
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                更多筛选
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 学员表格 */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学员</TableHead>
                <TableHead>课程</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>缴费状态</TableHead>
                <TableHead>联系方式</TableHead>
                <TableHead>报名时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={student.avatar} alt={student.name} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">{student.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{student.course || '未指定'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[student.status] as any}>
                      {statusLabels[student.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>¥{(student.paidAmount || 0).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        / ¥{(student.tuitionFee || 0).toLocaleString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{student.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(student.enrollmentDate || student.createdAt).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {student.status === 'enrolled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(student.id, 'studying')}
                          className="h-8 w-8 p-0"
                        >
                          <UserCheck className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {student.status === 'studying' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(student.id, 'graduated')}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelected(student); setDetailOpen(true); }}>
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(student.id, 'suspended')}>
                            暂停学习
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(student.id, 'dropped')}>
                            标记退学
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    未找到匹配的学员
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 详情对话框 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>学员详情</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid gap-2 text-sm">
              <div>姓名：{selected.name}</div>
              <div>邮箱：{selected.email}</div>
              <div>手机号：{selected.phone}</div>
              <div>课程：{selected.course || '未指定'}</div>
              <div>状态：{statusLabels[selected.status]}</div>
              <div>学费：¥{(selected.tuitionFee || 0).toLocaleString()}</div>
              <div>已付：¥{(selected.paidAmount || 0).toLocaleString()}</div>
              <div>报名时间：{new Date(selected.enrollmentDate || selected.createdAt).toLocaleString('zh-CN')}</div>
              <div>创建时间：{new Date(selected.createdAt).toLocaleString('zh-CN')}</div>
              <div>更新时间：{new Date(selected.updatedAt).toLocaleString('zh-CN')}</div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}