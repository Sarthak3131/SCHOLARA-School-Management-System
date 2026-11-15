import { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  BookOpen,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Layers,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout.jsx';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Select } from '@/components/ui/Select.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Modal } from '@/components/ui/Modal.jsx';
import {
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableLoadingState,
  TableEmptyState,
  TablePagination,
} from '@/components/ui/Table.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import teacherService from '@/services/teacherService.js';
import academicService from '@/services/academicService.js';
import { showToast } from '@/utils/toast.js';

export const TeachersManagement = () => {
  const { user, logout } = useAuth();

  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register Form State
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: 'Teacher@123',
    phone: '',
    employeeId: '',
    specialization: '',
    qualification: '',
  });
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    specialization: '',
    qualification: '',
    status: 'active',
  });

  // Assignments Form State
  const [assignments, setAssignments] = useState([]);

  // Fetch Lookups (Classes & Subjects)
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [classesRes, subjectsRes] = await Promise.all([
          academicService.getClasses(),
          academicService.getSubjects(),
        ]);
        if (classesRes.success) setClasses(classesRes.data);
        if (subjectsRes.success) setSubjects(subjectsRes.data);
      } catch (err) {
        console.error('Error fetching lookups:', err);
      }
    };
    fetchLookups();
  }, []);

  // Fetch Teachers
  const fetchTeachers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await teacherService.getTeachers({
        page,
        limit,
        search,
        status: statusFilter,
      });
      if (res.success) {
        setTeachers(res.data);
        setTotal(res.pagination?.total || 0);
      }
    } catch (err) {
      showToast.error(err.message || 'Could not load faculty directory.');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // Open assignment modal
  const handleOpenAssignModal = (teacher) => {
    setSelectedTeacher(teacher);
    // Prepare existing assignments
    const currentAssignments = (teacher.assignedClasses || []).map((ac) => ({
      class: ac.class?._id || ac.class || '',
      section: ac.section || 'A',
      subject: ac.subject || '',
    }));
    setAssignments(currentAssignments.length > 0 ? currentAssignments : [{ class: classes[0]?._id || '', section: 'A', subject: subjects[0]?.name || 'Mathematics' }]);
    setIsAssignModalOpen(true);
  };

  const handleOpenEditModal = (teacher) => {
    setSelectedTeacher(teacher);
    setEditForm({
      name: teacher.user?.name || '',
      phone: teacher.user?.phone || '',
      specialization: teacher.specialization || '',
      qualification: teacher.qualification || '',
      status: teacher.status || 'active',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeacher || !editForm.name.trim() || !editForm.specialization.trim() || !editForm.qualification.trim()) {
      showToast.error('Name, specialization, and qualification are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await teacherService.updateTeacher(selectedTeacher._id, editForm);
      showToast.success(`Updated faculty record for ${editForm.name}.`);
      setIsEditModalOpen(false);
      await fetchTeachers();
    } catch (err) {
      showToast.error(err.message || 'Faculty update failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedTeacher) return;
    setIsSubmitting(true);
    try {
      await teacherService.deleteTeacher(selectedTeacher._id);
      showToast.success(`Deactivated ${selectedTeacher.user?.name || 'faculty educator'}.`);
      setIsDeactivateModalOpen(false);
      await fetchTeachers();
    } catch (err) {
      showToast.error(err.message || 'Faculty deactivation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add assignment row
  const handleAddAssignmentRow = () => {
    setAssignments([
      ...assignments,
      { class: classes[0]?._id || '', section: 'A', subject: subjects[0]?.name || 'Mathematics' },
    ]);
  };

  // Remove assignment row
  const handleRemoveAssignmentRow = (idx) => {
    setAssignments(assignments.filter((_, i) => i !== idx));
  };

  // Submit assignments
  const handleSaveAssignments = async () => {
    if (!selectedTeacher) return;
    setIsSubmitting(true);
    try {
      await teacherService.assignClasses(selectedTeacher._id, assignments);
      showToast.success(`Updated workload assignments for ${selectedTeacher.user?.name || 'teacher'}.`);
      setIsAssignModalOpen(false);
      fetchTeachers();
    } catch (err) {
      showToast.error(err.message || 'Failed to update assignments.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit register new teacher
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerForm.name || !registerForm.email) {
      showToast.error('Educator name and institutional email are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await teacherService.createTeacher(registerForm);
      showToast.success(`Registered faculty educator ${registerForm.name}.`);
      setIsRegisterModalOpen(false);
      setRegisterForm({
        name: '',
        email: '',
        password: 'Teacher@123',
        phone: '',
        employeeId: '',
        specialization: '',
        qualification: '',
      });
      fetchTeachers();
    } catch (err) {
      showToast.error(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout
      role="admin"
      title="Faculty & Workload Governance"
      subtitle="Educator Directories, Departmental Qualifications & Classroom Allocations"
      user={user}
      onLogout={logout}
    >
      <div className="space-y-6 pb-12">
        {/* Top Header Card */}
        <div className="bg-white rounded-lg border border-sage p-5 sm:p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="gold" size="sm" className="font-mono">
                FACULTY BODY
              </Badge>
              <span className="text-2xs text-muted font-mono">
                {total} Registered Academic Instructors
              </span>
            </div>
            <h2 className="font-editorial text-2xl font-bold text-charcoal">
              Academic Faculty Directory
            </h2>
          </div>

          <Button
            variant="primary"
            leftIcon={Plus}
            onClick={() => setIsRegisterModalOpen(true)}
          >
            Register Faculty Member
          </Button>
        </div>

        {/* Filter Controls Bar */}
        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-muted absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by faculty name, ID, or subject..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-ivory rounded border border-sage-dark text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-ivory rounded border border-sage-dark text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-forest"
              >
                <option value="">All Faculty Statuses</option>
                <option value="active">Active Faculty</option>
                <option value="on_leave">On Sabbatical / Leave</option>
                <option value="resigned">Resigned / Former</option>
              </select>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setPage(1);
                }}
              >
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Teachers Table */}
        <TableContainer>
          <Table>
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Faculty Educator</Th>
                <Th>Specialization & Degrees</Th>
                <Th>Assigned Classroom Workload</Th>
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {isLoading ? (
                <TableLoadingState rows={5} cols={6} />
              ) : teachers.length === 0 ? (
                <TableEmptyState
                  title="No educators registered"
                  description="Register new teaching faculty to assign curricula and classrooms."
                  action={
                    <Button variant="gold" size="sm" leftIcon={Plus} onClick={() => setIsRegisterModalOpen(true)}>
                      Register Educator
                    </Button>
                  }
                  colSpan={6}
                />
              ) : (
                teachers.map((t) => (
                  <Tr key={t._id}>
                    <Td className="font-mono text-xs font-semibold text-forest whitespace-nowrap">
                      {t.employeeId}
                    </Td>
                    <Td>
                      <span className="font-editorial text-sm font-semibold text-charcoal block">
                        {t.user?.name || 'Educator'}
                      </span>
                      <span className="text-2xs text-muted font-mono block">
                        {t.user?.email}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-xs text-charcoal font-medium block">
                        {t.specialization || 'General'}
                      </span>
                      <span className="text-2xs text-muted block">
                        {t.qualification || 'B.Ed.'}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {(t.assignedClasses || []).length === 0 ? (
                          <span className="text-2xs text-muted font-mono italic">No classrooms assigned</span>
                        ) : (
                          t.assignedClasses.map((ac, idx) => (
                            <Badge key={idx} variant="sage" size="sm" className="font-mono text-2xs">
                              {ac.class?.name || 'Class'}–{ac.section} ({ac.subject})
                            </Badge>
                          ))
                        )}
                      </div>
                    </Td>
                    <Td>
                      <Badge
                        variant={t.status === 'active' ? 'success' : 'warning'}
                        size="sm"
                        dot
                        className="capitalize"
                      >
                        {t.status.replace('_', ' ')}
                      </Badge>
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={Edit2}
                          onClick={() => handleOpenEditModal(t)}
                          title="Edit Faculty Profile"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={Layers}
                          onClick={() => handleOpenAssignModal(t)}
                          title="Assign Classes and Subjects"
                        >
                          Workload
                        </Button>
                        {t.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTeacher(t);
                              setIsDeactivateModalOpen(true);
                            }}
                            title="Deactivate Faculty"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-danger" />
                          </Button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
          <TablePagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={(p) => setPage(p)}
          />
        </TableContainer>

        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Faculty: ${selectedTeacher?.user?.name || 'Educator'}`}
          description="Update the faculty profile without changing institutional credentials"
          size="md"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" isLoading={isSubmitting} onClick={handleEditSubmit}>Save Changes</Button>
            </>
          }
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input label="Full Legal Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            <Input label="Contact Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Academic Specialization" value={editForm.specialization} onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })} required />
              <Input label="Degrees & Qualifications" value={editForm.qualification} onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })} required />
            </div>
            <Select label="Faculty Status" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} options={[
              { value: 'active', label: 'Active Faculty' },
              { value: 'on_leave', label: 'On Leave' },
              { value: 'resigned', label: 'Resigned / Former' },
            ]} />
          </form>
        </Modal>

        <Modal
          isOpen={isDeactivateModalOpen}
          onClose={() => setIsDeactivateModalOpen(false)}
          title="Deactivate Faculty Account"
          description="This revokes the educator's active account and preserves their records."
          size="sm"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsDeactivateModalOpen(false)}>Cancel</Button>
              <Button variant="danger" size="sm" isLoading={isSubmitting} onClick={handleDeactivate}>Confirm Deactivation</Button>
            </>
          }
        >
          <p className="text-sm text-charcoal">
            Deactivate <strong>{selectedTeacher?.user?.name || 'this faculty educator'}</strong>?
          </p>
        </Modal>

        {/* ── Register Teacher Modal ─────────────────────────────────────── */}
        <Modal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          title="Register Academic Faculty Member"
          description="Creates verified educator user account and institutional teaching profile"
          size="md"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsRegisterModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" isLoading={isSubmitting} onClick={handleRegisterSubmit}>
                Confirm & Register
              </Button>
            </>
          }
        >
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <Input
              label="Full Legal Name"
              name="teacherName"
              placeholder="e.g. Dr. Alistair Finch"
              value={registerForm.name}
              onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Institutional Email"
                name="teacherEmail"
                type="email"
                placeholder="a.finch@scholara.edu"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                required
              />
              <Input
                label="Temporary Password"
                name="teacherPassword"
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Employee ID (Optional)"
                name="employeeId"
                placeholder="Auto-generated if blank"
                value={registerForm.employeeId}
                onChange={(e) => setRegisterForm({ ...registerForm, employeeId: e.target.value })}
              />
              <Input
                label="Contact Phone"
                name="teacherPhone"
                placeholder="+91 98765 43210"
                value={registerForm.phone}
                onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Academic Specialization"
                name="specialization"
                placeholder="e.g. Physics & Mechanics"
                value={registerForm.specialization}
                onChange={(e) => setRegisterForm({ ...registerForm, specialization: e.target.value })}
                required
              />
              <Input
                label="Degrees & Qualifications"
                name="qualification"
                placeholder="e.g. M.Sc. Physics, Ph.D."
                value={registerForm.qualification}
                onChange={(e) => setRegisterForm({ ...registerForm, qualification: e.target.value })}
                required
              />
            </div>
          </form>
        </Modal>

        {/* ── Assign Classes & Subjects Modal ────────────────────────────── */}
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title={`Assign Classrooms: ${selectedTeacher?.user?.name || 'Educator'}`}
          description={`Employee ID #${selectedTeacher?.employeeId} • Manage teaching periods and classroom access boundaries`}
          size="lg"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" isLoading={isSubmitting} onClick={handleSaveAssignments}>
                Save Assignments
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-3 rounded bg-ivory border border-sage text-xs text-muted flex items-center justify-between">
              <span>
                Configured assignments govern which classrooms this educator can record attendance for.
              </span>
              <Button variant="gold" size="sm" leftIcon={Plus} onClick={handleAddAssignmentRow}>
                Add Assignment
              </Button>
            </div>

            <div className="space-y-3">
              {assignments.map((row, idx) => (
                <div key={idx} className="p-3 rounded bg-white border border-sage grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-5">
                    <label className="text-2xs font-semibold uppercase text-muted block mb-1">Class</label>
                    <select
                      value={row.class}
                      onChange={(e) => {
                        const updated = [...assignments];
                        updated[idx].class = e.target.value;
                        setAssignments(updated);
                      }}
                      className="w-full px-2.5 py-1.5 bg-ivory rounded border border-sage text-xs text-charcoal"
                    >
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-2xs font-semibold uppercase text-muted block mb-1">Section</label>
                    <select
                      value={row.section}
                      onChange={(e) => {
                        const updated = [...assignments];
                        updated[idx].section = e.target.value;
                        setAssignments(updated);
                      }}
                      className="w-full px-2.5 py-1.5 bg-ivory rounded border border-sage text-xs text-charcoal"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>

                  <div className="col-span-4">
                    <label className="text-2xs font-semibold uppercase text-muted block mb-1">Subject</label>
                    <select
                      value={row.subject}
                      onChange={(e) => {
                        const updated = [...assignments];
                        updated[idx].subject = e.target.value;
                        setAssignments(updated);
                      }}
                      className="w-full px-2.5 py-1.5 bg-ivory rounded border border-sage text-xs text-charcoal"
                    >
                      {subjects.map((sub) => (
                        <option key={sub._id} value={sub.name}>
                          {sub.name} ({sub.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-1 pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveAssignmentRow(idx)}
                      className="text-danger hover:text-danger/80 p-1"
                      title="Remove Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default TeachersManagement;
