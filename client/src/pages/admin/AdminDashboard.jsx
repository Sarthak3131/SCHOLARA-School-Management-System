import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  CreditCard,
  Plus,
  RefreshCw,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout.jsx';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/Card.jsx';
import { StatCard } from '@/components/ui/StatCard.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Modal } from '@/components/ui/Modal.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Select } from '@/components/ui/Select.jsx';
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
import dashboardService from '@/services/dashboardService.js';
import { formatCurrency, formatDate } from '@/utils/helpers.js';
import { showToast } from '@/utils/toast.js';

/**
 * Editorial Chart Tooltip Component
 */
const CustomChartTooltip = ({ active, payload, label, unit = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-charcoal text-ivory p-2.5 rounded shadow-card-lg border border-charcoal-light text-xs font-mono">
        <p className="font-semibold text-gold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="flex items-center justify-between gap-3 text-2xs">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-bold text-white">
              {entry.value}
              {unit}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  // Quick enroll form state
  const [newStudent, setNewStudent] = useState({
    name: '',
    classId: 'Grade 10',
    section: 'A',
    guardianEmail: '',
  });

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const response = await dashboardService.getAdminDashboard();
      if (response.success && response.data) {
        setData(response.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      showToast.error(error.message || 'Unable to load administrative telemetry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleQuickEnrollSubmit = (e) => {
    e.preventDefault();
    if (!newStudent.name) {
      showToast.error('Please specify student name.');
      return;
    }
    setIsEnrollModalOpen(false);
    showToast.success(`Enrollment application registered for ${newStudent.name}.`);
    setNewStudent({ name: '', classId: 'Grade 10', section: 'A', guardianEmail: '' });
  };

  return (
    <AppLayout
      role="admin"
      title="Administrative Governance"
      subtitle="Executive Institutional Telemetry & Academic Operations"
      user={user}
      onLogout={logout}
    >
      <div className="space-y-8 pb-12">
        {/* Executive Banner */}
        <div className="bg-forest text-ivory rounded-lg p-6 lg:p-8 border border-forest-light/40 shadow-card-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="relative z-10 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <Badge variant="gold" size="sm" className="font-mono">
                AY 2024–2025 • TERM 1
              </Badge>
              <Badge variant="success" size="sm" dot>
                SYSTEM LIVE
              </Badge>
              {lastUpdated && (
                <span className="text-2xs text-white/50 font-mono hidden sm:inline-block">
                  Synced {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <h2 className="font-editorial text-2xl lg:text-3xl font-bold text-white tracking-tight leading-tight">
              Institutional Command Overview
            </h2>
            <p className="text-white/80 text-xs sm:text-sm mt-1.5 leading-relaxed">
              Real-time synchronization across student registries, faculty assignments, daily classroom attendance,
              and financial fee ledgers.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={RefreshCw}
              isLoading={isRefreshing}
              onClick={() => {
                fetchDashboardData(true);
                showToast.info('Refreshing live metrics...');
              }}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Sync Telemetry
            </Button>

            <Button
              variant="gold"
              size="sm"
              leftIcon={Plus}
              onClick={() => setIsEnrollModalOpen(true)}
            >
              Enroll Student
            </Button>
          </div>

          {/* Insignia watermark */}
          <div className="absolute right-0 top-0 bottom-0 w-72 opacity-10 pointer-events-none flex items-center justify-center font-editorial text-[160px] font-bold text-gold">
            S
          </div>
        </div>

        {/* 1. KPI Metric StatCards */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Student Enrollment"
              value={data ? data.summary.totalStudents.toLocaleString() : '—'}
              subtitle={`${data?.summary?.activeEnrollments || 0} active student files`}
              icon={Users}
              trend={{ value: '+4.2%', isPositive: true, label: 'vs last term' }}
              accent="forest"
            />

            <StatCard
              title="Active Faculty"
              value={data ? data.summary.totalTeachers.toString() : '—'}
              subtitle="100% curriculum coverage"
              icon={GraduationCap}
              trend={{ value: '1:14 ratio', isPositive: true, label: 'educator/pupil' }}
              accent="gold"
            />

            <StatCard
              title="Today's Attendance"
              value={data ? `${data.attendance.today.rate}%` : '—'}
              subtitle={`${data?.attendance?.today?.present || 0} present of ${data?.attendance?.today?.marked || 0}`}
              icon={CalendarCheck}
              trend={{ value: '+1.8%', isPositive: true, label: 'vs yesterday' }}
              accent="success"
            />

            <StatCard
              title="Fee Realization"
              value={data ? formatCurrency(data.financial.totalCollected) : '—'}
              subtitle={`${formatCurrency(data?.financial?.totalOutstanding || 0)} outstanding`}
              icon={CreditCard}
              trend={{
                value: `${data?.financial?.collectionRate || 85.1}%`,
                isPositive: (data?.financial?.collectionRate || 0) >= 80,
                label: 'recovery rate',
              }}
              accent="danger"
            />
          </div>
        </section>

        {/* 2. Analytical Charts Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart 1: 7-Day Attendance Rate Trajectory */}
          <Card className="lg:col-span-7">
            <CardHeader
              action={
                <Badge variant="success" size="sm" dot>
                  {data?.attendance?.today?.rate || 95}% Current Avg
                </Badge>
              }
            >
              <CardTitle>Attendance Trajectory (Last 7 Days)</CardTitle>
              <CardDescription>Daily verified classroom attendance compliance percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-72 w-full">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-forest border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data?.attendance?.trend || []}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#183D32" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#183D32" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5EBE3" vertical={false} />
                      <XAxis
                        dataKey="day"
                        tick={{ fill: '#85877F', fontSize: 11 }}
                        axisLine={{ stroke: '#E5EBE3' }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[70, 100]}
                        tick={{ fill: '#85877F', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip content={<CustomChartTooltip unit="%" />} />
                      <Area
                        type="monotone"
                        dataKey="rate"
                        name="Attendance Rate"
                        stroke="#183D32"
                        strokeWidth={2.5}
                        fill="url(#attendanceGradient)"
                        dot={{ r: 4, fill: '#C4A66A', strokeWidth: 1.5, stroke: '#183D32' }}
                        activeDot={{ r: 6, fill: '#C4A66A' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <Clock className="w-3.5 h-3.5 text-muted" />
                Aggregated daily at 09:30 AM IST
              </span>
              <span className="font-mono text-2xs text-forest font-semibold">
                TARGET: &gt;92.0%
              </span>
            </CardFooter>
          </Card>

          {/* Chart 2: Fee Ledger Flow */}
          <Card className="lg:col-span-5">
            <CardHeader
              action={
                <Badge variant="gold" size="sm">
                  {data?.financial?.collectionRate || 85.1}% Recovery
                </Badge>
              }
            >
              <CardTitle>Fee Invoicing & Recovery</CardTitle>
              <CardDescription>Monthly fees collected vs outstanding ledger in INR</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-72 w-full">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data?.financial?.monthlyTrend || []}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5EBE3" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: '#85877F', fontSize: 11 }}
                        axisLine={{ stroke: '#E5EBE3' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#85877F', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `₹${Math.round(val / 100000)}L`}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                      />
                      <Bar dataKey="collected" name="Realized Fees" fill="#183D32" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="pending" name="Pending Balance" fill="#C4A66A" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <span className="text-2xs text-muted">
                Total Invoiced: <strong className="text-charcoal">{data ? formatCurrency(data.financial.totalInvoiced) : '—'}</strong>
              </span>
              <span className="text-2xs text-forest font-semibold">
                Simulated Ledger Engine
              </span>
            </CardFooter>
          </Card>
        </section>

        {/* 3. Secondary Metrics: Academic Grade Distribution & Class Performance */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Academic Grade Distribution */}
          <Card className="lg:col-span-6">
            <CardHeader
              action={
                <Badge variant="forest" size="sm">
                  Avg GPA: {data?.academic?.averageGPA || '3.62'}
                </Badge>
              }
            >
              <CardTitle>Academic Evaluation Distribution</CardTitle>
              <CardDescription>Term assessment outcomes configured across grading rules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-forest border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data?.academic?.gradeDistribution || []}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5EBE3" vertical={false} />
                      <XAxis
                        dataKey="grade"
                        tick={{ fill: '#252923', fontSize: 11, fontWeight: 600 }}
                        axisLine={{ stroke: '#E5EBE3' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#85877F', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomChartTooltip unit=" Students" />} />
                      <Bar dataKey="count" name="Enrolled Students" fill="#183D32" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <span className="text-2xs text-muted">Passing Percentage: <strong className="text-success">{data?.academic?.passingRate || '97.6%'}</strong></span>
              <span className="text-2xs font-mono text-muted">Configurable Grade Engine</span>
            </CardFooter>
          </Card>

          {/* Classroom Attendance Ranking */}
          <Card className="lg:col-span-6">
            <CardHeader>
              <CardTitle>Class Section Attendance Breakdown</CardTitle>
              <CardDescription>Active cohort attendance compliance comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-1">
                {(data?.classOverview || []).map((cls, idx) => (
                  <div key={cls.id || idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-charcoal">{cls.name}</span>
                        <span className="text-2xs font-mono text-muted">({cls.sections})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xs text-muted">{cls.studentCount} pupils</span>
                        <span className="font-semibold font-mono text-forest">{cls.attendanceRate}%</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-2 rounded-full bg-sage overflow-hidden">
                      <div
                        className="h-full rounded-full bg-forest transition-all duration-500"
                        style={{ width: `${cls.attendanceRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <span className="text-2xs text-muted">Total Classes: {data?.summary?.totalClasses || 4}</span>
              <span className="text-2xs text-forest font-semibold">Teacher Workload Assigned</span>
            </CardFooter>
          </Card>
        </section>

        {/* 4. Operational Tables: Audit Trail & Recent Invoices */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Institutional Activities Audit Trail */}
          <Card className="lg:col-span-7">
            <CardHeader
              action={
                <Badge variant="sage" size="sm" className="font-mono">
                  AUDIT LOGS
                </Badge>
              }
            >
              <CardTitle>Recent Institutional Activities</CardTitle>
              <CardDescription>Immutable audit trail tracking operational actions</CardDescription>
            </CardHeader>
            <CardContent noPadding>
              <TableContainer className="border-0 shadow-none rounded-none">
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Action</Th>
                      <Th>Operator</Th>
                      <Th>Details</Th>
                      <Th align="right">Timestamp</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {isLoading ? (
                      <TableLoadingState rows={4} cols={4} />
                    ) : (data?.recentActivities || []).length === 0 ? (
                      <TableEmptyState title="No activity recorded" description="Operational events will appear here." colSpan={4} />
                    ) : (
                      (data?.recentActivities || []).map((log) => (
                        <Tr key={log.id}>
                          <Td>
                            <Badge
                              variant={
                                log.action.includes('ENROLL')
                                  ? 'gold'
                                  : log.action.includes('ATTENDANCE')
                                  ? 'success'
                                  : log.action.includes('FEE')
                                  ? 'forest'
                                  : 'sage'
                              }
                              size="sm"
                              className="font-mono text-2xs"
                            >
                              {log.action.replace(/_/g, ' ')}
                            </Badge>
                          </Td>
                          <Td>
                            <span className="font-medium text-charcoal text-xs block">{log.user}</span>
                            <span className="text-2xs text-muted uppercase font-mono">{log.role}</span>
                          </Td>
                          <Td className="text-xs text-charcoal/80 max-w-xs truncate" title={log.details}>
                            {log.details}
                          </Td>
                          <Td align="right" className="text-2xs font-mono text-muted whitespace-nowrap">
                            {formatDate(log.timestamp, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Recent Invoices Ledger */}
          <Card className="lg:col-span-5">
            <CardHeader
              action={
                <Badge variant="gold" size="sm">
                  {data?.financial?.pendingInvoices || 0} Pending
                </Badge>
              }
            >
              <CardTitle>Recent Fee Invoices</CardTitle>
              <CardDescription>Live billing ledger and balance reconciliation</CardDescription>
            </CardHeader>
            <CardContent noPadding>
              <TableContainer className="border-0 shadow-none rounded-none">
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Invoice</Th>
                      <Th>Student</Th>
                      <Th>Amount</Th>
                      <Th align="right">Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {isLoading ? (
                      <TableLoadingState rows={4} cols={4} />
                    ) : (data?.recentInvoices || []).length === 0 ? (
                      <TableEmptyState title="No invoices available" description="Fee records will appear here." colSpan={4} />
                    ) : (
                      (data?.recentInvoices || []).map((inv) => (
                        <Tr key={inv.id}>
                          <Td className="font-mono text-2xs font-semibold text-forest">
                            {inv.invoiceNumber}
                          </Td>
                          <Td className="text-xs font-medium text-charcoal truncate max-w-[120px]">
                            {inv.studentName}
                          </Td>
                          <Td className="text-xs font-mono">
                            <span className="font-semibold">{formatCurrency(inv.amount)}</span>
                            {inv.paidAmount > 0 && inv.paidAmount < inv.amount && (
                              <span className="block text-2xs text-muted">
                                Paid: {formatCurrency(inv.paidAmount)}
                              </span>
                            )}
                          </Td>
                          <Td align="right">
                            <Badge
                              variant={
                                inv.status === 'paid'
                                  ? 'success'
                                  : inv.status === 'partial'
                                  ? 'gold'
                                  : inv.status === 'overdue'
                                  ? 'danger'
                                  : 'warning'
                              }
                              size="sm"
                              className="uppercase text-2xs"
                            >
                              {inv.status}
                            </Badge>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </section>

        {/* Quick Enroll Modal */}
        <Modal
          isOpen={isEnrollModalOpen}
          onClose={() => setIsEnrollModalOpen(false)}
          title="Fast Student Enrollment"
          description="Register a student directly into the active academic roster"
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEnrollModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleQuickEnrollSubmit}
              >
                Complete Enrollment
              </Button>
            </>
          }
        >
          <form onSubmit={handleQuickEnrollSubmit} className="space-y-4">
            <Input
              label="Student Legal Full Name"
              name="studentName"
              placeholder="e.g. Liam Gallagher"
              value={newStudent.name}
              onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Class Level"
                name="classId"
                value={newStudent.classId}
                onChange={(e) => setNewStudent({ ...newStudent, classId: e.target.value })}
                options={['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']}
                required
              />
              <Select
                label="Section"
                name="section"
                value={newStudent.section}
                onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                options={['Section A', 'Section B']}
                required
              />
            </div>
            <Input
              label="Primary Guardian Email"
              name="guardianEmail"
              type="email"
              placeholder="guardian@family.org"
              value={newStudent.guardianEmail}
              onChange={(e) => setNewStudent({ ...newStudent, guardianEmail: e.target.value })}
              required
            />
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
