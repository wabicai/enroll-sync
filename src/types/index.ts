// 用户角色类型
export type UserRole = 'general_manager' | 'finance' | 'exam_admin' | 'system_admin';

// 招生人员身份类型
export type RecruitmentIdentity = 'part_time' | 'full_time' | 'team_leader' | 'regional_manager' | 'partner';

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