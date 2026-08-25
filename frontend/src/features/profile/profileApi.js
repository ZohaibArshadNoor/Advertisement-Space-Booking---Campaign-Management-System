import apiClient from '../../services/apiClient';

export const profileApi = {
  // GET /api/auth/me
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // PUT /api/auth/profile
  updateProfile: async (data) => {
    const response = await apiClient.put('/auth/profile', data);
    return response.data;
  },

  // POST /api/auth/change-password
  changePassword: async (data) => {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  },
};