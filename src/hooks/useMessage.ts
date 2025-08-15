import { useState } from 'react';

interface MessageState {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  open: boolean;
}

export function useMessage() {
  const [messageState, setMessageState] = useState<MessageState>({
    type: 'info',
    title: '',
    message: '',
    open: false,
  });

  const showMessage = (
    type: MessageState['type'],
    title: string,
    message: string
  ) => {
    setMessageState({
      type,
      title,
      message,
      open: true,
    });
  };

  const success = (title: string, message: string) => {
    showMessage('success', title, message);
  };

  const error = (title: string, message: string) => {
    showMessage('error', title, message);
  };

  const warning = (title: string, message: string) => {
    showMessage('warning', title, message);
  };

  const info = (title: string, message: string) => {
    showMessage('info', title, message);
  };

  const close = () => {
    setMessageState(prev => ({ ...prev, open: false }));
  };

  return {
    messageState,
    success,
    error,
    warning,
    info,
    close,
  };
}