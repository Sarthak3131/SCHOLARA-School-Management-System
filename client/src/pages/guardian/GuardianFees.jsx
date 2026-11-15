import { useCallback, useEffect, useState } from 'react';
import { CreditCard, Printer, Receipt } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card.jsx';
import { StatCard } from '@/components/ui/StatCard.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { TableContainer, Table, Thead, Tbody, Tr, Th, Td, TableEmptyState, TableLoadingState } from '@/components/ui/Table.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import feeService from '@/services/feeService.js';
import { showToast } from '@/utils/toast.js';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const GuardianFees = () => {
  const { user, logout } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try { const response = await feeService.getInvoices(); if (response.success) setInvoices(response.data); }
    catch (error) { showToast.error(error.message || 'Fee invoices could not be loaded.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const showHistory = async (invoice) => {
    try { const response = await feeService.getPayments(invoice._id); if (response.success) setPayments(response.data.payments); }
    catch (error) { showToast.error(error.message || 'Payment history could not be loaded.'); }
  };
  const printReceipt = async (paymentId) => {
    try { const response = await feeService.getReceipt(paymentId); if (!response.success) return; const payment = response.data; const popup = window.open('', '_blank', 'width=720,height=720'); popup.document.write(`<html><head><title>Payment Receipt ${payment.paymentReference}</title></head><body style="font-family:Arial;padding:40px"><h1>SCHOLARA</h1><h2>Payment Receipt</h2><p>Reference: ${payment.paymentReference}</p><p>Student: ${payment.invoice.student.name}</p><p>Invoice: ${payment.invoice.invoiceNumber}</p><p>Amount paid: ₹${payment.amount.toFixed(2)}</p><p>Date: ${new Date(payment.createdAt).toLocaleString()}</p></body></html>`); popup.document.close(); popup.print(); }
    catch (error) { showToast.error(error.message || 'Receipt could not be opened.'); }
  };
  const outstanding = invoices.reduce((sum, item) => sum + Number(item.outstandingAmount || 0), 0);
  const paid = invoices.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0);
  return <AppLayout role="guardian" title="Fee Invoices" subtitle="Secure invoices and payment history for linked students" user={user} onLogout={logout}><div className="space-y-6 pb-12"><div className="grid grid-cols-2 gap-4"><StatCard title="Paid" value={money(paid)} icon={Receipt} accent="success" /><StatCard title="Outstanding" value={money(outstanding)} icon={CreditCard} accent="gold" /></div><Card><CardHeader><CardTitle>Linked student invoices</CardTitle></CardHeader><CardContent noPadding><TableContainer className="border-0 shadow-none"><Table><Thead><Tr><Th>Invoice</Th><Th>Student</Th><Th>Total</Th><Th>Paid</Th><Th>Outstanding</Th><Th>Status</Th><Th align="right">History</Th></Tr></Thead><Tbody>{loading ? <TableLoadingState cols={7} /> : !invoices.length ? <TableEmptyState colSpan={7} title="No invoices available" /> : invoices.map((invoice) => <Tr key={invoice._id}><Td className="font-mono text-xs">{invoice.invoiceNumber}</Td><Td className="font-semibold">{invoice.student?.name}</Td><Td>{money(invoice.amount)}</Td><Td>{money(invoice.paidAmount)}</Td><Td>{money(invoice.outstandingAmount)}</Td><Td><Badge variant={invoice.status === 'paid' ? 'success' : 'gold'} className="capitalize">{invoice.status}</Badge></Td><Td align="right"><Button size="sm" variant="ghost" onClick={() => showHistory(invoice)}>View payments</Button></Td></Tr>)}</Tbody></Table></TableContainer></CardContent></Card>{payments.length > 0 && <Card><CardHeader><CardTitle><span className="flex items-center gap-2"><Receipt className="w-4 h-4 text-gold-dark" />Payment history</span></CardTitle></CardHeader><CardContent noPadding><TableContainer className="border-0 shadow-none"><Table><Thead><Tr><Th>Reference</Th><Th>Amount</Th><Th>Method</Th><Th>Date</Th><Th align="right">Receipt</Th></Tr></Thead><Tbody>{payments.map((payment) => <Tr key={payment._id}><Td className="font-mono text-xs">{payment.paymentReference}</Td><Td>{money(payment.amount)}</Td><Td className="capitalize">{payment.method.replace('_', ' ')}</Td><Td>{new Date(payment.createdAt).toLocaleDateString()}</Td><Td align="right"><Button size="sm" variant="outline" leftIcon={Printer} onClick={() => printReceipt(payment._id)}>Print</Button></Td></Tr>)}</Tbody></Table></TableContainer></CardContent></Card>}</div></AppLayout>;
};
export default GuardianFees;
