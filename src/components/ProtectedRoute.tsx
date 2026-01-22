import { useState } from 'react';
import LoginModal from './LoginModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('currentUser'));

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <>
      {children}
      {!isAuthenticated && <LoginModal onLoginSuccess={handleLoginSuccess} />}
    </>
  );
}
