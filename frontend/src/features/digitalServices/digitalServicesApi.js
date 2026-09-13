import apiClient from '../../services/apiClient';

export const digitalServicesApi = {
  // Get all digital base rates directly from database
  getBaseRates: async () => {
    try {
      const res = await apiClient.get('/digital-services/base-rates');
      return {
        success: true,
        baseRates: res.data?.baseRates || [],
      };
    } catch (err) {
      console.error('Failed to fetch digital base rates:', err);
      return {
        success: false,
        error: err.response?.data?.message || err.message,
        baseRates: [],
      };
    }
  },

  // Admin: Update a specific platform base rate in database
  updateBaseRate: async (platform, newRateData) => {
    try {
      const res = await apiClient.put(
        `/digital-services/base-rates/${encodeURIComponent(platform)}`,
        newRateData
      );
      return {
        success: true,
        message: res.data?.message || `Base rate for '${platform}' updated successfully.`,
        baseRates: res.data?.baseRates || [],
      };
    } catch (err) {
      console.error('Failed to update base rate:', err);
      throw new Error(err.response?.data?.message || err.message);
    }
  },

  // Admin: Add a new custom platform base rate to database
  addBaseRate: async (newRateData) => {
    try {
      const res = await apiClient.post('/digital-services/base-rates', newRateData);
      return {
        success: true,
        message: res.data?.message || `New platform service '${newRateData.platform}' added successfully.`,
        baseRates: res.data?.baseRates || [],
      };
    } catch (err) {
      console.error('Failed to add base rate:', err);
      throw new Error(err.response?.data?.message || err.message);
    }
  },

  // Admin: Delete a platform base rate from database
  deleteBaseRate: async (platform) => {
    try {
      const res = await apiClient.delete(`/digital-services/base-rates/${encodeURIComponent(platform)}`);
      return {
        success: true,
        message: res.data?.message || `Platform base rate '${platform}' removed.`,
        baseRates: res.data?.baseRates || [],
      };
    } catch (err) {
      console.error('Failed to delete base rate:', err);
      throw new Error(err.response?.data?.message || err.message);
    }
  },

  // Reset base rates to system defaults in database
  resetBaseRates: async () => {
    try {
      const res = await apiClient.post('/digital-services/base-rates/reset');
      return {
        success: true,
        message: res.data?.message || 'Base rates reset to defaults.',
        baseRates: res.data?.baseRates || [],
      };
    } catch (err) {
      console.error('Failed to reset base rates:', err);
      throw new Error(err.response?.data?.message || err.message);
    }
  },

  // Get all digital services in catalog from database
  getCatalog: async () => {
    try {
      const res = await apiClient.get('/digital-services/catalog');
      return {
        success: true,
        services: res.data?.services || [],
      };
    } catch (err) {
      console.error('Failed to fetch digital services catalog:', err);
      return {
        success: false,
        error: err.response?.data?.message || err.message,
        services: [],
      };
    }
  },

  // Admin: Create / Add a new digital service to catalog in database
  createService: async (serviceData) => {
    try {
      const res = await apiClient.post('/digital-services/catalog', serviceData);
      return {
        success: true,
        message: res.data?.message || `Digital service '${serviceData.title}' created successfully.`,
        service: res.data?.service,
      };
    } catch (err) {
      console.error('Failed to create digital service:', err);
      throw new Error(err.response?.data?.message || err.message);
    }
  },

  // Admin: Delete a digital service from catalog in database
  deleteService: async (id) => {
    try {
      const res = await apiClient.delete(`/digital-services/catalog/${encodeURIComponent(id)}`);
      return {
        success: true,
        message: res.data?.message || 'Digital service removed from catalog.',
      };
    } catch (err) {
      console.error('Failed to delete digital service:', err);
      throw new Error(err.response?.data?.message || err.message);
    }
  },

  // Get booked digital services from database
  getBookedServices: async (campaignId = null) => {
    try {
      const params = campaignId ? { campaign_id: campaignId } : {};
      const res = await apiClient.get('/digital-services/bookings', { params });
      return {
        success: true,
        services: res.data?.services || [],
      };
    } catch (err) {
      console.error('Failed to fetch booked digital services:', err);
      return {
        success: false,
        error: err.response?.data?.message || err.message,
        services: [],
      };
    }
  },

  // Book a digital service in database
  bookDigitalService: async ({
    campaign_id,
    campaign_name,
    service_id,
    service_title,
    platform,
    category,
    original_price,
    agreed_price,
    discount_applied,
    duration_days,
    start_date,
    end_date,
    is_standalone,
    status = 'PENDING',
    requester_name,
  }) => {
    const bookingPayload = {
      campaign_id: is_standalone ? null : campaign_id,
      campaign_name: is_standalone ? 'Standalone Direct Subscription' : (campaign_name || `Campaign #${campaign_id}`),
      service_id,
      service_title,
      platform,
      category,
      original_price: Number(original_price),
      agreed_price: Number(agreed_price),
      discount_applied: discount_applied || 'Standard Rate',
      duration_days: Number(duration_days || 30),
      start_date,
      end_date,
      is_standalone: Boolean(is_standalone),
      status: status || 'PENDING',
      requester_name: requester_name || 'Advertiser',
    };

    try {
      const res = await apiClient.post('/digital-services/bookings', bookingPayload);
      return {
        success: true,
        message: res.data?.message || `Successfully registered booking for '${service_title}'.`,
        service: res.data?.service,
      };
    } catch (err) {
      console.error('Failed to book digital service:', err);
      throw new Error(err.response?.data?.message || err.message);
    }
  },

  // Update booking status in database
  updateBookingStatus: async (bookingId, newStatus) => {
    try {
      const res = await apiClient.patch(`/digital-services/bookings/${encodeURIComponent(bookingId)}/status`, {
        status: newStatus,
      });
      return {
        success: true,
        message: res.data?.message || `Booking status updated to ${newStatus}.`,
        service: res.data?.service,
      };
    } catch (err) {
      console.error('Failed to update booking status:', err);
      throw new Error(err.response?.data?.message || err.message);
    }
  },

  // Delete / cancel booking in database
  deleteBooking: async (bookingId) => {
    try {
      const res = await apiClient.delete(`/digital-services/bookings/${encodeURIComponent(bookingId)}`);
      return {
        success: true,
        message: res.data?.message || 'Digital service booking cancelled.',
      };
    } catch (err) {
      console.error('Failed to delete booking:', err);
      throw new Error(err.response?.data?.message || err.message);
    }
  },
};
