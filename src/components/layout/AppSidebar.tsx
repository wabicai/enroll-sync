import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Users,
  GraduationCap,
  CalendarCheck,
  Award,
  Settings,
  Home,
  CheckCircle2,
  Bell,
  TrendingUp,
  DollarSign,
  BookOpen,
  ChevronDown,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAppStore } from '@/store/useAppStore';

const menuGroups = [
  {
    label: '核心管理',
    items: [
      {
        title: '数据看板',
        url: '/',
        icon: BarChart3,
      },
      {
        title: '用户管理',
        url: '/users',
        icon: Users,
      },
      {
        title: '学员管理',
        url: '/students',
        icon: GraduationCap,
      },
    ],
  },
  {
    label: '业务流程',
    items: [
      {
        title: '审批中心',
        url: '/approvals',
        icon: CheckCircle2,
      },
      {
        title: '课程管理',
        url: '/courses',
        icon: BookOpen,
      },
      {
        title: '考试安排',
        url: '/schedules',
        icon: CalendarCheck,
      },
      {
        title: '奖励管理',
        url: '/rewards',
        icon: Award,
      },
    ],
  },
  {
    label: '系统管理',
    items: [
      {
        title: '通知中心',
        url: '/notifications',
        icon: Bell,
      },
      {
        title: '考核管理',
        url: '/assessments',
        icon: TrendingUp,
      },

      {
        title: '财务',
        url: '/finance',
        icon: DollarSign,
      },
      {
        title: '系统设置',
        url: '/settings',
        icon: Settings,
      },
    ],
  },
];

export function AppSidebar() {
  const { open, setOpen } = useSidebar();
  const location = useLocation();
  const { user, setSidebarCollapsed } = useAppStore();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const getNavClassName = (path: string) => {
    const active = isActive(path);
    return `relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
      active
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-accent-foreground hover:shadow-sm'
    }`;
  };

  return (
    <Sidebar 
      className={`border-r border-sidebar-border transition-all duration-300`}
      collapsible="offcanvas"
      style={{ background: 'var(--sidebar-background)' }}
    >
      <SidebarContent>
        {/* 顶部Logo区域 */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center shadow-sm">
              <Home className="w-5 h-5 text-primary-foreground" />
            </div>
            {open && (
              <div>
                <h2 className="font-semibold text-sidebar-foreground">招生管理系统</h2>
                <p className="text-xs text-muted-foreground">创宁培训</p>
              </div>
            )}
          </div>
        </div>

        {/* 分组导航菜单 */}
        <div className="flex-1 px-3 py-2 space-y-1">
          {menuGroups.map((group) => (
            <SidebarGroup key={group.label}>
              {open && (
                <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2 py-2 mb-1">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={!open ? item.title : undefined}>
                        <NavLink to={item.url} className={getNavClassName(item.url)}>
                          {/* 激活状态指示条 */}
                          {isActive(item.url) && (
                            <div className="absolute left-0 top-2 bottom-2 w-1 bg-sidebar-active-indicator rounded-r-full" />
                          )}
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          {open && (
                            <span className="font-medium truncate">{item.title}</span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </div>

        {/* 用户信息卡片 */}
        {user && open && (
          <div className="mt-auto p-4 border-t border-sidebar-border">
            <div className="bg-sidebar-accent/50 rounded-lg p-3 flex items-center gap-3 transition-colors hover:bg-sidebar-accent">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-sm">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <Users className="w-5 h-5 text-primary-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-sidebar-foreground truncate">
                  {user.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user.role === 'general_manager' && '总经理'}
                  {user.role === 'finance' && '财务人员'}
                  {user.role === 'exam_admin' && '考务管理'}
                  {user.role === 'system_admin' && '系统管理员'}
                </div>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}