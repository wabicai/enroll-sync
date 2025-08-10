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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, Filter, MoreHorizontal, Check, X, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockUsers } from '@/mock';
import { createUser, updateUserStatus, deleteUser } from '@/lib/api';
import type { User, UserRole, RecruitmentIdentity } from '@/types';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const roleLabels = {
  general_manager: '总经理',
  finance: '财务人员',
  exam_admin: '考务管理',
  system_admin: '系统管理员',
};

const identityLabels = {
  part_time: '兼职招生',
  full_time: '全职招生',
  team_leader: '团队负责人',
  regional_manager: '区域经理',
  partner: '合作伙伴',
};

const statusLabels = {
  active: '正常',
  inactive: '停用',
  pending: '待审核',
};

export default function Users() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [openAdd, setOpenAdd] = useState(false);
  const [addForm, setAddForm] = useState<Partial<User>>({ role: 'system_admin', status: 'pending' });
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  const handleApprove = async (userId: string) => {
    const updated = await updateUserStatus(userId, 'active');
    if (updated) {
      setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    }
  };

  const handleReject = async (userId: string) => {
    const updated = await updateUserStatus(userId, 'inactive');
    if (updated) {
      setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
          <p className="text-muted-foreground">
            管理招生人员和系统用户
          </p>
        </div>
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="mr-2 h-4 w-4" />
              添加用户
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加用户</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>姓名</Label>
                <Input value={addForm.name ?? ''} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>邮箱</Label>
                  <Input value={addForm.email ?? ''} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
                </div>
                <div>
                  <Label>手机号</Label>
                  <Input value={addForm.phone ?? ''} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>角色</Label>
                  <Select value={(addForm.role as string) || 'system_admin'} onValueChange={(v) => setAddForm({ ...addForm, role: v as UserRole })}>
                    <SelectTrigger>
                      <SelectValue placeholder="角色" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>招生身份（可选）</Label>
                  <Select
                    value={addForm.identity ? String(addForm.identity) : 'none'}
                    onValueChange={(v) =>
                      setAddForm({
                        ...addForm,
                        identity: v === 'none' ? undefined : (v as RecruitmentIdentity),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择身份（可不选）" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无</SelectItem>
                      {Object.entries(identityLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!addForm.name || !addForm.email || !addForm.phone || !addForm.role) return;
                const created = await createUser({
                  name: addForm.name!,
                  email: addForm.email!,
                  phone: addForm.phone!,
                  role: addForm.role as UserRole,
                  status: (addForm.status as any) || 'pending',
                  identity: addForm.identity as RecruitmentIdentity | undefined,
                  avatar: addForm.avatar,
                } as Omit<User, 'id' | 'createdAt' | 'updatedAt'>);
                setUsers(prev => [created, ...prev]);
                setOpenAdd(false);
                setAddForm({ role: 'system_admin', status: 'pending' });
              }}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              活跃用户 {users.filter(u => u.status === 'active').length} 人
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审核</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              需要审核的用户
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">招生人员</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.identity).length}
            </div>
            <p className="text-xs text-muted-foreground">
              有招生身份的用户
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">管理员</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => ['general_manager', 'finance', 'exam_admin'].includes(u.role)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              具有管理权限
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索用户..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部角色</SelectItem>
                  {Object.entries(roleLabels).map(([value, label]) => (
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
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                更多筛选
              </Button>
              <Button variant="outline" onClick={() => { window.location.href = '/exports'; }}>导出</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 用户表格 */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>招生身份</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>联系方式</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {roleLabels[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.identity ? (
                      <Badge variant="secondary">
                        {identityLabels[user.identity]}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(user.status)}>
                      {statusLabels[user.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{user.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(user.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(user.id)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelected(user); setDetailOpen(true); }}>
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => {
                            const ok = confirm(`确认删除用户 ${user.name} ?`);
                            if (!ok) return;
                            const success = await deleteUser(user.id);
                            if (success) setUsers(prev => prev.filter(u => u.id !== user.id));
                          }}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除用户
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">未找到匹配的用户</p>
            </div>
          )}
          {filteredUsers.length > 0 && (
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

      {/* 详情对话框 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>用户详情</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid gap-2 text-sm">
              <div>姓名：{selected.name}</div>
              <div>邮箱：{selected.email}</div>
              <div>手机号：{selected.phone}</div>
              <div>角色：{roleLabels[selected.role]}</div>
              <div>身份：{selected.identity ? identityLabels[selected.identity] : '-'}</div>
              <div>状态：{statusLabels[selected.status]}</div>
              <div>创建时间：{new Date(selected.createdAt).toLocaleString('zh-CN')}</div>
              <div>更新时间：{new Date(selected.updatedAt).toLocaleString('zh-CN')}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}