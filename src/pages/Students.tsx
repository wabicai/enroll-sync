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
import { Search, Plus, Filter, MoreHorizontal, Eye, Edit, Trash2, Phone, Mail } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockStudents } from '@/mock';
import type { Student, StudentCategory } from '@/types';

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
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.phone.includes(searchTerm) ||
                         student.idCard.includes(searchTerm) ||
                         student.recruiterName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || student.category === categoryFilter;
    const matchesStatus = !statusFilter || student.status === statusFilter;
    const matchesPayment = !paymentFilter || student.paymentStatus === paymentFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesPayment;
  });

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
        <Button className="bg-primary hover:bg-primary-hover">
          <Plus className="mr-2 h-4 w-4" />
          添加学员
        </Button>
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
                  <SelectItem value="">全部工种</SelectItem>
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
                  <SelectItem value="">全部状态</SelectItem>
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
                  <SelectItem value="">全部缴费</SelectItem>
                  {Object.entries(paymentLabels).map(([value, label]) => (
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
              {filteredStudents.map((student) => (
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
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          编辑信息
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Phone className="mr-2 h-4 w-4" />
                          联系学员
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          缴费提醒
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
        </CardContent>
      </Card>
    </div>
  );
}