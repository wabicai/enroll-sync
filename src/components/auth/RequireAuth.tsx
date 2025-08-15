import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const { isLoggedIn, checkTokenRefresh } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setIsChecking(true);

      // 检查基本登录状态
      if (!isLoggedIn) {
        setIsValid(false);
        setIsChecking(false);
        return;
      }

      // 检查token状态并尝试刷新
      try {
        const tokenValid = await checkTokenRefresh();
        setIsValid(tokenValid);
      } catch (error) {
        console.error('认证检查失败:', error);
        setIsValid(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [isLoggedIn, checkTokenRefresh]);

  // 正在检查认证状态
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">验证登录状态...</span>
      </div>
    );
  }

  // 认证失败，重定向到登录页
  if (!isValid) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

