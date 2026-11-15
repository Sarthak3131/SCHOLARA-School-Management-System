import { useCallback, useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card.jsx';
import { TableContainer, Table, Thead, Tbody, Tr, Th, Td, TableEmptyState, TableLoadingState } from '@/components/ui/Table.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import examinationService from '@/services/examinationService.js';
import { showToast } from '@/utils/toast.js';

const GuardianResults = () => {
  const { user, logout } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try { const response = await examinationService.getResults({}); if (response.success) setResults(response.data); }
    catch (error) { showToast.error(error.message || 'Results could not be loaded.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return <AppLayout role="guardian" title="Report Cards" subtitle="Results for your linked students only" user={user} onLogout={logout}><Card><CardHeader><CardTitle><span className="flex items-center gap-2"><Award className="w-4 h-4 text-gold-dark" />Published results</span></CardTitle></CardHeader><CardContent noPadding><TableContainer className="border-0 shadow-none"><Table><Thead><Tr><Th>Student</Th><Th>Examination</Th><Th>Subject</Th><Th>Marks</Th><Th>Grade</Th></Tr></Thead><Tbody>{loading ? <TableLoadingState cols={5} /> : !results.length ? <TableEmptyState colSpan={5} icon={Award} title="No results available" /> : results.map((item) => <Tr key={item._id}><Td className="font-semibold">{item.student?.name}</Td><Td>{item.examination?.name}</Td><Td>{item.subject?.name}</Td><Td>{item.marks} / {item.maxMarks}</Td><Td className="font-semibold text-forest">{item.grade}</Td></Tr>)}</Tbody></Table></TableContainer></CardContent></Card></AppLayout>;
};
export default GuardianResults;
