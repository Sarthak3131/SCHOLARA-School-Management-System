import api from './api.js';

const auditService = {
  getLogs: async (params = {}) => (await api.get('/audit', { params })).data,
  getLog: async (id) => (await api.get(`/audit/${id}`)).data,
};

export default auditService;
