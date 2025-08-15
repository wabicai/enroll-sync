/**
 * 认证工具模块
 * 处理JWT token的生命周期管理、自动刷新和状态同步
 */

import { useAppStore } from '@/store/useAppStore';

// Token过期时间检查的缓冲时间（5分钟）
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5分钟

/**
 * 解析JWT token获取过期时间
 */
export const parseTokenExpiry = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null; // 转换为毫秒
  } catch (error) {
    console.error('解析token失败:', error);
    return null;
  }
};

/**
 * 检查token是否即将过期
 */
export const isTokenExpiringSoon = (token: string): boolean => {
  const expiryTime = parseTokenExpiry(token);
  if (!expiryTime) return true;
  
  const now = Date.now();
  const timeUntilExpiry = expiryTime - now;
  
  return timeUntilExpiry <= TOKEN_REFRESH_BUFFER;
};

/**
 * 检查token是否已过期
 */
export const isTokenExpired = (token: string): boolean => {
  const expiryTime = parseTokenExpiry(token);
  if (!expiryTime) return true;
  
  return Date.now() >= expiryTime;
};

/**
 * 从localStorage获取认证状态
 */
export const getAuthState = () => {
  try {
    const storeData = localStorage.getItem('app-store');
    if (!storeData) return null;
    
    const parsed = JSON.parse(storeData);
    return parsed.state || null;
  } catch (error) {
    console.error('获取认证状态失败:', error);
    return null;
  }
};

/**
 * 更新localStorage中的token
 */
export const updateTokensInStorage = (accessToken: string, refreshToken?: string) => {
  try {
    const storeData = localStorage.getItem('app-store');
    if (!storeData) return false;
    
    const parsed = JSON.parse(storeData);
    const updatedStore = {
      ...parsed,
      state: {
        ...parsed.state,
        accessToken,
        refreshToken: refreshToken || parsed.state?.refreshToken,
      }
    };
    
    localStorage.setItem('app-store', JSON.stringify(updatedStore));
    return true;
  } catch (error) {
    console.error('更新token失败:', error);
    return false;
  }
};

/**
 * 清理认证状态
 */
export const clearAuthState = () => {
  try {
    const storeData = localStorage.getItem('app-store');
    if (!storeData) return;

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

    // 直接更新Zustand store状态，避免调用logout()造成循环调用
    const { setUser, setTokens, setIsAuthenticated } = useAppStore.getState();
    setUser(null);
    setTokens(null, null);
    setIsAuthenticated(false);

  } catch (error) {
    console.error('清理认证状态失败:', error);
  }
};

/**
 * 检查当前认证状态是否有效
 */
export const isAuthValid = (): boolean => {
  const authState = getAuthState();
  if (!authState?.accessToken) return false;
  
  return !isTokenExpired(authState.accessToken);
};

/**
 * 获取有效的访问token
 * 如果token即将过期，会尝试自动刷新
 */
export const getValidAccessToken = async (): Promise<string | null> => {
  const authState = getAuthState();
  if (!authState?.accessToken) return null;
  
  // 如果token已过期，返回null
  if (isTokenExpired(authState.accessToken)) {
    console.warn('Access token已过期');
    return null;
  }
  
  // 如果token即将过期，尝试刷新
  if (isTokenExpiringSoon(authState.accessToken)) {
    console.log('Access token即将过期，尝试刷新...');
    try {
      const newToken = await refreshAccessToken();
      return newToken;
    } catch (error) {
      console.error('Token刷新失败:', error);
      return null;
    }
  }
  
  return authState.accessToken;
};

/**
 * 刷新访问token
 */
export const refreshAccessToken = async (): Promise<string> => {
  const authState = getAuthState();
  if (!authState?.refreshToken) {
    throw new Error('未找到refresh token');
  }
  
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: authState.refreshToken }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Token刷新失败');
  }
  
  const result = await response.json();
  const newAccessToken = result.access_token;
  const newRefreshToken = result.refresh_token;
  
  if (!newAccessToken) {
    throw new Error('刷新响应中缺少access token');
  }
  
  // 更新存储的token
  updateTokensInStorage(newAccessToken, newRefreshToken);
  
  // 同时更新Zustand store
  const { setTokens } = useAppStore.getState();
  setTokens(newAccessToken, newRefreshToken);
  
  console.log('✅ Token刷新成功');
  return newAccessToken;
};

/**
 * 处理认证失败的情况
 */
export const handleAuthFailure = (error?: Error) => {
  console.error('认证失败:', error?.message || '未知错误');
  
  // 清理认证状态
  clearAuthState();
  
  // 重定向到登录页面
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (currentPath !== '/login') {
      window.location.href = '/login';
    }
  }
};

/**
 * 初始化认证状态检查
 * 在应用启动时调用，检查并清理过期的认证状态
 */
export const initializeAuthState = () => {
  const authState = getAuthState();
  if (!authState?.accessToken) return;
  
  // 如果token已过期，清理状态
  if (isTokenExpired(authState.accessToken)) {
    console.warn('检测到过期的access token，清理认证状态');
    clearAuthState();
  }
};

/**
 * 设置定期检查token状态的定时器
 */
export const setupTokenRefreshTimer = () => {
  // 每分钟检查一次token状态
  const checkInterval = 60 * 1000; // 1分钟
  
  setInterval(async () => {
    const authState = getAuthState();
    if (!authState?.accessToken || !authState?.isAuthenticated) return;
    
    // 如果token即将过期，尝试刷新
    if (isTokenExpiringSoon(authState.accessToken)) {
      try {
        await refreshAccessToken();
        console.log('🔄 定时刷新token成功');
      } catch (error) {
        console.error('🔄 定时刷新token失败:', error);
        handleAuthFailure(error as Error);
      }
    }
  }, checkInterval);
};
