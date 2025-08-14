# 审批流程状态机设计文档

## 🎯 设计目标

1. **集中化状态管理**：所有审批流转逻辑在后端处理
2. **原子性操作**：确保状态变更的一致性
3. **可扩展性**：支持不同类型的审批流程
4. **可追溯性**：完整的审批历史记录

## 📊 状态机模型

### 审批实例状态 (ApprovalInstance.status)
```python
class InstanceStatus(IntEnum):
    NOT_STARTED = 1    # 未开始
    IN_PROGRESS = 2    # 进行中
    COMPLETED = 3      # 已完成
    REJECTED = 4       # 已拒绝
    CANCELLED = 5      # 已取消
```

### 步骤状态 (ApprovalStep.status)
```python
class StepStatus(IntEnum):
    NOT_STARTED = 1    # 未开始
    PENDING = 2        # 待审批
    APPROVED = 3       # 已通过
    REJECTED = 4       # 已拒绝
    SKIPPED = 5        # 已跳过
```

## 🔄 状态转换规则

### 实例级别转换
```
NOT_STARTED → IN_PROGRESS (第一个步骤开始)
IN_PROGRESS → COMPLETED (所有必需步骤通过)
IN_PROGRESS → REJECTED (任一步骤被拒绝)
任何状态 → CANCELLED (管理员取消)
```

### 步骤级别转换
```
NOT_STARTED → PENDING (轮到该步骤)
PENDING → APPROVED (审批通过)
PENDING → REJECTED (审批拒绝)
PENDING → SKIPPED (满足跳过条件)
```

## 🏗️ 数据库设计

### 审批实例表 (approval_instances)
```sql
CREATE TABLE approval_instances (
    id BIGINT PRIMARY KEY,
    target_type VARCHAR(50) NOT NULL,  -- 审批类型
    target_id VARCHAR(100) NOT NULL,   -- 目标对象ID
    status INTEGER NOT NULL DEFAULT 1, -- 实例状态
    current_step_index INTEGER DEFAULT 0, -- 当前步骤索引
    workflow_config JSON,              -- 工作流配置
    metadata JSON,                     -- 扩展数据
    created_by BIGINT,                 -- 创建人
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP NULL
);
```

### 审批步骤表 (approval_steps)
```sql
CREATE TABLE approval_steps (
    id BIGINT PRIMARY KEY,
    instance_id BIGINT NOT NULL,       -- 关联审批实例
    step_key VARCHAR(50) NOT NULL,     -- 步骤标识
    step_name VARCHAR(100) NOT NULL,   -- 步骤名称
    step_order INTEGER NOT NULL,       -- 步骤顺序
    status INTEGER NOT NULL DEFAULT 1, -- 步骤状态
    approver_roles JSON,               -- 可审批角色
    approver_user_id BIGINT NULL,      -- 实际审批人
    approver_name VARCHAR(100) NULL,   -- 审批人姓名
    is_required BOOLEAN DEFAULT TRUE,  -- 是否必需
    can_skip BOOLEAN DEFAULT FALSE,    -- 是否可跳过
    processed_at TIMESTAMP NULL,       -- 处理时间
    reason TEXT NULL,                  -- 审批意见
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (instance_id) REFERENCES approval_instances(id)
);
```

## 🔧 API 接口设计

### 1. 处理审批 (核心接口)
```
POST /api/v1/approvals/{instance_id}/process
{
    "action": "approve|reject|skip",
    "step_key": "exam|gm|finance",
    "reason": "审批意见",
    "auto_advance": true
}

Response:
{
    "success": true,
    "data": {
        "instance": { /* 更新后的实例信息 */ },
        "steps": [ /* 更新后的步骤列表 */ ],
        "current_step": { /* 当前待审步骤 */ },
        "next_step": { /* 下一个步骤 */ },
        "is_completed": false
    }
}
```

### 2. 获取工作流状态
```
GET /api/v1/approvals/{instance_id}/workflow

Response:
{
    "success": true,
    "data": {
        "instance": { /* 实例信息 */ },
        "steps": [ /* 步骤列表 */ ],
        "current_step": { /* 当前步骤 */ },
        "can_approve": true,  // 当前用户是否可审批
        "available_actions": ["approve", "reject"]
    }
}
```

### 3. 重置工作流 (管理员)
```
POST /api/v1/approvals/{instance_id}/reset
{
    "reason": "重置原因",
    "reset_to_step": "exam"  // 可选：重置到指定步骤
}
```

## 🎯 状态机核心逻辑

### Python 实现示例
```python
class ApprovalStateMachine:
    def __init__(self, instance_id: int):
        self.instance = self.load_instance(instance_id)
        self.steps = self.load_steps(instance_id)
    
    def process_approval(self, action: str, step_key: str, 
                        approver_id: int, reason: str = None):
        """处理审批决策"""
        with transaction():
            # 1. 验证权限
            self.validate_permission(approver_id, step_key)
            
            # 2. 更新当前步骤
            current_step = self.get_current_step()
            self.update_step_status(current_step, action, approver_id, reason)
            
            # 3. 自动推进流程
            if action == 'approve':
                self.advance_workflow()
            elif action == 'reject':
                self.reject_workflow(reason)
            
            # 4. 发送通知
            self.send_notifications()
            
            return self.get_workflow_state()
    
    def advance_workflow(self):
        """推进工作流到下一步"""
        next_step = self.find_next_step()
        if next_step:
            self.activate_step(next_step)
            self.update_instance_current_step(next_step.step_order)
        else:
            self.complete_workflow()
    
    def find_next_step(self):
        """查找下一个待处理步骤"""
        for step in self.steps:
            if step.status == StepStatus.NOT_STARTED and step.is_required:
                return step
        return None
```

## 📋 工作流配置

### 审批流程配置
```python
APPROVAL_WORKFLOWS = {
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
```

## 🔍 监控和日志

### 审批日志表
```sql
CREATE TABLE approval_logs (
    id BIGINT PRIMARY KEY,
    instance_id BIGINT NOT NULL,
    step_id BIGINT NULL,
    action VARCHAR(20) NOT NULL,  -- approve/reject/skip/reset
    operator_id BIGINT NOT NULL,
    operator_name VARCHAR(100),
    reason TEXT,
    before_status JSON,  -- 操作前状态
    after_status JSON,   -- 操作后状态
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 部署和测试

### 测试用例
1. **正常流程测试**：完整走完审批流程
2. **权限测试**：验证角色权限控制
3. **并发测试**：多人同时审批
4. **异常测试**：网络中断、数据库异常等
5. **性能测试**：大量审批数据的处理性能

### 监控指标
- 审批处理时间
- 审批通过率
- 系统响应时间
- 错误率统计
