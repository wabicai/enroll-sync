import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  fetchApprovalsAll,
  decideApprovalStep
} from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

// 状态映射
const approvalStatusMap: Record<number, string> = {
  1: '待开始',
  2: '进行中', 
  3: '已通过',
  4: '已拒绝'
};

const stepStatusMap: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  1: { label: '待审', variant: 'secondary' },
  2: { label: '已通过', variant: 'default' },
  3: { label: '已拒绝', variant: 'destructive' }
};

const stepNameMap: Record<string, string> = {
  'exam': '考务审核',
  'finance': '财务发放',
  'gm': '总经理审批'
};

const roleTypeMap: Record<number, string> = {
  1: '全职招生',
  2: '兼职招生',
  3: '自由招生',
  4: '渠道招生',
  5: '团队负责人',
  6: '总经理',
  7: '考务组',
  8: '考务组'  // 财务和考务组统一为考务组
};

export default function Approvals() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAppStore();

  // 状态管理
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<any | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);

  // 分页和筛选状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 获取当前标签页和状态筛选
  const currentTab = searchParams.get('type') || 'registrations';
  const currentStatus = searchParams.get('status') ? parseInt(searchParams.get('status')!) : undefined;

  // 标签页映射
  const tabTypeMap: Record<string, string> = {
    'registrations': 'user_registration',
    'students': 'student_enrollment', 
    'rewards': 'reward_application',
    'roles': 'user_role_upgrade'
  };

  // 加载审批数据
  const loadApprovalData = async () => {
    setLoading(true);
    try {
      const targetType = tabTypeMap[currentTab];
      const response = await fetchApprovalsAll({
        page: currentPage,
        page_size: pageSize,
        target_type: targetType,
        status: currentStatus
      });

      setApprovals((response as any).items || []);
      setTotal((response as any).total || 0);
      setTotalPages((response as any).pages || 0);
    } catch (error) {
      console.error('Failed to load approval data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理标签页切换
  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('type', value);
    newParams.delete('status'); // 切换标签页时清除状态筛选
    setSearchParams(newParams);
    setCurrentPage(1); // 重置页码
  };

  // 处理状态筛选
  const handleStatusChange = (status: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (status === 'all') {
      newParams.delete('status');
    } else {
      newParams.set('status', status);
    }
    setSearchParams(newParams);
    setCurrentPage(1); // 重置页码
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 处理审批决策
  const handleApprovalDecision = async (instanceId: number, stepKey: string, approve: boolean, reason?: string) => {
    try {
      await decideApprovalStep(instanceId, stepKey, approve, reason);
      setApprovalOpen(false);
      loadApprovalData(); // 重新加载数据
    } catch (error) {
      console.error('Failed to process approval:', error);
    }
  };

  // 获取当前步骤名称
  const getCurrentStepName = (item: any) => {
    // 优先使用 enhanced_steps，回退到 steps
    const steps = item.enhanced_steps || item.steps;
    if (!steps || steps.length === 0) return '未知步骤';

    const currentStepIndex = item.instance.current_step_index;
    if (currentStepIndex < 0 || currentStepIndex >= steps.length) return '未知步骤';

    const currentStep = steps[currentStepIndex];
    if (!currentStep || !currentStep.step_key) return '未知步骤';

    return stepNameMap[currentStep.step_key] || currentStep.step_key;
  };

  // 格式化时间
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleString('zh-CN');
  };

  // 检查用户是否有审批当前步骤的权限
  const canApproveStep = (stepKey: string): boolean => {
    if (!user) return false;
    
    // 总经理和系统管理员有所有权限
    if (user.role === 'general_manager' || user.role === 'system_admin') {
      return true;
    }
    
    // 根据步骤类型检查权限
    switch (stepKey) {
      case 'exam':
        return user.role === 'exam_admin';
      case 'finance':
        // 财务步骤：考务组承担财务职能
        return user.role === 'exam_admin';
      default:
        return false;
    }
  };

  useEffect(() => {
    loadApprovalData();
  }, [currentTab, currentStatus, currentPage]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">审批中心</h1>
          <p className="text-muted-foreground">管理各类审批流程</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>审批列表</CardTitle>
            <div className="flex items-center gap-4">
              <Select value={currentStatus?.toString() || 'all'} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="1">待开始</SelectItem>
                  <SelectItem value="2">进行中</SelectItem>
                  <SelectItem value="3">已通过</SelectItem>
                  <SelectItem value="4">已拒绝</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="registrations">用户注册</TabsTrigger>
              <TabsTrigger value="students">学员报名</TabsTrigger>
              <TabsTrigger value="rewards">奖励申请</TabsTrigger>
              <TabsTrigger value="roles">角色升级</TabsTrigger>
            </TabsList>

            <TabsContent value={currentTab} className="mt-6">
              {loading ? (
                <div className="text-center py-8">加载中...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>申请人</TableHead>
                        <TableHead>当前步骤</TableHead>
                        <TableHead>审批状态</TableHead>
                        <TableHead>创建时间</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvals.map((item) => {
                        const { instance: inst, user_details, student_details, reward_details, role_upgrade_details } = item;
                        const steps = item.enhanced_steps || item.steps || [];
                        const current = steps[inst.current_step_index];
                        
                        // 获取申请人姓名
                        const getApplicantName = () => {
                          if (inst.target_type === 'user_registration' && user_details) {
                            return user_details.name;  // 修正字段名
                          }
                          if (inst.target_type === 'student_enrollment' && student_details) {
                            return student_details.student_name;
                          }
                          if (inst.target_type === 'reward_application' && reward_details) {
                            return reward_details.applicant_name || reward_details.student_name;  // 支持两个字段
                          }
                          if (inst.target_type === 'user_role_upgrade' && role_upgrade_details) {
                            return role_upgrade_details.user_name;  // 修正字段名
                          }
                          return `ID: ${inst.target_id}`;
                        };
                        
                        return (
                          <TableRow key={inst.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {getApplicantName()}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {inst.target_id}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getCurrentStepName(item)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  inst.status === 3 ? 'default' : 
                                  inst.status === 4 ? 'destructive' : 
                                  'secondary'
                                }
                              >
                                {approvalStatusMap[inst.status] || '未知'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatTime(inst.created_at)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedApproval(item);
                                  setApprovalOpen(true);
                                }}
                              >
                                查看详情
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {totalPages > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                              className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = i + 1;
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => handlePageChange(page)}
                                  isActive={currentPage === page}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          
                          {totalPages > 5 && <PaginationEllipsis />}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                              className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}

                  {approvals.length === 0 && !loading && (
                    <div className="text-center py-8 text-muted-foreground">
                      暂无审批数据
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 审批详情弹窗 */}
      <Sheet open={approvalOpen} onOpenChange={setApprovalOpen}>
        <SheetContent className="min-w-[600px] sm:max-w-[800px]">
          <SheetHeader>
            <SheetTitle>审批详情</SheetTitle>
          </SheetHeader>
          {selectedApproval && (() => {
            const { instance: inst, steps, user_details, student_details, reward_details, role_upgrade_details } = selectedApproval;
            const current = steps?.[inst.current_step_index];
            
            return (
              <div className="space-y-6 py-4">
                {/* 基本信息 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">基本信息</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">审批类型</label>
                      <div className="mt-1">
                        {inst.target_type === 'user_registration' && '用户注册申请'}
                        {inst.target_type === 'student_enrollment' && '学员报名申请'}
                        {inst.target_type === 'reward_application' && '奖励申请'}
                        {inst.target_type === 'user_role_upgrade' && '角色升级申请'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">申请ID</label>
                      <div className="mt-1">{inst.target_id}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">当前状态</label>
                      <div className="mt-1">
                        <Badge variant={inst.status === 3 ? 'default' : inst.status === 4 ? 'destructive' : 'secondary'}>
                          {approvalStatusMap[inst.status]}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">创建时间</label>
                      <div className="mt-1">{formatTime(inst.created_at)}</div>
                    </div>
                  </div>
                </div>

                {/* 详细信息 */}
                {user_details && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">用户信息</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">姓名</label>
                        <div className="mt-1">{user_details.name}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">手机号</label>
                        <div className="mt-1">{user_details.phone}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">用户名</label>
                        <div className="mt-1">{user_details.username}</div>
                      </div>
                    </div>
                  </div>
                )}

                {student_details && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">学员信息</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">学员姓名</label>
                        <div className="mt-1">{student_details.student_name}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">报读课程</label>
                        <div className="mt-1">{student_details.course_name}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">学费金额</label>
                        <div className="mt-1">¥{student_details.total_fee}</div>
                      </div>
                    </div>
                  </div>
                )}

                {reward_details && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">奖励信息</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">申请人</label>
                        <div className="mt-1">{reward_details.applicant_name || reward_details.student_name}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">奖励金额</label>
                        <div className="mt-1">¥{reward_details.reward_amount}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">申请原因</label>
                        <div className="mt-1">{reward_details.application_reason}</div>
                      </div>
                    </div>
                  </div>
                )}

                {role_upgrade_details && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">升级信息</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">申请人</label>
                        <div className="mt-1">{role_upgrade_details.user_name}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">当前角色</label>
                        <div className="mt-1">{role_upgrade_details.current_role}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">目标角色</label>
                        <div className="mt-1">{role_upgrade_details.target_role}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 审批流程 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">审批流程</h3>
                  <div className="space-y-3">
                    {steps.map((step: any, index: number) => {
                      const isCurrentStep = index === inst.current_step_index;
                      const stepStatus = stepStatusMap[step.status] || { label: '未知', variant: 'secondary' as const };
                      
                      return (
                        <div 
                          key={step.id} 
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            isCurrentStep ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-200'
                          }`}
                        >
                          <Badge variant={isCurrentStep ? 'default' : stepStatus.variant}>
                            {stepNameMap[step.step_key] || step.step_key}
                          </Badge>
                          <Badge variant={stepStatus.variant}>
                            {stepStatus.label}
                          </Badge>
                          {step.auditor_name && (
                            <span className="text-sm text-muted-foreground">
                              审批人: {step.auditor_name}
                            </span>
                          )}
                          {step.audit_time && (
                            <span className="text-sm text-muted-foreground">
                              {formatTime(step.audit_time)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 审批操作 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">审批操作</h3>
                  {inst.status === 2 && current && current.status === 1 && canApproveStep(current.step_key) && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprovalDecision(inst.id, current.step_key, true)}
                        className="flex-1"
                      >
                        通过 ({stepNameMap[current.step_key] || current.step_key})
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleApprovalDecision(inst.id, current.step_key, false, '拒绝')}
                        className="flex-1"
                      >
                        拒绝 ({stepNameMap[current.step_key] || current.step_key})
                      </Button>
                    </div>
                  )}
                  {inst.status === 2 && current && current.status === 1 && !canApproveStep(current.step_key) && (
                    <div className="text-sm text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950 p-3 rounded-lg">
                      当前步骤需要 {stepNameMap[current.step_key] || current.step_key} 权限才能审批
                    </div>
                  )}
                  {current && current.status !== 1 && (
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      当前步骤已处理，状态：{stepStatusMap[current.status]?.label || '未知'}
                      {current.auditor_name && ` (审批人: ${current.auditor_name})`}
                    </div>
                  )}
                  {inst.status === 3 && (
                    <div className="text-sm text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950 p-3 rounded-lg">
                      审批已完成，状态：已通过
                    </div>
                  )}
                  {inst.status === 4 && (
                    <div className="text-sm text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950 p-3 rounded-lg">
                      审批已完成，状态：已拒绝
                    </div>
                  )}
                  {inst.status === 1 && (
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      审批尚未开始
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
