import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from '@/pages/auth/Login.jsx';
import ProtectedRoute from '@/components/auth/ProtectedRoute.jsx';
import AuthContext from '@/context/AuthContext.jsx';

// Mock toast to avoid side effects
vi.mock('@/utils/toast.js', () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('SCHOLARA Authentication & RBAC Frontend Suite', () => {
  describe('Login Page', () => {
    it('renders login form, brand insignia, and quick-fill demo chips', () => {
      render(
        <BrowserRouter>
          <AuthContext.Provider value={{ login: vi.fn() }}>
            <Login />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      expect(screen.getByText('SCHOLARA')).toBeInTheDocument();
      expect(screen.getByLabelText(/Institutional Email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign In to Scholara/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Admin' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Teacher' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Guardian' })).toBeInTheDocument();
    });

    it('populates fields when demo role button is clicked', () => {
      render(
        <BrowserRouter>
          <AuthContext.Provider value={{ login: vi.fn() }}>
            <Login />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      const adminBtn = screen.getByRole('button', { name: 'Admin' });
      fireEvent.click(adminBtn);

      const emailInput = screen.getByLabelText(/Institutional Email/i);
      const passwordInput = screen.getByPlaceholderText('••••••••');

      expect(emailInput.value).toBe('admin@scholara.edu');
      expect(passwordInput.value).toBe('Admin@123');

      // Click Teacher
      const teacherBtn = screen.getByRole('button', { name: 'Teacher' });
      fireEvent.click(teacherBtn);
      expect(emailInput.value).toBe('teacher@scholara.edu');
      expect(passwordInput.value).toBe('Teacher@123');
    });

    it('shows validation error when submitting with empty credentials', async () => {
      render(
        <BrowserRouter>
          <AuthContext.Provider value={{ login: vi.fn() }}>
            <Login />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      const submitBtn = screen.getByRole('button', { name: /Sign In to Scholara/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Please provide both institutional email and password/i);
      });
    });
  });

  describe('ProtectedRoute & RBAC Boundary', () => {
    it('redirects unauthenticated user to login', () => {
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AuthContext.Provider
            value={{
              user: null,
              isAuthenticated: false,
              isLoading: false,
              logout: vi.fn(),
            }}
          >
            <Routes>
              <Route path="/login" element={<div>LOGIN_PAGE</div>} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <div>ADMIN_SECRET_CONTENT</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByText('LOGIN_PAGE')).toBeInTheDocument();
      expect(screen.queryByText('ADMIN_SECRET_CONTENT')).not.toBeInTheDocument();
    });

    it('blocks user with unauthorized role and renders 403 Forbidden screen', () => {
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AuthContext.Provider
            value={{
              user: { name: 'David Miller', role: 'guardian', email: 'guardian@scholara.edu' },
              isAuthenticated: true,
              isLoading: false,
              logout: vi.fn(),
            }}
          >
            <Routes>
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <div>ADMIN_SECRET_CONTENT</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByText(/403 • ACCESS FORBIDDEN/i)).toBeInTheDocument();
      expect(screen.getByText(/Restricted Module/i)).toBeInTheDocument();
      expect(screen.queryByText('ADMIN_SECRET_CONTENT')).not.toBeInTheDocument();
    });

    it('allows access when user role matches allowed roles', () => {
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AuthContext.Provider
            value={{
              user: { name: 'Dr. Arthur Vance', role: 'admin', email: 'admin@scholara.edu' },
              isAuthenticated: true,
              isLoading: false,
              logout: vi.fn(),
            }}
          >
            <Routes>
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <div>ADMIN_SECRET_CONTENT</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByText('ADMIN_SECRET_CONTENT')).toBeInTheDocument();
    });
  });
});
