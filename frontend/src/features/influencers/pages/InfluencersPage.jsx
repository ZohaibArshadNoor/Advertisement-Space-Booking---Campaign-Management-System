import React, { useState, useEffect } from 'react';
import { influencersApi } from '../influencersApi';
import { campaignsApi } from '../../campaigns/campaignsApi';
import { useAuth } from '../../../context/AuthContext';
import EmptyState from '../../../components/ui/EmptyState';
import {
  Star,
  Search,
  CheckCircle2,
  Video,
  Share2,
  Users,
  Eye,
  Calendar,
  Sparkles,
  TrendingUp,
  Award,
  ChevronRight,
  Send,
  X,
  ExternalLink,
  MessageSquare,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  Briefcase,
  Layers,
  AlertTriangle,
  Info,
  Check,
  Globe,
  Radio,
  BarChart3,
  Copy,
  ExternalLink as LinkIcon
} from 'lucide-react';

const PLATFORMS = ['All Platforms', 'YouTube', 'Instagram', 'TikTok', 'LinkedIn'];
const NICHES = [
  'All Niches',
  'Tech & Gadgets',
  'Fashion & Lifestyle',
  'Food & Culinary',
  'Gaming & Esports',
  'Business & Finance'
];
const TIERS = ['All Tiers', 'Celebrity Creator', 'Macro Creator', 'Micro Creator', 'Nano Creator'];

// Helper for Initials Avatar with Graceful Network Fallback
const CreatorAvatar = ({ name = '', avatarUrl = '', size = 52, className = '' }) => {
  const [imgError, setImgError] = useState(false);

  const getInitials = (str) => {
    if (!str) return 'CR';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return str.substring(0, 2).toUpperCase();
  };

  const getGradient = (str) => {
    const colors = [
      'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
      'linear-gradient(135deg, #059669 0%, #047857 100%)',
      'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
      'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
      'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
    return colors[hash % colors.length];
  };

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`rounded-circle border flex-shrink-0 shadow-xs ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'cover',
          borderColor: 'var(--color-border)'
        }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0 border shadow-xs ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: getGradient(name),
        fontSize: size >= 60 ? '1.25rem' : size >= 48 ? '0.95rem' : '0.8rem',
        letterSpacing: '0.5px',
        borderColor: 'rgba(255,255,255,0.2)'
      }}
    >
      {getInitials(name)}
    </div>
  );
};

export const InfluencersPage = () => {
  const { user } = useAuth();
  const isAdminOrManager = user?.role === 'Administrator' || user?.role === 'Space Manager';
  const isSuperAdmin = user?.role === 'Administrator';

  const [influencers, setInfluencers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // In-App Toast System
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success', title = '') => {
    setToast({ type, message, title });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Filters
  const [selectedPlatform, setSelectedPlatform] = useState('All Platforms');
  const [selectedNiche, setSelectedNiche] = useState('All Niches');
  const [selectedTier, setSelectedTier] = useState('All Tiers');
  const [search, setSearch] = useState('');

  // Modals
  const [inspectingCreator, setInspectingCreator] = useState(null);
  const [hiringCreator, setHiringCreator] = useState(null);
  const [editingCreator, setEditingCreator] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [deletingCreator, setDeletingCreator] = useState(null);

  // Admin Creator Form State
  const [creatorForm, setCreatorForm] = useState({
    name: '',
    handle: '',
    platform: 'YouTube',
    niche: 'Tech & Gadgets',
    tier: 'Macro Creator',
    bio: '',
    avatar_url: '',
    followers_count: 250000,
    avg_views: 65000,
    engagement_rate: '7.2',
    pkg1_title: 'Dedicated Sponsorship Video',
    pkg1_deliverables: 'Full dedicated video review with link in description',
    pkg1_price: 200000,
    pkg2_title: 'Social Reel & Story Shoutout',
    pkg2_deliverables: '2 High engagement social reels + swipe up stories',
    pkg2_price: 120000,
    is_verified: true,
    is_available: true,
  });
  const [savingCreator, setSavingCreator] = useState(false);
  const [formError, setFormError] = useState('');

  // Hire Form State
  const [hireForm, setHireForm] = useState({
    campaign_id: '',
    package_id: '',
    target_date: '',
    brief_notes: '',
  });
  const [submittingHire, setSubmittingHire] = useState(false);
  const [hireError, setHireError] = useState('');

  const fetchInfluencers = async () => {
    setLoading(true);
    try {
      const data = await influencersApi.getInfluencers({
        platform: selectedPlatform !== 'All Platforms' ? selectedPlatform : undefined,
        niche: selectedNiche !== 'All Niches' ? selectedNiche : undefined,
        tier: selectedTier !== 'All Tiers' ? selectedTier : undefined,
        search: search.trim() || undefined,
      });
      setInfluencers(data.influencers || []);
    } catch (err) {
      console.error('Failed to load influencers', err);
      showToast('Failed to load creator directory from server.', 'danger', 'Network Error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await campaignsApi.getCampaigns();
      const list = res.campaigns || res || [];
      setCampaigns(list);
      if (list.length > 0) {
        setHireForm((prev) => ({ ...prev, campaign_id: list[0].id }));
      }
    } catch (err) {
      console.error('Failed to load campaigns for hiring', err);
    }
  };

  useEffect(() => {
    fetchInfluencers();
  }, [selectedPlatform, selectedNiche, selectedTier]);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInfluencers();
  };

  const handleOpenHireModal = (creator) => {
    setHireError('');
    setHiringCreator(creator);
    setHireForm({
      campaign_id: campaigns.length > 0 ? campaigns[0].id : '',
      package_id: creator.packages && creator.packages.length > 0 ? creator.packages[0].id : '',
      target_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      brief_notes: '',
    });
  };

  const handleHireSubmit = async (e) => {
    e.preventDefault();
    setHireError('');
    if (!hireForm.campaign_id) {
      setHireError('Please select or create an active marketing campaign first.');
      return;
    }
    setSubmittingHire(true);
    try {
      const res = await influencersApi.hireInfluencer({
        influencer_id: hiringCreator.id,
        campaign_id: parseInt(hireForm.campaign_id),
        package_id: hireForm.package_id,
        target_date: hireForm.target_date,
        brief_notes: hireForm.brief_notes,
      });
      showToast(res.message || `Successfully sent sponsorship brief to ${hiringCreator.name}!`, 'success', 'Commission Submitted');
      setHiringCreator(null);
      fetchInfluencers();
    } catch (err) {
      setHireError(err.response?.data?.message || 'Failed to submit creator proposal.');
    } finally {
      setSubmittingHire(false);
    }
  };

  // --- Admin Add / Edit Handlers ---
  const handleOpenCreateModal = () => {
    setFormError('');
    setIsCreatingNew(true);
    setCreatorForm({
      name: '',
      handle: '',
      platform: 'YouTube',
      niche: 'Tech & Gadgets',
      tier: 'Macro Creator',
      bio: '',
      avatar_url: '',
      followers_count: 250000,
      avg_views: 65000,
      engagement_rate: '7.2',
      pkg1_title: 'Dedicated YouTube Video Review',
      pkg1_deliverables: '8-10 min full review + description sponsor link',
      pkg1_price: 220000,
      pkg2_title: '60s Mid-Roll Integration',
      pkg2_deliverables: '60s in-video organic sponsor segment',
      pkg2_price: 110000,
      is_verified: true,
      is_available: true,
    });
    setEditingCreator({});
  };

  const handleOpenEditModal = (creator) => {
    setFormError('');
    setIsCreatingNew(false);
    setEditingCreator(creator);
    const p1 = creator.packages?.[0] || {};
    const p2 = creator.packages?.[1] || {};
    setCreatorForm({
      name: creator.name || '',
      handle: creator.handle || '',
      platform: creator.platform || 'YouTube',
      niche: creator.niche || 'Tech & Gadgets',
      tier: creator.tier || 'Macro Creator',
      bio: creator.bio || '',
      avatar_url: creator.avatar_url || '',
      followers_count: creator.followers_count || 100000,
      avg_views: creator.avg_views || 25000,
      engagement_rate: creator.engagement_rate ? String(creator.engagement_rate) : '5.0',
      pkg1_title: p1.title || 'Sponsorship Package 1',
      pkg1_deliverables: p1.deliverables || 'Deliverables description',
      pkg1_price: p1.price || 150000,
      pkg2_title: p2.title || 'Sponsorship Package 2',
      pkg2_deliverables: p2.deliverables || 'Deliverables description',
      pkg2_price: p2.price || 85000,
      is_verified: creator.is_verified ?? true,
      is_available: creator.is_available ?? true,
    });
  };

  const handleSaveCreatorSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSavingCreator(true);

    if (!creatorForm.name.trim() || !creatorForm.handle.trim()) {
      setFormError('Creator name and social handle are required.');
      setSavingCreator(false);
      return;
    }

    const packages = [
      {
        id: 'pkg_1',
        title: creatorForm.pkg1_title || 'Primary Sponsorship Package',
        deliverables: creatorForm.pkg1_deliverables || 'Standard brand integration',
        price: parseInt(creatorForm.pkg1_price) || 100000,
      },
    ];
    if (creatorForm.pkg2_title && creatorForm.pkg2_title.trim()) {
      packages.push({
        id: 'pkg_2',
        title: creatorForm.pkg2_title,
        deliverables: creatorForm.pkg2_deliverables || 'Secondary brand integration',
        price: parseInt(creatorForm.pkg2_price) || 60000,
      });
    }

    const payload = {
      name: creatorForm.name.trim(),
      handle: creatorForm.handle.trim().startsWith('@') ? creatorForm.handle.trim() : `@${creatorForm.handle.trim()}`,
      platform: creatorForm.platform,
      niche: creatorForm.niche,
      tier: creatorForm.tier,
      bio: creatorForm.bio.trim(),
      avatar_url: creatorForm.avatar_url.trim(),
      followers_count: parseInt(creatorForm.followers_count) || 0,
      avg_views: parseInt(creatorForm.avg_views) || 0,
      engagement_rate: creatorForm.engagement_rate,
      packages: packages,
      is_verified: creatorForm.is_verified,
      is_available: creatorForm.is_available,
    };

    try {
      if (isCreatingNew) {
        await influencersApi.createInfluencer(payload);
        showToast(`Creator '${creatorForm.name}' registered to marketplace roster.`, 'success', 'Creator Added');
      } else {
        await influencersApi.updateInfluencer(editingCreator.id, payload);
        showToast(`Creator '${creatorForm.name}' profile updated successfully.`, 'success', 'Changes Saved');
      }
      setEditingCreator(null);
      setIsCreatingNew(false);
      fetchInfluencers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save creator profile.');
    } finally {
      setSavingCreator(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCreator) return;
    try {
      await influencersApi.deleteInfluencer(deletingCreator.id);
      showToast(`Creator ${deletingCreator.name} (${deletingCreator.handle}) has been removed.`, 'info', 'Creator Removed');
      setDeletingCreator(null);
      fetchInfluencers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove creator profile.', 'danger', 'Delete Error');
      setDeletingCreator(null);
    }
  };

  const getPlatformBadge = (platform) => {
    switch (platform) {
      case 'YouTube':
        return (
          <span className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 text-xs" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
            <Video size={13} className="text-danger flex-shrink-0" />
            <span className="fw-semibold">YouTube</span>
          </span>
        );
      case 'Instagram':
        return (
          <span className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 text-xs" style={{ background: 'rgba(217, 70, 239, 0.12)', color: '#c026d3', border: '1px solid rgba(217, 70, 239, 0.25)' }}>
            <Share2 size={13} className="flex-shrink-0" />
            <span className="fw-semibold">Instagram</span>
          </span>
        );
      case 'TikTok':
        return (
          <span className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 text-xs" style={{ background: 'rgba(15, 23, 42, 0.08)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
            <TrendingUp size={13} className="flex-shrink-0" />
            <span className="fw-semibold">TikTok</span>
          </span>
        );
      default:
        return (
          <span className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 text-xs" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', border: '1px solid rgba(2, 132, 199, 0.25)' }}>
            <Users size={13} className="flex-shrink-0" />
            <span className="fw-semibold">{platform}</span>
          </span>
        );
    }
  };

  return (
    <div className="page-container">
      {/* Toast Notification Container */}
      {toast && (
        <div
          className="position-fixed bottom-0 end-0 p-3"
          style={{ zIndex: 9999, maxWidth: '380px' }}
        >
          <div
            className={`d-flex align-items-start gap-2.5 p-3 rounded-3 shadow-lg border text-xs`}
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: toast.type === 'success' ? '#22c55e' : toast.type === 'danger' ? '#ef4444' : '#3b82f6',
              borderLeftWidth: '5px'
            }}
          >
            {toast.type === 'success' && <CheckCircle2 size={18} className="text-success flex-shrink-0 mt-0.5" />}
            {toast.type === 'danger' && <AlertTriangle size={18} className="text-danger flex-shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info size={18} className="text-primary flex-shrink-0 mt-0.5" />}
            <div className="flex-grow-1">
              {toast.title && <div className="fw-bold text-primary-emphasis mb-0.5">{toast.title}</div>}
              <div className="text-muted">{toast.message}</div>
            </div>
            <button
              type="button"
              className="btn-ui-icon p-1 text-muted"
              onClick={() => setToast(null)}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Page Header Banner (Cleanly spaced without collisions) */}
      <div
        className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4 p-4 rounded-3 border"
        style={{ backgroundColor: 'var(--color-bg-surface)', boxShadow: 'var(--shadow-xs)' }}
      >
        <div style={{ maxWidth: '720px' }}>
          <div className="d-flex align-items-center gap-2 mb-1.5">
            <span className="badge bg-primary-subtle text-primary font-semibold px-2.5 py-1 text-xs">
              Digital Marketing Agency Hub
            </span>
            <span className="text-muted text-xs d-flex align-items-center gap-1">
              <ShieldCheck size={14} className="text-success" />
              Verified Creator Network
            </span>
          </div>
          <h1 className="h4 fw-bold text-primary-emphasis mb-1">
            Influencer &amp; Content Creator Marketplace
          </h1>
          <p className="text-muted text-xs mb-0" style={{ lineHeight: '1.5' }}>
            Discover vetted YouTube reviewers, Instagram lifestyle creators, and TikTok influencers. Inspect media kits, rate cards, and commission video sponsorships directly for your marketing campaigns.
          </p>
        </div>

        {/* Header Actions & Stats Badge Row with Ample Gap */}
        <div className="d-flex align-items-center gap-3 flex-wrap flex-shrink-0">
          <div className="d-flex align-items-center gap-3 bg-light-subtle px-3.5 py-2 rounded-2 border">
            <div>
              <div className="fw-bold fs-6 text-primary text-center">{influencers.length}</div>
              <div className="text-muted text-center" style={{ fontSize: '0.7rem' }}>Creators</div>
            </div>
            <div className="vr opacity-25" />
            <div>
              <div className="fw-bold fs-6 text-success text-center">100%</div>
              <div className="text-muted text-center" style={{ fontSize: '0.7rem' }}>Brand Safe</div>
            </div>
          </div>

          {isAdminOrManager && (
            <button
              type="button"
              className="btn-ui btn-ui-primary btn-ui-sm d-flex align-items-center gap-1.5 px-3 py-2"
              onClick={handleOpenCreateModal}
            >
              <Plus size={16} />
              <span>Add Influencer</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="toolbar-ui p-3 rounded-3 border mb-4" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
        <form onSubmit={handleSearchSubmit} className="toolbar-search">
          <Search size={15} className="toolbar-search-icon" />
          <input
            type="text"
            className="form-input-ui"
            style={{ paddingLeft: '2.2rem', height: '38px' }}
            placeholder="Search creator name, @handle, or niche..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* Platform Pills */}
          <div className="btn-group btn-group-sm" role="group">
            {PLATFORMS.map((plat) => (
              <button
                key={plat}
                type="button"
                className={`btn btn-sm ${selectedPlatform === plat ? 'btn-primary' : 'btn-outline-secondary'}`}
                style={{ fontSize: '0.76rem', padding: '0.4rem 0.75rem' }}
                onClick={() => setSelectedPlatform(plat)}
              >
                {plat}
              </button>
            ))}
          </div>

          <select
            className="form-select-ui"
            style={{ width: 'auto', height: '38px', fontSize: '0.78rem' }}
            value={selectedNiche}
            onChange={(e) => setSelectedNiche(e.target.value)}
          >
            {NICHES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          <select
            className="form-select-ui"
            style={{ width: 'auto', height: '38px', fontSize: '0.78rem' }}
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Creator Cards Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary spinner-border-sm" role="status" />
          <p className="text-muted small mt-2">Loading verified creator roster...</p>
        </div>
      ) : influencers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No influencers match your criteria"
          description="Try clearing search keywords or selecting 'All Platforms'."
        />
      ) : (
        <div className="row g-4">
          {influencers.map((inf) => (
            <div key={inf.id} className="col-12 col-md-6 col-xxl-4">
              <div
                className="h-100 d-flex flex-column justify-content-between p-4 rounded-3 border"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease'
                }}
              >
                <div>
                  {/* Top Creator Header Card */}
                  <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                    <div className="d-flex align-items-start gap-3" style={{ minWidth: 0, flex: '1 1 auto' }}>
                      <CreatorAvatar name={inf.name} avatarUrl={inf.avatar_url} size={52} />
                      <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                        <div className="d-flex align-items-center gap-1.5 mb-1" style={{ minWidth: 0 }}>
                          <h3
                            className="fw-bold text-primary-emphasis mb-0 text-truncate fs-6"
                            title={inf.name}
                          >
                            {inf.name}
                          </h3>
                          {inf.is_verified && (
                            <CheckCircle2
                              size={15}
                              className="text-primary flex-shrink-0"
                              title="Verified Partner"
                            />
                          )}
                        </div>
                        <div
                          className="text-muted font-monospace text-xs text-truncate mb-2"
                          title={inf.handle}
                        >
                          {inf.handle}
                        </div>
                        {/* Niche & Tier Tags positioned cleanly with distinct spacing */}
                        <div className="d-flex align-items-center gap-1.5 flex-wrap">
                          <span className="badge bg-primary-subtle text-primary font-medium px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                            {inf.niche}
                          </span>
                          <span className="badge bg-secondary-subtle text-secondary font-medium px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                            {inf.tier}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Platform & Admin Action Buttons in Top Right */}
                    <div className="d-flex flex-column align-items-end gap-1.5 flex-shrink-0">
                      {getPlatformBadge(inf.platform)}

                      {isAdminOrManager && (
                        <div className="d-flex align-items-center gap-1 mt-1">
                          <button
                            type="button"
                            className="btn-ui-icon p-1 text-muted"
                            title="Edit Creator Details"
                            onClick={() => handleOpenEditModal(inf)}
                          >
                            <Edit2 size={13} />
                          </button>
                          {isSuperAdmin && (
                            <button
                              type="button"
                              className="btn-ui-icon p-1 text-danger"
                              title="Delete Creator"
                              onClick={() => setDeletingCreator(inf)}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio Description with clean spacing */}
                  <p
                    className="text-muted text-xs mb-3 mt-1"
                    style={{
                      fontSize: '0.8rem',
                      lineHeight: '1.45',
                      minHeight: '38px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {inf.bio || 'Verified content creator available for dedicated sponsorships and brand activations.'}
                  </p>

                  {/* Key Metrics Stats Banner */}
                  <div className="p-2.5 rounded-2 bg-light-subtle border d-flex justify-content-around text-center mb-3">
                    <div>
                      <div className="fw-bold text-primary-emphasis" style={{ fontSize: '0.92rem' }}>
                        {inf.followers_count >= 1000000
                          ? `${(inf.followers_count / 1000000).toFixed(1)}M`
                          : `${(inf.followers_count / 1000).toFixed(0)}K`}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Followers
                      </div>
                    </div>
                    <div className="vr opacity-25" />
                    <div>
                      <div className="fw-bold text-primary-emphasis" style={{ fontSize: '0.92rem' }}>
                        {inf.avg_views >= 1000000
                          ? `${(inf.avg_views / 1000000).toFixed(1)}M`
                          : `${(inf.avg_views / 1000).toFixed(0)}K`}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Avg Views
                      </div>
                    </div>
                    <div className="vr opacity-25" />
                    <div>
                      <div className="fw-bold text-success" style={{ fontSize: '0.92rem' }}>
                        {inf.engagement_rate}%
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Engagement
                      </div>
                    </div>
                  </div>

                  {/* Featured Deliverables Rate Card (Zero Overlapping Text) */}
                  <div className="mb-3">
                    <div className="text-muted text-xs mb-2 fw-semibold d-flex align-items-center justify-content-between" style={{ fontSize: '0.7rem' }}>
                      <span>SPONSORSHIP PACKAGES</span>
                      <span className="text-primary">{inf.packages?.length || 0} Available</span>
                    </div>
                    <div className="d-flex flex-column gap-2">
                      {(inf.packages || []).slice(0, 2).map((pkg) => (
                        <div
                          key={pkg.id}
                          className="d-flex align-items-center justify-content-between p-2.5 rounded-2 bg-light-subtle border gap-2"
                        >
                          <span
                            className="text-truncate text-dark-emphasis fw-medium"
                            style={{ fontSize: '0.76rem', minWidth: 0, flex: '1 1 auto' }}
                            title={pkg.title}
                          >
                            {pkg.title}
                          </span>
                          <span
                            className="badge bg-primary-subtle text-primary font-monospace fw-bold flex-shrink-0 px-2.5 py-1 text-xs"
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            Rs. {pkg.price?.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons (Ample margin, zero boundary collisions) */}
                <div className="d-flex align-items-center justify-content-between pt-3 border-top gap-2 mt-2">
                  <button
                    type="button"
                    className="btn-ui btn-ui-secondary btn-ui-sm flex-fill d-inline-flex align-items-center justify-content-center gap-1.5 py-2"
                    onClick={() => setInspectingCreator(inf)}
                  >
                    <Eye size={13} />
                    <span>Media Kit</span>
                  </button>
                  <button
                    type="button"
                    className="btn-ui btn-ui-primary btn-ui-sm flex-fill d-inline-flex align-items-center justify-content-center gap-1.5 py-2"
                    onClick={() => handleOpenHireModal(inf)}
                  >
                    <Send size={13} />
                    <span>Hire Creator</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================================================
          MODAL 1: INSPECT CREATOR MEDIA KIT & RATE CARD (IMPROVISED, NO OVERLAPS)
          ========================================================================= */}
      {inspectingCreator && (
        <div
          className="modal-backdrop-ui"
          style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && setInspectingCreator(null)}
        >
          <div
            className="modal-dialog-ui modal-lg"
            style={{ maxWidth: '780px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header (Fixed) */}
            <div className="modal-header-ui" style={{ padding: '1.15rem 1.5rem', borderBottom: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="d-flex align-items-center gap-2">
                <Award size={18} className="text-primary" />
                <h3 className="modal-title-ui mb-0 fs-6 fw-bold">Creator Media Kit &amp; Rate Card</h3>
              </div>
              <button
                type="button"
                className="btn-ui-icon"
                onClick={() => setInspectingCreator(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Fully Scrollable) */}
            <div
              className="modal-body-ui"
              style={{ padding: '1.5rem', overflowY: 'auto', flex: '1 1 auto', maxHeight: 'calc(90vh - 130px)' }}
            >
              {/* Media Kit Header Banner */}
              <div className="p-3.5 rounded-3 bg-light-subtle border mb-4 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-3">
                  <CreatorAvatar
                    name={inspectingCreator.name}
                    avatarUrl={inspectingCreator.avatar_url}
                    size={64}
                  />
                  <div>
                    <div className="d-flex align-items-center gap-1.5 mb-0.5">
                      <h4 className="fw-bold fs-5 text-primary-emphasis mb-0">
                        {inspectingCreator.name}
                      </h4>
                      {inspectingCreator.is_verified && (
                        <CheckCircle2 size={16} className="text-primary" title="Verified Creator" />
                      )}
                    </div>
                    <div className="text-muted font-monospace text-xs mb-1.5">
                      {inspectingCreator.handle} • {inspectingCreator.platform}
                    </div>
                    <div className="d-flex align-items-center gap-1.5 flex-wrap">
                      <span className="badge bg-primary-subtle text-primary text-xs px-2 py-0.5">
                        {inspectingCreator.niche}
                      </span>
                      <span className="badge bg-secondary-subtle text-secondary text-xs px-2 py-0.5">
                        {inspectingCreator.tier}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-4 text-center border-start ps-sm-4 pt-2 pt-sm-0">
                  <div>
                    <div className="fw-bold text-primary fs-5">
                      {inspectingCreator.followers_count >= 1000000
                        ? `${(inspectingCreator.followers_count / 1000000).toFixed(1)}M`
                        : `${(inspectingCreator.followers_count / 1000).toFixed(0)}K`}
                    </div>
                    <div className="text-muted text-xs text-uppercase" style={{ letterSpacing: '0.5px' }}>Reach</div>
                  </div>
                  <div>
                    <div className="fw-bold text-success fs-5">{inspectingCreator.engagement_rate}%</div>
                    <div className="text-muted text-xs text-uppercase" style={{ letterSpacing: '0.5px' }}>Engagement</div>
                  </div>
                </div>
              </div>

              {/* Channel Bio */}
              <div className="mb-4">
                <h5 className="fw-bold text-xs text-primary-emphasis mb-2 text-uppercase" style={{ letterSpacing: '0.5px' }}>
                  Creator Channel Bio &amp; Reach Overview
                </h5>
                <p className="text-muted text-xs mb-0 bg-light-subtle p-3 rounded-2 border" style={{ lineHeight: '1.6' }}>
                  {inspectingCreator.bio || 'Professional verified digital creator available for sponsorships.'}
                </p>
              </div>

              {/* Deliverables Packages (Clean Card Layout without any badge collisions) */}
              <div className="mb-4">
                <h5 className="fw-bold text-xs text-primary-emphasis mb-2 text-uppercase" style={{ letterSpacing: '0.5px' }}>
                  Official Deliverables &amp; Pricing Packages
                </h5>
                <div className="d-flex flex-column gap-3">
                  {(inspectingCreator.packages || []).map((pkg) => (
                    <div key={pkg.id} className="p-3.5 rounded-3 bg-light-subtle border">
                      <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
                        <strong className="text-xs text-primary-emphasis fs-6" style={{ minWidth: 0, flex: '1 1 auto' }}>
                          {pkg.title}
                        </strong>
                        <span className="badge bg-primary text-white font-monospace text-xs px-2.5 py-1.5 flex-shrink-0" style={{ whiteSpace: 'nowrap' }}>
                          Rs. {pkg.price?.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-muted text-xs mb-0" style={{ fontSize: '0.82rem', lineHeight: '1.5' }}>
                        {pkg.deliverables}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Past Verified Brand Integrations (Clean Spacing and URL separation) */}
              {inspectingCreator.portfolio_links && inspectingCreator.portfolio_links.length > 0 && (
                <div>
                  <h5 className="fw-bold text-xs text-primary-emphasis mb-2 text-uppercase" style={{ letterSpacing: '0.5px' }}>
                    Past Verified Brand Integrations
                  </h5>
                  <div className="d-flex flex-column gap-2">
                    {inspectingCreator.portfolio_links.map((link, idx) => (
                      <div key={idx} className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between p-3 rounded-2 border text-xs bg-light-subtle gap-2">
                        <span className="fw-semibold text-dark-emphasis">{link.title}</span>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="badge bg-secondary-subtle text-secondary font-monospace d-inline-flex align-items-center gap-1 text-decoration-none px-2.5 py-1"
                        >
                          <span>{link.url}</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (Fixed) */}
            <div className="modal-footer-ui" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: 'var(--color-bg-subtle)' }}>
              <button
                type="button"
                className="btn-ui btn-ui-secondary btn-ui-sm px-3"
                onClick={() => setInspectingCreator(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-ui btn-ui-primary btn-ui-sm d-flex align-items-center gap-1.5 px-3"
                onClick={() => {
                  const creator = inspectingCreator;
                  setInspectingCreator(null);
                  handleOpenHireModal(creator);
                }}
              >
                <Send size={13} />
                <span>Hire {inspectingCreator.name}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: COMMISSION / HIRE CREATOR PROPOSAL (SCROLLABLE & POLISHED)
          ========================================================================= */}
      {hiringCreator && (
        <div
          className="modal-backdrop-ui"
          style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && setHiringCreator(null)}
        >
          <div
            className="modal-dialog-ui"
            style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header-ui" style={{ padding: '1.15rem 1.5rem', borderBottom: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="d-flex align-items-center gap-2">
                <Send size={16} className="text-primary" />
                <h3 className="modal-title-ui mb-0 fs-6 fw-bold">Commission Creator Sponsorship</h3>
              </div>
              <button
                type="button"
                className="btn-ui-icon"
                onClick={() => setHiringCreator(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleHireSubmit}
              style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}
            >
              <div
                className="modal-body-ui"
                style={{ padding: '1.5rem', overflowY: 'auto', flex: '1 1 auto', maxHeight: 'calc(90vh - 140px)' }}
              >
                {hireError && (
                  <div className="alert alert-danger py-2 px-3 text-xs mb-3 d-flex align-items-center gap-2">
                    <AlertTriangle size={14} className="flex-shrink-0" />
                    <span>{hireError}</span>
                  </div>
                )}

                <div className="p-3 rounded-3 bg-light-subtle border d-flex align-items-center gap-3 mb-3">
                  <CreatorAvatar
                    name={hiringCreator.name}
                    avatarUrl={hiringCreator.avatar_url}
                    size={44}
                  />
                  <div>
                    <div className="fw-bold text-xs text-primary-emphasis fs-6">{hiringCreator.name}</div>
                    <div className="text-muted font-monospace text-xs">
                      {hiringCreator.handle} • {hiringCreator.platform}
                    </div>
                  </div>
                </div>

                <div className="form-group-ui">
                  <label className="form-label-ui">
                    <span>Assign to Marketing Campaign <span className="form-required">*</span></span>
                  </label>
                  <select
                    className="form-select-ui"
                    value={hireForm.campaign_id}
                    onChange={(e) => setHireForm({ ...hireForm, campaign_id: e.target.value })}
                    required
                  >
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Budget: Rs. {parseFloat(c.budget || 0).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group-ui">
                  <label className="form-label-ui">
                    <span>Select Deliverables Package <span className="form-required">*</span></span>
                  </label>
                  <select
                    className="form-select-ui"
                    value={hireForm.package_id}
                    onChange={(e) => setHireForm({ ...hireForm, package_id: e.target.value })}
                    required
                  >
                    {(hiringCreator.packages || []).map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.title} — Rs. {pkg.price?.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group-ui">
                  <label className="form-label-ui">
                    <span>Target Broadcast / Publication Date <span className="form-required">*</span></span>
                  </label>
                  <input
                    type="date"
                    className="form-input-ui"
                    value={hireForm.target_date}
                    onChange={(e) => setHireForm({ ...hireForm, target_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group-ui mb-0">
                  <label className="form-label-ui">
                    <span>Campaign Brief &amp; Key Talking Points</span>
                  </label>
                  <textarea
                    className="form-textarea-ui"
                    rows="3"
                    placeholder="e.g. Focus on the mobile app's instant cash-back feature and mention promo code 'SAVE50' in description."
                    value={hireForm.brief_notes}
                    onChange={(e) => setHireForm({ ...hireForm, brief_notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer-ui" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: 'var(--color-bg-subtle)' }}>
                <button
                  type="button"
                  className="btn-ui btn-ui-secondary btn-ui-sm px-3"
                  onClick={() => setHiringCreator(null)}
                  disabled={submittingHire}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-ui btn-ui-primary btn-ui-sm px-3"
                  disabled={submittingHire}
                >
                  {submittingHire ? 'Submitting...' : 'Confirm Sponsorship'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: ADMIN ADD / EDIT CREATOR MODAL (100% FULLY SCROLLABLE & RESPONSIVE)
          ========================================================================= */}
      {(editingCreator || isCreatingNew) && (
        <div
          className="modal-backdrop-ui"
          style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingCreator(null);
              setIsCreatingNew(false);
            }
          }}
        >
          <div
            className="modal-dialog-ui modal-lg"
            style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header (Fixed) */}
            <div className="modal-header-ui" style={{ padding: '1.15rem 1.5rem', borderBottom: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="d-flex align-items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                <h3 className="modal-title-ui mb-0 fs-6 fw-bold">
                  {isCreatingNew ? 'Add Influencer to Marketplace' : `Edit Creator: ${editingCreator?.name}`}
                </h3>
              </div>
              <button
                type="button"
                className="btn-ui-icon"
                onClick={() => {
                  setEditingCreator(null);
                  setIsCreatingNew(false);
                }}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form with Scrollable Body */}
            <form
              onSubmit={handleSaveCreatorSubmit}
              style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}
            >
              <div
                className="modal-body-ui"
                style={{ padding: '1.5rem', overflowY: 'auto', flex: '1 1 auto', maxHeight: 'calc(90vh - 140px)' }}
              >
                {formError && (
                  <div className="alert alert-danger py-2 px-3 text-xs mb-3 d-flex align-items-center gap-2">
                    <AlertTriangle size={14} className="flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Live Card Preview Box */}
                <div className="p-3 rounded-3 bg-light-subtle border mb-4">
                  <div className="text-muted text-xs mb-2 fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                    LIVE CARD PREVIEW
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <CreatorAvatar
                      name={creatorForm.name || 'New Creator'}
                      avatarUrl={creatorForm.avatar_url}
                      size={48}
                    />
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="d-flex align-items-center gap-2 mb-0.5">
                        <span className="fw-bold text-primary-emphasis fs-6">
                          {creatorForm.name || 'Creator Full Name'}
                        </span>
                        {creatorForm.is_verified && (
                          <CheckCircle2 size={15} className="text-primary" title="Verified Creator" />
                        )}
                        <span className="badge bg-primary-subtle text-primary text-xs">
                          {creatorForm.platform}
                        </span>
                      </div>
                      <div className="text-muted font-monospace text-xs">
                        {creatorForm.handle || '@handle'} • {creatorForm.niche} • {creatorForm.tier}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 1: Basic Identity */}
                <div className="mb-4">
                  <h6 className="fw-bold text-xs text-primary-emphasis text-uppercase mb-2.5" style={{ letterSpacing: '0.5px' }}>
                    1. Basic Profile Information
                  </h6>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="form-group-ui mb-0">
                        <label className="form-label-ui">
                          <span>Full Name <span className="form-required">*</span></span>
                        </label>
                        <input
                          type="text"
                          className="form-input-ui"
                          placeholder="e.g. Asad Tech Reviews"
                          value={creatorForm.name}
                          onChange={(e) => setCreatorForm({ ...creatorForm, name: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="form-group-ui mb-0">
                        <label className="form-label-ui">
                          <span>Social Handle (@) <span className="form-required">*</span></span>
                        </label>
                        <input
                          type="text"
                          className="form-input-ui"
                          placeholder="e.g. @asadtech"
                          value={creatorForm.handle}
                          onChange={(e) => setCreatorForm({ ...creatorForm, handle: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="form-group-ui mb-0">
                        <label className="form-label-ui">
                          <span>Primary Platform <span className="form-required">*</span></span>
                        </label>
                        <select
                          className="form-select-ui"
                          value={creatorForm.platform}
                          onChange={(e) => setCreatorForm({ ...creatorForm, platform: e.target.value })}
                        >
                          <option value="YouTube">YouTube</option>
                          <option value="Instagram">Instagram</option>
                          <option value="TikTok">TikTok</option>
                          <option value="LinkedIn">LinkedIn</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="form-group-ui mb-0">
                        <label className="form-label-ui">
                          <span>Content Niche <span className="form-required">*</span></span>
                        </label>
                        <select
                          className="form-select-ui"
                          value={creatorForm.niche}
                          onChange={(e) => setCreatorForm({ ...creatorForm, niche: e.target.value })}
                        >
                          <option value="Tech & Gadgets">Tech &amp; Gadgets</option>
                          <option value="Fashion & Lifestyle">Fashion &amp; Lifestyle</option>
                          <option value="Food & Culinary">Food &amp; Culinary</option>
                          <option value="Gaming & Esports">Gaming &amp; Esports</option>
                          <option value="Business & Finance">Business &amp; Finance</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="form-group-ui mb-0">
                        <label className="form-label-ui">
                          <span>Creator Tier <span className="form-required">*</span></span>
                        </label>
                        <select
                          className="form-select-ui"
                          value={creatorForm.tier}
                          onChange={(e) => setCreatorForm({ ...creatorForm, tier: e.target.value })}
                        >
                          <option value="Celebrity Creator">Celebrity Creator</option>
                          <option value="Macro Creator">Macro Creator</option>
                          <option value="Micro Creator">Micro Creator</option>
                          <option value="Nano Creator">Nano Creator</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="form-group-ui mb-0">
                        <label className="form-label-ui">
                          <span>Avatar Image URL (Optional)</span>
                        </label>
                        <input
                          type="url"
                          className="form-input-ui"
                          placeholder="https://images.unsplash.com/... (Leaves fallback initials if blank)"
                          value={creatorForm.avatar_url}
                          onChange={(e) => setCreatorForm({ ...creatorForm, avatar_url: e.target.value })}
                        />
                        <span className="form-helper-text mt-1">
                          If left blank or offline, an initials avatar badge is generated automatically.
                        </span>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="form-group-ui mb-0">
                        <label className="form-label-ui">
                          <span>Biography / Channel Summary</span>
                        </label>
                        <textarea
                          className="form-textarea-ui"
                          rows="2"
                          placeholder="Brief description of the audience demographics, content format, and brand reach..."
                          value={creatorForm.bio}
                          onChange={(e) => setCreatorForm({ ...creatorForm, bio: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Audience Metrics */}
                <div className="mb-4">
                  <h6 className="fw-bold text-xs text-primary-emphasis text-uppercase mb-2.5" style={{ letterSpacing: '0.5px' }}>
                    2. Audience &amp; Performance Metrics
                  </h6>
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <div className="form-group-ui mb-0">
                        <label className="form-label-ui">
                          <span>Followers / Subscribers</span>
                        </label>
                        <input
                          type="number"
                          className="form-input-ui"
                          value={creatorForm.followers_count}
                          onChange={(e) => setCreatorForm({ ...creatorForm, followers_count: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="form-group-ui mb-0">
                        <label className="form-label-ui">
                          <span>Average Views</span>
                        </label>
                        <input
                          type="number"
                          className="form-input-ui"
                          value={creatorForm.avg_views}
                          onChange={(e) => setCreatorForm({ ...creatorForm, avg_views: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="form-group-ui mb-0">
                        <label className="form-label-ui">
                          <span>Engagement Rate (%)</span>
                        </label>
                        <input
                          type="text"
                          className="form-input-ui"
                          value={creatorForm.engagement_rate}
                          onChange={(e) => setCreatorForm({ ...creatorForm, engagement_rate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Deliverables Packages */}
                <div className="mb-4">
                  <h6 className="fw-bold text-xs text-primary-emphasis text-uppercase mb-2.5" style={{ letterSpacing: '0.5px' }}>
                    3. Sponsorship Rate Card &amp; Deliverables
                  </h6>

                  {/* Package 1 */}
                  <div className="p-3.5 rounded-3 bg-light-subtle border mb-3">
                    <div className="fw-bold text-xs text-primary-emphasis mb-2">Package 1 (Primary Deliverable)</div>
                    <div className="row g-2">
                      <div className="col-12 col-md-8">
                        <input
                          type="text"
                          className="form-input-ui mb-2"
                          placeholder="Package Title (e.g. Dedicated YouTube Video Review)"
                          value={creatorForm.pkg1_title}
                          onChange={(e) => setCreatorForm({ ...creatorForm, pkg1_title: e.target.value })}
                          required
                        />
                        <input
                          type="text"
                          className="form-input-ui"
                          placeholder="Deliverables description (e.g. Full 10-min review + description link)"
                          value={creatorForm.pkg1_deliverables}
                          onChange={(e) => setCreatorForm({ ...creatorForm, pkg1_deliverables: e.target.value })}
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label-ui mb-1"><span>Rate (PKR) <span className="form-required">*</span></span></label>
                        <input
                          type="number"
                          className="form-input-ui"
                          placeholder="Price in PKR"
                          value={creatorForm.pkg1_price}
                          onChange={(e) => setCreatorForm({ ...creatorForm, pkg1_price: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Package 2 */}
                  <div className="p-3.5 rounded-3 bg-light-subtle border">
                    <div className="fw-bold text-xs text-primary-emphasis mb-2">Package 2 (Secondary / Add-on)</div>
                    <div className="row g-2">
                      <div className="col-12 col-md-8">
                        <input
                          type="text"
                          className="form-input-ui mb-2"
                          placeholder="Package Title (e.g. 60s Mid-Roll Integration)"
                          value={creatorForm.pkg2_title}
                          onChange={(e) => setCreatorForm({ ...creatorForm, pkg2_title: e.target.value })}
                        />
                        <input
                          type="text"
                          className="form-input-ui"
                          placeholder="Deliverables description..."
                          value={creatorForm.pkg2_deliverables}
                          onChange={(e) => setCreatorForm({ ...creatorForm, pkg2_deliverables: e.target.value })}
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label-ui mb-1"><span>Rate (PKR)</span></label>
                        <input
                          type="number"
                          className="form-input-ui"
                          placeholder="Price in PKR"
                          value={creatorForm.pkg2_price}
                          onChange={(e) => setCreatorForm({ ...creatorForm, pkg2_price: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Status Toggles */}
                <div className="d-flex gap-4 p-3 rounded-2 bg-light-subtle border">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="verifiedSwitch"
                      checked={creatorForm.is_verified}
                      onChange={(e) => setCreatorForm({ ...creatorForm, is_verified: e.target.checked })}
                    />
                    <label className="form-check-label text-xs fw-semibold" htmlFor="verifiedSwitch">
                      Verified Brand Safe Creator
                    </label>
                  </div>

                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="availSwitch"
                      checked={creatorForm.is_available}
                      onChange={(e) => setCreatorForm({ ...creatorForm, is_available: e.target.checked })}
                    />
                    <label className="form-check-label text-xs fw-semibold" htmlFor="availSwitch">
                      Available for Commissioning
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Footer (Fixed at bottom) */}
              <div className="modal-footer-ui" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: 'var(--color-bg-subtle)' }}>
                <button
                  type="button"
                  className="btn-ui btn-ui-secondary btn-ui-sm px-3"
                  onClick={() => {
                    setEditingCreator(null);
                    setIsCreatingNew(false);
                  }}
                  disabled={savingCreator}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-ui btn-ui-primary btn-ui-sm px-3"
                  disabled={savingCreator}
                >
                  {savingCreator ? 'Saving...' : isCreatingNew ? 'Add Creator to Roster' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: CONFIRM DELETE CREATOR MODAL
          ========================================================================= */}
      {deletingCreator && (
        <div
          className="modal-backdrop-ui"
          style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && setDeletingCreator(null)}
        >
          <div
            className="modal-dialog-ui modal-sm"
            style={{ maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header-ui" style={{ padding: '1.15rem 1.5rem', borderBottom: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="d-flex align-items-center gap-2">
                <AlertTriangle size={18} className="text-danger" />
                <h3 className="modal-title-ui text-danger mb-0 fs-6 fw-bold">Remove Creator</h3>
              </div>
              <button
                type="button"
                className="btn-ui-icon"
                onClick={() => setDeletingCreator(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-ui" style={{ padding: '1.5rem' }}>
              <p className="text-muted text-xs mb-3" style={{ lineHeight: '1.5' }}>
                Are you sure you want to remove <strong className="text-primary-emphasis">{deletingCreator.name}</strong> ({deletingCreator.handle}) from the active influencer marketplace?
              </p>
              <div className="p-2.5 rounded-2 bg-light-subtle border d-flex align-items-center gap-2.5">
                <CreatorAvatar name={deletingCreator.name} avatarUrl={deletingCreator.avatar_url} size={36} />
                <div>
                  <div className="fw-bold text-xs text-primary-emphasis">{deletingCreator.name}</div>
                  <div className="text-muted font-monospace text-xs">{deletingCreator.platform} • {deletingCreator.niche}</div>
                </div>
              </div>
            </div>

            <div className="modal-footer-ui" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: 'var(--color-bg-subtle)' }}>
              <button
                type="button"
                className="btn-ui btn-ui-secondary btn-ui-sm px-3"
                onClick={() => setDeletingCreator(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-ui btn-ui-danger btn-ui-sm px-3"
                onClick={handleConfirmDelete}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfluencersPage;
