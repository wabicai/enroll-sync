import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [userRegistrations, setUserRegistrations] = useState<any[]>([]);
  const [rewardApplications, setRewardApplications] = useState<any[]>([]);
  const [studentEnrollments, setStudentEnrollments] = useState<any[]>([]);
  const [roleUpgrades, setRoleUpgrades] = useState<any[]>([]);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<any | null>(null);

  // Get current tab from URL parameters
  const currentTab = searchParams.get('type') || 'registrations';

  // Tab mapping for URL parameters
  const tabMapping: Record<string, string> = {
    'registrations': 'registrations',
    'user_registration': 'registrations',
    'upgrades': 'upgrades',
    'user_role_upgrade': 'upgrades',
    'students': 'students',
    'student_enrollment': 'students',
    'rewards': 'rewards',
    'reward_application': 'rewards'
  };

  // Get the actual tab value from URL parameter
  const activeTab = tabMapping[currentTab] || 'registrations';

  // Handle tab change and update URL
  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('type', value);
    setSearchParams(newParams);
  };

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

  // 步骤名称映射
  const stepNameMap: Record<string, string> = {
    'exam': '考务审核',
    'finance': '财务审核',
    'gm': '总经理审批'
  };

  // 角色类型映射
  const roleTypeMap: Record<number, string> = {
    1: '全职招生',
    2: '兼职招生',
    3: '兼职负责人',
    4: '渠道招生',
    5: '兼职管理'
  };

  // 获取当前步骤的人性化名称
  const getCurrentStepName = (item: any) => {
    if (!item.steps || item.steps.length === 0) return '-';
    const currentStep = item.steps[item.current_step_index || 0];
    return currentStep ? stepNameMap[currentStep.step_key] || currentStep.step_key : '-';
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

      <Tabs value={activeTab} onValueChange={handleTabChange}>
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
              <CardTitle>学员报名审批</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学员姓名</TableHead>
                    <TableHead>手机号</TableHead>
                    <TableHead>课程名称</TableHead>
                    <TableHead>当前步骤</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentEnrollments.map((item: any) => {
                    const studentDetails = item.student_details;
                    const currentStepName = getCurrentStepName(item);
                    return (
                      <TableRow key={item.instance_id}>
                        <TableCell className="font-medium">
                          {studentDetails?.student_name || `学员${item.target_id}`}
                        </TableCell>
                        <TableCell>{studentDetails?.phone || '-'}</TableCell>
                        <TableCell>{studentDetails?.course_name || '-'}</TableCell>
                        <TableCell>{currentStepName}</TableCell>
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
                      <TableCell colSpan={6} className="text-center text-muted-foreground">当前没有待审核的学员报名</TableCell>
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
              <CardTitle>奖励申请审批</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学员姓名</TableHead>
                    <TableHead>申请月份</TableHead>
                    <TableHead>奖励金额</TableHead>
                    <TableHead>当前步骤</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewardApplications.map((item: any) => {
                    const rewardDetails = item.reward_details;
                    const currentStepName = getCurrentStepName(item);
                    return (
                      <TableRow key={item.instance_id}>
                        <TableCell className="font-medium">
                          {rewardDetails?.student_name || `奖励${item.target_id}`}
                        </TableCell>
                        <TableCell>{rewardDetails?.application_month || '-'}</TableCell>
                        <TableCell>{rewardDetails?.reward_amount ? `¥${rewardDetails.reward_amount}` : '-'}</TableCell>
                        <TableCell>{currentStepName}</TableCell>
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
                      <TableCell colSpan={6} className="text-center text-muted-foreground">当前没有待审批的奖励申请</TableCell>
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
            const { inst, steps, studentDetails, userDetails, approvalType } = selectedApproval;
            const current = steps[inst.current_step_index];
            const can = (k: string) => current?.step_key === k;
            return (
              <div className="space-y-6 py-4">
                {/* 基本信息 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">基本信息</h3>
                  {approvalType === 'student_enrollment' && studentDetails && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">学员姓名</div>
                        <div className="font-medium">{studentDetails.student_name || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">手机号</div>
                        <div className="font-medium">{studentDetails.phone || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">课程名称</div>
                        <div className="font-medium">{studentDetails.course_name || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">报名状态</div>
                        <div className="font-medium">{studentDetails.enrollment_status || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">学费金额</div>
                        <div className="font-medium">{studentDetails.total_fee ? `¥${studentDetails.total_fee}` : '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">已缴费金额</div>
                        <div className="font-medium">{studentDetails.paid_amount ? `¥${studentDetails.paid_amount}` : '-'}</div>
                      </div>
                    </div>
                  )}
                  {approvalType === 'user_registration' && userDetails && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">姓名</div>
                        <div className="font-medium">{userDetails.real_name || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">手机号</div>
                        <div className="font-medium">{userDetails.phone || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">申请角色</div>
                        <div className="font-medium">{roleTypeMap[userDetails.requested_role_type] || '-'}</div>
                      </div>
                    </div>
                  )}
                  {approvalType === 'reward_application' && selectedApproval.rewardDetails && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">学员姓名</div>
                        <div className="font-medium">{selectedApproval.rewardDetails.student_name || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">申请月份</div>
                        <div className="font-medium">{selectedApproval.rewardDetails.application_month || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">奖励金额</div>
                        <div className="font-medium">{selectedApproval.rewardDetails.reward_amount ? `¥${selectedApproval.rewardDetails.reward_amount}` : '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">申请原因</div>
                        <div className="font-medium">{selectedApproval.rewardDetails.application_reason || '-'}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 审批流程 */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">审批流程</h3>
                  <div className="flex gap-2 flex-wrap">
                    {steps.map((s: any, index: number) => {
                      const stepStatus = stepStatusMap[s.status] || { label: '未知', variant: 'secondary' as const };
                      const isCurrentStep = index === inst.current_step_index;
                      return (
                        <Badge
                          key={s.id}
                          variant={isCurrentStep ? 'default' : stepStatus.variant}
                          className={isCurrentStep ? 'ring-2 ring-blue-500' : ''}
                        >
                          {stepNameMap[s.step_key] || s.step_key}：{stepStatus.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  {/* 只显示当前步骤可以操作的按钮，且步骤状态为待审 */}
                  {current && current.status === 1 && (
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
                          alert('审批操作失败: ' + (error as any)?.message || '未知错误');
                        }
                      }}>通过（{stepNameMap[current.step_key] || current.step_key}）</Button>

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
                          alert('审批操作失败: ' + (error as any)?.message || '未知错误');
                        }
                      }}>拒绝</Button>
                    </>
                  )}
                  {current && current.status !== 1 && (
                    <div className="text-sm text-muted-foreground">
                      当前步骤已处理，状态：{stepStatusMap[current.status]?.label || '未知'}
                    </div>
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


