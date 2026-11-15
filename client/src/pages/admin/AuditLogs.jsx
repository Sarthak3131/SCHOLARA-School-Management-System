import { useCallback, useEffect, useState } from 'react';
import { Eye, Filter, ShieldAlert } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Select } from '@/components/ui/Select.jsx';
import { Modal } from '@/components/ui/Modal.jsx';
import { TableContainer, Table, Thead, Tbody, Tr, Th, Td, TableEmptyState, TableLoadingState, TablePagination } from '@/components/ui/Table.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import auditService from '@/services/auditService.js';
import { showToast } from '@/utils/toast.js';

const modules = ['student', 'teacher', 'guardian', 'class', 'subject', 'attendance', 'examination', 'result', 'fee_structure', 'invoice', 'payment', 'system'];

const AuditLogs = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState({ logs: [], actors: [], pagination: { page: 1, limit: 20, total: 0, pages: 1 } });
  const [filters, setFilters] = useState({ search: '', module: '', action: '', actorId: '', from: '', to: '', page: 1 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    try { const response = await auditService.getLogs(filters); if (response.success) setData(response.data); }
    catch (error) { showToast.error(error.message || 'Audit logs could not be loaded.'); }
    finally { setLoading(false); }
  }, [filters]);
  useEffect(() => { load(); }, [load]);
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  return <AppLayout role="admin" title="Audit Trail" subtitle="Read-only administrative activity history" user={user} onLogout={logout}>
    <div className="space-y-6 pb-12"><Card><CardHeader><CardTitle><span className="flex items-center gap-2"><Filter className="w-4 h-4 text-gold-dark" />Audit filters</span></CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"><Input label="Search" value={filters.search} onChange={(e) => update('search', e.target.value)} placeholder="Actor or description" /><Select label="Module" value={filters.module} onChange={(e) => update('module', e.target.value)} options={modules} /><Select label="Actor" value={filters.actorId} onChange={(e) => update('actorId', e.target.value)} options={data.actors.map((actor) => ({ value: actor._id, label: `${actor.name} · ${actor.role}` }))} /><Input label="From" type="date" value={filters.from} onChange={(e) => update('from', e.target.value)} /><Input label="To" type="date" value={filters.to} onChange={(e) => update('to', e.target.value)} /></div></CardContent></Card><Card><CardHeader><CardTitle><span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-gold-dark" />Activity timeline</span></CardTitle></CardHeader><CardContent noPadding><TableContainer className="border-0 shadow-none"><Table><Thead><Tr><Th>Timestamp</Th><Th>Actor</Th><Th>Action</Th><Th>Module</Th><Th>Description</Th><Th align="right">Details</Th></Tr></Thead><Tbody>{loading ? <TableLoadingState cols={6} /> : !data.logs.length ? <TableEmptyState colSpan={6} icon={ShieldAlert} title="No audit activity" description="Matching administrative activity will appear here." /> : data.logs.map((log) => <Tr key={log._id}><Td className="font-mono text-xs">{new Date(log.createdAt).toLocaleString()}</Td><Td>{log.userName}<span className="block text-2xs text-muted capitalize">{log.userRole}</span></Td><Td className="font-semibold">{log.action}</Td><Td className="capitalize">{log.module?.replace('_', ' ')}</Td><Td className="max-w-xs truncate">{log.details}</Td><Td align="right"><Button size="sm" variant="ghost" leftIcon={Eye} onClick={() => setSelected(log)}>View</Button></Td></Tr>)}</Tbody></Table><TablePagination page={data.pagination.page} limit={data.pagination.limit} total={data.pagination.total} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} /></TableContainer></CardContent></Card></div>
    <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title="Audit entry details"><div className="space-y-3 text-sm">{selected && <><div><span className="text-muted">Actor:</span> <strong>{selected.userName}</strong> ({selected.userRole})</div><div><span className="text-muted">Action:</span> <strong>{selected.action}</strong></div><div><span className="text-muted">Module:</span> <strong className="capitalize">{selected.module?.replace('_', ' ')}</strong></div><div><span className="text-muted">Timestamp:</span> {new Date(selected.createdAt).toLocaleString()}</div><div className="p-3 rounded bg-sage/50 text-charcoal">{selected.details}</div><div className="text-xs text-muted">Request address: {selected.ipAddress || 'Not recorded'}</div></>}</div></Modal>
  </AppLayout>;
};
export default AuditLogs;
