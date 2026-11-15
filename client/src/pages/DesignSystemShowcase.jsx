import { useState } from 'react';
import {
  Sparkles,
  Users,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  Plus,
  Trash2,
  Edit,
  Mail,
  Lock,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatCard,
  Modal,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableEmptyState,
  TableLoadingState,
  TablePagination,
} from '@/components/ui/index.js';
import { AppLayout } from '@/components/layout/index.js';
import { showToast } from '@/utils/toast.js';
import { ROLES } from '@/utils/constants.js';

export const DesignSystemShowcase = () => {
  const [activeRole, setActiveRole] = useState(ROLES.ADMIN);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableState, setTableState] = useState('data'); // 'data' | 'empty' | 'loading'
  const [currentPage, setCurrentPage] = useState(1);
  const [formValues, setFormValues] = useState({
    name: 'Eleanor Vance',
    email: 'eleanor.vance@scholara.edu',
    role: 'Teacher',
    notes: 'Grade 10 Mathematics lead educator.',
  });

  const sampleStudents = [
    { id: 'STU-101', name: 'Alexander Wright', class: 'Grade 10-A', status: 'Active', attendance: '96%', fee: 'Paid' },
    { id: 'STU-102', name: 'Sophia Chen', class: 'Grade 10-A', status: 'Active', attendance: '92%', fee: 'Pending' },
    { id: 'STU-103', name: 'Marcus Brody', class: 'Grade 10-B', status: 'Late', attendance: '84%', fee: 'Partial' },
    { id: 'STU-104', name: 'Elena Rostova', class: 'Grade 9-A', status: 'Active', attendance: '98%', fee: 'Paid' },
    { id: 'STU-105', name: 'Tariq Al-Mansoor', class: 'Grade 9-B', status: 'Inactive', attendance: '71%', fee: 'Overdue' },
  ];

  return (
    <AppLayout
      role={activeRole}
      title="Design System & UI Components"
      subtitle="SCHOLARA Premium Editorial Education Technology Specification"
      user={{
        name: activeRole === ROLES.ADMIN ? 'Dr. Arthur Vance' : activeRole === ROLES.TEACHER ? 'Clara Oswald' : 'David Miller',
        role: activeRole,
        email: `${activeRole}@scholara.edu`,
      }}
      onLogout={() => showToast.info('Logout action triggered.')}
    >
      <div className="space-y-10 pb-12">
        {/* Banner with Role Switcher */}
        <div className="bg-forest text-ivory rounded-lg p-6 lg:p-8 relative overflow-hidden border border-forest-light/40 shadow-card-lg">
          <div className="relative z-10 max-w-2xl">
            <Badge variant="gold" size="sm" className="mb-3 font-mono">
              PHASE 2 SPECIFICATION
            </Badge>
            <h2 className="font-editorial text-2xl lg:text-3xl font-bold tracking-tight text-white mb-2">
              Editorial Design System
            </h2>
            <p className="text-white/80 text-sm leading-relaxed mb-6">
              A bespoke, non-generic educational technology design system built with Warm Ivory,
              Deep Forest Green, Charcoal, and Muted Champagne Gold accents.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-white/60 uppercase tracking-wider font-mono">
                Preview Layout As:
              </span>
              <div className="inline-flex rounded-md p-1 bg-forest-dark/70 border border-forest-light/40">
                {[ROLES.ADMIN, ROLES.TEACHER, ROLES.GUARDIAN].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setActiveRole(r);
                      showToast.success(`Switched preview role to ${r.toUpperCase()}`);
                    }}
                    className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider font-mono transition-all ${
                      activeRole === r
                        ? 'bg-gold text-charcoal shadow-sm'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-80 opacity-10 pointer-events-none flex items-center justify-center font-editorial text-[180px] font-bold text-gold">
            S
          </div>
        </div>

        {/* 1. Palette & Typography */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-sage-dark pb-2">
            <div>
              <h3 className="font-editorial text-xl font-bold text-charcoal">
                1. Color Palette & Typography
              </h3>
              <p className="text-xs text-muted">Core brand tokens defined in Tailwind CSS</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { name: 'Warm Ivory', hex: '#F7F5EF', bg: 'bg-ivory', border: 'border-sage-dark', text: 'text-charcoal' },
              { name: 'Deep Forest', hex: '#183D32', bg: 'bg-forest', border: 'border-forest', text: 'text-white' },
              { name: 'Charcoal', hex: '#252923', bg: 'bg-charcoal', border: 'border-charcoal', text: 'text-white' },
              { name: 'Champagne Gold', hex: '#C4A66A', bg: 'bg-gold', border: 'border-gold', text: 'text-charcoal' },
              { name: 'Soft Sage', hex: '#E5EBE3', bg: 'bg-sage', border: 'border-sage-dark', text: 'text-charcoal' },
              { name: 'Muted Gray', hex: '#85877F', bg: 'bg-muted', border: 'border-muted', text: 'text-white' },
            ].map((swatch) => (
              <div key={swatch.name} className="bg-white rounded-lg border border-sage p-3 shadow-xs">
                <div className={`h-12 w-full rounded ${swatch.bg} ${swatch.border} border mb-2 flex items-center justify-center`}>
                  <span className={`text-2xs font-mono font-bold ${swatch.text}`}>{swatch.hex}</span>
                </div>
                <p className="text-xs font-semibold text-charcoal truncate">{swatch.name}</p>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Typography Pairing</CardTitle>
              <CardDescription>Playfair Display (Editorial) + DM Sans (Interface) + JetBrains Mono (Codes)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-b border-sage/60 pb-3">
                <span className="text-2xs text-muted uppercase font-mono block">Heading 1 — Playfair Display</span>
                <h1 className="font-editorial text-3xl font-bold text-charcoal">
                  Excellence in Academic Governance & Administration
                </h1>
              </div>
              <div className="border-b border-sage/60 pb-3">
                <span className="text-2xs text-muted uppercase font-mono block">Heading 2 — Playfair Display</span>
                <h2 className="font-editorial text-2xl font-semibold text-charcoal">
                  Curriculum Architecture & Continuous Student Evaluation
                </h2>
              </div>
              <div>
                <span className="text-2xs text-muted uppercase font-mono block">Body & Captions — DM Sans & Mono</span>
                <p className="text-sm text-charcoal/90 leading-relaxed">
                  Scholara bridges the gap between institutional leadership, instructors, and guardians through verified,
                  tamper-resistant records, automated grade calculations, and strict role-based data isolation.
                </p>
                <span className="text-xs font-mono text-muted mt-2 block">
                  SYS_RECORD_ID: SCH-2024-SEC-09A // VERIFIED_HASH: 0x4f9a3e21
                </span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 2. Stat Cards & KPIs */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-sage-dark pb-2">
            <div>
              <h3 className="font-editorial text-xl font-bold text-charcoal">
                2. Key Performance Indicators (StatCards)
              </h3>
              <p className="text-xs text-muted">Executive metrics with trend calculations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Enrolled"
              value="1,248"
              icon={Users}
              trend={{ value: '+4.2%', isPositive: true, label: 'vs last term' }}
              accent="forest"
            />
            <StatCard
              title="Active Faculty"
              value="84"
              icon={GraduationCap}
              trend={{ value: '100%', isPositive: true, label: 'workload covered' }}
              accent="gold"
            />
            <StatCard
              title="Daily Attendance"
              value="94.6%"
              icon={CalendarCheck}
              trend={{ value: '+1.8%', isPositive: true, label: 'vs yesterday' }}
              accent="success"
            />
            <StatCard
              title="Fee Collection"
              value="₹42.8 L"
              icon={CreditCard}
              trend={{ value: '-2.4%', isPositive: false, label: '₹6.2L outstanding' }}
              accent="danger"
            />
          </div>
        </section>

        {/* 3. Interactive Buttons & Toast Triggers */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-sage-dark pb-2">
            <div>
              <h3 className="font-editorial text-xl font-bold text-charcoal">
                3. Buttons & Toast Feedback
              </h3>
              <p className="text-xs text-muted">Interactive button variants and notification triggers</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Button Variants & Sizes</CardTitle>
              <CardDescription>Click any button to trigger corresponding toast notification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  leftIcon={Plus}
                  onClick={() => showToast.success('Primary action succeeded.')}
                >
                  Primary Action
                </Button>

                <Button
                  variant="gold"
                  leftIcon={Sparkles}
                  onClick={() => showToast.info('Gold champagne accent action.')}
                >
                  Gold Accent
                </Button>

                <Button
                  variant="secondary"
                  leftIcon={Filter}
                  onClick={() => showToast.info('Secondary filter toggled.')}
                >
                  Secondary Action
                </Button>

                <Button
                  variant="outline"
                  onClick={() => showToast.info('Outlined action pressed.')}
                >
                  Outlined
                </Button>

                <Button
                  variant="danger"
                  leftIcon={Trash2}
                  onClick={() => showToast.error('Negative/destructive action recorded.')}
                >
                  Delete Record
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => showToast.info('Ghost button clicked.')}
                >
                  Ghost Button
                </Button>

                <Button
                  variant="primary"
                  isLoading
                >
                  Saving Record
                </Button>
              </div>

              <div className="border-t border-sage/60 pt-4 flex flex-wrap items-center gap-4">
                <span className="text-xs text-muted uppercase font-mono">Sizes:</span>
                <Button size="sm" variant="secondary">Small (sm)</Button>
                <Button size="md" variant="secondary">Medium (md)</Button>
                <Button size="lg" variant="secondary">Large (lg)</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 4. Form Controls */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-sage-dark pb-2">
            <div>
              <h3 className="font-editorial text-xl font-bold text-charcoal">
                4. Refined Form Controls
              </h3>
              <p className="text-xs text-muted">Inputs, select dropdowns, and textareas with validation states</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Form Elements with Validation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  name="name"
                  value={formValues.name}
                  onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                  placeholder="e.g. Dr. Arthur Vance"
                  required
                  hint="Institutional legal name as per government ID"
                />

                <Input
                  label="Institutional Email"
                  name="email"
                  type="email"
                  value={formValues.email}
                  onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                  leftIcon={Mail}
                  required
                />

                <Input
                  label="Temporary Password"
                  name="password"
                  type="password"
                  defaultValue="ScholaraSecure123"
                  leftIcon={Lock}
                  hint="Must contain at least 8 characters with numbers"
                />

                <Input
                  label="Input with Error State"
                  name="errorExample"
                  defaultValue="invalid_format@@domain"
                  error="Please enter a valid academic institutional email address"
                />

                <Select
                  label="Designation / Role"
                  name="role"
                  value={formValues.role}
                  onChange={(e) => setFormValues({ ...formValues, role: e.target.value })}
                  options={[
                    { value: 'Admin', label: 'School Administrator' },
                    { value: 'Teacher', label: 'Senior Faculty Educator' },
                    { value: 'Guardian', label: 'Registered Guardian' },
                  ]}
                  required
                />

                <Select
                  label="Select with Error"
                  name="selectError"
                  placeholder="Choose an academic term"
                  error="Academic term selection is mandatory"
                  options={['Term 1', 'Term 2', 'Annual Examination']}
                />

                <div className="md:col-span-2">
                  <Textarea
                    label="Internal Observations / Notes"
                    name="notes"
                    value={formValues.notes}
                    onChange={(e) => setFormValues({ ...formValues, notes: e.target.value })}
                    rows={3}
                    hint="Visible only to administrators and verified faculty"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFormValues({ name: '', email: '', role: 'Teacher', notes: '' })}
              >
                Reset Form
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => showToast.success('Form values verified and validated.')}
              >
                Save Details
              </Button>
            </CardFooter>
          </Card>
        </section>

        {/* 5. Badges & Status Indicators */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-sage-dark pb-2">
            <div>
              <h3 className="font-editorial text-xl font-bold text-charcoal">
                5. Badges & Status Indicators
              </h3>
              <p className="text-xs text-muted">Semantic pills with optional status dot</p>
            </div>
          </div>

          <Card>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="success" dot>Present / Active</Badge>
                <Badge variant="warning" dot>Pending Review</Badge>
                <Badge variant="danger" dot>Absent / Overdue</Badge>
                <Badge variant="info" dot>Late Arrival</Badge>
                <Badge variant="gold" dot>Honor Roll</Badge>
                <Badge variant="forest">Admin Role</Badge>
                <Badge variant="sage">Draft State</Badge>
                <Badge variant="outline">Unassigned</Badge>
              </div>

              <div className="border-t border-sage/60 pt-3 flex items-center gap-3">
                <span className="text-xs text-muted uppercase font-mono">Small Size:</span>
                <Badge variant="success" size="sm" dot>Active</Badge>
                <Badge variant="danger" size="sm" dot>Defaulter</Badge>
                <Badge variant="gold" size="sm">Gold Tier</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 6. Data Table Suite */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-sage-dark pb-2">
            <div>
              <h3 className="font-editorial text-xl font-bold text-charcoal">
                6. Data Table & Pagination
              </h3>
              <p className="text-xs text-muted">Complete with loading, empty, and data states</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={tableState === 'data' ? 'primary' : 'secondary'}
                onClick={() => setTableState('data')}
              >
                Data View
              </Button>
              <Button
                size="sm"
                variant={tableState === 'loading' ? 'primary' : 'secondary'}
                onClick={() => setTableState('loading')}
              >
                Loading View
              </Button>
              <Button
                size="sm"
                variant={tableState === 'empty' ? 'primary' : 'secondary'}
                onClick={() => setTableState('empty')}
              >
                Empty View
              </Button>
            </div>
          </div>

          <TableContainer>
            <Table>
              <Thead>
                <Tr>
                  <Th>Student ID</Th>
                  <Th>Student Name</Th>
                  <Th>Class Section</Th>
                  <Th>Attendance</Th>
                  <Th>Status</Th>
                  <Th>Fee Ledger</Th>
                  <Th align="right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {tableState === 'loading' ? (
                  <TableLoadingState rows={5} cols={7} />
                ) : tableState === 'empty' ? (
                  <TableEmptyState
                    title="No students enrolled yet"
                    description="Get started by enrolling new students or importing existing class rosters."
                    action={
                      <Button
                        size="sm"
                        variant="gold"
                        leftIcon={Plus}
                        onClick={() => setIsModalOpen(true)}
                      >
                        Enroll First Student
                      </Button>
                    }
                    colSpan={7}
                  />
                ) : (
                  sampleStudents.map((s) => (
                    <Tr key={s.id}>
                      <Td className="font-mono text-xs font-semibold text-muted">{s.id}</Td>
                      <Td className="font-medium font-editorial text-charcoal text-base">{s.name}</Td>
                      <Td>{s.class}</Td>
                      <Td>
                        <span className="font-semibold text-charcoal">{s.attendance}</span>
                      </Td>
                      <Td>
                        <Badge
                          variant={s.status === 'Active' ? 'success' : s.status === 'Late' ? 'info' : 'danger'}
                          dot
                          size="sm"
                        >
                          {s.status}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge
                          variant={s.fee === 'Paid' ? 'forest' : s.fee === 'Pending' ? 'warning' : 'danger'}
                          size="sm"
                        >
                          {s.fee}
                        </Badge>
                      </Td>
                      <Td align="right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setIsModalOpen(true);
                              showToast.info(`Inspecting profile for ${s.name}`);
                            }}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => showToast.error(`Record ${s.id} deletion restricted`)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-danger" />
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
            <TablePagination
              page={currentPage}
              limit={5}
              total={sampleStudents.length}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </TableContainer>
        </section>

        {/* 7. Modal Dialog Demo */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-sage-dark pb-2">
            <div>
              <h3 className="font-editorial text-xl font-bold text-charcoal">
                7. Animated Modal Dialog
              </h3>
              <p className="text-xs text-muted">Framer Motion transitions with backdrop blur</p>
            </div>
            <Button
              variant="primary"
              leftIcon={Plus}
              onClick={() => setIsModalOpen(true)}
            >
              Open Sample Modal
            </Button>
          </div>
        </section>

        {/* Reusable Modal Dialog */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Student Registration & Profile"
          description="Enter legal student information and assign academic classroom"
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsModalOpen(false);
                  showToast.success('Student record registered successfully.');
                }}
              >
                Confirm & Enroll
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Legal Full Name"
              name="modalStudentName"
              placeholder="e.g. Katherine Pierce"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Class & Grade"
                name="modalGrade"
                options={['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']}
                required
              />
              <Select
                label="Assigned Section"
                name="modalSection"
                options={['Section A', 'Section B', 'Section C']}
                required
              />
            </div>
            <Input
              label="Guardian Contact Email"
              name="modalGuardianEmail"
              type="email"
              placeholder="guardian@family.org"
              required
            />
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default DesignSystemShowcase;
