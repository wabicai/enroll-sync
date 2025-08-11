import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { fetchPendingRegistrations, fetchUpgradeApplications, fetchRewardApprovalsUnified, approveAudit, rejectAudit, auditRewardApplication } from '@/lib/api';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export default function Approvals() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [upgrades, setUpgrades] = useState<any[]>([]);
  const [rewardApprovals, setRewardApprovals] = useState<Array<any>>([]);
  const [regOpen, setRegOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<any | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = useState<any | null>(null);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any | null>(null);

  useEffect(() => {
    fetchPendingRegistrations().then((items: any[]) => setRegistrations(items));
    fetchUpgradeApplications().then((items: any[]) => setUpgrades(items));
    // 奖励审批单队列（后端将按角色返回一审或一审+二审）
    fetchRewardApprovalsUnified().then(res => setRewardApprovals(res.items));
  }, []);

  const approveUpgrade = (id: string) => {
    setUpgrades(prev => prev.map(item => (item.id === id ? { ...item, status: 'approved' } : item)));
  };

  const rejectUpgrade = (id: string) => {
    setUpgrades(prev => prev.map(item => (item.id === id ? { ...item, status: 'rejected' } : item)));
  };

  const approveRegistration = async (auditId: string) => {
    await approveAudit(auditId);
    setRegistrations(prev => prev.filter(u => u.id !== auditId));
  };

  const rejectRegistration = async (auditId: string) => {
    await rejectAudit(auditId, '不符合条件');
    setRegistrations(prev => prev.filter(u => u.id !== auditId));
  };

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
                  {registrations.map(u => (
                    <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedReg(u); setRegOpen(true); }}>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        {({ general_manager: '总经理', finance: '财务', exam_admin: '考务', system_admin: '系统管理员' } as Record<string, string>)[u.role] || u.role}
                        {u.identity ? ` / ${({ part_time: '兼职', full_time: '全职', team_leader: '团队长', regional_manager: '区域经理', partner: '合伙人', part_time_lead: '兼职负责人', channel: '渠道' } as Record<string, string>)[u.identity] || u.identity}` : ''}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">待审批</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedReg(u); setRegOpen(true); }}>详情</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {registrations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        当前没有待审批的注册
                      </TableCell>
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
              <CardTitle>升级申请</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>申请人</TableHead>
                    <TableHead>从身份</TableHead>
                    <TableHead>到身份</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upgrades.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.userName}</TableCell>
                      <TableCell>{({ part_time: '兼职', full_time: '全职', freelance: '自由职业', channel: '渠道', part_time_lead: '兼职负责人' } as Record<string, string>)[item.fromIdentity] || item.fromIdentity}</TableCell>
                      <TableCell>{({ part_time: '兼职', channel: '渠道', part_time_lead: '兼职负责人' } as Record<string, string>)[item.toIdentity] || item.toIdentity}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'pending' ? 'secondary' : item.status === 'approved' ? 'default' : 'destructive'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedUpgrade(item); setUpgradeOpen(true); }}>详情</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle>奖励审批（单队列）</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>申请人</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>阶段</TableHead>
                    <TableHead>申请时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewardApprovals.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item._applicant_name || '-'}</TableCell>
                      <TableCell>¥{item.reward_amount}</TableCell>
                      <TableCell>
                        <Badge variant={item.step === 'gm' ? 'default' : 'secondary'}>
                          {item.step === 'gm' ? '等待总经理审批' : '等待考务审批'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(item.application_time).toLocaleString('zh-CN')}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedReward(item); setRewardOpen(true); }}>详情</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rewardApprovals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        当前没有待审批的奖励
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 注册审批详情抽屉 */}
      <Sheet open={regOpen} onOpenChange={setRegOpen}>
        <SheetContent side="right" className="w-[520px] sm:max-w-none">
          <SheetHeader>
            <SheetTitle>注册审批详情</SheetTitle>
          </SheetHeader>
          {selectedReg && (
            <div className="space-y-4 py-4">
              <div>
                <div className="text-sm text-muted-foreground">姓名</div>
                <div className="text-foreground font-medium">{selectedReg.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">邮箱</div>
                  <div>{selectedReg.email}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">手机</div>
                  <div>{selectedReg.phone || '-'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">角色/身份</div>
                  <div>
                    {({ general_manager: '总经理', finance: '财务', exam_admin: '考务', system_admin: '系统管理员' } as Record<string, string>)[selectedReg.role] || selectedReg.role}
                    {selectedReg.identity ? ` / ${({ part_time: '兼职', full_time: '全职', team_leader: '团队长', regional_manager: '区域经理', partner: '合伙人', part_time_lead: '兼职负责人', channel: '渠道' } as Record<string, string>)[selectedReg.identity] || selectedReg.identity}` : ''}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">团队</div>
                  <div>{selectedReg.teamId || '-'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">身份证号</div>
                  <div>{selectedReg.idCard || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">标签/渠道</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedReg.tags?.length
                      ? selectedReg.tags.map((t: string, idx: number) => (
                          <Badge key={idx} variant="secondary">{t}</Badge>
                        ))
                      : '-'}
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">创建时间：{new Date(selectedReg.createdAt).toLocaleString('zh-CN')}</div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { if (selectedReg) { approveRegistration(selectedReg.id); setRegOpen(false); } }}>通过</Button>
                <Button variant="outline" onClick={() => { if (selectedReg) { rejectRegistration(selectedReg.id); setRegOpen(false); } }}>拒绝</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 升级申请详情抽屉 */}
      <Sheet open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <SheetContent side="right" className="w-[520px] sm:max-w-none">
          <SheetHeader>
            <SheetTitle>升级申请详情</SheetTitle>
          </SheetHeader>
          {selectedUpgrade && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">申请人</div>
                  <div className="font-medium">{selectedUpgrade.userName}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">状态</div>
                  <Badge variant={selectedUpgrade.status === 'pending' ? 'secondary' : selectedUpgrade.status === 'approved' ? 'default' : 'destructive'}>
                    {selectedUpgrade.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">从身份</div>
                  <div>{({ part_time: '兼职', full_time: '全职', freelance: '自由职业', channel: '渠道', part_time_lead: '兼职负责人' } as Record<string, string>)[selectedUpgrade.fromIdentity] || selectedUpgrade.fromIdentity}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">到身份</div>
                  <div>{({ part_time: '兼职', channel: '渠道', part_time_lead: '兼职负责人' } as Record<string, string>)[selectedUpgrade.toIdentity] || selectedUpgrade.toIdentity}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">申请理由</div>
                <div>{selectedUpgrade.reason || '-'}</div>
              </div>
              <div className="text-sm text-muted-foreground">创建时间：{new Date(selectedUpgrade.createdAt).toLocaleString('zh-CN')}</div>
              {selectedUpgrade.status === 'pending' && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { approveUpgrade(selectedUpgrade.id); setUpgradeOpen(false); }}>通过</Button>
                  <Button variant="outline" onClick={() => { rejectUpgrade(selectedUpgrade.id); setUpgradeOpen(false); }}>拒绝</Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 奖励审批详情抽屉 */}
      <Sheet open={rewardOpen} onOpenChange={setRewardOpen}>
        <SheetContent side="right" className="w-[520px] sm:max-w-none">
          <SheetHeader>
            <SheetTitle>奖励审批详情</SheetTitle>
          </SheetHeader>
          {selectedReward && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                <div className="text-sm text-muted-foreground">申请人</div>
                  <div className="font-medium">{selectedReward._applicant_name || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">金额</div>
                  <div>¥{selectedReward.reward_amount}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">阶段</div>
                  <Badge variant={selectedReward.step === 'gm' ? 'default' : 'secondary'}>
                    {selectedReward.step === 'gm' ? '等待总经理审批' : '等待考务审批'}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">申请时间</div>
                  <div>{new Date(selectedReward.application_time).toLocaleString('zh-CN')}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">申请理由</div>
                <div>{selectedReward._reason || '-'}</div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={async () => {
                  if (!selectedReward) return;
                  await auditRewardApplication(selectedReward.id, selectedReward.step, true);
                  setRewardApprovals(prev => prev.filter(i => i.id !== selectedReward.id));
                  setRewardOpen(false);
                }}>通过</Button>
                <Button variant="outline" onClick={async () => {
                  if (!selectedReward) return;
                  await auditRewardApplication(selectedReward.id, selectedReward.step, false, '不符合要求');
                  setRewardApprovals(prev => prev.filter(i => i.id !== selectedReward.id));
                  setRewardOpen(false);
                }}>拒绝</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}


