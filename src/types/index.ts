// 用户角色类型
export type UserRole = 'general_manager' | 'finance' | 'exam_admin' | 'system_admin';

// 招生人员身份类型
export type RecruitmentIdentity = 'part_time' | 'full_time' | 'team_leader' | 'regional_manager' | 'partner' | 'part_time_lead' | 'channel';

// 用户信息
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  idCard?: string;
  role: UserRole;
  identity?: RecruitmentIdentity;
  avatar?: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
  teamId?: string;
  parentId?: string; // 上级ID
  tags?: string[]; // 申请时填写的标签/渠道
}

// 学员工种类型
export type StudentCategory = 'safety_officer' | 'electrician' | 'welder' | 'crane_operator' | 'other';

// 学员信息
export interface Student {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  category: StudentCategory;
  status: 'pending' | 'approved' | 'rejected' | 'graduated';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  amount: number;
  paidAmount: number;
  recruiterId: string;
  recruiterName: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  examId?: string;
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

// 奖励信息
export interface Reward {
  id: string;
  userId: string;
  userName: string;
  type: RewardType;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
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