import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { ApiResponse } from '@/types';

// API配置
const API_MODES = {
  MOCK: 'mock',
  LOCAL: 'http://localhost:3000/api/v1',
  PRODUCTION: 'https://chuangningpeixun.com/api/v1'
} as const;

// 当前API模式，可以通过环境变量或配置切换
const currentMode = 'mock'; // 默认使用mock模式

interface UseApiOptions {
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
}

export const useApi = <T = any>(options: UseApiOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { showErrorToast = true, showSuccessToast = false } = options;
  
  const request = useCallback(async (
    endpoint: string,
    config: RequestInit = {}
  ): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      let url = endpoint;
      
      // 根据模式构建URL
      if (currentMode !== 'mock') {
        const baseUrl = currentMode === 'local' ? API_MODES.LOCAL : API_MODES.PRODUCTION;
        url = `${baseUrl}${endpoint}`;
      }
      
      // 模拟API延迟
      if (currentMode === 'mock') {
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      }
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        ...config,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse<T> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '请求失败');
      }
      
      if (showSuccessToast && data.message) {
        toast({
          title: '成功',
          description: data.message,
        });
      }
      
      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '网络请求失败';
      setError(errorMessage);
      
      if (showErrorToast) {
        toast({
          title: '请求失败',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast, showErrorToast, showSuccessToast]);
  
  const get = useCallback((endpoint: string) => {
    return request(endpoint, { method: 'GET' });
  }, [request]);
  
  const post = useCallback((endpoint: string, data?: any) => {
    return request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }, [request]);
  
  const put = useCallback((endpoint: string, data?: any) => {
    return request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }, [request]);
  
  const del = useCallback((endpoint: string) => {
    return request(endpoint, { method: 'DELETE' });
  }, [request]);
  
  return {
    loading,
    error,
    request,
    get,
    post,
    put,
    delete: del,
  };
};

// 切换API模式的工具函数
export const setApiMode = (mode: keyof typeof API_MODES) => {
  // 这里可以实现动态切换API模式的逻辑
  console.log(`切换API模式到: ${mode}`);
};