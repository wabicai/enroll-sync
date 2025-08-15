import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface MessageDialogProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirmText?: string;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600',
};

export function MessageDialog({
  type = 'info',
  title,
  message,
  open,
  onOpenChange,
  confirmText = '确定'
}: MessageDialogProps) {
  const Icon = iconMap[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Icon className={`h-5 w-5 ${colorMap[type]}`} />
            <DialogTitle className="text-lg font-medium text-gray-900">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-600 leading-relaxed">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            onClick={() => onOpenChange(false)}
            className="min-w-20"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}