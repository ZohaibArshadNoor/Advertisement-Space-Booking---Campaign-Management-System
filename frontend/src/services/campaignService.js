import apiClient from './apiClient';

export const campaignService = {
  // GET /api/campaigns?page=1&per_page=10&status=...&search=...
  getCampaigns: async (params = {}) => {
    const response = await apiClient.get('/campaigns', { params });
    return response.data;
  },

  // GET /api/campaigns/:id
  getCampaignById: async (id) => {
    const response = await apiClient.get(`/campaigns/${id}`);
    return response.data;
  },

  // POST /api/campaigns
  createCampaign: async (campaignData) => {
    const response = await apiClient.post('/campaigns', campaignData);
    return response.data;
  },

  // PATCH /api/campaigns/:id
  updateCampaign: async (id, campaignData) => {
    const response = await apiClient.patch(`/campaigns/${id}`, campaignData);
    return response.data;
  },

  // PATCH /api/campaigns/:id/status
  updateStatus: async (id, status) => {
    const response = await apiClient.patch(`/campaigns/${id}/status`, { status });
    return response.data;
  },

  // DELETE /api/campaigns/:id
  deleteCampaign: async (id) => {
    const response = await apiClient.delete(`/campaigns/${id}`);
    return response.data;
  },
};