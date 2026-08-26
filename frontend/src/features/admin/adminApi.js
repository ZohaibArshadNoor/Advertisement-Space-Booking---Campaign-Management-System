import apiClient from '../../services/apiClient';

export const adminApi = {
  // Users Management
  getUsers: async (params = {}) => {
    const response = await apiClient.get('/users/', { params });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await apiClient.post('/users/', userData);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
  },

  updateUserStatus: async (id, isActive) => {
    const response = await apiClient.patch(`/users/${id}/status`, { is_active: isActive });
    return response.data;
  },

  toggleUserStatus: async (id, isActive) => {
    const response = await apiClient.patch(`/users/${id}/status`, { is_active: isActive });
    return response.data;
  },

  resetUserPassword: async (id, newPassword) => {
    const response = await apiClient.post(`/users/${id}/reset-password`, { 
      new_password: newPassword,
      password: newPassword 
    });
    return response.data;
  },

  resetPassword: async (id, newPassword) => {
    const response = await apiClient.post(`/users/${id}/reset-password`, { 
      new_password: newPassword,
      password: newPassword 
    });
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },

  // Advertiser / Company Profile Management
  getAdvertisers: async () => {
    const response = await apiClient.get('/advertisers/');
    return response.data;
  },

  getAdvertiserById: async (id) => {
    const response = await apiClient.get(`/advertisers/${id}`);
    return response.data;
  },

  updateAdvertiser: async (id, data) => {
    const response = await apiClient.put(`/advertisers/${id}`, data);
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (params = {}) => {
    const response = await apiClient.get('/audit-logs', { params });
    return response.data;
  },
};