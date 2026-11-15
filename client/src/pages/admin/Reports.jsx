import { useCallback, useEffect, useState } from 'react';
import { BarChart3, CalendarCheck, CreditCard, Download, GraduationCap, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card.jsx';
import { StatCard } from '@/components/ui/StatCard.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Select } from '@/components/ui/Select.jsx';
import { TableContainer, Table, Thead, Tbody, Tr, Th, Td, TableEmptyState, TableLoadingState } from '@/components/ui/Table.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import academicService from '@/services/academicService.js';
import reportsService from '@/services/reportsService.js';
import { showToast } from '@/utils/toast.js';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const Reports = () => {
  const { user, logout } = useAuth();
  const [classes, setClasses] = useState([]);
  const [studentReport, setStudentReport] = useState(null);
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [examReport, setExamReport] = useState([]);
  const [feeReport, setFeeReport] = useState(null);
  const [filters, setFilters] = useState({ from: '', to: '', classId: '', section: '', search: '' });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [classResponse, students, attendance, examinations, fees] = await Promise.all([
        academicService.getClasses(),
        reportsService.getStudents(filters),
        reportsService.getAttendance(filters),
        reportsService.getExaminations(),
        reportsService.getFees(filters),
      ]);
      if (classResponse.success) setClasses(classResponse.data);
      if (students.success) setStudentReport(students.data);
      if (attendance.success) setAttendanceReport(attendance.data);
      if (examinations.success) setExamReport(examinations.data);
      if (fees.success) setFeeReport(fees.data);
    } catch (error) { showToast.error(error.message || 'Reports could not be loaded.'); }
    finally { setLoading(false); }
  }, [filters]);
  useEffect(() => { load(); }, [load]);
  const selectedClass = classes.find((item) => item._id === filters.classId);
  const exportRows = studentReport?.records || [];
  const downloadCsv = () => {
    const csv = ['Name,Admission Number,Class,Section,Status', ...exportRows.map((item) => [item.name, item.admissionNumber, item.class?.code || '', item.section, item.status].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = 'scholara-student-report.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };
  return <AppLayout role="admin" title="Reports" subtitle="Live operational intelligence from MongoDB" user={user} onLogout={logout}>
    <div className="space-y-6 pb-12">
      <Card><CardHeader><CardTitle>Report filters</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"><Input label="Search students" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Name or admission no." /><Select label="Class" value={filters.classId} onChange={(e) => setFilters({ ...filters, classId: e.target.value, section: '' })} options={classes.map((item) => ({ value: item._id, label: `${item.name} (${item.code})` }))} /><Select label="Section" value={filters.section} onChange={(e) => setFilters({ ...filters, section: e.target.value })} options={selectedClass?.sections?.map((item) => ({ value: item.name, label: `Section ${item.name}` })) || []} /><Input label="From" type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /><Input label="To" type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></div></CardContent></Card>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><StatCard title="Students" value={studentReport?.summary?.totalStudents || 0} icon={Users} accent="forest" /><StatCard title="Attendance Rate" value={`${attendanceReport?.summary?.attendanceRate || 0}%`} icon={CalendarCheck} accent="success" /><StatCard title="Exam Reports" value={examReport.length} icon={GraduationCap} accent="gold" /><StatCard title="Outstanding Fees" value={money(feeReport?.summary?.totalOutstanding)} icon={CreditCard} accent="danger" /></div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card><CardHeader action={<Button size="sm" variant="outline" leftIcon={Download} onClick={downloadCsv}>CSV</Button>}><CardTitle>Student distribution</CardTitle></CardHeader><CardContent noPadding><TableContainer className="border-0 shadow-none"><Table><Thead><Tr><Th>Class</Th><Th>Section</Th><Th>Students</Th></Tr></Thead><Tbody>{loading ? <TableLoadingState cols={3} /> : !studentReport?.distribution?.length ? <TableEmptyState colSpan={3} title="No student data" /> : studentReport.distribution.map((item) => <Tr key={`${item.classId}-${item.section}`}><Td className="font-semibold">{item.classCode}</Td><Td>{item.section}</Td><Td>{item.count}</Td></Tr>)}</Tbody></Table></TableContainer></CardContent></Card>
        <Card><CardHeader><CardTitle>Attendance by class</CardTitle></CardHeader><CardContent noPadding><TableContainer className="border-0 shadow-none"><Table><Thead><Tr><Th>Class</Th><Th>Present</Th><Th>Absent</Th><Th>Rate</Th></Tr></Thead><Tbody>{loading ? <TableLoadingState cols={4} /> : !attendanceReport?.byClass?.length ? <TableEmptyState colSpan={4} title="No attendance data" /> : attendanceReport.byClass.map((item) => <Tr key={`${item.classCode}-${item.section}`}><Td>{item.classCode} · {item.section}</Td><Td>{item.present}</Td><Td>{item.absent}</Td><Td className="font-semibold text-forest">{item.attendanceRate}%</Td></Tr>)}</Tbody></Table></TableContainer></CardContent></Card>
        <Card><CardHeader><CardTitle>Examination performance</CardTitle></CardHeader><CardContent noPadding><TableContainer className="border-0 shadow-none"><Table><Thead><Tr><Th>Examination</Th><Th>Results</Th><Th>Average</Th><Th>Pass rate</Th></Tr></Thead><Tbody>{loading ? <TableLoadingState cols={4} /> : !examReport.length ? <TableEmptyState colSpan={4} title="No examination results" /> : examReport.map((item) => <Tr key={item.examinationId}><Td className="font-semibold">{item.name}</Td><Td>{item.resultCount}</Td><Td>{item.averagePercentage}%</Td><Td className="text-forest font-semibold">{item.passRate}%</Td></Tr>)}</Tbody></Table></TableContainer></CardContent></Card>
        <Card><CardHeader><CardTitle>Fee collection by class</CardTitle></CardHeader><CardContent noPadding><TableContainer className="border-0 shadow-none"><Table><Thead><Tr><Th>Class</Th><Th>Invoiced</Th><Th>Collected</Th><Th>Outstanding</Th></Tr></Thead><Tbody>{loading ? <TableLoadingState cols={4} /> : !feeReport?.byClass?.length ? <TableEmptyState colSpan={4} title="No fee data" /> : feeReport.byClass.map((item) => <Tr key={item.classCode}><Td className="font-semibold">{item.classCode}</Td><Td>{money(item.totalInvoiced)}</Td><Td>{money(item.totalCollected)}</Td><Td className="text-danger">{money(item.outstanding)}</Td></Tr>)}</Tbody></Table></TableContainer></CardContent></Card>
      </div>
    </div>
  </AppLayout>;
};
export default Reports;
