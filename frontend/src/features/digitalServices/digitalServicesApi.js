import { INITIAL_DIGITAL_SERVICES, DIGITAL_BASE_RATES } from './digitalServicesData';

const CATALOG_KEY = 'adflow_digital_services_catalog';
const BOOKINGS_KEY = 'adflow_booked_digital_services';
const BASE_RATES_KEY = 'adflow_digital_base_rates';

export const digitalServicesApi = {
  // Get all digital base rates
  getBaseRates: async () => {
    try {
      const stored = localStorage.getItem(BASE_RATES_KEY);
      if (stored) {
        return { success: true, baseRates: JSON.parse(stored) };
      }
      localStorage.setItem(BASE_RATES_KEY, JSON.stringify(DIGITAL_BASE_RATES));
      return { success: true, baseRates: DIGITAL_BASE_RATES };
    } catch (err) {
      console.error('Failed to get base rates', err);
      return { success: true, baseRates: DIGITAL_BASE_RATES };
    }
  },

  // Admin: Update a specific platform base rate
  updateBaseRate: async (platform, newRateData) => {
    try {
      const stored = localStorage.getItem(BASE_RATES_KEY);
      let list = stored ? JSON.parse(stored) : [...DIGITAL_BASE_RATES];
      list = list.map((b) => (b.platform === platform ? { ...b, ...newRateData } : b));
      localStorage.setItem(BASE_RATES_KEY, JSON.stringify(list));
      return { success: true, message: `Base rate for '${platform}' updated successfully.`, baseRates: list };
    } catch (err) {
      console.error('Failed to update base rate', err);
      throw err;
    }
  },

  // Admin: Add a new custom platform base rate
  addBaseRate: async (newRateData) => {
    try {
      const stored = localStorage.getItem(BASE_RATES_KEY);
      let list = stored ? JSON.parse(stored) : [...DIGITAL_BASE_RATES];
      if (list.some((b) => b.platform.toLowerCase() === newRateData.platform.toLowerCase())) {
        throw new Error(`Platform '${newRateData.platform}' already exists.`);
      }
      list.push(newRateData);
      localStorage.setItem(BASE_RATES_KEY, JSON.stringify(list));
      return { success: true, message: `New platform service '${newRateData.platform}' added successfully.`, baseRates: list };
    } catch (err) {
      console.error('Failed to add base rate', err);
      throw err;
    }
  },

  // Admin: Delete a platform base rate / custom service
  deleteBaseRate: async (platform) => {
    try {
      const stored = localStorage.getItem(BASE_RATES_KEY);
      let list = stored ? JSON.parse(stored) : [...DIGITAL_BASE_RATES];
      list = list.filter((b) => b.platform !== platform);
      localStorage.setItem(BASE_RATES_KEY, JSON.stringify(list));
      return { success: true, message: `Platform base rate '${platform}' removed.`, baseRates: list };
    } catch (err) {
      console.error('Failed to delete base rate', err);
      throw err;
    }
  },

  // Reset base rates to system defaults
  resetBaseRates: async () => {
    try {
      localStorage.setItem(BASE_RATES_KEY, JSON.stringify(DIGITAL_BASE_RATES));
      return { success: true, message: 'Base rates reset to defaults.', baseRates: DIGITAL_BASE_RATES };
    } catch (err) {
      console.error('Failed to reset base rates', err);
      throw err;
    }
  },

  // Get all digital services in catalog
  getCatalog: async () => {
    try {
      const stored = localStorage.getItem(CATALOG_KEY);
      if (stored) {
        return { success: true, services: JSON.parse(stored) };
      }
      localStorage.setItem(CATALOG_KEY, JSON.stringify(INITIAL_DIGITAL_SERVICES));
      return { success: true, services: INITIAL_DIGITAL_SERVICES };
    } catch (err) {
      console.error('Failed to get catalog', err);
      return { success: true, services: INITIAL_DIGITAL_SERVICES };
    }
  },

  // Admin: Create / Add a new digital service to catalog
  createService: async (serviceData) => {
    try {
      const stored = localStorage.getItem(CATALOG_KEY);
      const list = stored ? JSON.parse(stored) : [...INITIAL_DIGITAL_SERVICES];
      
      const newService = {
        ...serviceData,
        id: `ds_${Date.now().toString().slice(-6)}`,
        deliverables: serviceData.deliverables || [
          'Targeted Digital Ad Distribution',
          'Real-time Analytics & Conversion Tracking',
          'Dedicated Campaign Optimization',
        ],
      };

      list.unshift(newService);
      localStorage.setItem(CATALOG_KEY, JSON.stringify(list));
      return { success: true, message: `Digital service '${newService.title}' created successfully.`, service: newService };
    } catch (err) {
      console.error('Failed to create service', err);
      throw err;
    }
  },

  // Admin: Delete a digital service from catalog
  deleteService: async (id) => {
    try {
      const stored = localStorage.getItem(CATALOG_KEY);
      let list = stored ? JSON.parse(stored) : [...INITIAL_DIGITAL_SERVICES];
      list = list.filter((s) => s.id !== id);
      localStorage.setItem(CATALOG_KEY, JSON.stringify(list));
      return { success: true, message: 'Digital service removed from catalog.' };
    } catch (err) {
      console.error('Failed to delete service', err);
      throw err;
    }
  },

  // Get booked digital services
  getBookedServices: async (campaignId = null) => {
    try {
      const stored = localStorage.getItem(BOOKINGS_KEY);
      let list = stored ? JSON.parse(stored) : [];
      if (campaignId) {
        list = list.filter((item) => String(item.campaign_id) === String(campaignId));
      }
      return { success: true, services: list };
    } catch (err) {
      console.error('Failed to read booked digital services', err);
      return { success: false, services: [] };
    }
  },

  // Book a digital service (Campaign Affiliated OR Standalone Subscription)
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
    try {
      const stored = localStorage.getItem(BOOKINGS_KEY);
      const list = stored ? JSON.parse(stored) : [];

      const newBooking = {
        id: `DGB-${Date.now().toString().slice(-6)}`,
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      list.unshift(newBooking);
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));

      return {
        success: true,
        message: is_standalone
          ? `Successfully submitted standalone request for '${service_title}'.`
          : `Successfully requested ${service_title} under campaign '${newBooking.campaign_name}'.`,
        service: newBooking,
      };
    } catch (err) {
      console.error('Failed to book digital service', err);
      throw err;
    }
  },

  // Update status of a booked digital service (Admin: Approve, Provision, Activate, Complete, Reject, Cancel)
  updateBookedServiceStatus: async (id, newStatus) => {
    try {
      const stored = localStorage.getItem(BOOKINGS_KEY);
      let list = stored ? JSON.parse(stored) : [];
      let updatedItem = null;
      list = list.map((item) => {
        if (item.id === id) {
          updatedItem = {
            ...item,
            status: newStatus,
            updated_at: new Date().toISOString(),
          };
          return updatedItem;
        }
        return item;
      });
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));
      return {
        success: true,
        message: `Digital service status successfully updated to '${newStatus}'.`,
        service: updatedItem,
      };
    } catch (err) {
      console.error('Failed to update booked service status', err);
      throw err;
    }
  },

  // Cancel / Remove a booked service
  removeBookedService: async (id) => {
    try {
      const stored = localStorage.getItem(BOOKINGS_KEY);
      let list = stored ? JSON.parse(stored) : [];
      list = list.filter((item) => item.id !== id);
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));
      return { success: true, message: 'Digital service reservation cancelled.' };
    } catch (err) {
      console.error('Failed to remove booked digital service', err);
      throw err;
    }
  },
};
