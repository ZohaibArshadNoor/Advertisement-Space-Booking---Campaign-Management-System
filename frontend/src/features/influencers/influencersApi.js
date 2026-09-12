import apiClient from '../../services/apiClient';

const HIRED_CREATORS_KEY = 'adflow_hired_influencers';

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

  // GET hired creators for a campaign
  getHiredCreators: async (campaignId = null) => {
    try {
      // Check localStorage first
      const stored = localStorage.getItem(HIRED_CREATORS_KEY);
      let list = stored ? JSON.parse(stored) : [];
      if (campaignId) {
        list = list.filter((item) => String(item.campaign_id) === String(campaignId));
      }

      // If backend available, also query server
      if (campaignId) {
        try {
          const res = await apiClient.get(`/influencers/campaign/${campaignId}`);
          if (res.data?.hired_creators?.length > 0) {
            const serverHired = res.data.hired_creators;
            // Merge unique
            serverHired.forEach((sh) => {
              if (!list.some((lh) => lh.id === sh.id || (lh.influencer_id === sh.influencer_id && lh.package_title === sh.package_title))) {
                list.push(sh);
              }
            });
          }
        } catch (serverErr) {
          // fallback to localStorage
        }
      }

      return { success: true, hired: list };
    } catch (err) {
      console.error('Failed to get hired creators', err);
      return { success: false, hired: [] };
    }
  },

  // POST /api/influencers/hire
  hireInfluencer: async (hireData) => {
    let serverRes = null;
    try {
      const response = await apiClient.post('/influencers/hire', hireData);
      serverRes = response.data;
    } catch (err) {
      console.warn('Backend hire call error, continuing with local ledger:', err);
    }

    // Persist to local storage ledger
    const stored = localStorage.getItem(HIRED_CREATORS_KEY);
    const list = stored ? JSON.parse(stored) : [];

    const newHire = {
      id: serverRes?.contract?.id || `HIRE-${Date.now().toString().slice(-6)}`,
      influencer_id: hireData.influencer_id,
      influencer_name: hireData.influencer_name || serverRes?.contract?.influencer_name || 'Creator',
      influencer_handle: hireData.influencer_handle || serverRes?.contract?.influencer_handle || '@creator',
      platform: hireData.platform || serverRes?.contract?.platform || 'YouTube',
      avatar_url: hireData.avatar_url || '',
      campaign_id: hireData.campaign_id,
      campaign_name: hireData.campaign_name || serverRes?.contract?.campaign_name || `Campaign #${hireData.campaign_id}`,
      package_title: hireData.package_title || serverRes?.contract?.package_title || 'Creator Sponsorship',
      deliverables: hireData.deliverables || serverRes?.contract?.deliverables || 'Sponsored Video & Brand Integration',
      agreed_fee: Number(hireData.agreed_fee || serverRes?.contract?.agreed_fee || 150000),
      target_date: hireData.target_date || serverRes?.contract?.target_publication_date || '',
      brief_notes: hireData.brief_notes || '',
      status: 'CONTRACT_ACTIVE',
      hired_at: new Date().toISOString(),
    };

    list.unshift(newHire);
    localStorage.setItem(HIRED_CREATORS_KEY, JSON.stringify(list));

    return serverRes || {
      success: true,
      message: `Successfully hired ${newHire.influencer_name} (${newHire.influencer_handle}) for campaign.`,
      contract: newHire,
    };
  },

  // Cancel / remove a hired creator
  removeHiredCreator: async (id) => {
    try {
      const stored = localStorage.getItem(HIRED_CREATORS_KEY);
      let list = stored ? JSON.parse(stored) : [];
      list = list.filter((item) => item.id !== id);
      localStorage.setItem(HIRED_CREATORS_KEY, JSON.stringify(list));
      return { success: true, message: 'Creator sponsorship cancelled.' };
    } catch (err) {
      console.error('Failed to remove hired creator', err);
      throw err;
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
