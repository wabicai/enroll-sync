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
  role: UserRole;
  identity?: RecruitmentIdentity;
  avatar?: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
  teamId?: string;
  parentId?: string; // 上级ID
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

// 课程信息（Courses）
export interface Course {
  id: string;
  course_name: string;
  course_code: string;
  course_level?: string;
  description?: string;
  requirements?: string;
  exam_requirements?: string;
  national_standard_ref?: string;
  standard_fee?: number;
  theory_ratio?: number;
  practice_ratio?: number;
  status: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
}

// 考试安排（Schedules）
export interface Schedule {
  id: string;
  course_id: string;
  course_name: string;
  exam_date: string;      // YYYY-MM-DD
  exam_time?: string;     // HH:mm:ss
  exam_location: string;
  total_seats: number;
  occupied_seats: number;
  status: 1 | 2 | 3 | 4 | 5; // 草稿/已发布/已取消/已延期/已停用
  registration_deadline?: string; // YYYY-MM-DD
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
export interface PayrollRecord {
  id: string;
  userId: string;
  userName: string;
  month: string; // YYYY-MM
  base: number;
  reward: number;
  deduction: number;
  total: number;
  status: 'unpaid' | 'paid';
}

export interface FinanceReportSummary {
  month: string;
  totalPayroll: number;
  totalReward: number;
  receivable: number;
  received: number;
}