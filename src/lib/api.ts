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
  mockPayrolls,
  mockFinanceReport,
} from '@/mock';
import type { Course, Schedule, NotificationItem, NotificationTemplate, RuleConfig, UpgradeConditions, ReminderPlan, ExportRecord, PayrollRecord, FinanceReportSummary, User, Student, Reward } from '@/types';

export async function fetchCourses(): Promise<Course[]> {
  return Promise.resolve(structuredClone(mockCourses));
}

export async function fetchSchedules(): Promise<Schedule[]> {
  return Promise.resolve(structuredClone(mockSchedules));
}

export async function fetchPendingRegistrations() {
  return Promise.resolve(structuredClone(mockUsers.filter(u => u.status === 'pending')));
}

export async function fetchUpgradeApplications() {
  return Promise.resolve(structuredClone(mockUpgradeApplications));
}

// 通知中心
export async function fetchNotifications(): Promise<NotificationItem[]> {
  return Promise.resolve(structuredClone(mockNotifications));
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
  return Promise.resolve(structuredClone(mockExportRecords));
}

// 财务
export async function fetchPayrolls(): Promise<PayrollRecord[]> {
  return Promise.resolve(structuredClone(mockPayrolls));
}

export async function fetchFinanceReport(): Promise<FinanceReportSummary> {
  return Promise.resolve(structuredClone(mockFinanceReport));
}

// ============ Mutations (Mock) ============
// 简单ID生成
function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Users
export async function createUser(partial: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
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
  const mod = (await import('@/mock')).mockUsers;
  const idx = mod.findIndex((u: User) => u.id === userId);
  if (idx >= 0) {
    mod[idx] = { ...mod[idx], status, updatedAt: new Date().toISOString() };
    return Promise.resolve(structuredClone(mod[idx]));
  }
  return Promise.resolve(null);
}

export async function deleteUser(userId: string): Promise<boolean> {
  const mod = (await import('@/mock')).mockUsers;
  const len = mod.length;
  const after = mod.filter((u: User) => u.id !== userId);
  // mutate
  mod.length = 0;
  mod.push(...after);
  return Promise.resolve(after.length < len);
}

// Students
export async function createStudent(partial: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<Student> {
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
  const mod = (await import('@/mock')).mockStudents as Student[];
  const idx = mod.findIndex((s) => s.id === studentId);
  if (idx >= 0) {
    mod[idx] = { ...mod[idx], status, updatedAt: new Date().toISOString() };
    return Promise.resolve(structuredClone(mod[idx]));
  }
  return Promise.resolve(null);
}

export async function addStudentPayment(studentId: string, addAmount: number): Promise<Student | null> {
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
  const mod = (await import('@/mock')).mockStudents as Student[];
  const idx = mod.findIndex((s) => s.id === studentId);
  if (idx >= 0) {
    mod[idx] = { ...mod[idx], ...partial, updatedAt: new Date().toISOString() };
    return Promise.resolve(structuredClone(mod[idx]));
  }
  return Promise.resolve(null);
}

export async function deleteStudent(studentId: string): Promise<boolean> {
  const mod = (await import('@/mock')).mockStudents as Student[];
  const before = mod.length;
  const after = mod.filter(s => s.id !== studentId);
  mod.length = 0;
  mod.push(...after);
  return Promise.resolve(after.length < before);
}

// Courses
export async function createCourse(partial: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course> {
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
  const mod = (await import('@/mock')).mockCourses as Course[];
  const idx = mod.findIndex(c => c.id === courseId);
  if (idx >= 0) {
    mod[idx] = { ...mod[idx], ...partial, updatedAt: new Date().toISOString() };
    return Promise.resolve(structuredClone(mod[idx]));
  }
  return Promise.resolve(null);
}

export async function deleteCourse(courseId: string): Promise<boolean> {
  const mod = (await import('@/mock')).mockCourses as Course[];
  const before = mod.length;
  const after = mod.filter(c => c.id !== courseId);
  mod.length = 0;
  mod.push(...after);
  return Promise.resolve(after.length < before);
}

// Schedules
export async function createSchedule(partial: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt' | 'occupied_seats' | 'status'>): Promise<Schedule> {
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
  const mod = (await import('@/mock')).mockSchedules as Schedule[];
  const idx = mod.findIndex(s => s.id === scheduleId);
  if (idx >= 0) {
    mod[idx] = { ...mod[idx], status, updatedAt: new Date().toISOString() };
    return Promise.resolve(structuredClone(mod[idx]));
  }
  return Promise.resolve(null);
}

export async function occupySeat(scheduleId: string, count = 1): Promise<Schedule | null> {
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
  const mod = (await import('@/mock')).mockSchedules as Schedule[];
  const idx = mod.findIndex(s => s.id === scheduleId);
  if (idx >= 0) {
    mod[idx] = { ...mod[idx], ...partial, updatedAt: new Date().toISOString() };
    return Promise.resolve(structuredClone(mod[idx]));
  }
  return Promise.resolve(null);
}

// ------ Statistics & Batch Ops aligned with ADMIN_SYSTEM.md ------
export async function fetchCoursesStatisticsSummary() {
  const list = structuredClone(mockCourses) as Course[];
  return Promise.resolve({
    total: list.length,
    active: list.filter(c => c.status === 'active').length,
    disabled: list.filter(c => c.status === 'disabled').length,
  });
}

export async function coursesBatchActivate(ids: string[]): Promise<number> {
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
  const list = structuredClone(mockSchedules) as Schedule[];
  return Promise.resolve({
    total: list.length,
    published: list.filter(s => s.status === 2).length,
    draft: list.filter(s => s.status === 1).length,
    cancelled: list.filter(s => s.status === 3).length,
  });
}

export async function schedulesBatchPublish(ids: string[]): Promise<number> {
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
  return Promise.resolve(mockCourses.map(c => ({ id: c.id, name: c.course_name })));
}

// 便捷：根据课程ID查详情（用于安排详情抽屉展示关联课程摘要）
export async function getCourseById(courseId: string): Promise<Course | null> {
  const mod = (await import('@/mock')).mockCourses as Course[];
  const found = mod.find(c => c.id === courseId) || null;
  return Promise.resolve(found ? structuredClone(found) : null);
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
  const mod = (await import('@/mock')).mockRewards as Reward[];
  const idx = mod.findIndex(r => r.id === rewardId);
  if (idx >= 0) {
    mod[idx] = { ...mod[idx], status, updatedAt: new Date().toISOString() };
    return Promise.resolve(structuredClone(mod[idx]));
  }
  return Promise.resolve(null);
}

export async function deleteReward(rewardId: string): Promise<boolean> {
  const mod = (await import('@/mock')).mockRewards as Reward[];
  const before = mod.length;
  const after = mod.filter(r => r.id !== rewardId);
  mod.length = 0;
  mod.push(...after);
  return Promise.resolve(after.length < before);
}

export async function updateReward(rewardId: string, partial: Partial<Reward>): Promise<Reward | null> {
  const mod = (await import('@/mock')).mockRewards as Reward[];
  const idx = mod.findIndex(r => r.id === rewardId);
  if (idx >= 0) {
    mod[idx] = { ...mod[idx], ...partial, updatedAt: new Date().toISOString() };
    return Promise.resolve(structuredClone(mod[idx]));
  }
  return Promise.resolve(null);
}


