import { useCallback, useEffect, useState } from 'react';
import { Save, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Select } from '@/components/ui/Select.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { TableContainer, Table, Thead, Tbody, Tr, Th, Td, TableEmptyState, TableLoadingState } from '@/components/ui/Table.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import examinationService from '@/services/examinationService.js';
import { showToast } from '@/utils/toast.js';

const MarksEntry = () => {
  const { user, logout } = useAuth();
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [roster, setRoster] = useState([]);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const exam = exams.find((item) => item._id === examId);
  const subject = exam?.subjects?.find((item) => item.subject?._id === subjectId);

  const loadExams = useCallback(async () => {
    try { const response = await examinationService.getExaminations(); if (response.success) setExams(response.data); }
    catch (error) { showToast.error(error.message || 'Examinations could not be loaded.'); }
  }, []);
  useEffect(() => { loadExams(); }, [loadExams]);
  const loadRoster = async () => {
    if (!examId || !subjectId) return;
    setLoading(true);
    try { const response = await examinationService.getRoster(examId, { subjectId }); if (response.success) { setRoster(response.data.students); setMarks({}); } }
    catch (error) { showToast.error(error.message || 'Students could not be loaded.'); setRoster([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadRoster(); }, [examId, subjectId]); // eslint-disable-line react-hooks/exhaustive-deps
  const submit = async () => {
    const results = roster.map((student) => ({ student: student._id, marks: Number(marks[student._id]) }));
    if (results.some((item) => !Number.isFinite(item.marks))) { showToast.error('Enter marks for every student.'); return; }
    setSaving(true);
    try { const response = await examinationService.submitResults({ examinationId: examId, subjectId, results }); if (response.success) { showToast.success('Marks submitted successfully.'); await loadRoster(); } }
    catch (error) { showToast.error(error.message || 'Marks could not be submitted.'); }
    finally { setSaving(false); }
  };
  return <AppLayout role="teacher" title="Marks Entry" subtitle="Enter results for your assigned subjects" user={user} onLogout={logout}><div className="space-y-6 pb-12"><Card><CardHeader><CardTitle><span className="flex items-center gap-2"><Users className="w-4 h-4 text-gold-dark" />Select assessment</span></CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><Select label="Examination" value={examId} onChange={(e) => { setExamId(e.target.value); setSubjectId(''); }} options={exams.map((item) => ({ value: item._id, label: `${item.name} · ${item.class?.code}` }))} /><Select label="Subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} options={exam?.subjects?.map((item) => ({ value: item.subject?._id, label: `${item.subject?.name} · Max ${item.maxMarks}` })) || []} /></div></CardContent></Card><Card><CardHeader><CardTitle>Student marks {subject && `(maximum ${subject.maxMarks})`}</CardTitle></CardHeader><CardContent noPadding><TableContainer className="border-0 shadow-none"><Table><Thead><Tr><Th>Student</Th><Th>Admission No.</Th><Th>Section</Th><Th>Marks</Th></Tr></Thead><Tbody>{loading ? <TableLoadingState cols={4} /> : !roster.length ? <TableEmptyState colSpan={4} title="Select an examination and subject" /> : roster.map((student) => <Tr key={student._id}><Td className="font-semibold">{student.name}</Td><Td>{student.admissionNumber}</Td><Td>{student.section}</Td><Td><Input aria-label={`Marks for ${student.name}`} type="number" min="0" max={subject?.maxMarks} value={marks[student._id] ?? ''} onChange={(e) => setMarks({ ...marks, [student._id]: e.target.value })} /></Td></Tr>)}</Tbody></Table></TableContainer>{roster.length > 0 && <div className="p-4 flex justify-end"><Button leftIcon={Save} isLoading={saving} onClick={submit}>Submit marks</Button></div>}</CardContent></Card></div></AppLayout>;
};
export default MarksEntry;
