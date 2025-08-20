// 用户角色类型
export type UserRole = 'general_manager' | 'finance' | 'exam_admin' | 'system_admin';

// 招生人员身份类型
export type RecruitmentIdentity = 'part_time' | 'full_time' | 'team_leader' | 'regional_manager' | 'partner' | 'part_time_lead' | 'channel';

// 用户信息
export interface User {
  id: string;
  name: string;
  real_name?: string; // 真实姓名
  email: string;
  phone: string;
  idCard?: string;
  role: UserRole;
  identity?: RecruitmentIdentity;
  role_type?: number; // 主要角色类型数字
  roles?: string[]; // 角色名称列表
  primary_role?: string; // 主要角色名称
  avatar?: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
  teamId?: string;
  parentId?: string; // 上级ID
  tags?: string[]; // 申请时填写的标签/渠道
  invitation_code?: string; // 邀请码
}

// 学员工种类型
export type StudentCategory = 'safety_officer' | 'electrician' | 'welder' | 'crane_operator' | 'other';

// 学员信息 - 与后端ExamStudent模型保持一致
export interface Student {
  id: string;
  student_number: string;
  name: string;
  phone: string;
  gender: number; // 性别：1男 2女
  education: string;
  major?: string;
  work_unit?: string;
  job_position?: string;
  work_years?: number;
  employment_intention?: string;
  notes?: string;
  status: number; // 学员状态：1正常 2已退学 3已毕业
  created_by: number;
  last_modified_by?: number;
  createdAt: string;
  updatedAt: string;
}

// 考试信息
export interface Exam {
  id: string;
  title: string;
  category: StudentCategory;
  date: string;
  location: string;
  totalSeats: number;
  occupiedSeats: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// 奖励类型
export type RewardType = 'recruitment' | 'development' | 'performance' | 'special';

// 奖励状态枚举 - 优化后的5状态体系
export type RewardStatus = 1 | 2 | 3 | 4 | 5;

// 奖励信息
export interface Reward {
  id: string;
  userId: string;
  userName: string;
  type: RewardType;
  amount: number;
  reason: string;
  status: RewardStatus | 'pending' | 'approved' | 'rejected' | 'paid'; // 支持新旧状态格式
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

// 考核信息
export interface Assessment {
  id: string;
  userId: string;
  userName: string;
  identity: RecruitmentIdentity;
  period: string; // 考核期间，如 "2024-01"
  recruitmentCount: number;
  developmentCount: number;
  target: number;
  status: 'pass' | 'fail' | 'warning';
  score: number;
  createdAt: string;
}

// 仪表板统计数据
export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalExams: number;
  totalRewards: number;
  monthlyRevenue: number;
  monthlyGrowth: number;
  userGrowth: number;
  studentGrowth: number;
}

// 图表数据类型
export interface ChartData {
  name: string;
  value: number;
  category?: string;
  date?: string;
}

// 课程信息（Courses）- 更新以匹配后端数据结构
export interface Course {
  id: number;                     // 后端返回数字ID
  course_name: string;
  course_code?: string | null;    // 可能为null
  course_type?: string | null;    // theoretical/practical/comprehensive
  course_level?: string;
  description?: string | null;
  national_standard?: string | null;
  course_content?: string | null;
  requirements?: string | null;
  employment_direction?: string | null;
  exam_content?: string | null;
  standard_fee?: number | null;
  subsidy_standard?: number | null;
  theory_ratio?: number;
  practice_ratio?: number;
  status: 1 | 2;                  // 1=正常，2=已停用
  created_at?: string;            // 后端字段名
  updated_at?: string;            // 后端字段名
  createdAt: string;              // 前端转换后的字段名
  updatedAt: string;              // 前端转换后的字段名
  // 后端额外返回的统计字段
  total_schedules?: number;
  upcoming_schedules?: number | null;
  total_seats?: number;
  remaining_seats?: number;
}

// 考试安排（Schedules）- 更新以匹配后端数据结构
export interface Schedule {
  id: string;
  course_id: string;
  course_name?: string;           // 可能通过关联查询返回
  course_batch?: string;          // 后端有此字段
  exam_date: string;              // YYYY-MM-DD
  exam_time?: string;             // HH:mm:ss (兼容旧字段)
  exam_start_time?: string;       // HH:mm:ss (后端使用此字段)
  exam_end_time?: string;         // HH:mm:ss (后端使用此字段)
  exam_location: string;
  exam_mode?: string;             // online/offline/hybrid
  total_seats: number;
  occupied_seats: number;
  status: 1 | 2 | 3 | 4 | 5 | 6 | 7; // 扩展状态值以匹配后端
  registration_deadline?: string; // YYYY-MM-DD
  exam_requirements?: string;     // 后端有此字段
  notes?: string;
  notify_on_change?: boolean;
  createdAt: string;
  updatedAt: string;
}

// 考试报名学员信息
export interface ExamEnrollment {
  // 学员基本信息
  student_id: number;
  student_number: string;
  student_name: string;
  phone: string;
  gender: number; // 1男 2女
  education: string;
  
  // 报考记录信息
  enrollment_id: number;
  enrollment_number: string;
  course_name: string;
  course_level: string;
  course_batch: string;
  registration_date: string;
  
  // 审核和状态信息
  enrollment_status: number; // 1正常 2退学 3完成
  qualification_status: number; // 1待审核 2已通过 3不符合
  materials_complete: boolean;
  
  // 考试相关信息
  preliminary_result?: number; // 1未考 2通过 3未通过
  makeup_exam_time?: string;
  makeup_exam_result?: number;
  certificate_status: number; // 1未发放 2已发放 3申请中
  certificate_number?: string;
  
  // 其他信息
  recruiter_id?: number;
  recruiter_name?: string;
  channel?: string;
  is_veteran_conversion: boolean;
  follow_up: boolean;
  
  // 时间信息
  created_at: string;
  updated_at: string;
}

// 考试报名学员列表响应
export interface ExamEnrollmentListResponse {
  items: ExamEnrollment[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  statistics?: {
    total_enrollments: number;
    status_distribution: {
      normal: number;
      dropout: number;
      completed: number;
    };
    qualification_distribution: {
      pending: number;
      approved: number;
      rejected: number;
    };
    exam_result_distribution: {
      not_taken: number;
      passed: number;
      failed: number;
    };
    certificate_distribution: {
      not_issued: number;
      issued: number;
      applying: number;
    };
    other_stats: {
      materials_complete: number;
      veteran_conversion: number;
      follow_up_needed: number;
    };
  };
}

// 升级申请（Approvals - Upgrades）
export interface UpgradeApplication {
  id: string;
  userId: string;
  userName: string;
  fromIdentity: 'full_time' | 'part_time' | 'freelance' | 'channel' | 'part_time_lead';
  toIdentity: 'part_time' | 'channel' | 'part_time_lead';
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: string;
  updatedAt?: string;
}

// API响应类型
export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
  success: boolean;
}

// 分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
  total?: number;
}

// 列表响应
export interface ListResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 主题类型
export type Theme = 'light' | 'dark' | 'system';

// 应用状态
export interface AppState {
  user: User | null;
  theme: Theme;
  sidebarCollapsed: boolean;
}

// 通知
export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'reminder' | 'approval' | 'finance';
  status: 'unread' | 'read' | 'sent' | 'failed';
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  scene: 'payment_reminder' | 'exam_update' | 'assessment_warning' | 'reward_result';
  channel: 'websocket' | 'email' | 'sms';
  content: string;
  enabled: boolean;
  updatedAt: string;
}

// 系统设置：规则与计划
export interface RuleConfig {
  autoApproveRegistration: boolean; // 是否允许总经理直批
  studentAutoApproveThreshold?: number; // 学员信息完整度阈值
  rewardAutoApproveAmountLimit?: number; // 自动通过奖励上限金额
}

export interface UpgradeConditions {
  partTimeToLead: {
    minMonthlyRecruitment: number;
    continuousMonths: number;
    interviewRequired: boolean;
  };
}

export interface ReminderPlan {
  id: string;
  name: string;
  scene: 'payment' | 'exam' | 'assessment';
  schedule: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:mm
  enabled: boolean;
}

// 导出中心
export interface ExportRecord {
  id: string;
  type: 'rewards' | 'payroll' | 'students';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  finishedAt?: string;
  fileUrl?: string;
}

// 财务
// 财务类型已移除