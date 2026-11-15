import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Check, Clock3, Filter, Save, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card.jsx';
import { StatCard } from '@/components/ui/StatCard.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Select } from '@/components/ui/Select.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Modal } from '@/components/ui/Modal.jsx';
import { TableContainer, Table, Thead, Tbody, Tr, Th, Td, TableEmptyState, TableLoadingState } from '@/components/ui/Table.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import attendanceService from '@/services/attendanceService.js';
import { showToast } from '@/utils/toast.js';

const today = new Date().toISOString().slice(0, 10);
const statuses = ['present', 'absent', 'late'];

const AttendanceManagement = ({ role = 'admin' }) => {
  const { user, logout } = useAuth();
  const [options, setOptions] = useState({ classes: [], assignments: [] });
  const [date, setDate] = useState(today);
  const [classId, setClassId] = useState('');
  const [section, setSection] = useState('');
  const [status, setStatus] = useState('');
  const [roster, setRoster] = useState([]);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const loadOptions = useCallback(async () => {
    if (role === 'guardian') return;
    try {
      const response = await attendanceService.getOptions();
      if (response.success) {
        setOptions(response.data);
        const firstAssignment = response.data.assignments?.[0];
        setClassId(firstAssignment?.class || response.data.classes?.[0]?._id || '');
        setSection(firstAssignment?.section || response.data.classes?.[0]?.sections?.[0]?.name || '');
      }
    } catch (error) {
      showToast.error(error.message || 'Attendance options could not be loaded.');
    }
  }, [role]);

  useEffect(() => { loadOptions(); }, [loadOptions]);

  const loadRoster = useCallback(async () => {
    if (!classId || !section) return;
    setIsLoading(true);
    try {
      const response = await attendanceService.getRoster({ classId, section, date });
      if (response.success) {
        const nextRoster = response.data.map((student) => ({ ...student, selectedStatus: student.attendance?.status || 'present' }));
        setRoster(nextRoster);
        const counts = nextRoster.reduce((result, student) => {
          result[student.selectedStatus] = (result[student.selectedStatus] || 0) + 1;
          return result;
        }, {});
        const total = nextRoster.length;
        setStats({
          total,
          present: counts.present || 0,
          absent: counts.absent || 0,
          late: counts.late || 0,
          attendanceRate: total ? Number(((counts.present || 0) / total * 100).toFixed(1)) : 0,
        });
      }
    } catch (error) {
      showToast.error(error.message || 'Attendance roster could not be loaded.');
      setRoster([]);
    } finally {
      setIsLoading(false);
    }
  }, [classId, section, date]);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await attendanceService.getAttendance({ date: role === 'admin' ? date : undefined, classId: role === 'admin' ? classId || undefined : undefined, section: role === 'admin' ? section || undefined : undefined, status: role === 'admin' ? status || undefined : undefined });
      if (response.success) {
        setRecords(response.data.records);
        setStats(response.data.stats);
      }
    } catch (error) {
      showToast.error(error.message || 'Attendance history could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [date, classId, section, status, role]);

  useEffect(() => {
    if (role === 'teacher') loadRoster();
    if (role === 'admin') loadHistory();
  }, [loadRoster, loadHistory, role]);

  const selectedClass = useMemo(() => options.classes.find((item) => item._id === classId), [options.classes, classId]);
  const sections = selectedClass?.sections || [];

  const updateRosterStatus = (studentId, selectedStatus) => {
    setRoster((items) => items.map((item) => item._id === studentId ? { ...item, selectedStatus } : item));
  };

  const submit = async () => {
    setIsSubmitting(true);
    try {
      const newRecords = roster
        .filter((student) => !student.attendance)
        .map((student) => ({ student: student._id, status: student.selectedStatus }));
      const updates = roster
        .filter((student) => student.attendance && student.attendance.status !== student.selectedStatus)
        .map((student) => attendanceService.update(student.attendance._id, { status: student.selectedStatus }));
      if (newRecords.length) {
        await attendanceService.submit({ date, classId, section, session: 'daily', records: newRecords });
      }
      if (updates.length) await Promise.all(updates);
      if (!newRecords.length && !updates.length) {
        showToast.error('No attendance changes to submit.');
        return;
      }
      showToast.success('Attendance submitted successfully.');
      setIsConfirmOpen(false);
      await loadRoster();
    } catch (error) {
      showToast.error(error.message || 'Attendance submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateExisting = async (recordId, nextStatus) => {
    try {
      await attendanceService.update(recordId, { status: nextStatus });
      showToast.success('Attendance record updated.');
      await loadHistory();
    } catch (error) {
      showToast.error(error.message || 'Attendance update failed.');
    }
  };

  return (
    <AppLayout role={role} title={role === 'admin' ? 'Attendance Oversight' : 'Class Attendance'} subtitle={role === 'admin' ? 'Institution-wide attendance history, filters & reporting' : 'Assigned classroom attendance and daily submission'} user={user} onLogout={logout}>
      <div className="space-y-6 pb-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Marked Records" value={stats.total || 0} icon={CalendarCheck} accent="forest" />
          <StatCard title="Present" value={stats.present || 0} icon={Check} accent="success" />
          <StatCard title="Absent" value={stats.absent || 0} icon={X} accent="danger" />
          <StatCard title="Attendance Rate" value={`${stats.attendanceRate || 0}%`} icon={Clock3} accent="gold" />
        </div>
        <Card>
          <CardHeader><CardTitle><span className="flex items-center gap-2"><Filter className="w-4 h-4 text-gold-dark" />Attendance Filters</span></CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div><label className="text-xs font-semibold uppercase tracking-wider text-charcoal/80 block mb-1.5">Date</label><input type="date" value={date} max={today} onChange={(event) => setDate(event.target.value)} className="w-full px-3 py-2 bg-ivory rounded border border-sage-dark text-sm" /></div>
              <Select label="Class" value={classId} onChange={(event) => { setClassId(event.target.value); setSection(''); }} options={options.classes.map((item) => ({ value: item._id, label: `${item.name} (${item.code})` }))} placeholder="All classes" />
              <Select label="Section" value={section} onChange={(event) => setSection(event.target.value)} options={sections.map((item) => ({ value: item.name, label: `Section ${item.name}` }))} placeholder="All sections" />
              {role === 'admin' ? <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)} options={statuses.map((item) => ({ value: item, label: item }))} placeholder="All statuses" /> : <div className="flex items-end"><Button variant="secondary" className="w-full" onClick={loadRoster}>Load Roster</Button></div>}
            </div>
          </CardContent>
        </Card>
        {role === 'teacher' ? (
          <Card>
            <CardHeader><div className="flex items-center justify-between"><CardTitle>Enrolled Students</CardTitle><Button variant="primary" leftIcon={Save} disabled={!roster.length} onClick={() => setIsConfirmOpen(true)}>Submit Attendance</Button></div></CardHeader>
            <CardContent className="p-0">
              <TableContainer className="border-0 shadow-none"><Table><Thead><Tr><Th>Student</Th><Th>Admission #</Th><Th>Roll</Th><Th>Status</Th></Tr></Thead><Tbody>{isLoading ? <TableLoadingState rows={5} cols={4} /> : roster.length === 0 ? <TableEmptyState title="No enrolled students" description="Choose an assigned class and section to load the roster." colSpan={4} /> : roster.map((student) => <Tr key={student._id}><Td className="font-editorial font-semibold">{student.name}</Td><Td className="font-mono text-xs">{student.admissionNumber}</Td><Td className="font-mono text-xs">{student.rollNumber || '—'}</Td><Td><div className="flex gap-1">{statuses.map((item) => <Button key={item} variant={student.selectedStatus === item ? (item === 'present' ? 'primary' : item === 'late' ? 'gold' : 'danger') : 'outline'} size="sm" onClick={() => updateRosterStatus(student._id, item)}>{item}</Button>)}</div></Td></Tr>)}</Tbody></Table></TableContainer>
            </CardContent>
          </Card>
        ) : (
          <TableContainer><Table><Thead><Tr><Th>Date</Th><Th>Student</Th><Th>Class</Th><Th>Status</Th><Th>Recorded By</Th><Th align="right">Edit</Th></Tr></Thead><Tbody>{isLoading ? <TableLoadingState rows={6} cols={6} /> : records.length === 0 ? <TableEmptyState title="No attendance records" description="Adjust filters or select another date." colSpan={6} /> : records.map((record) => <Tr key={record._id}><Td className="font-mono text-xs">{new Date(record.date).toLocaleDateString()}</Td><Td className="font-semibold">{record.student?.name}</Td><Td>{record.class?.code} · {record.section}</Td><Td><Badge variant={record.status === 'present' ? 'success' : record.status === 'late' ? 'gold' : 'danger'} dot className="capitalize">{record.status}</Badge></Td><Td className="text-xs text-muted">{record.recordedBy?.name || '—'}</Td><Td align="right"><div className="flex justify-end gap-1">{statuses.map((item) => <Button key={item} variant="ghost" size="sm" onClick={() => updateExisting(record._id, item)}>{item[0].toUpperCase()}</Button>)}</div></Td></Tr>)}</Tbody></Table></TableContainer>
        )}
        <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Confirm Attendance Submission" description={`Submit daily attendance for ${selectedClass?.name || 'the selected class'} · Section ${section}?`} footer={<><Button variant="secondary" size="sm" onClick={() => setIsConfirmOpen(false)}>Cancel</Button><Button variant="primary" size="sm" isLoading={isSubmitting} onClick={submit}>Confirm & Submit</Button></>}><p className="text-sm text-charcoal">This will create one attendance record per enrolled student for {date}. Duplicate submissions are blocked by the database.</p></Modal>
      </div>
    </AppLayout>
  );
};

export default AttendanceManagement;
