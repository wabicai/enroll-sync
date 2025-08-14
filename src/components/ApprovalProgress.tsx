import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface ApprovalStep {
  id: string;
  step_key: string;
  step_name?: string;
  status: number;
  approver_name?: string;
  processed_at?: string;
  reason?: string;
}

interface ApprovalProgressProps {
  steps: ApprovalStep[];
  currentStepIndex: number;
  className?: string;
}

const stepNameMap: Record<string, string> = {
  exam: "考务审核",
  gm: "总经理审批", 
  finance: "财务发放",
};

const stepStatusMap: Record<number, { 
  label: string; 
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = {
  1: { label: "未开始", variant: "outline", icon: Clock, color: "text-gray-400" },
  2: { label: "待审批", variant: "secondary", icon: AlertCircle, color: "text-yellow-500" },
  3: { label: "已通过", variant: "default", icon: CheckCircle, color: "text-green-500" },
  4: { label: "已拒绝", variant: "destructive", icon: XCircle, color: "text-red-500" },
  5: { label: "已跳过", variant: "outline", icon: Clock, color: "text-gray-400" },
};

export const ApprovalProgress: React.FC<ApprovalProgressProps> = ({
  steps,
  currentStepIndex,
  className = ""
}) => {
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "";
    return new Date(timeStr).toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric", 
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h4 className="text-sm font-medium text-muted-foreground">审批进度</h4>
      
      {/* 进度条 */}
      <div className="flex items-center space-x-2">
        {steps.map((step, index) => {
          const stepInfo = stepStatusMap[step.status] || stepStatusMap[1];
          const Icon = stepInfo.icon;
          const isActive = index === currentStepIndex;
          const isCompleted = step.status === 3; // 已通过
          const isFailed = step.status === 4; // 已拒绝
          
          return (
            <React.Fragment key={step.id}>
              {/* 步骤圆圈 */}
              <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                isCompleted ? 'bg-green-500 border-green-500' :
                isFailed ? 'bg-red-500 border-red-500' :
                isActive ? 'bg-blue-500 border-blue-500' :
                'bg-gray-200 border-gray-300'
              }`}>
                <Icon className={`w-4 h-4 ${
                  isCompleted || isFailed || isActive ? 'text-white' : 'text-gray-500'
                }`} />
              </div>
              
              {/* 连接线 */}
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* 步骤详情 */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const stepInfo = stepStatusMap[step.status] || stepStatusMap[1];
          const stepName = step.step_name || stepNameMap[step.step_key] || step.step_key;
          const isActive = index === currentStepIndex;
          
          return (
            <div
              key={step.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                isActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Badge variant={stepInfo.variant}>
                  {stepName}
                </Badge>
                <Badge variant={stepInfo.variant}>
                  {stepInfo.label}
                </Badge>
                {step.approver_name && (
                  <span className="text-sm text-muted-foreground">
                    审批人: {step.approver_name}
                  </span>
                )}
              </div>
              
              <div className="text-right">
                {step.processed_at && (
                  <div className="text-xs text-muted-foreground">
                    {formatTime(step.processed_at)}
                  </div>
                )}
                {step.reason && (
                  <div className="text-xs text-muted-foreground max-w-32 truncate">
                    {step.reason}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 简化版本的进度条，用于列表页面
export const ApprovalProgressSimple: React.FC<{
  steps: ApprovalStep[];
  currentStepIndex: number;
}> = ({ steps, currentStepIndex }) => {
  const completedSteps = steps.filter(step => step.status === 3).length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  
  return (
    <div className="flex items-center space-x-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">
        {completedSteps}/{totalSteps}
      </span>
    </div>
  );
};
