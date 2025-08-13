import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Theme } from '@/types';

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