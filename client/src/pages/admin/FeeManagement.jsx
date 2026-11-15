import { useCallback, useEffect, useState } from 'react';
import { CreditCard, FilePlus2, Plus, Receipt, Wallet } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card.jsx';
import { StatCard } from '@/components/ui/StatCard.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Select } from '@/components/ui/Select.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Modal } from '@/components/ui/Modal.jsx';
import { TableContainer, Table, Thead, Tbody, Tr, Th, Td, TableEmptyState, TableLoadingState } from '@/components/ui/Table.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import academicService from '@/services/academicService.js';
import studentService from '@/services/studentService.js';
import feeService from '@/services/feeService.js';
import { showToast } from '@/utils/toast.js';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const FeeManagement = () => {
  const { user, logout } = useAuth();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [structures, setStructures] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [structureForm, setStructureForm] = useState({ name: '', classId: '', academicTerm: 'Term 1 (2024-2025)', itemName: 'Tuition Fee', itemAmount: '' });
  const [invoiceForm, setInvoiceForm] = useState({ studentId: '', feeStructureId: '', dueDate: '' });
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentReference: '', method: 'simulated_online' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [classResponse, studentResponse, structureResponse, invoiceResponse, statsResponse] = await Promise.all([
        academicService.getClasses(), studentService.getStudents({ limit: 100 }), feeService.getStructures(), feeService.getInvoices(), feeService.getStats(),
      ]);
      if (classResponse.success) setClasses(classResponse.data);
      if (studentResponse.success) setStudents(studentResponse.data);
      if (structureResponse.success) setStructures(structureResponse.data);
      if (invoiceResponse.success) setInvoices(invoiceResponse.data);
      if (statsResponse.success) setStats(statsResponse.data);
    } catch (error) { showToast.error(error.message || 'Fee data could not be loaded.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const createStructure = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await feeService.createStructure({ name: structureForm.name, classId: structureForm.classId, academicTerm: structureForm.academicTerm, items: [{ name: structureForm.itemName, amount: Number(structureForm.itemAmount) }] });
      if (response.success) { showToast.success('Fee structure created.'); setStructureForm({ ...structureForm, name: '', itemAmount: '' }); await load(); }
    } catch (error) { showToast.error(error.message || 'Fee structure could not be created.'); }
    finally { setSaving(false); }
  };
  const createInvoice = async (event) => {
    event.preventDefault();
    setSaving(true);
    try { const response = await feeService.createInvoice(invoiceForm); if (response.success) { showToast.success('Invoice generated.'); setInvoiceForm({ ...invoiceForm, studentId: '', dueDate: '' }); await load(); } }
    catch (error) { showToast.error(error.message || 'Invoice could not be generated.'); }
    finally { setSaving(false); }
  };
  const recordPayment = async (event) => {
    event.preventDefault();
    setSaving(true);
    try { const response = await feeService.recordPayment(paymentInvoice._id, { ...paymentForm, amount: Number(paymentForm.amount) }); if (response.success) { showToast.success('Payment recorded and reconciled.'); setPaymentInvoice(null); setPaymentForm({ amount: '', paymentReference: '', method: 'simulated_online' }); await load(); } }
    catch (error) { showToast.error(error.message || 'Payment could not be recorded.'); }
    finally { setSaving(false); }
  };

  return <AppLayout role="admin" title="Fee Ledger" subtitle="Structures, invoices, simulated payments and reconciliation" user={user} onLogout={logout}>
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Invoiced" value={money(stats.totalInvoiced)} icon={FilePlus2} accent="forest" />
        <StatCard title="Collected" value={money(stats.totalCollected)} icon={Wallet} accent="success" />
        <StatCard title="Outstanding" value={money(stats.totalOutstanding)} icon={CreditCard} accent="danger" />
        <StatCard title="Collection Rate" value={`${stats.collectionRate || 0}%`} icon={Receipt} accent="gold" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle><span className="flex items-center gap-2"><Plus className="w-4 h-4 text-gold-dark" />Fee structure</span></CardTitle></CardHeader><CardContent><form onSubmit={createStructure} className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Input label="Structure name" value={structureForm.name} onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })} required /><Select label="Class" value={structureForm.classId} onChange={(e) => setStructureForm({ ...structureForm, classId: e.target.value })} options={classes.map((item) => ({ value: item._id, label: `${item.name} (${item.code})` }))} /><Input label="Fee item" value={structureForm.itemName} onChange={(e) => setStructureForm({ ...structureForm, itemName: e.target.value })} required /><Input label="Amount" type="number" min="0.01" value={structureForm.itemAmount} onChange={(e) => setStructureForm({ ...structureForm, itemAmount: e.target.value })} required /><Button type="submit" isLoading={saving} className="sm:col-span-2">Save structure</Button></form></CardContent></Card>
        <Card><CardHeader><CardTitle><span className="flex items-center gap-2"><FilePlus2 className="w-4 h-4 text-gold-dark" />Generate invoice</span></CardTitle></CardHeader><CardContent><form onSubmit={createInvoice} className="space-y-3"><Select label="Student" value={invoiceForm.studentId} onChange={(e) => setInvoiceForm({ ...invoiceForm, studentId: e.target.value })} options={students.map((item) => ({ value: item._id, label: `${item.name} · ${item.admissionNumber}` }))} /><Select label="Fee structure" value={invoiceForm.feeStructureId} onChange={(e) => setInvoiceForm({ ...invoiceForm, feeStructureId: e.target.value })} options={structures.map((item) => ({ value: item._id, label: `${item.name} · ${item.class?.code}` }))} /><Input label="Due date" type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} required /><Button type="submit" isLoading={saving}>Generate invoice</Button></form></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Invoice ledger</CardTitle></CardHeader><CardContent noPadding><TableContainer className="border-0 shadow-none"><Table><Thead><Tr><Th>Invoice</Th><Th>Student</Th><Th>Total</Th><Th>Paid</Th><Th>Outstanding</Th><Th>Status</Th><Th align="right">Action</Th></Tr></Thead><Tbody>{loading ? <TableLoadingState cols={7} /> : !invoices.length ? <TableEmptyState colSpan={7} title="No invoices available" /> : invoices.map((invoice) => <Tr key={invoice._id}><Td className="font-mono text-xs">{invoice.invoiceNumber}</Td><Td className="font-semibold">{invoice.student?.name}</Td><Td>{money(invoice.amount)}</Td><Td>{money(invoice.paidAmount)}</Td><Td className="font-semibold">{money(invoice.outstandingAmount)}</Td><Td><Badge variant={invoice.status === 'paid' ? 'success' : invoice.status === 'partial' ? 'gold' : 'danger'} className="capitalize">{invoice.status}</Badge></Td><Td align="right">{invoice.outstandingAmount > 0 && <Button size="sm" variant="outline" onClick={() => { setPaymentInvoice(invoice); setPaymentForm({ amount: '', paymentReference: `PAY-${Date.now()}`, method: 'simulated_online' }); }}>Record payment</Button>}</Td></Tr>)}</Tbody></Table></TableContainer></CardContent></Card>
    </div>
    <Modal isOpen={Boolean(paymentInvoice)} onClose={() => setPaymentInvoice(null)} title="Record simulated payment" description={paymentInvoice ? `${paymentInvoice.invoiceNumber} · outstanding ${money(paymentInvoice.outstandingAmount)}` : ''} footer={<><Button variant="secondary" onClick={() => setPaymentInvoice(null)}>Cancel</Button><Button onClick={recordPayment} isLoading={saving}>Record payment</Button></>}><div className="space-y-3"><Input label="Amount" type="number" min="0.01" max={paymentInvoice?.outstandingAmount} value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required /><Input label="Payment reference" value={paymentForm.paymentReference} onChange={(e) => setPaymentForm({ ...paymentForm, paymentReference: e.target.value })} required /><Select label="Method" value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })} options={['simulated_online', 'cash', 'bank_transfer']} placeholder="" /></div></Modal>
  </AppLayout>;
};
export default FeeManagement;
