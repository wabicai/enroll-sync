import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Check,
  X,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  fetchUsers,
  createUser,
  updateUserStatus,
  deleteUser,
} from "@/lib/api";
import type { User, UserRole, RecruitmentIdentity } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// 招生人员角色类型映射 (对应后端 RoleTypeEnum)
const recruitmentRoleLabels = {
  1: "全职招生员",
  2: "兼职招生员",
  3: "自由招生员",
  4: "渠道招生员",
  5: "团队负责人",
  6: "总经理",
  7: "考务组",
  8: "财务",
};

// 管理员角色标签 (用于显示，但不在主列表中管理)
const adminRoleLabels = {
  general_manager: "总经理",
  finance: "财务人员",
  exam_admin: "考务管理",
  system_admin: "系统管理员",
};

const statusLabels = {
  active: "正常",
  inactive: "停用",
  pending: "待审核",
  // 兼容后端数字状态（备用）
  1: "正常",
  2: "待审核",
  3: "已拒绝",
  4: "已禁用",
};

// 安全的日期格式化函数
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("zh-CN");
  } catch {
    return "-";
  }
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  // 初始化从后端拉取用户列表
  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openAdd, setOpenAdd] = useState(false);
  const [addForm, setAddForm] = useState<Partial<User>>({
    role_type: 2,
    status: "pending",
  });
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.real_name && user.real_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.phone && user.phone.includes(searchTerm));
    const matchesRole =
      roleFilter === "all" || user.role_type?.toString() === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleApprove = async (userId: string) => {
    const updated = await updateUserStatus(userId, "active");
    if (updated) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    }
  };

  const handleReject = async (userId: string) => {
    const updated = await updateUserStatus(userId, "inactive");
    if (updated) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">招生人员管理</h1>
          <p className="text-muted-foreground">
            管理招生团队成员，包括全职、兼职、负责人等各类招生人员
          </p>
        </div>
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="mr-2 h-4 w-4" />
              添加招生人员
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加招生人员</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>姓名</Label>
                <Input
                  value={addForm.name ?? ""}
                  onChange={(e) =>
                    setAddForm({ ...addForm, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>邮箱</Label>
                  <Input
                    value={addForm.email ?? ""}
                    onChange={(e) =>
                      setAddForm({ ...addForm, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>手机号</Label>
                  <Input
                    value={addForm.phone ?? ""}
                    onChange={(e) =>
                      setAddForm({ ...addForm, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>招生身份</Label>
                  <Select
                    value={(addForm.role_type as string) || "2"}
                    onValueChange={(v) =>
                      setAddForm({ ...addForm, role_type: parseInt(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择招生身份" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(recruitmentRoleLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>邀请码（可选）</Label>
                  <Input
                    value={addForm.invitation_code ?? ""}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        invitation_code: e.target.value,
                      })
                    }
                    placeholder="输入邀请码（可选）"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={async () => {
                  if (
                    !addForm.real_name ||
                    !addForm.email ||
                    !addForm.phone ||
                    !addForm.role_type
                  )
                    return;
                  const created = await createUser({
                    name: addForm.name!,
                    email: addForm.email!,
                    phone: addForm.phone!,
                    role_type: addForm.role_type as number,
                    status: (addForm.status as any) || "pending",
                    invitation_code: addForm.invitation_code,
                    avatar: addForm.avatar,
                  } as Omit<User, "id" | "createdAt" | "updatedAt">);
                  setUsers((prev) => [created, ...prev]);
                  setOpenAdd(false);
                  setAddForm({ role_type: 2, status: "pending" });
                }}
              >
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">招生人员总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              活跃人员 {users.filter((u) => u.status === "active").length} 人
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审核</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">需要审核的人员</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">全职招生</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                users.filter((u) => u.role_type === 1 || u.role_type === 5)
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">全职招生人员</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">兼职招生</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                users.filter((u) => u.role_type === 2 || u.role_type === 3)
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">兼职招生人员</p>
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
                  placeholder="搜索招生人员..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="招生身份" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部身份</SelectItem>
                  {Object.entries(recruitmentRoleLabels).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                更多筛选
              </Button>
              {/* TODO: 暂时注释掉导出功能，后续再添加
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = "/exports";
                }}
              >
                导出数据
              </Button>
              */}
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
                <TableHead>招生人员</TableHead>
                <TableHead>招生身份</TableHead>
                <TableHead>邀请码</TableHead>
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
                        <AvatarImage src={user.avatar} alt={user.real_name || '用户'} />
                        <AvatarFallback>{(user.real_name || '用户').charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.real_name || '未设置姓名'}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {user.role_type
                        ? recruitmentRoleLabels[user.role_type]
                        : user.roles && user.roles.length > 0
                        ? user.roles[0]
                        : "未设置"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {user.invitation_code || "-"}
                    </span>
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
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.status === "pending" && (
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelected(user);
                          setEditForm({
                            real_name: user.real_name,
                            phone: user.phone,
                            role_type: user.role_type,
                            status: user.status,
                            invitation_code: user.invitation_code,
                          });
                          setDetailOpen(true);
                        }}
                      >
                        详情
                      </Button>
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
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.max(1, p - 1));
                      }}
                    />
                  </PaginationItem>
                  <span className="px-3 text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.min(totalPages, p + 1));
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 用户编辑对话框 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑用户信息</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="real_name">真实姓名</Label>
                <Input
                  id="real_name"
                  value={editForm.real_name || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, real_name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">手机号</Label>
                <Input
                  id="phone"
                  value={editForm.phone || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role_type">招生身份</Label>
                <Select
                  value={editForm.role_type?.toString() || ""}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, role_type: parseInt(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择招生身份" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(recruitmentRoleLabels).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">状态</Label>
                <Select
                  value={editForm.status || ""}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, status: v as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">正常</SelectItem>
                    <SelectItem value="pending">待审核</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invitation_code">邀请码</Label>
                <Input
                  id="invitation_code"
                  value={editForm.invitation_code || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, invitation_code: e.target.value })
                  }
                  placeholder="输入邀请码（可选）"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <div>创建时间：{formatDate(selected.createdAt)}</div>
                <div>更新时间：{formatDate(selected.updatedAt)}</div>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={async () => {
                if (!selected) return;
                const ok = confirm(`确认删除用户 ${selected.real_name || selected.email} ?`);
                if (!ok) return;
                try {
                  const success = await deleteUser(selected.id);
                  if (success) {
                    setUsers((prev) => prev.filter((u) => u.id !== selected.id));
                    setDetailOpen(false);
                  }
                } catch (error) {
                  console.error("删除用户失败:", error);
                  alert("删除用户失败，请重试");
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除用户
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDetailOpen(false)}
              >
                取消
              </Button>
              <Button
                onClick={async () => {
                  if (!selected) return;
                  try {
                    const updated = await updateUser(selected.id, editForm);
                    if (updated) {
                      setUsers((prev) =>
                        prev.map((u) => (u.id === selected.id ? { ...u, ...editForm } : u))
                      );
                      setDetailOpen(false);
                    }
                  } catch (error) {
                    console.error("更新用户失败:", error);
                    alert("更新用户失败，请重试");
                  }
                }}
              >
                保存
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
