import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { bookingsApi } from '../bookingsApi';
import { spacesApi } from '../../spaces/spacesApi';
import { campaignService } from '../../../services/campaignService';
import { extractErrorMessage } from '../../../utils/errorHandler';
import StatusBadge from '../../../components/ui/StatusBadge';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import Modal from '../../../components/ui/Modal';
import {
  Layers,
  Search,
  CalendarDays,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Filter,
  RefreshCw,
  Clock,
  Building2,
  DollarSign,
  CreditCard,
  Receipt,
  Eye,
  User
} from 'lucide-react';

export const BookingsPage = () => {
  const { user } = useAuth();
  const isStaffApprover =
    user?.role === 'Administrator' ||
    user?.role === 'Space Manager' ||
    user?.role === 'Sales Executive';

  const [bookings, setBookings] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected Booking for details modal
  const [selectedBooking, setSelectedBooking] = useState(null);

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

  const todayString = new Date().toISOString().split('T')[0];

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
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const data = await bookingsApi.getBookings(params);
      setBookings(data.bookings || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: (data.bookings || []).length });
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load bookings.'));
    } finally {
      setLoading(false);
    }
  };

  // Compute realistic booking amount if total_amount is zero or missing
  const getBookingAmount = (b) => {
    if (b.total_amount && parseFloat(b.total_amount) > 0) {
      return parseFloat(b.total_amount);
    }
    const dailyRate = b.space?.base_price ? parseFloat(b.space.base_price) : 45000;
    if (b.start_date && b.end_date) {
      const start = new Date(b.start_date);
      const end = new Date(b.end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      return dailyRate * diffDays;
    }
    return dailyRate * 14;
  };

  // Standardized enterprise reference code
  const getBookingReference = (b, index) => {
    if (b.reference_code && !b.reference_code.startsWith('#BK-')) {
      return b.reference_code;
    }
    return `BK-2026-${String(b.id || index + 1).padStart(4, '0')}`;
  };

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBookings();
  };

  const handleOpenModal = () => {
    setModalError('');
    setFormData({ space_id: '', campaign_id: '', start_date: '', end_date: '', notes: '' });
    setShowModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');
    setError('');

    if (!formData.space_id) {
      setModalError('Please select an advertising space.');
      setSubmitting(false);
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      setModalError('Start date and end date are required.');
      setSubmitting(false);
      return;
    }

    if (formData.start_date < todayString) {
      setModalError(`Booking start date (${formData.start_date}) cannot be in the past.`);
      setSubmitting(false);
      return;
    }

    if (formData.end_date < formData.start_date) {
      setModalError(`Booking end date (${formData.end_date}) cannot be earlier than start date (${formData.start_date}).`);
      setSubmitting(false);
      return;
    }

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
      setModalError(extractErrorMessage(err, 'Failed to submit booking request.'));
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
      setError(extractErrorMessage(err, 'Failed to update booking status.'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel and delete this booking?')) return;
    try {
      await bookingsApi.deleteBooking(id);
      setSuccessMsg('Booking deleted.');
      fetchBookings();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to delete booking.'));
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Space Reservations &amp; Bookings</h1>
          <p className="page-subtitle">
            Manage inventory reservations, schedule lockouts, and campaign placements.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={fetchBookings}
            className="btn-ui btn-ui-secondary btn-ui-sm"
            title="Refresh bookings"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn-ui btn-ui-primary btn-ui-sm"
            onClick={handleOpenModal}
          >
            <Plus size={14} />
            <span>Book a Space</span>
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
        <form onSubmit={handleSearch} className="toolbar-search">
          <Search size={15} className="toolbar-search-icon" />
          <input
            type="text"
            className="toolbar-search-input"
            placeholder="Search by booking reference, space code, notes..."
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
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings Table Card */}
      <div className="card-enterprise">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary spinner-border-sm" role="status" />
            <p className="text-muted small mt-2">Loading booking reservations...</p>
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No bookings found"
            description="There are currently no active reservations matching your filter."
            actionLabel="Make a Reservation"
            onAction={handleOpenModal}
          />
        ) : (
          <>
            <div className="table-container border-0">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Advertising Space</th>
                    <th>Customer &amp; Campaign</th>
                    <th>Schedule Window</th>
                    <th>Total Price</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b, index) => (
                    <tr key={b.id}>
                      <td>
                        <span className="font-monospace text-xs text-primary fw-semibold">
                          {getBookingReference(b, index)}
                        </span>
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Building2 size={14} className="text-primary flex-shrink-0" />
                          <div>
                            <div className="fw-semibold text-xs text-primary-emphasis">
                              {b.space?.name || b.space_name || `Space #${b.space_id}`}
                            </div>
                            <small className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                              {b.space?.code || b.space_code || `ID: ${b.space_id}`} • {b.space?.location?.city || b.space_location || 'Karachi'}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="fw-semibold text-xs text-primary-emphasis d-flex align-items-center gap-1">
                          <User size={12} className="text-primary flex-shrink-0" />
                          <span>{b.customer_name || b.company_name || b.user_name || 'Direct Advertiser'}</span>
                        </div>
                        <div className="text-xs text-muted mt-0.5">
                          {b.campaign?.name || b.campaign_name || (b.campaign_id ? `Campaign #${b.campaign_id}` : 'Direct Booking')}
                        </div>
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-1 text-xs text-secondary">
                          <CalendarDays size={13} className="text-muted" />
                          <span>{b.start_date}</span>
                          <span className="text-muted">&rarr;</span>
                          <span>{b.end_date}</span>
                        </div>
                      </td>

                      <td>
                        <span className="font-monospace text-xs text-primary-emphasis fw-bold">
                          Rs. {getBookingAmount(b).toLocaleString()}
                        </span>
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            b.status === 'CONFIRMED'
                              ? 'confirmed'
                              : b.status === 'PENDING'
                              ? 'pending'
                              : b.status === 'COMPLETED'
                              ? 'active'
                              : b.status === 'CANCELLED'
                              ? 'rejected'
                              : 'draft'
                          }
                          label={b.status}
                          size="sm"
                        />
                      </td>

                      <td className="text-end">
                        <div className="d-inline-flex align-items-center gap-1.5">
                          {/* View Booking Details Button for all users */}
                          <button
                            type="button"
                            className="btn-ui btn-ui-secondary btn-ui-sm d-inline-flex align-items-center gap-1"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                            onClick={() => setSelectedBooking(b)}
                            title="View full reservation & invoice details"
                          >
                            <Eye size={12} />
                            <span>Details</span>
                          </button>

                          {isStaffApprover ? (
                            <>
                              <select
                                className="form-select-ui"
                                style={{
                                  width: 'auto',
                                  fontSize: '0.75rem',
                                  padding: '0.25rem 0.5rem',
                                  height: '28px',
                                }}
                                value={b.status}
                                onChange={(e) => handleStatusChange(b.id, e.target.value)}
                                title="Update booking status"
                              >
                                <option value="PENDING">Pending</option>
                                <option value="CONFIRMED">Confirm (Lock Slot)</option>
                                <option value="COMPLETED">Complete (Settled)</option>
                                <option value="CANCELLED">Cancel (Release Slot)</option>
                              </select>

                              <button
                                type="button"
                                className="btn-ui-icon text-danger"
                                onClick={() => handleDelete(b.id)}
                                title="Delete Booking Record"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              {/* If invoice or booking is paid in full */}
                              {(b.is_paid || b.payment_status === 'PAID' || b.status === 'COMPLETED') ? (
                                <Link
                                  to="/payments"
                                  className="btn-ui btn-ui-secondary btn-ui-sm d-inline-flex align-items-center gap-1"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                                  title="Paid in Full - View Invoice & Settlement Receipt"
                                >
                                  <Receipt size={12} />
                                  <span>Invoice</span>
                                </Link>
                              ) : b.status === 'CONFIRMED' ? (
                                <Link
                                  to="/payments"
                                  className="btn-ui btn-ui-primary btn-ui-sm d-inline-flex align-items-center gap-1"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                                  title="Pay for this confirmed reservation"
                                >
                                  <CreditCard size={12} />
                                  <span>Pay Now</span>
                                </Link>
                              ) : null}

                              {b.status === 'PENDING' && (
                                <button
                                  type="button"
                                  className="btn-ui-icon text-danger"
                                  onClick={() => handleDelete(b.id)}
                                  title="Cancel Booking Request"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 border-top bg-subtle">
              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                total={pagination.total}
                perPage={10}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </>
        )}
      </div>

      {/* Create Booking Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Schedule New Space Booking"
        subtitle="Book billboard inventory for an active marketing flight"
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
              {submitting ? 'Submitting...' : 'Confirm Reservation'}
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
              Advertising Space <span className="form-required">*</span>
            </label>
            <select
              className="form-select-ui"
              value={formData.space_id}
              onChange={(e) => setFormData({ ...formData, space_id: e.target.value })}
              required
            >
              <option value="">Select Billboard Asset...</option>
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) - {s.location?.city || 'Karachi'} [Rs. {parseFloat(s.base_price || 45000).toLocaleString()}/day]
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-ui">
            <label className="form-label-ui">Linked Campaign</label>
            <select
              className="form-select-ui"
              value={formData.campaign_id}
              onChange={(e) => setFormData({ ...formData, campaign_id: e.target.value })}
            >
              <option value="">Direct Booking (No Campaign Link)</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.campaign_reference ? `(${c.campaign_reference})` : ''}
                </option>
              ))}
            </select>
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
            <label className="form-label-ui">Reservation Notes / Instructions</label>
            <textarea
              className="form-input-ui"
              rows="2"
              placeholder="Special flighting requirements, dayparting specifications, etc."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Booking Details Modal */}
      <Modal
        isOpen={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        title="Reservation Details & Invoice Audit"
        subtitle={`Booking Reference: ${selectedBooking ? getBookingReference(selectedBooking) : ''}`}
        size="lg"
        footer={
          <div className="d-flex align-items-center justify-content-between w-100">
            <div>
              {selectedBooking && !isStaffApprover && !(selectedBooking.is_paid || selectedBooking.payment_status === 'PAID' || selectedBooking.status === 'COMPLETED') && selectedBooking.status === 'CONFIRMED' && (
                <Link
                  to="/payments"
                  className="btn-ui btn-ui-primary btn-ui-sm d-inline-flex align-items-center gap-1"
                >
                  <CreditCard size={12} />
                  <span>Proceed to Payment</span>
                </Link>
              )}
            </div>
            <button
              type="button"
              className="btn-ui btn-ui-secondary btn-ui-sm"
              onClick={() => setSelectedBooking(null)}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedBooking && (
          <div className="booking-details-view">
            {/* Top Overview Card */}
            <div className="p-3 mb-3 rounded-2 border bg-light-subtle d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div>
                <span className="text-xs text-muted d-block font-monospace">
                  REFERENCE #{getBookingReference(selectedBooking)}
                </span>
                <h6 className="fw-bold mb-0 text-primary-emphasis">
                  {selectedBooking.space?.name || selectedBooking.space_name || `Space #${selectedBooking.space_id}`}
                </h6>
              </div>
              <div className="d-flex align-items-center gap-2">
                <StatusBadge
                  status={
                    selectedBooking.status === 'CONFIRMED'
                      ? 'confirmed'
                      : selectedBooking.status === 'PENDING'
                      ? 'pending'
                      : selectedBooking.status === 'COMPLETED'
                      ? 'active'
                      : 'rejected'
                  }
                  label={selectedBooking.status}
                  size="md"
                />
                {selectedBooking.is_paid || selectedBooking.payment_status === 'PAID' || selectedBooking.status === 'COMPLETED' ? (
                  <span className="badge bg-success-subtle text-success text-xs font-semibold py-1.5 px-2.5">
                    Paid in Full
                  </span>
                ) : (
                  <span className="badge bg-warning-subtle text-warning text-xs font-semibold py-1.5 px-2.5">
                    Payment Pending
                  </span>
                )}
              </div>
            </div>

            <div className="row g-3">
              {/* Customer & Company Details */}
              <div className="col-12 col-md-6">
                <div className="p-3 border rounded-2 h-100 bg-light-subtle">
                  <span className="badge bg-primary-subtle text-primary text-xs font-semibold mb-2">
                    Customer / Billed Organization
                  </span>
                  <div className="text-xs mb-2">
                    <span className="text-muted d-block">Client Name:</span>
                    <strong className="text-primary-emphasis d-flex align-items-center gap-1">
                      <User size={12} className="text-primary flex-shrink-0" />
                      <span>{selectedBooking.customer_name || selectedBooking.user_name || 'Direct Advertiser'}</span>
                    </strong>
                  </div>
                  <div className="text-xs mb-2">
                    <span className="text-muted d-block">Company / Entity:</span>
                    <strong className="text-dark-emphasis d-flex align-items-center gap-1">
                      <Building2 size={12} className="text-primary flex-shrink-0" />
                      <span>{selectedBooking.company_name || selectedBooking.advertiser_name || 'Individual Advertiser'}</span>
                    </strong>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted d-block">Parent Marketing Campaign:</span>
                    <span className="text-secondary fw-medium">
                      {selectedBooking.campaign?.name || selectedBooking.campaign_name || (selectedBooking.campaign_id ? `Campaign #${selectedBooking.campaign_id}` : 'Direct Booking')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Space & Flighting Window */}
              <div className="col-12 col-md-6">
                <div className="p-3 border rounded-2 h-100 bg-light-subtle">
                  <span className="badge bg-info-subtle text-info text-xs font-semibold mb-2">
                    Inventory &amp; Flight Schedule
                  </span>
                  <div className="text-xs mb-2">
                    <span className="text-muted d-block">Space Code &amp; City:</span>
                    <span className="font-monospace fw-bold text-dark-emphasis">
                      {selectedBooking.space_code || `ID: ${selectedBooking.space_id}`} • {selectedBooking.space_location || selectedBooking.space?.location?.city || 'Karachi'}
                    </span>
                  </div>
                  <div className="text-xs mb-2">
                    <span className="text-muted d-block">Flighting Window:</span>
                    <span className="text-dark-emphasis fw-medium d-flex align-items-center gap-1">
                      <CalendarDays size={13} className="text-muted" />
                      {selectedBooking.start_date} &rarr; {selectedBooking.end_date}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted d-block">Reservation Notes:</span>
                    <span className="text-muted fst-italic">
                      {selectedBooking.notes || 'No special flighting instructions provided.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial & Commercial Invoice Info */}
              <div className="col-12">
                <div className="p-3 border rounded-2 bg-light-subtle">
                  <span className="badge bg-secondary-subtle text-secondary text-xs font-semibold mb-2">
                    Commercial Valuation &amp; Billing
                  </span>
                  <div className="row g-2 text-xs">
                    <div className="col-12 col-sm-4">
                      <span className="text-muted d-block">Total Inventory Cost:</span>
                      <strong className="font-monospace text-primary-emphasis" style={{ fontSize: '0.95rem' }}>
                        Rs. {getBookingAmount(selectedBooking).toLocaleString()}
                      </strong>
                    </div>
                    <div className="col-12 col-sm-4">
                      <span className="text-muted d-block">Provincial Sales Tax (GST):</span>
                      <span className="text-secondary font-monospace">
                        16% Statutory GST
                      </span>
                    </div>
                    <div className="col-12 col-sm-4">
                      <span className="text-muted d-block">Commercial Invoice:</span>
                      {selectedBooking.invoice_number ? (
                        <span className="font-monospace fw-bold text-primary">
                          {selectedBooking.invoice_number}
                        </span>
                      ) : (
                        <span className="text-muted font-monospace">Linked to Campaign Billing</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookingsPage;