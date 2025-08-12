import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const { isAuthenticated, accessToken } = useAppStore();
  const location = useLocation();

  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

