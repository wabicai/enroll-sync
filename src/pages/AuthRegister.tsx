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
    phone: '',
    identity_type: '',
    invite_code: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
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

      // 映射前端身份类型到后端枚举值
      const roleTypeMap = {
        'full_time': 1,      // 全职
        'part_time': 2,      // 兼职
        'freelance': 3,      // 自由
        'channel': 4,        // 渠道
        'part_time_lead': 5, // 团队负责人
      };

      // 调用真实的注册API
      const registerData = {
        username: form.email, // 使用邮箱作为用户名
        password: form.password,
        confirm_password: form.password,
        real_name: form.name,
        id_card: form.id_card,
        phone: form.phone || '',
        gender: 0, // 默认未知
        role_type: roleTypeMap[form.identity_type as keyof typeof roleTypeMap] || 1,
        invite_code: form.invite_code || null,
        tags: `身份：${identityOptions.find(opt => opt.value === form.identity_type)?.label || ''}`,
      };

      const response = await fetch('https://chuangningpeixun.com/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '注册失败' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      alert(`注册成功！用户ID: ${result.user_id}，状态: ${result.need_audit ? '待审核' : '已激活'}，请返回登录页面`);
      window.location.href = '/login';
      
    } catch (error: any) {
      setError(error.message || '注册失败，请重试');
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
              <Label htmlFor="phone">手机号</Label>
              <Input id="phone" placeholder="请输入手机号" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
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

