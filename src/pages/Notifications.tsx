import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { fetchNotifications, fetchNotificationTemplates } from '@/lib/api';
import type { NotificationItem, NotificationTemplate } from '@/types';

export default function Notifications() {
  const [list, setList] = useState<NotificationItem[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);

  useEffect(() => {
    fetchNotifications().then(setList);
    fetchNotificationTemplates().then(setTemplates);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">通知中心</h1>
        <p className="text-muted-foreground">查看系统通知与模板</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>通知列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标题</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map(n => (
                <TableRow key={n.id}>
                  <TableCell>{n.title}</TableCell>
                  <TableCell>{n.type}</TableCell>
                  <TableCell>
                    <Badge variant={n.status === 'unread' ? 'default' : 'secondary'}>{n.status}</Badge>
                  </TableCell>
                  <TableCell>{n.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>通知模板</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>场景</TableHead>
                <TableHead>渠道</TableHead>
                <TableHead>启用</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.scene}</TableCell>
                  <TableCell>{t.channel}</TableCell>
                  <TableCell>
                    <Badge variant={t.enabled ? 'default' : 'secondary'}>{t.enabled ? '启用' : '停用'}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


