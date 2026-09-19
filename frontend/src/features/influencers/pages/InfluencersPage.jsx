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
  RefreshCw,
  Clock,
  CheckCheck,
  ExternalLink as LinkIcon,
  PhoneCall,
  Settings2,
  RotateCcw,
  CheckCircle
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
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'hired'
  const [hiredList, setHiredList] = useState([]);
  const [loadingHired, setLoadingHired] = useState(false);
  const [hiredStatusFilter, setHiredStatusFilter] = useState('ALL');

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success', title = '') => {
    setToast({ type, message, title });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const [selectedPlatform, setSelectedPlatform] = useState('All Platforms');
  const [selectedNiche, setSelectedNiche] = useState('All Niches');
  const [selectedTier, setSelectedTier] = useState('All Tiers');
  const [search, setSearch] = useState('');

  const [inspectingCreator, setInspectingCreator] = useState(null);
  const [hiringCreator, setHiringCreator] = useState(null);
  const [editingCreator, setEditingCreator] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [deletingCreator, setDeletingCreator] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Agency Status & Live Link Modal State (Admin / Space Manager)
  const [updatingContract, setUpdatingContract] = useState(null);
  const [agencyForm, setAgencyForm] = useState({
    status: 'IN_OUTREACH',
    submission_url: '',
    submission_notes: '',
    brief_notes: ''
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [agencyError, setAgencyError] = useState('');

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
      showToast('Failed to load creator roster from server.', 'danger', 'Network Error');
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

  const fetchHiredCreators = async () => {
    setLoadingHired(true);
    try {
      const res = await influencersApi.getHiredCreators();
      setHiredList(res.hired || []);
    } catch (err) {
      console.error('Failed to load hired creators', err);
    } finally {
      setLoadingHired(false);
    }
  };

  const handleQuickStatusUpdate = async (id, newStatus, message) => {
    try {
      await influencersApi.updateHireStatus(id, { status: newStatus });
      showToast(message || `Status updated to ${newStatus}.`, 'success', 'Status Updated');
      fetchHiredCreators();
    } catch (err) {
      showToast(err.message || 'Failed to update status.', 'danger', 'Error');
    }
  };

  const handleCancelHiredContract = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this sponsorship request?')) return;
    try {
      await influencersApi.updateHireStatus(id, 'CANCELLED');
      showToast('Sponsorship request has been marked as CANCELLED.', 'info', 'Request Cancelled');
      fetchHiredCreators();
    } catch (err) {
      showToast(err.message || 'Failed to cancel request.', 'danger', 'Error');
    }
  };

  const handlePermanentDeleteContract = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this contract record? This action cannot be undone.')) return;
    try {
      await influencersApi.removeHiredCreator(id);
      showToast('Contract record permanently removed.', 'info', 'Record Deleted');
      fetchHiredCreators();
    } catch (err) {
      showToast(err.message || 'Failed to delete contract.', 'danger', 'Error');
    }
  };

  const handleOpenAgencyModal = (contract, defaultStatus = null) => {
    setAgencyError('');
    setUpdatingContract(contract);
    setAgencyForm({
      status: defaultStatus || contract.status || 'IN_OUTREACH',
      submission_url: contract.submission_url || '',
      submission_notes: contract.submission_notes || '',
      brief_notes: contract.brief_notes || ''
    });
  };

  const handleSaveAgencyStatus = async (e) => {
    e.preventDefault();
    if (!updatingContract) return;
    setIsUpdatingStatus(true);
    setAgencyError('');
    try {
      await influencersApi.updateHireStatus(updatingContract.id, {
        status: agencyForm.status,
        submission_url: agencyForm.submission_url.trim(),
        submission_notes: agencyForm.submission_notes.trim(),
        brief_notes: agencyForm.brief_notes.trim()
      });
      showToast(`Contract status updated to '${agencyForm.status}'.`, 'success', 'Agency Status Saved');
      setUpdatingContract(null);
      fetchHiredCreators();
    } catch (err) {
      setAgencyError(err.message || 'Failed to update agency status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  useEffect(() => {
    fetchInfluencers();
  }, [selectedPlatform, selectedNiche, selectedTier]);

  useEffect(() => {
    fetchCampaigns();
    fetchHiredCreators();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInfluencers();
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      showToast('Copied to clipboard', 'success', 'Copied');
    });
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
      const selectedPkg = hiringCreator.packages?.find((p) => p.id === hireForm.package_id) || hiringCreator.packages?.[0];
      const targetCampaign = campaigns.find((c) => String(c.id) === String(hireForm.campaign_id));
      const res = await influencersApi.hireInfluencer({
        influencer_id: hiringCreator.id,
        influencer_name: hiringCreator.name,
        influencer_handle: hiringCreator.handle,
        platform: hiringCreator.platform,
        avatar_url: hiringCreator.avatar_url || '',
        campaign_id: parseInt(hireForm.campaign_id),
        campaign_name: targetCampaign?.name || `Campaign #${hireForm.campaign_id}`,
        package_id: hireForm.package_id,
        package_title: selectedPkg?.title || 'Creator Sponsorship',
        deliverables: selectedPkg?.deliverables || 'Sponsored Video & Brand Integration',
        agreed_fee: selectedPkg?.price || 150000,
        target_date: hireForm.target_date,
        brief_notes: hireForm.brief_notes,
      });
      showToast(res.message || `Successfully sent sponsorship brief for ${hiringCreator.name}! Agency team will initiate outreach.`, 'success', 'Request Submitted');
      setHiringCreator(null);
      setActiveTab('hired');
      fetchInfluencers();
      fetchHiredCreators();
    } catch (err) {
      setHireError(err.response?.data?.message || 'Failed to submit creator proposal.');
    } finally {
      setSubmittingHire(false);
    }
  };

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

    const payload = {
      name: creatorForm.name.trim(),
      handle: creatorForm.handle.trim(),
      platform: creatorForm.platform,
      niche: creatorForm.niche,
      tier: creatorForm.tier,
      bio: creatorForm.bio.trim(),
      avatar_url: creatorForm.avatar_url.trim(),
      followers_count: parseInt(creatorForm.followers_count) || 100000,
      avg_views: parseInt(creatorForm.avg_views) || 25000,
      engagement_rate: parseFloat(creatorForm.engagement_rate) || 5.0,
      packages: [
        {
          id: `pkg_${Date.now()}_1`,
          title: creatorForm.pkg1_title.trim() || 'Primary Sponsorship',
          deliverables: creatorForm.pkg1_deliverables.trim() || 'Full Brand Integration',
          price: parseInt(creatorForm.pkg1_price) || 150000,
        },
        ...(creatorForm.pkg2_title
          ? [
              {
                id: `pkg_${Date.now()}_2`,
                title: creatorForm.pkg2_title.trim(),
                deliverables: creatorForm.pkg2_deliverables.trim() || 'Secondary Deliverable',
                price: parseInt(creatorForm.pkg2_price) || 80000,
              },
            ]
          : []),
      ],
      is_verified: Boolean(creatorForm.is_verified),
      is_available: Boolean(creatorForm.is_available),
    };

    try {
      if (isCreatingNew) {
        await influencersApi.createInfluencer(payload);
        showToast(`Creator '${creatorForm.name}' added to marketplace roster.`, 'success', 'Creator Added');
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

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  const formatPrice = (price) => {
    return `Rs. ${Number(price || 0).toLocaleString()}`;
  };

  const getPlatformBadge = (platform) => {
    switch (platform) {
      case 'YouTube':
        return (
          <span className="badge d-inline-flex align-items-center gap-1 px-2 py-1 text-xs" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
            <Video size={12} className="flex-shrink-0" />
            <span className="fw-semibold">YouTube</span>
          </span>
        );
      case 'Instagram':
        return (
          <span className="badge d-inline-flex align-items-center gap-1 px-2 py-1 text-xs" style={{ background: 'rgba(217, 70, 239, 0.12)', color: '#c026d3', border: '1px solid rgba(217, 70, 239, 0.25)' }}>
            <Share2 size={12} className="flex-shrink-0" />
            <span className="fw-semibold">Instagram</span>
          </span>
        );
      case 'TikTok':
        return (
          <span className="badge d-inline-flex align-items-center gap-1 px-2 py-1 text-xs" style={{ background: 'rgba(15, 23, 42, 0.08)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
            <TrendingUp size={12} className="flex-shrink-0" />
            <span className="fw-semibold">TikTok</span>
          </span>
        );
      case 'LinkedIn':
        return (
          <span className="badge d-inline-flex align-items-center gap-1 px-2 py-1 text-xs" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', border: '1px solid rgba(2, 132, 199, 0.25)' }}>
            <Briefcase size={12} className="flex-shrink-0" />
            <span className="fw-semibold">LinkedIn</span>
          </span>
        );
      default:
        return (
          <span className="badge d-inline-flex align-items-center gap-1 px-2 py-1 text-xs" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', border: '1px solid rgba(2, 132, 199, 0.25)' }}>
            <Users size={12} className="flex-shrink-0" />
            <span className="fw-semibold">{platform}</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REQUEST_RECEIVED':
      case 'PENDING_ACCEPTANCE':
      case 'CONTRACT_ACTIVE':
        return (
          <span className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 text-xs" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <Clock size={12} className="flex-shrink-0" />
            <span className="fw-semibold">REQUEST RECEIVED</span>
          </span>
        );
      case 'IN_OUTREACH':
      case 'CONTACTED':
        return (
          <span className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 text-xs" style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#0284c7', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
            <PhoneCall size={12} className="flex-shrink-0" />
            <span className="fw-semibold">AGENCY OUTREACH</span>
          </span>
        );
      case 'IN_PRODUCTION':
      case 'IN_PROGRESS':
        return (
          <span className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 text-xs" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <Clock size={12} className="flex-shrink-0" />
            <span className="fw-semibold">IN PRODUCTION</span>
          </span>
        );
      case 'SUBMITTED_FOR_REVIEW':
      case 'COMPLETED':
        return (
          <span className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 text-xs" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#16a34a', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <CheckCircle2 size={12} className="flex-shrink-0" />
            <span className="fw-semibold">DELIVERED &amp; BROADCASTED</span>
          </span>
        );
      case 'DECLINED':
        return (
          <span className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 text-xs" style={{ background: 'rgba(100, 116, 139, 0.12)', color: '#64748b', border: '1px solid rgba(100, 116, 139, 0.3)' }}>
            <X size={12} className="flex-shrink-0" />
            <span className="fw-semibold">CREATOR UNAVAILABLE</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 text-xs" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <X size={12} className="flex-shrink-0" />
            <span className="fw-semibold">CANCELLED</span>
          </span>
        );
      default:
        return (
          <span className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 text-xs" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <Clock size={12} className="flex-shrink-0" />
            <span className="fw-semibold">{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="w-100" style={{ boxSizing: 'border-box' }}>
      {toast && (
        <div
          className="position-fixed bottom-0 end-0 p-3"
          style={{ zIndex: 9999, maxWidth: '380px' }}
        >
          <div
            className={`d-flex align-items-start gap-2 p-3 rounded-3 shadow-lg border`}
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
              {toast.title && <div className="fw-bold text-primary-emphasis mb-0.5" style={{ fontSize: '0.8rem' }}>{toast.title}</div>}
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{toast.message}</div>
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

      {/* Header Banner */}
      <div
        className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4 p-4 rounded-3 border w-100"
        style={{ backgroundColor: 'var(--color-bg-surface)', boxShadow: 'var(--shadow-xs)', boxSizing: 'border-box' }}
      >
        <div style={{ maxWidth: '680px', minWidth: 0 }}>
          <h1 className="h4 fw-bold text-primary-emphasis mb-1">
            Influencer &amp; Creator Sponsorship Marketplace
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
            Discover vetted digital creators across YouTube, Instagram, and TikTok. Submit sponsorship briefs directly to your campaign, and our agency team manages creator outreach, delivery tracking, and live broadcast verification behind the scenes.
          </p>
        </div>

        <div className="d-flex align-items-center gap-3 flex-wrap flex-shrink-0">
          <div className="d-flex align-items-center gap-3 bg-light-subtle px-3 py-2 rounded-2 border">
            <div>
              <div className="fw-bold fs-6 text-primary text-center">{influencers.length}</div>
              <div className="text-muted text-center" style={{ fontSize: '0.7rem' }}>Vetted Creators</div>
            </div>
            <div className="vr opacity-25" />
            <div>
              <div className="fw-bold fs-6 text-success text-center">Agency-Managed</div>
              <div className="text-muted text-center" style={{ fontSize: '0.7rem' }}>Full Concierge</div>
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

      {/* Tab Switcher: 2 Clean Tabs */}
      <div className="d-flex align-items-center gap-2 mb-4 border-bottom pb-2 flex-wrap w-100">
        <button
          type="button"
          className={`btn btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-2 rounded-2 fw-medium ${activeTab === 'directory' ? 'btn-primary shadow-xs' : 'btn-light text-muted'}`}
          style={{ fontSize: '0.82rem' }}
          onClick={() => setActiveTab('directory')}
        >
          <Users size={15} />
          <span>Creator Marketplace ({influencers.length})</span>
        </button>
        <button
          type="button"
          className={`btn btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-2 rounded-2 fw-medium ${activeTab === 'hired' ? 'btn-primary shadow-xs' : 'btn-light text-muted'}`}
          style={{ fontSize: '0.82rem' }}
          onClick={() => { setActiveTab('hired'); fetchHiredCreators(); }}
        >
          <Briefcase size={15} />
          <span>Brand Sponsorships &amp; Approvals ({hiredList.length})</span>
        </button>
      </div>

      {/* TAB 1: CREATOR MARKETPLACE */}
      {activeTab === 'directory' && (
        <div className="w-100">
          <div className="toolbar-ui p-3 rounded-3 border mb-4 w-100" style={{ backgroundColor: 'var(--color-bg-surface)', boxSizing: 'border-box' }}>
            <form onSubmit={handleSearchSubmit} className="toolbar-search mb-2 mb-md-0">
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
              <div className="btn-group btn-group-sm" role="group">
                {PLATFORMS.map((plat) => (
                  <button
                    key={plat}
                    type="button"
                    className={`btn btn-sm ${selectedPlatform === plat ? 'btn-primary' : 'btn-outline-secondary'}`}
                    style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem' }}
                    onClick={() => setSelectedPlatform(plat)}
                  >
                    {plat}
                  </button>
                ))}
              </div>

              <select
                className="form-select-ui"
                style={{ width: 'auto', height: '38px', fontSize: '0.75rem' }}
                value={selectedNiche}
                onChange={(e) => setSelectedNiche(e.target.value)}
              >
                {NICHES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>

              <select
                className="form-select-ui"
                style={{ width: 'auto', height: '38px', fontSize: '0.75rem' }}
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
              >
                {TIERS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

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
            <div className="row g-4 w-100 m-0">
              {influencers.map((inf) => (
                <div key={inf.id} className="col-12 col-md-6 col-xxl-4 p-2">
                  <div className="ui-card-standard h-100 d-flex flex-column justify-content-between p-4 rounded-3 border" style={{ backgroundColor: 'var(--color-bg-surface)', boxSizing: 'border-box' }}>
                    <div>
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                        <div className="d-flex align-items-start gap-2.5" style={{ minWidth: 0, flex: '1 1 auto' }}>
                          <CreatorAvatar name={inf.name} avatarUrl={inf.avatar_url} size={48} />
                          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                            <div className="d-flex align-items-center gap-1.5 mb-0.5" style={{ minWidth: 0 }}>
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
                              className="text-muted font-monospace text-xs text-truncate mb-1.5"
                              title={inf.handle}
                            >
                              {inf.handle}
                            </div>
                            <div className="d-flex align-items-center gap-1 flex-wrap">
                              <span className="badge bg-primary-subtle text-primary font-medium px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                                {inf.niche}
                              </span>
                              <span className="badge bg-secondary-subtle text-secondary font-medium px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                                {inf.tier}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex flex-column align-items-end gap-1.5 flex-shrink-0">
                          {getPlatformBadge(inf.platform)}

                          {isAdminOrManager && (
                            <div className="d-flex align-items-center gap-1">
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

                      <p
                        className="text-muted mb-3"
                        style={{
                          fontSize: '0.75rem',
                          lineHeight: '1.45',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {inf.bio || 'Verified content creator available for dedicated sponsorships and brand activations.'}
                      </p>

                      <div className="ui-metrics-strip mb-3">
                        <div className="ui-metric-col">
                          <div className="ui-metric-value text-primary-emphasis">
                            {formatNumber(inf.followers_count)}
                          </div>
                          <div className="ui-metric-label">Followers</div>
                        </div>
                        <div className="ui-metric-col">
                          <div className="ui-metric-value text-primary-emphasis">
                            {formatNumber(inf.avg_views)}
                          </div>
                          <div className="ui-metric-label">Avg Views</div>
                        </div>
                        <div className="ui-metric-col">
                          <div className="ui-metric-value text-success">
                            {inf.engagement_rate}%
                          </div>
                          <div className="ui-metric-label">Engagement</div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-muted text-xs mb-1.5 fw-semibold d-flex align-items-center justify-content-between" style={{ fontSize: '0.68rem' }}>
                          <span>SPONSORSHIP PACKAGES</span>
                          <span className="text-primary">{inf.packages?.length || 0} Available</span>
                        </div>
                        <div className="d-flex flex-column gap-1.5">
                          {(inf.packages || []).slice(0, 2).map((pkg) => (
                            <div key={pkg.id} className="ui-package-tile">
                              <span
                                className="text-truncate text-dark-emphasis fw-medium"
                                style={{ fontSize: '0.72rem', minWidth: 0, flex: '1 1 auto' }}
                                title={pkg.title}
                              >
                                {pkg.title}
                              </span>
                              <span
                                className="badge bg-primary-subtle text-primary font-monospace fw-bold flex-shrink-0 px-2 py-1"
                                style={{ whiteSpace: 'nowrap', fontSize: '0.7rem' }}
                              >
                                {formatPrice(pkg.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between pt-3 border-top gap-2 mt-1">
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
                        <span>Request Creator</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SPONSORSHIP REQUESTS & CONTRACTS */}
      {activeTab === 'hired' && (() => {
        const filteredHiredList = hiredList.filter((hc) => {
          if (hiredStatusFilter === 'ALL') return true;
          if (hiredStatusFilter === 'REQUEST') return !hc.status || hc.status === 'REQUEST_RECEIVED' || hc.status === 'PENDING_ACCEPTANCE' || hc.status === 'CONTRACT_ACTIVE';
          if (hiredStatusFilter === 'OUTREACH') return hc.status === 'IN_OUTREACH' || hc.status === 'CONTACTED';
          if (hiredStatusFilter === 'IN_PRODUCTION') return hc.status === 'IN_PRODUCTION' || hc.status === 'IN_PROGRESS';
          if (hiredStatusFilter === 'COMPLETED') return hc.status === 'COMPLETED' || hc.status === 'SUBMITTED_FOR_REVIEW';
          if (hiredStatusFilter === 'CANCELLED') return hc.status === 'CANCELLED' || hc.status === 'DECLINED';
          return true;
        });

        const totalSpend = hiredList.reduce((acc, c) => acc + Number(c.agreed_fee || 0), 0);
        const inProductionCount = hiredList.filter((c) => c.status === 'IN_PRODUCTION' || c.status === 'IN_PROGRESS').length;
        const completedCount = hiredList.filter((c) => c.status === 'COMPLETED' || c.status === 'SUBMITTED_FOR_REVIEW').length;

        return (
          <div className="w-100 mb-5">
            {/* Header & Refresh */}
            <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4 w-100">
              <div>
                <h2 className="h5 fw-bold text-primary-emphasis mb-1">Brand Sponsorships &amp; Approvals</h2>
                <span className="text-muted text-xs">
                  Review brand sponsorship requests, manage outreach milestones, update deliverables, and approve contracts.
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 align-self-start align-self-sm-center"
                onClick={fetchHiredCreators}
              >
                <RefreshCw size={13} />
                <span>Refresh Requests</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="row g-3 mb-4 w-100 m-0">
              <div className="col-12 col-sm-4 p-2">
                <div
                  className="p-3 rounded-3 border d-flex align-items-center gap-3 w-100"
                  style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', boxSizing: 'border-box' }}
                >
                  <div className="rounded-circle p-2.5 bg-primary-subtle text-primary d-flex align-items-center justify-content-center">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <div className="text-muted text-xs fw-semibold text-uppercase tracking-wider">Total Creator Spend</div>
                    <div className="fs-5 fw-bold text-primary font-monospace">
                      Rs. {totalSpend.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-4 p-2">
                <div
                  className="p-3 rounded-3 border d-flex align-items-center gap-3 w-100"
                  style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: inProductionCount > 0 ? 'rgba(245, 158, 11, 0.4)' : 'var(--color-border)', boxSizing: 'border-box' }}
                >
                  <div className="rounded-circle p-2.5 bg-warning-subtle text-warning d-flex align-items-center justify-content-center">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="text-muted text-xs fw-semibold text-uppercase tracking-wider">In Production</div>
                    <div className="fs-5 fw-bold text-dark font-monospace">
                      {inProductionCount} Active
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-4 p-2">
                <div
                  className="p-3 rounded-3 border d-flex align-items-center gap-3 w-100"
                  style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', boxSizing: 'border-box' }}
                >
                  <div className="rounded-circle p-2.5 bg-success-subtle text-success d-flex align-items-center justify-content-center">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div className="text-muted text-xs fw-semibold text-uppercase tracking-wider">Delivered &amp; Broadcasted</div>
                    <div className="fs-5 fw-bold text-success font-monospace">
                      {completedCount}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="d-flex align-items-center gap-2 flex-wrap mb-4 pb-2 border-bottom w-100">
              <span className="text-xs fw-semibold text-muted text-uppercase me-2">Status:</span>
              {[
                { key: 'ALL', label: 'All Requests', count: hiredList.length },
                { key: 'REQUEST', label: 'Request Received', count: hiredList.filter((c) => !c.status || c.status === 'REQUEST_RECEIVED' || c.status === 'PENDING_ACCEPTANCE' || c.status === 'CONTRACT_ACTIVE').length },
                { key: 'OUTREACH', label: 'Agency Outreach', count: hiredList.filter((c) => c.status === 'IN_OUTREACH' || c.status === 'CONTACTED').length },
                { key: 'IN_PRODUCTION', label: 'In Production', count: inProductionCount },
                { key: 'COMPLETED', label: 'Delivered', count: completedCount },
                { key: 'CANCELLED', label: 'Cancelled / Declined', count: hiredList.filter((c) => c.status === 'CANCELLED' || c.status === 'DECLINED').length },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`btn btn-sm py-1 px-2.5 text-xs rounded-pill d-inline-flex align-items-center gap-1.5 transition-all ${
                    hiredStatusFilter === f.key
                      ? 'btn-primary shadow-xs'
                      : 'btn-outline-secondary'
                  }`}
                  onClick={() => setHiredStatusFilter(f.key)}
                >
                  <span>{f.label}</span>
                  <span
                    className={`badge rounded-pill px-1.5 py-0.5 ${
                      hiredStatusFilter === f.key ? 'bg-white text-primary' : 'bg-secondary-subtle text-secondary'
                    }`}
                    style={{ fontSize: '0.65rem' }}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {loadingHired ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary spinner-border-sm" role="status" />
                <p className="text-muted small mt-2">Loading sponsorship contracts from database...</p>
              </div>
            ) : filteredHiredList.length === 0 ? (
              <div className="p-5 text-center rounded-3 border bg-light-subtle w-100" style={{ boxSizing: 'border-box' }}>
                <div className="rounded-circle p-3 d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary mb-3">
                  <Sparkles size={28} />
                </div>
                <h4 className="h6 fw-bold text-dark mb-1">
                  {hiredList.length === 0 ? 'No Sponsorship Requests Yet' : 'No Contracts Match Filter'}
                </h4>
                <p className="text-muted small mb-3" style={{ maxWidth: '440px', margin: '0 auto' }}>
                  {hiredList.length === 0
                    ? "You haven't requested any creators yet. Switch to the Creator Marketplace to discover vetted influencers and commission sponsorships for your campaigns."
                    : 'Try selecting a different status filter above to view your contracts.'}
                </p>
                {hiredList.length === 0 ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1.5"
                    onClick={() => setActiveTab('directory')}
                  >
                    <Users size={14} />
                    <span>Explore Creator Marketplace</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setHiredStatusFilter('ALL')}
                  >
                    <span>Show All Requests</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="d-flex flex-column w-100" style={{ gap: '1.5rem' }}>
                {filteredHiredList.map((hc) => {
                  const isRequest = !hc.status || hc.status === 'REQUEST_RECEIVED' || hc.status === 'PENDING_ACCEPTANCE' || hc.status === 'CONTRACT_ACTIVE';
                  const isOutreach = hc.status === 'IN_OUTREACH' || hc.status === 'CONTACTED';
                  const isInProduction = hc.status === 'IN_PRODUCTION' || hc.status === 'IN_PROGRESS';
                  const isCompleted = hc.status === 'COMPLETED' || hc.status === 'SUBMITTED_FOR_REVIEW';
                  const isCancelled = hc.status === 'CANCELLED' || hc.status === 'DECLINED';

                  return (
                    <div
                      key={hc.id}
                      className="p-4 rounded-3 border shadow-xs w-100"
                      style={{
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: isCompleted
                          ? 'rgba(34, 197, 94, 0.4)'
                          : isInProduction
                          ? 'rgba(245, 158, 11, 0.4)'
                          : isCancelled
                          ? 'rgba(239, 68, 68, 0.35)'
                          : 'var(--color-border)',
                        borderLeftWidth: '5px',
                        borderLeftColor: isCompleted
                          ? '#22c55e'
                          : isInProduction
                          ? '#f59e0b'
                          : isOutreach
                          ? '#0284c7'
                          : isCancelled
                          ? '#64748b'
                          : '#3b82f6',
                        boxSizing: 'border-box'
                      }}
                    >
                      {/* Top Header Strip: Creator Details & Payout */}
                      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-3 w-100">
                        <div className="d-flex align-items-center gap-3">
                          <CreatorAvatar name={hc.influencer_name} avatarUrl={hc.avatar_url} size={50} />
                          <div>
                            <div className="d-flex align-items-center gap-2 flex-wrap mb-0.5">
                              <span className="fw-bold text-primary-emphasis fs-6">{hc.influencer_name}</span>
                              <span className="text-muted font-monospace text-xs">{hc.influencer_handle}</span>
                              {getPlatformBadge(hc.platform)}
                              {getStatusBadge(hc.status)}
                            </div>
                            <div className="text-muted text-xs">
                              Contract ID: <span className="font-monospace fw-semibold text-dark">{hc.id}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-md-end">
                          <div className="text-muted text-xs fw-semibold text-uppercase tracking-wider mb-0.5" style={{ fontSize: '0.68rem' }}>
                            Agreed Fee
                          </div>
                          <div className="fw-bold text-primary font-monospace fs-5">
                            Rs. {Number(hc.agreed_fee || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Package & Deliverables Card */}
                      <div
                        className="p-3 rounded-2 mb-3 w-100"
                        style={{
                          backgroundColor: 'var(--color-bg-subtle, #f8fafc)',
                          border: '1px solid var(--color-border-subtle, #e2e8f0)',
                          boxSizing: 'border-box'
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-1 flex-wrap gap-1">
                          <div className="text-xs fw-bold text-dark text-uppercase tracking-wider">
                            Package: <span className="text-primary">{hc.package_title}</span>
                          </div>
                          {hc.target_date && (
                            <div className="text-xs text-muted d-inline-flex align-items-center gap-1">
                              <Calendar size={12} />
                              <span>Target Deadline: <strong className="text-dark">{hc.target_date}</strong></span>
                            </div>
                          )}
                        </div>
                        <div className="text-muted text-xs mb-1" style={{ lineHeight: '1.6' }}>
                          <strong className="text-secondary fw-semibold">Deliverables: </strong>
                          <span>{hc.deliverables}</span>
                        </div>
                        {hc.brief_notes && (
                          <div
                            className="mt-2 pt-2 border-top text-muted text-xs fst-italic"
                            style={{ lineHeight: '1.45', borderColor: 'var(--color-border-subtle, #e2e8f0)' }}
                          >
                            <span className="not-italic fw-semibold text-secondary">Advertiser Brief: </span>
                            "{hc.brief_notes}"
                          </div>
                        )}
                      </div>

                      {/* Live Deliverable Link Box (If Published) */}
                      {hc.submission_url && (
                        <div
                          className="p-3 rounded-2 mb-3 w-100"
                          style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.05)',
                            border: '1px solid rgba(34, 197, 94, 0.25)',
                            boxSizing: 'border-box'
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-between flex-wrap gap-1 mb-1">
                            <span className="text-xs fw-bold text-success d-inline-flex align-items-center gap-1">
                              <CheckCircle2 size={13} className="text-success" />
                              Published Live Content Link:
                            </span>
                            {hc.submitted_at && (
                              <span className="text-muted text-2xs font-monospace">
                                {new Date(hc.submitted_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <a
                              href={hc.submission_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary text-xs font-monospace text-truncate d-inline-flex align-items-center gap-1"
                              style={{ maxWidth: '600px' }}
                            >
                              <span>{hc.submission_url}</span>
                              <ExternalLink size={12} className="flex-shrink-0" />
                            </a>
                          </div>
                          {hc.submission_notes && (
                            <div className="text-xs text-muted mt-1 fst-italic">
                              <span className="not-italic fw-semibold text-secondary">Agency proof notes:</span> "{hc.submission_notes}"
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bottom Footer Strip: Campaign info & Comprehensive Actions */}
                      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 pt-3 border-top w-100">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 text-xs">
                            Campaign: <strong>{hc.campaign_name || `Campaign #${hc.campaign_id}`}</strong>
                          </span>
                        </div>

                        {/* Actions for Admin and Advertiser */}
                        <div className="d-flex align-items-center gap-2 flex-wrap justify-content-md-end">
                          {/* ADMIN COMPREHENSIVE ACTIONS */}
                          {isAdminOrManager && (
                            <>
                              {/* 1. Request stage */}
                              {isRequest && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm py-1.5 px-3 text-xs fw-semibold text-white d-inline-flex align-items-center gap-1.5"
                                    onClick={() => handleQuickStatusUpdate(hc.id, 'IN_OUTREACH', 'Moved to Agency Outreach. Start communicating with creator.')}
                                  >
                                    <PhoneCall size={13} />
                                    <span>Accept &amp; Start Outreach</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-warning btn-sm py-1.5 px-2.5 text-xs d-inline-flex align-items-center gap-1"
                                    onClick={() => handleQuickStatusUpdate(hc.id, 'IN_PRODUCTION', 'Confirmed contract and moved directly to In Production.')}
                                  >
                                    <Clock size={13} />
                                    <span>Move to Production</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm py-1.5 px-2.5 text-xs d-inline-flex align-items-center gap-1"
                                    onClick={() => handleQuickStatusUpdate(hc.id, 'DECLINED', 'Marked request as Declined.')}
                                  >
                                    <X size={13} />
                                    <span>Decline</span>
                                  </button>
                                </>
                              )}

                              {/* 2. Outreach stage */}
                              {isOutreach && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-warning text-dark btn-sm py-1.5 px-3 text-xs fw-semibold d-inline-flex align-items-center gap-1.5"
                                    onClick={() => handleQuickStatusUpdate(hc.id, 'IN_PRODUCTION', 'Creator confirmed! Deal is now in production.')}
                                  >
                                    <Clock size={13} />
                                    <span>Confirm in Production</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-success text-white btn-sm py-1.5 px-3 text-xs fw-semibold d-inline-flex align-items-center gap-1.5"
                                    onClick={() => handleOpenAgencyModal(hc, 'COMPLETED')}
                                  >
                                    <CheckCircle size={13} />
                                    <span>Submit Live Link &amp; Complete</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm py-1.5 px-2 text-xs"
                                    onClick={() => handleQuickStatusUpdate(hc.id, 'DECLINED', 'Creator unavailable.')}
                                  >
                                    <span>Decline</span>
                                  </button>
                                </>
                              )}

                              {/* 3. In Production stage */}
                              {isInProduction && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-success text-white btn-sm py-1.5 px-3 text-xs fw-semibold d-inline-flex align-items-center gap-1.5"
                                    onClick={() => handleOpenAgencyModal(hc, 'COMPLETED')}
                                  >
                                    <CheckCircle size={13} />
                                    <span>Submit Live Link &amp; Complete</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm py-1.5 px-2 text-xs"
                                    onClick={() => handleCancelHiredContract(hc.id)}
                                  >
                                    <span>Cancel</span>
                                  </button>
                                </>
                              )}

                              {/* 4. Completed stage */}
                              {isCompleted && (
                                <>
                                  {hc.submission_url && (
                                    <a
                                      href={hc.submission_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn btn-outline-success btn-sm py-1.5 px-2.5 text-xs d-inline-flex align-items-center gap-1"
                                    >
                                      <ExternalLink size={12} />
                                      <span>View Live Post</span>
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm py-1.5 px-2.5 text-xs d-inline-flex align-items-center gap-1"
                                    onClick={() => handleOpenAgencyModal(hc, 'COMPLETED')}
                                  >
                                    <Edit2 size={12} />
                                    <span>Edit Link / Notes</span>
                                  </button>
                                </>
                              )}

                              {/* 5. Cancelled stage */}
                              {isCancelled && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm py-1 px-2.5 text-xs d-inline-flex align-items-center gap-1"
                                    onClick={() => handleQuickStatusUpdate(hc.id, 'REQUEST_RECEIVED', 'Request reopened.')}
                                  >
                                    <RotateCcw size={12} />
                                    <span>Reopen Request</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm py-1 px-2.5 text-xs d-inline-flex align-items-center gap-1"
                                    onClick={() => handlePermanentDeleteContract(hc.id)}
                                    title="Permanently remove record"
                                  >
                                    <Trash2 size={12} />
                                    <span>Delete Record</span>
                                  </button>
                                </>
                              )}

                              {/* Universal Agency Manage Settings Button */}
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm py-1.5 px-2.5 text-xs d-inline-flex align-items-center gap-1"
                                onClick={() => handleOpenAgencyModal(hc)}
                                title="Custom Status & Notes Management"
                              >
                                <Settings2 size={13} />
                                <span>Manage Status</span>
                              </button>
                            </>
                          )}

                          {/* ADVERTISER USER ACTIONS */}
                          {!isAdminOrManager && (
                            <>
                              {/* Advertiser can cancel early requests */}
                              {(isRequest || isOutreach) && (
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm py-1.5 px-3 text-xs d-inline-flex align-items-center gap-1"
                                  onClick={() => handleCancelHiredContract(hc.id)}
                                  title="Cancel Sponsorship Request"
                                >
                                  <Trash2 size={12} />
                                  <span>Cancel Request</span>
                                </button>
                              )}

                              {/* Advertiser can view live post once completed */}
                              {hc.submission_url && (
                                <a
                                  href={hc.submission_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-success text-white btn-sm py-1.5 px-3 text-xs d-inline-flex align-items-center gap-1"
                                >
                                  <ExternalLink size={13} />
                                  <span>View Live Post</span>
                                </a>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* MEDIA KIT MODAL */}
      {inspectingCreator && (
        <div
          className="modal-backdrop-ui"
          style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && setInspectingCreator(null)}
        >
          <div
            className="modal-dialog-ui modal-xl"
            style={{ maxWidth: '860px', width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}
            role="dialog"
            aria-modal="true"
          >
            <div 
              className="modal-header-ui" 
              style={{ 
                padding: '1.25rem 1.5rem', 
                borderBottom: '1px solid var(--color-border)', 
                flexShrink: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(37, 99, 235, 0.01) 100%)'
              }}
            >
              <div className="d-flex align-items-center gap-2.5">
                <div 
                  className="d-flex align-items-center justify-content-center rounded-2"
                  style={{ 
                    width: '34px', 
                    height: '34px', 
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  <Award size={17} className="text-white" />
                </div>
                <div>
                  <h3 className="modal-title-ui mb-0 fw-bold" style={{ fontSize: '0.95rem' }}>Creator Media Kit &amp; Rate Card</h3>
                  <span className="text-muted" style={{ fontSize: '0.68rem' }}>Official sponsorship documentation &amp; channel analytics</span>
                </div>
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

            <div
              className="modal-body-ui"
              style={{ padding: '0', overflowY: 'auto', flex: '1 1 auto', maxHeight: 'calc(92vh - 70px)' }}
            >
              <div
                className="p-4 border-bottom"
                style={{
                  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(37, 99, 235, 0.01) 100%)',
                  boxSizing: 'border-box',
                  width: '100%'
                }}
              >
                <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4">
                  <div className="d-flex align-items-start gap-3" style={{ minWidth: 0, flex: '1 1 auto' }}>
                    <div className="position-relative flex-shrink-0">
                      <CreatorAvatar
                        name={inspectingCreator.name}
                        avatarUrl={inspectingCreator.avatar_url}
                        size={64}
                        className="shadow"
                      />
                      {inspectingCreator.is_verified && (
                        <div 
                          className="position-absolute d-flex align-items-center justify-content-center bg-primary rounded-circle"
                          style={{ 
                            bottom: '-2px', 
                            right: '-2px',
                            width: '20px', 
                            height: '20px', 
                            border: '3px solid var(--color-bg-surface)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                          }}
                        >
                          <CheckCircle2 size={11} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <h4 className="fw-bold text-primary-emphasis mb-0" style={{ fontSize: '1.15rem' }}>
                          {inspectingCreator.name}
                        </h4>
                        {inspectingCreator.is_verified && (
                          <span className="badge bg-primary-subtle text-primary d-inline-flex align-items-center gap-1 px-2 py-0.5" style={{ fontSize: '0.65rem' }}>
                            <ShieldCheck size={11} />
                            Verified Partner
                          </span>
                        )}
                      </div>
                      <div className="d-flex align-items-center gap-2 text-muted mb-1.5 flex-wrap">
                        <span className="font-monospace" style={{ fontSize: '0.78rem' }}>{inspectingCreator.handle}</span>
                        <span style={{ fontSize: '0.7rem' }}>•</span>
                        <span style={{ fontSize: '0.78rem' }}>{inspectingCreator.platform}</span>
                      </div>
                      <div className="d-flex align-items-center gap-1.5 flex-wrap">
                        <span className="badge bg-primary-subtle text-primary px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                          {inspectingCreator.niche}
                        </span>
                        <span className="badge bg-secondary-subtle text-secondary px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                          {inspectingCreator.tier}
                        </span>
                        {inspectingCreator.is_available !== false && (
                          <span className="badge bg-success-subtle text-success px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                            Available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-2 align-items-center justify-content-lg-end flex-shrink-0 flex-wrap">
                    <div
                      className="p-2.5 px-3 rounded-2 text-center border"
                      style={{ backgroundColor: 'var(--color-bg-surface)', minWidth: '90px' }}
                    >
                      <div className="d-flex align-items-center justify-content-center gap-1 text-primary fw-bold" style={{ fontSize: '1rem' }}>
                        <Users size={14} />
                        <span>{formatNumber(inspectingCreator.followers_count)}</span>
                      </div>
                      <div className="text-muted fw-semibold text-uppercase mt-0.5" style={{ fontSize: '0.6rem', letterSpacing: '0.5px' }}>
                        Audience
                      </div>
                    </div>

                    <div
                      className="p-2.5 px-3 rounded-2 text-center border"
                      style={{ backgroundColor: 'var(--color-bg-surface)', minWidth: '90px' }}
                    >
                      <div className="d-flex align-items-center justify-content-center gap-1 text-primary fw-bold" style={{ fontSize: '1rem' }}>
                        <Eye size={14} />
                        <span>{formatNumber(inspectingCreator.avg_views)}</span>
                      </div>
                      <div className="text-muted fw-semibold text-uppercase mt-0.5" style={{ fontSize: '0.6rem', letterSpacing: '0.5px' }}>
                        Avg Views
                      </div>
                    </div>

                    <div
                      className="p-2.5 px-3 rounded-2 text-center border"
                      style={{ backgroundColor: 'var(--color-bg-surface)', minWidth: '90px' }}
                    >
                      <div className="d-flex align-items-center justify-content-center gap-1 text-success fw-bold" style={{ fontSize: '1rem' }}>
                        <TrendingUp size={14} />
                        <span>{inspectingCreator.engagement_rate}%</span>
                      </div>
                      <div className="text-muted fw-semibold text-uppercase mt-0.5" style={{ fontSize: '0.6rem', letterSpacing: '0.5px' }}>
                        Engagement
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="mb-4">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-primary" />
                    <h5 className="fw-bold text-primary-emphasis mb-0 text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                      Creator Bio &amp; Channel Overview
                    </h5>
                  </div>
                  <div
                    className="p-3 rounded-2 border"
                    style={{
                      lineHeight: '1.6',
                      borderLeft: '3px solid var(--color-brand-500, #2563eb)',
                      fontSize: '0.8rem',
                      backgroundColor: 'var(--color-bg-subtle)'
                    }}
                  >
                    {inspectingCreator.bio || 'Professional verified digital creator available for sponsorships and brand activations.'}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between gap-2 mb-2.5">
                    <div className="d-flex align-items-center gap-2">
                      <Briefcase size={14} className="text-primary" />
                      <h5 className="fw-bold text-primary-emphasis mb-0 text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                        Deliverables &amp; Pricing Packages
                      </h5>
                    </div>
                    <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.65rem' }}>
                      {(inspectingCreator.packages || []).length} Available
                    </span>
                  </div>

                  <div className="d-flex flex-column gap-2.5 w-100">
                    {(inspectingCreator.packages || []).map((pkg, idx) => (
                      <div
                        key={pkg.id || idx}
                        className="p-3 rounded-3 border w-100"
                        style={{
                          backgroundColor: 'var(--color-bg-surface)',
                          borderColor: 'var(--color-border)',
                          boxSizing: 'border-box'
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
                          <div className="d-flex align-items-center gap-2" style={{ minWidth: 0, flex: '1 1 auto' }}>
                            <div 
                              className="d-flex align-items-center justify-content-center rounded-1 flex-shrink-0"
                              style={{ 
                                width: '28px', 
                                height: '28px', 
                                background: idx === 0 ? 'rgba(37, 99, 235, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                color: idx === 0 ? '#2563eb' : '#64748b'
                              }}
                            >
                              <Video size={14} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <span className="fw-bold text-primary-emphasis d-block text-truncate" style={{ fontSize: '0.85rem' }}>
                                {pkg.title}
                              </span>
                              {idx === 0 && (
                                <span className="text-primary" style={{ fontSize: '0.6rem', fontWeight: 600 }}>
                                  RECOMMENDED
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className="badge bg-primary text-white font-monospace flex-shrink-0 px-2.5 py-1.5"
                            style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            {formatPrice(pkg.price)}
                          </span>
                        </div>

                        <div className="d-flex align-items-start gap-2 pt-2 border-top">
                          <Check size={13} className="text-success flex-shrink-0 mt-0.5" />
                          <span className="text-muted" style={{ fontSize: '0.75rem', lineHeight: '1.5' }}>
                            {pkg.deliverables}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {inspectingCreator.portfolio_links && inspectingCreator.portfolio_links.length > 0 && (
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-2.5">
                      <Award size={14} className="text-primary" />
                      <h5 className="fw-bold text-primary-emphasis mb-0 text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                        Past Brand Integrations
                      </h5>
                    </div>
                    <div className="d-flex flex-column gap-2 w-100">
                      {inspectingCreator.portfolio_links.map((link, idx) => (
                        <div
                          key={idx}
                          className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between p-3 rounded-2 border gap-2 w-100"
                          style={{
                            backgroundColor: 'var(--color-bg-surface)',
                            borderColor: 'var(--color-border)',
                            boxSizing: 'border-box'
                          }}
                        >
                          <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                            <CheckCircle2 size={14} className="text-success flex-shrink-0" />
                            <span className="fw-semibold text-primary-emphasis text-truncate" style={{ fontSize: '0.78rem' }}>{link.title}</span>
                          </div>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="badge bg-primary-subtle text-primary font-monospace d-inline-flex align-items-center gap-1.5 text-decoration-none px-2.5 py-1.5"
                            style={{ fontSize: '0.7rem' }}
                          >
                            <span className="text-truncate" style={{ maxWidth: '200px' }}>{link.url}</span>
                            <ExternalLink size={11} className="flex-shrink-0" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="d-flex align-items-center gap-2 mt-4 p-3 rounded-2 border" style={{ backgroundColor: 'var(--color-bg-subtle)' }}>
                  <Info size={14} className="text-primary flex-shrink-0" />
                  <span className="text-muted" style={{ fontSize: '0.7rem', lineHeight: '1.5' }}>
                    All rates are in Pakistani Rupees (PKR). Prices reflect standard single-activation deliverable rates. Final pricing and timeline are confirmed upon agency contract coordination.
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer-ui" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', background: 'var(--color-bg-subtle)' }}>
              <button
                type="button"
                className="btn-ui-icon p-1.5 text-muted"
                onClick={() => handleCopy(`${inspectingCreator.name} | ${inspectingCreator.handle} | ${inspectingCreator.platform} | ${inspectingCreator.niche} | ${formatNumber(inspectingCreator.followers_count)} Followers | ${inspectingCreator.engagement_rate}% Engagement`, 'mediaKit')}
                title="Copy Creator Summary"
              >
                {copiedField === 'mediaKit' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              </button>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn-ui btn-ui-secondary btn-ui-sm px-3"
                  onClick={() => setInspectingCreator(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-ui btn-ui-primary btn-ui-sm d-flex align-items-center gap-1.5 px-3.5 py-2"
                  onClick={() => {
                    const creator = inspectingCreator;
                    setInspectingCreator(null);
                    handleOpenHireModal(creator);
                  }}
                >
                  <Send size={13} />
                  <span>Request {inspectingCreator.name.split(' ')[0]}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST CREATOR / HIRE MODAL */}
      {hiringCreator && (
        <div
          className="modal-backdrop-ui"
          style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && setHiringCreator(null)}
        >
          <div
            className="modal-dialog-ui"
            style={{ maxWidth: '560px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-surface)', borderRadius: '14px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header-ui" style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="d-flex align-items-center gap-2">
                <Send size={16} className="text-primary" />
                <h3 className="modal-title-ui mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>Request Creator Sponsorship</h3>
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
                style={{ padding: '1.4rem', overflowY: 'auto', flex: '1 1 auto', maxHeight: 'calc(90vh - 130px)' }}
              >
                {hireError && (
                  <div className="alert alert-danger py-2 px-3 mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.75rem' }}>
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
                  <div style={{ minWidth: 0 }}>
                    <div className="fw-bold text-primary-emphasis" style={{ fontSize: '0.85rem' }}>{hiringCreator.name}</div>
                    <div className="text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
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
                        {c.name} (Budget: {formatPrice(c.budget || 0)})
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
                        {pkg.title} — {formatPrice(pkg.price)}
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
                    placeholder="e.g. Highlight the instant mobile booking discount and include link in description."
                    value={hireForm.brief_notes}
                    onChange={(e) => setHireForm({ ...hireForm, brief_notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer-ui" style={{ padding: '0.9rem 1.4rem', borderTop: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: 'var(--color-bg-subtle)' }}>
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
                  {submittingHire ? 'Submitting...' : 'Submit Sponsorship Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AGENCY STATUS MANAGEMENT MODAL (Admin / Space Manager) */}
      {updatingContract && (
        <div
          className="modal-backdrop-ui"
          style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && setUpdatingContract(null)}
        >
          <div
            className="modal-dialog-ui"
            style={{ maxWidth: '600px', width: '100%', maxHeight: '92vh', background: 'var(--color-bg-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            <div className="p-4 border-bottom d-flex align-items-center justify-content-between" style={{ backgroundColor: 'var(--color-bg-subtle)' }}>
              <div className="d-flex align-items-center gap-2.5">
                <div className="rounded-circle p-2 bg-primary text-white d-flex align-items-center justify-content-center">
                  <Settings2 size={18} />
                </div>
                <div>
                  <h3 className="h6 fw-bold mb-0 text-primary-emphasis">Manage Agency Sponsorship Status</h3>
                  <span className="text-muted text-xs">Update outreach milestones, record deliverables, and finalize status</span>
                </div>
              </div>
              <button type="button" className="btn-ui-icon p-1 text-muted" onClick={() => setUpdatingContract(null)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAgencyStatus} className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(92vh - 140px)' }}>
              {agencyError && (
                <div className="alert alert-danger py-2 px-3 text-xs mb-3 d-flex align-items-center gap-2">
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  <span>{agencyError}</span>
                </div>
              )}

              {/* Booking Overview */}
              <div className="p-3 rounded-2 border mb-3 bg-light-subtle">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="fw-bold text-xs text-dark">{updatingContract.influencer_name} ({updatingContract.influencer_handle})</span>
                  <span className="badge bg-primary-subtle text-primary font-monospace">Rs. {Number(updatingContract.agreed_fee || 0).toLocaleString()}</span>
                </div>
                <div className="text-xs text-muted mb-1">
                  <strong>Campaign:</strong> {updatingContract.campaign_name || `Campaign #${updatingContract.campaign_id}`}
                </div>
                <div className="text-xs text-muted">
                  <strong>Package:</strong> {updatingContract.package_title} — {updatingContract.deliverables}
                </div>
              </div>

              {/* Status Select */}
              <div className="mb-3">
                <label className="form-label fw-semibold text-xs mb-1 text-dark">
                  Sponsorship Milestone Status <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select form-select-sm"
                  value={agencyForm.status}
                  onChange={(e) => setAgencyForm({ ...agencyForm, status: e.target.value })}
                  required
                >
                  <option value="REQUEST_RECEIVED">1. REQUEST_RECEIVED (Brand submitted request)</option>
                  <option value="IN_OUTREACH">2. IN_OUTREACH (Agency contacting creator manager)</option>
                  <option value="IN_PRODUCTION">3. IN_PRODUCTION (Creator confirmed &amp; scripting)</option>
                  <option value="COMPLETED">4. COMPLETED (Live video broadcasted &amp; link verified)</option>
                  <option value="DECLINED">5. DECLINED (Creator unavailable / rejected)</option>
                  <option value="CANCELLED">6. CANCELLED (Booking aborted)</option>
                </select>
              </div>

              {/* Live Deliverable URL */}
              <div className="mb-3">
                <label className="form-label fw-semibold text-xs mb-1 text-dark">
                  Published Live Content Link / Proof URL (Optional / When Live)
                </label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light text-muted">
                    <ExternalLink size={13} />
                  </span>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://youtube.com/watch?v=... or https://instagram.com/reel/..."
                    value={agencyForm.submission_url}
                    onChange={(e) => setAgencyForm({ ...agencyForm, submission_url: e.target.value })}
                  />
                </div>
                <div className="form-text text-muted text-2xs mt-1" style={{ fontSize: '0.72rem' }}>
                  Advertiser will be able to click and verify this link once status is Completed.
                </div>
              </div>

              {/* Agency Notes */}
              <div className="mb-3">
                <label className="form-label fw-semibold text-xs mb-1 text-dark">
                  Agency Communication / Delivery Proof Notes
                </label>
                <textarea
                  className="form-control form-control-sm"
                  rows={3}
                  placeholder="e.g. Creator confirmed scheduled release date for Friday evening. Sponsor link verified in video description."
                  value={agencyForm.submission_notes}
                  onChange={(e) => setAgencyForm({ ...agencyForm, submission_notes: e.target.value })}
                />
              </div>

              <div className="d-flex align-items-center justify-content-end gap-2 pt-3 border-top">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary px-3"
                  onClick={() => setUpdatingContract(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary px-4 fw-semibold text-white d-inline-flex align-items-center gap-1.5"
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? (
                    <>
                      <div className="spinner-border spinner-border-sm" role="status" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Save Agency Status</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT INFLUENCER MODAL (Admin only) */}
      {(editingCreator || isCreatingNew) && (
        <div
          className="modal-backdrop-ui"
          style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingCreator(null);
              setIsCreatingNew(false);
            }
          }}
        >
          <div
            className="modal-dialog-ui modal-lg"
            style={{ maxWidth: '780px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-surface)', borderRadius: '14px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header-ui" style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="d-flex align-items-center gap-2">
                <ShieldCheck size={17} className="text-primary" />
                <h3 className="modal-title-ui mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>
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

            <form
              onSubmit={handleSaveCreatorSubmit}
              style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}
            >
              <div
                className="modal-body-ui"
                style={{ padding: '1.4rem', overflowY: 'auto', flex: '1 1 auto', maxHeight: 'calc(90vh - 130px)' }}
              >
                {formError && (
                  <div className="alert alert-danger py-2 px-3 mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.75rem' }}>
                    <AlertTriangle size={14} className="flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="p-3 rounded-3 bg-light-subtle border mb-4">
                  <div className="text-muted mb-2 fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                    LIVE CARD PREVIEW
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <CreatorAvatar
                      name={creatorForm.name || 'New Creator'}
                      avatarUrl={creatorForm.avatar_url}
                      size={48}
                    />
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="d-flex align-items-center gap-2 mb-0.5 flex-wrap">
                        <span className="fw-bold text-primary-emphasis" style={{ fontSize: '0.85rem' }}>
                          {creatorForm.name || 'Creator Full Name'}
                        </span>
                        {creatorForm.is_verified && (
                          <CheckCircle2 size={14} className="text-primary" title="Verified Creator" />
                        )}
                        <span className="badge bg-primary-subtle text-primary" style={{ fontSize: '0.65rem' }}>
                          {creatorForm.platform}
                        </span>
                      </div>
                      <div className="text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                        {creatorForm.handle || '@handle'} • {creatorForm.niche} • {creatorForm.tier}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h6 className="fw-bold text-primary-emphasis text-uppercase mb-2.5" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
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

                <div className="mb-4">
                  <h6 className="fw-bold text-primary-emphasis text-uppercase mb-2.5" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
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

                <div className="mb-4">
                  <h6 className="fw-bold text-primary-emphasis text-uppercase mb-2.5" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                    3. Sponsorship Rate Card &amp; Deliverables
                  </h6>

                  <div className="ui-form-fieldset mb-3">
                    <div className="ui-form-fieldset-title">
                      <span>Package 1 (Primary Deliverable)</span>
                      <span className="badge bg-primary-subtle text-primary" style={{ fontSize: '0.65rem' }}>Primary</span>
                    </div>
                    <div className="row g-3">
                      <div className="col-12 col-md-8">
                        <div className="form-group-ui mb-0">
                          <label className="form-label-ui">
                            <span>Package Title <span className="form-required">*</span></span>
                          </label>
                          <input
                            type="text"
                            className="form-input-ui"
                            placeholder="e.g. Dedicated YouTube Video Review"
                            value={creatorForm.pkg1_title}
                            onChange={(e) => setCreatorForm({ ...creatorForm, pkg1_title: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-12 col-md-4">
                        <div className="form-group-ui mb-0">
                          <label className="form-label-ui">
                            <span>Rate (PKR) <span className="form-required">*</span></span>
                          </label>
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
                      <div className="col-12">
                        <div className="form-group-ui mb-0">
                          <label className="form-label-ui">
                            <span>Deliverables &amp; Scope Description</span>
                          </label>
                          <input
                            type="text"
                            className="form-input-ui"
                            placeholder="e.g. Full 10-min review + permanent description sponsor link"
                            value={creatorForm.pkg1_deliverables}
                            onChange={(e) => setCreatorForm({ ...creatorForm, pkg1_deliverables: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ui-form-fieldset mb-0">
                    <div className="ui-form-fieldset-title">
                      <span>Package 2 (Secondary / Add-on)</span>
                      <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.65rem' }}>Add-on</span>
                    </div>
                    <div className="row g-3">
                      <div className="col-12 col-md-8">
                        <div className="form-group-ui mb-0">
                          <label className="form-label-ui">
                            <span>Package Title</span>
                          </label>
                          <input
                            type="text"
                            className="form-input-ui"
                            placeholder="e.g. 60s Mid-Roll Integration"
                            value={creatorForm.pkg2_title}
                            onChange={(e) => setCreatorForm({ ...creatorForm, pkg2_title: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="col-12 col-md-4">
                        <div className="form-group-ui mb-0">
                          <label className="form-label-ui">
                            <span>Rate (PKR)</span>
                          </label>
                          <input
                            type="number"
                            className="form-input-ui"
                            placeholder="Price in PKR"
                            value={creatorForm.pkg2_price}
                            onChange={(e) => setCreatorForm({ ...creatorForm, pkg2_price: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="form-group-ui mb-0">
                          <label className="form-label-ui">
                            <span>Deliverables &amp; Scope Description</span>
                          </label>
                          <input
                            type="text"
                            className="form-input-ui"
                            placeholder="e.g. 60s in-video organic sponsor segment"
                            value={creatorForm.pkg2_deliverables}
                            onChange={(e) => setCreatorForm({ ...creatorForm, pkg2_deliverables: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-4 p-3 rounded-2 bg-light-subtle border flex-wrap">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="verifiedSwitch"
                      checked={creatorForm.is_verified}
                      onChange={(e) => setCreatorForm({ ...creatorForm, is_verified: e.target.checked })}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="verifiedSwitch" style={{ fontSize: '0.75rem' }}>
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
                    <label className="form-check-label fw-semibold" htmlFor="availSwitch" style={{ fontSize: '0.75rem' }}>
                      Available for Commissioning
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer-ui" style={{ padding: '0.9rem 1.4rem', borderTop: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: 'var(--color-bg-subtle)' }}>
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

      {/* DELETE CREATOR CONFIRMATION MODAL */}
      {deletingCreator && (
        <div
          className="modal-backdrop-ui"
          style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && setDeletingCreator(null)}
        >
          <div
            className="modal-dialog-ui modal-sm"
            style={{ maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-surface)', borderRadius: '14px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header-ui" style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="d-flex align-items-center gap-2">
                <AlertTriangle size={17} className="text-danger" />
                <h3 className="modal-title-ui text-danger mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>Remove Creator</h3>
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

            <div className="modal-body-ui" style={{ padding: '1.4rem' }}>
              <p className="text-muted mb-3" style={{ fontSize: '0.78rem', lineHeight: '1.5' }}>
                Are you sure you want to remove <strong className="text-primary-emphasis">{deletingCreator.name}</strong> ({deletingCreator.handle}) from the active influencer marketplace?
              </p>
              <div className="p-2.5 rounded-2 bg-light-subtle border d-flex align-items-center gap-2.5">
                <CreatorAvatar name={deletingCreator.name} avatarUrl={deletingCreator.avatar_url} size={36} />
                <div>
                  <div className="fw-bold text-primary-emphasis" style={{ fontSize: '0.8rem' }}>{deletingCreator.name}</div>
                  <div className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>{deletingCreator.platform} • {deletingCreator.niche}</div>
                </div>
              </div>
            </div>

            <div className="modal-footer-ui" style={{ padding: '0.9rem 1.4rem', borderTop: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: 'var(--color-bg-subtle)' }}>
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
