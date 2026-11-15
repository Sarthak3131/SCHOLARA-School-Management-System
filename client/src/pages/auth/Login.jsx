import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { showToast } from '@/utils/toast.js';
import { ROLES } from '@/utils/constants.js';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDemoRole, setSelectedDemoRole] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Demo accounts for quick evaluation
  const demoAccounts = [
    {
      role: ROLES.ADMIN,
      label: 'Admin',
      email: 'admin@scholara.edu',
      password: 'Admin@123',
      desc: 'System oversight & institutional management',
    },
    {
      role: ROLES.TEACHER,
      label: 'Teacher',
      email: 'teacher@scholara.edu',
      password: 'Teacher@123',
      desc: 'Attendance & academic evaluation',
    },
    {
      role: ROLES.GUARDIAN,
      label: 'Guardian',
      email: 'guardian@scholara.edu',
      password: 'Guardian@123',
      desc: 'Student records, results & fee invoices',
    },
  ];

  const handleQuickFill = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setSelectedDemoRole(acc.role);
    setErrorMessage('');
    showToast.info(`Filled demo credentials for ${acc.label}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please provide both institutional email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      showToast.success(`Welcome back, ${result.user.name}`);

      // Determine redirection destination
      const redirectTarget = location.state?.from?.pathname;
      if (redirectTarget) {
        navigate(redirectTarget, { replace: true });
        return;
      }

      // Default role landing
      if (result.user.role === ROLES.ADMIN) {
        navigate('/admin', { replace: true });
      } else if (result.user.role === ROLES.TEACHER) {
        navigate('/teacher', { replace: true });
      } else {
        navigate('/guardian', { replace: true });
      }
    } else {
      setErrorMessage(result.message || 'Authentication failed. Please verify your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-forest text-gold border border-gold/40 shadow-card-md mb-4">
          <span className="font-editorial text-2xl font-bold leading-none">S</span>
        </div>
        <h1 className="font-editorial text-3xl font-bold text-charcoal tracking-tight">
          SCHOLARA
        </h1>
        <p className="mt-1 text-xs text-muted font-mono tracking-widest uppercase">
          Institutional Management Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Main Card */}
        <div className="bg-white py-8 px-6 sm:px-8 rounded-lg border border-sage shadow-card-lg">
          {/* Quick Demo Switcher */}
          <div className="mb-6 p-3.5 rounded bg-ivory border border-sage-dark/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xs font-mono uppercase tracking-wider font-semibold text-charcoal/80 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-forest" />
                Quick-Fill Demo Account
              </span>
              <span className="text-2xs text-muted font-mono">1-Click Fill</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickFill(acc)}
                  className={`
                    px-2.5 py-1.5 rounded text-xs font-medium font-mono transition-all text-center border
                    ${selectedDemoRole === acc.role
                      ? 'bg-forest text-gold border-forest shadow-xs font-semibold'
                      : 'bg-white text-charcoal/80 border-sage-dark hover:bg-sage/50 hover:border-muted'
                    }
                  `}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded bg-danger-bg border border-danger/30 text-danger text-xs flex items-start gap-2" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Institutional Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="e.g. admin@scholara.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={Mail}
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={Lock}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                rightIcon={ArrowRight}
                className="w-full justify-center"
              >
                Sign In to Scholara
              </Button>
            </div>
          </form>

          {/* Security Footer */}
          <div className="mt-6 pt-5 border-t border-sage flex items-center justify-center gap-2 text-2xs text-muted font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-forest" />
            <span>Role-Based Access Control • 256-bit JWT Encryption</span>
          </div>
        </div>

        {/* Credentials Reference Helper */}
        <div className="mt-4 text-center">
          <p className="text-2xs text-muted">
            Credentials reference: <span className="font-mono text-charcoal">Admin@123</span> • <span className="font-mono text-charcoal">Teacher@123</span> • <span className="font-mono text-charcoal">Guardian@123</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
