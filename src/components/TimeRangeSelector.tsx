import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface TimeRangeOption {
  value: TimeRange;
  label: string;
  description?: string;
}

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  disabled?: boolean;
}

const timeRangeOptions: TimeRangeOption[] = [
  { value: 'today', label: '今日', description: '今天的数据' },
  { value: 'week', label: '本周', description: '本周的数据' },
  { value: 'month', label: '本月', description: '本月的数据' },
  { value: 'quarter', label: '本季度', description: '本季度的数据' },
  { value: 'year', label: '本年', description: '本年的数据' },
  { value: 'custom', label: '自定义', description: '选择自定义时间范围' },
];

export function TimeRangeSelector({ value, onChange, disabled = false }: TimeRangeSelectorProps) {
  const currentOption = timeRangeOptions.find(option => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 min-w-[120px]"
          disabled={disabled}
        >
          <Calendar className="h-4 w-4" />
          {currentOption?.label || '选择时间'}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {timeRangeOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className="flex flex-col items-start gap-1 p-3"
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-medium">{option.label}</span>
              {value === option.value && (
                <Badge variant="secondary" className="text-xs">
                  当前
                </Badge>
              )}
            </div>
            {option.description && (
              <span className="text-xs text-muted-foreground">
                {option.description}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 获取时间范围的实际日期
export function getDateRange(range: TimeRange): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      return { start: weekStart, end: weekEnd };
    
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      return { start: monthStart, end: monthEnd };
    
    case 'quarter':
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      const quarterStart = new Date(now.getFullYear(), quarterMonth, 1);
      const quarterEnd = new Date(now.getFullYear(), quarterMonth + 3, 0);
      quarterEnd.setHours(23, 59, 59, 999);
      return { start: quarterStart, end: quarterEnd };
    
    case 'year':
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear(), 11, 31);
      yearEnd.setHours(23, 59, 59, 999);
      return { start: yearStart, end: yearEnd };
    
    default:
      return { start: today, end: today };
  }
}
