/**
 * 认证状态管理Hook
 * 提供登录、登出、token刷新等认证相关功能
 */

import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { 
  isTokenExpired, 
  isTokenExpiringSoon, 
  refreshAccessToken, 
  handleAuthFailure,
  initializeAuthState,
  setupTokenRefreshTimer
} from '@/lib/auth';

export const useAuth = () => {
  const {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    setUser,
    setTokens,
    logout,
    checkAuthStatus,
    secureLogin,
  } = useAppStore();

  // 检查认证状态
  const isLoggedIn = useCallback(() => {
    return checkAuthStatus();
  }, [checkAuthStatus]);

  // 安全登录
  const login = useCallback((userData: any, tokens: { accessToken: string; refreshToken?: string }) => {
    try {
      secureLogin(userData, tokens.accessToken, tokens.refreshToken);
      return true;
    } catch (error) {
      console.error('登录失败:', error);
      return false;
    }
  }, [secureLogin]);

  // 登出
  const signOut = useCallback(() => {
    logout();
  }, [logout]);

  // 刷新token
  const refreshAuthToken = useCallback(async () => {
    try {
      const newAccessToken = await refreshAccessToken();
      return newAccessToken;
    } catch (error) {
      console.error('Token刷新失败:', error);
      handleAuthFailure(error as Error);
      return null;
    }
  }, []);

  // 检查token是否需要刷新
  const checkTokenRefresh = useCallback(async () => {
    if (!accessToken || !isAuthenticated) return false;

    if (isTokenExpired(accessToken)) {
      console.warn('Token已过期，执行登出');
      signOut();
      return false;
    }

    if (isTokenExpiringSoon(accessToken)) {
      console.log('Token即将过期，尝试刷新...');
      const newToken = await refreshAuthToken();
      return !!newToken;
    }

    return true;
  }, [accessToken, isAuthenticated, signOut, refreshAuthToken]);

  // 获取当前用户信息
  const getCurrentUser = useCallback(() => {
    if (!isLoggedIn()) return null;
    return user;
  }, [user, isLoggedIn]);

  // 获取有效的访问token
  const getValidToken = useCallback(async () => {
    if (!accessToken || !isAuthenticated) return null;

    if (isTokenExpired(accessToken)) {
      signOut();
      return null;
    }

    if (isTokenExpiringSoon(accessToken)) {
      const newToken = await refreshAuthToken();
      return newToken;
    }

    return accessToken;
  }, [accessToken, isAuthenticated, signOut, refreshAuthToken]);

  // 初始化认证状态
  useEffect(() => {
    initializeAuthState();
    
    // 设置定期检查token状态
    setupTokenRefreshTimer();
    
    // 页面可见性变化时检查认证状态
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkTokenRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkTokenRefresh]);

  // 监听storage变化，同步认证状态
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app-store') {
        // localStorage发生变化，重新检查认证状态
        setTimeout(() => {
          checkAuthStatus();
        }, 100);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuthStatus]);

  return {
    // 状态
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoggedIn: isLoggedIn(),

    // 方法
    login,
    signOut,
    refreshAuthToken,
    checkTokenRefresh,
    getCurrentUser,
    getValidToken,
  };
};

export default useAuth;
