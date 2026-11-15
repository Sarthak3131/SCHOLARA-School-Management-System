import { useCallback, useEffect, useState } from 'react';
import { Link2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout.jsx';
import { Card, CardContent } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Select } from '@/components/ui/Select.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Modal } from '@/components/ui/Modal.jsx';
import { TableContainer, Table, Thead, Tbody, Tr, Th, Td, TableEmptyState, TableLoadingState } from '@/components/ui/Table.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import academicService from '@/services/academicService.js';
import studentService from '@/services/studentService.js';
import { showToast } from '@/utils/toast.js';

const GuardiansManagement = () => {
  const { user, logout } = useAuth();
  const [guardians, setGuardians] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedGuardian, setSelectedGuardian] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [guardianResponse, studentResponse] = await Promise.all([
        academicService.getGuardianManagement(),
        studentService.getStudents({ limit: 100, status: 'active' }),
      ]);
      if (guardianResponse.success) setGuardians(guardianResponse.data);
      if (studentResponse.success) setStudents(studentResponse.data);
    } catch (error) {
      showToast.error(error.message || 'Could not load guardian records.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openLinkModal = (guardian) => {
    setSelectedGuardian(guardian);
    setSelectedStudent('');
    setIsModalOpen(true);
  };

  const linkStudent = async (event) => {
    event.preventDefault();
    if (!selectedGuardian || !selectedStudent) {
      showToast.error('Select a student before linking the guardian.');
      return;
    }
    const student = students.find((item) => item._id === selectedStudent);
    if (!student) return;
    setIsSubmitting(true);
    try {
      await studentService.updateStudent(student._id, { guardian: selectedGuardian._id });
      showToast.success(`${selectedGuardian.name} is now linked to ${student.name}.`);
      setIsModalOpen(false);
      await fetchData();
    } catch (error) {
      showToast.error(error.message || 'Guardian link failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout role="admin" title="Guardian Management" subtitle="Verified Guardian Accounts & Linked Student Records" user={user} onLogout={logout}>
      <div className="space-y-6 pb-12">
        <div className="bg-white rounded-lg border border-sage p-5 shadow-card">
          <Badge variant="gold" size="sm" className="font-mono">FAMILY RELATIONSHIPS</Badge>
          <h2 className="font-editorial text-2xl font-bold text-charcoal mt-1">Guardian Directory</h2>
          <p className="text-xs text-muted mt-1">Only relationship-safe student summaries are shown for administrative linking.</p>
        </div>
        <TableContainer>
          <Table>
            <Thead><Tr><Th>Guardian</Th><Th>Contact</Th><Th>Linked Students</Th><Th align="right">Actions</Th></Tr></Thead>
            <Tbody>
              {isLoading ? <TableLoadingState rows={5} cols={4} /> : guardians.length === 0 ? (
                <TableEmptyState title="No active guardians found" description="Create guardian accounts before linking students." colSpan={4} />
              ) : guardians.map((guardian) => (
                <Tr key={guardian._id}>
                  <Td><span className="font-editorial font-semibold text-charcoal">{guardian.name}</span><span className="block text-2xs text-muted font-mono">{guardian.email}</span></Td>
                  <Td className="text-xs text-muted">{guardian.phone || 'Not provided'}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {(guardian.linkedStudents || []).length === 0 ? <span className="text-2xs text-muted">No linked students</span> : guardian.linkedStudents.map((student) => <Badge key={student._id} variant="sage" size="sm">{student.name} · {student.class?.code || 'Class'}-{student.section}</Badge>)}
                    </div>
                  </Td>
                  <Td align="right"><Button variant="secondary" size="sm" leftIcon={Link2} onClick={() => openLinkModal(guardian)}>Link Student</Button></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Link Student to ${selectedGuardian?.name || 'Guardian'}`} description="Linking updates only the selected student's guardian relationship." size="md" footer={<><Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button variant="primary" size="sm" isLoading={isSubmitting} onClick={linkStudent}>Save Link</Button></>}>
          <form onSubmit={linkStudent}>
            <Select label="Active Student" name="student" value={selectedStudent} onChange={(event) => setSelectedStudent(event.target.value)} options={students.map((student) => ({ value: student._id, label: `${student.name} · ${student.admissionNumber}` }))} placeholder="Select a student" required />
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default GuardiansManagement;
