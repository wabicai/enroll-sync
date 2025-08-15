import { useState } from 'react';

interface InputState {
  open: boolean;
  title: string;
  description: string;
  placeholder: string;
  confirmText: string;
  cancelText: string;
  variant: 'default' | 'destructive';
  minLength: number;
  onConfirm: (value: string) => void;
}

export function useInput() {
  const [inputState, setInputState] = useState<InputState>({
    open: false,
    title: '',
    description: '',
    placeholder: '',
    confirmText: '确定',
    cancelText: '取消',
    variant: 'default',
    minLength: 0,
    onConfirm: () => {},
  });

  const input = (options: {
    title: string;
    description?: string;
    placeholder?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
    minLength?: number;
    onConfirm: (value: string) => void;
  }) => {
    setInputState({
      open: true,
      title: options.title,
      description: options.description || '',
      placeholder: options.placeholder || '',
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      variant: options.variant || 'default',
      minLength: options.minLength || 0,
      onConfirm: options.onConfirm,
    });
  };

  const close = () => {
    setInputState(prev => ({ ...prev, open: false }));
  };

  return {
    inputState,
    input,
    close,
  };
}