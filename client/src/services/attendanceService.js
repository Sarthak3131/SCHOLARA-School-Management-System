import api from './api.js';

const attendanceService = {
  getOptions: async () => (await api.get('/attendance/options')).data,
  getRoster: async (params) => (await api.get('/attendance/roster', { params })).data,
  getAttendance: async (params) => (await api.get('/attendance', { params })).data,
  getSummary: async (params) => (await api.get('/attendance/summary', { params })).data,
  submit: async (data) => (await api.post('/attendance', data)).data,
  update: async (id, data) => (await api.put(`/attendance/${id}`, data)).data,
};

export default attendanceService;
