import api from './api.js';

const examinationService = {
  getExaminations: async () => (await api.get('/examinations')).data,
  create: async (data) => (await api.post('/examinations', data)).data,
  update: async (id, data) => (await api.put(`/examinations/${id}`, data)).data,
  remove: async (id) => (await api.delete(`/examinations/${id}`)).data,
  getRoster: async (id, params) => (await api.get(`/examinations/${id}/roster`, { params })).data,
  getResults: async (params) => (await api.get('/examinations/results', { params })).data,
  submitResults: async (data) => (await api.post('/examinations/results', data)).data,
  getReportCard: async (studentId, params) => (await api.get(`/examinations/report-card/${studentId}`, { params })).data,
};

export default examinationService;
