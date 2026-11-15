import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  UserCheck,
  CreditCard,
  BookOpen,
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
import studentService from '@/services/studentService.js';
import academicService from '@/services/academicService.js';
import { showToast } from '@/utils/toast.js';
import { formatCurrency, formatDate } from '@/utils/helpers.js';

export const StudentsManagement = () => {
  const { user, logout } = useAuth();

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [guardians, setGuardians] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const initialFormState = {
    id: null,
    name: '',
    admissionNumber: '',
    rollNumber: '',
    classId: '',
    section: 'A',
    gender: 'male',
    dob: '',
    guardian: '',
    email: '',
    phone: '',
    bloodGroup: '',
    address: '',
    status: 'active',
  };
  const [formData, setFormData] = useState(initialFormState);

  // Fetch dropdown lookups (classes, guardians)
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [classesRes, guardiansRes] = await Promise.all([
          academicService.getClasses(),
          academicService.getGuardians(),
        ]);
        if (classesRes.success) setClasses(classesRes.data);
        if (guardiansRes.success) setGuardians(guardiansRes.data);
      } catch (err) {
        console.error('Error fetching academic lookups:', err);
      }
    };
    fetchLookups();
  }, []);

  // Fetch paginated students
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await studentService.getStudents({
        page,
        limit,
        search,
        classId: selectedClass,
        status: selectedStatus,
      });
      if (res.success) {
        setStudents(res.data);
        setTotal(res.pagination?.total || 0);
      }
    } catch (err) {
      showToast.error(err.message || 'Failed to retrieve students roster.');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, selectedClass, selectedStatus]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Handle open add modal
  const handleOpenAddModal = () => {
    setFormData({
      ...initialFormState,
      classId: classes[0]?._id || '',
    });
    setIsFormModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (stu) => {
    setFormData({
      id: stu._id,
      name: stu.name,
      admissionNumber: stu.admissionNumber,
      rollNumber: stu.rollNumber || '',
      classId: stu.class?._id || stu.class || '',
      section: stu.section || 'A',
      gender: stu.gender || 'male',
      dob: stu.dob ? new Date(stu.dob).toISOString().split('T')[0] : '',
      guardian: stu.guardian?._id || stu.guardian || '',
      email: stu.email || '',
      phone: stu.phone || '',
      bloodGroup: stu.bloodGroup || '',
      address: stu.address || '',
      status: stu.status || 'active',
    });
    setIsFormModalOpen(true);
  };

  // Handle open profile view modal
  const handleOpenProfileModal = async (stu) => {
    setSelectedStudent(stu);
    setIsProfileModalOpen(true);
    try {
      const res = await studentService.getStudentById(stu._id);
      if (res.success) {
        setStudentDetails(res.data);
      }
    } catch (err) {
      showToast.error('Could not load student detailed telemetry.');
    }
  };

  // Handle submit form (Create or Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.classId) {
      showToast.error('Student name and Class assignment are mandatory.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (formData.id) {
        await studentService.updateStudent(formData.id, formData);
        showToast.success(`Updated student record for ${formData.name}`);
      } else {
        await studentService.createStudent(formData);
        showToast.success(`Successfully enrolled ${formData.name}`);
      }
      setIsFormModalOpen(false);
      fetchStudents();
    } catch (err) {
      showToast.error(err.message || 'Operation failed. Please verify form inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deactivate
  const handleDeactivate = async (id, name) => {
    if (window.confirm(`Are you sure you want to deactivate student ${name}?`)) {
      try {
        await studentService.deleteStudent(id);
        showToast.success(`Deactivated student record for ${name}`);
        fetchStudents();
      } catch (err) {
        showToast.error(err.message || 'Deactivation failed.');
      }
    }
  };

  return (
    <AppLayout
      role="admin"
      title="Student Registry & Admissions"
      subtitle="Complete Student Dossiers, Section Placement & Guardian Associations"
      user={user}
      onLogout={logout}
    >
      <div className="space-y-6 pb-12">
        {/* Top Header Card */}
        <div className="bg-white rounded-lg border border-sage p-5 sm:p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="forest" size="sm" className="font-mono">
                PUPIL DIRECTORY
              </Badge>
              <span className="text-2xs text-muted font-mono">
                {total} Total Enrolled Pupils
              </span>
            </div>
            <h2 className="font-editorial text-2xl font-bold text-charcoal">
              Active Student Roster
            </h2>
          </div>

          <Button
            variant="primary"
            leftIcon={Plus}
            onClick={handleOpenAddModal}
          >
            Enroll New Student
          </Button>
        </div>

        {/* Filter Controls Bar */}
        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-muted absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by name, adm #, roll..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-ivory rounded border border-sage-dark text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest"
                />
              </div>

              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-ivory rounded border border-sage-dark text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-forest"
              >
                <option value="">All Academic Classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-ivory rounded border border-sage-dark text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-forest"
              >
                <option value="">All Enrollment Statuses</option>
                <option value="active">Active Status</option>
                <option value="inactive">Inactive / Suspended</option>
                <option value="transferred">Transferred</option>
                <option value="graduated">Graduated</option>
              </select>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSelectedClass('');
                  setSelectedStatus('');
                  setPage(1);
                }}
              >
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Students Data Table */}
        <TableContainer>
          <Table>
            <Thead>
              <Tr>
                <Th>Adm #</Th>
                <Th>Student Legal Name</Th>
                <Th>Class & Section</Th>
                <Th>Gender</Th>
                <Th>Guardian</Th>
                <Th>Status</Th>
                <Th align="right">Management Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {isLoading ? (
                <TableLoadingState rows={6} cols={7} />
              ) : students.length === 0 ? (
                <TableEmptyState
                  title="No student records match criteria"
                  description="Adjust your search or filter parameters, or enroll a new student."
                  action={
                    <Button variant="gold" size="sm" leftIcon={Plus} onClick={handleOpenAddModal}>
                      Enroll First Student
                    </Button>
                  }
                  colSpan={7}
                />
              ) : (
                students.map((stu) => (
                  <Tr key={stu._id}>
                    <Td className="font-mono text-xs font-semibold text-forest whitespace-nowrap">
                      {stu.admissionNumber}
                    </Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => handleOpenProfileModal(stu)}
                        className="font-editorial text-sm font-semibold text-charcoal hover:text-forest transition-colors text-left"
                      >
                        {stu.name}
                      </button>
                      {stu.rollNumber && (
                        <span className="block text-2xs text-muted font-mono">Roll: {stu.rollNumber}</span>
                      )}
                    </Td>
                    <Td>
                      <span className="font-medium text-xs text-charcoal">
                        {stu.class?.name || 'Class'}
                      </span>
                      <span className="text-2xs text-muted ml-1.5 font-mono font-semibold">
                        Sec {stu.section}
                      </span>
                    </Td>
                    <Td className="capitalize text-xs text-muted">
                      {stu.gender}
                    </Td>
                    <Td>
                      {stu.guardian ? (
                        <div>
                          <span className="text-xs font-medium text-charcoal block truncate max-w-[140px]">
                            {stu.guardian.name}
                          </span>
                          <span className="text-2xs font-mono text-muted block truncate max-w-[140px]">
                            {stu.guardian.phone || stu.guardian.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-2xs text-muted font-mono">Unassigned</span>
                      )}
                    </Td>
                    <Td>
                      <Badge
                        variant={
                          stu.status === 'active'
                            ? 'success'
                            : stu.status === 'inactive'
                            ? 'danger'
                            : 'sage'
                        }
                        size="sm"
                        dot
                        className="capitalize"
                      >
                        {stu.status}
                      </Badge>
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenProfileModal(stu)}
                          title="View Complete Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditModal(stu)}
                          title="Edit Information"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        {stu.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivate(stu._id, stu.name)}
                            title="Deactivate Student"
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

        {/* ── Add / Edit Student Modal ────────────────────────────────────── */}
        <Modal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          title={formData.id ? 'Edit Student Dossier' : 'New Student Admission & Enrollment'}
          description="Institutional enrollment registers pupil to selected cohort and assigns guardian"
          size="lg"
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsFormModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                onClick={handleFormSubmit}
              >
                {formData.id ? 'Save Updates' : 'Confirm & Enroll'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Student Full Legal Name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Liam Gallagher"
                required
              />

              <Input
                label="Admission Number"
                name="admissionNumber"
                value={formData.admissionNumber}
                onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                placeholder="Auto-generated if left blank"
                hint="e.g. SCH-2024-042"
              />

              <Select
                label="Class Level"
                name="classId"
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                required
              >
                <option value="">Select Academic Class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </Select>

              <Select
                label="Class Section"
                name="section"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                options={['A', 'B', 'C', 'D']}
                required
              />

              <Input
                label="Class Roll Number"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                placeholder="e.g. 10A-14"
              />

              <Select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
              />

              <Input
                label="Date of Birth"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              />

              <Select
                label="Assign Registered Guardian"
                name="guardian"
                value={formData.guardian}
                onChange={(e) => setFormData({ ...formData, guardian: e.target.value })}
              >
                <option value="">Select Associated Guardian</option>
                {guardians.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name} ({g.email})
                  </option>
                ))}
              </Select>

              <Input
                label="Personal Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@example.com"
              />

              <Input
                label="Emergency Contact Phone"
                name="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>

            <Input
              label="Residential Address"
              name="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full postal address"
            />
          </form>
        </Modal>

        {/* ── Student Profile Dossier Modal ──────────────────────────────── */}
        <Modal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          title={selectedStudent ? selectedStudent.name : 'Student Dossier'}
          description={selectedStudent ? `Admission #${selectedStudent.admissionNumber} • ${selectedStudent.class?.name || 'Class'} (Section ${selectedStudent.section})` : ''}
          size="lg"
          footer={
            <Button variant="secondary" size="sm" onClick={() => setIsProfileModalOpen(false)}>
              Close Dossier
            </Button>
          }
        >
          {studentDetails ? (
            <div className="space-y-6">
              {/* Telemetry Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded bg-ivory border border-sage text-center">
                  <span className="text-2xs text-muted uppercase font-mono block">Attendance Rate</span>
                  <span className="text-xl font-bold font-editorial text-forest">
                    {studentDetails.attendanceTelemetry?.attendanceRate}%
                  </span>
                  <span className="text-2xs text-muted block mt-0.5">
                    {studentDetails.attendanceTelemetry?.present} of {studentDetails.attendanceTelemetry?.totalDays} days
                  </span>
                </div>

                <div className="p-3.5 rounded bg-ivory border border-sage text-center">
                  <span className="text-2xs text-muted uppercase font-mono block">Status</span>
                  <Badge variant="success" size="sm" dot className="mt-1 capitalize">
                    {studentDetails.student?.status || 'Active'}
                  </Badge>
                  <span className="text-2xs text-muted block mt-1">Enrolled</span>
                </div>

                <div className="p-3.5 rounded bg-ivory border border-sage text-center">
                  <span className="text-2xs text-muted uppercase font-mono block">Invoices</span>
                  <span className="text-xl font-bold font-editorial text-charcoal">
                    {studentDetails.invoices?.length || 0}
                  </span>
                  <span className="text-2xs text-muted block mt-0.5">Generated</span>
                </div>
              </div>

              {/* Personal Details */}
              <div className="p-4 rounded bg-white border border-sage space-y-2 text-xs">
                <h4 className="font-semibold text-charcoal uppercase tracking-wider text-2xs font-mono text-forest mb-2">
                  Guardian & Personal Information
                </h4>
                <div className="grid grid-cols-2 gap-2 text-muted">
                  <div>
                    <span className="text-charcoal font-medium">Guardian: </span>
                    {studentDetails.student?.guardian?.name || 'Unassigned'}
                  </div>
                  <div>
                    <span className="text-charcoal font-medium">Guardian Phone: </span>
                    {studentDetails.student?.guardian?.phone || '—'}
                  </div>
                  <div>
                    <span className="text-charcoal font-medium">Guardian Email: </span>
                    {studentDetails.student?.guardian?.email || '—'}
                  </div>
                  <div>
                    <span className="text-charcoal font-medium">Student Contact: </span>
                    {studentDetails.student?.phone || '—'}
                  </div>
                </div>
              </div>

              {/* Recent Invoices Ledger */}
              <div>
                <h4 className="font-semibold text-charcoal uppercase tracking-wider text-2xs font-mono mb-2">
                  Fee Ledger History
                </h4>
                <div className="border border-sage rounded overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-ivory border-b border-sage text-muted font-mono uppercase text-2xs">
                      <tr>
                        <th className="p-2.5 text-left">Invoice #</th>
                        <th className="p-2.5 text-left">Term</th>
                        <th className="p-2.5 text-right">Invoiced</th>
                        <th className="p-2.5 text-right">Paid</th>
                        <th className="p-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sage/60">
                      {studentDetails.invoices?.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-muted">
                            No billing invoices on file.
                          </td>
                        </tr>
                      ) : (
                        studentDetails.invoices?.map((inv) => (
                          <tr key={inv._id}>
                            <td className="p-2.5 font-mono text-forest font-semibold">{inv.invoiceNumber}</td>
                            <td className="p-2.5 text-charcoal">{inv.academicTerm}</td>
                            <td className="p-2.5 text-right font-mono">{formatCurrency(inv.amount)}</td>
                            <td className="p-2.5 text-right font-mono">{formatCurrency(inv.paidAmount)}</td>
                            <td className="p-2.5 text-right">
                              <Badge
                                variant={inv.status === 'paid' ? 'success' : inv.status === 'partial' ? 'gold' : 'warning'}
                                size="sm"
                                className="uppercase text-2xs"
                              >
                                {inv.status}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-forest border-t-transparent animate-spin" />
            </div>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
};

export default StudentsManagement;
