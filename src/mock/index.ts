import type { 
  User, 
  Student, 
  Exam, 
  Reward, 
  Assessment, 
  DashboardStats,
  ChartData 
} from '@/types';

// Mock用户数据
export const mockUsers: User[] = [
  {
    id: '1',
    name: '张总经理',
    email: 'manager@example.com',
    phone: '13800138001',
    role: 'general_manager',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: '李财务',
    email: 'finance@example.com',
    phone: '13800138002',
    role: 'finance',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: '王考务',
    email: 'exam@example.com',
    phone: '13800138003',
    role: 'exam_admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    name: '陈招生',
    email: 'recruiter1@example.com',
    phone: '13800138004',
    role: 'system_admin',
    identity: 'full_time',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    teamId: 'team1',
  },
  {
    id: '5',
    name: '刘兼职',
    email: 'recruiter2@example.com',
    phone: '13800138005',
    role: 'system_admin',
    identity: 'part_time',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    teamId: 'team1',
    parentId: '4',
  },
];

// Mock学员数据
export const mockStudents: Student[] = [
  {
    id: 'student1',
    name: '赵学员',
    idCard: '110101199001011234',
    phone: '13900139001',
    category: 'safety_officer',
    status: 'approved',
    paymentStatus: 'paid',
    amount: 2000,
    paidAmount: 2000,
    recruiterId: '4',
    recruiterName: '陈招生',
    tags: ['新学员', '安全员'],
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    examId: 'exam1',
  },
  {
    id: 'student2',
    name: '钱学员',
    idCard: '110101199002021234',
    phone: '13900139002',
    category: 'electrician',
    status: 'pending',
    paymentStatus: 'partial',
    amount: 3000,
    paidAmount: 1500,
    recruiterId: '5',
    recruiterName: '刘兼职',
    tags: ['电工', '待审核'],
    createdAt: '2024-02-02T00:00:00Z',
    updatedAt: '2024-02-02T00:00:00Z',
  },
  {
    id: 'student3',
    name: '孙学员',
    idCard: '110101199003031234',
    phone: '13900139003',
    category: 'welder',
    status: 'approved',
    paymentStatus: 'unpaid',
    amount: 2500,
    paidAmount: 0,
    recruiterId: '4',
    recruiterName: '陈招生',
    tags: ['焊工', '欠费'],
    createdAt: '2024-02-03T00:00:00Z',
    updatedAt: '2024-02-03T00:00:00Z',
    examId: 'exam2',
  },
];

// Mock考试数据
export const mockExams: Exam[] = [
  {
    id: 'exam1',
    title: '安全员考试',
    category: 'safety_officer',
    date: '2024-03-15T09:00:00Z',
    location: '北京考试中心A座',
    totalSeats: 100,
    occupiedSeats: 85,
    status: 'upcoming',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'exam2',
    title: '焊工技能考试',
    category: 'welder',
    date: '2024-03-20T14:00:00Z',
    location: '北京考试中心B座',
    totalSeats: 50,
    occupiedSeats: 30,
    status: 'upcoming',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'exam3',
    title: '电工资格考试',
    category: 'electrician',
    date: '2024-02-28T10:00:00Z',
    location: '北京考试中心C座',
    totalSeats: 80,
    occupiedSeats: 80,
    status: 'completed',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-02-28T00:00:00Z',
  },
];

// Mock奖励数据
export const mockRewards: Reward[] = [
  {
    id: 'reward1',
    userId: '4',
    userName: '陈招生',
    type: 'recruitment',
    amount: 500,
    reason: '招生奖励 - 2月份新增学员',
    status: 'approved',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
    approvedBy: '2',
    approvedAt: '2024-03-01T10:00:00Z',
  },
  {
    id: 'reward2',
    userId: '5',
    userName: '刘兼职',
    type: 'development',
    amount: 300,
    reason: '发展奖励 - 团队发展',
    status: 'pending',
    createdAt: '2024-03-02T00:00:00Z',
    updatedAt: '2024-03-02T00:00:00Z',
  },
];

// Mock考核数据
export const mockAssessments: Assessment[] = [
  {
    id: 'assessment1',
    userId: '4',
    userName: '陈招生',
    identity: 'full_time',
    period: '2024-02',
    recruitmentCount: 15,
    developmentCount: 3,
    target: 12,
    status: 'pass',
    score: 125,
    createdAt: '2024-03-01T00:00:00Z',
  },
  {
    id: 'assessment2',
    userId: '5',
    userName: '刘兼职',
    identity: 'part_time',
    period: '2024-02',
    recruitmentCount: 6,
    developmentCount: 1,
    target: 8,
    status: 'warning',
    score: 75,
    createdAt: '2024-03-01T00:00:00Z',
  },
];

// Mock仪表板统计数据
export const mockDashboardStats: DashboardStats = {
  totalUsers: 156,
  totalStudents: 1234,
  totalExams: 45,
  totalRewards: 23400,
  monthlyRevenue: 156000,
  monthlyGrowth: 12.5,
  userGrowth: 8.3,
  studentGrowth: 15.7,
};

// Mock图表数据
export const mockRevenueChart: ChartData[] = [
  { name: '1月', value: 120000, date: '2024-01' },
  { name: '2月', value: 135000, date: '2024-02' },
  { name: '3月', value: 156000, date: '2024-03' },
  { name: '4月', value: 148000, date: '2024-04' },
  { name: '5月', value: 172000, date: '2024-05' },
  { name: '6月', value: 189000, date: '2024-06' },
];

export const mockUserGrowthChart: ChartData[] = [
  { name: '1月', value: 45, date: '2024-01' },
  { name: '2月', value: 52, date: '2024-02' },
  { name: '3月', value: 61, date: '2024-03' },
  { name: '4月', value: 68, date: '2024-04' },
  { name: '5月', value: 75, date: '2024-05' },
  { name: '6月', value: 82, date: '2024-06' },
];

export const mockCategoryChart: ChartData[] = [
  { name: '安全员', value: 45, category: 'safety_officer' },
  { name: '电工', value: 32, category: 'electrician' },
  { name: '焊工', value: 28, category: 'welder' },
  { name: '起重工', value: 15, category: 'crane_operator' },
  { name: '其他', value: 8, category: 'other' },
];

export const mockExamStatusChart: ChartData[] = [
  { name: '即将开始', value: 12, category: 'upcoming' },
  { name: '进行中', value: 3, category: 'ongoing' },
  { name: '已完成', value: 28, category: 'completed' },
  { name: '已取消', value: 2, category: 'cancelled' },
];