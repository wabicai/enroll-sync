import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  Users,
  GraduationCap,
  Calendar,
  Award,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { 
  mockDashboardStats,
  mockRevenueChart,
  mockUserGrowthChart,
  mockCategoryChart,
  mockExamStatusChart,
} from '@/mock';
import type { DashboardStats, ChartData } from '@/types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface StatCard {
  title: string;
  value: string;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export default function Dashboard() {
  const { user } = useAppStore();
  const [stats, setStats] = useState<DashboardStats>(mockDashboardStats);
  const [revenueData, setRevenueData] = useState<ChartData[]>(mockRevenueChart);
  const [userGrowthData, setUserGrowthData] = useState<ChartData[]>(mockUserGrowthChart);
  const [categoryData, setCategoryData] = useState<ChartData[]>(mockCategoryChart);
  const [examStatusData, setExamStatusData] = useState<ChartData[]>(mockExamStatusChart);

  // 根据用户角色显示不同的数据卡片
  const getStatCards = (): StatCard[] => {
    const baseCards: StatCard[] = [
      {
        title: '总用户数',
        value: stats.totalUsers.toString(),
        change: stats.userGrowth,
        icon: Users,
        color: 'text-blue-600',
      },
      {
        title: '学员总数',
        value: stats.totalStudents.toString(),
        change: stats.studentGrowth,
        icon: GraduationCap,
        color: 'text-green-600',
      },
      {
        title: '考试场次',
        value: stats.totalExams.toString(),
        change: 8.1,
        icon: Calendar,
        color: 'text-orange-600',
      },
      {
        title: '奖励总额',
        value: `¥${(stats.totalRewards / 1000).toFixed(1)}k`,
        change: 5.3,
        icon: Award,
        color: 'text-purple-600',
      },
    ];

    // 总经理和财务可以看到收入数据
    if (user?.role === 'general_manager' || user?.role === 'finance') {
      baseCards.unshift({
        title: '月度收入',
        value: `¥${(stats.monthlyRevenue / 10000).toFixed(1)}万`,
        change: stats.monthlyGrowth,
        icon: DollarSign,
        color: 'text-emerald-600',
      });
    }

    return baseCards;
  };

  const statCards = getStatCards();

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">数据看板</h1>
          <p className="text-muted-foreground">
            欢迎回来，{user?.name}。这是您的数据概览。
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {user?.role === 'general_manager' && '总经理视图'}
          {user?.role === 'finance' && '财务视图'}
          {user?.role === 'exam_admin' && '考务视图'}
          {user?.role === 'system_admin' && '管理员视图'}
        </Badge>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {card.change > 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                  )}
                  <span className={card.change > 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(card.change).toFixed(1)}%
                  </span>
                  <span className="ml-1">较上月</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 图表区域 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 收入趋势图 - 总经理和财务可见 */}
        {(user?.role === 'general_manager' || user?.role === 'finance') && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                收入趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [`¥${value.toLocaleString()}`, '收入']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 用户增长图 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              用户增长趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => [value, '用户数']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 学员分类统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-green-600" />
              学员分类统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [value, '学员数']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 考试状态统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              考试状态统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={examStatusData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => [value, '考试数']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 月度目标进度 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              月度目标进度
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>招生目标</span>
                <span>85/100</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>收入目标</span>
                <span>156/180 万</span>
              </div>
              <Progress value={87} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>考试完成率</span>
                <span>92/100</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>团队发展</span>
                <span>78/100</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}