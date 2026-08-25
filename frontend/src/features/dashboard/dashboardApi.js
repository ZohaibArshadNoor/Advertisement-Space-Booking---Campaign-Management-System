import apiClient from '../../services/apiClient';

export const dashboardApi = {
  // GET /api/dashboard/summary (Role-scoped KPI summary)
  getSummary: async () => {
    const response = await apiClient.get('/dashboard/summary');
    return response.data;
  },

  // GET /api/reports/revenue
  getRevenueReport: async (params = {}) => {
    const response = await apiClient.get('/reports/revenue', { params });
    return response.data;
  },

  // GET /api/reports/occupancy
  getOccupancyReport: async (params = {}) => {
    const response = await apiClient.get('/reports/occupancy', { params });
    return response.data;
  },
};