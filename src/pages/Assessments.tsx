import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { fetchAssessmentConfigs, createAssessmentConfig, updateAssessmentConfig, deleteAssessmentConfig, fetchUsers } from '@/lib/api';
import type { User } from '@/types';
import { useMessage } from '@/hooks/useMessage';

export default function Assessments() {
  const [users, setUsers] = useState<User[]>([]);
  const [assessmentConfigs, setAssessmentConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    is_personal_enabled: false,
    is_team_enabled: false,
    personal_target_students: 0,
    personal_target_revenue: 0,
    team_target_students: 0,
    team_target_revenue: 0,
  });
  const { success, error, info } = useMessage();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersResult, configsResult] = await Promise.all([
        fetchUsers(),
        fetchAssessmentConfigs()
      ]);



      // 显示所有用户，但优先显示招生员角色
      const allUsers = usersResult.sort((a, b) => {
        const recruitmentRoles = [1, 2, 3, 4, 5]; // 招生员相关角色
        const aIsRecruitment = a.role_type && recruitmentRoles.includes(a.role_type);
        const bIsRecruitment = b.role_type && recruitmentRoles.includes(b.role_type);

        if (aIsRecruitment && !bIsRecruitment) return -1;
        if (!aIsRecruitment && bIsRecruitment) return 1;
        return 0;
      });
      setUsers(allUsers);
      setAssessmentConfigs(configsResult.items || []);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取用户的考核配置
  const getUserConfig = (userId: string) => {
    return assessmentConfigs.find(c => c.user_id.toString() === userId);
  };

  // 过滤用户列表
  const filteredUsers = users.filter(user =>
    (user.real_name && user.real_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.phone && user.phone.includes(searchTerm)) ||
    (user.id && user.id.includes(searchTerm))
  );

  // 身份标签映射 - 基于 role_type 数字
  const identityLabels: Record<number, string> = {
    1: '全职招生员',
    2: '兼职招生员',
    3: '自由招生员',
    4: '渠道招生员',
    5: '团队负责人',
    6: '总经理',
    7: '考务组',
    8: '财务'
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
        is_personal_enabled: config.is_personal_enabled || false,
        is_team_enabled: config.is_team_enabled || false,
        personal_target_students: config.personal_target_students || 0,
        personal_target_revenue: config.personal_target_revenue || 0,
        team_target_students: config.team_target_students || 0,
        team_target_revenue: config.team_target_revenue || 0,
      });
    } else {
      // 重置为默认值
      setFormData({
        is_personal_enabled: false,
        is_team_enabled: false,
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
        </div>
      </div>

      {/* 招生员列表 */}
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
                <TableHead>考核状态</TableHead>
                <TableHead>个人目标</TableHead>
                <TableHead>团队目标</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => {
                const config = getUserConfig(user.id);
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
                      <Badge variant={config ? 'default' : 'secondary'}>
                        {config ? '已配置' : '未配置'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {config && config.is_personal_enabled ? (
                        <div className="text-sm">
                          <div>招生: {config.personal_target_students || 0}人</div>
                          <div>收入: ¥{config.personal_target_revenue || 0}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">未启用</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {config && config.is_team_enabled ? (
                        <div className="text-sm">
                          <div>招生: {config.team_target_students || 0}人</div>
                          <div>收入: ¥{config.team_target_revenue || 0}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">未启用</span>
                      )}
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

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? '未找到匹配的招生员' : '暂无招生员数据'}
            </div>
          )}
        </CardContent>
      </Card>

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
                    checked={formData.is_personal_enabled}
                    onCheckedChange={(checked) => setFormData({...formData, is_personal_enabled: checked})}
                  />
                </div>

                {formData.is_personal_enabled && (
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
                    checked={formData.is_team_enabled}
                    onCheckedChange={(checked) => setFormData({...formData, is_team_enabled: checked})}
                  />
                </div>

                {formData.is_team_enabled && (
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