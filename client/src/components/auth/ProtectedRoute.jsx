import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.jsx';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button.jsx';
import { Badge } from '@/components/ui/Badge.jsx';

export const ProtectedRoute = ({
  children,
  allowedRoles = [],
}) => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();

  // Loading state while checking session token
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-ivory text-charcoal">
        <div className="w-12 h-12 rounded bg-forest flex items-center justify-center border border-gold/40 shadow-card mb-4 animate-pulse">
          <span className="font-editorial text-gold font-bold text-xl">S</span>
        </div>
        <p className="font-editorial text-lg text-charcoal font-semibold">SCHOLARA</p>
        <p className="text-xs text-muted mt-1 font-mono">Verifying institutional credentials...</p>
      </div>
    );
  }

  // Not authenticated -> Redirect to /login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role validation check
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const roleDashboardMap = {
      admin: '/admin',
      teacher: '/teacher',
      guardian: '/guardian',
    };
    const returnPath = roleDashboardMap[user.role] || '/login';

    return (
      <div className="flex items-center justify-center min-h-screen bg-ivory px-4 py-8">
        <div className="max-w-md w-full bg-white rounded-lg border border-sage shadow-card-lg p-6 sm:p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-4 border border-danger/20">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <Badge variant="danger" size="sm" dot className="mb-2 uppercase font-mono">
            403 • ACCESS FORBIDDEN
          </Badge>

          <h2 className="font-editorial text-2xl font-bold text-charcoal mb-2">
            Restricted Module
          </h2>

          <p className="text-xs sm:text-sm text-muted leading-relaxed mb-6">
            Your authenticated role (<strong className="text-charcoal capitalize">{user.role}</strong>) does not have
            authorization to access this sector. This area requires{' '}
            <span className="font-mono text-forest font-semibold">{allowedRoles.join(' or ')}</span> credentials.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to={returnPath} className="w-full sm:w-auto">
              <Button variant="primary" size="sm" leftIcon={ArrowLeft} className="w-full">
                My Dashboard
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              leftIcon={LogOut}
              onClick={logout}
              className="w-full sm:w-auto"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
