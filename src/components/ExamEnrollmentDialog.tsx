import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Users, FileCheck, Award, GraduationCap, AlertCircle } from 'lucide-react';
import { fetchExamEnrollments } from '@/lib/api';
import type { ExamEnrollment, ExamEnrollmentListResponse } from '@/types';

interface ExamEnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId: string;
  scheduleName: string;
  examDate: string;
}

// 状态映射
const enrollmentStatusLabels = {
  1: '正常',
  2: '退学',
  3: '完成',
};

const qualificationStatusLabels = {
  1: '待审核',
  2: '已通过',
  3: '不符合',
};

const examResultLabels = {
  1: '未考',
  2: '通过',
  3: '未通过',
};

const certificateStatusLabels = {
  1: '未发放',
  2: '已发放',
  3: '申请中',
};

const genderLabels = {
  1: '男',
  2: '女',
};

// 状态样式映射
const getEnrollmentStatusVariant = (status: number) => {
  switch (status) {
    case 1: return 'default';
    case 2: return 'destructive';
    case 3: return 'secondary';
    default: return 'outline';
  }
};

const getQualificationStatusVariant = (status: number) => {
  switch (status) {
    case 1: return 'secondary';
    case 2: return 'default';
    case 3: return 'destructive';
    default: return 'outline';
  }
};

const getExamResultVariant = (result?: number) => {
  switch (result) {
    case 1: return 'outline';
    case 2: return 'default';
    case 3: return 'destructive';
    default: return 'outline';
  }
};

const getCertificateStatusVariant = (status: number) => {
  switch (status) {
    case 1: return 'outline';
    case 2: return 'default';
    case 3: return 'secondary';
    default: return 'outline';
  }
};

export function ExamEnrollmentDialog({
  open,
  onOpenChange,
  scheduleId,
  scheduleName,
  examDate,
}: ExamEnrollmentDialogProps) {
  const [enrollments, setEnrollments] = useState<ExamEnrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState<string>('all');
  const [qualificationStatusFilter, setQualificationStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statistics, setStatistics] = useState<ExamEnrollmentListResponse['statistics']>();
  const pageSize = 20;

  // 加载学员名单数据
  const loadEnrollments = async () => {
    if (!scheduleId) return;
    
    setLoading(true);
    try {
      const params = {
        keyword: searchTerm || undefined,
        enrollment_status: enrollmentStatusFilter !== 'all' ? Number(enrollmentStatusFilter) : undefined,
        qualification_status: qualificationStatusFilter !== 'all' ? Number(qualificationStatusFilter) : undefined,
        page,
        page_size: pageSize,
        include_statistics: true,
      };

      const response: ExamEnrollmentListResponse = await fetchExamEnrollments(scheduleId, params);
      setEnrollments(response.items);
      setTotal(response.total);
      setStatistics(response.statistics);
    } catch (error) {
      console.error('获取学员名单失败:', error);
      setEnrollments([]);
      setTotal(0);
      setStatistics(undefined);
    } finally {
      setLoading(false);
    }
  };

  // 重置搜索条件
  const resetFilters = () => {
    setSearchTerm('');
    setEnrollmentStatusFilter('all');
    setQualificationStatusFilter('all');
    setPage(1);
  };

  // 当对话框打开时加载数据
  useEffect(() => {
    if (open) {
      loadEnrollments();
    }
  }, [open, scheduleId, searchTerm, enrollmentStatusFilter, qualificationStatusFilter, page]);

  // 当对话框关闭时重置状态
  useEffect(() => {
    if (!open) {
      resetFilters();
      setEnrollments([]);
      setTotal(0);
      setStatistics(undefined);
    }
  }, [open]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {scheduleName} - 学员名单
            <Badge variant="outline" className="ml-2">
              {examDate}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* 统计信息卡片 */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">总报名人数</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.total_enrollments}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">资格审核通过</CardTitle>
                  <FileCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {statistics.qualification_distribution.approved}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">考试通过</CardTitle>
                  <Award className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {statistics.exam_result_distribution.passed}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">证书已发放</CardTitle>
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {statistics.certificate_distribution.issued}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 搜索和筛选 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="搜索学员姓名、电话、报考编号..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={enrollmentStatusFilter} onValueChange={setEnrollmentStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="报考状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="1">正常</SelectItem>
                    <SelectItem value="2">退学</SelectItem>
                    <SelectItem value="3">完成</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={qualificationStatusFilter} onValueChange={setQualificationStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="资格审核" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部审核</SelectItem>
                    <SelectItem value="1">待审核</SelectItem>
                    <SelectItem value="2">已通过</SelectItem>
                    <SelectItem value="3">不符合</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={resetFilters}>
                  重置筛选
                </Button>
              </div>
              
              {(enrollmentStatusFilter !== 'all' || qualificationStatusFilter !== 'all' || searchTerm) && (
                <div className="mt-3 text-sm text-muted-foreground">
                  显示 {total} 条结果
                  {searchTerm && <span> · 关键词: {searchTerm}</span>}
                  {enrollmentStatusFilter !== 'all' && <span> · 状态: {enrollmentStatusLabels[Number(enrollmentStatusFilter) as keyof typeof enrollmentStatusLabels]}</span>}
                  {qualificationStatusFilter !== 'all' && <span> · 审核: {qualificationStatusLabels[Number(qualificationStatusFilter) as keyof typeof qualificationStatusLabels]}</span>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 学员名单表格 */}
          <Card className="flex-1 overflow-hidden">
            <CardContent className="p-0 h-full overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background border-b">
                  <TableRow>
                    <TableHead>学员信息</TableHead>
                    <TableHead>报考信息</TableHead>
                    <TableHead>审核状态</TableHead>
                    <TableHead>考试结果</TableHead>
                    <TableHead>证书状态</TableHead>
                    <TableHead>招生员</TableHead>
                    <TableHead>报名时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          加载中...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : enrollments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="h-8 w-8 text-muted-foreground" />
                          <div className="text-muted-foreground text-lg">暂无报名学员</div>
                          <div className="text-sm text-muted-foreground">
                            该考试安排暂时没有学员报名
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    enrollments.map((enrollment) => (
                      <TableRow key={enrollment.enrollment_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{enrollment.student_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {enrollment.phone} | {genderLabels[enrollment.gender as keyof typeof genderLabels]} | {enrollment.education}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              学员编号: {enrollment.student_number}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{enrollment.course_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {enrollment.course_level} | {enrollment.course_batch}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              报考编号: {enrollment.enrollment_number}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant={getEnrollmentStatusVariant(enrollment.enrollment_status)}>
                              {enrollmentStatusLabels[enrollment.enrollment_status as keyof typeof enrollmentStatusLabels]}
                            </Badge>
                            <div>
                              <Badge variant={getQualificationStatusVariant(enrollment.qualification_status)}>
                                {qualificationStatusLabels[enrollment.qualification_status as keyof typeof qualificationStatusLabels]}
                              </Badge>
                            </div>
                            <div className="text-xs">
                              {enrollment.materials_complete ? (
                                <span className="text-green-600">✓ 资料完整</span>
                              ) : (
                                <span className="text-orange-600">⚠ 资料缺失</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {enrollment.preliminary_result && (
                              <Badge variant={getExamResultVariant(enrollment.preliminary_result)}>
                                初考: {examResultLabels[enrollment.preliminary_result as keyof typeof examResultLabels]}
                              </Badge>
                            )}
                            {enrollment.makeup_exam_result && (
                              <div>
                                <Badge variant={getExamResultVariant(enrollment.makeup_exam_result)}>
                                  补考: {examResultLabels[enrollment.makeup_exam_result as keyof typeof examResultLabels]}
                                </Badge>
                              </div>
                            )}
                            {!enrollment.preliminary_result && (
                              <Badge variant="outline">未考</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant={getCertificateStatusVariant(enrollment.certificate_status)}>
                              {certificateStatusLabels[enrollment.certificate_status as keyof typeof certificateStatusLabels]}
                            </Badge>
                            {enrollment.certificate_number && (
                              <div className="text-xs text-muted-foreground">
                                证书编号: {enrollment.certificate_number}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {enrollment.recruiter_name || '未分配'}
                          </div>
                          {enrollment.channel && (
                            <div className="text-xs text-muted-foreground">
                              渠道: {enrollment.channel}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(enrollment.registration_date)}
                          </div>
                          {enrollment.is_veteran_conversion && (
                            <div className="text-xs text-blue-600">
                              退伍军人转换
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                第 {page} 页，共 {totalPages} 页，总计 {total} 条记录
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
