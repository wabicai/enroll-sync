import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Banknote,
  Receipt,
  PieChart,
  BarChart3,
  Calendar,
  Search,
  Filter,
  Download,
  Plus
} from 'lucide-react';

interface FinanceRecord {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
  relatedId?: string;
}

export default function Finance() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 模拟财务数据
  const mockFinanceData: FinanceRecord[] = [
    {
      id: '1',
      type: 'income',
      category: '学费收入',
      amount: 15000,
      description: '2024年1月学费收入',
      date: '2024-01-15',
      status: 'completed'
    },
    {
      id: '2',
      type: 'expense',
      category: '教师薪资',
      amount: 8000,
      description: '2024年1月教师工资',
      date: '2024-01-31',
      status: 'completed'
    },
    {
      id: '3',
      type: 'income',
      category: '奖励返佣',
      amount: 2500,
      description: '推荐学员奖励',
      date: '2024-01-20',
      status: 'pending'
    },
    {
      id: '4',
      type: 'expense',
      category: '场地租金',
      amount: 5000,
      description: '2024年1月场地费用',
      date: '2024-01-01',
      status: 'completed'
    },
    {
      id: '5',
      type: 'income',
      category: '考试费用',
      amount: 3200,
      description: '考试报名费收入',
      date: '2024-01-25',
      status: 'completed'
    }
  ];

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      setRecords(mockFinanceData);
    } catch (error) {
      console.error('加载财务数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 计算统计数据
  const totalIncome = records
    .filter(r => r.type === 'income' && r.status === 'completed')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = records
    .filter(r => r.type === 'expense' && r.status === 'completed')
    .reduce((sum, r) => sum + r.amount, 0);

  const netProfit = totalIncome - totalExpense;

  const pendingAmount = records
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);

  // 筛选记录
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || record.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">已完成</Badge>;
      case 'pending':
        return <Badge variant="secondary">待处理</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">已取消</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'income' ? 
      <Badge variant="default" className="bg-green-500">收入</Badge> : 
      <Badge variant="destructive">支出</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">财务管理</h1>
          <p className="text-muted-foreground">
            管理收入支出，监控财务状况
          </p>
        </div>
        <div className="flex gap-2">
          {/* TODO: 暂时注释掉导出功能，后续再添加
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出报表
          </Button>
          */}
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            添加记录
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收入</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">¥{totalIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% 较上月
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总支出</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">¥{totalExpense.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +8.2% 较上月
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">净利润</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ¥{netProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {netProfit >= 0 ? '+' : ''}15.3% 较上月
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理金额</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">¥{pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              需要处理的金额
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 */}
      <Tabs defaultValue="records" className="space-y-4">
        <TabsList>
          <TabsTrigger value="records">财务记录</TabsTrigger>
          <TabsTrigger value="reports">财务报表</TabsTrigger>
          <TabsTrigger value="analysis">数据分析</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          {/* 搜索和筛选 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                财务记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Label htmlFor="search">搜索</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="搜索描述或类别..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">类别筛选</Label>
                  <select
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="all">全部类别</option>
                    <option value="学费收入">学费收入</option>
                    <option value="考试费用">考试费用</option>
                    <option value="奖励返佣">奖励返佣</option>
                    <option value="教师薪资">教师薪资</option>
                    <option value="场地租金">场地租金</option>
                  </select>
                </div>
              </div>

              {/* 财务记录表格 */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>类型</TableHead>
                      <TableHead>类别</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>日期</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          加载中...
                        </TableCell>
                      </TableRow>
                    ) : filteredRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          暂无财务记录
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{getTypeBadge(record.type)}</TableCell>
                          <TableCell>{record.category}</TableCell>
                          <TableCell className={record.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                            {record.type === 'income' ? '+' : '-'}¥{record.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>{record.description}</TableCell>
                          <TableCell>{record.date}</TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">编辑</Button>
                              <Button variant="outline" size="sm">详情</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                财务报表
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                财务报表功能开发中...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                数据分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                数据分析功能开发中...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
