import { useState, useEffect } from 'react';
import LoginModal from './LoginModal';
import { getAuthenticatedUser } from '../services/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getAuthenticatedUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // Show nothing while checking auth status
  if (isAuthenticated === null) {
    return null;
  }

  return (
    <>
      {children}
      {!isAuthenticated && <LoginModal onLoginSuccess={handleLoginSuccess} />}
    </>
  );
}
