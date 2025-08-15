import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { fetchApprovalsPending, decideApprovalStep } from '@/lib/api';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CheckCircle, XCircle, Clock, User, FileText, Award, GraduationCap, Check, X, Eye, CheckCheck, XOctagon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { MessageDialog } from '@/components/common/MessageDialog';
import { InputDialog } from '@/components/common/InputDialog';
import { useMessage } from '@/hooks/useMessage';
import { useConfirm } from '@/hooks/useConfirm';
import { useInput } from '@/hooks/useInput';

export default function Approvals() {
  const [approvalItems, setApprovalItems] = useState<any[]>([]);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set()); // 跟踪正在处理的项目
  
  // 获取当前用户信息
  const { user } = useAppStore();
  
  // 消息、确认和输入弹窗
  const { messageState, success, error, close: closeMessage } = useMessage();
  const { confirmState, confirm, close: closeConfirm } = useConfirm();
  const { inputState, input, close: closeInput } = useInput();

  // 检查用户是否有权限审批当前步骤
  const canUserApproveStep = (stepKey: string): boolean => {
    if (!user) return false;
    
    // 根据步骤key和用户角色判断权限
    switch (stepKey) {
      case 'finance':
        return user.role === 'finance' || user.role === 'system_admin';
      case 'gm':
        return user.role === 'general_manager' || user.role === 'system_admin';
      case 'exam_admin':
        return user.role === 'exam_admin' || user.role === 'system_admin';
      default:
        // 系统管理员可以审批所有步骤
        return user.role === 'system_admin';
    }
  };

  // 检查是否显示审批按钮
  const shouldShowApprovalButtons = (instance: any, currentStep: any): boolean => {
    if (!instance || !currentStep) {
      return false;
    }

    // 检查当前步骤是否待审批（status = 1）且用户有权限审批
    return currentStep.status === 1 && canUserApproveStep(currentStep.step_key);
  };

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const items = await fetchApprovalsPending();
      setApprovalItems(items || []);
    } catch (err) {
      error('加载失败', '无法获取审批列表，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  // 直接审批处理
  const handleDirectApproval = async (instance: any, steps: any[], approve: boolean) => {
    const currentStep = steps[instance.current_step_index];
    if (!currentStep) {
      error('操作失败', '当前审批步骤不存在，无法执行操作');
      return;
    }

    // 生成处理项目的唯一键
    const processingKey = `${instance.id}-${approve ? 'approve' : 'reject'}`;
    
    try {
      // 设置该项目为处理中状态
      setProcessingItems(prev => new Set(prev).add(processingKey));
      let reason = '';
      
      if (!approve) {
        // 拒绝操作 - 使用专业输入对话框
        const rejectReason = await new Promise<string | null>((resolve) => {
          let resolved = false;
          
          // 根据审批类型提供不同的拒绝理由模板
          const getRejectTemplates = (targetType: string) => {
            switch (targetType) {
              case 'user_registration':
                return [
                  '身份信息不完整，请补充身份证明文件',
                  '联系方式无法验证，请提供有效电话号码',
                  '邀请码已失效或不正确',
                  '资料填写不规范，请按要求重新填写'
                ];
              case 'reward_application':
                return [
                  '申请材料不齐全，请补充相关证明',
                  '申请金额超出规定标准',
                  '不符合奖励发放条件',
                  '需要提供更多业绩证明'
                ];
              case 'user_role_upgrade':
                return [
                  '暂未达到升级要求的业绩标准',
                  '需要完成相关培训后再申请',
                  '考核成绩不满足升级条件',
                  '申请时间不在规定期限内'
                ];
              default:
                return [
                  '申请材料不完整',
                  '不符合审批标准',
                  '需要补充相关信息',
                  '请联系管理员了解详情'
                ];
            }
          };

          input({
            title: '请输入拒绝原因',
            description: '请详细说明拒绝的原因，以便申请人了解并改进。您可以选择常用模板或自定义输入。',
            placeholder: '请输入拒绝的具体原因...',
            confirmText: '确认拒绝',
            cancelText: '取消',
            variant: 'destructive',
            minLength: 5,
            templates: getRejectTemplates(instance.target_type),
            onConfirm: (value: string) => {
              if (!resolved) {
                resolved = true;
                resolve(value);
                closeInput();
              }
            }
          });
          
          // 监听对话框关闭事件（取消情况）
          const checkClosed = () => {
            if (!inputState.open && !resolved) {
              resolved = true;
              resolve(null);
            } else if (!resolved) {
              setTimeout(checkClosed, 100);
            }
          };
          setTimeout(checkClosed, 100);
        });
        
        if (!rejectReason) return;
        reason = rejectReason;
      } else {
        // 通过操作 - 使用专业确认对话框
        const confirmed = await new Promise<boolean>((resolve) => {
          let resolved = false;
          confirm({
            title: '确认审批',
            description: `确认通过此${getApprovalTypeInfo(instance.target_type).text}申请吗？`,
            confirmText: '确认通过',
            cancelText: '取消',
            variant: 'default',
            onConfirm: () => {
              if (!resolved) {
                resolved = true;
                resolve(true);
                closeConfirm();
              }
            }
          });
          
          // 监听对话框关闭事件（取消情况）
          const checkClosed = () => {
            if (!confirmState.open && !resolved) {
              resolved = true;
              resolve(false);
            } else if (!resolved) {
              setTimeout(checkClosed, 100);
            }
          };
          setTimeout(checkClosed, 100);
        });
        
        if (!confirmed) return;
      }

      // 执行审批操作
      await decideApprovalStep(
        instance.id,
        currentStep.step_key,
        approve,
        reason
      );

      // 显示成功提示
      const actionText = approve ? '通过' : '拒绝';
      const typeText = getApprovalTypeInfo(instance.target_type).text;
      const successIcon = approve ? '✅' : '❌';
      success(
        `审批${actionText}`,
        `${successIcon} ${typeText}申请已${actionText}！${approve ? '' : `\n拒绝理由：${reason}`}`
      );
      
      // 刷新列表
      await loadApprovals();
    } catch (err: any) {
      console.error('审批操作失败:', err);
      const errorMessage = err?.message || '审批操作失败，请稍后重试';
      const actionText = approve ? '通过' : '拒绝';
      error(
        `审批${actionText}失败`, 
        `❌ ${errorMessage}\n请检查网络连接或联系管理员`
      );
    } finally {
      // 清除该项目的处理状态
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(processingKey);
        return newSet;
      });
    }
  };

  // 获取审批状态徽章
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="text-orange-600 bg-orange-100">待审批</Badge>;
      case 'APPROVED':
        return <Badge variant="default" className="text-green-600 bg-green-100">已通过</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive" className="text-red-600 bg-red-100">已拒绝</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 获取审批类型信息
  const getApprovalTypeInfo = (targetType: string) => {
    switch (targetType) {
      case 'user_registration':
        return { text: '用户注册', icon: User, color: 'text-blue-500' };
      case 'user_role_upgrade':
        return { text: '角色升级', icon: GraduationCap, color: 'text-purple-500' };
      case 'reward_application':
        return { text: '奖励申请', icon: Award, color: 'text-yellow-500' };
      default:
        return { text: targetType, icon: FileText, color: 'text-gray-500' };
    }
  };

  // 审批按钮组件 - 减少重复代码
  const ApprovalButtons = ({ instance, steps }: { instance: any, steps: any[] }) => {
    const current = steps[instance.current_step_index];
    const approveKey = `${instance.id}-approve`;
    const rejectKey = `${instance.id}-reject`;
    const isApprovingThis = processingItems.has(approveKey);
    const isRejectingThis = processingItems.has(rejectKey);
    const isProcessingThis = isApprovingThis || isRejectingThis;
    
    return (
      <div className="flex items-center gap-3">
        {/* 审批按钮 - 只有有权限的用户才能看到 */}
        {shouldShowApprovalButtons(instance, current) && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={isProcessingThis}
              className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 hover:border-green-300 disabled:opacity-50 px-3 py-1.5 text-xs font-medium transition-colors duration-200 flex items-center gap-1"
              onClick={() => handleDirectApproval(instance, steps, true)}
            >
              {isApprovingThis ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border border-green-600 border-t-transparent" />
                  处理中
                </>
              ) : (
                <>
                  <Check className="h-3 w-3" />
                  通过
                </>
              )}
            </Button>
            <Button
              size="sm"
              disabled={isProcessingThis}
              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 hover:border-red-300 disabled:opacity-50 px-3 py-1.5 text-xs font-medium transition-colors duration-200 flex items-center gap-1"
              onClick={() => handleDirectApproval(instance, steps, false)}
            >
              {isRejectingThis ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border border-red-600 border-t-transparent" />
                  处理中
                </>
              ) : (
                <>
                  <X className="h-3 w-3" />
                  拒绝
                </>
              )}
            </Button>
          </div>
        )}
        <Button
          size="sm"
          variant="outline"
          disabled={isProcessingThis}
          className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-gray-200 hover:border-gray-300 disabled:opacity-50 px-3 py-1.5 text-xs font-medium transition-colors duration-200 flex items-center gap-1"
          onClick={() => { setSelectedApproval({ inst: instance, steps }); setApprovalOpen(true); }}
        >
          <Eye className="h-3 w-3" />
          查看详情
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">审批中心</h1>
          <p className="text-muted-foreground">统一处理各类审批申请，高效便捷的审批工作流</p>
          {user && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {user.role === 'finance' && '财务审批员'}
                {user.role === 'general_manager' && '总经理'}
                {user.role === 'exam_admin' && '考试管理员'}
                {user.role === 'system_admin' && '系统管理员'}
                {!['finance', 'general_manager', 'exam_admin', 'system_admin'].includes(user.role) && '普通用户'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                您可以审批对应权限范围内的申请
              </span>
            </div>
          )}
        </div>
        <Button onClick={loadApprovals} disabled={loading}>
          {loading ? '刷新中...' : '刷新'}
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            全部审批
          </TabsTrigger>
          <TabsTrigger value="registrations" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            用户注册
          </TabsTrigger>
          <TabsTrigger value="upgrades" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            角色升级
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            奖励申请
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                全部审批申请
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {approvalItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>当前没有待处理的审批事项</p>
                  </div>
                ) : (
                  approvalItems.map((item: any) => {
                    const inst = item.instance;
                    const steps = item.steps || [];
                    const current = steps[inst.current_step_index];
                    const typeInfo = getApprovalTypeInfo(inst.target_type);
                    const TypeIcon = typeInfo.icon;

                    return (
                      <div key={inst.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full bg-muted ${typeInfo.color}`}>
                              <TypeIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{typeInfo.text}</h3>
                                {getStatusBadge(inst.status)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                申请ID: {inst.target_id} | 当前步骤: {current?.step_key || '无'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                创建时间: {new Date(inst.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <ApprovalButtons instance={inst} steps={steps} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registrations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                用户注册审批
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {approvalItems.filter((it: any) => it.instance?.target_type === 'user_registration').length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>当前没有待处理的用户注册申请</p>
                  </div>
                ) : (
                  approvalItems
                    .filter((it: any) => it.instance?.target_type === 'user_registration')
                    .map((it: any) => {
                      const inst = it.instance;
                      const steps = it.steps || [];
                      const current = steps[inst.current_step_index];
                      const typeInfo = getApprovalTypeInfo(inst.target_type);
                      const TypeIcon = typeInfo.icon;

                      return (
                        <div key={inst.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full bg-muted ${typeInfo.color}`}>
                                <TypeIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium">{typeInfo.text}</h3>
                                  {getStatusBadge(inst.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  申请ID: {inst.target_id} | 当前步骤: {current?.step_key || '无'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  创建时间: {new Date(inst.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <ApprovalButtons instance={inst} steps={steps} />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upgrades">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-500" />
                角色升级审批
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {approvalItems.filter((it: any) => it.instance?.target_type === 'user_role_upgrade').length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>当前没有待处理的角色升级申请</p>
                  </div>
                ) : (
                  approvalItems
                    .filter((it: any) => it.instance?.target_type === 'user_role_upgrade')
                    .map((it: any) => {
                      const inst = it.instance;
                      const steps = it.steps || [];
                      const current = steps[inst.current_step_index];
                      const typeInfo = getApprovalTypeInfo(inst.target_type);
                      const TypeIcon = typeInfo.icon;

                      return (
                        <div key={inst.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full bg-muted ${typeInfo.color}`}>
                                <TypeIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium">{typeInfo.text}</h3>
                                  {getStatusBadge(inst.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  申请ID: {inst.target_id} | 当前步骤: {current?.step_key || '无'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  创建时间: {new Date(inst.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <ApprovalButtons instance={inst} steps={steps} />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                奖励申请审批
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {approvalItems.filter((it: any) => it.instance?.target_type === 'reward_application').length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>当前没有待处理的奖励申请</p>
                  </div>
                ) : (
                  approvalItems
                    .filter((it: any) => it.instance?.target_type === 'reward_application')
                    .map((it: any) => {
                      const inst = it.instance;
                      const steps = it.steps || [];
                      const current = steps[inst.current_step_index];
                      const typeInfo = getApprovalTypeInfo(inst.target_type);
                      const TypeIcon = typeInfo.icon;

                      return (
                        <div key={inst.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full bg-muted ${typeInfo.color}`}>
                                <TypeIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium">{typeInfo.text}</h3>
                                  {getStatusBadge(inst.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  申请ID: {inst.target_id} | 当前步骤: {current?.step_key || '无'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  创建时间: {new Date(inst.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <ApprovalButtons instance={inst} steps={steps} />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
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
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium mb-1">💡 操作提示</p>
                  <p className="text-xs text-blue-600">
                    请在列表中使用"通过"或"拒绝"按钮进行审批操作，此处仅用于查看详细信息。
                  </p>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* 专业弹窗组件 */}
      <MessageDialog
        type={messageState.type}
        title={messageState.title}
        message={messageState.message}
        open={messageState.open}
        onOpenChange={closeMessage}
      />
      
      <ConfirmDialog
        title={confirmState.title}
        description={confirmState.description}
        open={confirmState.open}
        onOpenChange={closeConfirm}
        onConfirm={confirmState.onConfirm}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />
      
      <InputDialog
        title={inputState.title}
        description={inputState.description}
        placeholder={inputState.placeholder}
        open={inputState.open}
        onOpenChange={closeInput}
        onConfirm={inputState.onConfirm}
        confirmText={inputState.confirmText}
        cancelText={inputState.cancelText}
        variant={inputState.variant}
        minLength={inputState.minLength}
      />
    </div>
  );
}