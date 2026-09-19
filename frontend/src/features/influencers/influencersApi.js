import apiClient from '../../services/apiClient';

export const influencersApi = {
  // GET /api/influencers?platform=...&niche=...&tier=...&search=...
  getInfluencers: async (params = {}) => {
    const response = await apiClient.get('/influencers/', { params });
    return response.data;
  },

  // GET /api/influencers/:id
  getInfluencerById: async (id) => {
    const response = await apiClient.get(`/influencers/${id}`);
    return response.data;
  },

  // GET hired creators for a campaign or all campaigns from DB
  getHiredCreators: async (campaignId = null) => {
    try {
      const params = campaignId ? { campaign_id: campaignId } : {};
      const res = await apiClient.get('/influencers/hired', { params });
      return {
        success: true,
        hired: res.data?.hired || [],
      };
    } catch (err) {
      console.error('Failed to get hired creators from backend:', err);
      return { success: false, hired: [], error: err.response?.data?.message || err.message };
    }
  },

  // POST /api/influencers/hire
  hireInfluencer: async (hireData) => {
    try {
      const response = await apiClient.post('/influencers/hire', hireData);
      return response.data;
    } catch (err) {
      console.error('Backend hire call error:', err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to hire creator.');
    }
  },

  // POST /api/influencers/hired/:id/accept
  acceptProposal: async (hireId) => {
    try {
      const res = await apiClient.post(`/influencers/hired/${encodeURIComponent(hireId)}/accept`);
      return res.data;
    } catch (err) {
      console.error('Failed to accept proposal:', err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to accept proposal.');
    }
  },

  // POST /api/influencers/hired/:id/decline
  declineProposal: async (hireId) => {
    try {
      const res = await apiClient.post(`/influencers/hired/${encodeURIComponent(hireId)}/decline`);
      return res.data;
    } catch (err) {
      console.error('Failed to decline proposal:', err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to decline proposal.');
    }
  },

  // POST /api/influencers/hired/:id/submit-deliverable
  submitDeliverables: async (hireId, payload) => {
    try {
      const res = await apiClient.post(`/influencers/hired/${encodeURIComponent(hireId)}/submit-deliverable`, payload);
      return res.data;
    } catch (err) {
      console.error('Failed to submit deliverables:', err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to submit deliverables.');
    }
  },

  // POST /api/influencers/hired/:id/approve
  approveDeliverables: async (hireId) => {
    try {
      const res = await apiClient.post(`/influencers/hired/${encodeURIComponent(hireId)}/approve`);
      return res.data;
    } catch (err) {
      console.error('Failed to approve deliverables:', err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to approve deliverables.');
    }
  },

  // POST /api/influencers/hired/:id/request-revision
  requestRevision: async (hireId, payload) => {
    try {
      const res = await apiClient.post(`/influencers/hired/${encodeURIComponent(hireId)}/request-revision`, payload);
      return res.data;
    } catch (err) {
      console.error('Failed to request revision:', err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to request revision.');
    }
  },

  // PATCH /api/influencers/hired/:id/status
  updateHireStatus: async (hireId, statusOrPayload) => {
    try {
      const payload = typeof statusOrPayload === 'string' ? { status: statusOrPayload } : statusOrPayload;
      const res = await apiClient.patch(`/influencers/hired/${encodeURIComponent(hireId)}/status`, payload);
      return res.data;
    } catch (err) {
      console.error('Failed to update hired creator status:', err);
      throw new Error(err.response?.data?.message || err.message);
    }
  },

  // DELETE /api/influencers/hired/:id
  removeHiredCreator: async (id) => {
    try {
      const res = await apiClient.delete(`/influencers/hired/${encodeURIComponent(id)}`);
      return res.data;
    } catch (err) {
      console.error('Failed to remove hired creator:', err);
      throw new Error(err.response?.data?.message || err.message);
    }
  },

  // POST /api/influencers/ (Admin/Manager)
  createInfluencer: async (data) => {
    const response = await apiClient.post('/influencers/', data);
    return response.data;
  },

  // PUT /api/influencers/:id (Admin/Manager)
  updateInfluencer: async (id, data) => {
    const response = await apiClient.put(`/influencers/${id}`, data);
    return response.data;
  },

  // DELETE /api/influencers/:id (Admin)
  deleteInfluencer: async (id) => {
    const response = await apiClient.delete(`/influencers/${id}`);
    return response.data;
  },
};

export default influencersApi;

