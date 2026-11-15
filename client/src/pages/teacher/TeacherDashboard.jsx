import { AppLayout } from '@/components/layout/AppLayout.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card.jsx';
import { StatCard } from '@/components/ui/StatCard.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { BookOpen, CalendarCheck, Award, ShieldCheck } from 'lucide-react';

export const TeacherDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <AppLayout
      role="teacher"
      title="Faculty Portal"
      subtitle="Classroom Attendance, Gradebook & Student Assessments"
      user={user}
      onLogout={logout}
    >
      <div className="space-y-6">
        <div className="bg-forest text-ivory rounded-lg p-6 lg:p-8 border border-forest-light/40 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="gold" size="sm" className="font-mono">
              AUTHENTICATED AS FACULTY EDUCATOR
            </Badge>
            <Badge variant="success" size="sm" dot>
              SESSION ACTIVE
            </Badge>
          </div>
          <h2 className="font-editorial text-2xl lg:text-3xl font-bold text-white">
            Welcome, {user?.name || 'Educator'}
          </h2>
          <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xl">
            You are restricted to your assigned classrooms and subject evaluations in accordance with institutional policy.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Assigned Classes"
            value="4 Classes"
            icon={BookOpen}
            accent="forest"
          />
          <StatCard
            title="Class Attendance"
            value="96.2%"
            icon={CalendarCheck}
            trend={{ value: 'Today recorded', isPositive: true }}
            accent="success"
          />
          <StatCard
            title="Pending Evaluations"
            value="18 Papers"
            icon={Award}
            accent="gold"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Session Credentials</CardTitle>
            <CardDescription>Verified Teacher Role Permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded bg-sage/50 border border-sage-dark text-xs text-charcoal/90 space-y-1">
              <p className="font-semibold flex items-center gap-2 text-forest">
                <ShieldCheck className="w-4 h-4 text-forest" />
                Teacher Role Boundaries Enforced
              </p>
              <p className="text-muted">
                Educator: <span className="font-mono text-charcoal">{user?.name}</span> ({user?.email}) |
                Role: <span className="font-mono text-forest uppercase font-bold">{user?.role}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default TeacherDashboard;
