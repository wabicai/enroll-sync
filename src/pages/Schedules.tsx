import { useEffect, useState, useMemo } from 'react';
import { ExamEnrollmentDialog } from '@/components/ExamEnrollmentDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Schedule } from '@/types';
import { fetchSchedules, createSchedule, setScheduleStatus, occupySeat, releaseSeat, fetchCourseNamesList, updateSchedule, deleteSchedule } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input as TextInput } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useConfirm } from '@/hooks/useConfirm';
import { useMessage } from '@/hooks/useMessage';

const statusMap: Record<number, string> = {
  1: '草稿',
  2: '已发布',
  3: '已取消',
  4: '已延期',
  5: '已停用',
};

export default function Schedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Schedule>>({});
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [courseOptions, setCourseOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [sortKey, setSortKey] = useState<'date_asc' | 'date_desc' | 'status'>('date_asc');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Schedule | null>(null);
  const [seatAdjust, setSeatAdjust] = useState<number>(1);
  const [notifyChange, setNotifyChange] = useState<boolean>(false);
  const confirm = useConfirm();
  const { info } = useMessage();
  
  // 学员名单对话框状态
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [selectedScheduleForEnrollment, setSelectedScheduleForEnrollment] = useState<Schedule | null>(null);

  // 缓存状态，避免重复加载
  const [dataLoaded, setDataLoaded] = useState(false);
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // 统计信息
  const stats = {
    total: schedules.length,
    published: schedules.filter(s => s.status === 2).length,
    draft: schedules.filter(s => s.status === 1).length,
    cancelled: schedules.filter(s => s.status === 3).length,
    totalSeats: schedules.reduce((sum, s) => sum + (s.total_seats || 0), 0),
    occupiedSeats: schedules.reduce((sum, s) => sum + (s.occupied_seats || 0), 0)
  };

  // 手动刷新数据的函数
  const refreshData = async () => {
    setLoading(true);
    try {
      const [schedulesData, coursesData] = await Promise.all([
        fetchSchedules(),
        fetchCourseNamesList()
      ]);
      setSchedules(schedulesData);
      setCourseOptions(coursesData);
      setDataLoaded(true);
      setCoursesLoaded(true);
    } catch (error) {
      console.error('刷新数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 优化数据加载，避免重复请求
  useEffect(() => {
    if (!dataLoaded) {
      fetchSchedules().then((data) => {
        setSchedules(data);
        setDataLoaded(true);
      });
    }
    if (!coursesLoaded) {
      fetchCourseNamesList().then((data) => {
        setCourseOptions(data);
        setCoursesLoaded(true);
      });
    }
  }, [dataLoaded, coursesLoaded]);

  // URL 持久化 - 初始化
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const cf = sp.get('course') || 'all';
    const sf = (sp.get('status') as any) || 'all';
    const df = sp.get('date') || '';
    const p = Number(sp.get('page') || '1');
    const sk = (sp.get('sort') as any) || 'date_asc';
    setCourseFilter(cf);
    setStatusFilter(sf);
    setDateFilter(df);
    setPage(p);
    setSortKey(sk);
  }, []);

  // URL 持久化 - 写入
  useEffect(() => {
    const sp = new URLSearchParams();
    if (courseFilter !== 'all') sp.set('course', courseFilter);
    if (statusFilter !== 'all') sp.set('status', statusFilter);
    if (dateFilter) sp.set('date', dateFilter);
    if (page !== 1) sp.set('page', String(page));
    if (sortKey !== 'date_asc') sp.set('sort', sortKey);
    const url = `${location.pathname}?${sp.toString()}`;
    window.history.replaceState({}, '', url);
  }, [courseFilter, statusFilter, dateFilter, page, sortKey]);

  // 计算过滤后的数据
  const filtered = useMemo(() => {
    return schedules
      .filter(s => courseFilter === 'all' || s.course_name === courseFilter)
      .filter(s => statusFilter === 'all' ? true : String(s.status) === statusFilter)
      .filter(s => !dateFilter ? true : s.exam_date === dateFilter)
      .sort((a, b) => {
        if (sortKey === 'status') {
          return a.status - b.status;
        }
        const ta = new Date(`${a.exam_date}T${a.exam_time || '00:00'}`).getTime();
        const tb = new Date(`${b.exam_date}T${b.exam_time || '00:00'}`).getTime();
        return sortKey === 'date_asc' ? ta - tb : tb - ta;
      });
  }, [schedules, courseFilter, statusFilter, dateFilter, sortKey]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">考试安排</h1>
          <p className="text-muted-foreground">课程-考试安排分离，支持状态流转与考位管理</p>
        </div>
        <div className="flex items-center gap-2">
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
              <Button>新建安排</Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>新建考试安排</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>课程</Label>
                <Select value={form.course_name ?? ''} onValueChange={(v) => {
                  const found = courseOptions.find(c => c.name === v);
                  setForm({ ...form, course_name: v, course_id: found?.id });
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={coursesLoaded ? "选择课程" : "加载中..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {courseOptions.length > 0 ? (
                      courseOptions.map(c => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-data" disabled>暂无课程数据</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>考试日期</Label>
                  <Input type="date" value={form.exam_date ?? ''} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} />
                </div>
                <div>
                  <Label>考试时间</Label>
                  <Input type="time" value={form.exam_time ?? ''} onChange={(e) => setForm({ ...form, exam_time: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>地点</Label>
                <Input value={form.exam_location ?? ''} onChange={(e) => setForm({ ...form, exam_location: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>总考位</Label>
                  <Input type="number" value={form.total_seats ?? ''} onChange={(e) => setForm({ ...form, total_seats: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>报名截止</Label>
                  <Input type="date" value={form.registration_deadline ?? ''} onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>备注</Label>
                <Input value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!form.course_id || !form.course_name || !form.exam_date || !form.exam_location || !form.total_seats) return;
                const created = await createSchedule(form as Schedule);
                setSchedules(prev => [created, ...prev]);
                setOpen(false);
              }}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* 统计信息卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-blue-600 font-medium">总安排数</div>
          <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-green-600 font-medium">已发布</div>
          <div className="text-2xl font-bold text-green-700">{stats.published}</div>
        </div>
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
          <div className="text-sm text-amber-600 font-medium">草稿</div>
          <div className="text-2xl font-bold text-amber-700">{stats.draft}</div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="text-sm text-purple-600 font-medium">考位使用率</div>
          <div className="text-2xl font-bold text-purple-700">
            {stats.totalSeats > 0 ? Math.round((stats.occupiedSeats / stats.totalSeats) * 100) : 0}%
          </div>
          <div className="text-xs text-purple-600 mt-1">
            {stats.occupiedSeats}/{stats.totalSeats}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>安排列表</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 搜索和筛选区域 */}
          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-56 bg-background">
                  <SelectValue placeholder="按课程筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部课程</SelectItem>
                  {courseOptions.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-40 bg-background">
                  <SelectValue placeholder="按状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="1">草稿</SelectItem>
                  <SelectItem value="2">已发布</SelectItem>
                  <SelectItem value="3">已取消</SelectItem>
                  <SelectItem value="4">已延期</SelectItem>
                  <SelectItem value="5">已停用</SelectItem>
                </SelectContent>
              </Select>
              <TextInput
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-48 bg-background border-border/60 focus:border-primary"
              />
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
                <SelectTrigger className="w-44 bg-background">
                  <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_asc">按日期升序</SelectItem>
                  <SelectItem value="date_desc">按日期降序</SelectItem>
                  <SelectItem value="status">按状态</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(courseFilter !== 'all' || statusFilter !== 'all' || dateFilter || sortKey !== 'date_asc') && (
              <div className="mt-3 text-sm text-muted-foreground">
                显示 {filtered.length} 条结果
                {courseFilter !== 'all' && <span> · 课程: {courseFilter}</span>}
                {statusFilter !== 'all' && <span> · 状态: {statusMap[Number(statusFilter)]}</span>}
                {dateFilter && <span> · 日期: {dateFilter}</span>}
              </div>
            )}
          </div>
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="font-semibold">课程</TableHead>
                  <TableHead className="font-semibold">考试日期</TableHead>
                  <TableHead className="font-semibold">地点</TableHead>
                  <TableHead className="font-semibold">考位</TableHead>
                  <TableHead className="font-semibold">报名截止</TableHead>
                  <TableHead className="font-semibold">状态/操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {filtered
                .slice((page - 1) * pageSize, page * pageSize)
                .map(s => (
                <TableRow
                  key={s.id}
                  className="hover:bg-muted/50 transition-colors duration-200 border-b border-border/40"
                >
                  <TableCell className="py-4">
                    <button
                      className="text-blue-600 hover:text-blue-700 font-medium underline decoration-2 underline-offset-2"
                      onClick={() => {
                        const sp = new URLSearchParams();
                        sp.set('q', s.course_name);
                        window.location.href = `/courses?${sp.toString()}`;
                      }}
                    >
                      {s.course_name}
                    </button>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="font-medium text-foreground">
                      {s.exam_date}
                    </div>
                    {s.exam_time && (
                      <div className="text-sm text-muted-foreground">
                        {s.exam_time}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm">{s.exam_location}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-orange-600">{s.occupied_seats}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="font-medium text-blue-600">{s.total_seats}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {s.total_seats > 0 ? Math.round((s.occupied_seats / s.total_seats) * 100) : 0}% 使用率
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm text-muted-foreground">
                      {s.registration_deadline ?? '-'}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={s.status === 2 ? 'default' : s.status === 3 ? 'destructive' : 'secondary'}
                        className={
                          s.status === 2 ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                          s.status === 3 ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                          s.status === 1 ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' :
                          'bg-gray-100 text-gray-600'
                        }
                      >
                        {statusMap[s.status]}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => { setSelected(s); setDetailOpen(true); }}
                        >
                          详情
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => {
                            setSelectedScheduleForEnrollment(s);
                            setEnrollmentDialogOpen(true);
                          }}
                        >
                          名单
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={async () => {
                            const ok = await confirm({
                              title: '确认删除',
                              message: `您确定要删除 "${s.course_name}" 于 ${s.exam_date} 的考试安排吗？`,
                              okText: '确认删除',
                              cancelText: '取消',
                            });
                            if (!ok) return;
                            const success = await deleteSchedule(s.id);
                            if (success) setSchedules(prev => prev.filter(x => x.id !== s.id));
                          }}
                        >
                          删除
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && schedules.length > 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-muted-foreground text-lg">没有符合条件的考试安排</div>
                      <div className="text-sm text-muted-foreground">
                        请调整筛选条件或清空筛选器
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {schedules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-muted-foreground text-lg">暂无考试安排</div>
                      <div className="text-sm text-muted-foreground">
                        点击"新建安排"开始创建考试安排
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
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(p => Math.max(1, p - 1));
                      }}
                      className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  <span className="px-3 text-sm text-muted-foreground">
                    第 {page} 页，共 {Math.ceil(filtered.length / pageSize)} 页
                  </span>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(p => Math.min(Math.ceil(filtered.length / pageSize), p + 1));
                      }}
                      className={page >= Math.ceil(filtered.length / pageSize) ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
      {/* 安排详情/编辑 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>安排详情</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* 基础信息 */}
              <div className="space-y-2">
                <div className="text-sm font-semibold">基础信息</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>课程</Label>
                    <Select value={selected.course_name || ''} onValueChange={(v) => {
                      const found = courseOptions.find(c => c.name === v);
                      setSelected({ ...selected, course_name: v, course_id: found?.id || selected.course_id });
                    }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={coursesLoaded ? "选择课程" : "加载中..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {courseOptions.length > 0 ? (
                          courseOptions.map(c => (
                            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-data" disabled>暂无课程数据</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>状态</Label>
                    <Select value={String(selected.status)} onValueChange={(v) => setSelected({ ...selected, status: Number(v) as any })}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="选择状态" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">草稿</SelectItem>
                        <SelectItem value="2">已发布</SelectItem>
                        <SelectItem value="3">已取消</SelectItem>
                        <SelectItem value="4">已延期</SelectItem>
                        <SelectItem value="5">已停用</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>考试日期</Label>
                    <Input type="date" value={selected.exam_date} onChange={(e) => setSelected({ ...selected, exam_date: e.target.value })} />
                  </div>
                  <div>
                    <Label>考试时间</Label>
                    <Input type="time" value={selected.exam_time ?? ''} onChange={(e) => setSelected({ ...selected, exam_time: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>地点</Label>
                  <Input value={selected.exam_location} onChange={(e) => setSelected({ ...selected, exam_location: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>报名截止</Label>
                    <Input type="date" value={selected.registration_deadline ?? ''} onChange={(e) => setSelected({ ...selected, registration_deadline: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* 考位管理 */}
              <div className="space-y-2">
                <div className="text-sm font-semibold">考位管理</div>
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <Label>总考位</Label>
                    <Input type="number" value={selected.total_seats} onChange={(e) => setSelected({ ...selected, total_seats: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>已占用</Label>
                    <Input type="number" value={selected.occupied_seats} readOnly />
                  </div>
                  <div>
                    <Label>批量调整(+/-)</Label>
                    <div className="flex gap-2">
                      <Input type="number" value={seatAdjust} onChange={(e) => setSeatAdjust(Number(e.target.value))} />
                      <Button variant="outline" onClick={async () => {
                        const updated = await occupySeat(selected.id, seatAdjust, "批量占用考位");
                        if (updated) setSelected(updated);
                      }}>占用</Button>
                      <Button variant="outline" onClick={async () => {
                        const updated = await releaseSeat(selected.id, seatAdjust, "批量释放考位");
                        if (updated) setSelected(updated);
                      }}>释放</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 备注 */}
              <div className="space-y-2">
                <div className="text-sm font-semibold">备注</div>
                <div>
                  <Label>说明</Label>
                  <Input value={selected.notes ?? ''} onChange={(e) => setSelected({ ...selected, notes: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <input id="notify-change" type="checkbox" checked={notifyChange || !!selected.notify_on_change} onChange={(e) => {
                    setNotifyChange(e.target.checked);
                    setSelected({ ...selected, notify_on_change: e.target.checked });
                  }} />
                  <Label htmlFor="notify-change">发布/变更时发送通知（mock）</Label>
                </div>
              </div>

              {/* 只读元信息 */}
              <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div>创建时间：{selected.createdAt ? new Date(selected.createdAt).toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }) : '暂无数据'}</div>
                <div>更新时间：{selected.updatedAt ? new Date(selected.updatedAt).toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }) : '暂无数据'}</div>
              </div>

              <div className="flex justify-end">
                <Button onClick={async () => {
                  if (!selected) return;
                  const updated = await updateSchedule(selected.id, { ...selected, notify_on_change: notifyChange || selected.notify_on_change });
                  if (updated) {
                    setSchedules(prev => prev.map(x => x.id === selected.id ? updated : x));
                    setDetailOpen(false);
                    if (notifyChange) {
                      info('通知已发送', '已成功发送通知给相关人员（模拟）。');
                    }
                  }
                }}>保存</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* 编辑安排 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑考试安排</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div>
                <Label>课程名称</Label>
                <Input value={editing.course_name} onChange={(e) => setEditing({ ...editing, course_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>考试日期</Label>
                  <Input type="date" value={editing.exam_date} onChange={(e) => setEditing({ ...editing, exam_date: e.target.value })} />
                </div>
                <div>
                  <Label>考试时间</Label>
                  <Input type="time" value={editing.exam_time ?? ''} onChange={(e) => setEditing({ ...editing, exam_time: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>地点</Label>
                <Input value={editing.exam_location} onChange={(e) => setEditing({ ...editing, exam_location: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>总考位</Label>
                  <Input type="number" value={editing.total_seats} onChange={(e) => setEditing({ ...editing, total_seats: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>报名截止</Label>
                  <Input type="date" value={editing.registration_deadline ?? ''} onChange={(e) => setEditing({ ...editing, registration_deadline: e.target.value })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={async () => {
              if (!editing) return;
              const updated = await updateSchedule(editing.id, editing);
              if (updated) {
                setSchedules(prev => prev.map(x => x.id === editing.id ? updated : x));
                setEditOpen(false);
              }
            }}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 学员名单对话框 */}
      {selectedScheduleForEnrollment && (
        <ExamEnrollmentDialog
          open={enrollmentDialogOpen}
          onOpenChange={setEnrollmentDialogOpen}
          scheduleId={selectedScheduleForEnrollment.id}
          scheduleName={selectedScheduleForEnrollment.course_name || '未知课程'}
          examDate={selectedScheduleForEnrollment.exam_date}
        />
      )}
    </div>
  );
}