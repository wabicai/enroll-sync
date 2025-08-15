import { useState } from 'react';

interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  variant: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    title: '',
    description: '',
    confirmText: '确定',
    cancelText: '取消',
    variant: 'default',
    onConfirm: () => {},
  });

  const confirm = (options: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfirmState({
      open: true,
      title: options.title,
      description: options.description,
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      variant: options.variant || 'default',
      onConfirm: options.onConfirm,
    });
  };

  const close = () => {
    setConfirmState(prev => ({ ...prev, open: false }));
  };

  return {
    confirmState,
    confirm,
    close,
  };
}