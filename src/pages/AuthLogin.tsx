import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/useAppStore';
import { loginAdmin } from '@/lib/api';
import { useLocation, useNavigate } from 'react-router-dom';

export default function AuthLogin() {
  const { setUser, setTokens } = useAppStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await loginAdmin(username.trim(), password);

      // 只有在成功获取到响应后才进行后续操作
      if (!res || !res.token || !res.user) {
        throw new Error('登录响应数据不完整');
      }

      // store tokens and user
      setTokens(res.token.access_token, res.token.refresh_token);

      // 根据后端用户角色映射前端角色
      const mapUserRole = (backendRoles: any[]) => {
        if (!backendRoles || backendRoles.length === 0) {
          return 'system_admin'; // 默认角色
        }

        // 获取第一个激活的角色
        const activeRole = backendRoles.find((role: any) => role.status === 1);
        if (!activeRole) {
          return 'system_admin';
        }

        // 根据后端角色类型映射前端角色
        switch (activeRole.role_type) {
          case 6: // 总经理
            return 'general_manager';
          case 7: // 考务组
            return 'exam_staff';
          case 8: // 财务组
            return 'finance_staff';
          default:
            return 'system_admin'; // 其他角色暂时都映射为系统管理员
        }
      };

      // Map backend CurrentUser to frontend User type
      const mappedUser = {
        id: String(res.user.id),
        name: res.user.real_name || res.user.username,
        email: res.user.username,
        phone: res.user.phone,
        role: mapUserRole(res.user.roles),
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(mappedUser as any);

      // 只有在所有状态都设置成功后才进行重定向
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });

    } catch (err: any) {
      console.error('登录失败:', err);
      // 登录失败时，确保不设置任何认证状态，只显示错误信息
      setError(err?.message || '登录失败，请检查用户名和密码');
      // 不进行任何重定向操作
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>后台管理系统登录</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input id="username" placeholder="gm / finance_exam / recruiter" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" type="password" placeholder="请输入密码" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              没有账号？<a className="text-primary hover:underline" href="/register">立即注册</a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
