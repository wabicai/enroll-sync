import { getCurrentMode, API_CONFIG } from '@/hooks/useApi';
import { getAuthState } from '@/lib/auth';
import type {
  Student,
  Exam,
  Reward,
  User,
  Course,
  Schedule,
  Assessment,
  ExportRecord,
  NotificationItem,
  DashboardStats,
  ChartData
} from '@/types';

// 审批相关类型定义，匹配后端响应
interface ApprovalInstance {
  id: number;
  target_type: string;
  target_id: string;
  status: number;
  current_step_index: number;
  workflow_config?: any;
  metadata?: any;
  created_by?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

interface ApprovalStep {
  id: number;
  instance_id: number;
  step_key: string;
  step_name: string;
  step_order: number;
  status: number;
  approver_roles?: number[];
  approver_user_id?: number;
  approver_name?: string;
  is_required: boolean;
  can_skip: boolean;
  processed_at?: string;
  reason?: string;
}

interface Approval {
  instance: ApprovalInstance;
  steps: ApprovalStep[];
  user_details?: any;
  reward_details?: any;
  student_details?: any;
  role_upgrade_details?: any;
  approval_progress?: any;
  auditor_info?: any;
}

// API路径前缀配置
const API_PREFIX = '/api/v1';

// 标准化API路径函数
const normalizeApiPath = (path: string): string => {
  // 如果路径已经包含 /api/v1，直接返回
  if (path.startsWith('/api/v1')) {
    return path;
  }

  // 如果路径以 / 开头，添加前缀
  if (path.startsWith('/')) {
    return `${API_PREFIX}${path}`;
  }

  // 否则添加前缀和 /
  return `${API_PREFIX}/${path}`;
};

/**
 * 智能路径处理：自动添加 /api/v1 前缀
 * 支持多种调用方式：
 * - '/students' -> '/api/v1/students'
 * - 'students' -> '/api/v1/students'
 * - '/api/v1/students' -> '/api/v1/students' (不重复添加)
 */
const smartPath = (path: string): string => {
  return normalizeApiPath(path);
};

// 获取认证token
const getAuthToken = () => {
  try {
    const authState = getAuthState();
    const token = authState?.accessToken;
    if (token) {
      console.log('✅ 成功获取token:', token.substring(0, 10) + '...');
      return token;
    } else {
      console.warn('⚠️ 未找到accessToken，请确保已登录');
    }
  } catch (error) {
    console.error('❌ 获取token失败:', error);
  }
  return null;
};

// 获取API基础URL
const getApiBaseUrl = () => {
  const mode = getCurrentMode();
  if (mode === 'mock') return null;
  return mode === 'local' ? API_CONFIG.LOCAL : API_CONFIG.PRODUCTION;
};

// Token刷新状态管理
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// 刷新token的函数
const refreshAuthToken = async (): Promise<string> => {
  try {
    // 从store获取refresh token
    const authState = getAuthState();
    if (!authState) {
      throw new Error('未找到认证信息');
    }

    const refreshToken = authState.refreshToken;

    if (!refreshToken) {
      throw new Error('未找到refresh token');
    }

    console.log('🔄 开始刷新token...');

    // 调用后端刷新接口
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token刷新失败');
    }

    const result = await response.json();
    const newAccessToken = result.access_token;
    const newRefreshToken = result.refresh_token;

    if (!newAccessToken) {
      throw new Error('刷新响应中缺少access token');
    }

    // 更新localStorage中的token
    const storeData = localStorage.getItem('app-store');
    if (storeData) {
      const parsed = JSON.parse(storeData);
      const updatedStore = {
        ...parsed,
        state: {
          ...parsed.state,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken || refreshToken, // 如果没有新的refresh token，保持原有的
        }
      };
      localStorage.setItem('app-store', JSON.stringify(updatedStore));
    }

    console.log('✅ Token刷新成功');
    return newAccessToken;

  } catch (error) {
    console.error('❌ Token刷新失败:', error);

    // 刷新失败，清理认证状态
    const storeData = localStorage.getItem('app-store');
    if (storeData) {
      const parsed = JSON.parse(storeData);
      const clearedStore = {
        ...parsed,
        state: {
          ...parsed.state,
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        }
      };
      localStorage.setItem('app-store', JSON.stringify(clearedStore));
    }

    // 重定向到登录页面
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }

    throw error;
  }
};

// 通用API请求函数（增强版，支持自动token刷新）
export const apiRequest = async (endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<any> => {
  const mode = getCurrentMode();

  // Mock模式处理
  if (mode === 'mock') {
    // 返回mock数据
    return { success: true, data: [], message: 'Mock data' };
  }

  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error('无法获取API地址');
  }

  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 统一标准化API路径
  const normalizedEndpoint = normalizeApiPath(endpoint);
  const requestId = Math.random().toString(36).substr(2, 9);

  // 添加Authorization header（如果有token）
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log(`🔐 [${requestId}] API请求携带token:`, normalizedEndpoint);
  } else {
    console.warn(`⚠️ [${requestId}] API请求未携带token:`, normalizedEndpoint);
  }

  try {
    const response = await fetch(`${baseUrl}${normalizedEndpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // 处理401错误 - token过期或无效
      if (response.status === 401 && retryCount === 0) {
        console.warn(`⚠️ [${requestId}] 401 Unauthorized - 尝试刷新token`);

        // 避免并发刷新
        if (isRefreshing) {
          // 如果正在刷新，等待刷新完成
          if (refreshPromise) {
            try {
              await refreshPromise;
              // 刷新完成后重试请求
              return apiRequest(endpoint, options, retryCount + 1);
            } catch (refreshError) {
              throw new Error('认证失败，请重新登录');
            }
          }
        } else {
          // 开始刷新token
          isRefreshing = true;
          refreshPromise = refreshAuthToken();

          try {
            await refreshPromise;
            // 刷新成功，重试原请求
            return apiRequest(endpoint, options, retryCount + 1);
          } catch (refreshError) {
            throw new Error('认证失败，请重新登录');
          } finally {
            isRefreshing = false;
            refreshPromise = null;
          }
        }
      }

      // 处理403错误 - 权限不足
      if (response.status === 403) {
        console.error(`❌ [${requestId}] 403 Forbidden - 权限不足`);
        throw new Error('权限不足，无法访问该资源');
      }

      // 其他错误
      console.error(`❌ [${requestId}] 请求失败:`, response.status, errorData);
      throw new Error(errorData.detail || errorData.message || `请求失败: ${response.status}`);
    }

    console.log(`✅ [${requestId}] API请求成功:`, normalizedEndpoint, response.status);
    return await response.json();

  } catch (error) {
    // 网络错误或其他异常
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error(`❌ [${requestId}] 网络错误:`, error);
      throw new Error('网络连接失败，请检查网络设置');
    }

    // 重新抛出其他错误
    throw error;
  }
};

// 认证相关
export const login = async (credentials: { email: string; password: string }) => {
  return await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

export const register = async (userData: { name: string; email: string; password: string }) => {
  return await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const logout = async () => {
  return await apiRequest('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
};

export const loginAdmin = async (username: string, password: string) => {
  return await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
};

// 学员管理
export const fetchStudents = async (): Promise<Student[]> => {
  const result = await apiRequest('/students');

  // 转换后端ExamStudent数据结构到前端期望的格式
  const items = result.items || [];
  return items.map((item: any) => ({
    id: item.id.toString(),
    student_number: item.student_number || '',
    name: item.name,
    phone: item.phone,
    gender: item.gender || 1,
    education: item.education || '',
    major: item.major,
    work_unit: item.work_unit,
    job_position: item.job_position,
    work_years: item.work_years,
    employment_intention: item.employment_intention,
    notes: item.notes,
    status: item.status || 1,
    created_by: item.created_by || 0,
    last_modified_by: item.last_modified_by,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }));
};

export const createStudent = async (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<Student> => {
  const result = await apiRequest('/students', {
    method: 'POST',
    body: JSON.stringify(student),
  });
  return result.data;
};

export const updateStudent = async (id: string, student: Partial<Student>): Promise<Student> => {
  const result = await apiRequest(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(student),
  });
  return result.data;
};

export const setStudentStatus = async (id: string, status: Student['status']): Promise<Student> => {
  const result = await apiRequest(`/students/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  return result.data;
};

export const deleteStudent = async (id: string): Promise<void> => {
  await apiRequest(`/students/${id}`, {
    method: 'DELETE',
  });
};

// 标记学员为已全额付款
export const markStudentAsPaid = async (studentId: string): Promise<void> => {
  await apiRequest(`/students/${studentId}/mark-as-paid`, {
    method: 'POST',
  });
};

// 考试管理
export const fetchExams = async (): Promise<Exam[]> => {
  const result = await apiRequest('/exams');
  return result.items || result.data || [];
};

export const createExam = async (exam: Omit<Exam, 'id' | 'createdAt' | 'updatedAt'>): Promise<Exam> => {
  const result = await apiRequest('/exams', {
    method: 'POST',
    body: JSON.stringify(exam),
  });
  return result.data;
};

export const updateExam = async (id: string, exam: Partial<Exam>): Promise<Exam> => {
  const result = await apiRequest(`/exams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(exam),
  });
  return result.data;
};

export const deleteExam = async (id: string): Promise<void> => {
  await apiRequest(`/exams/${id}`, {
    method: 'DELETE',
  });
};

// 奖励管理
export const fetchRewards = async (): Promise<Reward[]> => {
  const result = await apiRequest('/api/v1/rewards/students');
  const rawData = result.items || result.data || [];



  // 转换后端数据结构到前端期望的格式
  return rawData.map((item: any, index: number) => ({
    id: item.student_enrollment_id?.toString() || `reward_${index}`,
    userId: item.recruiter_user_id?.toString() || '',
    userName: item.recruiter_name || item.student_name || item.user_name || item.name || `用户${item.id || item.recruiter_user_id}`,
    type: 'recruitment' as const, // 根据数据推断这是招生奖励
    amount: item.paid_amount || item.total_fee || 0,
    reason: `学生报名奖励 - 总费用: ¥${item.total_fee || 0}`,
    status: item.payment_type === 1 ? 'paid' : 'pending' as const,
    createdAt: item.created_at || new Date().toISOString(),
    updatedAt: item.updated_at || new Date().toISOString(),
  }));
};

export const createReward = async (reward: any): Promise<Reward> => {
  const result = await apiRequest('/api/v1/rewards/students', {
    method: 'POST',
    body: JSON.stringify(reward),
  });
  return result.data;
};

export const updateReward = async (id: string, reward: Partial<Reward>): Promise<Reward> => {
  const result = await apiRequest(`/api/v1/rewards/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(reward),
  });
  return result.data;
};

export const deleteReward = async (id: string): Promise<void> => {
  await apiRequest(`/api/v1/rewards/students/${id}`, {
    method: 'DELETE',
  });
};

export const applyReward = async (rewardId: string, applicationData: any): Promise<Reward> => {
  const result = await apiRequest(`/api/v1/rewards/students/${rewardId}/apply`, {
    method: 'POST',
    body: JSON.stringify(applicationData),
  });
  return result.data;
};

// 状态枚举映射
const statusMap = {
  1: 'active',    // 激活
  2: 'pending',   // 待审核
  3: 'inactive',  // 已拒绝
  4: 'inactive',  // 已禁用
} as const;

// 用户管理
export const fetchUsers = async (): Promise<User[]> => {
  const result = await apiRequest('/users');
  const items = result.items || result.data || [];

  // 转换后端数据格式以匹配前端期望
  return items.map((item: any) => ({
    ...item,
    // 转换状态字段
    status: statusMap[item.status] || 'inactive',
    // 转换创建时间字段名，确保日期格式正确
    createdAt: item.created_at ? new Date(item.created_at).toISOString() : undefined,
    updatedAt: item.updated_at ? new Date(item.updated_at).toISOString() : undefined,
    // 确保其他字段正确映射
    real_name: item.real_name,
    avatar: item.avatar_url,
    // 保持原始字段以备用
    name: item.real_name || item.username,
    email: item.email || `${item.username}@example.com`, // 临时邮箱，如果后端没有邮箱字段
  }));
};

export const createUser = async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
  const result = await apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });
  return result.data;
};

export const updateUser = async (id: string, user: Partial<User>): Promise<User> => {
  const result = await apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  });
  return result.data;
};

export const updateUserStatus = async (id: string, status: User['status']): Promise<User> => {
  const result = await apiRequest(`/users/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  return result.data;
};

// 频道管理
export const fetchChannelTags = async (): Promise<any[]> => {
  const result = await apiRequest('/channels/tags');
  return result.items || result.data || [];
};

export const createChannelTag = async (tag: { tag_name: string }): Promise<any> => {
  const result = await apiRequest('/channels/tags', {
    method: 'POST',
    body: JSON.stringify(tag),
  });
  return result.data;
};

export const updateChannelTag = async (id: number, tag: { tag_name?: string }): Promise<any> => {
  const result = await apiRequest(`/channels/tags/${id}`, {
    method: 'PUT',
    body: JSON.stringify(tag),
  });
  return result.data;
};

export const deleteChannelTag = async (id: number): Promise<void> => {
  await apiRequest(`/channels/tags/${id}`, {
    method: 'DELETE',
  });
};

export const fetchChannelStats = async (): Promise<any[]> => {
  const result = await apiRequest('/channels/stats');
  return result.data || [];
};


export const deleteUser = async (id: string): Promise<void> => {
  await apiRequest(`/users/${id}`, {
    method: 'DELETE',
  });
};

// 审批管理
export const fetchApprovals = async (
  page: number = 1,
  pageSize: number = 20,
  targetType?: string,
  status?: number
): Promise<{items: Approval[], total: number, pages: number}> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  if (targetType) {
    params.append('target_type', targetType);
  }

  if (status !== undefined) {
    params.append('status', status.toString());
  }

  const result = await apiRequest(`/approvals/all?${params.toString()}`);
  return {
    items: result.items || [],
    total: result.total || 0,
    pages: result.pages || 0
  };
};

export const fetchApprovalsPending = async (
  page: number = 1,
  pageSize: number = 20,
  targetType?: string
): Promise<{items: Approval[], total: number, pages: number}> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  if (targetType) {
    params.append('target_type', targetType);
  }

  const result = await apiRequest(`/approvals/pending?${params.toString()}`);
  return {
    items: result.items || [],
    total: result.total || 0,
    pages: result.pages || 0
  };
};

export const updateApprovalStatus = async (id: string, status: Approval['status'], comment?: string): Promise<Approval> => {
  const result = await apiRequest(`/approvals/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status, comment }),
  });
  return result.data;
};

export const decideApprovalStep = async (id: string, stepKey: string, approved: boolean, comment?: string): Promise<Approval> => {
  const result = await apiRequest(`/approvals/${id}/steps/${stepKey}/decision`, {
    method: 'POST',
    body: JSON.stringify({ approve: approved, reason: comment }),
  });
  return result.data;
};

// 通知管理
export const fetchNotifications = async (page: number = 1, pageSize: number = 10): Promise<{items: NotificationItem[], total: number, page: number, page_size: number}> => {
  const result = await apiRequest(`/notifications/?page=${page}&page_size=${pageSize}`);
  return result;
};

export const fetchRecentNotifications = async (limit: number = 5, since?: string, unreadOnly: boolean = false): Promise<{items: NotificationItem[]}> => {
  let url = `/notifications/recent?limit=${limit}`;
  if (since) {
    url += `&since=${encodeURIComponent(since)}`;
  }
  if (unreadOnly) {
    url += `&unread_only=true`;
  }
  const result = await apiRequest(url);
  return result;
};

export const fetchUnreadNotificationCount = async (): Promise<{count: number}> => {
  const result = await apiRequest('/notifications/unread-count');
  return result;
};

export const markNotificationAsRead = async (id: number): Promise<void> => {
  await apiRequest(`/notifications/${id}/read`, {
    method: 'PUT',
  });
};



export const markAllNotificationsAsRead = async (): Promise<void> => {
  await apiRequest('/notifications/mark-read', {
    method: 'PUT',
    body: JSON.stringify({ notification_ids: null }),
  });
};

export const deleteNotification = async (id: number): Promise<void> => {
  await apiRequest(`/notifications/${id}`, {
    method: 'DELETE',
  });
};

// 课程管理
export const fetchCourses = async (): Promise<Course[]> => {
  const result = await apiRequest('/courses');

  // 后端直接返回 {items: [...]} 结构
  const courses = result.items || result.data?.items || result.data || [];

  // 转换字段名以匹配前端类型定义
  return courses.map((course: any) => ({
    ...course,
    createdAt: course.created_at || course.createdAt,
    updatedAt: course.updated_at || course.updatedAt,
  }));
};

export const createCourse = async (course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course> => {
  const result = await apiRequest('/courses', {
    method: 'POST',
    body: JSON.stringify(course),
  });
  return result.data;
};

export const updateCourse = async (id: string, course: Partial<Course>): Promise<Course> => {
  const result = await apiRequest(`/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(course),
  });
  // 后端直接返回课程对象，不需要访问 .data 属性
  return result;
};

export const deleteCourse = async (id: string): Promise<void> => {
  await apiRequest(`/courses/${id}`, {
    method: 'DELETE',
  });
};

export const toggleCourseStatus = async (id: string, status: boolean) => {
  // 根据后端API，状态更新通过PUT /courses/{id}实现，状态值：1=启用，2=禁用
  const statusValue = status ? 1 : 2;
  const result = await apiRequest(`/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: statusValue }),
  });
  return result.data;
};

export const fetchCoursesStatisticsSummary = async () => {
  const result = await apiRequest('/courses/statistics/summary');
  return result.data;
};

// 排程管理 - 修复为正确的 /exams/schedules 路径
export const fetchSchedules = async (): Promise<Schedule[]> => {
  const result = await apiRequest('/exams/schedules');
  const schedules = result.items || result.data || [];

  // 转换后端字段名到前端期望的字段名
  return schedules.map((schedule: any) => ({
    ...schedule,
    createdAt: schedule.created_at || schedule.createdAt || new Date().toISOString(),
    updatedAt: schedule.updated_at || schedule.updatedAt || new Date().toISOString(),
  }));
};

export const createSchedule = async (schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Schedule> => {
  const result = await apiRequest('/exams/schedules', {
    method: 'POST',
    body: JSON.stringify(schedule),
  });
  const data = result.data;

  // 转换后端字段名到前端期望的字段名
  return {
    ...data,
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
  };
};

export const updateSchedule = async (id: string, schedule: Partial<Schedule>): Promise<Schedule> => {
  const result = await apiRequest(`/exams/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(schedule),
  });
  const data = result.data;

  // 转换后端字段名到前端期望的字段名
  return {
    ...data,
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
  };
};

export const deleteSchedule = async (id: string): Promise<void> => {
  await apiRequest(`/exams/schedules/${id}`, {
    method: 'DELETE',
  });
};

export const setScheduleStatus = async (id: string, status: string) => {
  const result = await apiRequest(`/exams/schedules/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  return result.data;
};

// 考位管理 - 修复路径和参数结构
export const occupySeat = async (scheduleId: string, count?: number, reason?: string) => {
  const body = count ? { count, reason } : {};
  const result = await apiRequest(`/exams/schedules/${scheduleId}/occupy-seat`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = result.data;

  // 转换后端字段名到前端期望的字段名
  return {
    ...data,
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
  };
};

export const releaseSeat = async (scheduleId: string, count?: number, reason?: string) => {
  const body = count ? { count, reason } : {};
  const result = await apiRequest(`/exams/schedules/${scheduleId}/release-seat`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = result.data;

  // 转换后端字段名到前端期望的字段名
  return {
    ...data,
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
  };
};

// 课程名称列表 - 添加 active_only 查询参数
export const fetchCourseNamesList = async () => {
  const result = await apiRequest('/courses/names?active_only=true');
  return result.data || [];
};

// 考核管理
export const fetchAssessments = async (): Promise<Assessment[]> => {
  const result = await apiRequest('/assessments');
  return result.data || [];
};

export const createAssessment = async (assessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Assessment> => {
  const result = await apiRequest('/assessments', {
    method: 'POST',
    body: JSON.stringify(assessment),
  });
  return result.data;
};

export const updateAssessment = async (id: string, assessment: Partial<Assessment>): Promise<Assessment> => {
  const result = await apiRequest(`/assessments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(assessment),
  });
  return result.data;
};

export const deleteAssessment = async (id: string): Promise<void> => {
  await apiRequest(`/assessments/${id}`, {
    method: 'DELETE',
  });
};

export const fetchAssessmentsMonthly = async (params: { period: string; identity?: string; page?: number; page_size?: number }) => {
  const queryParams = new URLSearchParams();
  // period 是必需参数
  queryParams.append('period', params.period);

  if (params.identity) {
    queryParams.append('identity', params.identity);
  }
  if (params.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params.page_size) {
    queryParams.append('page_size', params.page_size.toString());
  }

  const url = `/assessments/monthly?${queryParams.toString()}`;
  const result = await apiRequest(url);
  return result;
};

export const calculateAssessments = async (period: string) => {
  // period 是必需参数
  const body = { period };
  const result = await apiRequest('/assessments/calculate', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return result;
};

export const fetchAssessmentWarnings = async (period: string, identity?: string) => {
  const queryParams = new URLSearchParams();
  // period 是必需参数
  queryParams.append('period', period);

  if (identity) {
    queryParams.append('identity', identity);
  }

  const url = `/assessments/warnings?${queryParams.toString()}`;
  const result = await apiRequest(url);
  return result;
};

// 考核配置管理接口
export const fetchAssessmentConfigs = async (params?: {
  page?: number;
  page_size?: number;
  user_id?: number;
  personal_enabled_only?: boolean;
  team_enabled_only?: boolean;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.page_size) {
    queryParams.append('page_size', params.page_size.toString());
  }
  if (params?.user_id) {
    queryParams.append('user_id', params.user_id.toString());
  }
  if (params?.personal_enabled_only) {
    queryParams.append('personal_enabled_only', 'true');
  }
  if (params?.team_enabled_only) {
    queryParams.append('team_enabled_only', 'true');
  }

  const url = `/assessments/configs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const result = await apiRequest(url);
  return result;
};

export const createAssessmentConfig = async (config: {
  user_id: number;
  is_personal_enabled: boolean;
  is_team_enabled: boolean;
  personal_target_students?: number;
  personal_target_revenue?: number;
  team_target_students?: number;
  team_target_revenue?: number;
}) => {
  const result = await apiRequest('/assessments/configs', {
    method: 'POST',
    body: JSON.stringify(config),
  });
  return result;
};

export const updateAssessmentConfig = async (userId: number, config: {
  is_personal_enabled?: boolean;
  is_team_enabled?: boolean;
  personal_target_students?: number;
  personal_target_revenue?: number;
  team_target_students?: number;
  team_target_revenue?: number;
}) => {
  const result = await apiRequest(`/assessments/configs/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(config),
  });
  return result;
};

export const deleteAssessmentConfig = async (userId: number) => {
  const result = await apiRequest(`/assessments/configs/${userId}`, {
    method: 'DELETE',
  });
  return result;
};

// 设置相关
export const fetchRuleConfig = async () => {
  const result = await apiRequest('/settings/rules');
  return result.data;
};

export const fetchUpgradeConditions = async () => {
  const result = await apiRequest('/settings/upgrade-conditions');
  return result.data;
};

export const fetchReminderPlans = async () => {
  const result = await apiRequest('/settings/reminder-plans');
  return result.data;
};

// 通知模板
export const fetchNotificationTemplates = async () => {
  const result = await apiRequest('/notifications/templates');
  return result.data;
};

// 导出记录
export const fetchExportRecords = async (): Promise<ExportRecord[]> => {
  const result = await apiRequest('/export-records');
  return result.data || [];
};

// ==================== 便捷的API调用方法 ====================

/**
 * 统一的API调用方法，所有业务代码都应该使用这些方法
 * 而不是直接使用fetch，确保经过拦截器处理
 *
 * 支持智能路径处理，自动添加 /api/v1 前缀：
 * - api.get('students') -> GET /api/v1/students
 * - api.get('/students') -> GET /api/v1/students
 * - api.get('/api/v1/students') -> GET /api/v1/students (不重复添加)
 */
export const api = {
  // GET请求
  get: async (endpoint: string, options?: RequestInit) => {
    return apiRequest(smartPath(endpoint), { method: 'GET', ...options });
  },

  // POST请求
  post: async (endpoint: string, data?: any, options?: RequestInit) => {
    return apiRequest(smartPath(endpoint), {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  },

  // PUT请求
  put: async (endpoint: string, data?: any, options?: RequestInit) => {
    return apiRequest(smartPath(endpoint), {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  },

  // DELETE请求
  delete: async (endpoint: string, options?: RequestInit) => {
    return apiRequest(smartPath(endpoint), { method: 'DELETE', ...options });
  },

  // PATCH请求
  patch: async (endpoint: string, data?: any, options?: RequestInit) => {
    return apiRequest(smartPath(endpoint), {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  },
};

// ==================== Dashboard API ====================

// Dashboard 数据类型定义
interface DashboardMobileSummary {
  success: boolean;
  data: {
    stats: {
      totalStudents: number;
      thisMonthStudents: number;
      totalRevenue: number;
      thisMonthRevenue: number;
    };
    userInfo: {
      id: number;
      real_name: string;
      roles: number[];
    };
  };
}

interface PersonnelStats {
  role_name: string;
  total_count: number;
  active_count: number;
  total_students: number;
  total_revenue: number;
}

interface RecruitmentStats {
  current_month: number;
  current_year: number;
  last_month: number;
  month_growth_rate: number;
  daily_stats: Array<{
    date: string;
    count: number;
  }>;
}

interface IndustryStats {
  industry_tag: string;
  student_count: number;
  revenue_amount: number;
  avg_fee: number;
}

interface RevenueStats {
  total_revenue: number;
  received_amount: number;
  receivable_amount: number;
  collection_rate: number;
  this_month_total: number;
  this_year_total: number;
}

interface RealtimeStats {
  today_students: number;
  today_revenue: number;
  this_week_students: number;
  this_week_revenue: number;
  online_recruiters: number;
  pending_reviews: number;
}

// Dashboard API 函数
export const fetchDashboardMobileSummary = async (): Promise<DashboardMobileSummary> => {
  const result = await apiRequest('/dashboard/mobile/summary');
  return result;
};

export const fetchPersonnelStats = async (): Promise<PersonnelStats[]> => {
  const result = await apiRequest('/dashboard/personnel-stats');
  return result;
};

export const fetchRecruitmentStats = async (): Promise<RecruitmentStats> => {
  const result = await apiRequest('/dashboard/recruitment-stats');
  return result;
};

export const fetchIndustryStats = async (): Promise<IndustryStats[]> => {
  const result = await apiRequest('/dashboard/industry-stats');
  return result;
};

export const fetchRevenueStats = async (): Promise<RevenueStats> => {
  const result = await apiRequest('/dashboard/revenue-stats');
  return result;
};

export const fetchRealtimeStats = async (): Promise<RealtimeStats> => {
  const result = await apiRequest('/dashboard/realtime');
  return result;
};

export const fetchDashboardOverview = async (): Promise<any> => {
  const result = await apiRequest('/dashboard/overview');
  return result;
};

export const fetchExamEnrollmentStatistics = async (scheduleId: string): Promise<any> => {
  const result = await apiRequest(`/exams/schedules/${scheduleId}/enrollments/statistics`);
  return result;
};

// 导出功能 - 简化版本，只导出学员数据
export const exportRewards = async () => {
  const mode = getCurrentMode();

  // Mock模式处理
  if (mode === 'mock') {
    // Mock模式下模拟导出
    const mockBlob = new Blob(['Mock Excel data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(mockBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `奖励学员数据_${new Date().toISOString().slice(0,10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return { success: true, message: '导出成功' };
  }

  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error('无法获取API地址');
  }

  const token = getAuthToken();
  
  const response = await fetch(`${baseUrl}/api/v1/rewards/export`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ export_type: 'students' })
  });

  if (!response.ok) {
    throw new Error(`导出失败: ${response.status}`);
  }

  // 获取文件blob
  const blob = await response.blob();
  
  // 创建下载
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `奖励学员数据_${new Date().toISOString().slice(0,10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  return { success: true, message: '导出成功' };
};

// TODO: 暂时注释掉其他导出功能，后续再添加
// export const exportStudents = async () => {
//   const result = await apiRequest('/api/v1/students/export', {
//     method: 'POST',
//     body: JSON.stringify({ list_details: true }),
//   });
//   return result;
// };

// export const exportExams = async () => {
//   const result = await apiRequest('/api/v1/exams/export', {
//     method: 'POST',
//     body: JSON.stringify({ list_statistics: true }),
//   });
//   return result;
// };

// 考试报名学员名单管理
export const fetchExamEnrollments = async (
  scheduleId: string,
  params?: {
    keyword?: string;
    enrollment_status?: number;
    qualification_status?: number;
    materials_complete?: boolean;
    preliminary_result?: number;
    certificate_status?: number;
    recruiter_id?: number;
    channel?: string;
    is_veteran_conversion?: boolean;
    follow_up?: boolean;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
    include_statistics?: boolean;
  }
): Promise<any> => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }

  const url = `/exams/schedules/${scheduleId}/enrollments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const result = await apiRequest(url);
  return result;
};
