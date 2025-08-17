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
  ArrowUpRight,
  ArrowDownRight,
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

// 现代化配色方案
const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6',
  orange: '#f97316',
  emerald: '#059669',
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.purple,
  COLORS.pink,
  COLORS.indigo,
  COLORS.teal,
  COLORS.orange,
];

// 现代化统计卡片组件
const ModernStatCard = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color = 'blue',
  subtitle,
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon: any;
  color?: string;
  subtitle?: string;
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-pink-600',
    indigo: 'from-indigo-500 to-indigo-600',
    orange: 'from-orange-500 to-orange-600',
    teal: 'from-teal-500 to-teal-600',
  };

  return (
    <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} opacity-5`} />
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} text-white shadow-lg`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                {subtitle && (
                  <p className="text-xs text-gray-400">{subtitle}</p>
                )}
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
            {change && (
              <div className="flex items-center">
                {changeType === 'increase' ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span
                  className={`text-sm font-semibold ${
                    changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {change}
                </span>
                <span className="text-xs text-gray-500 ml-1">较上月</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// 现代化图表卡片组件
const ChartCard = ({ 
  title, 
  children, 
  action,
  subtitle 
}: { 
  title: string; 
  children: React.ReactNode;
  action?: React.ReactNode;
  subtitle?: string;
}) => (
  <Card className="shadow-lg border-0 bg-white hover:shadow-xl transition-all duration-300">
    <CardHeader className="pb-4">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      {children}
    </CardContent>
  </Card>
);

// 加载状态组件
const LoadingCard = () => (
  <Card className="shadow-lg border-0 bg-white">
    <CardContent className="p-6">
      <div className="animate-pulse">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
    </CardContent>
  </Card>
);

// 错误状态组件
const ErrorCard = ({ onRetry }: { onRetry: () => void }) => (
  <Card className="shadow-lg border-0 bg-white">
    <CardContent className="p-6 text-center">
      <div className="text-gray-400 mb-4">
        <Activity className="h-12 w-12 mx-auto mb-2" />
        <p className="text-sm">数据加载失败</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-2" />
        重试
      </Button>
    </CardContent>
  </Card>
);

export default function ModernDashboard() {
  const { user } = useAppStore();
  
  // 数据状态
  const [data, setData] = useState<any>({
    summary: null,
    personnel: [],
    recruitment: null,
    industry: [],
    revenue: null,
    realtime: null,
  });

  // 加载状态
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

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
      setError(err instanceof Error ? err.message : '加载数据失败');
      console.error('Dashboard data loading error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 lg:p-6">
        <div className="w-full max-w-none mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">数据概览</h1>
            <p className="text-gray-600">加载中...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 lg:p-6">
        <div className="w-full max-w-none mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">数据概览</h1>
            <p className="text-red-600">{error}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <ErrorCard key={i} onRetry={loadData} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 lg:p-6">
      <div className="w-full max-w-none mx-auto">
        {/* 页面标题 */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">数据概览</h1>
              <p className="text-gray-600">
                欢迎回来，{user?.username || '用户'}！
                <span className="ml-2 text-sm text-gray-500">
                  最后更新：{lastUpdated.toLocaleString()}
                </span>
              </p>
            </div>
            <Button onClick={loadData} variant="outline" className="shadow-sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新数据
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <ModernStatCard
            title="今日新增学员"
            subtitle="实时统计"
            value={data.realtime?.today_students || 0}
            change={data.recruitment?.month_growth_rate ? `${data.recruitment.month_growth_rate > 0 ? '+' : ''}${data.recruitment.month_growth_rate.toFixed(1)}%` : undefined}
            changeType={data.recruitment?.month_growth_rate > 0 ? "increase" : "decrease"}
            icon={Users}
            color="blue"
          />
          <ModernStatCard
            title="本周学员总数"
            subtitle="活跃学员统计"
            value={data.realtime?.this_week_students || 0}
            change={data.recruitment?.current_month && data.recruitment?.last_month ?
              `${((data.recruitment.current_month - data.recruitment.last_month) / data.recruitment.last_month * 100).toFixed(1)}%` : undefined}
            changeType={data.recruitment?.current_month > data.recruitment?.last_month ? "increase" : "decrease"}
            icon={GraduationCap}
            color="green"
          />
          <ModernStatCard
            title="今日收入"
            subtitle="实时收入统计"
            value={`¥${(data.realtime?.today_revenue || 0).toLocaleString()}`}
            change={data.revenue?.collection_rate ? `${data.revenue.collection_rate.toFixed(1)}%` : undefined}
            changeType="increase"
            icon={DollarSign}
            color="orange"
          />
          <ModernStatCard
            title="在线招生员"
            subtitle="当前在线人数"
            value={data.realtime?.online_recruiters || 0}
            change={data.realtime?.pending_reviews ? `${data.realtime.pending_reviews}待审核` : undefined}
            changeType="increase"
            icon={UserCheck}
            color="purple"
          />
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {/* 招生趋势图 */}
          <ChartCard
            title="招生趋势"
            subtitle="最近7天的招生情况"
            action={
              <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-200">
                日度统计
              </Badge>
            }
          >
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.recruitment?.daily_stats || []}
                >
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
                    }}
                    formatter={(value) => [`${value}人`, '招生人数']}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={COLORS.primary}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* 课程分布统计 */}
          <ChartCard
            title="课程分布统计"
            subtitle="不同课程学员的分布情况"
            action={
              <Badge variant="secondary" className="bg-green-50 text-green-600 border-green-200">
                实时数据
              </Badge>
            }
          >
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={(data.industry || []).map((item: any, index: number) => {
                      // 处理课程名称显示，去掉ID前缀
                      const displayName = item.industry_tag ?
                        item.industry_tag.replace(/^课程ID:\d+,课程:/, '').replace(/^课程:/, '') :
                        item.name || `课程${index + 1}`;

                      return {
                        name: displayName,
                        value: item.student_count || item.value || 0,
                        color: CHART_COLORS[index % CHART_COLORS.length]
                      };
                    })}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(data.industry || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value, name) => [`${value}人`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {(data.industry || []).slice(0, 4).map((item: any, index: number) => {
                const total = (data.industry || []).reduce((sum: number, i: any) => sum + i.student_count, 0);
                const percentage = total > 0 ? ((item.student_count / total) * 100).toFixed(1) : '0';
                const colorClass = [
                  'bg-blue-500',
                  'bg-green-500',
                  'bg-yellow-500',
                  'bg-purple-500',
                  'bg-pink-500',
                  'bg-indigo-500',
                  'bg-teal-500',
                  'bg-orange-500'
                ][index % 8];

                // 处理课程名称显示，去掉ID前缀
                const displayName = item.industry_tag ?
                  item.industry_tag.replace(/^课程ID:\d+,课程:/, '').replace(/^课程:/, '') :
                  `课程${index + 1}`;

                return (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                    <span className="text-sm text-gray-600 truncate" title={displayName}>
                      {displayName}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 ml-auto">
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </div>

        {/* 第二行图表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 人员角色统计 */}
          <ChartCard
            title="人员角色统计"
            subtitle="各角色人员的分布情况"
            action={
              <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-orange-200">
                实时数据
              </Badge>
            }
          >
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.personnel || []}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="role_name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value, name) => {
                      if (name === 'total_count') return [`${value}人`, '总人数'];
                      if (name === 'active_count') return [`${value}人`, '活跃人数'];
                      return [value, name];
                    }}
                  />
                  <Bar
                    dataKey="total_count"
                    fill={COLORS.accent}
                    radius={[4, 4, 0, 0]}
                    name="total_count"
                  />
                  <Bar
                    dataKey="active_count"
                    fill={COLORS.secondary}
                    radius={[4, 4, 0, 0]}
                    name="active_count"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* 收入统计 */}
          <ChartCard
            title="收入统计"
            subtitle="收入完成情况和回款率"
            action={
              <Badge variant="secondary" className="bg-purple-50 text-purple-600 border-purple-200">
                财务数据
              </Badge>
            }
          >
            <div className="space-y-6 p-4">
              {/* 总收入 - 显示绝对值 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">总收入</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-blue-600">
                      ¥{(data.revenue?.total_revenue || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">累计总收入金额</div>
              </div>

              {/* 已收金额 - 显示已收/总收入对比 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">已收金额</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      ¥{(data.revenue?.received_amount || 0).toLocaleString()}/¥{(data.revenue?.total_revenue || 0).toLocaleString()}
                    </span>
                    <span className="text-sm font-semibold text-green-600">{(data.revenue?.collection_rate || 0).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-green-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, data.revenue?.collection_rate || 0)}%` }}
                  ></div>
                </div>
              </div>

              {/* 本月收入 - 显示绝对值 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">本月收入</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-orange-600">
                      ¥{(data.revenue?.this_month_total || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">当月累计收入</div>
              </div>

              {/* 本年收入 - 显示绝对值 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">本年收入</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-purple-600">
                      ¥{(data.revenue?.this_year_total || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">当年累计收入</div>
              </div>

              {/* 应收金额 - 新增显示 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">应收金额</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-red-600">
                      ¥{(data.revenue?.receivable_amount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">待收回款金额</div>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
