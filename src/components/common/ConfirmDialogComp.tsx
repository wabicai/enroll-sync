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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  title: string;
  message: string;
  okText: string;
  cancelText: string;
  variant: 'destructive' | 'default';
  open: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  title,
  message,
  okText = '确定',
  cancelText = '取消',
  variant = 'default',
  open,
  onConfirm,
  onCancel,
  onClose
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-medium text-gray-900">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-600 mt-2">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2 mt-6">
          <AlertDialogCancel asChild onClick={handleCancel}>
            <Button variant="outline" className="min-w-20">
              {cancelText}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild onClick={handleConfirm}>
            <Button 
              variant={variant} 
              className="min-w-20"
            >
              {okText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
