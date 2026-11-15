import { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, CalendarCheck, ChevronDown, CreditCard, Receipt, ShieldCheck, UserRound, Wallet } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card.jsx';
import { StatCard } from '@/components/ui/StatCard.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Select } from '@/components/ui/Select.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { TableContainer, Table, Thead, Tbody, Tr, Th, Td, TableEmptyState, TableLoadingState } from '@/components/ui/Table.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import guardianService from '@/services/guardianService.js';
import attendanceService from '@/services/attendanceService.js';
import examinationService from '@/services/examinationService.js';
import feeService from '@/services/feeService.js';
import { showToast } from '@/utils/toast.js';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const GuardianDashboard = () => {
  const { user, logout } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [results, setResults] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [reportCard, setReportCard] = useState(null);
  const [loading, setLoading] = useState(true);

  const selectedStudent = useMemo(() => students.find((student) => student._id === selectedId), [students, selectedId]);
  const loadStudents = useCallback(async () => {
    try {
      const response = await guardianService.getLinkedStudents();
      if (response.success) {
        setStudents(response.data);
        setSelectedId((current) => current || response.data[0]?._id || '');
      }
    } catch (error) {
      showToast.error(error.message || 'Linked students could not be loaded.');
    }
  }, []);

  const loadStudentData = useCallback(async () => {
    if (!selectedId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [profileResponse, attendanceResponse, resultsResponse, reportCardResponse, invoiceResponse] = await Promise.all([
        guardianService.getStudentProfile(selectedId),
        attendanceService.getSummary({ studentId: selectedId }),
        examinationService.getResults({ studentId: selectedId }),
        examinationService.getReportCard(selectedId),
        feeService.getInvoices({ studentId: selectedId }),
      ]);
      if (profileResponse.success) setProfile(profileResponse.data);
      if (attendanceResponse.success) setAttendance(attendanceResponse.data);
      if (resultsResponse.success) setResults(resultsResponse.data);
      if (reportCardResponse.success) setReportCard(reportCardResponse.data);
      if (invoiceResponse.success) setInvoices(invoiceResponse.data);
    } catch (error) {
      showToast.error(error.message || 'Student portal data could not be loaded.');
      setProfile(null);
      setAttendance({});
      setResults([]);
      setReportCard(null);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => { loadStudents(); }, [loadStudents]);
  useEffect(() => { loadStudentData(); }, [loadStudentData]);

  const outstanding = invoices.reduce((sum, invoice) => sum + Number(invoice.outstandingAmount || 0), 0);
  const recentResults = results.slice(0, 5);

  return (
    <AppLayout role="guardian" title="Guardian & Student Portal" subtitle="One secure view for your linked students" user={user} onLogout={logout}>
      <div className="space-y-6 pb-12">
        <div className="bg-forest text-ivory rounded-lg p-6 lg:p-8 border border-forest-light/40 shadow-card">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <Badge variant="gold" size="sm" className="font-mono">SECURE GUARDIAN PORTAL</Badge>
              <h2 className="font-editorial text-2xl lg:text-3xl font-bold text-white mt-3">Welcome, {user?.name || 'Guardian'}</h2>
              <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xl">Your view is restricted to students linked to this guardian account.</p>
            </div>
            <div className="w-full lg:w-80">
              <label htmlFor="linked-student" className="text-xs font-semibold uppercase tracking-wider text-ivory/80">Viewing student</label>
              <div className="relative mt-1.5">
                <select id="linked-student" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="w-full appearance-none rounded border border-gold/50 bg-white/10 text-white px-3 py-2.5 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40">
                  {!students.length && <option value="">No linked students</option>}
                  {students.map((student) => <option key={student._id} value={student._id} className="text-charcoal">{student.name} · {student.class?.code} - {student.section}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gold pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {!students.length && !loading ? (
          <Card><CardContent className="py-16 text-center"><UserRound className="w-10 h-10 mx-auto text-muted mb-3" /><h3 className="font-editorial text-xl font-semibold text-charcoal">No linked students</h3><p className="text-sm text-muted mt-1">Your student records will appear here once an administrator links them to this account.</p></CardContent></Card>
        ) : (
          <>
            <Card><CardHeader><CardTitle><span className="flex items-center gap-2"><UserRound className="w-4 h-4 text-gold-dark" />Student profile</span></CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"><div><p className="text-xs uppercase tracking-wider text-muted">Name</p><p className="font-semibold text-charcoal mt-1">{profile?.student?.name || selectedStudent?.name}</p></div><div><p className="text-xs uppercase tracking-wider text-muted">Admission</p><p className="font-mono text-charcoal mt-1">{profile?.student?.admissionNumber || selectedStudent?.admissionNumber}</p></div><div><p className="text-xs uppercase tracking-wider text-muted">Class</p><p className="font-semibold text-charcoal mt-1">{profile?.student?.class?.code || selectedStudent?.class?.code} · {profile?.student?.section || selectedStudent?.section}</p></div><div><p className="text-xs uppercase tracking-wider text-muted">Status</p><Badge variant="success" className="capitalize mt-1">{profile?.student?.status || selectedStudent?.status}</Badge></div></div></CardContent></Card>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Attendance Rate" value={`${attendance.attendanceRate || 0}%`} subtitle={`${attendance.present || 0} present days`} icon={CalendarCheck} accent="success" />
              <StatCard title="Results Recorded" value={results.length} subtitle="Subject assessments" icon={Award} accent="forest" />
              <StatCard title="Outstanding Balance" value={money(outstanding)} subtitle={`${invoices.length} invoices`} icon={CreditCard} accent="gold" />
              <StatCard title="Linked Access" value="Verified" subtitle="Backend protected" icon={ShieldCheck} accent="sage" />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card><CardHeader><CardTitle><span className="flex items-center gap-2"><Award className="w-4 h-4 text-gold-dark" />Recent results</span></CardTitle></CardHeader><CardContent noPadding><TableContainer className="border-0 shadow-none"><Table><Thead><Tr><Th>Examination</Th><Th>Subject</Th><Th>Marks</Th><Th>Grade</Th></Tr></Thead><Tbody>{loading ? <TableLoadingState cols={4} /> : !recentResults.length ? <TableEmptyState colSpan={4} icon={Award} title="No results available" /> : recentResults.map((result) => <Tr key={result._id}><Td>{result.examination?.name}</Td><Td>{result.subject?.name}</Td><Td>{result.marks} / {result.maxMarks}</Td><Td className="font-semibold text-forest">{result.grade}</Td></Tr>)}</Tbody></Table></TableContainer></CardContent></Card>
              <Card><CardHeader><CardTitle><span className="flex items-center gap-2"><Wallet className="w-4 h-4 text-gold-dark" />Fee summary</span></CardTitle></CardHeader><CardContent><div className="space-y-3">{loading ? <div className="h-20 animate-pulse bg-sage rounded" /> : invoices.length ? invoices.slice(0, 4).map((invoice) => <div key={invoice._id} className="flex items-center justify-between border-b border-sage last:border-0 pb-2 last:pb-0"><div><p className="font-mono text-xs text-forest">{invoice.invoiceNumber}</p><p className="text-xs text-muted mt-1">{invoice.student?.name} · {invoice.status}</p></div><p className="font-semibold text-charcoal">{money(invoice.outstandingAmount)}</p></div>) : <div className="py-8 text-center text-sm text-muted">No fee invoices available.</div>}</div></CardContent></Card>
            </div>
            <Card><CardHeader><CardTitle><span className="flex items-center gap-2"><Award className="w-4 h-4 text-gold-dark" />Report card summary</span></CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-4 gap-3"><div><p className="text-xs uppercase tracking-wider text-muted">Total marks</p><p className="font-editorial text-2xl font-bold text-charcoal mt-1">{reportCard?.summary?.total ?? 0}</p></div><div><p className="text-xs uppercase tracking-wider text-muted">Maximum</p><p className="font-editorial text-2xl font-bold text-charcoal mt-1">{reportCard?.summary?.maxTotal ?? 0}</p></div><div><p className="text-xs uppercase tracking-wider text-muted">Percentage</p><p className="font-editorial text-2xl font-bold text-forest mt-1">{reportCard?.summary?.percentage ?? 0}%</p></div><div><p className="text-xs uppercase tracking-wider text-muted">Grade</p><p className="font-editorial text-2xl font-bold text-gold-dark mt-1">{reportCard?.summary?.grade || 'N/A'}</p></div></div><p className="text-xs text-muted mt-4">{reportCard?.summary?.remark || 'Report-card details will appear after results are published.'}</p></CardContent></Card>
            <Card><CardHeader><CardTitle><span className="flex items-center gap-2"><Receipt className="w-4 h-4 text-gold-dark" />Attendance snapshot</span></CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-4 gap-3"><div className="p-3 rounded bg-success-bg"><p className="text-xs text-muted">Present</p><p className="text-xl font-editorial font-bold text-success">{attendance.present || 0}</p></div><div className="p-3 rounded bg-danger-bg"><p className="text-xs text-muted">Absent</p><p className="text-xl font-editorial font-bold text-danger">{attendance.absent || 0}</p></div><div className="p-3 rounded bg-gold/15"><p className="text-xs text-muted">Late</p><p className="text-xl font-editorial font-bold text-gold-dark">{attendance.late || 0}</p></div><div className="p-3 rounded bg-sage"><p className="text-xs text-muted">Total marked</p><p className="text-xl font-editorial font-bold text-charcoal">{attendance.total || 0}</p></div></div></CardContent></Card>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default GuardianDashboard;
