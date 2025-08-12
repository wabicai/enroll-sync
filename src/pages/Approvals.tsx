import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  fetchUserRegistrationApprovals,
  fetchRewardApplicationApprovals,
  fetchStudentEnrollmentApprovals,
  fetchRoleUpgradeApprovals,
  decideUserRegistrationApproval,
  decideRewardApplicationApproval,
  decideStudentEnrollmentApproval,
  decideRoleUpgradeApproval
} from '@/lib/api';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export default function Approvals() {
  const [userRegistrations, setUserRegistrations] = useState<any[]>([]);
  const [rewardApplications, setRewardApplications] = useState<any[]>([]);
  const [studentEnrollments, setStudentEnrollments] = useState<any[]>([]);
  const [roleUpgrades, setRoleUpgrades] = useState<any[]>([]);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<any | null>(null);

  // 角色类型映射
  const roleTypeMap: Record<number, string> = {
    1: '全职',
    2: '兼职', 
    3: '自由',
    4: '渠道',
    5: '团队负责人',
    6: '总经理',
    7: '考务组',
    8: '财务',
  };

  // 审批状态映射
  const approvalStatusMap: Record<number, string> = {
    1: '待审批',
    2: '审批中',
    3: '已通过',
    4: '已拒绝',
  };

  // 步骤状态映射
  const stepStatusMap: Record<number, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
    1: { label: '待审', variant: 'secondary' },
    2: { label: '已通过', variant: 'default' },
    3: { label: '已拒绝', variant: 'destructive' },
  };

  const loadApprovalData = async () => {
    try {
      const [userRegs, rewards, students, roles] = await Promise.all([
        fetchUserRegistrationApprovals(),
        fetchRewardApplicationApprovals(),
        fetchStudentEnrollmentApprovals(),
        fetchRoleUpgradeApprovals()
      ]);

      setUserRegistrations((userRegs as any).items || []);
      setRewardApplications((rewards as any).items || []);
      setStudentEnrollments((students as any).items || []);
      setRoleUpgrades((roles as any).items || []);
    } catch (error) {
      console.error('Failed to load approval data:', error);
    }
  };

  useEffect(() => {
    loadApprovalData();
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
                    <TableHead>手机号</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRegistrations.map((item: any) => {
                    const userDetails = item.user_details;
                    const roleNames = roleTypeMap[userDetails?.requested_role_type] || '未知角色';
                    return (
                      <TableRow key={item.instance_id}>
                        <TableCell>{userDetails?.real_name || '未知'}</TableCell>
                        <TableCell>{userDetails?.phone || '未提供'}</TableCell>
                        <TableCell>{roleNames}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === 3 ? 'default' : item.status === 4 ? 'destructive' : 'secondary'}>
                            {approvalStatusMap[item.status] || '未知'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedApproval({
                              inst: { 
                                id: item.instance_id, 
                                status: item.status, 
                                target_type: 'user_registration', 
                                target_id: item.target_id,
                                current_step_index: item.current_step_index || 0
                              },
                              steps: item.steps,
                              userDetails,
                              approvalType: 'user_registration'
                            });
                            setApprovalOpen(true);
                          }}>详情</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {userRegistrations.length === 0 && (
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
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roleUpgrades.map((item: any) => {
                    const roleDetails = item.role_upgrade_details;
                    return (
                      <TableRow key={item.instance_id}>
                        <TableCell>{item.instance_id}</TableCell>
                        <TableCell>角色升级</TableCell>
                        <TableCell>{roleDetails?.real_name || `用户${item.target_id}`}</TableCell>
                        <TableCell>{item.current_step || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedApproval({
                              inst: { 
                                id: item.instance_id, 
                                status: item.status, 
                                target_type: 'user_role_upgrade', 
                                target_id: item.target_id,
                                current_step_index: item.current_step_index || 0
                              },
                              steps: item.steps,
                              roleDetails,
                              approvalType: 'user_role_upgrade'
                            });
                            setApprovalOpen(true);
                          }}>详情</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {roleUpgrades.length === 0 && (
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
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentEnrollments.map((item: any) => {
                    const studentDetails = item.student_details;
                    return (
                      <TableRow key={item.instance_id}>
                        <TableCell>{item.instance_id}</TableCell>
                        <TableCell>学员报名</TableCell>
                        <TableCell>{studentDetails?.student_name || `学员${item.target_id}`}</TableCell>
                        <TableCell>{item.current_step || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedApproval({
                              inst: { 
                                id: item.instance_id, 
                                status: item.status, 
                                target_type: 'student_enrollment', 
                                target_id: item.target_id,
                                current_step_index: item.current_step_index || 0
                              },
                              steps: item.steps,
                              studentDetails,
                              approvalType: 'student_enrollment'
                            });
                            setApprovalOpen(true);
                          }}>详情</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {studentEnrollments.length === 0 && (
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
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewardApplications.map((item: any) => {
                    const rewardDetails = item.reward_details;
                    return (
                      <TableRow key={item.instance_id}>
                        <TableCell>{item.instance_id}</TableCell>
                        <TableCell>奖励申请</TableCell>
                        <TableCell>{rewardDetails?.student_name || `奖励${item.target_id}`}</TableCell>
                        <TableCell>{item.current_step || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedApproval({
                              inst: { 
                                id: item.instance_id, 
                                status: item.status, 
                                target_type: 'reward_application', 
                                target_id: item.target_id,
                                current_step_index: item.current_step_index || 0
                              },
                              steps: item.steps,
                              rewardDetails,
                              approvalType: 'reward_application'
                            });
                            setApprovalOpen(true);
                          }}>详情</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {rewardApplications.length === 0 && (
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
                    {steps.map((s: any) => {
                      const stepStatus = stepStatusMap[s.status] || { label: '未知', variant: 'secondary' as const };
                      return (
                        <Badge key={s.id} variant={stepStatus.variant}>
                          {stepLabel[s.step_key] || s.step_key}：{stepStatus.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  {/* 只显示当前步骤可以操作的按钮 */}
                  {current && (
                    <>
                      <Button disabled={false} variant="outline" onClick={async () => {
                        try {
                          // Use the appropriate decision function based on approval type
                          const approvalType = selectedApproval?.approvalType;
                          const stepKey = current.step_key;
                          
                          if (approvalType === 'user_registration') {
                            await decideUserRegistrationApproval(inst.id, stepKey, true);
                          } else if (approvalType === 'reward_application') {
                            await decideRewardApplicationApproval(inst.id, stepKey, true);
                          } else if (approvalType === 'student_enrollment') {
                            await decideStudentEnrollmentApproval(inst.id, stepKey, true);
                          } else if (approvalType === 'user_role_upgrade') {
                            await decideRoleUpgradeApproval(inst.id, stepKey, true);
                          }
                          setApprovalOpen(false);
                          // refresh all data
                          loadApprovalData();
                        } catch (error) {
                          console.error('审批操作失败:', error);
                        }
                      }}>通过（{stepLabel[current.step_key] || current.step_key}）</Button>
                      
                      <Button variant="outline" onClick={async () => {
                        try {
                          // Use the appropriate decision function based on approval type
                          const approvalType = selectedApproval?.approvalType;
                          const stepKey = current.step_key;
                          
                          if (approvalType === 'user_registration') {
                            await decideUserRegistrationApproval(inst.id, stepKey, false, '不符合条件');
                          } else if (approvalType === 'reward_application') {
                            await decideRewardApplicationApproval(inst.id, stepKey, false, '不符合条件');
                          } else if (approvalType === 'student_enrollment') {
                            await decideStudentEnrollmentApproval(inst.id, stepKey, false, '不符合条件');
                          } else if (approvalType === 'user_role_upgrade') {
                            await decideRoleUpgradeApproval(inst.id, stepKey, false, '不符合条件');
                          }
                          setApprovalOpen(false);
                          // refresh all data
                          loadApprovalData();
                        } catch (error) {
                          console.error('审批操作失败:', error);
                        }
                      }}>拒绝</Button>
                    </>
                  )}
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}


