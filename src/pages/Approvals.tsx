import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { mockUsers, mockUpgradeApplications } from '@/mock';

export default function Approvals() {
  const pendingRegistrations = mockUsers.filter(u => u.status === 'pending');
  const [upgrades, setUpgrades] = useState(mockUpgradeApplications);

  const approveUpgrade = (id: string) => {
    setUpgrades(prev => prev.map(item => (item.id === id ? { ...item, status: 'approved' } : item)));
  };

  const rejectUpgrade = (id: string) => {
    setUpgrades(prev => prev.map(item => (item.id === id ? { ...item, status: 'rejected' } : item)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">审批中心</h1>
        <p className="text-muted-foreground">注册与升级申请的集中处理</p>
      </div>

      <Tabs defaultValue="registrations">
        <TabsList>
          <TabsTrigger value="registrations">注册审批</TabsTrigger>
          <TabsTrigger value="upgrades">升级审批</TabsTrigger>
        </TabsList>

        <TabsContent value="registrations">
          <Card>
            <CardHeader>
              <CardTitle>待审批注册</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>角色/身份</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRegistrations.map(u => (
                    <TableRow key={u.id}>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.role}{u.identity ? ` / ${u.identity}` : ''}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">待审批</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pendingRegistrations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        当前没有待审批的注册
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upgrades">
          <Card>
            <CardHeader>
              <CardTitle>升级申请</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>申请人</TableHead>
                    <TableHead>从身份</TableHead>
                    <TableHead>到身份</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upgrades.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.userName}</TableCell>
                      <TableCell>{item.fromIdentity}</TableCell>
                      <TableCell>{item.toIdentity}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'pending' ? 'secondary' : item.status === 'approved' ? 'default' : 'destructive'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {item.status === 'pending' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => approveUpgrade(item.id)}>通过</Button>
                            <Button size="sm" variant="outline" onClick={() => rejectUpgrade(item.id)}>拒绝</Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


