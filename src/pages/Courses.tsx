import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Course, Schedule } from '@/types';
import { fetchCourses, toggleCourseStatus, createCourse, updateCourse, deleteCourse, fetchCoursesStatisticsSummary, fetchSchedules } from '@/lib/api';
// TODO: 暂时注释掉导出功能 - import { exportStudents } from '@/lib/api';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Course>>({ status: 1 });
  const [stats, setStats] = useState<{ total: number; active: number; disabled: number } | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Course | null>(null);
  const [relatedSchedules, setRelatedSchedules] = useState<Schedule[]>([]);
  const [relatedAllSchedules, setRelatedAllSchedules] = useState<Schedule[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | '1' | '2'>('1'); // 默认只显示启用状态的课程
  const [sortKey, setSortKey] = useState<'name' | 'updatedAt'>('updatedAt');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // 删除冲突对话框状态
  const [deleteConflictOpen, setDeleteConflictOpen] = useState(false);
  const [conflictCourse, setConflictCourse] = useState<Course | null>(null);

  // 缓存和加载状态
  const [dataLoaded, setDataLoaded] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  // TODO: 暂时注释掉导出状态 - const [exporting, setExporting] = useState(false);

  // 手动刷新数据的函数
  const refreshData = async () => {
    setLoading(true);
    try {
      const [coursesData, statsData] = await Promise.all([
        fetchCourses(),
        fetchCoursesStatisticsSummary()
      ]);
      console.log('📚 课程数据刷新成功:', coursesData);
      console.log('📊 统计数据刷新成功:', statsData);
      setCourses(coursesData);

      // 如果统计API返回空数据，则从课程数据计算统计信息
      if (!statsData || typeof statsData !== 'object') {
        const calculatedStats = {
          total: coursesData.length,
          active: coursesData.filter(c => c.status === 1).length,
          disabled: coursesData.filter(c => c.status === 2).length
        };
        console.log('📊 使用计算的统计数据:', calculatedStats);
        setStats(calculatedStats);
      } else {
        setStats(statsData);
      }

      setDataLoaded(true);
      setStatsLoaded(true);
    } catch (error) {
      console.error('❌ 课程数据刷新失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // TODO: 暂时注释掉导出功能，后续再添加
  // const handleExport = async () => {
  //   try {
  //     setExporting(true);
  //     const result = await exportStudents(); // 注意：这里使用学员导出接口，因为课程相关的数据通常在学员数据中

  //     // 如果返回的是文件URL，直接下载
  //     if (result.file_url) {
  //       const link = document.createElement('a');
  //       link.href = result.file_url;
  //       link.download = result.filename || '课程数据导出.xlsx';
  //       document.body.appendChild(link);
  //       link.click();
  //       document.body.removeChild(link);
  //     } else {
  //       toast({
  //         title: "导出成功",
  //         description: "课程数据已成功导出",
  //       });
  //     }
  //   } catch (error) {
  //     console.error('导出失败:', error);
  //     toast({
  //       title: "导出失败",
  //       description: "导出失败，请重试",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setExporting(false);
  //   }
  // };

  // 优化数据加载，避免重复请求
  useEffect(() => {
    if (!dataLoaded) {
      fetchCourses().then(data => {
        console.log('📚 课程数据加载成功:', data);
        setCourses(data);
        setDataLoaded(true);

        // 同时计算统计信息
        if (!statsLoaded) {
          const calculatedStats = {
            total: data.length,
            active: data.filter(c => c.status === 1).length,
            disabled: data.filter(c => c.status === 2).length
          };
          console.log('📊 计算的统计数据:', calculatedStats);
          setStats(calculatedStats);
          setStatsLoaded(true);
        }
      }).catch(error => {
        console.error('❌ 课程数据加载失败:', error);
      });
    }
  }, [dataLoaded, statsLoaded]);

  // 当打开详情并选中课程时，加载关联安排摘要
  useEffect(() => {
    if (detailOpen && selected) {
      fetchSchedules().then(list => {
        const filtered = list.filter(s => s.course_id === selected.id || s.course_name === selected.course_name);
        // 最近更新/日期靠后优先
        const sorted = filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setRelatedAllSchedules(filtered);
        setRelatedSchedules(sorted.slice(0, 3));
      });
    } else {
      setRelatedSchedules([]);
      setRelatedAllSchedules([]);
    }
  }, [detailOpen, selected]);

  const filtered = courses
    .filter(c => c.course_name && c.course_name.trim() !== '') // 过滤掉空课程名
    .filter(c => (statusFilter === 'all' ? true : c.status === Number(statusFilter)))
    .filter(c =>
      c.course_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.course_code && c.course_code.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortKey === 'name') return a.course_name.localeCompare(b.course_name);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  // 调试信息
  console.log('🔍 课程过滤调试:', {
    totalCourses: courses.length,
    filteredCourses: filtered.length,
    statusFilter,
    search,
    page,
    pageSize
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const s = sp.get('q') || '';
    const st = (sp.get('status') as any) || '1'; // 默认只显示启用状态的课程
    const sk = (sp.get('sort') as any) || 'updatedAt';
    const p = Number(sp.get('page') || '1');
    setSearch(s);
    setStatusFilter(st);
    setSortKey(sk);
    setPage(p);
  }, []);
  useEffect(() => {
    const sp = new URLSearchParams();
    if (search) sp.set('q', search);
    if (statusFilter !== 'all') sp.set('status', statusFilter);
    if (sortKey !== 'updatedAt') sp.set('sort', sortKey);
    if (page !== 1) sp.set('page', String(page));
    const url = `${location.pathname}?${sp.toString()}`;
    window.history.replaceState({}, '', url);
  }, [search, statusFilter, sortKey, page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">课程管理</h1>
          <p className="text-muted-foreground">管理课程基础信息与启停状态</p>
        </div>
        <div className="flex items-center gap-2">
          {/* TODO: 暂时注释掉导出按钮，后续再添加
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? '导出中...' : '导出数据'}
          </Button>
          */}
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? '刷新中...' : '刷新数据'}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>新建课程</Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>新建课程</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>课程名称</Label>
                <Input value={form.course_name ?? ''} onChange={(e) => setForm({ ...form, course_name: e.target.value })} />
              </div>
              <div>
                <Label>课程代码</Label>
                <Input value={form.course_code ?? ''} onChange={(e) => setForm({ ...form, course_code: e.target.value })} />
              </div>
              <div>
                <Label>等级</Label>
                <Input value={form.course_level ?? ''} onChange={(e) => setForm({ ...form, course_level: e.target.value })} />
              </div>
              <div>
                <Label>学费</Label>
                <Input type="number" value={form.standard_fee ?? ''} onChange={(e) => setForm({ ...form, standard_fee: Number(e.target.value) })} />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setForm({ status: 1 });
                }}
              >
                取消
              </Button>
              <Button onClick={async () => {
                if (!form.course_name || form.course_name.trim() === '') {
                  toast({
                    title: "保存失败",
                    description: "请填写课程名称",
                    variant: "destructive",
                  });
                  return;
                }
                try {
                  const created = await createCourse(form as Course);
                  setCourses(prev => [created, ...prev]);
                  setOpen(false);
                  setForm({ status: 1 }); // 重置表单
                  toast({
                    title: "创建成功",
                    description: `课程"${form.course_name}"已创建`,
                  });
                  // 重新计算统计信息
                  const newStats = {
                    total: courses.length + 1,
                    active: courses.filter(c => c.status === 1).length + (form.status === 1 ? 1 : 0),
                    disabled: courses.filter(c => c.status === 2).length + (form.status === 2 ? 1 : 0)
                  };
                  setStats(newStats);
                } catch (error) {
                  console.error('创建失败:', error);
                  toast({
                    title: "创建失败",
                    description: "请检查网络连接或稍后重试",
                    variant: "destructive",
                  });
                }
              }}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>课程列表</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 统计信息卡片 */}
          {stats ? (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-blue-600 font-medium">总课程数</div>
                <div className="text-2xl font-bold text-blue-700">{stats.total || 0}</div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="text-sm text-green-600 font-medium">启用中</div>
                <div className="text-2xl font-bold text-green-700">{stats.active || 0}</div>
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 font-medium">已停用</div>
                <div className="text-2xl font-bold text-gray-700">{stats.disabled || 0}</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 animate-pulse">
                <div className="text-sm text-blue-600 font-medium">总课程数</div>
                <div className="text-2xl font-bold text-blue-700">-</div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200 animate-pulse">
                <div className="text-sm text-green-600 font-medium">启用中</div>
                <div className="text-2xl font-bold text-green-700">-</div>
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 animate-pulse">
                <div className="text-sm text-gray-600 font-medium">已停用</div>
                <div className="text-2xl font-bold text-gray-700">-</div>
              </div>
            </div>
          )}

          {/* 搜索和筛选区域 */}
          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Input
                  className="bg-background border-border/60 focus:border-primary"
                  placeholder="搜索课程名称或代码..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-36 bg-background">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="1">启用</SelectItem>
                  <SelectItem value="2">停用</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
                <SelectTrigger className="w-40 bg-background">
                  <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">按更新时间</SelectItem>
                  <SelectItem value="name">按名称</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(search || statusFilter !== '1' || sortKey !== 'updatedAt') && (
              <div className="mt-3 text-sm text-muted-foreground">
                显示 {filtered.length} 条结果
                {search && <span> · 搜索: "{search}"</span>}
                {statusFilter !== 'all' && <span> · 状态: {statusFilter === '1' ? '启用' : '停用'}</span>}
              </div>
            )}
          </div>
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="font-semibold">课程名称</TableHead>
                  <TableHead className="font-semibold">课程代码</TableHead>
                  <TableHead className="font-semibold">等级</TableHead>
                  <TableHead className="font-semibold">学费</TableHead>
                  <TableHead className="font-semibold">理论/实操</TableHead>
                  <TableHead className="font-semibold">状态/操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map(c => (
                  <TableRow
                    key={c.id}
                    className="hover:bg-muted/50 transition-colors duration-200 border-b border-border/40"
                  >
                    <TableCell className="py-4">
                      <div className="font-medium text-foreground">{c.course_name || '-'}</div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-muted-foreground font-mono text-sm">
                        {c.course_code || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm">{c.course_level || '-'}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      {c.standard_fee ? (
                        <span className="font-medium text-green-600">¥{c.standard_fee}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-blue-600">{c.theory_ratio ?? 0}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-orange-600">{c.practice_ratio ?? 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={c.status === 1 ? 'default' : 'secondary'}
                          className={c.status === 1 ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-600'}
                        >
                          {c.status === 1 ? '启用' : '停用'}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => { setSelected(c); setDetailOpen(true); }}
                          >
                            详情
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={async () => {
                      const ok = confirm(`确认删除课程 ${c.course_name} ？`);
                      if (!ok) return;

                      try {
                        await deleteCourse(c.id);
                        // 删除成功，刷新课程列表
                        const updatedCourses = await fetchCourses();
                        setCourses(updatedCourses);
                      } catch (error: any) {
                        // 检查是否是因为存在考试安排而无法删除
                        if (error.message?.includes('考试安排') || error.message?.includes('无法删除')) {
                          setConflictCourse(c);
                          setDeleteConflictOpen(true);
                        } else {
                          // 其他错误，显示通用错误信息
                          alert(`删除失败: ${error.message || '未知错误'}`);
                        }
                      }
                            }}>
                            删除
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-muted-foreground text-lg">暂无课程数据</div>
                        <div className="text-sm text-muted-foreground">
                          {statusFilter !== 'all' ? '尝试切换状态筛选或' : ''}点击"新建课程"开始添加
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {filtered.length > 0 && (
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

      {/* 编辑课程 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑课程</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div>
                <Label>课程名称</Label>
                <Input value={editing.course_name} onChange={(e) => setEditing({ ...editing, course_name: e.target.value })} />
              </div>
              <div>
                <Label>课程代码</Label>
                <Input value={editing.course_code} onChange={(e) => setEditing({ ...editing, course_code: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>等级</Label>
                  <Input value={editing.course_level ?? ''} onChange={(e) => setEditing({ ...editing, course_level: e.target.value })} />
                </div>
                <div>
                  <Label>标准学费</Label>
                  <Input type="number" value={editing.standard_fee ?? 0} onChange={(e) => setEditing({ ...editing, standard_fee: Number(e.target.value) })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={async () => {
              if (!editing) return;
              const updated = await updateCourse(editing.id, editing);
              if (updated) {
                setCourses(prev => prev.map(x => x.id === editing.id ? updated : x));
                setEditOpen(false);
              }
            }}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 课程详情抽屉 */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-[600px] sm:max-w-none overflow-y-auto">
          <SheetHeader className="pb-6">
            <SheetTitle className="text-xl font-bold">
              课程详情
            </SheetTitle>
            <div className="text-sm text-muted-foreground">
              查看和编辑课程的详细信息
            </div>
          </SheetHeader>
          {selected && (
            <div className="space-y-8 py-2">
              {/* 基础信息卡片 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-blue-900">基础信息</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-blue-700 font-medium">课程名称</Label>
                    <Input
                      value={selected.course_name}
                      onChange={(e) => setSelected({ ...selected, course_name: e.target.value })}
                      className="bg-white border-blue-200 focus:border-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-700 font-medium">课程代码</Label>
                    <Input
                      value={selected.course_code ?? ''}
                      onChange={(e) => setSelected({ ...selected, course_code: e.target.value })}
                      className="bg-white border-blue-200 focus:border-blue-400"
                      placeholder="如：PY001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-700 font-medium">等级</Label>
                    <Input
                      value={selected.course_level ?? ''}
                      onChange={(e) => setSelected({ ...selected, course_level: e.target.value })}
                      className="bg-white border-blue-200 focus:border-blue-400"
                      placeholder="如：初级、中级、高级"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-700 font-medium">状态</Label>
                    <div className="flex items-center gap-2 p-3 bg-white rounded-md border border-blue-200">
                      <Badge
                        variant={selected.status === 1 ? 'default' : 'secondary'}
                        className={selected.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                      >
                        {selected.status === 1 ? '启用' : '停用'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* 价格与占比卡片 */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-green-900">价格与占比</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-green-700 font-medium">标准学费 (¥)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={selected.standard_fee ?? 0}
                        onChange={(e) => setSelected({ ...selected, standard_fee: Number(e.target.value) })}
                        className="bg-white border-green-200 focus:border-green-400 pl-8"
                        placeholder="0"
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 font-medium">¥</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-700 font-medium">理论占比 (%)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={selected.theory_ratio ?? 0}
                        onChange={(e) => setSelected({ ...selected, theory_ratio: Number(e.target.value) })}
                        className="bg-white border-blue-200 focus:border-blue-400 pr-8"
                        placeholder="0"
                        max="100"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 font-medium">%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-orange-700 font-medium">实操占比 (%)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={selected.practice_ratio ?? 0}
                        onChange={(e) => setSelected({ ...selected, practice_ratio: Number(e.target.value) })}
                        className="bg-white border-orange-200 focus:border-orange-400 pr-8"
                        placeholder="0"
                        max="100"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-600 font-medium">%</span>
                    </div>
                  </div>
                </div>
                {/* 占比验证提示 */}
                {(selected.theory_ratio ?? 0) + (selected.practice_ratio ?? 0) !== 100 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-center gap-2 text-amber-700 text-sm">
                      <span className="font-medium">提示:</span>
                      <span>理论占比 + 实操占比应等于100%</span>
                      <span className="font-medium">
                        (当前: {(selected.theory_ratio ?? 0) + (selected.practice_ratio ?? 0)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 内容与标准卡片 */}
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-6 border border-purple-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-purple-900">内容与标准</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-purple-700 font-medium">课程内容</Label>
                    <Input
                      value={selected.description ?? ''}
                      onChange={(e) => setSelected({ ...selected, description: e.target.value })}
                      className="bg-white border-purple-200 focus:border-purple-400"
                      placeholder="描述课程的主要内容和学习目标..."
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label className="text-purple-700 font-medium">报考条件</Label>
                      <Input
                        value={selected.requirements ?? ''}
                        onChange={(e) => setSelected({ ...selected, requirements: e.target.value })}
                        className="bg-white border-purple-200 focus:border-purple-400"
                        placeholder="学历要求、工作经验等..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-purple-700 font-medium">考试/实操要求</Label>
                      <Input
                        value={selected.exam_requirements ?? ''}
                        onChange={(e) => setSelected({ ...selected, exam_requirements: e.target.value })}
                        className="bg-white border-purple-200 focus:border-purple-400"
                        placeholder="考试形式、实操内容等..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-purple-700 font-medium">国家/行业标准</Label>
                      <Input
                        value={selected.national_standard_ref ?? ''}
                        onChange={(e) => setSelected({ ...selected, national_standard_ref: e.target.value })}
                        className="bg-white border-purple-200 focus:border-purple-400"
                        placeholder="相关标准文件编号或名称..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 元信息卡片 */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-gray-700">记录信息</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">创建：</span>
                    <span>{new Date(selected.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">更新：</span>
                    <span>{new Date(selected.updatedAt).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
              </div>

              {/* 关联安排摘要（只读） */}
              <div className="space-y-2">
                <div className="text-sm font-semibold">关联安排</div>
                {relatedSchedules.length === 0 ? (
                  <div className="text-sm text-muted-foreground">暂无关联安排。在“考试安排”页可新建并管理。</div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">最近安排（{relatedSchedules.length}）</div>
                    <div className="grid gap-2">
                      {relatedSchedules.map(s => (
                        <div key={s.id} className="text-sm border rounded-md p-2">
                          <div className="font-medium">{s.exam_date} {s.exam_time ?? ''} · {s.exam_location}</div>
                          <div className="text-muted-foreground">考位：{s.occupied_seats}/{s.total_seats} · 状态：{s.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* 状态计数与快捷筛选 */}
                {relatedAllSchedules.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">按状态统计</div>
                    <div className="flex flex-wrap gap-2">
                      {([1,2,3,4,5] as const).map(st => {
                        const count = relatedAllSchedules.filter(x => x.status === st).length;
                        const label = {1:'草稿',2:'已发布',3:'已取消',4:'已延期',5:'已停用'}[st];
                        return (
                          <Button key={st} variant="outline" size="sm" onClick={() => {
                            const sp = new URLSearchParams();
                            if (selected?.course_name) sp.set('course', selected.course_name);
                            sp.set('status', String(st));
                            window.location.href = `/schedules?${sp.toString()}`;
                          }}>{label} {count}</Button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => {
                    const sp = new URLSearchParams();
                    if (selected?.course_name) sp.set('course', selected.course_name);
                    window.location.href = `/schedules?${sp.toString()}`;
                  }}>前往考试安排</Button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setDetailOpen(false)}
                  className="px-6"
                >
                  取消
                </Button>
                <Button
                  onClick={async () => {
                    if (!selected) return;
                    console.log('🔄 开始保存课程:', selected.course_name);
                    try {
                      const updated = await updateCourse(selected.id, selected);
                      console.log('✅ API返回数据:', updated);
                      if (updated) {
                        setCourses(prev => prev.map(x => x.id === selected.id ? updated : x));
                        setDetailOpen(false);
                        console.log('🎉 显示成功提示');
                        toast({
                          title: "保存成功",
                          description: `课程"${selected.course_name}"已更新`,
                        });
                      } else {
                        console.log('❌ API返回空数据');
                        toast({
                          title: "保存失败",
                          description: "服务器返回空数据",
                          variant: "destructive",
                        });
                      }
                    } catch (error) {
                      console.error('❌ 保存失败:', error);
                      toast({
                        title: "保存失败",
                        description: "请检查网络连接或稍后重试",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="px-6 bg-blue-600 hover:bg-blue-700"
                >
                  保存更改
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 删除冲突对话框 */}
      <Dialog open={deleteConflictOpen} onOpenChange={setDeleteConflictOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              无法删除课程
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              课程 <span className="font-medium">{conflictCourse?.course_name}</span> 存在关联的考试安排，无法直接删除。
            </p>
            <p className="text-sm text-muted-foreground">
              您可以选择：
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setDeleteConflictOpen(false);
                  // 跳转到考试安排页面并过滤该课程
                  const params = new URLSearchParams();
                  if (conflictCourse?.course_name) {
                    params.set('course', conflictCourse.course_name);
                  }
                  navigate(`/schedules?${params.toString()}`);
                }}
              >
                查看相关考试安排
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-muted-foreground"
                disabled
                title="此功能需要后端支持级联删除"
              >
                强制删除课程及相关安排（暂不可用）
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConflictOpen(false)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
