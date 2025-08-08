import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/useAppStore';
import { mockUsers } from '@/mock';

const identityOptions = [
  { value: 'full_time', label: '全职招生' },
  { value: 'part_time', label: '兼职招生' },
  { value: 'freelance', label: '自由招生' },
  { value: 'channel', label: '渠道招生' },
  { value: 'part_time_lead', label: '兼职负责人' },
];

export default function AuthRegister() {
  const { setUser } = useAppStore();
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    id_card: '',
    identity_type: '',
    invite_code: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 简单字段校验（与后台规范一致的最小子集）
    if (!form.email || !form.password || !form.name || !form.id_card || !form.identity_type) {
      setError('请完整填写必填信息');
      setLoading(false);
      return;
    }
    if (form.identity_type === 'part_time' && !form.invite_code) {
      setError('兼职招生需填写负责人邀请码');
      setLoading(false);
      return;
    }

    // mock 注册：直接创建一个待审核用户并跳转到登录
    setTimeout(() => {
      const newUser = {
        id: String(Date.now()),
        name: form.name,
        email: form.email.toLowerCase(),
        phone: '',
        role: 'system_admin' as const,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        identity: (form.identity_type as any),
      };
      (mockUsers as any).push(newUser);
      setLoading(false);
      window.location.href = '/login';
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>后台管理系统注册</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" type="password" placeholder="至少8位，包含字母与数字" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input id="name" placeholder="请输入姓名" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idcard">身份证号</Label>
              <Input id="idcard" placeholder="18位身份证号" value={form.id_card} onChange={(e) => setForm({ ...form, id_card: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>选择身份</Label>
              <Select onValueChange={(v) => setForm({ ...form, identity_type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择身份" />
                </SelectTrigger>
                <SelectContent>
                  {identityOptions.map(op => (
                    <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.identity_type === 'part_time' && (
              <div className="space-y-2">
                <Label htmlFor="invite">负责人邀请码</Label>
                <Input id="invite" placeholder="请输入负责人邀请码" value={form.invite_code} onChange={(e) => setForm({ ...form, invite_code: e.target.value })} />
              </div>
            )}
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '提交中...' : '注册并提交审批'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              已有账号？<a className="text-primary" href="/login">去登录</a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

