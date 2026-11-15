import api from './api.js';

const feeService = {
  getStructures: async () => (await api.get('/fees/structures')).data,
  createStructure: async (data) => (await api.post('/fees/structures', data)).data,
  updateStructure: async (id, data) => (await api.put(`/fees/structures/${id}`, data)).data,
  getInvoices: async (params = {}) => (await api.get('/fees/invoices', { params })).data,
  createInvoice: async (data) => (await api.post('/fees/invoices', data)).data,
  getPayments: async (id) => (await api.get(`/fees/invoices/${id}/payments`)).data,
  recordPayment: async (id, data) => (await api.post(`/fees/invoices/${id}/payments`, data)).data,
  getReceipt: async (id) => (await api.get(`/fees/payments/${id}/receipt`)).data,
  getStats: async () => (await api.get('/fees/stats')).data,
};

export default feeService;
