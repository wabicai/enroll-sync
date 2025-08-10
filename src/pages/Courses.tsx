import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Course, Schedule } from '@/types';
import { fetchCourses, toggleCourseStatus, createCourse, updateCourse, deleteCourse, fetchCoursesStatisticsSummary, fetchSchedules } from '@/lib/api';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useSearchParams } from 'react-router-dom';

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Course>>({ status: 'active' });
  const [stats, setStats] = useState<{ total: number; active: number; disabled: number } | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Course | null>(null);
  const [relatedSchedules, setRelatedSchedules] = useState<Schedule[]>([]);
  const [relatedAllSchedules, setRelatedAllSchedules] = useState<Schedule[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [sortKey, setSortKey] = useState<'name' | 'updatedAt'>('updatedAt');
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchCourses().then(setCourses);
    fetchCoursesStatisticsSummary().then(setStats);
  }, []);

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
    .filter(c => (statusFilter === 'all' ? true : c.status === statusFilter))
    .filter(c =>
      c.course_name.toLowerCase().includes(search.toLowerCase()) ||
      c.course_code.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortKey === 'name') return a.course_name.localeCompare(b.course_name);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const s = sp.get('q') || '';
    const st = (sp.get('status') as any) || 'all';
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
              <Button onClick={async () => {
                if (!form.course_name || !form.course_code) return;
                const created = await createCourse(form as Course);
                setCourses(prev => [created, ...prev]);
                setOpen(false);
              }}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>课程列表</CardTitle>
        </CardHeader>
        <CardContent>
          {stats && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-sm text-muted-foreground">总数：<span className="font-semibold text-foreground">{stats.total}</span></div>
              <div className="text-sm text-muted-foreground">启用：<span className="font-semibold text-foreground">{stats.active}</span></div>
              <div className="text-sm text-muted-foreground">停用：<span className="font-semibold text-foreground">{stats.disabled}</span></div>
            </div>
          )}
          <div className="mb-4 flex items-center gap-3">
            <Input className="max-w-sm" placeholder="搜索课程名称/代码" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">启用</SelectItem>
                <SelectItem value="disabled">停用</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="排序" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedAt">按更新时间</SelectItem>
                <SelectItem value="name">按名称</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>课程名称</TableHead>
                <TableHead>课程代码</TableHead>
                <TableHead>等级</TableHead>
                <TableHead>学费</TableHead>
                <TableHead>理论/实操</TableHead>
                <TableHead>状态/操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{c.course_name}</TableCell>
                  <TableCell>{c.course_code}</TableCell>
                  <TableCell>{c.course_level ?? '-'}</TableCell>
                  <TableCell>{c.standard_fee ? `¥${c.standard_fee}` : '-'}</TableCell>
                  <TableCell>{c.theory_ratio ?? 0}/{c.practice_ratio ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'active' ? 'default' : 'secondary'}>
                      {c.status === 'active' ? '启用' : '停用'}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => { setSelected(c); setDetailOpen(true); }}>详情</Button>
                    <Button variant="ghost" size="sm" className="text-destructive ml-2" onClick={async () => {
                      const ok = confirm(`确认删除课程 ${c.course_name} ？`);
                      if (!ok) return;
                      const success = await deleteCourse(c.id);
                      if (success) setCourses(prev => prev.filter(x => x.id !== c.id));
                    }}>删除</Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">暂无数据</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
        <SheetContent className="w-[520px] sm:max-w-none overflow-y-auto">
          <SheetHeader>
            <SheetTitle>课程详情</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="space-y-6 py-4">
              {/* 基础信息 */}
              <div className="space-y-2">
                <div className="text-sm font-semibold">基础信息</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>课程名称</Label>
                    <Input value={selected.course_name} onChange={(e) => setSelected({ ...selected, course_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>课程代码</Label>
                    <Input value={selected.course_code} onChange={(e) => setSelected({ ...selected, course_code: e.target.value })} />
                  </div>
                  <div>
                    <Label>等级</Label>
                    <Input value={selected.course_level ?? ''} onChange={(e) => setSelected({ ...selected, course_level: e.target.value })} />
                  </div>
                  <div>
                    <Label>状态</Label>
                    <Input value={selected.status} readOnly />
                  </div>
                </div>
              </div>

              {/* 价格与占比 */}
              <div className="space-y-2">
                <div className="text-sm font-semibold">价格与占比</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>标准学费(¥)</Label>
                    <Input type="number" value={selected.standard_fee ?? 0} onChange={(e) => setSelected({ ...selected, standard_fee: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>理论占比(%)</Label>
                    <Input type="number" value={selected.theory_ratio ?? 0} onChange={(e) => setSelected({ ...selected, theory_ratio: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>实操占比(%)</Label>
                    <Input type="number" value={selected.practice_ratio ?? 0} onChange={(e) => setSelected({ ...selected, practice_ratio: Number(e.target.value) })} />
                  </div>
                </div>
              </div>

              {/* 内容与标准 */}
              <div className="space-y-2">
                <div className="text-sm font-semibold">内容与标准</div>
                <div>
                  <Label>课程内容</Label>
                  <Input value={selected.description ?? ''} onChange={(e) => setSelected({ ...selected, description: e.target.value })} />
                </div>
                <div>
                  <Label>报考条件</Label>
                  <Input value={selected.requirements ?? ''} onChange={(e) => setSelected({ ...selected, requirements: e.target.value })} />
                </div>
                <div>
                  <Label>考试/实操要求</Label>
                  <Input value={selected.exam_requirements ?? ''} onChange={(e) => setSelected({ ...selected, exam_requirements: e.target.value })} />
                </div>
                <div>
                  <Label>国家/行业标准</Label>
                  <Input value={selected.national_standard_ref ?? ''} onChange={(e) => setSelected({ ...selected, national_standard_ref: e.target.value })} />
                </div>
              </div>

              {/* 只读元信息 */}
              <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div>创建时间：{new Date(selected.createdAt).toLocaleString('zh-CN')}</div>
                <div>更新时间：{new Date(selected.updatedAt).toLocaleString('zh-CN')}</div>
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

              <div className="flex justify-end">
                <Button onClick={async () => {
                  if (!selected) return;
                  const updated = await updateCourse(selected.id, selected);
                  if (updated) {
                    setCourses(prev => prev.map(x => x.id === selected.id ? updated : x));
                    setDetailOpen(false);
                  }
                }}>保存</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}


