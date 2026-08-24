import apiClient from '../../services/apiClient';

export const spacesApi = {
  // GET /api/spaces?page=1&per_page=12&category_id=...&city=...&search=...
  getSpaces: async (params = {}) => {
    const response = await apiClient.get('/spaces/', { params });
    return response.data;
  },

  // GET /api/spaces/:id
  getSpaceById: async (id) => {
    const response = await apiClient.get(`/spaces/${id}`);
    return response.data;
  },

  // GET /api/spaces/categories
  getCategories: async () => {
    const response = await apiClient.get('/spaces/categories');
    return response.data;
  },

  // GET /api/spaces/locations
  getLocations: async () => {
    const response = await apiClient.get('/spaces/locations');
    return response.data;
  },
};