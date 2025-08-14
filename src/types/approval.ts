// 审批状态机类型定义

export enum ApprovalInstanceStatus {
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

export enum ApprovalType {
  USER_REGISTRATION = 'user_registration',
  STUDENT_ENROLLMENT = 'student_enrollment',
  REWARD_APPLICATION = 'reward_application',
  USER_ROLE_UPGRADE = 'user_role_upgrade'
}

export enum StepType {
  EXAM = 'exam',
  GM = 'gm',
  FINANCE = 'finance'
}

export interface ApprovalStep {
  id: string;
  stepKey: StepType;
  stepName: string;
  status: StepStatus;
  approverRole: string[];
  approverName?: string;
  approverUserId?: string;
  processedAt?: string;
  reason?: string;
  order: number;
  isRequired: boolean;
  canSkip: boolean;
}

export interface ApprovalInstance {
  id: string;
  targetType: ApprovalType;
  targetId: string;
  status: ApprovalInstanceStatus;
  currentStepIndex: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  createdBy: string;
  metadata: Record<string, any>;
}

export interface ApprovalWorkflow {
  instance: ApprovalInstance;
  steps: ApprovalStep[];
  details: Record<string, any>;
}

// 状态机事件
export interface ApprovalEvent {
  type: 'APPROVE' | 'REJECT' | 'SKIP' | 'RESET' | 'CANCEL';
  stepKey: StepType;
  approverUserId: string;
  reason?: string;
  metadata?: Record<string, any>;
}

// 状态机转换结果
export interface StateTransitionResult {
  success: boolean;
  workflow: ApprovalWorkflow;
  nextStep?: ApprovalStep;
  isCompleted: boolean;
  error?: string;
}

// 审批规则配置
export interface ApprovalRule {
  targetType: ApprovalType;
  steps: {
    stepKey: StepType;
    stepName: string;
    approverRoles: string[];
    isRequired: boolean;
    canSkip: boolean;
    order: number;
    conditions?: Record<string, any>;
  }[];
  autoApprovalRules?: {
    conditions: Record<string, any>;
    skipSteps: StepType[];
  }[];
}
