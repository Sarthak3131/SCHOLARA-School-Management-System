import api from './api.js';
import { buildQueryString } from '../utils/helpers.js';

export const studentService = {
  getStudents: async (params = {}) => {
    const qs = buildQueryString(params);
    const response = await api.get(`/students?${qs}`);
    return response.data;
  },

  getStudentById: async (id) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  createStudent: async (data) => {
    const response = await api.post('/students', data);
    return response.data;
  },

  updateStudent: async (id, data) => {
    const response = await api.put(`/students/${id}`, data);
    return response.data;
  },

  deleteStudent: async (id) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },
};

export default studentService;
