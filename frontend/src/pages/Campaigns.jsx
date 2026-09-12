import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { campaignsApi } from '../features/campaigns/campaignsApi';
import { extractErrorMessage } from '../utils/errorHandler';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';
import {
  Megaphone,
  Plus,
  Search,
  CalendarDays,
  DollarSign,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Filter,
  RefreshCw,
  Clock,
  Edit,
  Layers,
  UploadCloud,
  ChevronRight,
  Sparkles,
  Video,
  Share2,
  TrendingUp,
  Target,
  CheckSquare,
  Square,
  BarChart3,
  Eye,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Award,
  X,
  AlertTriangle,
  Info,
  Lock,
  UserCheck,
  Globe,
  PieChart,
  FileText
} from 'lucide-react';
import { digitalServicesApi } from '../features/digitalServices/digitalServicesApi';
import { influencersApi } from '../features/influencers/influencersApi';

const PIPELINE_STAGES = [
  { id: 'BRIEFING', label: '1. Briefing & Strategy', icon: Target, desc: 'Objective & audience targeting locked' },
  { id: 'PRODUCTION', label: '2. Content & Production', icon: Video, desc: 'Scriptwriting, video editing & graphics' },
  { id: 'REVIEW', label: '3. Client Creative Review', icon: Award, desc: 'Draft videos/banners submitted for approval' },
  { id: 'LIVE', label: '4. Live Ads & Broadcast', icon: Zap, desc: 'Ads actively broadcasting across network' },
  { id: 'COMPLETED', label: '5. Reporting & Concluded', icon: BarChart3, desc: 'Final impressions & ROI analytics report' },
];

const CHANNELS = [
  'All Channels',
  'YouTube Video Ads',
  'Meta (Facebook & Instagram)',
  'Influencer Sponsorships',
  'Programmatic Display Network',
  'DOOH LED Digital Billboard',
  'Connected TV (CTV / OTT)'
];

export const Campaigns = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'Advertiser';
  const isAgencyStaff =
    userRole === 'Administrator' ||
    userRole === 'Sales Executive' ||
    userRole === 'Space Manager' ||
    userRole === 'Creative Reviewer';
  const isAdvertiser = userRole === 'Advertiser';
  const isAdmin = userRole === 'Administrator';

  const [campaigns, setCampaigns] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [campaignHiredCreators, setCampaignHiredCreators] = useState([]);
  const [savingTask, setSavingTask] = useState(null);

  const showToast = (message, type = 'success', title = '') => {
    setToast({ type, message, title });
    setTimeout(() => setToast(null), 4500);
  };

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('All Channels');
  const [stageFilter, setStageFilter] = useState('');
  const [page, setPage] = useState(1);

  // Drawer state for campaign inspection & pipeline progression (Track button)
  const [inspectingCampaign, setInspectingCampaign] = useState(null);
  // Separate Modal state for detailed financial investment breakdown (Breakdown button)
  const [breakdownCampaign, setBreakdownCampaign] = useState(null);
  const [campaignDigitalServices, setCampaignDigitalServices] = useState([]);
  const [updatingPipeline, setUpdatingPipeline] = useState(false);

  // Create Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    marketing_channel: 'YouTube Video Ads',
    target_audience: 'Tech Enthusiasts & Youth, 18-35',
    primary_goal: 'Brand Awareness & Video Views',
    start_date: '',
    end_date: '',
    budget: '1500000',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 10 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const data = await campaignsApi.getCampaigns(params);
      let list = data.campaigns || [];

      // Filter by channel if selected
      if (channelFilter !== 'All Channels') {
        list = list.filter((c) => (c.marketing_channel || '').toLowerCase().includes(channelFilter.toLowerCase().split(' ')[0]));
      }

      // Filter by stage if selected
      if (stageFilter) {
        list = list.filter((c) => (c.pipeline_stage || 'BRIEFING') === stageFilter);
      }

      setCampaigns(list);
      setPagination(data.pagination || { page: 1, pages: 1, total: list.length });

      // Keep inspected campaign in sync
      if (inspectingCampaign) {
        const updated = list.find((c) => c.id === inspectingCampaign.id);
        if (updated) setInspectingCampaign(updated);
      }
    } catch (err) {
      showToast(extractErrorMessage(err, 'Failed to load campaigns.'), 'danger', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [page, statusFilter, channelFilter, stageFilter]);

  const activeCampaignForServices = inspectingCampaign || breakdownCampaign;
  useEffect(() => {
    if (activeCampaignForServices?.id) {
      digitalServicesApi.getBookedServices(activeCampaignForServices.id).then((res) => {
        setCampaignDigitalServices(res.services || []);
      });
      influencersApi.getHiredCreators(activeCampaignForServices.id).then((res) => {
        const serverHired = activeCampaignForServices.hired_creators || activeCampaignForServices.performance_metrics?.hired_creators || [];
        const localHired = res.hired || [];
        const combined = [...localHired];
        serverHired.forEach((sh) => {
          if (!combined.some((ch) => ch.id === sh.id || (ch.influencer_id === sh.influencer_id && ch.package_title === sh.package_title))) {
            combined.push(sh);
          }
        });
        setCampaignHiredCreators(combined);
      });
    } else {
      setCampaignDigitalServices([]);
      setCampaignHiredCreators([]);
    }
  }, [activeCampaignForServices?.id]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCampaigns();
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.name.trim()) {
      setModalError('Please enter a valid campaign name.');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      setModalError('Both start date and end date are required.');
      return;
    }

    if (formData.end_date < formData.start_date) {
      setModalError('Campaign end date cannot be earlier than start date.');
      return;
    }

    setSubmitting(true);
    try {
      await campaignsApi.createCampaign({
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        pipeline_stage: 'BRIEFING',
      });
      showToast(`Campaign '${formData.name}' created in Briefing stage!`, 'success', 'Campaign Launched');
      setShowModal(false);
      setFormData({
        name: '',
        description: '',
        marketing_channel: 'YouTube Video Ads',
        target_audience: 'Tech Enthusiasts & Youth, 18-35',
        primary_goal: 'Brand Awareness & Video Views',
        start_date: '',
        end_date: '',
        budget: '1500000',
      });
      fetchCampaigns();
    } catch (err) {
      setModalError(extractErrorMessage(err, 'Failed to create campaign.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await campaignsApi.updateStatus(id, newStatus);
      showToast(`Campaign flight status changed to ${newStatus}`, 'info', 'Status Updated');
      fetchCampaigns();
    } catch (err) {
      showToast(extractErrorMessage(err, 'Failed to update status.'), 'danger', 'Update Failed');
    }
  };

  const handlePipelineStageChange = async (campaignId, newStage) => {
    if (!isAgencyStaff && !isAdmin) {
      showToast('Only Agency Staff & Administrators can advance production pipeline stages.', 'info', 'Role Permission');
      return;
    }

    setUpdatingPipeline(true);
    try {
      await campaignsApi.updateCampaign(campaignId, { pipeline_stage: newStage });
      showToast(`Campaign advanced to '${newStage}' stage.`, 'success', 'Pipeline Progressed');
      fetchCampaigns();
    } catch (err) {
      showToast(extractErrorMessage(err, 'Failed to update pipeline stage.'), 'danger', 'Pipeline Error');
    } finally {
      setUpdatingPipeline(false);
    }
  };

  // --- Role-Based Checklist Toggle Logic ---
  const handleToggleChecklistTask = async (campaign, taskIndex) => {
    const task = (campaign.deliverables_checklist || [])[taskIndex];
    if (!task) return;

    const isClientReviewTask = task.id === 't3' || (task.task || '').toLowerCase().includes('client') || (task.task || '').toLowerCase().includes('review');

    if (isClientReviewTask) {
      if (!isAdvertiser && !isAdmin && !isAgencyStaff) {
        showToast('Only the client (Advertiser) can formally approve creative deliverables.', 'info', 'Client Approval Required');
        return;
      }
    } else {
      if (isAdvertiser && !isAdmin) {
        showToast(`This deliverable is handled by the Agency Media & Creative Team. You will be notified once complete.`, 'info', 'Agency Task');
        return;
      }
    }

    const updatedTasks = [...(campaign.deliverables_checklist || [])];
    updatedTasks[taskIndex].completed = !updatedTasks[taskIndex].completed;

    try {
      await campaignsApi.updateCampaign(campaign.id, { deliverables_checklist: updatedTasks });
      showToast(
        updatedTasks[taskIndex].completed ? `Marked '${task.task}' as completed.` : `Reopened '${task.task}'.`,
        'success',
        'Checklist Updated'
      );
      fetchCampaigns();
    } catch (err) {
      showToast('Failed to save checklist milestone.', 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await campaignsApi.deleteCampaign(id);
      showToast('Campaign deleted successfully.', 'info', 'Campaign Removed');
      if (inspectingCampaign?.id === id) setInspectingCampaign(null);
      fetchCampaigns();
    } catch (err) {
      showToast(extractErrorMessage(err, 'Failed to delete campaign.'), 'danger', 'Delete Failed');
    }
  };

  const getChannelBadge = (channel = '') => {
    if (channel.includes('YouTube')) {
      return (
        <span className="badge d-inline-flex align-items-center gap-1 px-2 py-0.5 text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
          <Video size={11} className="text-danger flex-shrink-0" />
          <span>YouTube Ads</span>
        </span>
      );
    }
    if (channel.includes('Meta') || channel.includes('Instagram')) {
      return (
        <span className="badge d-inline-flex align-items-center gap-1 px-2 py-0.5 text-xs" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.2)' }}>
          <Share2 size={11} className="flex-shrink-0" />
          <span>Meta &amp; Reels</span>
        </span>
      );
    }
    if (channel.includes('Influencer')) {
      return (
        <span className="badge d-inline-flex align-items-center gap-1 px-2 py-0.5 text-xs" style={{ background: 'rgba(217,70,239,0.1)', color: '#c026d3', border: '1px solid rgba(217,70,239,0.2)' }}>
          <Sparkles size={11} className="flex-shrink-0" />
          <span>Influencer Collab</span>
        </span>
      );
    }
    return (
      <span className="badge d-inline-flex align-items-center gap-1 px-2 py-0.5 text-xs bg-light-subtle text-dark-emphasis border">
        <Layers size={11} className="flex-shrink-0" />
        <span>Omnichannel &amp; OOH</span>
      </span>
    );
  };

  const getStageBadge = (stage = 'BRIEFING') => {
    switch (stage) {
      case 'BRIEFING':
        return <span className="badge bg-secondary-subtle text-secondary px-2 py-1 text-xs">1. Briefing &amp; Strategy</span>;
      case 'PRODUCTION':
        return <span className="badge bg-warning-subtle text-warning-emphasis px-2 py-1 text-xs">2. Content Production</span>;
      case 'REVIEW':
        return <span className="badge bg-info-subtle text-info px-2 py-1 text-xs">3. Client Review</span>;
      case 'LIVE':
        return <span className="badge bg-success-subtle text-success px-2 py-1 text-xs d-inline-flex align-items-center gap-1"><Zap size={10} /> 4. Live Broadcasting</span>;
      case 'COMPLETED':
        return <span className="badge bg-primary-subtle text-primary px-2 py-1 text-xs">5. Concluded</span>;
      default:
        return <span className="badge bg-light text-dark px-2 py-1 text-xs">{stage}</span>;
    }
  };

  return (
    <div className="page-container">
      {/* Toast Notification Container */}
      {toast && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999, maxWidth: '380px' }}>
          <div
            className="d-flex align-items-start gap-2.5 p-3 rounded-3 shadow-lg border text-xs"
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
            <button type="button" className="btn-ui-icon p-1 text-muted" onClick={() => setToast(null)}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Page Header Banner */}
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4 p-4 rounded-3 border" style={{ backgroundColor: 'var(--color-bg-surface)', boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ maxWidth: '750px' }}>
          <h1 className="h4 fw-bold text-primary-emphasis mb-1">
            Advertising &amp; Video Campaign Pipeline
          </h1>
          <p className="text-muted text-xs mb-0" style={{ lineHeight: '1.5' }}>
            Track client advertising workflows from initial strategy brief &amp; video scripting to client creative review, live publishing, and real-time ROI attribution reporting.
          </p>
        </div>

        <div className="d-flex align-items-center gap-3 flex-wrap flex-shrink-0">
          <button
            type="button"
            onClick={fetchCampaigns}
            className="btn-ui btn-ui-secondary btn-ui-sm d-flex align-items-center gap-1.5 px-3 py-2"
            title="Refresh list"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn-ui btn-ui-primary btn-ui-sm d-flex align-items-center gap-1.5 px-3.5 py-2"
            onClick={() => setShowModal(true)}
          >
            <Plus size={15} />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="toolbar-ui p-3 rounded-3 border mb-4" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
        <form onSubmit={handleSearchSubmit} className="toolbar-search">
          <Search size={15} className="toolbar-search-icon" />
          <input
            type="text"
            className="form-input-ui"
            style={{ paddingLeft: '2.2rem', height: '38px' }}
            placeholder="Search campaigns by name, client, or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* Channel Selector */}
          <select
            className="form-select-ui"
            style={{ width: 'auto', height: '38px', fontSize: '0.78rem' }}
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
          >
            {CHANNELS.map((ch) => (
              <option key={ch} value={ch}>{ch}</option>
            ))}
          </select>

          {/* Pipeline Stage Selector */}
          <select
            className="form-select-ui"
            style={{ width: 'auto', height: '38px', fontSize: '0.78rem' }}
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option value="">All Production Stages</option>
            {PIPELINE_STAGES.map((st) => (
              <option key={st.id} value={st.id}>{st.label}</option>
            ))}
          </select>

          {/* Flight Status Selector */}
          <select
            className="form-select-ui"
            style={{ width: 'auto', height: '38px', fontSize: '0.78rem' }}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Flight Statuses</option>
            <option value="ACTIVE">Active (Live)</option>
            <option value="DRAFT">Draft</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Data Table Card with Properly Aligned Headers */}
      <div className="card-enterprise p-0 overflow-hidden border rounded-3" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary spinner-border-sm" role="status" />
            <p className="text-muted small mt-2">Loading marketing campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No campaigns match your filters"
            description="Launch a new client campaign to initiate strategy and creative production."
            actionLabel="Create Campaign"
            onAction={() => setShowModal(true)}
          />
        ) : (
          <>
            <div className="table-responsive">
              <table className="enterprise-table table mb-0 align-middle">
                <thead style={{ backgroundColor: 'var(--color-bg-subtle)' }}>
                  <tr>
                    <th style={{ width: '11%' }}>Reference</th>
                    <th style={{ width: '14%' }}>Client / Brand</th>
                    <th style={{ width: '20%' }}>Campaign &amp; Channel</th>
                    <th style={{ width: '13%' }}>Flight Range</th>
                    <th style={{ width: '11%' }}>Budget</th>
                    <th style={{ width: '12%' }}>Production Stage</th>
                    <th style={{ width: '7%' }}>Status</th>
                    <th style={{ width: '12%' }} className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr
                      key={c.id}
                      style={{ cursor: 'pointer' }}
                      className="hover-bg-subtle"
                      onClick={() => setInspectingCampaign(c)}
                    >
                      {/* 1. Reference */}
                      <td>
                        <span className="font-monospace text-xs text-primary fw-bold">
                          {c.campaign_reference || `CMP-2026-${String(c.id).padStart(4, '0')}`}
                        </span>
                      </td>

                      {/* 2. Client / Brand */}
                      <td>
                        <div className="fw-semibold text-xs text-primary-emphasis">
                          {c.advertiser_name || c.advertiser?.name || 'Jazz Digital Marketing'}
                        </div>
                        <span className="text-muted text-xs" style={{ fontSize: '0.7rem' }}>
                          Verified Client
                        </span>
                      </td>

                      {/* 3. Campaign Name & Channel */}
                      <td>
                        <div className="fw-bold text-xs text-primary-emphasis text-truncate mb-1" style={{ maxWidth: '240px' }} title={c.name}>
                          {c.name}
                        </div>
                        <div className="d-flex align-items-center gap-1.5 flex-wrap">
                          {getChannelBadge(c.marketing_channel)}
                        </div>
                      </td>

                      {/* 4. Dates */}
                      <td>
                        <div className="d-flex align-items-center gap-1 text-xs text-secondary font-monospace" style={{ fontSize: '0.74rem' }}>
                          <CalendarDays size={12} className="text-muted flex-shrink-0" />
                          <span>{c.start_date || 'TBD'}</span>
                          <span className="text-muted">&rarr;</span>
                          <span>{c.end_date || 'TBD'}</span>
                        </div>
                      </td>

                      {/* 5. Budget */}
                      <td>
                        <span className="font-monospace text-xs text-primary-emphasis fw-bold">
                          {c.budget && parseFloat(c.budget) > 0 ? `Rs. ${parseFloat(c.budget).toLocaleString()}` : 'Rs. 1,500,000'}
                        </span>
                      </td>

                      {/* 6. Production Stage */}
                      <td>
                        {getStageBadge(c.pipeline_stage || 'BRIEFING')}
                      </td>

                      {/* 7. Status */}
                      <td>
                        <StatusBadge
                          status={
                            c.status === 'ACTIVE'
                              ? 'active'
                              : c.status === 'PAUSED'
                              ? 'pending'
                              : c.status === 'COMPLETED'
                              ? 'confirmed'
                              : c.status === 'CANCELLED'
                              ? 'rejected'
                              : 'draft'
                          }
                          label={c.status}
                          size="sm"
                        />
                      </td>

                      {/* 8. Quick Actions */}
                      <td className="text-end" onClick={(e) => e.stopPropagation()}>
                        <div className="d-inline-flex align-items-center justify-content-end gap-2 flex-nowrap">
                          <button
                            type="button"
                            className="btn-ui btn-ui-secondary btn-ui-sm d-inline-flex align-items-center gap-1.5 text-nowrap"
                            style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectingCampaign(null);
                              setBreakdownCampaign(c);
                            }}
                            title="View Consolidated Financial Breakdown & Chart"
                          >
                            <PieChart size={13} />
                            <span>Breakdown</span>
                          </button>
                          <button
                            type="button"
                            className="btn-ui btn-ui-primary btn-ui-sm d-inline-flex align-items-center gap-1.5 text-nowrap"
                            style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setBreakdownCampaign(null);
                              setInspectingCampaign(c);
                            }}
                            title="Open Pipeline & Progress Tracker"
                          >
                            <Eye size={13} />
                            <span>Track</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-top">
              <Pagination
                currentPage={page}
                totalPages={pagination.pages || 1}
                totalRecords={pagination.total || campaigns.length}
                pageSize={10}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </>
        )}
      </div>

      {/* =========================================================================
          CAMPAIGN PIPELINE & PROGRESS INSPECTION DRAWER (UNIFORM WIDTHS & FIXED PADDING)
          ========================================================================= */}
      {inspectingCampaign && (
        <Drawer
          isOpen={Boolean(inspectingCampaign)}
          onClose={() => setInspectingCampaign(null)}
          title={`Campaign Pipeline: ${inspectingCampaign.name}`}
          subtitle={`Ref: ${inspectingCampaign.campaign_reference || `CMP-2026-${String(inspectingCampaign.id).padStart(4, '0')}`} • Client: ${inspectingCampaign.advertiser_name || 'Direct Client'}`}
          size="lg"
        >
          <div className="d-flex flex-column gap-4 w-100" style={{ boxSizing: 'border-box' }}>
            
            {/* 1. Interactive 5-Stage Stepper (100% Equal Width Rectangles) */}
            <div className="p-3.5 rounded-3 bg-light-subtle border w-100" style={{ boxSizing: 'border-box' }}>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <span className="fw-bold text-xs text-primary-emphasis text-uppercase" style={{ letterSpacing: '0.5px' }}>
                  Digital Campaign Production Pipeline
                </span>
                <span className="badge bg-primary text-white text-xs px-2.5 py-1 flex-shrink-0">
                  Active Stage: {inspectingCampaign.pipeline_stage || 'BRIEFING'}
                </span>
              </div>

              {/* Stacked Stepper Items with Exact w-100 and Clean Padding */}
              <div className="d-flex flex-column gap-2.5 w-100" style={{ width: '100%' }}>
                {PIPELINE_STAGES.map((st, idx) => {
                  const currentIdx = PIPELINE_STAGES.findIndex((s) => s.id === (inspectingCampaign.pipeline_stage || 'BRIEFING'));
                  const isCompleted = idx < currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div
                      key={st.id}
                      className={`d-flex align-items-center justify-content-between p-3 rounded-2 border w-100 transition-all gap-3 ${
                        isCurrent
                          ? 'bg-primary-subtle border-primary text-primary shadow-xs'
                          : isCompleted
                          ? 'bg-success-subtle border-success-subtle text-success'
                          : 'text-secondary opacity-80'
                      }`}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        backgroundColor: !isCurrent && !isCompleted ? 'var(--color-bg-surface)' : undefined,
                        borderColor: 'var(--color-border)',
                        cursor: isAgencyStaff ? 'pointer' : 'default'
                      }}
                      onClick={() => isAgencyStaff && handlePipelineStageChange(inspectingCampaign.id, st.id)}
                      title={isAgencyStaff ? `Click to advance workflow to ${st.label}` : 'Requires Agency Staff permission to advance workflow'}
                    >
                      <div className="d-flex align-items-center gap-3" style={{ minWidth: 0, flex: '1 1 auto' }}>
                        <div
                          className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${
                            isCompleted ? 'bg-success text-white' : isCurrent ? 'bg-primary text-white' : 'bg-secondary text-white'
                          }`}
                          style={{ width: '28px', height: '28px', fontSize: '0.78rem', fontWeight: 'bold' }}
                        >
                          {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="fw-bold text-xs text-truncate">{st.label}</div>
                          <div className="text-xs opacity-85 text-truncate" style={{ fontSize: '0.72rem' }}>{st.desc}</div>
                        </div>
                      </div>

                      {isCurrent && (
                        <span className="badge bg-primary text-white text-xs px-2.5 py-1 flex-shrink-0" style={{ whiteSpace: 'nowrap' }}>
                          In Progress
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Strategy & Targeting Overview (Generous Internal Padding & Clean Borders) */}
            <div
              className="rounded-3 border bg-light-subtle w-100 p-4"
              style={{
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {/* Header Title with bottom border separation */}
              <div className="pb-2.5 mb-3 border-bottom d-flex align-items-center justify-content-between">
                <span className="fw-bold text-xs text-primary-emphasis text-uppercase" style={{ letterSpacing: '0.5px' }}>
                  Digital Marketing Strategy &amp; Audience Brief
                </span>
                <span className="badge bg-secondary-subtle text-secondary text-xs">Strategy Locked</span>
              </div>

              {/* 2 Columns for Channel & Goal with comfortable padding */}
              <div className="d-flex flex-column gap-3 text-xs">
                <div className="d-flex flex-column flex-sm-row justify-content-between gap-3">
                  <div style={{ flex: '1 1 50%', minWidth: 0 }}>
                    <div className="text-muted mb-1 font-semibold text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                      Marketing Channel
                    </div>
                    <div className="fw-bold text-primary-emphasis fs-6">
                      {inspectingCampaign.marketing_channel || 'YouTube Video Ads & Meta Reels'}
                    </div>
                  </div>

                  <div style={{ flex: '1 1 50%', minWidth: 0 }}>
                    <div className="text-muted mb-1 font-semibold text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                      Primary Campaign Goal
                    </div>
                    <div className="fw-bold text-primary-emphasis fs-6">
                      {inspectingCampaign.primary_goal || 'Brand Awareness & Video Views'}
                    </div>
                  </div>
                </div>

                {/* Target Audience with top border separation and generous padding */}
                <div className="pt-3 border-top">
                  <div className="text-muted mb-1 font-semibold text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                    Target Audience Profile &amp; Demographics
                  </div>
                  <div className="fw-bold text-primary-emphasis" style={{ lineHeight: '1.5' }}>
                    {inspectingCampaign.target_audience || 'Tech Enthusiasts & Youth (18-35), Urban Metro Cities'}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Milestone & Deliverables Checklist (100% Equal Width Rectangles) */}
            <div className="w-100" style={{ width: '100%', boxSizing: 'border-box' }}>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                <h6 className="fw-bold text-xs text-primary-emphasis text-uppercase mb-0" style={{ letterSpacing: '0.5px' }}>
                  Milestone &amp; Deliverables Checklist
                </h6>
                <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle text-xs flex-shrink-0 px-2.5 py-1">
                  {(inspectingCampaign.deliverables_checklist || []).filter((t) => t.completed).length} / {(inspectingCampaign.deliverables_checklist || []).length} Completed
                </span>
              </div>

              {/* Informative Role Banner */}
              <div className="p-2.5 rounded-2 bg-light-subtle border text-xs text-muted mb-3 d-flex align-items-center gap-2 w-100" style={{ fontSize: '0.73rem', boxSizing: 'border-box' }}>
                <Info size={14} className="text-primary flex-shrink-0" />
                <span>
                  {isAdvertiser
                    ? 'As the Client, you are responsible for reviewing and approving Creative Deliverables.'
                    : 'Agency Staff manages strategy, scripting, live ad deployment, and analytics audits.'}
                </span>
              </div>

              {/* Checklist items with 100% width and identical box dimensions */}
              <div className="d-flex flex-column gap-2.5 w-100" style={{ width: '100%' }}>
                {(inspectingCampaign.deliverables_checklist || []).map((task, idx) => {
                  const isClientTask = task.id === 't3' || (task.task || '').toLowerCase().includes('client') || (task.task || '').toLowerCase().includes('review');
                  const canToggle = isAdmin || (isClientTask ? isAdvertiser || isAgencyStaff : isAgencyStaff);

                  return (
                    <div
                      key={task.id || idx}
                      className={`d-flex align-items-center justify-content-between p-3 rounded-2 border text-xs gap-3 w-100 transition-all ${
                        canToggle ? 'hover-bg-subtle' : 'opacity-85'
                      }`}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        backgroundColor: 'var(--color-bg-surface)',
                        cursor: canToggle ? 'pointer' : 'not-allowed'
                      }}
                      onClick={() => handleToggleChecklistTask(inspectingCampaign, idx)}
                      title={
                        canToggle
                          ? `Click to toggle '${task.task}'`
                          : isClientTask
                          ? 'Only the client (Advertiser) can approve this deliverable'
                          : 'Handled by Agency Media Operations team'
                      }
                    >
                      <div className="d-flex align-items-center gap-2.5" style={{ minWidth: 0, flex: '1 1 auto' }}>
                        {task.completed ? (
                          <CheckSquare size={17} className="text-success flex-shrink-0" />
                        ) : (
                          <Square size={17} className="text-muted flex-shrink-0" />
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div className={`text-truncate ${task.completed ? 'text-decoration-line-through text-muted' : 'text-primary-emphasis fw-medium'}`}>
                            {task.task}
                          </div>
                          <div className="text-muted text-xs d-flex align-items-center gap-1 mt-0.5" style={{ fontSize: '0.68rem' }}>
                            {isClientTask ? (
                              <span className="badge bg-primary-subtle text-primary py-0 px-1.5">Client Action</span>
                            ) : (
                              <span className="badge bg-secondary-subtle text-secondary py-0 px-1.5">Agency Action</span>
                            )}
                            {!canToggle && <Lock size={10} className="text-muted" />}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`badge flex-shrink-0 px-2.5 py-1 ${
                          task.completed ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary-subtle text-secondary border border-secondary-subtle'
                        }`}
                        style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}
                      >
                        {task.completed ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Financial Budget Allocation & Spend Breakdown */}
            {(() => {
              const totalBudget = parseFloat(inspectingCampaign.budget) || 1500000;
              
              // Dynamic spend from actual booked digital services
              const digitalSpend = campaignDigitalServices.reduce((sum, s) => sum + (parseFloat(s.agreed_price) || 0), 0);
              const physicalSpend = inspectingCampaign.media_spend ? parseFloat(inspectingCampaign.media_spend) : 0;
              const influencerSpend = campaignHiredCreators.reduce((sum, c) => sum + (parseFloat(c.agreed_fee) || 0), 0) || (inspectingCampaign.influencer_spend ? parseFloat(inspectingCampaign.influencer_spend) : 0);

              const totalCommitted = digitalSpend + physicalSpend + influencerSpend;
              const remainingBudget = Math.max(0, totalBudget - totalCommitted);

              const digitalPct = totalBudget > 0 ? Math.round((digitalSpend / totalBudget) * 100) : 0;
              const physicalPct = totalBudget > 0 ? Math.round((physicalSpend / totalBudget) * 100) : 0;
              const influencerPct = totalBudget > 0 ? Math.round((influencerSpend / totalBudget) * 100) : 0;
              const committedPct = totalBudget > 0 ? Math.round((totalCommitted / totalBudget) * 100) : 0;
              const remainingPct = Math.max(0, 100 - committedPct);

              return (
                <div
                  className="rounded-3 border bg-light-subtle w-100 p-4"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  <div className="pb-2.5 mb-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                      <span className="fw-bold text-xs text-primary-emphasis text-uppercase" style={{ letterSpacing: '0.5px' }}>
                        Campaign Budget &amp; Spend Allocation
                      </span>
                      <div className="text-muted text-xs mt-0.5" style={{ fontSize: '0.72rem' }}>
                        Financial ceiling vs. committed channels &amp; creator fees
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="btn-ui btn-ui-secondary btn-ui-sm d-inline-flex align-items-center gap-1.5"
                        onClick={() => {
                          const target = inspectingCampaign;
                          setInspectingCampaign(null);
                          setBreakdownCampaign(target);
                        }}
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                        title="View Detailed Asset & Investment Ledger"
                      >
                        <BarChart3 size={12} className="text-primary flex-shrink-0" />
                        <span>Investment Breakdown</span>
                      </button>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle text-xs px-2.5 py-1">
                        Total: Rs. {totalBudget.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Visual Spend Breakdown Progress Bar */}
                  <div className="mb-3.5">
                    <div className="d-flex justify-content-between text-xs text-muted mb-1.5" style={{ fontSize: '0.72rem' }}>
                      <span>Budget Utilization ({Math.min(100, Math.round((totalCommitted / totalBudget) * 100))}% Committed)</span>
                      <span className="fw-semibold text-success">Rs. {remainingBudget.toLocaleString()} Available</span>
                    </div>
                    <div
                      className="progress rounded-pill overflow-hidden border"
                      style={{ height: '10px', backgroundColor: 'var(--color-bg-subtle)', borderColor: 'var(--color-border)' }}
                    >
                      {digitalPct > 0 && (
                        <div
                          className="progress-bar bg-primary"
                          style={{ width: `${digitalPct}%` }}
                          title={`Digital Ads: ${digitalPct}% (Rs. ${digitalSpend.toLocaleString()})`}
                        />
                      )}
                      {physicalPct > 0 && (
                        <div
                          className="progress-bar bg-info"
                          style={{ width: `${physicalPct}%` }}
                          title={`Physical DOOH: ${physicalPct}% (Rs. ${physicalSpend.toLocaleString()})`}
                        />
                      )}
                      {influencerPct > 0 && (
                        <div
                          className="progress-bar"
                          style={{ width: `${influencerPct}%`, backgroundColor: '#8b5cf6' }}
                          title={`Creator Sponsorships: ${influencerPct}% (Rs. ${influencerSpend.toLocaleString()})`}
                        />
                      )}
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${remainingPct}%` }}
                        title={`Available Reserve: ${remainingPct}% (Rs. ${remainingBudget.toLocaleString()})`}
                      />
                    </div>
                  </div>

                  {/* 4-Card Metric Grid: 3 Channels + Liquid Reserve */}
                  <div className="row g-2">
                    <div className="col-6 col-md-3">
                      <div className="p-2.5 rounded-2 border h-100" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
                        <div className="d-flex align-items-center gap-1.5 text-muted mb-1" style={{ fontSize: '0.68rem' }}>
                          <span className="rounded-circle d-inline-block flex-shrink-0" style={{ width: '7px', height: '7px', backgroundColor: 'var(--color-brand-600)' }} />
                          <span className="text-uppercase fw-semibold">Digital Ads</span>
                        </div>
                        <div className="fw-bold text-xs text-primary-emphasis font-monospace">
                          Rs. {digitalSpend.toLocaleString()}
                        </div>
                        <div className="text-muted text-xs mt-0.5" style={{ fontSize: '0.65rem' }}>{digitalPct}% of total</div>
                      </div>
                    </div>

                    <div className="col-6 col-md-3">
                      <div className="p-2.5 rounded-2 border h-100" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
                        <div className="d-flex align-items-center gap-1.5 text-muted mb-1" style={{ fontSize: '0.68rem' }}>
                          <span className="rounded-circle d-inline-block flex-shrink-0" style={{ width: '7px', height: '7px', backgroundColor: '#0ea5e9' }} />
                          <span className="text-uppercase fw-semibold">DOOH Screens</span>
                        </div>
                        <div className="fw-bold text-xs text-primary-emphasis font-monospace">
                          Rs. {physicalSpend.toLocaleString()}
                        </div>
                        <div className="text-muted text-xs mt-0.5" style={{ fontSize: '0.65rem' }}>{physicalPct}% of total</div>
                      </div>
                    </div>

                    <div className="col-6 col-md-3">
                      <div className="p-2.5 rounded-2 border h-100" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
                        <div className="d-flex align-items-center gap-1.5 text-muted mb-1" style={{ fontSize: '0.68rem' }}>
                          <span className="rounded-circle d-inline-block flex-shrink-0" style={{ width: '7px', height: '7px', backgroundColor: '#8b5cf6' }} />
                          <span className="text-uppercase fw-semibold">Creators</span>
                        </div>
                        <div className="fw-bold text-xs text-primary-emphasis font-monospace">
                          Rs. {influencerSpend.toLocaleString()}
                        </div>
                        <div className="text-muted text-xs mt-0.5" style={{ fontSize: '0.65rem' }}>{influencerPct}% of total</div>
                      </div>
                    </div>

                    <div className="col-6 col-md-3">
                      <div className="p-2.5 rounded-2 border h-100" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
                        <div className="d-flex align-items-center gap-1.5 text-muted mb-1" style={{ fontSize: '0.68rem' }}>
                          <span className="rounded-circle d-inline-block flex-shrink-0" style={{ width: '7px', height: '7px', backgroundColor: '#10b981' }} />
                          <span className="text-uppercase fw-semibold">Reserve</span>
                        </div>
                        <div className="fw-bold text-xs text-success font-monospace">
                          Rs. {remainingBudget.toLocaleString()}
                        </div>
                        <div className="text-success text-xs mt-0.5" style={{ fontSize: '0.65rem' }}>{remainingPct}% available</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 5. Affiliated Digital Marketing Services & Ad Packages */}
            <div className="rounded-3 border bg-light-subtle w-100 p-4" style={{ width: '100%', boxSizing: 'border-box' }}>
              <div className="pb-2.5 mb-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <span className="fw-bold text-xs text-primary-emphasis text-uppercase" style={{ letterSpacing: '0.5px' }}>
                    Affiliated Digital Marketing Services
                  </span>
                  <div className="text-muted text-xs mt-0.5" style={{ fontSize: '0.72rem' }}>
                    Active YouTube, Meta, PPC, and Programmatic packages provisioned for this campaign
                  </div>
                </div>
                <Link
                  to={`/digital-services`}
                  className="btn-ui btn-ui-secondary btn-ui-sm d-inline-flex align-items-center gap-1"
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                >
                  <Plus size={12} className="flex-shrink-0" />
                  <span>Provision Digital Service</span>
                </Link>
              </div>

              {campaignDigitalServices.length === 0 ? (
                <div className="p-3 rounded-2 border text-center" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
                  <div className="d-flex align-items-center justify-content-center gap-1.5 text-muted text-xs mb-1">
                    <Globe size={14} className="text-primary flex-shrink-0" />
                    <span className="fw-semibold">Default Channel Active: {inspectingCampaign.marketing_channel || 'YouTube Video Ads'}</span>
                  </div>
                  <p className="text-muted text-xs mb-2" style={{ fontSize: '0.74rem' }}>
                    You can add discounted YouTube, Meta Reels, or Programmatic CPM blitz packages to scale this campaign.
                  </p>
                  <Link
                    to="/digital-services"
                    className="btn-ui btn-ui-primary btn-ui-sm d-inline-flex align-items-center gap-1.5"
                    style={{ fontSize: '0.72rem', padding: '0.3rem 0.75rem' }}
                  >
                    <Globe size={12} />
                    <span>Explore Digital Marketing Catalog</span>
                  </Link>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2 w-100">
                  {campaignDigitalServices.map((ds) => (
                    <div
                      key={ds.id}
                      className="p-2.5 rounded-2 border d-flex align-items-center justify-content-between flex-wrap gap-2"
                      style={{ backgroundColor: 'var(--color-bg-surface)', boxSizing: 'border-box' }}
                    >
                      <div className="d-flex align-items-center gap-2" style={{ minWidth: 0, flex: '1 1 auto' }}>
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 bg-primary-subtle text-primary"
                          style={{ width: '28px', height: '28px' }}
                        >
                          <Globe size={14} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="fw-bold text-xs text-primary-emphasis text-truncate">
                            {ds.service_title}
                          </div>
                          <div className="text-muted text-xs d-flex align-items-center gap-1.5" style={{ fontSize: '0.68rem' }}>
                            <span className="badge bg-secondary-subtle text-secondary py-0 px-1">{ds.platform}</span>
                            <span>{ds.start_date} &rarr; {ds.end_date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-end flex-shrink-0">
                        <div className="fw-bold text-xs text-primary font-monospace">
                          Rs. {ds.agreed_price?.toLocaleString()}
                        </div>
                        <span className="badge bg-success-subtle text-success py-0 px-1" style={{ fontSize: '0.64rem' }}>
                          {ds.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Live Digital Performance Metrics Widget */}
            <div className="p-3.5 rounded-3 bg-light-subtle border w-100" style={{ width: '100%', boxSizing: 'border-box' }}>
              <h6 className="fw-bold text-xs text-primary-emphasis text-uppercase mb-2.5" style={{ letterSpacing: '0.5px' }}>
                Live Digital Advertising Performance
              </h6>
              <div className="row g-2 text-center">
                <div className="col-4">
                  <div className="p-2.5 rounded-2 border" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
                    <div className="fw-bold text-primary fs-6">
                      {(inspectingCampaign.performance_metrics?.impressions || 1450000).toLocaleString()}
                    </div>
                    <div className="text-muted text-xs text-uppercase" style={{ fontSize: '0.66rem', letterSpacing: '0.5px' }}>Impressions</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-2.5 rounded-2 border" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
                    <div className="fw-bold text-success fs-6">
                      {(inspectingCampaign.performance_metrics?.clicks || 56800).toLocaleString()}
                    </div>
                    <div className="text-muted text-xs text-uppercase" style={{ fontSize: '0.66rem', letterSpacing: '0.5px' }}>Clicks</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-2.5 rounded-2 border" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
                    <div className="fw-bold text-info fs-6">
                      {inspectingCampaign.performance_metrics?.ctr || '3.92'}%
                    </div>
                    <div className="text-muted text-xs text-uppercase" style={{ fontSize: '0.66rem', letterSpacing: '0.5px' }}>Avg CTR</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 7. Quick Navigation Links */}
            <div className="d-flex align-items-center gap-2 pt-2 border-top w-100" style={{ width: '100%', boxSizing: 'border-box' }}>
              <Link
                to={`/digital-services`}
                className="btn-ui btn-ui-secondary btn-ui-sm flex-fill d-inline-flex align-items-center justify-content-center gap-1.5 py-2"
              >
                <Globe size={13} className="flex-shrink-0" />
                <span>Digital Services</span>
              </Link>
              <Link
                to={`/creatives?campaign_id=${inspectingCampaign.id}`}
                className="btn-ui btn-ui-secondary btn-ui-sm flex-fill d-inline-flex align-items-center justify-content-center gap-1.5 py-2"
              >
                <UploadCloud size={13} className="flex-shrink-0" />
                <span>Media Creatives</span>
              </Link>
              <Link
                to={`/spaces?campaign_id=${inspectingCampaign.id}`}
                className="btn-ui btn-ui-primary btn-ui-sm flex-fill d-inline-flex align-items-center justify-content-center gap-1.5 py-2"
              >
                <Layers size={13} className="flex-shrink-0" />
                <span>Book OOH Spaces</span>
              </Link>
            </div>
          </div>
        </Drawer>
      )}

      {/* =========================================================================
          CREATE CAMPAIGN MODAL
          ========================================================================= */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Launch Client Marketing Campaign"
        subtitle="Define marketing channel, strategic goal, audience profile, and budget allocation"
        size="lg"
        footer={
          <>
            <button
              type="button"
              className="btn-ui btn-ui-secondary btn-ui-sm"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-ui btn-ui-primary btn-ui-sm"
              onClick={handleCreateSubmit}
              disabled={submitting}
            >
              {submitting ? 'Initiating Campaign...' : 'Launch Campaign'}
            </button>
          </>
        }
      >
        {modalError && (
          <div className="alert alert-danger py-2 px-3 text-xs mb-3 d-flex align-items-center gap-2">
            <AlertTriangle size={14} className="flex-shrink-0" />
            <span>{modalError}</span>
          </div>
        )}

        <form onSubmit={handleCreateSubmit}>
          <div className="row g-3">
            <div className="col-12 col-md-8">
              <div className="form-group-ui mb-0">
                <label className="form-label-ui">
                  <span>Campaign Title <span className="form-required">*</span></span>
                </label>
                <input
                  type="text"
                  className="form-input-ui"
                  placeholder="e.g. Jazz Super 4G Nationwide YouTube & Meta Blitz"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="form-group-ui mb-0">
                <label className="form-label-ui">
                  <span>Budget Allocation (PKR) <span className="form-required">*</span></span>
                </label>
                <input
                  type="number"
                  className="form-input-ui"
                  placeholder="Budget in PKR"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="form-group-ui mb-0">
                <label className="form-label-ui">
                  <span>Primary Marketing Channel <span className="form-required">*</span></span>
                </label>
                <select
                  className="form-select-ui"
                  value={formData.marketing_channel}
                  onChange={(e) => setFormData({ ...formData, marketing_channel: e.target.value })}
                >
                  <option value="YouTube Video Ads">YouTube Video Ads &amp; Pre-Roll</option>
                  <option value="Meta (Facebook & Instagram)">Meta Ads (Feed &amp; Reels)</option>
                  <option value="Influencer Sponsorships">Influencer &amp; Creator Sponsorships</option>
                  <option value="Programmatic Display Network">Programmatic Display Network</option>
                  <option value="Omnichannel Digital & OOH">Omnichannel Digital &amp; OOH</option>
                </select>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="form-group-ui mb-0">
                <label className="form-label-ui">
                  <span>Strategic Campaign Goal <span className="form-required">*</span></span>
                </label>
                <select
                  className="form-select-ui"
                  value={formData.primary_goal}
                  onChange={(e) => setFormData({ ...formData, primary_goal: e.target.value })}
                >
                  <option value="Brand Awareness & Video Views">Brand Awareness &amp; Video Views</option>
                  <option value="Lead Generation & Signups">Lead Generation &amp; Signups</option>
                  <option value="Product Launch Blitz">Product Launch Blitz</option>
                  <option value="Mobile App Installs">Mobile App Installs</option>
                  <option value="E-Commerce Sales & ROAS">E-Commerce Sales &amp; ROAS</option>
                </select>
              </div>
            </div>

            <div className="col-12">
              <div className="form-group-ui mb-0">
                <label className="form-label-ui">
                  <span>Target Audience Profile</span>
                </label>
                <input
                  type="text"
                  className="form-input-ui"
                  placeholder="e.g. Gen-Z & Young Professionals, 18-35, Urban Metro Cities"
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                />
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="form-group-ui mb-0">
                <label className="form-label-ui">
                  <span>Flight Start Date <span className="form-required">*</span></span>
                </label>
                <input
                  type="date"
                  className="form-input-ui"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="form-group-ui mb-0">
                <label className="form-label-ui">
                  <span>Flight End Date <span className="form-required">*</span></span>
                </label>
                <input
                  type="date"
                  className="form-input-ui"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="col-12">
              <div className="form-group-ui mb-0">
                <label className="form-label-ui">
                  <span>Campaign Scope &amp; Brief Notes</span>
                </label>
                <textarea
                  className="form-textarea-ui"
                  rows="3"
                  placeholder="Summary of creative requirements, key promotional offers, and branding guidelines..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          CHART-POWERED DETAILED CAMPAIGN INVESTMENT BREAKDOWN MODAL (DYNAMIC REAL-TIME SPEND)
          ========================================================================= */}
      {breakdownCampaign && (
        <Modal
          isOpen={Boolean(breakdownCampaign)}
          onClose={() => setBreakdownCampaign(null)}
          title={`Investment & Budget Allocation: ${breakdownCampaign.name}`}
          subtitle={`Ref: ${breakdownCampaign.campaign_reference || `CMP-2026-${String(breakdownCampaign.id).padStart(4, '0')}`} • Client: ${breakdownCampaign.advertiser_name || breakdownCampaign.advertiser?.name || 'Jazz Digital Marketing'}`}
          size="xl"
          footer={
            <div className="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
              <span className="text-muted text-xs">
                Consolidated Financial Ledger Reconciled across Physical, Digital &amp; Creator Channels
              </span>
              <button
                type="button"
                className="btn-ui btn-ui-secondary btn-ui-sm"
                onClick={() => setBreakdownCampaign(null)}
              >
                Close Ledger
              </button>
            </div>
          }
        >
          {(() => {
            const totalBudget = parseFloat(breakdownCampaign.budget) || 1500000;
            
            // Dynamic spend calculation from actual booked digital services
            const digitalSpend = campaignDigitalServices.reduce((sum, s) => sum + (parseFloat(s.agreed_price) || 0), 0);
            
            // Dynamic spend from hired influencers
            const influencerSpend = campaignHiredCreators.reduce((sum, c) => sum + (parseFloat(c.agreed_fee) || 0), 0) || (breakdownCampaign.influencer_spend ? parseFloat(breakdownCampaign.influencer_spend) : 0);

            // Physical DOOH spaces
            const physicalSpend = breakdownCampaign.media_spend ? parseFloat(breakdownCampaign.media_spend) : 0;

            const totalCommitted = digitalSpend + physicalSpend + influencerSpend;
            const remainingBudget = Math.max(0, totalBudget - totalCommitted);

            const digitalPct = totalBudget > 0 ? Math.round((digitalSpend / totalBudget) * 100) : 0;
            const physicalPct = totalBudget > 0 ? Math.round((physicalSpend / totalBudget) * 100) : 0;
            const influencerPct = totalBudget > 0 ? Math.round((influencerSpend / totalBudget) * 100) : 0;
            const committedPct = totalBudget > 0 ? Math.round((totalCommitted / totalBudget) * 100) : 0;
            const remainingPct = Math.max(0, 100 - committedPct);

            return (
              <div className="d-flex flex-column gap-4 w-100" style={{ width: '100%', boxSizing: 'border-box' }}>
                
                {/* 1. Top Financial Ceiling Summary Banner */}
                <div className="p-4 rounded-3 border bg-light-subtle d-flex flex-column gap-3.5 w-100" style={{ width: '100%', boxSizing: 'border-box' }}>
                  <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 w-100">
                    <div>
                      <div className="text-muted text-xs text-uppercase fw-semibold" style={{ letterSpacing: '0.5px' }}>
                        Total Campaign Budget Ceiling
                      </div>
                      <div className="fs-3 fw-bold text-primary font-monospace">
                        Rs. {totalBudget.toLocaleString()}
                      </div>
                      <div className="text-muted text-xs mt-1">
                        Active Flight Window: <span className="font-monospace text-primary-emphasis fw-medium">{breakdownCampaign.start_date || '2026-09-01'} &rarr; {breakdownCampaign.end_date || '2026-10-15'}</span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-3 flex-wrap">
                      <div className="p-3 rounded-2 border bg-surface" style={{ backgroundColor: 'var(--color-bg-surface)', minWidth: '170px' }}>
                        <div className="text-muted text-xs">Total Committed Spend</div>
                        <div className="fw-bold text-primary-emphasis font-monospace fs-6">
                          Rs. {totalCommitted.toLocaleString()}
                        </div>
                        <span className={`badge text-xs mt-1 ${committedPct > 0 ? 'bg-primary-subtle text-primary' : 'bg-secondary-subtle text-secondary'}`}>
                          {committedPct}% Allocated
                        </span>
                      </div>

                      <div className="p-3 rounded-2 border bg-surface" style={{ backgroundColor: 'var(--color-bg-surface)', minWidth: '170px' }}>
                        <div className="text-success text-xs">Unallocated Liquid Reserve</div>
                        <div className="fw-bold text-success font-monospace fs-6">
                          Rs. {remainingBudget.toLocaleString()}
                        </div>
                        <span className="badge bg-success-subtle text-success text-xs mt-1">
                          {remainingPct}% Available
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Visual Multi-Channel Allocation Chart Bar */}
                  <div className="w-100 pt-2 border-top" style={{ width: '100%' }}>
                    <div className="d-flex align-items-center justify-content-between text-xs text-muted mb-2 font-monospace" style={{ fontSize: '0.74rem' }}>
                      <span className="fw-semibold text-primary-emphasis text-uppercase" style={{ letterSpacing: '0.5px' }}>Budget Allocation Chart</span>
                      <span>{committedPct}% Committed • {remainingPct}% Liquid Reserve</span>
                    </div>
                    <div className="progress rounded-pill overflow-hidden" style={{ height: '12px', backgroundColor: 'var(--color-border)' }}>
                      {digitalPct > 0 && (
                        <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${digitalPct}%` }} title={`Digital Online Ads: Rs. ${digitalSpend.toLocaleString()} (${digitalPct}%)`} />
                      )}
                      {physicalPct > 0 && (
                        <div className="progress-bar bg-info" role="progressbar" style={{ width: `${physicalPct}%` }} title={`Physical DOOH Billboards: Rs. ${physicalSpend.toLocaleString()} (${physicalPct}%)`} />
                      )}
                      {influencerPct > 0 && (
                        <div className="progress-bar" role="progressbar" style={{ width: `${influencerPct}%`, backgroundColor: '#8b5cf6' }} title={`Creator Sponsorships: Rs. ${influencerSpend.toLocaleString()} (${influencerPct}%)`} />
                      )}
                      <div className="progress-bar bg-success" role="progressbar" style={{ width: `${remainingPct}%` }} title={`Liquid Reserve: Rs. ${remainingBudget.toLocaleString()} (${remainingPct}%)`} />
                    </div>
                    
                    {/* Legend */}
                    <div className="d-flex align-items-center gap-3 mt-2.5 flex-wrap text-xs font-monospace" style={{ fontSize: '0.72rem' }}>
                      <span className="d-inline-flex align-items-center gap-1.5"><span className="rounded-circle bg-primary" style={{ width: '9px', height: '9px' }}></span> Digital Ads ({digitalPct}%)</span>
                      <span className="d-inline-flex align-items-center gap-1.5"><span className="rounded-circle bg-info" style={{ width: '9px', height: '9px' }}></span> DOOH Screens ({physicalPct}%)</span>
                      <span className="d-inline-flex align-items-center gap-1.5"><span className="rounded-circle" style={{ width: '9px', height: '9px', backgroundColor: '#8b5cf6' }}></span> Creator Sponsorships ({influencerPct}%)</span>
                      <span className="d-inline-flex align-items-center gap-1.5"><span className="rounded-circle bg-success" style={{ width: '9px', height: '9px' }}></span> Liquid Reserve ({remainingPct}%)</span>
                    </div>
                  </div>
                </div>

                {/* 3. 3-Channel Breakdown Visual Cards */}
                <div className="row g-3 w-100 m-0" style={{ width: '100%' }}>
                  {/* Pillar 1: Digital Online Ads */}
                  <div className="col-12 col-md-4 p-0 pe-md-2 mb-2 mb-md-0">
                    <div className="p-3.5 rounded-3 border h-100 d-flex flex-column justify-content-between w-100" style={{ backgroundColor: 'var(--color-bg-surface)', boxSizing: 'border-box' }}>
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle bg-primary-subtle text-primary p-1.5 d-flex align-items-center justify-content-center">
                              <Globe size={16} />
                            </div>
                            <span className="fw-bold text-xs text-primary-emphasis text-uppercase" style={{ letterSpacing: '0.5px' }}>
                              1. Digital Online Ads
                            </span>
                          </div>
                          <span className="badge bg-primary-subtle text-primary font-monospace text-xs px-2 py-0.5">
                            {digitalPct}% Share
                          </span>
                        </div>
                        <div className="fs-5 fw-bold text-primary font-monospace mb-2">
                          Rs. {digitalSpend.toLocaleString()}
                        </div>
                        <div className="d-flex flex-column gap-1.5 text-xs text-secondary">
                          <div className="d-flex justify-content-between">
                            <span>Active Packages:</span>
                            <span className="fw-medium text-primary-emphasis">{campaignDigitalServices.length} Provisioned</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span>Status:</span>
                            <span className={digitalSpend > 0 ? "text-success fw-medium" : "text-muted"}>
                              {digitalSpend > 0 ? "Active In-Flight" : "Unallocated / Ready to Book"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pillar 2: Physical DOOH Billboards */}
                  <div className="col-12 col-md-4 p-0 px-md-1 mb-2 mb-md-0">
                    <div className="p-3.5 rounded-3 border h-100 d-flex flex-column justify-content-between w-100" style={{ backgroundColor: 'var(--color-bg-surface)', boxSizing: 'border-box' }}>
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle bg-info-subtle text-info p-1.5 d-flex align-items-center justify-content-center">
                              <Layers size={16} />
                            </div>
                            <span className="fw-bold text-xs text-primary-emphasis text-uppercase" style={{ letterSpacing: '0.5px' }}>
                              2. Physical DOOH Screens
                            </span>
                          </div>
                          <span className="badge bg-info-subtle text-info font-monospace text-xs px-2 py-0.5">
                            {physicalPct}% Share
                          </span>
                        </div>
                        <div className="fs-5 fw-bold text-info font-monospace mb-2">
                          Rs. {physicalSpend.toLocaleString()}
                        </div>
                        <div className="d-flex flex-column gap-1.5 text-xs text-secondary">
                          <div className="d-flex justify-content-between">
                            <span>Screen Bookings:</span>
                            <span className="fw-medium text-primary-emphasis">{physicalSpend > 0 ? "1 Prime Screen Slot" : "0 Spaces Reserved"}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span>Status:</span>
                            <span className={physicalSpend > 0 ? "text-success fw-medium" : "text-muted"}>
                              {physicalSpend > 0 ? "Slot Reserved" : "Unallocated / Ready to Book"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pillar 3: Influencer Sponsorships */}
                  <div className="col-12 col-md-4 p-0 ps-md-2">
                    <div className="p-3.5 rounded-3 border h-100 d-flex flex-column justify-content-between w-100" style={{ backgroundColor: 'var(--color-bg-surface)', boxSizing: 'border-box' }}>
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle p-1.5 d-flex align-items-center justify-content-center text-white" style={{ backgroundColor: '#8b5cf6' }}>
                              <Sparkles size={16} />
                            </div>
                            <span className="fw-bold text-xs text-primary-emphasis text-uppercase" style={{ letterSpacing: '0.5px' }}>
                              3. Creator Sponsorships
                            </span>
                          </div>
                          <span className="badge font-monospace text-xs px-2 py-0.5 text-white" style={{ backgroundColor: '#8b5cf6' }}>
                            {influencerPct}% Share
                          </span>
                        </div>
                        <div className="fs-5 fw-bold font-monospace mb-2" style={{ color: '#8b5cf6' }}>
                          Rs. {influencerSpend.toLocaleString()}
                        </div>
                        <div className="d-flex flex-column gap-1.5 text-xs text-secondary">
                          <div className="d-flex justify-content-between">
                            <span>Hired Creators:</span>
                            <span className="fw-medium text-primary-emphasis">
                              {campaignHiredCreators.length > 0
                                ? `${campaignHiredCreators.length} Hired Creator${campaignHiredCreators.length > 1 ? 's' : ''}`
                                : (influencerSpend > 0 ? "1 Creator" : "0 Contracts Executed")}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span>Status:</span>
                            <span className={influencerSpend > 0 ? "text-success fw-medium" : "text-muted"}>
                              {influencerSpend > 0 ? "Contract Active" : "Unallocated / Ready to Book"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Itemized Service & Booked Deliverables Ledger */}
                <div className="p-4 rounded-3 border bg-light-subtle w-100" style={{ width: '100%', boxSizing: 'border-box' }}>
                  <div className="pb-2.5 mb-3 border-bottom d-flex align-items-center justify-content-between w-100">
                    <span className="fw-bold text-xs text-primary-emphasis text-uppercase" style={{ letterSpacing: '0.5px' }}>
                      Detailed Line-Item Channel Ledger &amp; Booked Services
                    </span>
                    <span className={`badge text-xs ${totalCommitted > 0 ? 'bg-primary text-white' : 'bg-secondary-subtle text-secondary'}`}>
                      {totalCommitted > 0 ? 'Reconciled Active Ledger' : 'No Committed Line-Items'}
                    </span>
                  </div>

                  {campaignDigitalServices.length === 0 && physicalSpend === 0 && campaignHiredCreators.length === 0 && influencerSpend === 0 ? (
                    <div className="p-4 rounded-2 border text-center" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
                      <div className="d-flex align-items-center justify-content-center gap-2 text-muted text-xs mb-1.5">
                        <Info size={16} className="text-primary flex-shrink-0" />
                        <span className="fw-bold text-primary-emphasis fs-6">100% Budget Unallocated</span>
                      </div>
                      <p className="text-muted text-xs mb-3" style={{ maxWidth: '480px', margin: '0 auto', lineHeight: '1.5' }}>
                        This campaign is in its initial strategy state with no services, screen spaces, or creators booked yet. The entire budget ceiling of <strong>Rs. {totalBudget.toLocaleString()}</strong> is fully liquid and ready to allocate.
                      </p>
                      <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                        <Link
                          to="/digital-services"
                          className="btn-ui btn-ui-primary btn-ui-sm d-inline-flex align-items-center gap-1.5"
                          onClick={() => setBreakdownCampaign(null)}
                        >
                          <Globe size={13} />
                          <span>Provision Digital Ad Packages</span>
                        </Link>
                        <Link
                          to="/spaces"
                          className="btn-ui btn-ui-secondary btn-ui-sm d-inline-flex align-items-center gap-1.5"
                          onClick={() => setBreakdownCampaign(null)}
                        >
                          <Layers size={13} />
                          <span>Browse DOOH Screen Spaces</span>
                        </Link>
                        <Link
                          to="/influencers"
                          className="btn-ui btn-ui-secondary btn-ui-sm d-inline-flex align-items-center gap-1.5"
                          onClick={() => setBreakdownCampaign(null)}
                        >
                          <Sparkles size={13} />
                          <span>Hire Creator Talent</span>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3 w-100" style={{ width: '100%' }}>
                      
                      {/* Section: Booked Digital Ad Services */}
                      {campaignDigitalServices.length > 0 && (
                        <div className="d-flex flex-column gap-2 w-100">
                          <div className="text-xs fw-semibold text-primary-emphasis text-uppercase d-flex align-items-center gap-1.5" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                            <Globe size={13} className="text-primary" />
                            <span>Digital Marketing &amp; Online Ads ({campaignDigitalServices.length})</span>
                          </div>
                          {campaignDigitalServices.map((ds) => (
                            <div
                              key={ds.id}
                              className="p-3.5 rounded-2 border d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 w-100"
                              style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--color-bg-surface)' }}
                            >
                              <div className="d-flex align-items-center gap-3" style={{ minWidth: 0, flex: '1 1 auto' }}>
                                <div className="rounded-circle bg-primary-subtle text-primary p-2 d-flex align-items-center justify-content-center flex-shrink-0">
                                  <Globe size={18} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div className="fw-bold text-xs text-primary-emphasis mb-0.5">{ds.service_title}</div>
                                  <div className="text-muted text-xs font-monospace" style={{ fontSize: '0.74rem' }}>
                                    Platform: {ds.platform} • Flight: {ds.start_date} &rarr; {ds.end_date} ({ds.duration_days || 30} Days)
                                  </div>
                                </div>
                              </div>
                              <div className="text-md-end flex-shrink-0 d-flex flex-column align-items-md-end gap-1">
                                <div className="fw-bold text-primary font-monospace fs-6">Rs. {Number(ds.agreed_price || 0).toLocaleString()}</div>
                                <span className="badge bg-success-subtle text-success text-xs">{ds.discount_applied || 'Standard Rate'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Section: Booked Physical DOOH Screen Slots */}
                      {physicalSpend > 0 && (
                        <div className="d-flex flex-column gap-2 w-100">
                          <div className="text-xs fw-semibold text-primary-emphasis text-uppercase d-flex align-items-center gap-1.5" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                            <Layers size={13} className="text-info" />
                            <span>Physical DOOH Screen Bookings</span>
                          </div>
                          <div
                            className="p-3.5 rounded-2 border d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 w-100"
                            style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--color-bg-surface)' }}
                          >
                            <div className="d-flex align-items-center gap-3" style={{ minWidth: 0, flex: '1 1 auto' }}>
                              <div className="rounded-circle bg-info-subtle text-info p-2 d-flex align-items-center justify-content-center flex-shrink-0">
                                <Layers size={18} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div className="fw-bold text-xs text-primary-emphasis mb-0.5">Gulberg Main Blvd Digital LED Billboard (Lahore)</div>
                                <div className="text-muted text-xs font-monospace" style={{ fontSize: '0.74rem' }}>
                                  40ft x 20ft 4K Screen • 30 Days Slot @ Rs. 14,000 / day
                                </div>
                              </div>
                            </div>
                            <div className="text-md-end flex-shrink-0 d-flex flex-column align-items-md-end gap-1">
                              <div className="fw-bold text-info font-monospace fs-6">Rs. {physicalSpend.toLocaleString()}</div>
                              <span className="badge bg-success-subtle text-success text-xs">Slot Reserved</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Section: Booked Influencer & Creator Sponsorships */}
                      {(campaignHiredCreators.length > 0 || influencerSpend > 0) && (
                        <div className="d-flex flex-column gap-2 w-100">
                          <div className="text-xs fw-semibold text-primary-emphasis text-uppercase d-flex align-items-center gap-1.5" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                            <Sparkles size={13} style={{ color: '#8b5cf6' }} />
                            <span>Hired Creator Collaborations &amp; Availments ({campaignHiredCreators.length || 1})</span>
                          </div>
                          {campaignHiredCreators.length > 0 ? (
                            campaignHiredCreators.map((hc) => (
                              <div
                                key={hc.id}
                                className="p-3.5 rounded-2 border d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 w-100"
                                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--color-bg-surface)' }}
                              >
                                <div className="d-flex align-items-center gap-3" style={{ minWidth: 0, flex: '1 1 auto' }}>
                                  {hc.avatar_url ? (
                                    <img
                                      src={hc.avatar_url}
                                      alt={hc.influencer_name || 'Creator'}
                                      className="rounded-circle border flex-shrink-0"
                                      style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                      onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                  ) : (
                                    <div
                                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                                      style={{ width: '40px', height: '40px', backgroundColor: '#8b5cf6' }}
                                    >
                                      <Sparkles size={18} />
                                    </div>
                                  )}
                                  <div style={{ minWidth: 0 }}>
                                    <div className="d-flex align-items-center gap-2 flex-wrap mb-0.5">
                                      <span className="fw-bold text-xs text-primary-emphasis">{hc.influencer_name}</span>
                                      <span className="text-muted text-xs font-monospace">({hc.influencer_handle})</span>
                                      <span className="badge bg-secondary-subtle text-secondary py-0 px-1 text-xs">{hc.platform}</span>
                                    </div>
                                    <div className="text-primary-emphasis text-xs fw-medium">
                                      {hc.package_title}
                                    </div>
                                    <div className="text-muted text-xs font-monospace mt-0.5" style={{ fontSize: '0.73rem' }}>
                                      {hc.deliverables}
                                    </div>
                                    {hc.target_date && (
                                      <div className="text-muted text-xs mt-0.5" style={{ fontSize: '0.7rem' }}>
                                        Target Publication Date: <span className="font-monospace text-primary fw-medium">{hc.target_date}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-md-end flex-shrink-0 d-flex flex-column align-items-md-end gap-1">
                                  <div className="fw-bold font-monospace fs-6" style={{ color: '#8b5cf6' }}>Rs. {Number(hc.agreed_fee || 0).toLocaleString()}</div>
                                  <span className="badge bg-success-subtle text-success text-xs">Contract Active</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div
                              className="p-3.5 rounded-2 border d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 w-100"
                              style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--color-bg-surface)' }}
                            >
                              <div className="d-flex align-items-center gap-3" style={{ minWidth: 0, flex: '1 1 auto' }}>
                                <div className="rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0 text-white" style={{ backgroundColor: '#8b5cf6' }}>
                                  <Sparkles size={18} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div className="fw-bold text-xs text-primary-emphasis mb-0.5">Creator Sponsorship: @zaintech_official (YouTube)</div>
                                  <div className="text-muted text-xs font-monospace" style={{ fontSize: '0.74rem' }}>
                                    Dedicated 1080p Video Review + Pinned CTA Link • 640k Subscribers
                                  </div>
                                </div>
                              </div>
                              <div className="text-md-end flex-shrink-0 d-flex flex-column align-items-md-end gap-1">
                                <div className="fw-bold font-monospace fs-6" style={{ color: '#8b5cf6' }}>Rs. {influencerSpend.toLocaleString()}</div>
                                <span className="badge bg-success-subtle text-success text-xs">Contract Executed</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )}
                </div>

                {/* 5. Consolidated Financial Balance Sheet Reconciliation (Strict Left-Right Spacing) */}
                <div className="p-4 rounded-3 border bg-light-subtle w-100" style={{ width: '100%', boxSizing: 'border-box' }}>
                  <div className="pb-2.5 mb-3 border-bottom d-flex align-items-center justify-content-between w-100">
                    <span className="fw-bold text-xs text-primary-emphasis text-uppercase" style={{ letterSpacing: '0.5px' }}>
                      Financial Balance Sheet Reconciliation
                    </span>
                    <span className="badge bg-secondary-subtle text-secondary font-monospace text-xs">Reconciliation Ledger</span>
                  </div>

                  <div className="d-flex flex-column gap-2.5 w-100 text-xs font-monospace" style={{ width: '100%' }}>
                    <div className="d-flex align-items-center justify-content-between pb-2 border-bottom w-100">
                      <span className="text-secondary text-start">1. Digital Online Ad Placements</span>
                      <span className="fw-bold text-primary-emphasis text-end">Rs. {digitalSpend.toLocaleString()} ({digitalPct}%)</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between pb-2 border-bottom w-100">
                      <span className="text-secondary text-start">2. Physical DOOH &amp; Billboard Screens</span>
                      <span className="fw-bold text-primary-emphasis text-end">Rs. {physicalSpend.toLocaleString()} ({physicalPct}%)</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between pb-2 border-bottom w-100">
                      <span className="text-secondary text-start">3. Creator &amp; Influencer Endorsements</span>
                      <span className="fw-bold text-primary-emphasis text-end">Rs. {influencerSpend.toLocaleString()} ({influencerPct}%)</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between pt-2 pb-2 text-primary fw-bold fs-6 border-bottom w-100">
                      <span className="text-start">Total Committed Expenditures</span>
                      <span className="text-end">Rs. {totalCommitted.toLocaleString()} ({committedPct}%)</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between pt-1.5 text-success fw-bold fs-6 w-100">
                      <span className="text-start">Available Liquid Reserve</span>
                      <span className="text-end">Rs. {remainingBudget.toLocaleString()} ({remainingPct}%)</span>
                    </div>
                  </div>
                </div>

              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};

export default Campaigns;
