import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext.jsx';
import Login from '@/pages/auth/Login.jsx';
import AdminDashboard from '@/pages/admin/AdminDashboard.jsx';
import StudentsManagement from '@/pages/admin/StudentsManagement.jsx';
import TeachersManagement from '@/pages/admin/TeachersManagement.jsx';
import AcademicManagement from '@/pages/admin/AcademicManagement.jsx';
import GuardiansManagement from '@/pages/admin/GuardiansManagement.jsx';
import TeacherDashboard from '@/pages/teacher/TeacherDashboard.jsx';
import GuardianDashboard from '@/pages/guardian/GuardianDashboard.jsx';
import AttendanceManagement from '@/pages/attendance/AttendanceManagement.jsx';
import GuardianAttendance from '@/pages/guardian/GuardianAttendance.jsx';
import ExaminationManagement from '@/pages/examinations/ExaminationManagement.jsx';
import MarksEntry from '@/pages/examinations/MarksEntry.jsx';
import GuardianResults from '@/pages/guardian/GuardianResults.jsx';
import FeeManagement from '@/pages/admin/FeeManagement.jsx';
import GuardianFees from '@/pages/guardian/GuardianFees.jsx';
import DesignSystemShowcase from '@/pages/DesignSystemShowcase.jsx';
import ProtectedRoute from '@/components/auth/ProtectedRoute.jsx';
import { ROLES } from '@/utils/constants.js';

// Root redirector based on authenticated role
const RootRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ivory">
        <div className="w-10 h-10 rounded bg-forest flex items-center justify-center border border-gold animate-pulse">
          <span className="font-editorial text-gold font-bold">S</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === ROLES.ADMIN) return <Navigate to="/admin" replace />;
  if (user.role === ROLES.TEACHER) return <Navigate to="/teacher" replace />;
  if (user.role === ROLES.GUARDIAN) return <Navigate to="/guardian" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Root */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/design-system" element={<DesignSystemShowcase />} />

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <StudentsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teachers"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <TeachersManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classes"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AcademicManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/guardians"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <GuardiansManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AttendanceManagement role="admin" />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/exams" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><ExaminationManagement /></ProtectedRoute>} />
        <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><FeeManagement /></ProtectedRoute>} />

        {/* Protected Teacher Routes */}
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute allowedRoles={[ROLES.TEACHER]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/attendance"
          element={
            <ProtectedRoute allowedRoles={[ROLES.TEACHER]}>
              <AttendanceManagement role="teacher" />
            </ProtectedRoute>
          }
        />
        <Route path="/teacher/marks" element={<ProtectedRoute allowedRoles={[ROLES.TEACHER]}><MarksEntry /></ProtectedRoute>} />

        {/* Protected Guardian Routes */}
        <Route
          path="/guardian/*"
          element={
            <ProtectedRoute allowedRoles={[ROLES.GUARDIAN]}>
              <GuardianDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/guardian/attendance"
          element={
            <ProtectedRoute allowedRoles={[ROLES.GUARDIAN]}>
              <GuardianAttendance />
            </ProtectedRoute>
          }
        />
        <Route path="/guardian/results" element={<ProtectedRoute allowedRoles={[ROLES.GUARDIAN]}><GuardianResults /></ProtectedRoute>} />
        <Route path="/guardian/fees" element={<ProtectedRoute allowedRoles={[ROLES.GUARDIAN]}><GuardianFees /></ProtectedRoute>} />

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
