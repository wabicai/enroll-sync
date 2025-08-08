import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Users,
  GraduationCap,
  Calendar,
  Award,
  Settings,
  Home,
  Target,
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

const menuItems = [
  {
    title: '数据看板',
    url: '/',
    icon: BarChart3,
    description: '总览数据和统计',
  },
  {
    title: '用户管理',
    url: '/users',
    icon: Users,
    description: '招生人员管理',
  },
  {
    title: '审批中心',
    url: '/approvals',
    icon: Target,
    description: '注册与升级审批',
  },
  {
    title: '学员管理',
    url: '/students',
    icon: GraduationCap,
    description: '学员信息管理',
  },
  {
    title: '课程管理',
    url: '/courses',
    icon: Calendar,
    description: '课程信息管理',
  },
  {
    title: '考试安排',
    url: '/schedules',
    icon: Calendar,
    description: '考试安排管理',
  },
  {
    title: '奖励管理',
    url: '/rewards',
    icon: Award,
    description: '奖励发放管理',
  },
  {
    title: '通知中心',
    url: '/notifications',
    icon: Target,
    description: '系统通知与模板',
  },
  {
    title: '考核管理',
    url: '/assessments',
    icon: Target,
    description: '绩效考核管理',
  },
  {
    title: '导出中心',
    url: '/exports',
    icon: Target,
    description: 'Excel 导出记录',
  },
  {
    title: '财务',
    url: '/finance',
    icon: Target,
    description: '工资与汇总',
  },
  {
    title: '系统设置',
    url: '/settings',
    icon: Settings,
    description: '系统配置管理',
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
    return `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
    }`;
  };

  return (
    <Sidebar 
      className={`border-r border-sidebar-border ${!open ? 'w-16' : 'w-64'}`}
      collapsible="icon"
    >
      <SidebarContent className="bg-sidebar">
        {/* 顶部Logo区域 */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
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

        {/* 主导航菜单 */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground px-4 py-2">
            {open && '主要功能'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={!open ? item.title : undefined}>
                    <NavLink to={item.url} className={getNavClassName(item.url)}>
                      <item.icon className="w-5 h-5" />
                      {open && (
                        <div className="flex-1">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 用户信息 */}
        {user && open && (
          <div className="mt-auto p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <Users className="w-4 h-4 text-muted-foreground" />
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