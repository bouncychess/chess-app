import LoginModal from './LoginModal';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, refreshUser } = useAuth();

  const handleLoginSuccess = async () => {
    await refreshUser();
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
