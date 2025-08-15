import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/useAppStore';
import { register } from '@/lib/api';
import { useNavigate, Link } from 'react-router-dom';

const identityOptions = [
  { value: 'full_time', label: '全职招生' },
  { value: 'part_time', label: '兼职招生' },
  { value: 'freelance', label: '自由招生' },
  { value: 'channel', label: '渠道招生' },
  { value: 'part_time_lead', label: '兼职负责人' },
];

export default function AuthRegister() {
  const { setUser } = useAppStore();
  const navigate = useNavigate();
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 简单字段校验
    if (!form.email || !form.password || !form.name) {
      setError('请完整填写必填信息');
      setLoading(false);
      return;
    }

    try {
      const result = await register({
        name: form.name,
        email: form.email.toLowerCase(),
        password: form.password,
      });

      // 注册成功，跳转到登录页面
      navigate('/login', {
        state: {
          message: '注册成功！请使用您的邮箱和密码登录。'
        }
      });
    } catch (err: any) {
      setError(err?.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
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
              已有账号？
              <Link to="/login" className="text-primary hover:underline ml-1">
                去登录
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

