"""
审批流程状态机 - Python 实现示例
这是一个完整的后端状态机实现，可以作为开发参考
"""

from enum import IntEnum
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
import json

class InstanceStatus(IntEnum):
    """审批实例状态"""
    NOT_STARTED = 1
    IN_PROGRESS = 2
    COMPLETED = 3
    REJECTED = 4
    CANCELLED = 5

class StepStatus(IntEnum):
    """审批步骤状态"""
    NOT_STARTED = 1
    PENDING = 2
    APPROVED = 3
    REJECTED = 4
    SKIPPED = 5

@dataclass
class ApprovalStep:
    """审批步骤"""
    id: int
    instance_id: int
    step_key: str
    step_name: str
    step_order: int
    status: StepStatus
    approver_roles: List[str]
    approver_user_id: Optional[int] = None
    approver_name: Optional[str] = None
    is_required: bool = True
    can_skip: bool = False
    processed_at: Optional[datetime] = None
    reason: Optional[str] = None

@dataclass
class ApprovalInstance:
    """审批实例"""
    id: int
    target_type: str
    target_id: str
    status: InstanceStatus
    current_step_index: int
    workflow_config: Dict[str, Any]
    metadata: Dict[str, Any]
    created_by: int
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

class ApprovalStateMachine:
    """审批流程状态机"""
    
    # 工作流配置
    WORKFLOWS = {
        'user_registration': [
            {'step_key': 'exam', 'name': '考务审核', 'roles': ['exam_admin'], 'required': True},
        ],
        'student_enrollment': [
            {'step_key': 'exam', 'name': '考务审核', 'roles': ['exam_admin'], 'required': True},
            {'step_key': 'gm', 'name': '总经理审批', 'roles': ['general_manager'], 'required': True},
        ],
        'reward_application': [
            {'step_key': 'exam', 'name': '考务审核', 'roles': ['exam_admin'], 'required': True},
            {'step_key': 'gm', 'name': '总经理审批', 'roles': ['general_manager'], 'required': True},
            {'step_key': 'finance', 'name': '财务发放', 'roles': ['exam_admin'], 'required': True},
        ],
        'user_role_upgrade': [
            {'step_key': 'gm', 'name': '总经理审批', 'roles': ['general_manager'], 'required': True},
        ]
    }
    
    def __init__(self, db_session):
        self.db = db_session
    
    def create_workflow(self, target_type: str, target_id: str, created_by: int, metadata: Dict = None) -> ApprovalInstance:
        """创建新的审批工作流"""
        if target_type not in self.WORKFLOWS:
            raise ValueError(f"不支持的审批类型: {target_type}")
        
        # 创建审批实例
        instance = ApprovalInstance(
            id=self._generate_id(),
            target_type=target_type,
            target_id=target_id,
            status=InstanceStatus.NOT_STARTED,
            current_step_index=0,
            workflow_config=self.WORKFLOWS[target_type],
            metadata=metadata or {},
            created_by=created_by,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # 创建审批步骤
        steps = []
        for i, step_config in enumerate(self.WORKFLOWS[target_type]):
            step = ApprovalStep(
                id=self._generate_id(),
                instance_id=instance.id,
                step_key=step_config['step_key'],
                step_name=step_config['name'],
                step_order=i,
                status=StepStatus.PENDING if i == 0 else StepStatus.NOT_STARTED,
                approver_roles=step_config['roles'],
                is_required=step_config.get('required', True),
                can_skip=step_config.get('can_skip', False)
            )
            steps.append(step)
        
        # 启动工作流
        instance.status = InstanceStatus.IN_PROGRESS
        
        # 保存到数据库
        self._save_instance(instance)
        self._save_steps(steps)
        
        return instance
    
    def process_approval(self, instance_id: int, action: str, step_key: str, 
                        approver_id: int, approver_name: str, reason: str = None) -> Dict[str, Any]:
        """处理审批决策"""
        
        # 开始事务
        with self.db.begin():
            # 1. 加载实例和步骤
            instance = self._load_instance(instance_id)
            steps = self._load_steps(instance_id)
            
            # 2. 验证权限
            current_step = self._find_current_step(steps, step_key)
            self._validate_permission(approver_id, current_step)
            
            # 3. 处理当前步骤
            if action == 'approve':
                self._approve_step(current_step, approver_id, approver_name, reason)
                # 推进到下一步
                self._advance_workflow(instance, steps)
            elif action == 'reject':
                self._reject_step(current_step, approver_id, approver_name, reason)
                # 拒绝整个流程
                self._reject_workflow(instance)
            elif action == 'skip':
                if not current_step.can_skip:
                    raise ValueError("当前步骤不允许跳过")
                self._skip_step(current_step, approver_id, approver_name, reason)
                # 推进到下一步
                self._advance_workflow(instance, steps)
            else:
                raise ValueError(f"不支持的操作: {action}")
            
            # 4. 保存更改
            self._save_instance(instance)
            self._save_steps(steps)
            
            # 5. 发送通知
            self._send_notifications(instance, steps, action)
            
            # 6. 记录日志
            self._log_action(instance_id, action, approver_id, approver_name, reason)
            
            return self._get_workflow_state(instance, steps)
    
    def _find_current_step(self, steps: List[ApprovalStep], step_key: str) -> ApprovalStep:
        """查找当前步骤"""
        for step in steps:
            if step.step_key == step_key and step.status == StepStatus.PENDING:
                return step
        raise ValueError(f"未找到待审批的步骤: {step_key}")
    
    def _validate_permission(self, approver_id: int, step: ApprovalStep):
        """验证审批权限"""
        user_roles = self._get_user_roles(approver_id)
        if not any(role in step.approver_roles for role in user_roles):
            raise PermissionError("没有审批权限")
    
    def _approve_step(self, step: ApprovalStep, approver_id: int, approver_name: str, reason: str):
        """通过步骤"""
        step.status = StepStatus.APPROVED
        step.approver_user_id = approver_id
        step.approver_name = approver_name
        step.processed_at = datetime.now()
        step.reason = reason
    
    def _reject_step(self, step: ApprovalStep, approver_id: int, approver_name: str, reason: str):
        """拒绝步骤"""
        step.status = StepStatus.REJECTED
        step.approver_user_id = approver_id
        step.approver_name = approver_name
        step.processed_at = datetime.now()
        step.reason = reason
    
    def _skip_step(self, step: ApprovalStep, approver_id: int, approver_name: str, reason: str):
        """跳过步骤"""
        step.status = StepStatus.SKIPPED
        step.approver_user_id = approver_id
        step.approver_name = approver_name
        step.processed_at = datetime.now()
        step.reason = reason
    
    def _advance_workflow(self, instance: ApprovalInstance, steps: List[ApprovalStep]):
        """推进工作流"""
        # 查找下一个待处理步骤
        next_step = self._find_next_step(steps, instance.current_step_index)
        
        if next_step:
            # 激活下一步
            next_step.status = StepStatus.PENDING
            instance.current_step_index = next_step.step_order
            instance.updated_at = datetime.now()
        else:
            # 所有步骤完成
            self._complete_workflow(instance)
    
    def _find_next_step(self, steps: List[ApprovalStep], current_index: int) -> Optional[ApprovalStep]:
        """查找下一个步骤"""
        for step in steps:
            if (step.step_order > current_index and 
                step.status == StepStatus.NOT_STARTED and 
                step.is_required):
                return step
        return None
    
    def _complete_workflow(self, instance: ApprovalInstance):
        """完成工作流"""
        instance.status = InstanceStatus.COMPLETED
        instance.completed_at = datetime.now()
        instance.updated_at = datetime.now()
    
    def _reject_workflow(self, instance: ApprovalInstance):
        """拒绝工作流"""
        instance.status = InstanceStatus.REJECTED
        instance.updated_at = datetime.now()
    
    def _get_workflow_state(self, instance: ApprovalInstance, steps: List[ApprovalStep]) -> Dict[str, Any]:
        """获取工作流状态"""
        current_step = None
        next_step = None
        
        # 查找当前步骤
        for step in steps:
            if step.status == StepStatus.PENDING:
                current_step = step
                break
        
        # 查找下一步骤
        if current_step:
            next_step = self._find_next_step(steps, current_step.step_order)
        
        return {
            'instance': instance.__dict__,
            'steps': [step.__dict__ for step in steps],
            'current_step': current_step.__dict__ if current_step else None,
            'next_step': next_step.__dict__ if next_step else None,
            'is_completed': instance.status == InstanceStatus.COMPLETED
        }
    
    def _send_notifications(self, instance: ApprovalInstance, steps: List[ApprovalStep], action: str):
        """发送通知"""
        # 实现通知逻辑
        pass
    
    def _log_action(self, instance_id: int, action: str, approver_id: int, approver_name: str, reason: str):
        """记录操作日志"""
        # 实现日志记录
        pass
    
    def _get_user_roles(self, user_id: int) -> List[str]:
        """获取用户角色"""
        # 实现用户角色查询
        return ['general_manager']  # 示例
    
    def _generate_id(self) -> int:
        """生成ID"""
        import time
        return int(time.time() * 1000)
    
    def _load_instance(self, instance_id: int) -> ApprovalInstance:
        """加载审批实例"""
        # 实现数据库查询
        pass
    
    def _load_steps(self, instance_id: int) -> List[ApprovalStep]:
        """加载审批步骤"""
        # 实现数据库查询
        pass
    
    def _save_instance(self, instance: ApprovalInstance):
        """保存审批实例"""
        # 实现数据库保存
        pass
    
    def _save_steps(self, steps: List[ApprovalStep]):
        """保存审批步骤"""
        # 实现数据库保存
        pass


# FastAPI 路由示例
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

class ApprovalRequest(BaseModel):
    action: str  # approve, reject, skip
    step_key: str
    reason: Optional[str] = None

@router.post("/approvals/{instance_id}/process")
async def process_approval(
    instance_id: int,
    request: ApprovalRequest,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    try:
        state_machine = ApprovalStateMachine(db)
        result = state_machine.process_approval(
            instance_id=instance_id,
            action=request.action,
            step_key=request.step_key,
            approver_id=current_user.id,
            approver_name=current_user.name,
            reason=request.reason
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
"""
