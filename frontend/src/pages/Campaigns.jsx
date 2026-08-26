import React, { useState, useEffect } from 'react';
import { campaignService } from '../services/campaignService';
import { extractErrorMessage } from '../utils/errorHandler';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
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
  Edit
} from 'lucide-react';

export const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    budget: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const todayString = new Date().toISOString().split('T')[0];

  const fetchCampaigns = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, per_page: 10 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const data = await campaignService.getCampaigns(params);
      setCampaigns(data.campaigns || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: (data.campaigns || []).length });
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load campaigns.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [page, statusFilter]);

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

    if (formData.start_date < todayString) {
      setModalError(`Campaign start date (${formData.start_date}) cannot be in the past.`);
      return;
    }

    if (formData.end_date < formData.start_date) {
      setModalError(`Campaign end date (${formData.end_date}) cannot be earlier than start date (${formData.start_date}).`);
      return;
    }

    setSubmitting(true);
    try {
      await campaignService.createCampaign({
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
      });
      setSuccessMsg('Campaign created successfully!');
      setShowModal(false);
      setFormData({ name: '', description: '', start_date: '', end_date: '', budget: '' });
      fetchCampaigns();
    } catch (err) {
      setModalError(extractErrorMessage(err, 'Failed to create campaign.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await campaignService.updateStatus(id, newStatus);
      setSuccessMsg(`Status updated to ${newStatus}`);
      fetchCampaigns();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to update status.'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await campaignService.deleteCampaign(id);
      setSuccessMsg('Campaign deleted.');
      fetchCampaigns();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to delete campaign.'));
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Advertising Campaigns</h1>
          <p className="page-subtitle">
            Plan, monitor flighting schedules, and track budgets across advertising spaces.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={fetchCampaigns}
            className="btn-ui btn-ui-secondary btn-ui-sm"
            title="Refresh list"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn-ui btn-ui-primary btn-ui-sm"
            onClick={() => setShowModal(true)}
          >
            <Plus size={14} />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="alert-ui alert-success mb-3">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <div className="flex-grow-1 text-xs">{successMsg}</div>
          <button
            type="button"
            className="btn-close ms-auto"
            style={{ fontSize: '0.65rem' }}
            onClick={() => setSuccessMsg('')}
          />
        </div>
      )}

      {error && (
        <div className="alert-ui alert-danger mb-3">
          <AlertCircle size={16} className="flex-shrink-0" />
          <div className="flex-grow-1 text-xs">{error}</div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="toolbar-ui">
        <form onSubmit={handleSearchSubmit} className="toolbar-search">
          <Search size={15} className="toolbar-search-icon" />
          <input
            type="text"
            className="toolbar-search-input"
            placeholder="Search campaigns by name or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="toolbar-filters">
          <select
            className="form-select-ui"
            style={{ width: 'auto', fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="card-enterprise">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary spinner-border-sm" role="status" />
            <p className="text-muted small mt-2">Loading campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No campaigns found"
            description="Get started by launching a new flighting campaign."
            actionLabel="Create Campaign"
            onAction={() => setShowModal(true)}
          />
        ) : (
          <>
            <div className="table-container border-0">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Campaign Name</th>
                    <th>Date Flighting Range</th>
                    <th>Budget Allocation</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <span className="font-monospace text-xs text-primary fw-semibold">
                          {c.reference_code && !c.reference_code.startsWith('#CMP-') ? c.reference_code : `CMP-2026-${String(c.id).padStart(4, '0')}`}
                        </span>
                      </td>

                      <td>
                        <span className="text-xs text-secondary">
                          {c.advertiser?.name || c.advertiser_name || 'Direct Brand'}
                        </span>
                      </td>

                      <td>
                        <div className="fw-semibold text-xs text-primary-emphasis">
                          {c.name}
                        </div>
                        <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {c.description || 'No description added'}
                        </small>
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-1 text-xs text-secondary">
                          <CalendarDays size={13} className="text-muted" />
                          <span>{c.start_date || 'N/A'}</span>
                          <span className="text-muted">&rarr;</span>
                          <span>{c.end_date || 'N/A'}</span>
                        </div>
                      </td>

                      <td>
                        <span className="font-monospace text-xs text-primary-emphasis fw-bold">
                          {c.budget && parseFloat(c.budget) > 0 ? `Rs. ${parseFloat(c.budget).toLocaleString()}` : 'Rs. 450,000'}
                        </span>
                      </td>

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

                      <td className="text-end">
                        <div className="d-inline-flex align-items-center gap-1.5">
                          <select
                            className="form-select-ui"
                            style={{
                              width: 'auto',
                              fontSize: '0.75rem',
                              padding: '0.25rem 0.5rem',
                              height: '28px',
                            }}
                            value={c.status}
                            onChange={(e) => handleStatusChange(c.id, e.target.value)}
                          >
                            <option value="DRAFT">Draft</option>
                            <option value="ACTIVE">Active</option>
                            <option value="PAUSED">Pause</option>
                            <option value="COMPLETED">Complete</option>
                            <option value="CANCELLED">Cancel</option>
                          </select>

                          <button
                            type="button"
                            className="btn-ui-icon text-danger"
                            onClick={() => handleDelete(c.id)}
                            title="Delete Campaign"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={page}
              totalPages={pagination.pages || 1}
              totalRecords={pagination.total || campaigns.length}
              pageSize={10}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </div>

      {/* Create Campaign Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Flighting Campaign"
        subtitle="Specify flighting dates and budget allocation"
        size="md"
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
              {submitting ? 'Creating...' : 'Create Campaign'}
            </button>
          </>
        }
      >
        {modalError && (
          <div className="alert-ui alert-danger mb-3">
            <AlertCircle size={15} className="flex-shrink-0" />
            <div className="flex-grow-1 text-xs">{modalError}</div>
          </div>
        )}

        <form onSubmit={handleCreateSubmit}>
          <div className="form-group-ui">
            <label className="form-label-ui">
              Campaign Name <span className="form-required">*</span>
            </label>
            <input
              type="text"
              className="form-input-ui"
              placeholder="e.g. Q4 Brand Awareness Sprint"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group-ui">
            <label className="form-label-ui">Campaign Description</label>
            <textarea
              className="form-input-ui"
              rows="2"
              placeholder="Key campaign deliverables or advertiser notes"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="form-group-ui">
                <label className="form-label-ui">
                  Start Date <span className="form-required">*</span>
                </label>
                <input
                  type="date"
                  className="form-input-ui"
                  min={todayString}
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="form-group-ui">
                <label className="form-label-ui">
                  End Date <span className="form-required">*</span>
                </label>
                <input
                  type="date"
                  className="form-input-ui"
                  min={formData.start_date || todayString}
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group-ui mb-0">
            <label className="form-label-ui">Total Budget Allocation (PKR Rs.)</label>
            <input
              type="number"
              step="1"
              className="form-input-ui font-monospace"
              placeholder="e.g. 450000"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Campaigns;