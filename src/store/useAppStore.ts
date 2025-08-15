import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Theme } from '@/types';
import { isTokenExpired, clearAuthState, handleAuthFailure } from '@/lib/auth';

interface AppState {
  // 用户状态
  user: User | null;
  setUser: (user: User | null) => void;

  // 认证令牌
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (accessToken: string | null, refreshToken?: string | null) => void;
  clearTokens: () => void;

  // 主题状态
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // 侧边栏状态
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // 登录状态
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;

  // 初始化函数
  initialize: () => void;

  // 退出登录
  logout: () => void;

  // 检查认证状态
  checkAuthStatus: () => boolean;

  // 安全登录（带token验证）
  secureLogin: (user: User, accessToken: string, refreshToken?: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      theme: 'light',
      sidebarCollapsed: false,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setTokens: (accessToken, refreshToken = null) => set({ accessToken, refreshToken }),
      clearTokens: () => set({ accessToken: null, refreshToken: null }),

      setTheme: (theme) => {
        set({ theme });
        // 应用主题到DOM
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          root.classList.add(systemTheme);
        } else {
          root.classList.add(theme);
        }
      },

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      setIsAuthenticated: (auth) => set({ isAuthenticated: auth }),

      initialize: () => {
        const { theme } = get();
        // 初始化主题
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          root.classList.add(systemTheme);
        } else {
          root.classList.add(theme);
        }

        // 监听系统主题变化
        if (theme === 'system') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleChange = (e: MediaQueryListEvent) => {
            root.classList.remove('light', 'dark');
            root.classList.add(e.matches ? 'dark' : 'light');
          };
          mediaQuery.addEventListener('change', handleChange);
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });

        // 重定向到登录页面（不调用clearAuthState避免循环）
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/login') {
            window.location.href = '/login';
          }
        }
      },

      checkAuthStatus: () => {
        const { accessToken, isAuthenticated } = get();

        // 如果没有token或未认证，返回false
        if (!accessToken || !isAuthenticated) {
          return false;
        }

        // 检查token是否过期
        if (isTokenExpired(accessToken)) {
          console.warn('检测到过期token，清理认证状态');
          get().logout();
          return false;
        }

        return true;
      },

      secureLogin: (user: User, accessToken: string, refreshToken?: string) => {
        // 验证token格式
        if (!accessToken || typeof accessToken !== 'string') {
          console.error('无效的access token');
          handleAuthFailure(new Error('无效的access token'));
          return;
        }

        // 检查token是否已过期
        if (isTokenExpired(accessToken)) {
          console.error('提供的access token已过期');
          handleAuthFailure(new Error('Token已过期'));
          return;
        }

        // 设置认证状态
        set({
          user,
          accessToken,
          refreshToken: refreshToken || null,
          isAuthenticated: true,
        });

        console.log('✅ 安全登录成功');
      },
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);