import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'default';
  onConfirm: () => void | Promise<void>;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmText = '确定',
  cancelText = '取消',
  variant = 'default',
  onConfirm,
  trigger,
  open,
  onOpenChange
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange?.(false);
  };

  const content = (
    <AlertDialogContent className="max-w-md">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-lg font-medium text-gray-900">
          {title}
        </AlertDialogTitle>
        <AlertDialogDescription className="text-sm text-gray-600 mt-2">
          {description}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="flex gap-2 mt-6">
        <AlertDialogCancel asChild>
          <Button variant="outline" className="min-w-20">
            {cancelText}
          </Button>
        </AlertDialogCancel>
        <AlertDialogAction asChild>
          <Button 
            variant={variant} 
            onClick={handleConfirm}
            className="min-w-20"
          >
            {confirmText}
          </Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );

  if (trigger) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogTrigger asChild>
          {trigger}
        </AlertDialogTrigger>
        {content}
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {content}
    </AlertDialog>
  );
}