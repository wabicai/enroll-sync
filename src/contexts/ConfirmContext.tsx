import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  okText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ConfirmContextType {
  confirmState: ConfirmState;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  close: () => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

let globalResolve: ((value: boolean) => void) | null = null;

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    title: '',
    message: '',
    okText: '确定',
    cancelText: '取消',
    variant: 'default',
    open: false,
  });

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      globalResolve = resolve;
      setConfirmState({
        title: options.title,
        message: options.message,
        okText: options.okText || '确定',
        cancelText: options.cancelText || '取消',
        variant: options.variant || 'default',
        open: true,
        onConfirm: () => {
          if (globalResolve) {
            globalResolve(true);
            globalResolve = null;
          }
          setConfirmState(prev => ({ ...prev, open: false }));
        },
        onCancel: () => {
          if (globalResolve) {
            globalResolve(false);
            globalResolve = null;
          }
          setConfirmState(prev => ({ ...prev, open: false }));
        },
      });
    });
  };

  const close = () => {
    if (globalResolve) {
      globalResolve(false);
      globalResolve = null;
    }
    setConfirmState(prev => ({ ...prev, open: false }));
  };

  const contextValue: ConfirmContextType = {
    confirmState,
    confirm,
    close,
  };

  return (
    <ConfirmContext.Provider value={contextValue}>
      {children}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextType {
  const context = useContext(ConfirmContext);
  if (context === undefined) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}