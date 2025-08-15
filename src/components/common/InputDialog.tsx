import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface InputDialogProps {
  title: string;
  description?: string;
  placeholder?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (value: string) => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  minLength?: number;
  templates?: string[]; // 快速模板选项
}

export function InputDialog({
  title,
  description,
  placeholder,
  open,
  onOpenChange,
  onConfirm,
  confirmText = '确定',
  cancelText = '取消',
  variant = 'default',
  minLength = 0,
  templates = []
}: InputDialogProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    const trimmedValue = value.trim();
    
    if (!trimmedValue) {
      setError('内容不能为空');
      return;
    }
    
    if (minLength > 0 && trimmedValue.length < minLength) {
      setError(`内容至少需要${minLength}个字符`);
      return;
    }
    
    onConfirm(trimmedValue);
    setValue('');
    setError('');
  };

  const handleCancel = () => {
    setValue('');
    setError('');
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setValue('');
      setError('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-gray-900">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-gray-600">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="space-y-3">
          <Label htmlFor="input-value" className="text-sm font-medium">
            请输入内容
          </Label>
          
          {/* 快速模板选择 */}
          {templates.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">常用理由模板：</p>
              <div className="flex flex-wrap gap-2">
                {templates.map((template, index) => (
                  <Button
                    key={index}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-2"
                    onClick={() => {
                      setValue(template);
                      if (error) setError('');
                    }}
                  >
                    {template}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          <Textarea
            id="input-value"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError('');
            }}
            placeholder={placeholder || '请输入...'}
            className="min-h-20"
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            {cancelText}
          </Button>
          <Button 
            variant={variant}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}