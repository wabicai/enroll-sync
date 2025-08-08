import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { fetchExportRecords } from '@/lib/api';
import type { ExportRecord } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Exports() {
  const [records, setRecords] = useState<ExportRecord[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  useEffect(() => {
    fetchExportRecords().then(setRecords);
  }, []);

  // 初始化 URL 参数
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setTypeFilter(sp.get('type') || 'all');
    setFromDate(sp.get('from') || '');
    setToDate(sp.get('to') || '');
  }, []);

  // 将筛选写回 URL，便于分享/刷新保持
  useEffect(() => {
    const sp = new URLSearchParams();
    if (typeFilter !== 'all') sp.set('type', typeFilter);
    if (fromDate) sp.set('from', fromDate);
    if (toDate) sp.set('to', toDate);
    const url = `${location.pathname}?${sp.toString()}`;
    window.history.replaceState({}, '', url);
  }, [typeFilter, fromDate, toDate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">导出中心</h1>
          <p className="text-muted-foreground">统一导出奖励、工资、学员清单</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => alert('已提交奖励导出任务（mock）')}>导出奖励</Button>
          <Button onClick={() => alert('已提交工资导出任务（mock）')}>导出工资</Button>
          <Button onClick={() => alert('已提交学员导出任务（mock）')}>导出学员</Button>
        </div>
      </div>

      {/* 筛选区：与奖励页透传的参数一致 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="类型" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="reward">奖励</SelectItem>
                <SelectItem value="payroll">工资</SelectItem>
                <SelectItem value="students">学员</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-44" />
            <span className="text-sm text-muted-foreground">至</span>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-44" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>导出记录</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>开始时间</TableHead>
                <TableHead>完成时间</TableHead>
                <TableHead>下载</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records
                .filter(r => typeFilter === 'all' ? true : r.type === typeFilter)
                .filter(r => fromDate ? r.createdAt.slice(0,10) >= fromDate : true)
                .filter(r => toDate ? r.createdAt.slice(0,10) <= toDate : true)
                .map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.type}</TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell>{r.createdAt}</TableCell>
                  <TableCell>{r.finishedAt ?? '-'}</TableCell>
                  <TableCell>
                    {r.fileUrl ? (
                      <a className="text-primary" href={r.fileUrl}>下载</a>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


