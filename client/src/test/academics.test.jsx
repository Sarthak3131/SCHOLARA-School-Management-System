import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import StudentsManagement from '@/pages/admin/StudentsManagement.jsx';
import TeachersManagement from '@/pages/admin/TeachersManagement.jsx';
import AcademicManagement from '@/pages/admin/AcademicManagement.jsx';
import AuthContext from '@/context/AuthContext.jsx';
import studentService from '@/services/studentService.js';
import teacherService from '@/services/teacherService.js';
import academicService from '@/services/academicService.js';

vi.mock('@/services/studentService.js', () => ({
  default: {
    getStudents: vi.fn(),
    getStudentById: vi.fn(),
    createStudent: vi.fn(),
    updateStudent: vi.fn(),
    deleteStudent: vi.fn(),
  },
}));

vi.mock('@/services/teacherService.js', () => ({
  default: {
    getTeachers: vi.fn(),
    getTeacherById: vi.fn(),
    createTeacher: vi.fn(),
    updateTeacher: vi.fn(),
    assignClasses: vi.fn(),
    deleteTeacher: vi.fn(),
  },
}));

vi.mock('@/services/academicService.js', () => ({
  default: {
    getClasses: vi.fn(),
    createClass: vi.fn(),
    updateClass: vi.fn(),
    updateClass: vi.fn(),
    deleteClass: vi.fn(),
    getSubjects: vi.fn(),
    createSubject: vi.fn(),
    updateSubject: vi.fn(),
    deleteSubject: vi.fn(),
    getGuardians: vi.fn(),
  },
}));

vi.mock('@/utils/toast.js', () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('SCHOLARA Academic and User Management Component Suite', () => {
  const adminUser = { name: 'Dr. Arthur Vance', role: 'admin', email: 'admin@scholara.edu' };

  beforeEach(() => {
    vi.clearAllMocks();

    studentService.getStudents.mockResolvedValue({
      success: true,
      data: [
        {
          _id: 'stu-1',
          name: 'Alexander Wright',
          admissionNumber: 'SCH-2024-001',
          rollNumber: '10A-01',
          class: { _id: 'c1', name: 'Grade 10', code: 'GR10' },
          section: 'A',
          gender: 'male',
          status: 'active',
          guardian: { name: 'David Miller', phone: '+91 98765 43212' },
        },
      ],
      pagination: { total: 1, page: 1, limit: 10 },
    });

    teacherService.getTeachers.mockResolvedValue({
      success: true,
      data: [
        {
          _id: 't-1',
          employeeId: 'FAC-101',
          specialization: 'Mathematics',
          qualification: 'M.Sc., B.Ed.',
          status: 'active',
          user: { name: 'Clara Oswald', email: 'teacher@scholara.edu' },
          assignedClasses: [{ class: { name: 'Grade 10' }, section: 'A', subject: 'Mathematics' }],
        },
      ],
      pagination: { total: 1, page: 1, limit: 10 },
    });

    academicService.getClasses.mockResolvedValue({
      success: true,
      data: [
        { _id: 'c1', name: 'Grade 10', code: 'GR10', sections: [{ name: 'A', capacity: 35 }], studentCount: 32 },
      ],
    });

    academicService.getSubjects.mockResolvedValue({
      success: true,
      data: [
        { _id: 's1', name: 'Mathematics', code: 'MATH-10', department: 'Mathematics', weeklyPeriods: 6, credits: 4, type: 'theory' },
      ],
    });

    academicService.getGuardians.mockResolvedValue({
      success: true,
      data: [{ _id: 'g1', name: 'David Miller', email: 'guardian@scholara.edu' }],
    });
  });

  describe('StudentsManagement', () => {
    it('renders pupil directory, search input, and enroll button', async () => {
      render(
        <BrowserRouter>
          <AuthContext.Provider value={{ user: adminUser, logout: vi.fn() }}>
            <StudentsManagement />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      expect(screen.getByText(/Active Student Roster/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Search by name, adm #, roll.../i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Enroll New Student/i })).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Alexander Wright')).toBeInTheDocument();
        expect(screen.getByText('SCH-2024-001')).toBeInTheDocument();
      });
    });

    it('opens enrollment modal when clicking Enroll New Student button', async () => {
      render(
        <BrowserRouter>
          <AuthContext.Provider value={{ user: adminUser, logout: vi.fn() }}>
            <StudentsManagement />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      const enrollBtn = screen.getByRole('button', { name: /Enroll New Student/i });
      fireEvent.click(enrollBtn);

      expect(screen.getByText(/New Student Admission & Enrollment/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Student Full Legal Name/i)).toBeInTheDocument();
    });
  });

  describe('TeachersManagement', () => {
    it('renders faculty directory, educator table, and register button', async () => {
      render(
        <BrowserRouter>
          <AuthContext.Provider value={{ user: adminUser, logout: vi.fn() }}>
            <TeachersManagement />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      expect(screen.getByText(/Academic Faculty Directory/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Register Faculty Member/i })).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Clara Oswald')).toBeInTheDocument();
        expect(screen.getByText('FAC-101')).toBeInTheDocument();
        expect(screen.getByText('Mathematics')).toBeInTheDocument();
      });
    });
  });

  describe('AcademicManagement', () => {
    it('renders tabs and toggles between Classes and Subjects view', async () => {
      render(
        <BrowserRouter>
          <AuthContext.Provider value={{ user: adminUser, logout: vi.fn() }}>
            <AcademicManagement />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      expect(screen.getByRole('button', { name: /^Classes & Sections/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Curriculum Subjects/i })).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('GR10')).toBeInTheDocument();
        expect(screen.getByText('Grade 10')).toBeInTheDocument();
      });

      // Switch to subjects tab
      const subjectsTab = screen.getByRole('button', { name: /Curriculum Subjects/i });
      fireEvent.click(subjectsTab);

      await waitFor(() => {
        expect(screen.getByText('MATH-10')).toBeInTheDocument();
        expect(screen.getAllByRole('cell', { name: 'Mathematics' }).length).toBeGreaterThan(0);
      });
    });
  });
});
