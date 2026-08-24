import apiClient from '../../services/apiClient';

export const bookingsApi = {
  // GET /api/bookings?page=1&per_page=10&status=...&search=...
  getBookings: async (params = {}) => {
    const response = await apiClient.get('/bookings', { params });
    return response.data;
  },

  // GET /api/bookings/:id
  getBookingById: async (id) => {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data;
  },

  // POST /api/bookings
  createBooking: async (bookingData) => {
    const response = await apiClient.post('/bookings', bookingData);
    return response.data;
  },

  // PATCH /api/bookings/:id/status (PENDING, CONFIRMED, CANCELLED, COMPLETED)
  updateStatus: async (id, status) => {
    const response = await apiClient.patch(`/bookings/${id}/status`, { status });
    return response.data;
  },

  // DELETE /api/bookings/:id
  deleteBooking: async (id) => {
    const response = await apiClient.delete(`/bookings/${id}`);
    return response.data;
  },
};