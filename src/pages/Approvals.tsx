import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { fetchApprovals, fetchApprovalsPending, decideApprovalStep, markStudentAsPaid } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ApprovalProgress } from "@/components/ApprovalProgress";

// 状态映射
const approvalStatusMap: Record<number, string> = {
  1: "待开始",
  2: "进行中",
  3: "已通过",
  4: "已拒绝",
};

const stepStatusMap: Record<
  number,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  1: { label: "未开始", variant: "outline" },
  2: { label: "待审批", variant: "secondary" },
  3: { label: "已通过", variant: "default" },
  4: { label: "已拒绝", variant: "destructive" },
  5: { label: "已跳过", variant: "outline" },
};

const stepNameMap: Record<string, string> = {
  exam: "考务审核",
  finance: "财务发放", // 旧流程，保留兼容
  finance_review: "财务审核",
  gm: "总经理审批",
  gm_final: "总经理最终审批",
};

const roleTypeMap: Record<number, string> = {
  1: "全职招生员",
  2: "兼职招生员",
  3: "自由招生员",
  4: "兼职团队负责人",
  5: "渠道招生",
  6: "总经理",
  7: "考务组",
  8: "财务",
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
  const currentTab = searchParams.get("type") || "registrations";
  const currentStatus = searchParams.get("status")
    ? parseInt(searchParams.get("status")!)
    : undefined;

  // 标签页映射
  const tabTypeMap: Record<string, string> = {
    registrations: "user_registration",
    students: "student_enrollment",
    rewards: "reward_application",
    roles: "user_role_upgrade",
  };

  // 加载审批数据
  const loadApprovalData = async () => {
    setLoading(true);
    try {
      const targetType = tabTypeMap[currentTab];

      // 使用后端分页和筛选功能
      const response = await fetchApprovals(
        currentPage,
        pageSize,
        targetType === 'all' ? undefined : targetType,
        currentStatus
      );

      setApprovals(response.items || []);
      setTotal(response.total || 0);
      setTotalPages(response.pages || 0);
    } catch (error) {
      console.error("Failed to load approval data:", error);
    } finally {
      setLoading(false);
    }
  };

  // 处理标签页切换
  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("type", value);
    newParams.delete("status"); // 切换标签页时清除状态筛选
    setSearchParams(newParams);
    setCurrentPage(1); // 重置页码
  };

  // 处理状态筛选
  const handleStatusChange = (status: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (status === "all") {
      newParams.delete("status");
    } else {
      newParams.set("status", status);
    }
    setSearchParams(newParams);
    setCurrentPage(1); // 重置页码
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 处理审批决策 - 简化版本，后端状态机处理所有流转逻辑
  const handleApprovalDecision = async (
    instanceId: number,
    stepKey: string,
    approve: boolean,
    reason?: string
  ) => {
    try {
      // 后端状态机会自动处理流转，返回更新后的完整状态
      await decideApprovalStep(instanceId.toString(), stepKey, approve, reason);

      // 关闭弹窗
      setApprovalOpen(false);

      // 重新加载数据以获取最新状态
      await loadApprovalData();

    } catch (error) {
      console.error("审批处理失败:", error);

      // 显示错误提示
      const errorMessage = error instanceof Error ? error.message : "审批处理失败";

      // 创建错误提示元素
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      errorDiv.textContent = errorMessage;
      document.body.appendChild(errorDiv);

      // 3秒后自动移除
      setTimeout(() => {
        if (document.body.contains(errorDiv)) {
          document.body.removeChild(errorDiv);
        }
      }, 3000);
    }
  };

  // 获取当前步骤名称
  const getCurrentStepName = (item: any) => {
    const steps = item.steps;
    if (!steps || steps.length === 0) return "未知步骤";

    const currentStepIndex = item.instance.current_step_index;
    if (currentStepIndex < 0 || currentStepIndex >= steps.length)
      return "未知步骤";

    const currentStep = steps[currentStepIndex];
    if (!currentStep || !currentStep.step_key) return "未知步骤";

    return stepNameMap[currentStep.step_key] || currentStep.step_key;
  };

  // 格式化时间
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "-";
    return new Date(timeStr).toLocaleString("zh-CN");
  };

  // 检查用户是否有审批当前步骤的权限 - 已根据要求移除限制，始终返回true
  const canApproveStep = (step: any): boolean => {
    return true;
  };

  // 检查步骤是否可以审批（考虑前置步骤）
  const canProcessStep = (steps: any[], currentStep: any): { canProcess: boolean; reason: string } => {
    if (!currentStep) {
      return { canProcess: false, reason: "没有待处理步骤" };
    }

    // 检查权限
    if (!canApproveStep(currentStep)) {
      return {
        canProcess: false,
        reason: "您没有审批该步骤所需的角色权限"
      };
    }

    // 检查步骤状态是否为待审批 (2)
    if (currentStep.status !== 2) {
      return { canProcess: false, reason: `步骤状态为 "${stepStatusMap[currentStep.status]?.label || '未知'}"，无法操作` };
    }

    return { canProcess: true, reason: "" };
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
              <Select
                value={currentStatus?.toString() || "all"}
                onValueChange={handleStatusChange}
              >
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
                        {currentTab === "students" ? (
                          <>
                            <TableHead>招生人员</TableHead>
                            <TableHead>学员信息</TableHead>
                            <TableHead>奖励金额</TableHead>
                            <TableHead>当前步骤</TableHead>
                            <TableHead>审批状态</TableHead>
                            <TableHead>创建时间</TableHead>
                            <TableHead>操作</TableHead>
                          </>
                        ) : currentTab === "rewards" ? (
                          <>
                            <TableHead>招生人员</TableHead>
                            <TableHead>学员信息</TableHead>
                            <TableHead>奖励金额</TableHead>
                            <TableHead>当前步骤</TableHead>
                            <TableHead>审批状态</TableHead>
                            <TableHead>创建时间</TableHead>
                            <TableHead>操作</TableHead>
                          </>
                        ) : (
                          <>
                            <TableHead>申请人</TableHead>
                            <TableHead>当前步骤</TableHead>
                            <TableHead>审批状态</TableHead>
                            <TableHead>创建时间</TableHead>
                            <TableHead>操作</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvals.map((item) => {
                        const {
                          instance: inst,
                          user_details,
                          student_details,
                          reward_details,
                          role_upgrade_details,
                        } = item;
                        const steps = item.steps || [];
                        const current = steps[inst.current_step_index];

                        // 获取申请人姓名
                        const getApplicantName = () => {
                          if (
                            inst.target_type === "user_registration" &&
                            user_details
                          ) {
                            return user_details.name;
                          }
                          if (
                            inst.target_type === "student_enrollment" &&
                            student_details
                          ) {
                            return student_details.student_name;
                          }
                          if (
                            inst.target_type === "reward_application" &&
                            reward_details
                          ) {
                            // 优先使用 student_name，回退到 applicant_name
                            return (
                              reward_details.student_name ||
                              reward_details.applicant_name
                            );
                          }
                          if (
                            inst.target_type === "user_role_upgrade" &&
                            role_upgrade_details
                          ) {
                            return role_upgrade_details.user_name;
                          }
                          return `ID: ${inst.target_id}`;
                        };

                        // 获取招生人员信息
                        const getRecruiterName = () => {
                          if (
                            inst.target_type === "student_enrollment" &&
                            student_details
                          ) {
                            return (
                              student_details.recruiter_name || "未知招生人员"
                            );
                          }
                          if (
                            inst.target_type === "reward_application" &&
                            reward_details
                          ) {
                            return (
                              reward_details.recruiter_name || "未知招生人员"
                            );
                          }
                          return "-";
                        };

                        // 获取学员信息
                        const getStudentInfo = () => {
                          if (
                            inst.target_type === "student_enrollment" &&
                            student_details
                          ) {
                            return `${student_details.student_name} (${
                              student_details.course_name || "未知课程"
                            })`;
                          }
                          if (
                            inst.target_type === "reward_application" &&
                            reward_details &&
                            student_details
                          ) {
                            return `${reward_details.student_name} (${
                              student_details.course_name || "未知课程"
                            })`;
                          }
                          return "-";
                        };

                        // 获取奖励金额
                        const getRewardAmount = () => {
                          if (
                            inst.target_type === "student_enrollment" &&
                            student_details
                          ) {
                            return student_details.reward_amount
                              ? `¥${student_details.reward_amount}`
                              : "¥0";
                          }
                          if (
                            inst.target_type === "reward_application" &&
                            reward_details
                          ) {
                            return reward_details.reward_amount
                              ? `¥${reward_details.reward_amount}`
                              : "¥0";
                          }
                          return "-";
                        };

                        return (
                          <TableRow key={inst.id}>
                            {currentTab === "students" ||
                            currentTab === "rewards" ? (
                              <>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="font-medium">
                                      {getRecruiterName()}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {(() => {
                                        // 优先使用 student_details.recruiter_role（字符串格式）
                                        if (student_details?.recruiter_role) {
                                          return student_details.recruiter_role;
                                        }
                                        // 回退到 user_details.roles 数组格式
                                        if (item.user_details?.roles && item.user_details.roles.length > 0) {
                                          const activeRoles = item.user_details.roles
                                            .filter(role => role.status === 1)
                                            .map(role => roleTypeMap[role.role_type])
                                            .filter(Boolean);
                                          return activeRoles.length > 0 ? activeRoles.join(", ") : "未知身份";
                                        }
                                        return "未知身份";
                                      })()}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="font-medium">
                                      {getStudentInfo()}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      手机:{" "}
                                      {student_details?.phone ||
                                        reward_details?.phone ||
                                        "未知"}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium text-green-600">
                                    {getRewardAmount()}
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
                                      inst.status === 3
                                        ? "default"
                                        : inst.status === 4
                                        ? "destructive"
                                        : "secondary"
                                    }
                                  >
                                    {approvalStatusMap[inst.status] || "未知"}
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
                              </>
                            ) : (
                              <>
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
                                      inst.status === 3
                                        ? "default"
                                        : inst.status === 4
                                        ? "destructive"
                                        : "secondary"
                                    }
                                  >
                                    {approvalStatusMap[inst.status] || "未知"}
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
                              </>
                            )}
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
                              onClick={() =>
                                currentPage > 1 &&
                                handlePageChange(currentPage - 1)
                              }
                              className={
                                currentPage <= 1
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
                            />
                          </PaginationItem>

                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
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
                            }
                          )}

                          {totalPages > 5 && <PaginationEllipsis />}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() =>
                                currentPage < totalPages &&
                                handlePageChange(currentPage + 1)
                              }
                              className={
                                currentPage >= totalPages
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
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
        <SheetContent className="min-w-[600px] sm:max-w-[800px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>审批详情</SheetTitle>
          </SheetHeader>
          {selectedApproval &&
            (() => {
              const {
                instance: inst,
                steps,
                user_details,
                student_details,
                reward_details,
                role_upgrade_details,
              } = selectedApproval;
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
                          {inst.target_type === "user_registration" &&
                            "用户注册申请"}
                          {inst.target_type === "student_enrollment" &&
                            "学员报名申请"}
                          {inst.target_type === "reward_application" &&
                            "奖励申请"}
                          {inst.target_type === "user_role_upgrade" &&
                            "角色升级申请"}
                        </div>
                      </div>
                      {/* 隐藏申请ID，根据需求不显示 */}
                      <div>
                        <label className="text-sm font-medium">当前状态</label>
                        <div className="mt-1">
                          <Badge
                            variant={
                              inst.status === 3
                                ? "default"
                                : inst.status === 4
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {approvalStatusMap[inst.status]}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">创建时间</label>
                        <div className="mt-1">
                          {formatTime(inst.created_at)}
                        </div>
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
                          <label className="text-sm font-medium">
                            学员姓名
                          </label>
                          <div className="mt-1">
                            {student_details.student_name}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">手机号</label>
                          <div className="mt-1">
                            {student_details.phone || "未提供"}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            报读课程
                          </label>
                          <div className="mt-1">
                            {student_details.course_name}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            学费金额
                          </label>
                          <div className="mt-1">
                            ¥{student_details.total_fee}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            缴费状态
                          </label>
                          <div className="mt-1">
                            {student_details.payment_type === 1 ? (
                              <Badge variant="default">
                                全额缴费 ¥{student_details.paid_amount}
                              </Badge>
                            ) : student_details.payment_type === 2 ? (
                              <Badge variant="secondary">
                                首款缴费 ¥{student_details.paid_amount}/
                                {student_details.total_fee}
                              </Badge>
                            ) : (
                              <Badge variant="outline">未知缴费方式</Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            奖励金额
                          </label>
                          <div className="mt-1 text-green-600 font-medium">
                            ¥{student_details.reward_amount || 0}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            招生人员
                          </label>
                          <div className="mt-1">
                            <div className="font-medium">
                              {student_details.recruiter_name || "未知"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {(() => {
                                // 优先使用 student_details.recruiter_role（字符串格式）
                                if (student_details.recruiter_role) {
                                  return student_details.recruiter_role;
                                }
                                // 回退到 user_details.roles 数组格式
                                if (selectedApproval.user_details?.roles && selectedApproval.user_details.roles.length > 0) {
                                  const activeRoles = selectedApproval.user_details.roles
                                    .filter(role => role.status === 1)
                                    .map(role => roleTypeMap[role.role_type])
                                    .filter(Boolean);
                                  return activeRoles.length > 0 ? activeRoles.join(", ") : "未知身份";
                                }
                                return "未知身份";
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {reward_details && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">奖励信息</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">
                            招生人员
                          </label>
                          <div className="mt-1">
                            {reward_details.recruiter_name || "未知招生人员"}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            学员信息
                          </label>
                          <div className="mt-1">
                            {reward_details.student_name} (
                            {student_details?.course_name || "未知课程"})
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            奖励金额
                          </label>
                          <div className="mt-1 text-green-600 font-medium">
                            ¥{reward_details.reward_amount}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            申请原因
                          </label>
                          <div className="mt-1">
                            {reward_details.application_reason || "无"}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            申请月份
                          </label>
                          <div className="mt-1">
                            {reward_details.application_month || "未指定"}
                          </div>
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
                          <div className="mt-1">
                            {role_upgrade_details.user_name}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            当前角色
                          </label>
                          <div className="mt-1">
                            {role_upgrade_details.current_role}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            目标角色
                          </label>
                          <div className="mt-1">
                            {role_upgrade_details.target_role}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 审批流程 - 使用新的进度组件 */}
                  <ApprovalProgress
                    steps={steps}
                    currentStepIndex={inst.current_step_index}
                  />

                  {/* 财务专属操作：标记为已回款 */}
                  {inst.target_type === "student_enrollment" &&
                    student_details?.payment_type === 2 &&
                    user?.role === 'finance_staff' && (
                      <div className="pt-4 border-t">
                        <h3 className="text-lg font-semibold mb-2">财务操作</h3>
                        <Button
                          onClick={async () => {
                            await markStudentAsPaid(student_details.student_id);
                            setApprovalOpen(false);
                            loadApprovalData();
                          }}
                        >
                          标记为已回款
                        </Button>
                        <p className="text-sm text-muted-foreground mt-2">
                          点击此按钮确认该学员的尾款已缴清。确认后，系统将允许为该学员申请奖励。
                        </p>
                      </div>
                    )}



                  {/* 审批操作 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">审批操作</h3>
                    {(() => {
                      // 如果审批已完成，显示完成状态
                      if (inst.status === 3) {
                        return (
                          <div className="text-sm text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950 p-3 rounded-lg">
                            审批已完成，状态：已通过
                          </div>
                        );
                      }

                      if (inst.status === 4) {
                        return (
                          <div className="text-sm text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950 p-3 rounded-lg">
                            审批已完成，状态：已拒绝
                          </div>
                        );
                      }

                      if (inst.status === 1) {
                        return (
                          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                            审批尚未开始
                          </div>
                        );
                      }

                      // 直接使用后端提供的当前步骤
                      const currentApprovalStep = steps[inst.current_step_index];

                      if (!currentApprovalStep) {
                        return (
                          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                            无法确定当前审批步骤，请检查流程配置。
                          </div>
                        );
                      }

                      // 检查当前步骤是否可以处理
                      const { canProcess, reason } = canProcessStep(steps, currentApprovalStep);

                      if (canProcess) {
                        // 可以处理，显示审批按钮
                        return (
                          <div className="flex gap-2">
                            <Button
                              onClick={() =>
                                handleApprovalDecision(
                                  inst.id,
                                  currentApprovalStep.step_key,
                                  true
                                )
                              }
                              className="flex-1"
                            >
                              通过 ({stepNameMap[currentApprovalStep.step_key] || currentApprovalStep.step_key})
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() =>
                                handleApprovalDecision(
                                  inst.id,
                                  currentApprovalStep.step_key,
                                  false,
                                  "拒绝"
                                )
                              }
                              className="flex-1"
                            >
                              拒绝 ({stepNameMap[currentApprovalStep.step_key] || currentApprovalStep.step_key})
                            </Button>
                          </div>
                        );
                      } else {
                        // 不能处理，显示原因
                        return (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Button
                                disabled
                                className="flex-1"
                              >
                                通过 ({stepNameMap[currentApprovalStep.step_key] || currentApprovalStep.step_key})
                              </Button>
                              <Button
                                variant="destructive"
                                disabled
                                className="flex-1"
                              >
                                拒绝 ({stepNameMap[currentApprovalStep.step_key] || currentApprovalStep.step_key})
                              </Button>
                            </div>
                            <div className="text-sm text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950 p-3 rounded-lg">
                              {reason}
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              );
            })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
