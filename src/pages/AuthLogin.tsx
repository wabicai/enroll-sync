import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/useAppStore';
import { loginAdmin } from '@/lib/api';
import { useLocation, useNavigate, Link } from 'react-router-dom';

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
      // store tokens and user
      setTokens(res.token.access_token, res.token.refresh_token);
      // Map backend CurrentUser to frontend User type lightly
      const mappedUser = {
        id: String(res.user.id),
        name: res.user.real_name || res.user.username,
        email: res.user.username,
        phone: res.user.phone,
        role: 'system_admin' as const,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(mappedUser as any);
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || '登录失败');
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
              没有账号？
              <Link to="/register" className="text-primary hover:underline ml-1">
                立即注册
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
