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

export default function ApprovalsEnhanced() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

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

      setApprovals(response.items || []);
      setTotal(response.total || 0);
      setTotalPages(response.pages || 0);
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
    const currentStep = item.enhanced_steps?.[item.instance.current_step_index];
    return currentStep ? stepNameMap[currentStep.step_key] || currentStep.step_key : '未知步骤';
  };

  // 格式化时间
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleString('zh-CN');
  };

  useEffect(() => {
    loadApprovalData();
  }, [currentTab, currentStatus, currentPage]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">审批中心</h1>
        <p className="text-muted-foreground">注册与升级申请的集中处理</p>
      </div>

      {/* 状态筛选器 */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">状态筛选:</span>
        <Select value={currentStatus?.toString() || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择状态" />
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

      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="registrations">用户注册</TabsTrigger>
          <TabsTrigger value="students">学员报名</TabsTrigger>
          <TabsTrigger value="rewards">奖励申请</TabsTrigger>
          <TabsTrigger value="roles">角色升级</TabsTrigger>
        </TabsList>

        <TabsContent value="registrations">
          <Card>
            <CardHeader>
              <CardTitle>用户注册审批</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">加载中...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>姓名</TableHead>
                        <TableHead>手机号</TableHead>
                        <TableHead>申请角色</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>创建时间</TableHead>
                        <TableHead>审批进度</TableHead>
                        <TableHead className="text-center">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvals.map((item: any) => {
                        const userDetails = item.user_details;
                        const roleNames = roleTypeMap[userDetails?.requested_role_type] || '未知角色';
                        const progress = item.approval_progress;
                        return (
                          <TableRow key={item.instance.id}>
                            <TableCell>{userDetails?.name || '未知'}</TableCell>
                            <TableCell>{userDetails?.phone || '未提供'}</TableCell>
                            <TableCell>{roleNames}</TableCell>
                            <TableCell>
                              <Badge variant={
                                item.instance.status === 3 ? 'default' :
                                item.instance.status === 4 ? 'destructive' : 'secondary'
                              }>
                                {approvalStatusMap[item.instance.status] || '未知'}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatTime(item.instance.created_at)}</TableCell>
                            <TableCell>{progress?.progress_text || '-'}</TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedApproval({
                                    inst: item.instance,
                                    steps: item.enhanced_steps || item.steps,
                                    userDetails,
                                    approvalType: 'user_registration'
                                  });
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

                  {/* 分页控件 */}
                  {totalPages > 1 && (
                    <div className="mt-4">
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

                      <div className="text-sm text-muted-foreground text-center mt-2">
                        第 {currentPage} 页，共 {totalPages} 页，总计 {total} 条记录
                      </div>
                    </div>
                  )}

                  {/* 分页控件 */}
                  {totalPages > 1 && (
                    <div className="mt-4">
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
                      
                      <div className="text-sm text-muted-foreground text-center mt-2">
                        第 {currentPage} 页，共 {totalPages} 页，总计 {total} 条记录
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>学员报名审批</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">加载中...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>学员姓名</TableHead>
                        <TableHead>手机号</TableHead>
                        <TableHead>课程名称</TableHead>
                        <TableHead>当前步骤</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>创建时间</TableHead>
                        <TableHead>审批进度</TableHead>
                        <TableHead className="text-center">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvals.map((item: any) => {
                        const studentDetails = item.student_details;
                        const currentStepName = getCurrentStepName(item);
                        const progress = item.approval_progress;
                        return (
                          <TableRow key={item.instance.id}>
                            <TableCell className="font-medium">
                              {studentDetails?.student_name || `学员${item.instance.target_id}`}
                            </TableCell>
                            <TableCell>{studentDetails?.phone || '-'}</TableCell>
                            <TableCell>{studentDetails?.course_name || '-'}</TableCell>
                            <TableCell>{currentStepName}</TableCell>
                            <TableCell>
                              <Badge variant={
                                item.instance.status === 3 ? 'default' :
                                item.instance.status === 4 ? 'destructive' : 'secondary'
                              }>
                                {approvalStatusMap[item.instance.status] || '未知'}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatTime(item.instance.created_at)}</TableCell>
                            <TableCell>{progress?.progress_text || '-'}</TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedApproval({
                                    inst: item.instance,
                                    steps: item.enhanced_steps || item.steps,
                                    studentDetails,
                                    approvalType: 'student_enrollment'
                                  });
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

                  {/* 分页控件 */}
                  {totalPages > 1 && (
                    <div className="mt-4">
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

                      <div className="text-sm text-muted-foreground text-center mt-2">
                        第 {currentPage} 页，共 {totalPages} 页，总计 {total} 条记录
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle>奖励申请审批</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">加载中...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>学员姓名</TableHead>
                        <TableHead>申请月份</TableHead>
                        <TableHead>奖励金额</TableHead>
                        <TableHead>当前步骤</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>创建时间</TableHead>
                        <TableHead>审批进度</TableHead>
                        <TableHead className="text-center">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvals.map((item: any) => {
                        const rewardDetails = item.reward_details;
                        const currentStepName = getCurrentStepName(item);
                        const progress = item.approval_progress;
                        return (
                          <TableRow key={item.instance.id}>
                            <TableCell>{rewardDetails?.student_name || '-'}</TableCell>
                            <TableCell>{rewardDetails?.application_month || '-'}</TableCell>
                            <TableCell>
                              {rewardDetails?.reward_amount ? `¥${rewardDetails.reward_amount}` : '-'}
                            </TableCell>
                            <TableCell>{currentStepName}</TableCell>
                            <TableCell>
                              <Badge variant={
                                item.instance.status === 3 ? 'default' :
                                item.instance.status === 4 ? 'destructive' : 'secondary'
                              }>
                                {approvalStatusMap[item.instance.status] || '未知'}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatTime(item.instance.created_at)}</TableCell>
                            <TableCell>{progress?.progress_text || '-'}</TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedApproval({
                                    inst: item.instance,
                                    steps: item.enhanced_steps || item.steps,
                                    rewardDetails,
                                    approvalType: 'reward_application'
                                  });
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

                  {/* 分页控件 */}
                  {totalPages > 1 && (
                    <div className="mt-4">
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

                      <div className="text-sm text-muted-foreground text-center mt-2">
                        第 {currentPage} 页，共 {totalPages} 页，总计 {total} 条记录
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>角色升级审批</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">加载中...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>用户姓名</TableHead>
                        <TableHead>当前角色</TableHead>
                        <TableHead>目标角色</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>创建时间</TableHead>
                        <TableHead>审批进度</TableHead>
                        <TableHead className="text-center">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvals.map((item: any) => {
                        const roleUpgradeDetails = item.role_upgrade_details;
                        const progress = item.approval_progress;
                        return (
                          <TableRow key={item.instance.id}>
                            <TableCell>{roleUpgradeDetails?.user_name || '未知用户'}</TableCell>
                            <TableCell>{roleUpgradeDetails?.current_role || '-'}</TableCell>
                            <TableCell>{roleUpgradeDetails?.target_role || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={
                                item.instance.status === 3 ? 'default' :
                                item.instance.status === 4 ? 'destructive' : 'secondary'
                              }>
                                {approvalStatusMap[item.instance.status] || '未知'}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatTime(item.instance.created_at)}</TableCell>
                            <TableCell>{progress?.progress_text || '-'}</TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedApproval({
                                    inst: item.instance,
                                    steps: item.enhanced_steps || item.steps,
                                    roleUpgradeDetails,
                                    approvalType: 'user_role_upgrade'
                                  });
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

                  {/* 分页控件 */}
                  {totalPages > 1 && (
                    <div className="mt-4">
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

                      <div className="text-sm text-muted-foreground text-center mt-2">
                        第 {currentPage} 页，共 {totalPages} 页，总计 {total} 条记录
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 审批详情抽屉 */}
      <Sheet open={approvalOpen} onOpenChange={setApprovalOpen}>
        <SheetContent side="right" className="w-[520px] sm:max-w-none">
          <SheetHeader>
            <SheetTitle>审批详情</SheetTitle>
          </SheetHeader>
          {selectedApproval && (() => {
            const { inst, steps, userDetails, studentDetails, rewardDetails, roleUpgradeDetails, approvalType } = selectedApproval;
            const current = steps[inst.current_step_index];
            return (
              <div className="space-y-6 py-4">
                {/* 基本信息 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">基本信息</h3>
                  {approvalType === 'user_registration' && userDetails && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">用户姓名</div>
                        <div className="font-medium">{userDetails.name || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">手机号</div>
                        <div className="font-medium">{userDetails.phone || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">申请角色</div>
                        <div className="font-medium">{roleTypeMap[userDetails.requested_role_type] || '未知角色'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">性别</div>
                        <div className="font-medium">{userDetails.gender === 1 ? '男' : userDetails.gender === 2 ? '女' : '未知'}</div>
                      </div>
                      {userDetails.invitation_code && (
                        <div>
                          <div className="text-sm text-muted-foreground">邀请码</div>
                          <div className="font-medium">{userDetails.invitation_code}</div>
                        </div>
                      )}
                      {userDetails.id_card && (
                        <div>
                          <div className="text-sm text-muted-foreground">身份证号</div>
                          <div className="font-medium">{userDetails.id_card}</div>
                        </div>
                      )}
                    </div>
                  )}

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
                        <div className="text-sm text-muted-foreground">学费金额</div>
                        <div className="font-medium">{studentDetails.total_fee ? `¥${studentDetails.total_fee}` : '-'}</div>
                      </div>
                      {studentDetails.recruiter_name && (
                        <div>
                          <div className="text-sm text-muted-foreground">招生人员</div>
                          <div className="font-medium">{studentDetails.recruiter_name}</div>
                        </div>
                      )}
                      {studentDetails.enrollment_date && (
                        <div>
                          <div className="text-sm text-muted-foreground">报名时间</div>
                          <div className="font-medium">{formatTime(studentDetails.enrollment_date)}</div>
                        </div>
                      )}
                      {studentDetails.id_card && (
                        <div>
                          <div className="text-sm text-muted-foreground">身份证号</div>
                          <div className="font-medium">{studentDetails.id_card}</div>
                        </div>
                      )}
                      {studentDetails.gender !== undefined && (
                        <div>
                          <div className="text-sm text-muted-foreground">性别</div>
                          <div className="font-medium">{studentDetails.gender === 1 ? '男' : studentDetails.gender === 2 ? '女' : '未知'}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {approvalType === 'reward_application' && rewardDetails && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">学员姓名</div>
                        <div className="font-medium">{rewardDetails.student_name || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">申请月份</div>
                        <div className="font-medium">{rewardDetails.application_month || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">奖励金额</div>
                        <div className="font-medium">{rewardDetails.reward_amount ? `¥${rewardDetails.reward_amount}` : '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">申请原因</div>
                        <div className="font-medium">{rewardDetails.application_reason || '-'}</div>
                      </div>
                      {rewardDetails.applicant_name && (
                        <div>
                          <div className="text-sm text-muted-foreground">申请人</div>
                          <div className="font-medium">{rewardDetails.applicant_name}</div>
                        </div>
                      )}
                      {rewardDetails.course_name && (
                        <div>
                          <div className="text-sm text-muted-foreground">课程名称</div>
                          <div className="font-medium">{rewardDetails.course_name}</div>
                        </div>
                      )}
                      {rewardDetails.student_phone && (
                        <div>
                          <div className="text-sm text-muted-foreground">学员手机号</div>
                          <div className="font-medium">{rewardDetails.student_phone}</div>
                        </div>
                      )}
                      {rewardDetails.application_date && (
                        <div>
                          <div className="text-sm text-muted-foreground">申请时间</div>
                          <div className="font-medium">{formatTime(rewardDetails.application_date)}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {approvalType === 'user_role_upgrade' && roleUpgradeDetails && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">用户姓名</div>
                        <div className="font-medium">{roleUpgradeDetails.user_name || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">当前角色</div>
                        <div className="font-medium">{roleUpgradeDetails.current_role || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">目标角色</div>
                        <div className="font-medium">{roleUpgradeDetails.target_role || '-'}</div>
                      </div>
                      {roleUpgradeDetails.upgrade_reason && (
                        <div>
                          <div className="text-sm text-muted-foreground">升级原因</div>
                          <div className="font-medium">{roleUpgradeDetails.upgrade_reason}</div>
                        </div>
                      )}
                      {roleUpgradeDetails.phone && (
                        <div>
                          <div className="text-sm text-muted-foreground">手机号</div>
                          <div className="font-medium">{roleUpgradeDetails.phone}</div>
                        </div>
                      )}
                      {roleUpgradeDetails.application_date && (
                        <div>
                          <div className="text-sm text-muted-foreground">申请时间</div>
                          <div className="font-medium">{formatTime(roleUpgradeDetails.application_date)}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 审批流程时间线 */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">审批流程</h3>
                  <div className="space-y-3">
                    {steps.map((s: any, index: number) => {
                      const stepStatus = stepStatusMap[s.status] || { label: '未知', variant: 'secondary' as const };
                      const isCurrentStep = index === inst.current_step_index;
                      return (
                        <div key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isCurrentStep ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                          <Badge variant={isCurrentStep ? 'default' : stepStatus.variant}>
                            {stepNameMap[s.step_key] || s.step_key}
                          </Badge>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{stepStatus.label}</div>
                            {s.auditor_name && (
                              <div className="text-xs text-gray-600">审批人: {s.auditor_name}</div>
                            )}
                            {s.audit_time && (
                              <div className="text-xs text-gray-600">审批时间: {formatTime(s.audit_time)}</div>
                            )}
                            {s.audit_reason && (
                              <div className="text-xs text-gray-600">审批意见: {s.audit_reason}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 审批操作 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">审批操作</h3>
                  {inst.status === 2 && current && current.status === 1 && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprovalDecision(inst.id, current.step_key, true)}
                        className="flex-1"
                      >
                        通过
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleApprovalDecision(inst.id, current.step_key, false, '拒绝')}
                        className="flex-1"
                      >
                        拒绝
                      </Button>
                    </div>
                  )}
                  {current && current.status !== 1 && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      当前步骤已处理，状态：{stepStatusMap[current.status]?.label || '未知'}
                      {current.auditor_name && ` (审批人: ${current.auditor_name})`}
                    </div>
                  )}
                  {inst.status === 3 && (
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                      审批已完成，状态：已通过
                    </div>
                  )}
                  {inst.status === 4 && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      审批已完成，状态：已拒绝
                    </div>
                  )}
                  {inst.status === 1 && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
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
