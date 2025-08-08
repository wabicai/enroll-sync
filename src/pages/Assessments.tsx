import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockAssessments } from '@/mock';
import type { Assessment, RecruitmentIdentity } from '@/types';

export default function Assessments() {
  const [identity, setIdentity] = useState<'all' | RecruitmentIdentity>('all');
  const [period, setPeriod] = useState<'all' | string>('all');

  const periods = useMemo(() => {
    const set = new Set(mockAssessments.map(a => a.period));
    return Array.from(set);
  }, []);

  const list = useMemo(() => {
    return mockAssessments.filter(a =>
      (identity === 'all' || a.identity === identity) &&
      (period === 'all' || a.period === period)
    );
  }, [identity, period]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">考核管理</h1>
          <p className="text-muted-foreground">查看各身份的考核达成与预警</p>
        </div>
        <div className="flex gap-3">
          <Select value={identity} onValueChange={(v) => setIdentity(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="身份" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部身份</SelectItem>
              <SelectItem value="part_time">兼职</SelectItem>
              <SelectItem value="full_time">全职</SelectItem>
              <SelectItem value="team_leader">负责人</SelectItem>
              <SelectItem value="regional_manager">区域经理</SelectItem>
              <SelectItem value="partner">渠道合伙人</SelectItem>
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={(v) => setPeriod(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="周期" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部周期</SelectItem>
              {periods.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>考核列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>身份</TableHead>
                <TableHead>周期</TableHead>
                <TableHead>招生</TableHead>
                <TableHead>发展</TableHead>
                <TableHead>目标</TableHead>
                <TableHead>得分</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map(a => (
                <TableRow key={a.id}>
                  <TableCell>{a.userName}</TableCell>
                  <TableCell>{a.identity}</TableCell>
                  <TableCell>{a.period}</TableCell>
                  <TableCell>{a.recruitmentCount}</TableCell>
                  <TableCell>{a.developmentCount}</TableCell>
                  <TableCell>{a.target}</TableCell>
                  <TableCell>{a.score}</TableCell>
                  <TableCell>{a.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


