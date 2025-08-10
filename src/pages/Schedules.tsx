import { useEffect, useState } from 'react';
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

  useEffect(() => {
    fetchSchedules().then(setSchedules);
    fetchCourseNamesList().then(setCourseOptions);
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">考试安排</h1>
          <p className="text-muted-foreground">课程-考试安排分离，支持状态流转与考位管理</p>
        </div>
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
                  <SelectTrigger className="w-full"><SelectValue placeholder="选择课程" /></SelectTrigger>
                  <SelectContent>
                    {courseOptions.map(c => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
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

      <Card>
        <CardHeader>
          <CardTitle>安排列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-3">
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-56">
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
              <SelectTrigger className="w-40"><SelectValue placeholder="按状态筛选" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="1">草稿</SelectItem>
                <SelectItem value="2">已发布</SelectItem>
                <SelectItem value="3">已取消</SelectItem>
                <SelectItem value="4">已延期</SelectItem>
                <SelectItem value="5">已停用</SelectItem>
              </SelectContent>
            </Select>
            <TextInput type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-48" />
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
              <SelectTrigger className="w-44"><SelectValue placeholder="排序" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date_asc">按日期升序</SelectItem>
                <SelectItem value="date_desc">按日期降序</SelectItem>
                <SelectItem value="status">按状态</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>课程</TableHead>
                <TableHead>考试日期</TableHead>
                <TableHead>地点</TableHead>
                <TableHead>考位</TableHead>
                <TableHead>报名截止</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules
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
                })
                .slice((page - 1) * pageSize, page * pageSize)
                .map(s => (
                <TableRow key={s.id}>
                  <TableCell>
                    <button className="text-primary underline" onClick={() => {
                      const sp = new URLSearchParams();
                      sp.set('q', s.course_name);
                      window.location.href = `/courses?${sp.toString()}`;
                    }}>{s.course_name}</button>
                  </TableCell>
                  <TableCell>{s.exam_date} {s.exam_time ?? ''}</TableCell>
                  <TableCell>{s.exam_location}</TableCell>
                  <TableCell>{s.occupied_seats}/{s.total_seats}</TableCell>
                  <TableCell>{s.registration_deadline ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === 2 ? 'default' : s.status === 3 ? 'destructive' : 'secondary'}>
                      {statusMap[s.status]}
                    </Badge>
                      <div className="space-x-2 inline-block ml-2">
                        <Button variant="outline" size="sm" onClick={() => { setSelected(s); setDetailOpen(true); }}>详情</Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={async () => {
                            const ok = confirm(`确认删除该安排：${s.course_name} ${s.exam_date}？`);
                            if (!ok) return;
                            const success = await deleteSchedule(s.id);
                            if (success) setSchedules(prev => prev.filter(x => x.id !== s.id));
                          }}
                        >
                          删除
                        </Button>
                      </div>
                  </TableCell>
                </TableRow>
              ))}
              {schedules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">暂无数据</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {schedules.length > 0 && (
            <div className="py-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(p => Math.max(1, p - 1)); }} />
                  </PaginationItem>
                  <span className="px-3 text-sm text-muted-foreground">{page}</span>
                  <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage(p => p + 1); }} />
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
                    <Select value={selected.course_name} onValueChange={(v) => {
                      const found = courseOptions.find(c => c.name === v);
                      setSelected({ ...selected, course_name: v, course_id: found?.id || selected.course_id });
                    }}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="选择课程" /></SelectTrigger>
                      <SelectContent>
                        {courseOptions.map(c => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
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
                        const updated = await occupySeat(selected.id, seatAdjust);
                        if (updated) setSelected(updated);
                      }}>占用</Button>
                      <Button variant="outline" onClick={async () => {
                        const updated = await releaseSeat(selected.id, seatAdjust);
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
                <div>创建时间：{new Date(selected.createdAt).toLocaleString('zh-CN')}</div>
                <div>更新时间：{new Date(selected.updatedAt).toLocaleString('zh-CN')}</div>
              </div>

              <div className="flex justify-end">
                <Button onClick={async () => {
                  if (!selected) return;
                  const updated = await updateSchedule(selected.id, { ...selected, notify_on_change: notifyChange || selected.notify_on_change });
                  if (updated) {
                    setSchedules(prev => prev.map(x => x.id === selected.id ? updated : x));
                    setDetailOpen(false);
                    if (notifyChange) {
                      alert('已发送通知（mock）');
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
    </div>
  );
}


