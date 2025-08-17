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
  NotificationItem
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

  // 转换后端数据结构到前端期望的格式
  const items = result.items || [];
  return items.map((item: any) => ({
    id: item.id.toString(),
    name: item.name,
    idCard: item.id_card,
    phone: item.phone,
    category: 'other' as const, // 默认类别
    status: item.status === 1 ? 'approved' : 'pending',
    paymentStatus: 'paid' as const, // 默认已付费
    amount: 0, // 默认金额
    paidAmount: 0, // 默认已付金额
    recruiterId: item.created_by?.toString() || '0',
    recruiterName: '未知', // 默认招生员名称
    tags: [],
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    examId: undefined
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
  return result.items || result.data || [];
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

// 用户管理
export const fetchUsers = async (): Promise<User[]> => {
  const result = await apiRequest('/users');
  return result.items || result.data || [];
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
export const fetchNotifications = async (): Promise<NotificationItem[]> => {
  const result = await apiRequest('/notifications');
  return result.items || result.data || [];
};

export const markNotificationAsRead = async (id: number): Promise<void> => {
  await apiRequest(`/notifications/${id}/read`, {
    method: 'PUT',
    body: JSON.stringify({}),
  });
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await apiRequest('/notifications/read-all', {
    method: 'PUT',
    body: JSON.stringify({}),
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

export const fetchAssessmentsMonthly = async () => {
  const result = await apiRequest('/assessments/monthly');
  return result.data;
};

export const calculateAssessments = async () => {
  const result = await apiRequest('/assessments/calculate', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  return result.data;
};

export const fetchAssessmentWarnings = async () => {
  const result = await apiRequest('/assessments/warnings');
  return result.data;
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
