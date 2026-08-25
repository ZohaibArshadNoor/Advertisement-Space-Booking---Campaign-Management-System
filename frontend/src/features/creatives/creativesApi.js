import apiClient from '../../services/apiClient';

export const creativesApi = {
  // POST /api/media/campaigns/:campaignId (multipart/form-data)
  uploadMedia: async (campaignId, formData) => {
    const response = await apiClient.post(`/media/campaigns/${campaignId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // GET /api/media/campaigns/:campaignId
  getCampaignMedia: async (campaignId) => {
    const response = await apiClient.get(`/media/campaigns/${campaignId}`);
    return response.data;
  },

  // GET /api/media/:mediaId
  getMediaById: async (mediaId) => {
    const response = await apiClient.get(`/media/${mediaId}`);
    return response.data;
  },

  // PATCH /api/media/:mediaId/status (APPROVED, REJECTED)
  updateStatus: async (mediaId, statusData) => {
    const response = await apiClient.patch(`/media/${mediaId}/status`, statusData);
    return response.data;
  },

  // GET /api/media/:mediaId/download (blob stream)
  downloadMediaBlob: async (mediaId) => {
    const response = await apiClient.get(`/media/${mediaId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // DELETE /api/media/:mediaId
  deleteMedia: async (mediaId) => {
    const response = await apiClient.delete(`/media/${mediaId}`);
    return response.data;
  },
};