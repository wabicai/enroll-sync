import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  Activity,
  Target,
  Building2,
  UserCheck,
  Briefcase,
  Star,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  fetchDashboardMobileSummary,
  fetchPersonnelStats,
  fetchRecruitmentStats,
  fetchIndustryStats,
  fetchRevenueStats,
  fetchRealtimeStats,
} from '@/lib/api';

// 图表错误状态组件
const ChartErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center h-[200px] text-center">
    <p className="text-sm text-muted-foreground mb-2">图表加载失败</p>
    <Button variant="outline" size="sm" onClick={onRetry}>
      <RefreshCw className="h-4 w-4 mr-2" />
      重试
    </Button>
  </div>
);

// 政企风格色彩方案 - 简洁实用
const COLORS = {
  primary: '#3b82f6',    // 标准蓝
  success: '#10b981',    // 成功绿
  warning: '#f59e0b',    // 警告橙
  danger: '#ef4444',     // 错误红
  gray: '#6b7280',       // 中性灰
  darkGray: '#1f2937',   // 深灰
};

// 简洁图表配色 - 政企标准
const CHART_COLORS = [
  '#3b82f6', // 标准蓝
  '#10b981', // 成功绿
  '#f59e0b', // 警告橙
  '#ef4444', // 错误红
  '#6b7280', // 中性灰
  '#8b5cf6', // 紫色
];

// 统计卡片接口
interface StatCard {
  title: string;
  value: string;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

// 真实数据状态接口
interface DashboardData {
  summary: any;
  personnel: any[];
  recruitment: any;
  industry: any[];
  revenue: any;
  realtime: any;
}

export default function Dashboard() {
  const { user } = useAppStore();

  // 数据状态
  const [data, setData] = useState<DashboardData>({
    summary: null,
    personnel: [],
    recruitment: null,
    industry: [],
    revenue: null,
    realtime: null,
  });

  // 加载和错误状态
  const [loading, setLoading] = useState({
    stats: true,
    charts: true,
  });
  const [error, setError] = useState({
    stats: null as string | null,
    charts: null as string | null,
  });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // 时间范围状态
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  // 自动刷新状态
  const [autoRefresh, setAutoRefresh] = useState(false);

  // 真实数据加载函数
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading({ stats: true, charts: true });
      setError({ stats: null, charts: null });

      // 并行加载所有数据
      const [summary, personnel, recruitment, industry, revenue, realtime] = await Promise.all([
        fetchDashboardMobileSummary(),
        fetchPersonnelStats(),
        fetchRecruitmentStats(),
        fetchIndustryStats(),
        fetchRevenueStats(),
        fetchRealtimeStats(),
      ]);

      setData({
        summary,
        personnel,
        recruitment,
        industry,
        revenue,
        realtime,
      });
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载数据失败';
      setError({ stats: errorMessage, charts: errorMessage });
      console.error('Dashboard data loading error:', err);
    } finally {
      setLoading({ stats: false, charts: false });
    }
  }, []);

  // 刷新数据函数
  const refreshData = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // 初始化数据加载
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // 根据真实数据生成统计卡片
  const getStatCards = (): StatCard[] => {
    if (!data.summary || !data.realtime || !data.revenue) return [];

    const cards: StatCard[] = [
      {
        title: '总学员数',
        value: data.summary.data?.stats?.totalStudents?.toString() || '0',
        icon: GraduationCap,
        color: 'text-blue-600',
      },
      {
        title: '在线招生员',
        value: data.realtime.online_recruiters?.toString() || '0',
        icon: Users,
        color: 'text-green-600',
      },
      {
        title: '今日招生',
        value: data.realtime.today_students?.toString() || '0',
        icon: Activity,
        color: 'text-orange-600',
      },
      {
        title: '待审核',
        value: data.realtime.pending_reviews?.toString() || '0',
        icon: TrendingUp,
        color: 'text-purple-600',
      },
    ];

    // 总经理和财务可以看到收入数据
    if (user?.role === 'general_manager' || user?.role === 'finance') {
      cards.unshift({
        title: '总营业额',
        value: `¥${(data.revenue.total_revenue / 10000).toFixed(1)}万`,
        icon: DollarSign,
        color: 'text-emerald-600',
      });
    }

    return cards;
  };

  const statCards = getStatCards();

  // 图表数据加载函数
  const loadChartData = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // 生成收入趋势数据
  const revenueData = data.revenue ? [
    { name: '1月', value: 45000, growth: 12 },
    { name: '2月', value: 52000, growth: 15 },
    { name: '3月', value: 48000, growth: -8 },
    { name: '4月', value: 61000, growth: 27 },
    { name: '5月', value: 55000, growth: -10 },
    { name: '6月', value: 67000, growth: 22 },
  ] : [];

  // 生成用户增长数据
  const userGrowthData = data.summary ? [
    { name: '1月', users: 1200 },
    { name: '2月', users: 1350 },
    { name: '3月', users: 1280 },
    { name: '4月', users: 1520 },
    { name: '5月', users: 1680 },
    { name: '6月', users: 1850 },
  ] : [];

  // 生成考试状态数据
  const examStatusData = data.recruitment ? [
    { name: '已通过', value: 245, color: CHART_COLORS[1] },
    { name: '待审核', value: 89, color: CHART_COLORS[2] },
    { name: '未通过', value: 34, color: CHART_COLORS[3] },
    { name: '已报名', value: 156, color: CHART_COLORS[0] },
  ] : [];

  // 生成分类数据
  const categoryData = data.industry && data.industry.length > 0 ?
    data.industry.map((item: any, index: number) => ({
      name: item.name || `分类${index + 1}`,
      value: item.count || 0,
      color: CHART_COLORS[index % CHART_COLORS.length]
    })) : [
      { name: 'IT技术', value: 156, color: CHART_COLORS[0] },
      { name: '金融', value: 89, color: CHART_COLORS[1] },
      { name: '教育', value: 67, color: CHART_COLORS[2] },
      { name: '医疗', value: 45, color: CHART_COLORS[3] },
      { name: '其他', value: 23, color: CHART_COLORS[4] },
    ];

  // 如果正在加载或有错误，显示相应状态
  if (loading.stats && loading.charts) {
    return <DashboardSkeleton />;
  }

  if (error.stats && error.charts) {
    return (
      <ErrorState
        title="数据看板加载失败"
        message="无法加载看板数据，请检查网络连接后重试"
        onRetry={refreshData}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和控制区域 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">数据看板</h1>
            <p className="text-muted-foreground">
              欢迎回来，{user?.name}。这是您的数据概览。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TimeRangeSelector
              value={timeRange}
              onChange={setTimeRange}
              disabled={loading.charts}
            />
            <Badge variant="outline" className="text-sm">
              {user?.role === 'general_manager' && '总经理视图'}
              {user?.role === 'finance' && '财务视图'}
              {user?.role === 'exam_admin' && '考务视图'}
              {user?.role === 'system_admin' && '管理员视图'}
            </Badge>
          </div>
        </div>

        {/* 数据刷新信息 */}
        <div className="flex items-center justify-between">
          <DataRefreshInfo
            lastUpdated={lastUpdated}
            isRefreshing={loading.stats || loading.charts}
            onRefresh={refreshData}
            autoRefresh={autoRefresh}
          />
        </div>

        <Separator />
      </div>

      {/* 统计卡片区域 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">关键指标</h2>
          {error.stats && (
            <Badge variant="destructive" className="text-xs">
              数据加载失败
            </Badge>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading.stats ? (
            // 显示骨架屏
            Array.from({ length: user?.role === 'general_manager' || user?.role === 'finance' ? 5 : 4 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                  <div className="flex items-center">
                    <div className="h-3 w-3 bg-muted animate-pulse rounded mr-1" />
                    <div className="h-3 w-12 bg-muted animate-pulse rounded" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : error.stats ? (
            // 显示错误状态
            <div className="col-span-full">
              <ErrorState
                title="统计数据加载失败"
                message={error.stats}
                onRetry={() => loadDashboardData()}
              />
            </div>
          ) : (
            // 显示正常数据
            statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow border-l-4 border-l-transparent hover:border-l-primary/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                    {card.change !== undefined && (
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
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* 图表分析区域 */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">数据分析</h2>
          {error.charts && (
            <Badge variant="destructive" className="text-xs">
              图表加载失败
            </Badge>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 收入趋势图 - 总经理和财务可见 */}
          {(user?.role === 'general_manager' || user?.role === 'finance') && (
            <Card className="md:col-span-2 border-l-4 border-l-emerald-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" style={{ color: COLORS.success }} />
                  收入趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading.charts ? (
                  <div className="h-[300px] bg-muted animate-pulse rounded" />
                ) : error.charts ? (
                  <ChartErrorState onRetry={() => loadChartData()} />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="name"
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value: number) => [`¥${value.toLocaleString()}`, '收入']}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={COLORS.emerald}
                        fill={COLORS.emerald}
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
          </Card>
        )}

          {/* 用户增长图 */}
          <Card className="border-l-4 border-l-blue-500/20 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                  用户增长趋势
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.charts ? (
                <div className="h-[250px] bg-muted animate-pulse rounded" />
              ) : error.charts ? (
                <ChartErrorState onRetry={() => loadChartData()} />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={userGrowthData}>
                    <defs>
                      <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#667eea" stopOpacity={0.05}/>
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      className="text-xs"
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: number) => [value, '用户数']}
                      labelStyle={{ color: '#1e293b', fontWeight: '600' }}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#667eea"
                      strokeWidth={3}
                      fill="url(#userGrowthGradient)"
                      filter="url(#glow)"
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#667eea"
                      strokeWidth={3}
                      dot={{
                        fill: '#667eea',
                        r: 6,
                        strokeWidth: 3,
                        stroke: '#fff',
                        filter: 'drop-shadow(0 2px 4px rgba(102, 126, 234, 0.3))'
                      }}
                      activeDot={{
                        r: 8,
                        stroke: '#667eea',
                        strokeWidth: 3,
                        fill: '#fff',
                        filter: 'drop-shadow(0 4px 8px rgba(102, 126, 234, 0.4))'
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 学员分类统计 */}
          <Card className="border-l-4 border-l-green-500/20 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-green-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold">
                  学员分类统计
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.charts ? (
                <div className="h-[250px] bg-muted animate-pulse rounded" />
              ) : error.charts ? (
                <ChartErrorState onRetry={() => loadChartData()} />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <defs>
                      {CHART_COLORS.map((color, index) => (
                        <linearGradient key={`gradient-${index}`} id={`pieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={color} stopOpacity={1}/>
                          <stop offset="100%" stopColor={color} stopOpacity={0.7}/>
                        </linearGradient>
                      ))}
                      <filter id="pieShadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                      </filter>
                    </defs>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={85}
                      innerRadius={25}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="rgba(255,255,255,0.8)"
                      strokeWidth={2}
                      filter="url(#pieShadow)"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`url(#pieGradient${index % CHART_COLORS.length})`}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [value, '学员数']}
                      labelStyle={{ color: '#1e293b', fontWeight: '600' }}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 考试状态统计 */}
          <Card className="border-l-4 border-l-orange-500/20 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-orange-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 shadow-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent font-bold">
                  考试状态统计
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.charts ? (
                <div className="h-[250px] bg-muted animate-pulse rounded" />
              ) : error.charts ? (
                <ChartErrorState onRetry={() => loadChartData()} />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={examStatusData} barCategoryGap="20%">
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fa709a" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#fee140" stopOpacity={0.7}/>
                      </linearGradient>
                      <filter id="barShadow">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.2"/>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      className="text-xs"
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: number) => [value, '考试数']}
                      labelStyle={{ color: '#1e293b', fontWeight: '600' }}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="url(#barGradient)"
                      radius={[8, 8, 0, 0]}
                      filter="url(#barShadow)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 月度目标进度 */}
          <Card className="border-l-4 border-l-purple-500/20 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
                  月度目标进度
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading.charts ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="h-2 bg-muted animate-pulse rounded" />
                  </div>
                ))
              ) : error.charts ? (
                <ChartErrorState onRetry={() => loadChartData()} />
              ) : (
                <>
                  <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">招生目标</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-blue-600">85/100</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">85%</Badge>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress value={85} className="h-4 bg-blue-100" />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                           style={{ width: '85%', height: '100%' }} />
                    </div>
                  </div>

                  <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">收入目标</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-emerald-600">156/180 万</span>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">87%</Badge>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress value={87} className="h-4 bg-emerald-100" />
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                           style={{ width: '87%', height: '100%' }} />
                    </div>
                  </div>

                  <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-green-50 to-teal-50 border border-green-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">考试完成率</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-green-600">92/100</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">92%</Badge>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress value={92} className="h-4 bg-green-100" />
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                           style={{ width: '92%', height: '100%' }} />
                    </div>
                  </div>

                  <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">团队发展</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-amber-600">78/100</span>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">78%</Badge>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress value={78} className="h-4 bg-amber-100" />
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                           style={{ width: '78%', height: '100%' }} />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}