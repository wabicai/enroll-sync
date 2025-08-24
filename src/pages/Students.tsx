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
import { useMessage } from '@/hooks/useMessage';

const statusLabels = {
  1: '正常',
  2: '已退学',
  3: '已毕业'
};

const statusVariants = {
  1: 'default',
  2: 'destructive',
  3: 'secondary'
} as const;

const genderLabels = {
  1: '男',
  2: '女'
};

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [openAdd, setOpenAdd] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const { error } = useMessage();
  
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
    status: 1,
    gender: 1
  });

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.phone.includes(searchTerm) ||
                         (student.student_number && student.student_number.includes(searchTerm));
    const matchesStatus = statusFilter === 'all' || student.status.toString() === statusFilter;

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
    if (!addForm.name || !addForm.phone) {
      error('信息不完整', '姓名和手机号是必填项，请填写完整。');
      return;
    }

    try {
      const created = await createStudent({
        student_number: addForm.student_number || '',
        name: addForm.name!,
        phone: addForm.phone!,
        gender: addForm.gender || 1,
        education: addForm.education || '',
        major: addForm.major,
        work_unit: addForm.work_unit,
        job_position: addForm.job_position,
        work_years: addForm.work_years,
        employment_intention: addForm.employment_intention,
        notes: addForm.notes,
        status: addForm.status || 1,
        created_by: 1, // 默认创建者ID
        last_modified_by: 1
      } as Omit<Student, 'id' | 'createdAt' | 'updatedAt'>);

      setStudents(prev => [created, ...prev]);
      setOpenAdd(false);
      setAddForm({ status: 1, gender: 1 });
    } catch (error) {
      console.error('创建学员失败:', error);
      error('创建失败', '创建学员时发生错误，请检查网络连接或稍后重试。');
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
                  <Label>学员编号</Label>
                  <Input
                    value={addForm.student_number || ''}
                    onChange={(e) => setAddForm({ ...addForm, student_number: e.target.value })}
                    placeholder="学员编号"
                  />
                </div>
                <div>
                  <Label>姓名 *</Label>
                  <Input
                    value={addForm.name || ''}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="学员姓名"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>手机号 *</Label>
                  <Input
                    value={addForm.phone || ''}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="手机号码"
                  />
                </div>
                <div>
                  <Label>性别</Label>
                  <Select value={addForm.gender?.toString() || '1'} onValueChange={(v) => setAddForm({ ...addForm, gender: Number(v) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(genderLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>学历</Label>
                  <Input
                    value={addForm.education || ''}
                    onChange={(e) => setAddForm({ ...addForm, education: e.target.value })}
                    placeholder="学历"
                  />
                </div>
                <div>
                  <Label>专业</Label>
                  <Input
                    value={addForm.major || ''}
                    onChange={(e) => setAddForm({ ...addForm, major: e.target.value })}
                    placeholder="专业"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>工作单位</Label>
                  <Input
                    value={addForm.work_unit || ''}
                    onChange={(e) => setAddForm({ ...addForm, work_unit: e.target.value })}
                    placeholder="工作单位"
                  />
                </div>
                <div>
                  <Label>职位</Label>
                  <Input
                    value={addForm.job_position || ''}
                    onChange={(e) => setAddForm({ ...addForm, job_position: e.target.value })}
                    placeholder="职位"
                  />
                </div>
              </div>
              <div>
                <Label>备注</Label>
                <Input
                  value={addForm.notes || ''}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  placeholder="备注信息"
                />
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
              正常 {students.filter(s => s.status === 1).length} 人
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已毕业</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => s.status === 3).length}
            </div>
            <p className="text-xs text-muted-foreground">完成学业的学员</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已退学</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => s.status === 2).length}
            </div>
            <p className="text-xs text-muted-foreground">退学的学员</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃学员</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => s.status === 1).length}
            </div>
            <p className="text-xs text-muted-foreground">正常状态的学员</p>
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
                <TableHead>状态</TableHead>
                <TableHead>联系方式</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {student.student_number} | {genderLabels[student.gender]} | {student.education}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[student.status] as any}>
                      {statusLabels[student.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{student.phone}</div>
                      {student.work_unit && (
                        <div className="text-xs text-muted-foreground">{student.work_unit}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(student.createdAt).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelected(student); setDetailOpen(true); }}
                      >
                        详情
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
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
              <div>学员编号：{selected.student_number}</div>
              <div>姓名：{selected.name}</div>
              <div>手机号：{selected.phone}</div>
              <div>性别：{genderLabels[selected.gender]}</div>
              <div>学历：{selected.education}</div>
              {selected.major && <div>专业：{selected.major}</div>}
              {selected.work_unit && <div>工作单位：{selected.work_unit}</div>}
              {selected.job_position && <div>职位：{selected.job_position}</div>}
              {selected.work_years && <div>工作年限：{selected.work_years}年</div>}
              {selected.employment_intention && <div>就业意向：{selected.employment_intention}</div>}
              {selected.notes && <div>备注：{selected.notes}</div>}
              <div>状态：{statusLabels[selected.status]}</div>
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