/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  mockCourses,
  mockSchedules,
  mockUsers,
  mockUpgradeApplications,
  mockNotifications,
  mockNotificationTemplates,
  mockRuleConfig,
  mockUpgradeConditions,
  mockReminderPlans,
  mockExportRecords,
} from '@/mock';
import type { Course, Schedule, NotificationItem, NotificationTemplate, RuleConfig, UpgradeConditions, ReminderPlan, ExportRecord, User, Student, Reward, Exam } from '@/types';

// Runtime config: mock vs real API
const USE_MOCK = (import.meta as any).env?.MODE !== 'production' || (import.meta as any).env?.VITE_USE_MOCK === 'true';
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1 = '/api/v1';

// Backend response types
type BackendPaged<T> = { items: T[]; total: number; page?: number; page_size?: number; pages?: number };
type BackendUserListItem = { id: number; username: string; real_name: string; phone: string; id_card: string; status: number; roles: string[]; created_at: string; updated_at: string };
type BackendExamStudent = { id: number; name: string; id_card: string; phone: string; created_at: string; updated_at: string };
type BackendNotification = { id: number; title: string; content: string; type: NotificationItem['type']; is_read: boolean; created_at: string };

async function httpGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

async function httpPost<T>(path: string, body?: any): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function httpPut<T>(path: string, body?: any): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function httpDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function fetchCourses(): Promise<Course[]> {
  if (USE_MOCK) return Promise.resolve(structuredClone(mockCourses));
  const data = await httpGet<any[]>(`/api/v1/courses`);
  return data as Course[];
}

// Users
export async function fetchUsers(): Promise<User[]> {
  if (USE_MOCK) {
    const { mockUsers } = await import('@/mock');
    return structuredClone(mockUsers) as User[];
  }
  const res = await httpGet<{ items: any[]; total: number; page: number; page_size: number; pages: number }>(`${API_V1}/users`);
  const list = (res.items || []).map(mapBackendUserListItemToUser);
  return list;
}

export async function fetchSchedules(): Promise<Schedule[]> {
  if (USE_MOCK) return Promise.resolve(structuredClone(mockSchedules));
  const data = await httpGet<any[]>(`/api/v1/schedules`);
  return data as Schedule[];
}

export async function fetchPendingRegistrations() {
  if (USE_MOCK) return Promise.resolve(structuredClone(mockUsers.filter(u => u.status === 'pending')));
  // 后端统一审批中心
  const res = await httpGet<{ items: any[]; total: number }>(`${API_V1}/audits/pending`);
  // 仅筛选用户注册类型
  return res.items
    .filter(it => it.type === 'user_registration')
    .map(it => ({
      id: it.id,
      name: it.applicant,
      email: it.details?.username || '-',
      phone: it.phone || '-',
      role: 'system_admin',
      status: 'pending',
      createdAt: it.application_time,
      tags: [],
    }));
}

export async function fetchUpgradeApplications() {
  if (USE_MOCK) return Promise.resolve(structuredClone(mockUpgradeApplications));
  // 统一审批中心中无直给升级申请列表，这里可复用 /audits/pending 后端类型=upgrade
  const res = await httpGet<{ items: any[] }>(`${API_V1}/audits/pending`);
  return res.items.filter(it => it.type === 'upgrade');
}

// 审批处理
export async function approveAudit(auditId: string, reason?: string) {
  if (USE_MOCK) return { success: true } as any;
  return httpPost(`${API_V1}/audits/${auditId}/approve${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`);
}

export async function rejectAudit(auditId: string, reason: string) {
  if (USE_MOCK) return { success: true } as any;
  return httpPost(`${API_V1}/audits/${auditId}/reject?reason=${encodeURIComponent(reason)}`);
}

// 通知中心
export async function fetchNotifications(): Promise<NotificationItem[]> {
  if (USE_MOCK) return Promise.resolve(structuredClone(mockNotifications));
  const data = await httpGet<BackendPaged<BackendNotification>>(`${API_V1}/notifications`);
  return (data.items || []).map((n) => ({
    id: String(n.id),
    title: n.title,
    content: n.content,
    type: n.type,
    status: n.is_read ? 'read' : 'unread',
    createdAt: n.created_at,
  }));
}

export async function fetchNotificationTemplates(): Promise<NotificationTemplate[]> {
  return Promise.resolve(structuredClone(mockNotificationTemplates));
}

// 系统设置
export async function fetchRuleConfig(): Promise<RuleConfig> {
  return Promise.resolve(structuredClone(mockRuleConfig));
}

export async function fetchUpgradeConditions(): Promise<UpgradeConditions> {
  return Promise.resolve(structuredClone(mockUpgradeConditions));
}

export async function fetchReminderPlans(): Promise<ReminderPlan[]> {
  return Promise.resolve(structuredClone(mockReminderPlans));
}

// 导出中心
export async function fetchExportRecords(): Promise<ExportRecord[]> {
  if (USE_MOCK) return Promise.resolve(structuredClone(mockExportRecords));
  // 若后端有导出任务查询接口，可替换为真实；当前占位
  return [];
}

// 导出 - 奖励数据
export async function exportRewardsData(params: { from?: string; to?: string; reward_status?: string; recruiter_id?: string }): Promise<ExportRecord> {
  if (USE_MOCK) {
    return {
      id: genId('export'),
      type: 'rewards',
      status: 'completed',
      createdAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      fileUrl: '/exports/mock_rewards.xlsx',
    };
  }
  const body: any = {
    export_type: 'applications',
    start_date: params.from,
    end_date: params.to,
    filters: {
      reward_status: params.reward_status,
      recruiter_id: params.recruiter_id,
    },
  };
  const res = await httpPost<{ file_url: string; export_count: number; file_name: string; message: string }>(`${API_V1}/rewards/export`, body);
  return {
    id: genId('export'),
    type: 'rewards',
    status: 'completed',
    createdAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    fileUrl: res.file_url || undefined,
  };
}

// 团队 - 我的团队成员
export async function fetchMyTeamMembers(params?: { keyword?: string; role_type?: number; level?: number; include_indirect?: boolean; page?: number; page_size?: number }) {
  if (USE_MOCK) return { items: [], total: 0, page: 1, page_size: 20, pages: 0 };
  const sp = new URLSearchParams();
  if (params?.keyword) sp.set('keyword', params.keyword);
  if (params?.role_type != null) sp.set('role_type', String(params.role_type));
  if (params?.level != null) sp.set('level', String(params.level));
  if (params?.include_indirect != null) sp.set('include_indirect', String(params.include_indirect));
  if (params?.page) sp.set('page', String(params.page));
  if (params?.page_size) sp.set('page_size', String(params.page_size));
  return httpGet(`${API_V1}/teams/my-team?${sp.toString()}`);
}

export async function fetchTeamHierarchy(max_levels?: number) {
  if (USE_MOCK) return { id: 'root', name: '我', children: [] } as any;
  const sp = new URLSearchParams();
  if (max_levels) sp.set('max_levels', String(max_levels));
  return httpGet(`${API_V1}/teams/hierarchy${sp.toString() ? `?${sp.toString()}` : ''}`);
}

export async function fetchTeamPerformance(user_id?: string | number) {
  if (USE_MOCK) return { total_students: 0, total_revenue: 0 } as any;
  if (user_id) return httpGet(`${API_V1}/teams/performance/${user_id}`);
  return httpGet(`${API_V1}/teams/performance`);
}

export async function generateInviteCodes(payload: { role_type: number; count: number; expiry_days?: number; tags?: string; base_salary?: number; kpi_target?: Record<string, unknown> }) {
  if (USE_MOCK) return Array.from({ length: payload.count }).map((_, i) => `MOCK${i}`);
  return httpPost(`${API_V1}/teams/invite-codes`, payload);
}

// 财务模块已移除

// ============ Mutations (Mock) ============
// 简单ID生成
function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Users
export async function createUser(partial: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  if (!USE_MOCK) {
    // 后台创建用户接口：POST /users
    const payload = {
      username: partial.email || `user_${Date.now()}`,
      real_name: partial.name,
      phone: partial.phone,
      id_card: partial.idCard || '000000000000000000',
      password: 'ChangeMe123',
      confirm_password: 'ChangeMe123',
      roles: [],
    };
    const created = await httpPost<any>(`/users`, payload);
    return mapBackendUserListItemToUser(created);
  }
  const user: User = {
    ...partial,
    id: genId('user'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const mod = (await import('@/mock')).mockUsers as User[];
  mod.push(user);
  return Promise.resolve(structuredClone(user));
}

export async function updateUserStatus(userId: string, status: User['status']): Promise<User | null> {
  if (!USE_MOCK) {
    const statusMap: Record<User['status'], number> = { active: 1, pending: 2, inactive: 4 };
    const updated = await httpPut<any>(`/users/${userId}`, { status: statusMap[status] || 1 });
    return mapBackendUserListItemToUser(updated);
  }
  const mod = (await import('@/mock')).mockUsers as User[];
  const idx = mod.findIndex((u: User) => u.id === userId);
  if (idx >= 0) {
    mod[idx] = { ...mod[idx], status, updatedAt: new Date().toISOString() };
    return Promise.resolve(structuredClone(mod[idx]));
  }
  return Promise.resolve(null);
}

export async function deleteUser(userId: string): Promise<boolean> {
  if (!USE_MOCK) {
    await httpDelete(`/users/${userId}`);
    return true;
  }
  const mod = (await import('@/mock')).mockUsers as User[];
  const len = mod.length;
  const after = mod.filter((u: User) => u.id !== userId);
  mod.length = 0;
  mod.push(...after);
  return Promise.resolve(after.length < len);
}

// ============ Common helpers ============
function mapBackendUserListItemToUser(u: any): User {
  // 后端 UserListItem.roles 为角色名称列表(List[str])
  const rolesRaw: string[] = Array.isArray(u.roles) ? u.roles.map((x: any) => String(x).toLowerCase()) : [];
  let role: User['role'] = 'system_admin';
  if (rolesRaw.some(r => r.includes('总经理') || r.includes('general') || r.includes('manager'))) role = 'general_manager';
  else if (rolesRaw.some(r => r.includes('考务') || r.includes('exam'))) role = 'exam_admin';
  else if (rolesRaw.some(r => r.includes('财务') || r.includes('finance'))) role = 'finance';
  const statusMap: Record<number, User['status']> = { 1: 'active', 2: 'pending', 3: 'inactive', 4: 'inactive' };
  return {
    id: String(u.id),
    name: u.real_name || u.username || '-',
    email: u.username || '-',
    phone: u.phone || '-',
    idCard: u.id_card,
    role,
    status: statusMap[u.status] || 'pending',
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    tags: [],
  } as User;
}

// Students
export async function fetchStudents(): Promise<Student[]> {
  if (USE_MOCK) {
    const { mockStudents } = await import('@/mock');
    return structuredClone(mockStudents) as Student[];
  }
  const res = await httpGet<{ items: any[]; total: number; page: number; page_size: number; pages: number }>(
    `/students/exam-students`
  );
  const map = (s: any): Student => ({
    id: String(s.id),
    name: s.name,
    idCard: s.id_card,
    phone: s.phone,
    category: 'other',
    status: 'approved',
    paymentStatus: 'unpaid',
    amount: 0,
    paidAmount: 0,
    recruiterId: '',
    recruiterName: '',
    tags: [],
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  });
  return (res.items || []).map(map);
}

export async function createStudent(partial: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<Student> {
  if (!USE_MOCK) {
    const payload = {
      name: partial.name,
      phone: partial.phone,
      id_card: partial.idCard,
      gender: 0,
      education: '其他',
      major: null,
      work_unit: null,
      job_position: null,
      work_years: 0,
      employment_intention: null,
      notes: null,
    };
    const created = await httpPost<any>(`/students/exam-students`, payload);
    const mapped: Student = {
      id: String(created.id),
      name: created.name,
      idCard: created.id_card,
      phone: created.phone,
      category: 'other',
      status: 'approved',
      paymentStatus: 'unpaid',
      amount: 0,
      paidAmount: 0,
      recruiterId: '',
      recruiterName: '',
      tags: [],
      createdAt: created.created_at,
      updatedAt: created.updated_at,
    };
    return mapped;
  }
  const student: Student = {
    ...partial,
    id: genId('student'),
    paidAmount: (partial as Partial<Student>).paidAmount ?? 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Student;
  const mod = (await import('@/mock')).mockStudents as Student[];
  mod.push(student);
  return Promise.resolve(structuredClone(student));
}

export async function setStudentStatus(studentId: string, status: Student['status']): Promise<Student | null> {
  if (!USE_MOCK) {
    // 后端 ExamStudent 无对应审核状态枚举，这里仅触发一次更新时间，返回前端状态不变
    const updated = await httpPut<any>(`/students/exam-students/${studentId}`, {});
    return null; // 前端自行更新本地状态
  }
  const mod = (await import('@/mock')).mockStudents as Student[];
  const idx = mod.findIndex((s) => s.id === studentId);
  if (idx >= 0) {
    mod[idx] = { ...mod[idx], status, updatedAt: new Date().toISOString() };
    return Promise.resolve(structuredClone(mod[idx]));
  }
  return Promise.resolve(null);
}

export async function addStudentPayment(studentId: string, addAmount: number): Promise<Student | null> {
  if (!USE_MOCK) {
    // 未对接财务接口，这里返回 null 前端不调用
    return null;
  }
  const mod = (await import('@/mock')).mockStudents as Student[];
  const idx = mod.findIndex((s) => s.id === studentId);
  if (idx >= 0) {
    const paidAmount = mod[idx].paidAmount + addAmount;
    mod[idx] = { ...mod[idx], paidAmount, updatedAt: new Date().toISOString() };
    return Promise.resolve(structuredClone(mod[idx]));
  }
  return Promise.resolve(null);
}

export async function updateStudent(studentId: string, partial: Partial<Student>): Promise<Student | null> {
  if (!USE_MOCK) {
    const payload: any = {};
    if (partial.name) payload.name = partial.name;
    if (partial.phone) payload.phone = partial.phone;
    if (partial.idCard) payload.id_card = partial.idCard;
    const updated = await httpPut<any>(`/students/exam-students/${studentId}`, payload);
    const mapped: Student = {
      id: String(updated.id),
      name: updated.name,
      idCard: updated.id_card,
      phone: updated.phone,
      category: 'other',
      status: 'approved',
      paymentStatus: 'unpaid',
      amount: 0,
      paidAmount: 0,
      recruiterId: '',
      recruiterName: '',
      tags: [],
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
    return mapped;
  }
  const mod = (await import('@/mock')).mockStudents as Student[];
  const idx = mod.findIndex((s) => s.id === studentId);
  if (idx >= 0) {
    mod[idx] = { ...mod[idx], ...partial, updatedAt: new Date().toISOString() };
    return Promise.resolve(structuredClone(mod[idx]));
  }
  return Promise.resolve(null);
}

export async function deleteStudent(studentId: string): Promise<boolean> {
  if (!USE_MOCK) {
    await httpDelete(`/students/exam-students/${studentId}`);
    return true;
  }
  const mod = (await import('@/mock')).mockStudents as Student[];
  const before = mod.length;
  const after = mod.filter(s => s.id !== studentId);
  mod.length = 0;
  mod.push(...after);
  return Promise.resolve(after.length < before);
}

// Courses
export async function createCourse(partial: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course> {
  if (!USE_MOCK) {
    const payload = {
      course_name: partial.course_name,
      course_code: partial.course_code,
      course_level: partial.course_level,
      description: partial.description,
      requirements: partial.requirements,
      national_standard: partial.national_standard_ref,
      standard_fee: partial.standard_fee,
      exam_content: undefined,
      theory_ratio: partial.theory_ratio,
      practice_ratio: partial.practice_ratio,
      status: partial.status === 'active' ? 1 : 2,
    };
    const created = await httpPost<any>(`/api/v1/courses`, payload);
    return created as Course;
  }
  const course: Course = {
    ...partial,
    id: genId('course'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const mod = (await import('@/mock')).mockCourses as Course[];
  mod.push(course);
  return Promise.resolve(structuredClone(course));
}

export async function toggleCourseStatus(courseId: string): Promise<Course | null> {
  if (!USE_MOCK) {
    const detail = await httpGet<Course>(`/api/v1/courses/${courseId}`);
    const next = detail.status === 'active' ? 'disabled' : 'active';
    const updated = await httpPut<Course>(`/api/v1/courses/${courseId}`, { status: next === 'active' ? 1 : 2 });
    return updated;
  }
  const mod = (await import('@/mock')).mockCourses as Course[];
  const idx = mod.findIndex(c => c.id === courseId);
  if (idx >= 0) {
    const next = mod[idx].status === 'active' ? 'disabled' : 'active';
    mod[idx] = { ...mod[idx], status: next, updatedAt: new Date().toISOString() };
    return Promise.resolve(structuredClone(mod[idx]));
  }
  return Promise.resolve(null);
}

export async function updateCourse(courseId: string, partial: Partial<Course>): Promise<Course | null> {
  if (!USE_MOCK) {
    const payload: any = { ...partial };
    if (payload.status) payload.status = payload.status === 'active' ? 1 : 2;
    const updated = await httpPut<Course>(`/api/v1/courses/${courseId}`, payload);
    return updated;
  }
  const mod = (await import('@/mock')).mockCourses as Course[];
  const idx = mod.findIndex(c => c.id === courseId);
  if (idx >= 0) {
    mod[idx] = { ...mod[idx], ...partial, updatedAt: new Date().toISOString() };
    return Promise.resolve(structuredClone(mod[idx]));
  }
  return Promise.resolve(null);
}

export async function deleteCourse(courseId: string): Promise<boolean> {
  if (!USE_MOCK) {
    await httpDelete(`/api/v1/courses/${courseId}`);
    return true;
  }
  const mod = (await import('@/mock')).mockCourses as Course[];
  const before = mod.length;
  const after = mod.filter(c => c.id !== courseId);
  mod.length = 0;
  mod.push(...after);
  return Promise.resolve(after.length < before);
}

// Schedules
export async function createSchedule(partial: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt' | 'occupied_seats' | 'status'>): Promise<Schedule> {
  if (!USE_MOCK) {
    const payload: any = { ...partial, status: 1 };
    const created = await httpPost<Schedule>(`/api/v1/schedules`, payload);
    return created;
  }
  const schedule: Schedule = {
    ...partial,
    id: genId('schedule'),
    occupied_seats: 0,
    status: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Schedule;
  const mod = (await import('@/mock')).mockSchedules as Schedule[];
  mod.push(schedule);
  return Promise.resolve(structuredClone(schedule));
}

export async function setScheduleStatus(scheduleId: string, status: Schedule['status']): Promise<Schedule | null> {
  if (!USE_MOCK) {
    const updated = await httpPut<Schedule>(`/api/v1/schedules/${scheduleId}/status`, { status });
    return updated;
  }
  const mod = (await import('@/mock')).mockSchedules as Schedule[];
  const idx = mod.findIndex(s => s.id === scheduleId);
  if (idx >= 0) {
    mod[idx] = { ...mod[idx], status, updatedAt: new Date().toISOString() };
    return Promise.resolve(structuredClone(mod[idx]));
  }
  return Promise.resolve(null);
}

export async function occupySeat(scheduleId: string, count = 1): Promise<Schedule | null> {
  if (!USE_MOCK) {
    const updated = await httpPost<Schedule>(`/api/v1/schedules/${scheduleId}/occupy-seat`, { count });
    return updated;
  }
  const mod = (await import('@/mock')).mockSchedules as Schedule[];
  const idx = mod.findIndex(s => s.id === scheduleId);
  if (idx >= 0) {
    const s = mod[idx];
    const occupied = Math.min(s.total_seats, s.occupied_seats + count);
    mod[idx] = { ...s, occupied_seats: occupied, updatedAt: new Date().toISOString() };
    return Promise.resolve(structuredClone(mod[idx]));
  }
  return Promise.resolve(null);
}

export async function releaseSeat(scheduleId: string, count = 1): Promise<Schedule | null> {
  if (!USE_MOCK) {
    const updated = await httpPost<Schedule>(`/api/v1/schedules/${scheduleId}/release-seat`, { count });
    return updated;
  }
  const mod = (await import('@/mock')).mockSchedules as Schedule[];
  const idx = mod.findIndex(s => s.id === scheduleId);
  if (idx >= 0) {
    const s = mod[idx];
    const occupied = Math.max(0, s.occupied_seats - count);
    mod[idx] = { ...s, occupied_seats: occupied, updatedAt: new Date().toISOString() };
    return Promise.resolve(structuredClone(mod[idx]));
  }
  return Promise.resolve(null);
}

export async function updateSchedule(scheduleId: string, partial: Partial<Schedule>): Promise<Schedule | null> {
  if (!USE_MOCK) {
    const updated = await httpPut<Schedule>(`/api/v1/schedules/${scheduleId}`, partial);
    return updated;
  }
  const mod = (await import('@/mock')).mockSchedules as Schedule[];
  const idx = mod.findIndex(s => s.id === scheduleId);
  if (idx >= 0) {
    mod[idx] = { ...mod[idx], ...partial, updatedAt: new Date().toISOString() };
    return Promise.resolve(structuredClone(mod[idx]));
  }
  return Promise.resolve(null);
}

export async function deleteSchedule(scheduleId: string): Promise<boolean> {
  if (!USE_MOCK) {
    await httpDelete(`/api/v1/schedules/${scheduleId}`);
    return true;
  }
  const mod = (await import('@/mock')).mockSchedules as Schedule[];
  const before = mod.length;
  const after = mod.filter(s => s.id !== scheduleId);
  mod.length = 0;
  mod.push(...after);
  return Promise.resolve(after.length < before);
}

// ------ Statistics & Batch Ops aligned with ADMIN_SYSTEM.md ------
export async function fetchCoursesStatisticsSummary() {
  if (USE_MOCK) {
    const list = structuredClone(mockCourses) as Course[];
    return Promise.resolve({
      total: list.length,
      active: list.filter(c => c.status === 'active').length,
      disabled: list.filter(c => c.status === 'disabled').length,
    });
  }
  return httpGet(`/api/v1/courses/statistics/summary`);
}

export async function coursesBatchActivate(ids: string[]): Promise<number> {
  if (!USE_MOCK) {
    const res = await httpPost<{ changed: number }>(`/api/v1/courses/batch/activate`, { ids });
    return (res as any).changed ?? ids.length;
  }
  const mod = (await import('@/mock')).mockCourses as Course[];
  let changed = 0;
  ids.forEach(id => {
    const idx = mod.findIndex(c => c.id === id);
    if (idx >= 0 && mod[idx].status !== 'active') {
      mod[idx] = { ...mod[idx], status: 'active', updatedAt: new Date().toISOString() };
      changed++;
    }
  });
  return Promise.resolve(changed);
}

export async function coursesBatchDisable(ids: string[]): Promise<number> {
  if (!USE_MOCK) {
    const res = await httpPost<{ changed: number }>(`/api/v1/courses/batch/disable`, { ids });
    return (res as any).changed ?? ids.length;
  }
  const mod = (await import('@/mock')).mockCourses as Course[];
  let changed = 0;
  ids.forEach(id => {
    const idx = mod.findIndex(c => c.id === id);
    if (idx >= 0 && mod[idx].status !== 'disabled') {
      mod[idx] = { ...mod[idx], status: 'disabled', updatedAt: new Date().toISOString() };
      changed++;
    }
  });
  return Promise.resolve(changed);
}

export async function fetchSchedulesStatisticsSummary() {
  if (USE_MOCK) {
    const list = structuredClone(mockSchedules) as Schedule[];
    return Promise.resolve({
      total: list.length,
      published: list.filter(s => s.status === 2).length,
      draft: list.filter(s => s.status === 1).length,
      cancelled: list.filter(s => s.status === 3).length,
    });
  }
  return httpGet(`/api/v1/schedules/statistics/summary`);
}

export async function schedulesBatchPublish(ids: string[]): Promise<number> {
  if (!USE_MOCK) {
    const res = await httpPost<{ changed: number }>(`/api/v1/schedules/batch/publish`, { ids });
    return (res as any).changed ?? ids.length;
  }
  const mod = (await import('@/mock')).mockSchedules as Schedule[];
  let changed = 0;
  ids.forEach(id => {
    const idx = mod.findIndex(s => s.id === id);
    if (idx >= 0 && mod[idx].status !== 2) {
      mod[idx] = { ...mod[idx], status: 2, updatedAt: new Date().toISOString() };
      changed++;
    }
  });
  return Promise.resolve(changed);
}

export async function schedulesBatchCancel(ids: string[]): Promise<number> {
  if (!USE_MOCK) {
    const res = await httpPost<{ changed: number }>(`/api/v1/schedules/batch/cancel`, { ids });
    return (res as any).changed ?? ids.length;
  }
  const mod = (await import('@/mock')).mockSchedules as Schedule[];
  let changed = 0;
  ids.forEach(id => {
    const idx = mod.findIndex(s => s.id === id);
    if (idx >= 0 && mod[idx].status !== 3) {
      mod[idx] = { ...mod[idx], status: 3, updatedAt: new Date().toISOString() };
      changed++;
    }
  });
  return Promise.resolve(changed);
}

export async function fetchCourseNamesList(): Promise<Array<{ id: string; name: string }>> {
  if (USE_MOCK) return Promise.resolve(mockCourses.map(c => ({ id: c.id, name: c.course_name })));
  const list = await httpGet<any[]>(`/api/v1/courses/names/list`);
  return list as Array<{ id: string; name: string }>;
}

// 便捷：根据课程ID查详情（用于安排详情抽屉展示关联课程摘要）
export async function getCourseById(courseId: string): Promise<Course | null> {
  if (USE_MOCK) {
    const mod = (await import('@/mock')).mockCourses as Course[];
    const found = mod.find(c => c.id === courseId) || null;
    return Promise.resolve(found ? structuredClone(found) : null);
  }
  return httpGet<Course>(`/api/v1/courses/${courseId}`);
}

// Exams (map schedules to simple exam list for UI-only page)
export async function fetchExams(): Promise<Exam[]> {
  if (USE_MOCK) {
    const { mockSchedules } = await import('@/mock');
    return (mockSchedules as any[]).map((s: any) => ({
      id: String(s.id),
      title: s.course_name,
      category: 'other',
      date: s.exam_date,
      location: s.exam_location,
      totalSeats: s.total_seats,
      occupiedSeats: s.occupied_seats,
      status: s.status === 2 ? 'upcoming' : s.status === 3 ? 'cancelled' : 'upcoming',
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    } as Exam));
  }
  const list = await httpGet<any[]>(`/api/v1/schedules`);
  return list.map((s: any) => ({
    id: String(s.id),
    title: s.course_name,
    category: 'other',
    date: s.exam_date,
    location: s.exam_location,
    totalSeats: s.total_seats,
    occupiedSeats: s.occupied_seats,
    status: s.status === 2 ? 'upcoming' : s.status === 3 ? 'cancelled' : 'upcoming',
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  } as Exam));
}

// Students extra endpoints per ADMIN_SYSTEM.md
export async function fetchPendingReviewStudents(): Promise<Student[]> {
  const mod = (await import('@/mock')).mockStudents as Student[];
  return Promise.resolve(structuredClone(mod.filter(s => s.status === 'pending')));
}

export async function fetchStudentsPaymentStatus() {
  const mod = (await import('@/mock')).mockStudents as Student[];
  const paid = mod.filter(s => s.paymentStatus === 'paid').length;
  const partial = mod.filter(s => s.paymentStatus === 'partial').length;
  const unpaid = mod.filter(s => s.paymentStatus === 'unpaid').length;
  return Promise.resolve({ paid, partial, unpaid });
}

export async function fetchReminderDueStudents(): Promise<Student[]> {
  // 简化：返回未缴或部分缴费的学员集合
  const mod = (await import('@/mock')).mockStudents as Student[];
  return Promise.resolve(structuredClone(mod.filter(s => s.paymentStatus !== 'paid')));
}

// Rewards
export async function fetchRewards(params?: { recruiter_id?: string; status?: string; page?: number; page_size?: number; start_date?: string; end_date?: string; }): Promise<Reward[]> {
  if (USE_MOCK) {
    const { mockRewards } = await import('@/mock');
    return structuredClone(mockRewards) as Reward[];
  }
  const sp = new URLSearchParams();
  if (params?.recruiter_id) sp.set('recruiter_id', params.recruiter_id);
  if (params?.status) sp.set('reward_status', params.status);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.page_size) sp.set('page_size', String(params.page_size));
  if (params?.start_date) sp.set('start_date', params.start_date);
  if (params?.end_date) sp.set('end_date', params.end_date);
  const res = await httpGet<{ items: any[] }>(`${API_V1}/students/rewards?${sp.toString()}`);
  return (res.items || []).map((r: any) => ({
    id: String(r.id),
    userId: String(r.recruiter_user_id || ''),
    userName: r.recruiter_name || '-',
    type: 'recruitment',
    amount: Number(r.reward_amount || 0),
    reason: r.application_reason || '',
    status: r.reward_status === 3 ? 'approved' : r.reward_status === 4 ? 'rejected' : 'pending',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  } as Reward));
}
export async function createReward(partial: Omit<Reward, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reward> {
  const reward: Reward = {
    ...partial,
    id: genId('reward'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Reward;
  const mod = (await import('@/mock')).mockRewards as Reward[];
  mod.push(reward);
  return Promise.resolve(structuredClone(reward));
}

export async function updateRewardStatus(rewardId: string, status: Reward['status']): Promise<Reward | null> {
  if (!USE_MOCK) {
    // 后端奖励状态通过审批流程改变，这里调用更新接口作为占位
    const updated = await httpPut<any>(`${API_V1}/students/rewards/${rewardId}`, { reward_status: status === 'approved' ? 3 : status === 'rejected' ? 4 : 2 });
    return {
      id: String(updated.id),
      userId: String(updated.recruiter_user_id || ''),
      userName: updated.recruiter_name || '-',
      type: 'recruitment',
      amount: Number(updated.reward_amount || 0),
      reason: updated.application_reason || '',
      status: updated.reward_status === 3 ? 'approved' : updated.reward_status === 4 ? 'rejected' : 'pending',
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    } as Reward;
  }
  const mod = (await import('@/mock')).mockRewards as Reward[];
  const idx = mod.findIndex(r => r.id === rewardId);
  if (idx >= 0) {
    mod[idx] = { ...mod[idx], status, updatedAt: new Date().toISOString() };
    return Promise.resolve(structuredClone(mod[idx]));
  }
  return Promise.resolve(null);
}

export async function deleteReward(rewardId: string): Promise<boolean> {
  if (!USE_MOCK) {
    await httpDelete(`${API_V1}/rewards/students/${rewardId}`);
    return true;
  }
  const mod = (await import('@/mock')).mockRewards as Reward[];
  const before = mod.length;
  const after = mod.filter(r => r.id !== rewardId);
  mod.length = 0;
  mod.push(...after);
  return Promise.resolve(after.length < before);
}

export async function updateReward(rewardId: string, partial: Partial<Reward>): Promise<Reward | null> {
  if (!USE_MOCK) {
    const payload: any = {};
    if (partial.amount != null) payload.reward_amount = Number(partial.amount);
    if (partial.reason != null) payload.application_reason = String(partial.reason);
    const updated = await httpPut<any>(`${API_V1}/students/rewards/${rewardId}`, payload);
    return {
      id: String(updated.id),
      userId: String(updated.recruiter_user_id || ''),
      userName: updated.recruiter_name || '-',
      type: 'recruitment',
      amount: Number(updated.reward_amount || 0),
      reason: updated.application_reason || '',
      status: updated.reward_status === 3 ? 'approved' : updated.reward_status === 4 ? 'rejected' : 'pending',
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    } as Reward;
  }
  const mod = (await import('@/mock')).mockRewards as Reward[];
  const idx = mod.findIndex(r => r.id === rewardId);
  if (idx >= 0) {
    mod[idx] = { ...mod[idx], ...partial, updatedAt: new Date().toISOString() };
    return Promise.resolve(structuredClone(mod[idx]));
  }
  return Promise.resolve(null);
}

// Approvals - Rewards unified queue
export async function fetchRewardApprovalsUnified() {
  // 单队列：开发走 mock，生产走真实 API（后端返回统一列表）
  if (USE_MOCK) {
    const mod = (await import('@/mock')).mockRewards as Reward[];
    const pending = mod.filter(r => r.status === 'pending');
    const items = pending.map((r, idx) => ({
      id: r.id,
      reward_student_id: r.id, // mock占位
      applicant_id: r.userId,
      reward_amount: r.amount,
      application_time: r.createdAt,
      step: idx % 2 === 0 ? 'exam' : 'gm',
      status: 1, // 1 待审 对齐后端
      // 兼容额外展示（仅前端使用，不属于后端返回规范）
      _applicant_name: r.userName,
      _reason: r.reason,
    }));
    return Promise.resolve({ items, total: items.length, page: 1, page_size: items.length, pages: 1 });
  }
  // 真实接口：后端返回统一队列（建议路径：/rewards/applications-unified）
  return httpGet<{ items: any[]; total: number; page: number; page_size: number; pages: number }>(
    `${API_V1}/rewards/applications-unified`
  );
}

export async function auditRewardApplication(applicationId: string | number, step: 'exam' | 'gm', approve: boolean, reason?: string) {
  if (USE_MOCK) return { success: true } as any;
  const path = step === 'gm' ? `${API_V1}/rewards/applications/${applicationId}/audit-gm` : `${API_V1}/rewards/applications/${applicationId}/audit-exam`;
  return httpPost(path, { approve, audit_reason: reason || '' });
}


