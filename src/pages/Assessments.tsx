import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { fetchAssessmentsMonthly, calculateAssessments, fetchAssessmentWarnings } from '@/lib/api';
import type { RecruitmentIdentity } from '@/types';

export default function Assessments() {
  const [identity, setIdentity] = useState<'all' | RecruitmentIdentity>('all');
  const [period, setPeriod] = useState<string>('2025-01');
  const [list, setList] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);

  useEffect(() => {
    fetchAssessmentsMonthly({ period, identity: identity === 'all' ? undefined : identity }).then((res: any) => setList(res.items || []));
    fetchAssessmentWarnings(period, identity === 'all' ? undefined : identity).then((res: any) => setWarnings(res.items || []));
  }, [period, identity]);

  const periods = useMemo(() => {
    // 简单生成年份月份集合（近12个月）
    const now = new Date();
    const arr: string[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      arr.push(ym);
    }
    return arr;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">考核管理</h1>
          <p className="text-muted-foreground">查看各身份的考核达成与预警</p>
        </div>
        <div className="flex gap-3 items-center">
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
              {periods.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => calculateAssessments(period).then(() => {
            // refresh
            fetchAssessmentsMonthly({ period, identity: identity === 'all' ? undefined : identity }).then((res: any) => setList(res.items || []));
          })}>重新计算</Button>
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
                  <TableCell>{a.user_name || a.userName}</TableCell>
                  <TableCell>{a.identity}</TableCell>
                  <TableCell>{a.period}</TableCell>
                  <TableCell>{a.recruitment_count ?? a.recruitmentCount}</TableCell>
                  <TableCell>{a.development_count ?? a.developmentCount}</TableCell>
                  <TableCell>{a.target}</TableCell>
                  <TableCell>{a.score}</TableCell>
                  <TableCell>{a.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>预警列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>身份</TableHead>
                <TableHead>周期</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>说明</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warnings.map((w, idx) => (
                <TableRow key={idx}>
                  <TableCell>{w.user_name}</TableCell>
                  <TableCell>{w.identity}</TableCell>
                  <TableCell>{w.period}</TableCell>
                  <TableCell>{w.warning_type}</TableCell>
                  <TableCell>{w.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


