import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout.jsx';
import { Card, CardContent } from '@/components/ui/Card.jsx';
import { StatCard } from '@/components/ui/StatCard.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { TableContainer, Table, Thead, Tbody, Tr, Th, Td, TableEmptyState, TableLoadingState } from '@/components/ui/Table.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import attendanceService from '@/services/attendanceService.js';
import { showToast } from '@/utils/toast.js';

const GuardianAttendance = () => {
  const { user, logout } = useAuth();
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await attendanceService.getAttendance({});
      if (response.success) {
        setRecords(response.data.records);
        setStats(response.data.stats);
      }
    } catch (error) {
      showToast.error(error.message || 'Attendance history could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <AppLayout role="guardian" title="Attendance History" subtitle="Attendance records for your linked students only" user={user} onLogout={logout}>
      <div className="space-y-6 pb-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Records" value={stats.total || 0} icon={CalendarCheck} accent="forest" />
          <StatCard title="Present" value={stats.present || 0} icon={CalendarCheck} accent="success" />
          <StatCard title="Absent" value={stats.absent || 0} icon={CalendarCheck} accent="danger" />
          <StatCard title="Attendance Rate" value={`${stats.attendanceRate || 0}%`} icon={CalendarCheck} accent="gold" />
        </div>
        <Card><CardContent className="p-0"><TableContainer className="border-0 shadow-none"><Table><Thead><Tr><Th>Date</Th><Th>Student</Th><Th>Class</Th><Th>Status</Th></Tr></Thead><Tbody>{isLoading ? <TableLoadingState rows={6} cols={4} /> : records.length === 0 ? <TableEmptyState title="No attendance history" description="Linked student attendance will appear here after it is recorded." colSpan={4} /> : records.map((record) => <Tr key={record._id}><Td className="font-mono text-xs">{new Date(record.date).toLocaleDateString()}</Td><Td className="font-semibold">{record.student?.name}</Td><Td>{record.class?.code} · {record.section}</Td><Td><Badge variant={record.status === 'present' ? 'success' : record.status === 'late' ? 'gold' : 'danger'} dot className="capitalize">{record.status}</Badge></Td></Tr>)}</Tbody></Table></TableContainer></CardContent></Card>
      </div>
    </AppLayout>
  );
};

export default GuardianAttendance;
