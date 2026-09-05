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

  // POST /api/influencers/hire
  hireInfluencer: async (hireData) => {
    const response = await apiClient.post('/influencers/hire', hireData);
    return response.data;
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
