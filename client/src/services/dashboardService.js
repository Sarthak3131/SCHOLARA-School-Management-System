import api from './api.js';

export const dashboardService = {
  /**
   * Fetch complete administrator dashboard statistics and aggregations
   */
  getAdminDashboard: async () => {
    const response = await api.get('/dashboard/admin');
    return response.data;
  },
};

export default dashboardService;
