import React, { useState, useEffect } from 'react';
import { bookingsApi } from '../bookingsApi';
import { spacesApi } from '../../spaces/spacesApi';
import { campaignService } from '../../../services/campaignService';

const STATUS_BADGES = {
  PENDING: 'bg-warning text-dark',
  CONFIRMED: 'bg-success',
  COMPLETED: 'bg-info text-dark',
  CANCELLED: 'bg-danger',
};

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    space_id: '',
    campaign_id: '',
    start_date: '',
    end_date: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Load spaces and campaigns for dropdown selection
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [spacesRes, campaignsRes] = await Promise.all([
          spacesApi.getSpaces({ per_page: 50 }),
          campaignService.getCampaigns({ per_page: 50 }),
        ]);
        setSpaces(spacesRes.spaces || spacesRes.items || []);
        setCampaigns(campaignsRes.campaigns || campaignsRes.items || []);
      } catch (err) {
        console.error('Failed to load selection data', err);
      }
    };
    loadDropdownData();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, per_page: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const data = await bookingsApi.getBookings(params);
      setBookings(data.bookings || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBookings();
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await bookingsApi.createBooking({
        space_id: parseInt(formData.space_id),
        campaign_id: formData.campaign_id ? parseInt(formData.campaign_id) : undefined,
        start_date: formData.start_date,
        end_date: formData.end_date,
        notes: formData.notes,
      });
      setSuccessMsg('Booking request submitted successfully!');
      setShowModal(false);
      setFormData({ space_id: '', campaign_id: '', start_date: '', end_date: '', notes: '' });
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit booking request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await bookingsApi.updateStatus(id, newStatus);
      setSuccessMsg(`Booking status updated to ${newStatus}`);
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update booking status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel and delete this booking?')) return;
    try {
      await bookingsApi.deleteBooking(id);
      setSuccessMsg('Booking deleted.');
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete booking.');
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Space Bookings</h2>
          <p className="text-muted small mb-0">Manage schedule reservations and active space placements</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Book a Space
        </button>
      </div>

      {error && <div className="alert alert-danger alert-dismissible">{error}</div>}
      {successMsg && <div className="alert alert-success alert-dismissible">{successMsg}</div>}

      {/* Filter Bar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <form className="row g-2 align-items-center" onSubmit={handleSearch}>
            <div className="col-md-5">
              <input
                type="text"
                className="form-control"
                placeholder="Search by reference, notes, or space name..."
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
                <option value="">All Booking Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-dark w-100">Filter</button>
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

      {/* Bookings Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
              <p className="text-muted mt-2">Loading reservations...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-5">
              <h5>No bookings found</h5>
              <p className="text-muted small">Reserve an advertising space to get started.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Reference</th>
                    <th>Space</th>
                    <th>Campaign</th>
                    <th>Date Range</th>
                    <th>Total Price</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td className="fw-semibold text-primary">{b.reference_code || `#${b.id}`}</td>
                      <td>
                        <div className="fw-bold">{b.space?.name || `Space #${b.space_id}`}</div>
                        <small className="text-muted">{b.space?.location?.city || ''}</small>
                      </td>
                      <td>
                        {b.campaign?.name || (b.campaign_id ? `Campaign #${b.campaign_id}` : 'Direct Placement')}
                      </td>
                      <td>
                        <small>{b.start_date} &rarr; {b.end_date}</small>
                      </td>
                      <td className="fw-semibold text-success">
                        ${b.total_price ? parseFloat(b.total_price).toLocaleString() : '0.00'}
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGES[b.status] || 'bg-secondary'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <select
                          className="form-select form-select-sm d-inline-block w-auto me-2"
                          value={b.status}
                          onChange={(e) => handleStatusChange(b.id, e.target.value)}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONFIRMED">Confirm</option>
                          <option value="COMPLETED">Complete</option>
                          <option value="CANCELLED">Cancel</option>
                        </select>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(b.id)}
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

        {/* Pagination */}
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

      {/* Book Space Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Reserve Advertising Space</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Advertising Space *</label>
                    <select
                      className="form-select"
                      required
                      value={formData.space_id}
                      onChange={(e) => setFormData({ ...formData, space_id: e.target.value })}
                    >
                      <option value="">Select an advertising space...</option>
                      {spaces.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (${s.base_rate_per_day || 0}/day)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Campaign (Optional)</label>
                    <select
                      className="form-select"
                      value={formData.campaign_id}
                      onChange={(e) => setFormData({ ...formData, campaign_id: e.target.value })}
                    >
                      <option value="">None (Individual Booking)</option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.reference_code || `#${c.id}`})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Start Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">End Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Booking Notes</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Special instructions or placement requests"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Reserving...' : 'Submit Booking'}
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

export default BookingsPage;