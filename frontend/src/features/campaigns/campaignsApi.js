import apiClient from '../../services/apiClient';

export const campaignsApi = {
  getCampaigns: async (params = {}) => {
    const response = await apiClient.get('/campaigns', { params });
    return response.data;
  },
  getCampaignById: async (id) => {
    const response = await apiClient.get(`/campaigns/${id}`);
    return response.data;
  },
  createCampaign: async (data) => {
    const response = await apiClient.post('/campaigns', data);
    return response.data;
  },
  updateCampaign: async (id, data) => {
    const response = await apiClient.put(`/campaigns/${id}`, data);
    return response.data;
  },
  deleteCampaign: async (id) => {
    const response = await apiClient.delete(`/campaigns/${id}`);
    return response.data;
  },
};
