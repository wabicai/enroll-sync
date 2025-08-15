import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchRuleConfig, fetchUpgradeConditions, fetchReminderPlans } from '@/lib/api';
import type { RuleConfig, UpgradeConditions, ReminderPlan } from '@/types';
import TokenDebugPanel from '@/components/auth/TokenDebugPanel';

export default function Settings() {
  const [rule, setRule] = useState<RuleConfig | null>(null);
  const [up, setUp] = useState<UpgradeConditions | null>(null);
  const [plans, setPlans] = useState<ReminderPlan[]>([]);

  useEffect(() => {
    fetchRuleConfig().then(setRule);
    fetchUpgradeConditions().then(setUp);
    fetchReminderPlans().then(setPlans);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">系统设置</h1>
        <p className="text-muted-foreground">审批规则、升级条件与提醒计划</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>审批规则</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rule && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <Switch checked={rule.autoApproveRegistration} onCheckedChange={() => {}} />
                <Label>允许总经理直接审批注册</Label>
              </div>
              <div>
                <Label>学员自动通过阈值</Label>
                <Input value={rule.studentAutoApproveThreshold ?? ''} readOnly />
              </div>
              <div>
                <Label>奖励自动通过金额上限</Label>
                <Input value={rule.rewardAutoApproveAmountLimit ?? ''} readOnly />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>升级条件</CardTitle>
        </CardHeader>
        <CardContent>
          {up && (
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>负责人每月最低招生</Label>
                <Input value={up.partTimeToLead.minMonthlyRecruitment} readOnly />
              </div>
              <div>
                <Label>连续达标月数</Label>
                <Input value={up.partTimeToLead.continuousMonths} readOnly />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={up.partTimeToLead.interviewRequired} onCheckedChange={() => {}} />
                <Label>需面试</Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>提醒计划</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>场景</TableHead>
                <TableHead>频率</TableHead>
                <TableHead>时间</TableHead>
                <TableHead>启用</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.scene}</TableCell>
                  <TableCell>{p.schedule}</TableCell>
                  <TableCell>{p.time}</TableCell>
                  <TableCell>{p.enabled ? '是' : '否'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Token调试面板 - 仅在开发环境显示 */}
      {process.env.NODE_ENV === 'development' && (
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">开发调试</h2>
          <TokenDebugPanel />
        </div>
      )}
    </div>
  );
}


