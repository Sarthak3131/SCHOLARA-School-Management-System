import api from './api.js';
import { buildQueryString } from '../utils/helpers.js';

export const teacherService = {
  getTeachers: async (params = {}) => {
    const qs = buildQueryString(params);
    const response = await api.get(`/teachers?${qs}`);
    return response.data;
  },

  getTeacherById: async (id) => {
    const response = await api.get(`/teachers/${id}`);
    return response.data;
  },

  createTeacher: async (data) => {
    const response = await api.post('/teachers', data);
    return response.data;
  },

  updateTeacher: async (id, data) => {
    const response = await api.put(`/teachers/${id}`, data);
    return response.data;
  },

  assignClasses: async (id, assignedClasses) => {
    const response = await api.patch(`/teachers/${id}/assignments`, { assignedClasses });
    return response.data;
  },

  deleteTeacher: async (id) => {
    const response = await api.delete(`/teachers/${id}`);
    return response.data;
  },
};

export default teacherService;
