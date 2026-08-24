import React, { useState, useEffect } from 'react';
import { campaignService } from '../services/campaignService';

const STATUS_BADGES = {
  DRAFT: 'bg-secondary',
  ACTIVE: 'bg-success',
  PAUSED: 'bg-warning text-dark',
  COMPLETED: 'bg-info text-dark',
  CANCELLED: 'bg-danger',
};

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  // Fetch campaigns from backend
  const fetchCampaigns = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, per_page: 8 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const data = await campaignService.getCampaigns(params);
      setCampaigns(data.campaigns || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load campaigns.');
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
    setSubmitting(true);
    setError('');
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
      setError(err.response?.data?.message || 'Failed to create campaign.');
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
      setError(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await campaignService.deleteCampaign(id);
      setSuccessMsg('Campaign deleted.');
      fetchCampaigns();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete campaign.');
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Campaigns</h2>
          <p className="text-muted small mb-0">Manage your marketing and advertising campaigns</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Campaign
        </button>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-danger alert-dismissible">{error}</div>}
      {successMsg && <div className="alert alert-success alert-dismissible">{successMsg}</div>}

      {/* Filter & Search Bar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <form className="row g-2 align-items-center" onSubmit={handleSearchSubmit}>
            <div className="col-md-5">
              <input
                type="text"
                className="form-control"
                placeholder="Search campaigns by name or reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
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
            <div className="col-md-2">
              <button type="submit" className="btn btn-dark w-100">Search</button>
            </div>
            <div className="col-md-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setPage(1);
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
              <p className="text-muted mt-2">Loading campaigns...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-5">
              <h5>No campaigns found</h5>
              <p className="text-muted small">Create a new campaign to get started.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Reference</th>
                    <th>Name</th>
                    <th>Date Range</th>
                    <th>Budget</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id}>
                      <td className="fw-semibold text-primary">{c.reference_code || `#${c.id}`}</td>
                      <td>
                        <div className="fw-bold">{c.name}</div>
                        <small className="text-muted">{c.description || 'No description'}</small>
                      </td>
                      <td>
                        <small>{c.start_date || 'N/A'} &rarr; {c.end_date || 'N/A'}</small>
                      </td>
                      <td>{c.budget ? `$${parseFloat(c.budget).toLocaleString()}` : '$0.00'}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGES[c.status] || 'bg-secondary'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <select
                          className="form-select form-select-sm d-inline-block w-auto me-2"
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
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(c.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
            <span className="text-muted small">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div>
              <button
                className="btn btn-outline-secondary btn-sm me-2"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Create New Campaign</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Campaign Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    ></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Total Budget ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="e.g. 5000"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Campaign'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;