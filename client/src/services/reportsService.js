import api from './api.js';

const reportsService = {
  getStudents: async (params = {}) => (await api.get('/reports/students', { params })).data,
  getAttendance: async (params = {}) => (await api.get('/reports/attendance', { params })).data,
  getExaminations: async (params = {}) => (await api.get('/reports/examinations', { params })).data,
  getFees: async (params = {}) => (await api.get('/reports/fees', { params })).data,
};

export default reportsService;
