import { Search, Moon, Sun, Monitor, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAppStore } from '@/store/useAppStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { logout as apiLogout } from '@/lib/api';
import { NotificationDropdown } from './NotificationDropdown';

export function AppHeader() {
  const { user, theme, setTheme, logout, clearTokens, setIsAuthenticated } = useAppStore();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  const handleLogout = async () => {
    try {
      const api = await import('@/lib/api');
      await api.logout();
    } finally {
      clearTokens();
      setIsAuthenticated(false);
      logout();
      window.location.href = '/login';
    }
  };

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* 侧边栏切换按钮 */}
        <SidebarTrigger className="w-4 h-4" />

        {/* 面包屑导航 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>招生管理系统</span>
        </div>

        {/* 搜索框 */}
        <div className="relative ml-auto flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索学员、考试..."
              className="w-64 pl-9"
            />
          </div>

          {/* 通知 */}
          <NotificationDropdown />

          {/* 主题切换 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                {theme === 'light' && <Sun className="h-4 w-4" />}
                {theme === 'dark' && <Moon className="h-4 w-4" />}
                {theme === 'system' && <Monitor className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleThemeChange('light')}>
                <Sun className="mr-2 h-4 w-4" />
                浅色模式
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleThemeChange('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                深色模式
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleThemeChange('system')}>
                <Monitor className="mr-2 h-4 w-4" />
                跟随系统
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 用户菜单 */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  个人资料
                </DropdownMenuItem>
                <DropdownMenuItem>
                  账户设置
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}