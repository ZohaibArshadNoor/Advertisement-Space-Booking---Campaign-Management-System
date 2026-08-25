import apiClient from '../../services/apiClient';

export const availabilityApi = {
  // GET /api/availability/spaces/:spaceId/check?start_date=...&end_date=...
  checkAvailability: async (spaceId, params) => {
    const response = await apiClient.get(`/availability/spaces/${spaceId}/check`, { params });
    return response.data;
  },

  // GET /api/availability/spaces/:spaceId
  getSpaceAvailability: async (spaceId) => {
    const response = await apiClient.get(`/availability/spaces/${spaceId}`);
    return response.data;
  },

  // POST /api/availability/spaces/:spaceId (Admin / Space Manager only)
  blockDates: async (spaceId, scheduleData) => {
    const response = await apiClient.post(`/availability/spaces/${spaceId}`, scheduleData);
    return response.data;
  },

  // DELETE /api/availability/:id
  deleteSchedule: async (id) => {
    const response = await apiClient.delete(`/availability/${id}`);
    return response.data;
  },
};