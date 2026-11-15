import api from './api.js';

const guardianService = {
  getLinkedStudents: async () => (await api.get('/students/linked')).data,
  getStudentProfile: async (studentId) => (await api.get(`/students/${studentId}`)).data,
};

export default guardianService;
