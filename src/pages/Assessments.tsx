import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { fetchAssessmentConfigs, createAssessmentConfig, updateAssessmentConfig, deleteAssessmentConfig, fetchUsers, fetchTeamPerformance } from '@/lib/api';
import type { User, TeamPerformanceResponse, TeamPerformanceMemberDetail } from '@/types';
import { useMessage } from '@/hooks/useMessage';

export default function Assessments() {
  const [users, setUsers] = useState<User[]>([]);
  const [assessmentConfigs, setAssessmentConfigs] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<TeamPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    users: false,
    configs: false,
    performance: false
  });
  const [dataErrors, setDataErrors] = useState({
    users: null as string | null,
    configs: null as string | null,
    performance: null as string | null
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    is_personal_assessment_enabled: false,
    is_team_assessment_enabled: false,
    personal_target_students: 0,
    personal_target_revenue: 0,
    team_target_students: 0,
    team_target_revenue: 0,
  });
  const { success, error, info } = useMessage();

  useEffect(() => {
    loadData();
  }, []);

  // 重试单个数据源
  const retryDataSource = async (source: 'users' | 'configs' | 'performance') => {
    setLoadingStates(prev => ({ ...prev, [source]: true }));
    setDataErrors(prev => ({ ...prev, [source]: null }));

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);

      switch (source) {
        case 'users':
          const usersResult = await fetchUsers();
          const recruitmentRoles = [1, 2, 3, 4, 5];
          const filteredUsers = usersResult.filter(user =>
            user.role_type && recruitmentRoles.includes(user.role_type)
          );
          const sortedUsers = filteredUsers.sort((a, b) => {
            const aIsRecruitment = a.role_type && recruitmentRoles.includes(a.role_type);
            const bIsRecruitment = b.role_type && recruitmentRoles.includes(b.role_type);
            if (aIsRecruitment && !bIsRecruitment) return -1;
            if (!aIsRecruitment && bIsRecruitment) return 1;
            return 0;
          });
          setUsers(sortedUsers);
          success('用户数据重新加载成功', `成功加载 ${sortedUsers.length} 个招生员数据`);
          break;

        case 'configs':
          const configsResult = await fetchAssessmentConfigs();
          setAssessmentConfigs(configsResult.items || []);
          success('考核配置重新加载成功', `成功加载 ${configsResult.items?.length || 0} 个配置`);
          break;

        case 'performance':
          const performanceResult = await fetchTeamPerformance(currentMonth);
          setPerformanceData(performanceResult);
          success('业绩数据重新加载成功', '业绩数据已更新');
          break;
      }
    } catch (err) {
      console.error(`重新加载${source}数据失败:`, err);
      setDataErrors(prev => ({ ...prev, [source]: `加载失败: ${err instanceof Error ? err.message : '未知错误'}` }));
      error('重新加载失败', `${source}数据加载失败，请稍后重试`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [source]: false }));
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);

      // 使用 Promise.allSettled 来处理部分失败的情况
      const [usersResult, configsResult, performanceResult] = await Promise.allSettled([
        fetchUsers(),
        fetchAssessmentConfigs(),
        fetchTeamPerformance(currentMonth)
      ]);

      // 处理用户数据
      let users: User[] = [];
      if (usersResult.status === 'fulfilled') {
        // 过滤用户：只显示招生员相关角色（排除总经理、考务、财务等管理角色）
        const recruitmentRoles = [1, 2, 3, 4, 5]; // 全职、兼职、自由、渠道、团队负责人
        const filteredUsers = usersResult.value.filter(user =>
          user.role_type && recruitmentRoles.includes(user.role_type)
        );

        // 优先显示招生员角色
        users = filteredUsers.sort((a, b) => {
          const aIsRecruitment = a.role_type && recruitmentRoles.includes(a.role_type);
          const bIsRecruitment = b.role_type && recruitmentRoles.includes(b.role_type);

          if (aIsRecruitment && !bIsRecruitment) return -1;
          if (!aIsRecruitment && bIsRecruitment) return 1;
          return 0;
        });
      } else {
        console.error('获取用户数据失败:', usersResult.reason);
        error('数据加载失败', '无法获取用户数据，请检查网络连接或稍后重试');
      }

      // 处理考核配置数据
      let configs: any[] = [];
      if (configsResult.status === 'fulfilled') {
        configs = configsResult.value.items || [];
      } else {
        console.error('获取考核配置失败:', configsResult.reason);
        info('部分数据加载失败', '考核配置数据加载失败，但不影响基本功能使用');
      }

      // 处理业绩数据
      let performance: any = null;
      if (performanceResult.status === 'fulfilled') {
        performance = performanceResult.value;
      } else {
        console.error('获取业绩数据失败:', performanceResult.reason);
        info('部分数据加载失败', '业绩数据加载失败，请稍后刷新重试');
      }

      setUsers(users);
      setAssessmentConfigs(configs);
      setPerformanceData(performance);

      // 显示加载结果统计
      const successCount = [usersResult, configsResult, performanceResult].filter(r => r.status === 'fulfilled').length;
      if (successCount === 3) {
        success('数据加载完成', `成功加载 ${users.length} 个招生员数据`);
      } else {
        info('数据部分加载', `${successCount}/3 个数据源加载成功`);
      }

    } catch (error) {
      console.error('获取数据失败:', error);
      error('数据加载失败', '系统出现异常，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取用户的考核配置
  const getUserConfig = (userId: string) => {
    return assessmentConfigs.find(c => c.user_id.toString() === userId);
  };

  // 获取用户的业绩数据
  const getUserPerformance = (userId: string): TeamPerformanceMemberDetail | undefined => {
    return performanceData?.members.find(m => m.user_id.toString() === userId);
  };

  // 过滤用户列表
  // 只包括招生相关角色，并根据搜索条件过滤
  const filteredUsers = users.filter(user => {
    const recruitmentRoles = [1, 2, 3, 4]; // 只包括 1-4 种角色
    const isRecruitmentRole = user.role_type && recruitmentRoles.includes(user.role_type);

    if (!isRecruitmentRole) {
      return false; // 如果不是招生角色，直接过滤掉
    }

    // 根据搜索条件进行过滤
    return (
      (user.real_name && user.real_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.phone && user.phone.includes(searchTerm)) ||
      (user.id && user.id.includes(searchTerm))
    );
  });

  // 身份标签映射 - 基于 role_type 数字
  const identityLabels: Record<number, string> = {
    1: '全职招生员',
    2: '兼职招生员',
    3: '自由招生员',
    4: '兼职招生负责人',
    5: '总经理',
    6: '考务组',
    7: '财务'
  };

  // 身份标签颜色
  const identityColors: Record<number, string> = {
    1: 'bg-green-100 text-green-800',
    2: 'bg-blue-100 text-blue-800',
    3: 'bg-yellow-100 text-yellow-800',
    4: 'bg-purple-100 text-purple-800',
    5: 'bg-orange-100 text-orange-800',
    6: 'bg-red-100 text-red-800',
    7: 'bg-indigo-100 text-indigo-800',
    8: 'bg-pink-100 text-pink-800'
  };

  // 打开配置抽屉
  const openConfigDrawer = (user: User) => {
    setSelectedUser(user);
    const config = getUserConfig(user.id);

    if (config) {
      // 加载现有配置
      setFormData({
        is_personal_assessment_enabled: config.is_personal_assessment_enabled || false,
        is_team_assessment_enabled: config.is_team_assessment_enabled || false,
        personal_target_students: config.personal_target_students || 0,
        personal_target_revenue: config.personal_target_revenue || 0,
        team_target_students: config.team_target_students || 0,
        team_target_revenue: config.team_target_revenue || 0,
      });
    } else {
      // 重置为默认值
      setFormData({
        is_personal_assessment_enabled: false,
        is_team_assessment_enabled: false,
        personal_target_students: 0,
        personal_target_revenue: 0,
        team_target_students: 0,
        team_target_revenue: 0,
      });
    }

    setDetailOpen(true);
  };

  // 保存配置
  const saveConfig = async () => {
    if (!selectedUser) {
      info('操作无效', '请先选择一个用户再进行操作。');
      return;
    }

    try {
      const existingConfig = getUserConfig(selectedUser.id);

      if (existingConfig) {
        // 更新现有配置
        await updateAssessmentConfig(parseInt(selectedUser.id), formData);
        success('更新成功', '考核配置已成功更新！');
      } else {
        // 创建新配置
        await createAssessmentConfig({
          user_id: parseInt(selectedUser.id),
          ...formData
        });
        success('创建成功', '考核配置已成功创建！');
      }

      await loadData();
      setDetailOpen(false);
    } catch (error) {
      console.error('保存考核配置失败:', error);
      error('保存失败', '保存考核配置时发生错误，请检查输入信息或稍后重试。');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">考核配置管理</h1>
          <p className="text-muted-foreground">管理招生员的考核配置和目标设置</p>
        </div>
        <div className="flex gap-3 items-center">
          <Input
            placeholder="搜索招生员姓名、手机号..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button size="sm" variant="outline" onClick={loadData} disabled={loading}>
            {loading ? '刷新中...' : '刷新'}
          </Button>
          {/* 数据加载状态指示器 */}
          {(loadingStates.users || loadingStates.configs || loadingStates.performance) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <span>加载中...</span>
            </div>
          )}
          {/* 错误状态指示器 */}
          {(dataErrors.users || dataErrors.configs || dataErrors.performance) && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <span>⚠️</span>
              <span>部分数据加载失败</span>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="personal">
        <TabsList >
          <TabsTrigger value="personal">个人业绩考核</TabsTrigger>
          <TabsTrigger value="team">团队业绩考核</TabsTrigger>
        </TabsList>
        <TabsContent value="personal">
          {/* 个人业绩考核 */}
          <Card>
        <CardHeader>
          <CardTitle>招生员列表</CardTitle>

        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>身份</TableHead>
                <TableHead>联系方式</TableHead>
                <TableHead>个人招生 (当月 / 目标)</TableHead>
                <TableHead>个人收入 (当月 / 目标)</TableHead>
                <TableHead>完成率</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => {
                const config = getUserConfig(user.id);
                const performance = getUserPerformance(user.id);




                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.real_name || '未设置姓名'}</div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={identityColors[user.role_type || 0] || 'bg-gray-100 text-gray-800'}>
                        {identityLabels[user.role_type || 0] || '未设置'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-[200px]">
                        <div>{user.phone}</div>
                        <div className="text-gray-500 truncate" title={user.email}>
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{`${performance?.personal_students_count || 0} / ${config?.personal_target_students || 0} 人`}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{`¥${performance?.personal_revenue || 0} / ¥${config?.personal_target_revenue || 0}`}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <Progress value={performance?.personal_completion_rate || 0} />
                        <span className="text-xs text-muted-foreground">{`${performance?.personal_completion_rate || 0}%`}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => openConfigDrawer(user)}
                      >
                        配置考核
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              {dataErrors.users ? (
                <div className="space-y-2">
                  <div className="text-red-600">⚠️ 用户数据加载失败</div>
                  <Button size="sm" variant="outline" onClick={loadData}>
                    重新加载
                  </Button>
                </div>
              ) : (
                searchTerm ? '未找到匹配的招生员' : '暂无招生员数据'
              )}
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                <span>正在加载数据...</span>
              </div>
            </div>
          )}
        </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="team">
          {/* 团队业绩考核 */}
          <Card>
            <CardHeader>
              <CardTitle>团队业绩考核</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>负责人</TableHead>
                    <TableHead>团队招生 (当月 / 目标)</TableHead>
                    <TableHead>团队收入 (当月 / 目标)</TableHead>
                    <TableHead>招生完成率</TableHead>
                    <TableHead>收入完成率</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.filter(user => user.role_type === 5).map(leader => {
                    const config = getUserConfig(leader.id);
                    const summary = performanceData?.summary;

                    return (
                      <TableRow key={leader.id}>
                        <TableCell>
                          <div className="font-medium">{leader.real_name || '未设置姓名'}</div>
                          <div className="text-sm text-gray-500">ID: {leader.id}</div>
                        </TableCell>
                        <TableCell>{`${summary?.total_students || 0} / ${config?.team_target_students || 0} 人`}</TableCell>
                        <TableCell>{`¥${summary?.total_revenue || 0} / ¥${config?.team_target_revenue || 0}`}</TableCell>
                        <TableCell>
                          <div className="w-24">
                            <Progress value={summary?.students_completion_rate || 0} />
                            <span className="text-xs text-muted-foreground">{`${summary?.students_completion_rate || 0}%`}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-24">
                            <Progress value={summary?.revenue_completion_rate || 0} />
                            <span className="text-xs text-muted-foreground">{`${summary?.revenue_completion_rate || 0}%`}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => openConfigDrawer(leader)}>
                            配置考核
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 考核配置抽屉 */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-[600px] sm:max-w-none overflow-y-auto">
          <SheetHeader className="pb-6">
            <SheetTitle className="text-xl font-bold">
              考核配置
            </SheetTitle>
            <div className="text-sm text-muted-foreground">
              {selectedUser && `配置 ${selectedUser.real_name || '未设置姓名'} 的考核指标和目标`}
            </div>
          </SheetHeader>

          {selectedUser && (
            <div className="space-y-8 py-2">
              {/* 用户信息卡片 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-blue-900">用户信息</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-blue-700 font-medium">姓名</Label>
                    <div className="p-3 bg-white rounded-md border border-blue-200">
                      {selectedUser.real_name || '未设置姓名'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-blue-700 font-medium">身份</Label>
                    <div className="p-3 bg-white rounded-md border border-blue-200">
                      <Badge className={identityColors[selectedUser.role_type || 0] || 'bg-gray-100 text-gray-800'}>
                        {identityLabels[selectedUser.role_type || 0] || '未设置'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-blue-700 font-medium">手机号</Label>
                    <div className="p-3 bg-white rounded-md border border-blue-200">
                      {selectedUser.phone}
                    </div>
                  </div>
                  <div>
                    <Label className="text-blue-700 font-medium">邮箱</Label>
                    <div className="p-3 bg-white rounded-md border border-blue-200">
                      <div className="truncate" title={selectedUser.email || '未设置'}>
                        {selectedUser.email || '未设置'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 个人考核配置 */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-green-900">个人考核</h3>
                  </div>
                  <Switch
                    checked={formData.is_personal_assessment_enabled}
                    onCheckedChange={(checked) => setFormData({...formData, is_personal_assessment_enabled: checked})}
                  />
                </div>

                {formData.is_personal_assessment_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-green-700 font-medium">招生目标（人）</Label>
                      <Input
                        type="number"
                        value={formData.personal_target_students}
                        onChange={(e) => setFormData({...formData, personal_target_students: parseInt(e.target.value) || 0})}
                        className="bg-white border-green-200 focus:border-green-400"
                        placeholder="例如：20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-green-700 font-medium">收入目标（元）</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={formData.personal_target_revenue}
                          onChange={(e) => setFormData({...formData, personal_target_revenue: parseFloat(e.target.value) || 0})}
                          className="bg-white border-green-200 focus:border-green-400 pl-8"
                          placeholder="例如：100000"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 font-medium">¥</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 团队考核配置 */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-orange-900">团队考核</h3>
                  </div>
                  <Switch
                    checked={formData.is_team_assessment_enabled}
                    onCheckedChange={(checked) => setFormData({...formData, is_team_assessment_enabled: checked})}
                  />
                </div>

                {formData.is_team_assessment_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-orange-700 font-medium">团队招生目标（人）</Label>
                      <Input
                        type="number"
                        value={formData.team_target_students}
                        onChange={(e) => setFormData({...formData, team_target_students: parseInt(e.target.value) || 0})}
                        className="bg-white border-orange-200 focus:border-orange-400"
                        placeholder="例如：100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-orange-700 font-medium">团队收入目标（元）</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={formData.team_target_revenue}
                          onChange={(e) => setFormData({...formData, team_target_revenue: parseFloat(e.target.value) || 0})}
                          className="bg-white border-orange-200 focus:border-orange-400 pl-8"
                          placeholder="例如：500000"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-600 font-medium">¥</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  取消
                </Button>
                <Button onClick={saveConfig}>
                  {getUserConfig(selectedUser.id) ? '更新配置' : '创建配置'}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}