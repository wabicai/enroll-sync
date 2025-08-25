import { useConfirmStore } from '@/store/useConfirmStore';

export function useConfirm() {
  const { openConfirm } = useConfirmStore();

  const confirm = (options: {
    title: string;
    message: string;
    okText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      openConfirm({ ...options, onResolve: resolve });
    });
  };

  return { confirm };
}