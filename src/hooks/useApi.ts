import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { ApiResponse } from '@/types';

// API配置 - 统一的环境控制
const API_CONFIG = {
  MOCK: 'mock',
  LOCAL: 'http://localhost:8000',
  PRODUCTION: 'https://chuangningpeixun.com'
} as const;

// 当前API模式，通过环境变量控制
const getCurrentMode = () => {
  const useMock = (import.meta as any).env?.VITE_USE_MOCK === 'true';
  if (useMock) return 'mock';

  // 优先使用 VITE_API_ENV 环境变量
  const apiEnv = (import.meta as any).env?.VITE_API_ENV;
  if (apiEnv === 'dev') return 'local';
  if (apiEnv === 'prod') return 'production';

  // 回退到 MODE 环境变量
  const mode = (import.meta as any).env?.MODE;
  return mode === 'production' ? 'production' : 'local';
};

const currentMode = getCurrentMode();

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
        const baseUrl = currentMode === 'local' ? API_CONFIG.LOCAL : API_CONFIG.PRODUCTION;
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

// 导出当前配置供其他模块使用
export { currentMode, API_CONFIG };