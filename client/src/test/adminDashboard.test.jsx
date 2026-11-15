import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '@/pages/admin/AdminDashboard.jsx';
import AuthContext from '@/context/AuthContext.jsx';
import dashboardService from '@/services/dashboardService.js';

// Mock dashboard service
vi.mock('@/services/dashboardService.js', () => ({
  default: {
    getAdminDashboard: vi.fn(),
  },
}));

// Mock toast to avoid errors
vi.mock('@/utils/toast.js', () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock ResizeObserver for Recharts
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('SCHOLARA Admin Dashboard Component Suite', () => {
  const mockDashboardData = {
    summary: {
      totalStudents: 1248,
      totalTeachers: 84,
      totalClasses: 36,
      activeEnrollments: 1248,
    },
    attendance: {
      today: {
        present: 1180,
        absent: 68,
        late: 12,
        marked: 1248,
        rate: 94.6,
      },
      trend: [
        { day: 'Mon', date: '2024-11-10', present: 18, absent: 2, rate: 90.0 },
        { day: 'Tue', date: '2024-11-11', present: 19, absent: 1, rate: 95.0 },
      ],
    },
    financial: {
      totalInvoiced: 4850000,
      totalCollected: 4125000,
      totalOutstanding: 725000,
      collectionRate: 85.1,
      paidInvoices: 16,
      pendingInvoices: 4,
      monthlyTrend: [
        { month: 'Oct', collected: 810000, pending: 120000 },
        { month: 'Nov', collected: 565000, pending: 250000 },
      ],
    },
    academic: {
      averageGPA: '3.62 / 4.0',
      passingRate: '97.6%',
      gradeDistribution: [
        { grade: 'A+', count: 28 },
        { grade: 'A', count: 42 },
      ],
    },
    classOverview: [
      { id: '1', name: 'Grade 10', sections: 'A, B', studentCount: 32, attendanceRate: 96.4 },
    ],
    recentActivities: [
      {
        id: 'act-1',
        action: 'ATTENDANCE_RECORDED',
        user: 'Clara Oswald',
        role: 'teacher',
        details: 'Daily attendance submitted for Grade 10-A',
        timestamp: new Date().toISOString(),
      },
    ],
    recentInvoices: [
      {
        id: 'inv-1',
        invoiceNumber: 'INV-2024-001',
        studentName: 'Alexander Wright',
        amount: 45000,
        paidAmount: 45000,
        status: 'paid',
        dueDate: new Date().toISOString(),
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dashboardService.getAdminDashboard.mockResolvedValue({
      success: true,
      data: mockDashboardData,
    });
  });

  it('renders institutional command header, KPI cards, and chart titles', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider
          value={{
            user: { name: 'Dr. Arthur Vance', role: 'admin', email: 'admin@scholara.edu' },
            logout: vi.fn(),
          }}
        >
          <AdminDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Institutional Command Overview/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Student Enrollment/i)).toBeInTheDocument();
      expect(screen.getByText('1,248')).toBeInTheDocument();
      expect(screen.getByText(/Active Faculty/i)).toBeInTheDocument();
      expect(screen.getByText('84')).toBeInTheDocument();
      expect(screen.getByText("Today's Attendance")).toBeInTheDocument();
      expect(screen.getByText('94.6%')).toBeInTheDocument();
      expect(screen.getByText(/Fee Realization/i)).toBeInTheDocument();
    });

    // Chart cards
    expect(screen.getByText(/Attendance Trajectory \(Last 7 Days\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Fee Invoicing & Recovery/i)).toBeInTheDocument();
    expect(screen.getByText(/Academic Evaluation Distribution/i)).toBeInTheDocument();
    expect(screen.getByText(/Class Section Attendance Breakdown/i)).toBeInTheDocument();
  });

  it('renders recent activities and recent invoices tables', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider
          value={{
            user: { name: 'Dr. Arthur Vance', role: 'admin', email: 'admin@scholara.edu' },
            logout: vi.fn(),
          }}
        >
          <AdminDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Recent Institutional Activities/i)).toBeInTheDocument();
      expect(screen.getByText('Clara Oswald')).toBeInTheDocument();
      expect(screen.getByText(/Daily attendance submitted for Grade 10-A/i)).toBeInTheDocument();

      expect(screen.getByText(/Recent Fee Invoices/i)).toBeInTheDocument();
      expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
      expect(screen.getByText('Alexander Wright')).toBeInTheDocument();
    });
  });

  it('opens fast student enrollment modal when action button is clicked', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider
          value={{
            user: { name: 'Dr. Arthur Vance', role: 'admin', email: 'admin@scholara.edu' },
            logout: vi.fn(),
          }}
        >
          <AdminDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    const enrollBtn = screen.getByRole('button', { name: /Enroll Student/i });
    fireEvent.click(enrollBtn);

    expect(screen.getByText('Fast Student Enrollment')).toBeInTheDocument();
    expect(screen.getByLabelText(/Student Legal Full Name/i)).toBeInTheDocument();
  });
});
