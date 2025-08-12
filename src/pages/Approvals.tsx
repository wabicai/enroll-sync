import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { fetchApprovalsPending, decideApprovalStep } from '@/lib/api';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export default function Approvals() {
  const [approvalItems, setApprovalItems] = useState<any[]>([]);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<any | null>(null);

  useEffect(() => {
    fetchApprovalsPending().then((res: any) => setApprovalItems(res.items || []));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">审批中心</h1>
        <p className="text-muted-foreground">注册与升级申请的集中处理</p>
      </div>

      <Tabs defaultValue="registrations">
        <TabsList>
          <TabsTrigger value="registrations">注册审批</TabsTrigger>
          <TabsTrigger value="upgrades">升级审批</TabsTrigger>
          <TabsTrigger value="students">学员审批</TabsTrigger>
          <TabsTrigger value="rewards">奖励审批</TabsTrigger>
        </TabsList>

        <TabsContent value="registrations">
          <Card>
            <CardHeader>
              <CardTitle>待审批注册</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>角色/身份</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvalItems
                    .filter((it: any) => it.instance?.target_type === 'user_registration')
                    .map((it: any) => {
                      const inst = it.instance; const steps = it.steps || [];
                      const current = steps[inst.current_step_index];
                      return (
                        <TableRow key={inst.id}>
                          <TableCell>{inst.id}</TableCell>
                          <TableCell>{inst.target_type}</TableCell>
                          <TableCell>{inst.target_id}</TableCell>
                          <TableCell>{current?.step_key || '-'}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" onClick={() => { setSelectedApproval({ inst, steps }); setApprovalOpen(true); }}>详情</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {approvalItems.filter((it: any) => it.instance?.target_type === 'user_registration').length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">当前没有待审核的注册</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upgrades">
          <Card>
            <CardHeader>
              <CardTitle>升级申请（统一审批）</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>实例ID</TableHead>
                    <TableHead>业务类型</TableHead>
                    <TableHead>目标ID</TableHead>
                    <TableHead>当前步骤</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvalItems
                    .filter((it: any) => it.instance?.target_type === 'user_role_upgrade')
                    .map((it: any) => {
                      const inst = it.instance; const steps = it.steps || [];
                      const current = steps[inst.current_step_index];
                      return (
                        <TableRow key={inst.id}>
                          <TableCell>{inst.id}</TableCell>
                          <TableCell>{inst.target_type}</TableCell>
                          <TableCell>{inst.target_id}</TableCell>
                          <TableCell>{current?.step_key || '-'}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" onClick={() => { setSelectedApproval({ inst, steps }); setApprovalOpen(true); }}>详情</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {approvalItems.filter((it: any) => it.instance?.target_type === 'user_role_upgrade').length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">当前没有待审批的升级申请</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>统一审批列表（按类型筛选：学员报考资格）</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>实例ID</TableHead>
                    <TableHead>业务类型</TableHead>
                    <TableHead>目标ID</TableHead>
                    <TableHead>当前步骤</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvalItems
                    .filter((it: any) => it.instance?.target_type === 'student_enrollment')
                    .map((it: any) => {
                      const inst = it.instance; const steps = it.steps || [];
                      const current = steps[inst.current_step_index];
                      return (
                        <TableRow key={inst.id}>
                          <TableCell>{inst.id}</TableCell>
                          <TableCell>{inst.target_type}</TableCell>
                          <TableCell>{inst.target_id}</TableCell>
                          <TableCell>{current?.step_key || '-'}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" onClick={() => { setSelectedApproval({ inst, steps }); setApprovalOpen(true); }}>详情</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {approvalItems.filter((it: any) => it.instance?.target_type === 'student_enrollment').length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">当前没有待审核的学员报考资格</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle>奖励审批（统一审批）</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>实例ID</TableHead>
                    <TableHead>业务类型</TableHead>
                    <TableHead>目标ID</TableHead>
                    <TableHead>当前步骤</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvalItems
                    .filter((it: any) => it.instance?.target_type === 'reward_application')
                    .map((it: any) => {
                      const inst = it.instance; const steps = it.steps || [];
                      const current = steps[inst.current_step_index];
                      return (
                        <TableRow key={inst.id}>
                          <TableCell>{inst.id}</TableCell>
                          <TableCell>{inst.target_type}</TableCell>
                          <TableCell>{inst.target_id}</TableCell>
                          <TableCell>{current?.step_key || '-'}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" onClick={() => { setSelectedApproval({ inst, steps }); setApprovalOpen(true); }}>详情</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {approvalItems.filter((it: any) => it.instance?.target_type === 'reward_application').length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">当前没有待审批的奖励申请</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 审批实例详情抽屉（统一审批） */}
      <Sheet open={approvalOpen} onOpenChange={setApprovalOpen}>
        <SheetContent side="right" className="w-[520px] sm:max-w-none">
          <SheetHeader>
            <SheetTitle>审批详情</SheetTitle>
          </SheetHeader>
          {selectedApproval && (() => {
            const { inst, steps } = selectedApproval;
            const current = steps[inst.current_step_index];
            const stepLabel: Record<string, string> = { finance: '财务', gm: '总经理' };
            const can = (k: string) => current?.step_key === k;
            return (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">实例ID</div>
                    <div className="font-medium">{inst.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">业务</div>
                    <div>{inst.target_type} / {inst.target_id}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">步骤</div>
                  <div className="flex gap-2 flex-wrap">
                    {steps.map((s: any) => (
                      <Badge key={s.id} variant={s.status === 2 ? 'default' : s.status === 3 ? 'destructive' : 'secondary'}>
                        {stepLabel[s.step_key] || s.step_key}：{s.status === 1 ? '待审' : s.status === 2 ? '已通过' : '已拒绝'}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  {['finance','gm'].map(k => (
                    <Button key={k} disabled={!can(k)} variant="outline" onClick={async () => {
                      await decideApprovalStep(inst.id, k, true);
                      setApprovalOpen(false);
                      // refresh
                      fetchApprovalsPending().then((res: any) => setApprovalItems(res.items || []));
                    }}>通过（{stepLabel[k] || k}）</Button>
                  ))}
                  <Button variant="outline" onClick={async () => {
                    await decideApprovalStep(inst.id, current?.step_key, false, '不符合条件');
                    setApprovalItems(prev => prev.filter((it: any) => it.instance?.id !== inst.id));
                    setApprovalOpen(false);
                  }}>拒绝</Button>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}


