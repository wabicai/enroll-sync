/**
 * 审批状态机前端适配器
 * 提供简洁的API接口，隐藏复杂的状态机逻辑
 */

import { httpGet, httpPost } from './api';

// 状态枚举
export enum InstanceStatus {
  NOT_STARTED = 1,
  IN_PROGRESS = 2,
  COMPLETED = 3,
  REJECTED = 4,
  CANCELLED = 5
}

export enum StepStatus {
  NOT_STARTED = 1,
  PENDING = 2,
  APPROVED = 3,
  REJECTED = 4,
  SKIPPED = 5
}

// 类型定义
export interface ApprovalStep {
  id: string;
  step_key: string;
  step_name: string;
  step_order: number;
  status: StepStatus;
  approver_roles: string[];
  approver_user_id?: string;
  approver_name?: string;
  is_required: boolean;
  can_skip: boolean;
  processed_at?: string;
  reason?: string;
}

export interface ApprovalInstance {
  id: string;
  target_type: string;
  target_id: string;
  status: InstanceStatus;
  current_step_index: number;
  workflow_config: any;
  metadata: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface ApprovalWorkflow {
  instance: ApprovalInstance;
  steps: ApprovalStep[];
  current_step?: ApprovalStep;
  next_step?: ApprovalStep;
  is_completed: boolean;
  can_approve: boolean;
  available_actions: string[];
}

export interface ApprovalAction {
  action: 'approve' | 'reject' | 'skip';
  step_key: string;
  reason?: string;
}

/**
 * 审批状态机客户端
 */
export class ApprovalStateMachineClient {
  private apiPrefix = '/api/v1/approvals';

  /**
   * 获取审批工作流状态
   */
  async getWorkflow(instanceId: string): Promise<ApprovalWorkflow> {
    const response = await httpGet(`${this.apiPrefix}/${instanceId}/workflow`);
    return response as ApprovalWorkflow;
  }

  /**
   * 处理审批决策
   */
  async processApproval(instanceId: string, action: ApprovalAction): Promise<ApprovalWorkflow> {
    const response = await httpPost(`${this.apiPrefix}/${instanceId}/process`, {
      action: action.action,
      step_key: action.step_key,
      reason: action.reason || '',
      auto_advance: true
    });
    return response as ApprovalWorkflow;
  }

  /**
   * 重置工作流（管理员功能）
   */
  async resetWorkflow(instanceId: string, reason: string, resetToStep?: string): Promise<ApprovalWorkflow> {
    const response = await httpPost(`${this.apiPrefix}/${instanceId}/reset`, {
      reason,
      reset_to_step: resetToStep
    });
    return response as ApprovalWorkflow;
  }

  /**
   * 批量获取审批列表
   */
  async getApprovalList(params: {
    page?: number;
    page_size?: number;
    target_type?: string;
    status?: InstanceStatus;
  } = {}): Promise<{
    items: ApprovalWorkflow[];
    total: number;
    page: number;
    page_size: number;
    pages: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.page_size) searchParams.set('page_size', params.page_size.toString());
    if (params.target_type) searchParams.set('target_type', params.target_type);
    if (params.status) searchParams.set('status', params.status.toString());

    const response = await httpGet(`${this.apiPrefix}/list?${searchParams.toString()}`);
    return response;
  }

  /**
   * 获取当前用户的待审批列表
   */
  async getPendingApprovals(params: {
    page?: number;
    page_size?: number;
    target_type?: string;
  } = {}): Promise<{
    items: ApprovalWorkflow[];
    total: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.page_size) searchParams.set('page_size', params.page_size.toString());
    if (params.target_type) searchParams.set('target_type', params.target_type);

    const response = await httpGet(`${this.apiPrefix}/pending?${searchParams.toString()}`);
    return response;
  }
}

/**
 * 工具函数
 */
export class ApprovalUtils {
  /**
   * 获取状态显示文本
   */
  static getStatusText(status: InstanceStatus | StepStatus): string {
    const statusMap = {
      // 实例状态
      [InstanceStatus.NOT_STARTED]: '未开始',
      [InstanceStatus.IN_PROGRESS]: '进行中',
      [InstanceStatus.COMPLETED]: '已完成',
      [InstanceStatus.REJECTED]: '已拒绝',
      [InstanceStatus.CANCELLED]: '已取消',
      // 步骤状态
      [StepStatus.NOT_STARTED]: '未开始',
      [StepStatus.PENDING]: '待审批',
      [StepStatus.APPROVED]: '已通过',
      [StepStatus.REJECTED]: '已拒绝',
      [StepStatus.SKIPPED]: '已跳过',
    };
    return statusMap[status] || '未知';
  }

  /**
   * 获取步骤名称
   */
  static getStepName(stepKey: string): string {
    const stepNameMap: Record<string, string> = {
      exam: '考务审核',
      gm: '总经理审批',
      finance: '财务发放',
    };
    return stepNameMap[stepKey] || stepKey;
  }

  /**
   * 检查用户是否可以审批指定步骤
   */
  static canUserApproveStep(userRole: string, step: ApprovalStep): boolean {
    // 总经理和系统管理员有所有权限
    if (userRole === 'general_manager' || userRole === 'system_admin') {
      return true;
    }

    // 检查角色权限
    return step.approver_roles.includes(userRole);
  }

  /**
   * 获取当前待审批步骤
   */
  static getCurrentPendingStep(steps: ApprovalStep[]): ApprovalStep | null {
    return steps.find(step => step.status === StepStatus.PENDING) || null;
  }

  /**
   * 计算审批进度
   */
  static calculateProgress(steps: ApprovalStep[]): {
    completed: number;
    total: number;
    percentage: number;
  } {
    const completed = steps.filter(step => step.status === StepStatus.APPROVED).length;
    const total = steps.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }

  /**
   * 格式化时间
   */
  static formatTime(timeStr?: string): string {
    if (!timeStr) return '';
    return new Date(timeStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * 获取状态对应的颜色
   */
  static getStatusColor(status: InstanceStatus | StepStatus): string {
    const colorMap = {
      // 实例状态
      [InstanceStatus.NOT_STARTED]: 'gray',
      [InstanceStatus.IN_PROGRESS]: 'blue',
      [InstanceStatus.COMPLETED]: 'green',
      [InstanceStatus.REJECTED]: 'red',
      [InstanceStatus.CANCELLED]: 'gray',
      // 步骤状态
      [StepStatus.NOT_STARTED]: 'gray',
      [StepStatus.PENDING]: 'yellow',
      [StepStatus.APPROVED]: 'green',
      [StepStatus.REJECTED]: 'red',
      [StepStatus.SKIPPED]: 'gray',
    };
    return colorMap[status] || 'gray';
  }
}

// 创建全局实例
export const approvalStateMachine = new ApprovalStateMachineClient();

// 导出常用的工具函数
export const {
  getStatusText,
  getStepName,
  canUserApproveStep,
  getCurrentPendingStep,
  calculateProgress,
  formatTime,
  getStatusColor
} = ApprovalUtils;
