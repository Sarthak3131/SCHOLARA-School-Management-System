import { useCallback, useEffect, useState } from 'react';
import { Award, Calendar, Plus, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Select } from '@/components/ui/Select.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { TableContainer, Table, Thead, Tbody, Tr, Th, Td, TableEmptyState, TableLoadingState } from '@/components/ui/Table.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import academicService from '@/services/academicService.js';
import examinationService from '@/services/examinationService.js';
import { showToast } from '@/utils/toast.js';

const ExaminationManagement = () => {
  const { user, logout } = useAuth();
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ name: '', type: 'unit', classId: '', scheduledDate: '', academicYear: '2024-2025', subject: '', maxMarks: 100 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [examResponse, classResponse, subjectResponse] = await Promise.all([examinationService.getExaminations(), academicService.getClasses(), academicService.getSubjects()]);
      if (examResponse.success) setExams(examResponse.data);
      if (classResponse.success) setClasses(classResponse.data);
      if (subjectResponse.success) setSubjects(subjectResponse.data);
    } catch (error) { showToast.error(error.message || 'Examinations could not be loaded.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.classId || !form.scheduledDate || !form.subject || Number(form.maxMarks) <= 0) {
      showToast.error('Complete the examination details and maximum marks.'); return;
    }
    setSaving(true);
    try {
      const selectedClass = classes.find((item) => item._id === form.classId);
      const response = await examinationService.create({
        name: form.name, type: form.type, classId: form.classId,
        sections: selectedClass?.sections?.map((item) => item.name) || [],
        subjects: [{ subject: form.subject, maxMarks: Number(form.maxMarks) }],
        scheduledDate: form.scheduledDate, academicYear: form.academicYear,
      });
      if (response.success) { showToast.success('Examination scheduled successfully.'); setForm({ ...form, name: '', scheduledDate: '', subject: '' }); await load(); }
    } catch (error) { showToast.error(error.message || 'Examination could not be created.'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this examination and its results?')) return;
    try { await examinationService.remove(id); showToast.success('Examination deleted.'); await load(); }
    catch (error) { showToast.error(error.message || 'Examination could not be deleted.'); }
  };

  return (
    <AppLayout role="admin" title="Examinations" subtitle="Schedule assessments and configure maximum marks" user={user} onLogout={logout}>
      <div className="space-y-6 pb-12">
        <Card><CardHeader><CardTitle><span className="flex items-center gap-2"><Plus className="w-4 h-4 text-gold-dark" />Schedule Examination</span></CardTitle></CardHeader><CardContent>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Midterm 2025" />
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={['unit', 'midterm', 'final', 'annual', 'custom']} placeholder="" />
            <Select label="Class" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} options={classes.map((item) => ({ value: item._id, label: `${item.name} (${item.code})` }))} />
            <Select label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} options={subjects.map((item) => ({ value: item._id, label: `${item.name} (${item.code})` }))} />
            <Input label="Date" type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
            <div className="flex gap-2"><Input label="Max marks" type="number" min="1" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} /><Button type="submit" isLoading={saving} leftIcon={Plus}>Add</Button></div>
          </form>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Scheduled Examinations</CardTitle></CardHeader><CardContent noPadding><TableContainer className="border-0 shadow-none"><Table><Thead><Tr><Th>Name</Th><Th>Class</Th><Th>Date</Th><Th>Subjects</Th><Th>Status</Th><Th align="right">Action</Th></Tr></Thead><Tbody>{loading ? <TableLoadingState cols={6} /> : exams.length === 0 ? <TableEmptyState colSpan={6} icon={Award} title="No examinations scheduled" /> : exams.map((exam) => <Tr key={exam._id}><Td className="font-semibold">{exam.name}</Td><Td>{exam.class?.code}</Td><Td><span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(exam.scheduledDate).toLocaleDateString()}</span></Td><Td>{exam.subjects?.map((item) => item.subject?.name).join(', ')}</Td><Td><Badge variant={exam.status === 'completed' ? 'success' : 'gold'} className="capitalize">{exam.status}</Badge></Td><Td align="right"><Button variant="ghost" size="sm" leftIcon={Trash2} onClick={() => remove(exam._id)} aria-label={`Delete ${exam.name}`}>Delete</Button></Td></Tr>)}</Tbody></Table></TableContainer></CardContent></Card>
      </div>
    </AppLayout>
  );
};
export default ExaminationManagement;
