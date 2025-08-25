import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { useAppStore } from '@/store/useAppStore';
import { ConfirmProvider, useConfirm } from '@/contexts/ConfirmContext';
import { useMessage } from '@/hooks/useMessage';
import { ConfirmDialog } from '@/components/common/ConfirmDialogComp';
import { MessageDialog } from '@/components/common/MessageDialog';

function AppLayoutContent() {
  const { initialize, sidebarCollapsed } = useAppStore();
  const { confirmState, close: closeConfirm } = useConfirm();
  const { messageState, close: closeMessage } = useMessage();

  // 添加调试信息
  console.log('🔴 AppLayout 中的 confirmState:', confirmState);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <SidebarProvider defaultOpen={!sidebarCollapsed}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppHeader />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
      <MessageDialog {...messageState} onClose={closeMessage} />
    </SidebarProvider>
  );
}

export function AppLayout() {
  return (
    <ConfirmProvider>
      <AppLayoutContent />
    </ConfirmProvider>
  );
}