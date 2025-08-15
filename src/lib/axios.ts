/**
 * Axios 配置和拦截器
 * 统一处理API请求、响应、错误处理和无感刷新
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAppStore } from '@/store/useAppStore';
import { getCurrentMode, API_CONFIG } from '@/hooks/useApi';

// 创建axios实例
const createAxiosInstance = (): AxiosInstance => {
  const mode = getCurrentMode();
  let baseURL = '';

  // 根据模式设置baseURL
  if (mode === 'local') {
    baseURL = API_CONFIG.LOCAL;
  } else if (mode === 'production') {
    baseURL = API_CONFIG.PRODUCTION;
  }

  const instance = axios.create({
    baseURL,
    timeout: 10000, // 10秒超时
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return instance;
};

// 创建实例
const apiClient = createAxiosInstance();

// Token刷新状态管理
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

// 处理队列中的请求
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  
  failedQueue = [];
};

// 刷新Token函数
const refreshAuthToken = async (): Promise<string> => {
  try {
    const { refreshToken } = useAppStore.getState();
    
    if (!refreshToken) {
      throw new Error('未找到refresh token');
    }

    console.log('🔄 开始刷新token...');

    const response = await axios.post('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    });

    const { access_token, refresh_token } = response.data;
    
    if (!access_token) {
      throw new Error('刷新响应中缺少access token');
    }

    // 更新store中的token
    const { setTokens } = useAppStore.getState();
    setTokens(access_token, refresh_token);

    console.log('✅ Token刷新成功');
    return access_token;

  } catch (error) {
    console.error('❌ Token刷新失败:', error);
    
    // 刷新失败，清理认证状态并跳转登录
    const { logout } = useAppStore.getState();
    logout();
    
    // 跳转到登录页
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    
    throw error;
  }
};

// 请求拦截器
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const mode = getCurrentMode();
    
    // Mock模式直接返回
    if (mode === 'mock') {
      return config;
    }

    // 添加认证token
    const { accessToken } = useAppStore.getState();
    if (accessToken) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // 添加请求ID用于日志追踪
    const requestId = Math.random().toString(36).substr(2, 9);
    config.metadata = { requestId };

    console.log(`🚀 [${requestId}] API请求:`, config.method?.toUpperCase(), config.url);
    
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ 请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const requestId = response.config.metadata?.requestId;
    console.log(`✅ [${requestId}] API响应成功:`, response.status, response.config.url);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    const requestId = originalRequest?.metadata?.requestId;

    console.error(`❌ [${requestId}] API响应错误:`, error.response?.status, error.message);

    // 处理401错误 - Token过期
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 如果正在刷新，将请求加入队列
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      if (!refreshPromise) {
        refreshPromise = refreshAuthToken();
      }

      try {
        const newToken = await refreshPromise;
        processQueue(null, newToken);
        
        // 重试原请求
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    }

    // 处理403错误 - 权限不足
    if (error.response?.status === 403) {
      console.error(`❌ [${requestId}] 403 Forbidden - 权限不足`);
      // 可以在这里添加权限不足的提示
    }

    // 处理网络错误
    if (!error.response) {
      console.error(`❌ [${requestId}] 网络错误:`, error.message);
      return Promise.reject(new Error('网络连接失败，请检查网络设置'));
    }

    // 统一错误格式
    const errorMessage = error.response?.data?.message || error.message || '请求失败';
    return Promise.reject(new Error(errorMessage));
  }
);

// Mock模式处理
const handleMockRequest = (config: AxiosRequestConfig) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: { success: true, data: [], message: 'Mock data' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
    }, 300); // 模拟网络延迟
  });
};

// 导出配置好的axios实例
export default apiClient;

// 导出常用的请求方法
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const mode = getCurrentMode();
    if (mode === 'mock') {
      return handleMockRequest({ url, method: 'GET', ...config }) as Promise<T>;
    }
    return apiClient.get(url, config).then(res => res.data);
  },

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const mode = getCurrentMode();
    if (mode === 'mock') {
      return handleMockRequest({ url, method: 'POST', data, ...config }) as Promise<T>;
    }
    return apiClient.post(url, data, config).then(res => res.data);
  },

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const mode = getCurrentMode();
    if (mode === 'mock') {
      return handleMockRequest({ url, method: 'PUT', data, ...config }) as Promise<T>;
    }
    return apiClient.put(url, data, config).then(res => res.data);
  },

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const mode = getCurrentMode();
    if (mode === 'mock') {
      return handleMockRequest({ url, method: 'DELETE', ...config }) as Promise<T>;
    }
    return apiClient.delete(url, config).then(res => res.data);
  },

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const mode = getCurrentMode();
    if (mode === 'mock') {
      return handleMockRequest({ url, method: 'PATCH', data, ...config }) as Promise<T>;
    }
    return apiClient.patch(url, data, config).then(res => res.data);
  },
};
