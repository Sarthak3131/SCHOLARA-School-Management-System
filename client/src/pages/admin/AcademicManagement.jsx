import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Layers,
  GraduationCap,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
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
} from '@/components/ui/Table.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import academicService from '@/services/academicService.js';
import { showToast } from '@/utils/toast.js';

export const AcademicManagement = () => {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('classes'); // 'classes' | 'subjects'
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState(null);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [classForm, setClassForm] = useState({
    name: '',
    code: '',
    academicYear: '2024-2025',
    sectionNames: 'A, B',
    capacity: 35,
  });

  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    department: 'Mathematics',
    type: 'theory',
    weeklyPeriods: 5,
    credits: 4,
  });

  const fetchAcademicData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [classesRes, subjectsRes] = await Promise.all([
        academicService.getClasses(),
        academicService.getSubjects(),
      ]);
      if (classesRes.success) setClasses(classesRes.data);
      if (subjectsRes.success) setSubjects(subjectsRes.data);
    } catch (err) {
      showToast.error(err.message || 'Failed to retrieve academic structures.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAcademicData();
  }, [fetchAcademicData]);

  // Submit new class
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!classForm.name || !classForm.code) {
      showToast.error('Class title and unique code are required.');
      return;
    }

    const sections = classForm.sectionNames
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .map((name) => ({ name, capacity: Number(classForm.capacity) || 35 }));

    setIsSubmitting(true);
    try {
      const payload = {
        name: classForm.name,
        code: classForm.code,
        sections,
        academicYear: classForm.academicYear,
      };
      if (editingClassId) {
        await academicService.updateClass(editingClassId, payload);
        showToast.success(`Academic cohort ${classForm.name} updated.`);
      } else {
        await academicService.createClass(payload);
        showToast.success(`Academic cohort ${classForm.name} created.`);
      }
      setIsClassModalOpen(false);
      setEditingClassId(null);
      setClassForm({
        name: '',
        code: '',
        academicYear: '2024-2025',
        sectionNames: 'A, B',
        capacity: 35,
      });
      fetchAcademicData();
    } catch (err) {
      showToast.error(err.message || 'Failed to create class.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit new subject
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!subjectForm.name || !subjectForm.code) {
      showToast.error('Subject title and code are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSubjectId) {
        await academicService.updateSubject(editingSubjectId, subjectForm);
        showToast.success(`Curriculum subject ${subjectForm.name} updated.`);
      } else {
        await academicService.createSubject(subjectForm);
        showToast.success(`Curriculum subject ${subjectForm.name} registered.`);
      }
      setIsSubjectModalOpen(false);
      setEditingSubjectId(null);
      setSubjectForm({
        name: '',
        code: '',
        department: 'Mathematics',
        type: 'theory',
        weeklyPeriods: 5,
        credits: 4,
      });
      fetchAcademicData();
    } catch (err) {
      showToast.error(err.message || 'Failed to register subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenClassEdit = (cls) => {
    setEditingClassId(cls._id);
    setClassForm({
      name: cls.name || '',
      code: cls.code || '',
      academicYear: cls.academicYear || '2024-2025',
      sectionNames: (cls.sections || []).map((section) => section.name).join(', '),
      capacity: cls.sections?.[0]?.capacity || 35,
    });
    setIsClassModalOpen(true);
  };

  const handleOpenSubjectEdit = (subject) => {
    setEditingSubjectId(subject._id);
    setSubjectForm({
      name: subject.name || '',
      code: subject.code || '',
      department: subject.department || 'Mathematics',
      type: subject.type || 'theory',
      weeklyPeriods: subject.weeklyPeriods || 5,
      credits: subject.credits || 4,
    });
    setIsSubjectModalOpen(true);
  };

  // Delete class
  const handleDeleteClass = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete class ${name}?`)) {
      try {
        await academicService.deleteClass(id);
        showToast.success(`Class ${name} removed.`);
        fetchAcademicData();
      } catch (err) {
        showToast.error(err.message || 'Deletion prevented.');
      }
    }
  };

  // Delete subject
  const handleDeleteSubject = async (id, name) => {
    if (window.confirm(`Are you sure you want to deactivate subject ${name}?`)) {
      try {
        await academicService.deleteSubject(id);
        showToast.success(`Subject ${name} deactivated.`);
        fetchAcademicData();
      } catch (err) {
        showToast.error(err.message || 'Deactivation failed.');
      }
    }
  };

  return (
    <AppLayout
      role="admin"
      title="Academic Architecture & Curriculum"
      subtitle="Class Cohorts, Section Capacities & Subject Catalogs"
      user={user}
      onLogout={logout}
    >
      <div className="space-y-6 pb-12">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between border-b border-sage-dark pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('classes')}
              className={`px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider font-mono transition-all ${
                activeTab === 'classes'
                  ? 'bg-forest text-gold shadow-sm'
                  : 'bg-white text-muted hover:text-charcoal border border-sage'
              }`}
            >
              <span>Classes &amp; Sections ({classes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('subjects')}
              className={`px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider font-mono transition-all ${
                activeTab === 'subjects'
                  ? 'bg-forest text-gold shadow-sm'
                  : 'bg-white text-muted hover:text-charcoal border border-sage'
              }`}
            >
              Curriculum Subjects ({subjects.length})
            </button>
          </div>

          <div>
            {activeTab === 'classes' ? (
              <Button variant="primary" size="sm" leftIcon={Plus} onClick={() => { setEditingClassId(null); setIsClassModalOpen(true); }}>
                New Class Cohort
              </Button>
            ) : (
              <Button variant="gold" size="sm" leftIcon={Plus} onClick={() => { setEditingSubjectId(null); setIsSubjectModalOpen(true); }}>
                New Curriculum Subject
              </Button>
            )}
          </div>
        </div>

        {/* ── TAB 1: Classes & Sections ────────────────────────────────────── */}
        {activeTab === 'classes' && (
          <div className="space-y-4">
            <TableContainer>
              <Table>
                <Thead>
                  <Tr>
                    <Th>Code</Th>
                    <Th>Cohort Title</Th>
                    <Th>Configured Sections</Th>
                    <Th>Enrolled Pupils</Th>
                    <Th>Academic Session</Th>
                    <Th align="right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {isLoading ? (
                    <TableLoadingState rows={4} cols={6} />
                  ) : classes.length === 0 ? (
                    <TableEmptyState
                      title="No academic classes configured"
                      description="Initialize class cohorts to structure classrooms."
                      action={
                        <Button variant="gold" size="sm" leftIcon={Plus} onClick={() => setIsClassModalOpen(true)}>
                          Create Cohort
                        </Button>
                      }
                      colSpan={6}
                    />
                  ) : (
                    classes.map((cls) => (
                      <Tr key={cls._id}>
                        <Td className="font-mono text-xs font-semibold text-forest">
                          {cls.code}
                        </Td>
                        <Td className="font-editorial text-sm font-semibold text-charcoal">
                          {cls.name}
                        </Td>
                        <Td>
                          <div className="flex flex-wrap gap-1">
                            {cls.sections?.map((s) => (
                              <Badge key={s.name} variant="sage" size="sm" className="font-mono">
                                Sec {s.name} (Cap: {s.capacity})
                              </Badge>
                            ))}
                          </div>
                        </Td>
                        <Td>
                          <span className="font-semibold font-mono text-charcoal text-xs">
                            {cls.studentCount || 0}
                          </span>
                          <span className="text-2xs text-muted ml-1">enrolled</span>
                        </Td>
                        <Td className="font-mono text-xs text-muted">
                          {cls.academicYear || '2024-2025'}
                        </Td>
                        <Td align="right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenClassEdit(cls)}
                            title="Edit Class and Sections"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-forest" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClass(cls._id, cls.name)}
                            title="Delete Class"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-danger" />
                          </Button>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </div>
        )}

        {/* ── TAB 2: Curriculum Subjects ──────────────────────────────────── */}
        {activeTab === 'subjects' && (
          <div className="space-y-4">
            <TableContainer>
              <Table>
                <Thead>
                  <Tr>
                    <Th>Code</Th>
                    <Th>Subject Title</Th>
                    <Th>Department</Th>
                    <Th>Type</Th>
                    <Th>Periods/Wk</Th>
                    <Th>Credits</Th>
                    <Th align="right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {isLoading ? (
                    <TableLoadingState rows={4} cols={7} />
                  ) : subjects.length === 0 ? (
                    <TableEmptyState
                      title="No subjects registered"
                      description="Create curriculum courses for teachers and gradebooks."
                      colSpan={7}
                    />
                  ) : (
                    subjects.map((sub) => (
                      <Tr key={sub._id}>
                        <Td className="font-mono text-xs font-semibold text-forest">
                          {sub.code}
                        </Td>
                        <Td className="font-editorial text-sm font-semibold text-charcoal">
                          {sub.name}
                        </Td>
                        <Td className="text-xs text-muted font-medium">
                          {sub.department}
                        </Td>
                        <Td>
                          <Badge variant="sage" size="sm" className="capitalize text-2xs">
                            {sub.type}
                          </Badge>
                        </Td>
                        <Td className="font-mono text-xs text-charcoal font-semibold">
                          {sub.weeklyPeriods}
                        </Td>
                        <Td className="font-mono text-xs text-gold-dark font-bold">
                          {sub.credits}
                        </Td>
                        <Td align="right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenSubjectEdit(sub)}
                            title="Edit Subject"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-forest" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSubject(sub._id, sub.name)}
                            title="Deactivate Subject"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-danger" />
                          </Button>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </div>
        )}

        {/* ── Create Class Modal ─────────────────────────────────────────── */}
        <Modal
          isOpen={isClassModalOpen}
          onClose={() => setIsClassModalOpen(false)}
          title={editingClassId ? 'Edit Academic Class Cohort' : 'Create Academic Class Cohort'}
          description="Define new grade cohort, sections, and classroom capacities"
          size="md"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsClassModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" isLoading={isSubmitting} onClick={handleCreateClass}>
                {editingClassId ? 'Save Changes' : 'Create Cohort'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateClass} className="space-y-4">
            <Input
              label="Class Name"
              name="className"
              placeholder="e.g. Grade 10 Higher Secondary"
              value={classForm.name}
              onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Class Code"
                name="classCode"
                placeholder="e.g. GR10"
                value={classForm.code}
                onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
                disabled={Boolean(editingClassId)}
                required
              />
              <Input
                label="Academic Session"
                name="academicYear"
                value={classForm.academicYear}
                onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Sections (Comma separated)"
                name="sectionNames"
                placeholder="A, B, C"
                value={classForm.sectionNames}
                onChange={(e) => setClassForm({ ...classForm, sectionNames: e.target.value })}
                required
                hint="e.g. A, B"
              />
              <Input
                label="Capacity per Section"
                name="capacity"
                type="number"
                value={classForm.capacity}
                onChange={(e) => setClassForm({ ...classForm, capacity: e.target.value })}
                required
              />
            </div>
          </form>
        </Modal>

        {/* ── Create Subject Modal ───────────────────────────────────────── */}
        <Modal
          isOpen={isSubjectModalOpen}
          onClose={() => setIsSubjectModalOpen(false)}
          title={editingSubjectId ? 'Edit Curriculum Course Subject' : 'Register Curriculum Course Subject'}
          description="Define course title, code, departmental classification, and credit weight"
          size="md"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsSubjectModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" size="sm" isLoading={isSubmitting} onClick={handleCreateSubject}>
                {editingSubjectId ? 'Save Changes' : 'Register Subject'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateSubject} className="space-y-4">
            <Input
              label="Subject Name"
              name="subName"
              placeholder="e.g. Advanced Calculus & Analysis"
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Subject Code"
                name="subCode"
                placeholder="e.g. MATH-12"
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                required
              />
              <Select
                label="Department"
                name="subDept"
                value={subjectForm.department}
                onChange={(e) => setSubjectForm({ ...subjectForm, department: e.target.value })}
                options={[
                  'Mathematics',
                  'Natural Sciences',
                  'Humanities & Languages',
                  'Information Technology',
                  'Arts & Athletics',
                ]}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Select
                label="Delivery Type"
                name="subType"
                value={subjectForm.type}
                onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })}
                options={[
                  { value: 'theory', label: 'Theory' },
                  { value: 'practical', label: 'Lab/Practical' },
                  { value: 'both', label: 'Both' },
                ]}
              />
              <Input
                label="Weekly Periods"
                name="subPeriods"
                type="number"
                value={subjectForm.weeklyPeriods}
                onChange={(e) => setSubjectForm({ ...subjectForm, weeklyPeriods: e.target.value })}
              />
              <Input
                label="Credits"
                name="subCredits"
                type="number"
                value={subjectForm.credits}
                onChange={(e) => setSubjectForm({ ...subjectForm, credits: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default AcademicManagement;
