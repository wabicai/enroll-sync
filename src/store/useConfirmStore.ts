import { create } from 'zustand';

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  okText: string;
  cancelText: string;
  variant: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
  openConfirm: (options: Omit<ConfirmState, 'isOpen' | 'onConfirm' | 'onCancel' | 'openConfirm' | 'closeConfirm'> & { onResolve: (value: boolean) => void }) => void;
  closeConfirm: () => void;
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  isOpen: false,
  title: '',
  message: '',
  okText: '确定',
  cancelText: '取消',
  variant: 'default',
  onConfirm: () => {},
  onCancel: () => {},
  openConfirm: (options) => {
    set({
      isOpen: true,
      title: options.title,
      message: options.message,
      okText: options.okText || '确定',
      cancelText: options.cancelText || '取消',
      variant: options.variant || 'default',
      onConfirm: () => {
        options.onResolve(true);
        set({ isOpen: false });
      },
      onCancel: () => {
        options.onResolve(false);
        set({ isOpen: false });
      },
    });
  },
  closeConfirm: () => set({ isOpen: false }),
}));

