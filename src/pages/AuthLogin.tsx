import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/useAppStore';
import { mockUsers } from '@/mock';

export default function AuthLogin() {
  const { setUser } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // mock 登录：根据 email 匹配 mockUsers
    const user = mockUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    setTimeout(() => {
      setLoading(false);
      if (!user) {
        setError('账号或密码错误');
        return;
      }
      // 仅模拟密码校验
      if (!password || password.length < 3) {
        setError('账号或密码错误');
        return;
      }
      setUser(user as any);
      window.location.href = '/';
    }, 600);
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
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
              还没有账号？<a className="text-primary" href="/register">去注册</a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

