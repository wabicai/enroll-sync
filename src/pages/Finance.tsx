import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchPayrolls, fetchFinanceReport } from '@/lib/api';
import type { PayrollRecord, FinanceReportSummary } from '@/types';

export default function Finance() {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [summary, setSummary] = useState<FinanceReportSummary | null>(null);

  useEffect(() => {
    fetchPayrolls().then(setPayrolls);
    fetchFinanceReport().then(setSummary);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">财务</h1>
        <p className="text-muted-foreground">工资与财务汇总</p>
      </div>

      {summary && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader><CardTitle>月份</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{summary.month}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>总工资</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">¥{summary.totalPayroll}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>总奖励</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">¥{summary.totalReward}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>回款/应收</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">¥{summary.received}/¥{summary.receivable}</CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>工资表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>月份</TableHead>
                <TableHead>基础</TableHead>
                <TableHead>奖励</TableHead>
                <TableHead>扣款</TableHead>
                <TableHead>合计</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrolls.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{p.userName}</TableCell>
                  <TableCell>{p.month}</TableCell>
                  <TableCell>¥{p.base}</TableCell>
                  <TableCell>¥{p.reward}</TableCell>
                  <TableCell>¥{p.deduction}</TableCell>
                  <TableCell>¥{p.total}</TableCell>
                  <TableCell>{p.status === 'paid' ? '已发放' : '未发放'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


