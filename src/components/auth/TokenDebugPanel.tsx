/**
 * Token调试面板
 * 用于测试和调试JWT token过期处理机制
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { parseTokenExpiry, isTokenExpired, isTokenExpiringSoon } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const TokenDebugPanel: React.FC = () => {
  const { accessToken, refreshToken, isAuthenticated, getValidToken, signOut } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // 解析token信息
  useEffect(() => {
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const expiryTime = parseTokenExpiry(accessToken);
        
        setTokenInfo({
          payload,
          expiryTime,
          isExpired: isTokenExpired(accessToken),
          isExpiringSoon: isTokenExpiringSoon(accessToken),
          timeUntilExpiry: expiryTime ? expiryTime - Date.now() : null,
        });
      } catch (error) {
        console.error('解析token失败:', error);
        setTokenInfo(null);
      }
    } else {
      setTokenInfo(null);
    }
  }, [accessToken]);

  // 手动刷新token
  const handleRefreshToken = async () => {
    setRefreshing(true);
    try {
      const newToken = await getValidToken();
      console.log('Token刷新结果:', newToken ? '成功' : '失败');
    } catch (error) {
      console.error('Token刷新失败:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // 模拟过期token（仅用于测试）
  const simulateExpiredToken = () => {
    if (accessToken) {
      // 创建一个已过期的token（将exp设置为过去的时间）
      const parts = accessToken.split('.');
      const payload = JSON.parse(atob(parts[1]));
      payload.exp = Math.floor(Date.now() / 1000) - 3600; // 1小时前过期
      
      const newPayload = btoa(JSON.stringify(payload));
      const expiredToken = `${parts[0]}.${newPayload}.${parts[2]}`;
      
      // 更新localStorage（仅用于测试）
      const storeData = localStorage.getItem('app-store');
      if (storeData) {
        const parsed = JSON.parse(storeData);
        parsed.state.accessToken = expiredToken;
        localStorage.setItem('app-store', JSON.stringify(parsed));
        window.location.reload(); // 刷新页面以触发检查
      }
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // 格式化剩余时间
  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return '已过期';
    
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}分${seconds}秒`;
    }
    return `${seconds}秒`;
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Token调试面板</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">用户未登录</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Token调试面板</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 认证状态 */}
        <div>
          <h3 className="font-semibold mb-2">认证状态</h3>
          <div className="flex gap-2">
            <Badge variant={isAuthenticated ? "default" : "destructive"}>
              {isAuthenticated ? "已认证" : "未认证"}
            </Badge>
            {tokenInfo && (
              <>
                <Badge variant={tokenInfo.isExpired ? "destructive" : "default"}>
                  {tokenInfo.isExpired ? "已过期" : "有效"}
                </Badge>
                <Badge variant={tokenInfo.isExpiringSoon ? "secondary" : "default"}>
                  {tokenInfo.isExpiringSoon ? "即将过期" : "正常"}
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Token信息 */}
        {tokenInfo && (
          <div>
            <h3 className="font-semibold mb-2">Token信息</h3>
            <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
              <div><strong>用户ID:</strong> {tokenInfo.payload.sub}</div>
              <div><strong>用户名:</strong> {tokenInfo.payload.username || 'N/A'}</div>
              <div><strong>签发时间:</strong> {tokenInfo.payload.iat ? formatTime(tokenInfo.payload.iat * 1000) : 'N/A'}</div>
              <div><strong>过期时间:</strong> {tokenInfo.expiryTime ? formatTime(tokenInfo.expiryTime) : 'N/A'}</div>
              <div><strong>剩余时间:</strong> 
                <span className={tokenInfo.timeUntilExpiry <= 0 ? 'text-red-600' : tokenInfo.isExpiringSoon ? 'text-yellow-600' : 'text-green-600'}>
                  {tokenInfo.timeUntilExpiry ? formatTimeRemaining(tokenInfo.timeUntilExpiry) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={handleRefreshToken} 
            disabled={refreshing}
            variant="outline"
          >
            {refreshing ? '刷新中...' : '手动刷新Token'}
          </Button>
          
          <Button 
            onClick={simulateExpiredToken} 
            variant="destructive"
            size="sm"
          >
            模拟过期Token
          </Button>
          
          <Button 
            onClick={signOut} 
            variant="outline"
          >
            登出
          </Button>
        </div>

        {/* 说明 */}
        <div className="text-xs text-gray-500 border-t pt-3">
          <p><strong>说明:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Token会在过期前5分钟自动刷新</li>
            <li>API请求遇到401错误时会自动尝试刷新Token</li>
            <li>刷新失败时会自动清理认证状态并重定向到登录页</li>
            <li>"模拟过期Token"按钮仅用于测试，会创建一个已过期的Token</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenDebugPanel;
