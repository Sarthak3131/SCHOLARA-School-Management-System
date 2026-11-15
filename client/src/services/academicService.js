import api from './api.js';

export const academicService = {
  getClasses: async () => {
    const response = await api.get('/academics/classes');
    return response.data;
  },

  createClass: async (data) => {
    const response = await api.post('/academics/classes', data);
    return response.data;
  },

  updateClass: async (id, data) => {
    const response = await api.put(`/academics/classes/${id}`, data);
    return response.data;
  },

  deleteClass: async (id) => {
    const response = await api.delete(`/academics/classes/${id}`);
    return response.data;
  },

  getSubjects: async () => {
    const response = await api.get('/academics/subjects');
    return response.data;
  },

  createSubject: async (data) => {
    const response = await api.post('/academics/subjects', data);
    return response.data;
  },

  updateSubject: async (id, data) => {
    const response = await api.put(`/academics/subjects/${id}`, data);
    return response.data;
  },

  deleteSubject: async (id) => {
    const response = await api.delete(`/academics/subjects/${id}`);
    return response.data;
  },

  getGuardians: async () => {
    const response = await api.get('/academics/guardians');
    return response.data;
  },

  getGuardianManagement: async () => {
    const response = await api.get('/academics/guardians/management');
    return response.data;
  },
};

export default academicService;
