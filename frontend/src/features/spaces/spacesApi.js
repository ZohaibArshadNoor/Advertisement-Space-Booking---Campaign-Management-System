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

  // POST /api/spaces/
  createSpace: async (spaceData) => {
    const response = await apiClient.post('/spaces/', spaceData);
    return response.data;
  },

  // PUT /api/spaces/:id
  updateSpace: async (id, spaceData) => {
    const response = await apiClient.put(`/spaces/${id}`, spaceData);
    return response.data;
  },

  // DELETE /api/spaces/:id
  deleteSpace: async (id) => {
    const response = await apiClient.delete(`/spaces/${id}`);
    return response.data;
  },

  // GET /api/spaces/categories
  getCategories: async () => {
    const response = await apiClient.get('/spaces/categories');
    return response.data;
  },

  // POST /api/spaces/categories
  createCategory: async (categoryData) => {
    const response = await apiClient.post('/spaces/categories', categoryData);
    return response.data;
  },

  // GET /api/spaces/locations
  getLocations: async () => {
    const response = await apiClient.get('/spaces/locations');
    return response.data;
  },

  // POST /api/spaces/locations
  createLocation: async (locationData) => {
    const response = await apiClient.post('/spaces/locations', locationData);
    return response.data;
  },
};