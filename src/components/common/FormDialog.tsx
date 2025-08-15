import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FormDialogProps {
  title: string;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  children: React.ReactNode;
  trigger?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg', 
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
};

export function FormDialog({
  title,
  description,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  confirmText = '确定',
  cancelText = '取消',
  children,
  trigger,
  size = 'md',
  loading = false,
  disabled = false
}: FormDialogProps) {
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  const content = (
    <DialogContent className={`${sizeMap[size]} max-h-[90vh] flex flex-col`}>
      <DialogHeader className="flex-shrink-0">
        <DialogTitle className="text-lg font-medium text-gray-900">
          {title}
        </DialogTitle>
        {description && (
          <DialogDescription className="text-sm text-gray-600 mt-1">
            {description}
          </DialogDescription>
        )}
      </DialogHeader>
      
      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-4 py-4">
          {children}
        </div>
      </ScrollArea>

      <DialogFooter className="flex-shrink-0 flex gap-2 pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={handleCancel}
          disabled={loading}
          className="min-w-20"
        >
          {cancelText}
        </Button>
        {onConfirm && (
          <Button 
            onClick={handleConfirm}
            disabled={disabled || loading}
            className="min-w-20"
          >
            {loading ? '处理中...' : confirmText}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        {content}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {content}
    </Dialog>
  );
}