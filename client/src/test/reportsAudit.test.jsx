import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Reports from '@/pages/admin/Reports.jsx';
import AuditLogs from '@/pages/admin/AuditLogs.jsx';
import AuthContext from '@/context/AuthContext.jsx';

vi.mock('@/components/layout/AppLayout.jsx', () => ({
  AppLayout: ({ children, title }) => <main><h1>{title}</h1>{children}</main>,
}));

vi.mock('@/services/academicService.js', () => ({
  default: { getClasses: vi.fn() },
}));

vi.mock('@/services/reportsService.js', () => ({
  default: {
    getStudents: vi.fn(),
    getAttendance: vi.fn(),
    getExaminations: vi.fn(),
    getFees: vi.fn(),
  },
}));

vi.mock('@/services/auditService.js', () => ({
  default: { getLogs: vi.fn() },
}));

vi.mock('@/utils/toast.js', () => ({
  showToast: { error: vi.fn() },
}));

import academicService from '@/services/academicService.js';
import reportsService from '@/services/reportsService.js';
import auditService from '@/services/auditService.js';

const provider = (children) => <AuthContext.Provider value={{ user: { name: 'Admin', role: 'admin' }, logout: vi.fn() }}>{children}</AuthContext.Provider>;

describe('Phase 10 report and audit interfaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    academicService.getClasses.mockResolvedValue({ success: true, data: [] });
    reportsService.getStudents.mockResolvedValue({ success: true, data: { records: [], distribution: [], summary: { totalStudents: 0 } } });
    reportsService.getAttendance.mockResolvedValue({ success: true, data: { summary: { attendanceRate: 0 }, byClass: [] } });
    reportsService.getExaminations.mockResolvedValue({ success: true, data: [] });
    reportsService.getFees.mockResolvedValue({ success: true, data: { summary: { totalOutstanding: 0 }, byClass: [] } });
    auditService.getLogs.mockResolvedValue({ success: true, data: { logs: [], actors: [], pagination: { page: 1, limit: 20, total: 0, pages: 1 } } });
  });

  it('renders data-backed report sections and empty states', async () => {
    render(provider(<Reports />));
    expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('No student data')).toBeInTheDocument());
    expect(reportsService.getStudents).toHaveBeenCalled();
    expect(screen.getByText('No attendance data')).toBeInTheDocument();
  });

  it('renders the audit trail empty state and requests logs', async () => {
    render(provider(<AuditLogs />));
    expect(screen.getByRole('heading', { name: 'Audit Trail' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('No audit activity')).toBeInTheDocument());
    expect(auditService.getLogs).toHaveBeenCalled();
  });
});
