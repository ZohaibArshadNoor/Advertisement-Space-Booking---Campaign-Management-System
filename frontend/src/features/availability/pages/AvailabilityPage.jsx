import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { availabilityApi } from '../availabilityApi';
import { spacesApi } from '../../spaces/spacesApi';
import { useAuth } from '../../../context/AuthContext';
import StatusBadge from '../../../components/ui/StatusBadge';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import {
  CalendarDays,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Megaphone,
  Layers,
  Clock,
  ArrowRight,
  ShieldAlert,
  Plus,
  RefreshCw,
  Trash2,
  Building2
} from 'lucide-react';

export const AvailabilityPage = () => {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [spacesLoading, setSpacesLoading] = useState(true);

  // Checker State
  const [checkStartDate, setCheckStartDate] = useState('');
  const [checkEndDate, setCheckEndDate] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

  // Block Dates Modal
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockFormData, setBlockFormData] = useState({
    start_date: '',
    end_date: '',
    is_booked: false,
  });
  const [submittingBlock, setSubmittingBlock] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isStaff = ['Administrator', 'Space Manager', 'Sales Executive'].includes(user?.role);
  const selectedSpace = spaces.find((s) => s.id.toString() === selectedSpaceId.toString());

  useEffect(() => {
    const fetchSpaces = async () => {
      setSpacesLoading(true);
      try {
        const data = await spacesApi.getSpaces({ per_page: 50 });
        const list = data.spaces || data.items || [];
        setSpaces(list);
        if (list.length > 0) {
          setSelectedSpaceId(list[0].id.toString());
        }
      } catch (err) {
        setError('Failed to load advertising spaces.');
      } finally {
        setSpacesLoading(false);
      }
    };
    fetchSpaces();
  }, []);

  const fetchSchedules = async () => {
    if (!selectedSpaceId) return;
    setLoading(true);
    setError('');
    try {
      const data = await availabilityApi.getSpaceAvailability(selectedSpaceId);
      setSchedules(data.availability || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load schedules for this space.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSpaceId) {
      setCheckResult(null);
      fetchSchedules();
    }
  }, [selectedSpaceId]);

  const handleCheckAvailability = async (e) => {
    e.preventDefault();
    if (!selectedSpaceId || !checkStartDate || !checkEndDate) return;
    setChecking(true);
    setCheckResult(null);
    setError('');
    try {
      const res = await availabilityApi.checkAvailability(selectedSpaceId, {
        start_date: checkStartDate,
        end_date: checkEndDate,
      });
      setCheckResult(res);
    } catch (err) {
      setCheckResult({
        available: false,
        message: err.response?.data?.message || 'Collision detected or dates are occupied.',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleBlockDates = async (e) => {
    e.preventDefault();
    if (!selectedSpaceId || !blockFormData.start_date || !blockFormData.end_date) return;
    setSubmittingBlock(true);
    setError('');
    try {
      await availabilityApi.blockDates(selectedSpaceId, blockFormData);
      setSuccessMsg('Date schedule blocked successfully.');
      setShowBlockModal(false);
      setBlockFormData({ start_date: '', end_date: '', is_booked: false });
      fetchSchedules();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to block schedule dates.');
    } finally {
      setSubmittingBlock(false);
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Are you sure you want to unblock / remove this schedule slot?')) return;
    try {
      await availabilityApi.deleteSchedule(id);
      setSuccessMsg('Schedule slot removed.');
      fetchSchedules();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete schedule slot.');
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Availability &amp; Collision Engine</h1>
          <p className="page-subtitle">
            Perform zero-collision date range checks and inspect hardware lockout calendars.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={fetchSchedules}
            className="btn-ui btn-ui-secondary btn-ui-sm"
            title="Refresh availability"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
          {isStaff && (
            <button
              type="button"
              className="btn-ui btn-ui-primary btn-ui-sm"
              onClick={() => setShowBlockModal(true)}
            >
              <Lock size={14} />
              <span>Block Maintenance Dates</span>
            </button>
          )}
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

      {/* Space Selector Toolbar */}
      <div className="toolbar-ui">
        <div className="d-flex align-items-center gap-2 flex-grow-1">
          <label className="text-xs fw-semibold text-muted text-nowrap">
            Selected Billboard Asset:
          </label>
          <select
            className="form-select-ui"
            value={selectedSpaceId}
            onChange={(e) => setSelectedSpaceId(e.target.value)}
          >
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code}) — {s.location?.city || 'Karachi'} [Rs. {parseFloat(s.base_price || 45000).toLocaleString()}/day]
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Live Collision Verifier */}
        <div className="col-12 col-lg-5">
          <div className="card-enterprise p-4">
            <h3 className="fw-bold text-sm text-primary-emphasis mb-1 d-flex align-items-center gap-2">
              <Search size={16} className="text-primary" />
              Check Availability Window
            </h3>
            <p className="text-muted text-xs mb-3">
              Verify if this billboard is unreserved for your target flighting dates.
            </p>

            <form onSubmit={handleCheckAvailability}>
              <div className="form-group-ui">
                <label className="form-label-ui">Start Date</label>
                <input
                  type="date"
                  className="form-input-ui"
                  value={checkStartDate}
                  onChange={(e) => setCheckStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group-ui">
                <label className="form-label-ui">End Date</label>
                <input
                  type="date"
                  className="form-input-ui"
                  value={checkEndDate}
                  onChange={(e) => setCheckEndDate(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-ui btn-ui-primary btn-ui-sm w-100 justify-content-center"
                disabled={checking}
              >
                <Search size={14} />
                <span>{checking ? 'Checking Lockouts...' : 'Verify Collision Lock'}</span>
              </button>
            </form>

            {/* Check Result Card */}
            {checkResult && (
              <div
                className={`mt-3 p-3 rounded border text-xs ${
                  checkResult.available
                    ? 'bg-success-subtle border-success-subtle text-success'
                    : 'bg-danger-subtle border-danger-subtle text-danger'
                }`}
              >
                <div className="d-flex align-items-center gap-2 fw-bold mb-1">
                  {checkResult.available ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Dates Are 100% Available!</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={16} />
                      <span>Collision Lock Detected!</span>
                    </>
                  )}
                </div>
                <p className="mb-2" style={{ fontSize: '0.75rem' }}>
                  {checkResult.message ||
                    (checkResult.available
                      ? 'No reservations or maintenance blackouts exist for this period.'
                      : 'This billboard is occupied or locked during selected dates.')}
                </p>
                {checkResult.available && (
                  <Link to="/bookings" className="btn-ui btn-ui-primary btn-ui-sm text-decoration-none">
                    <span>Proceed to Book</span>
                    <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Schedule & Lockout Calendar */}
        <div className="col-12 col-lg-7">
          <div className="card-enterprise">
            <div className="card-header-enterprise py-3 px-4 d-flex justify-content-between align-items-center">
              <div style={{ minWidth: 0 }}>
                <h3 className="card-title-enterprise mb-0.5" style={{ fontSize: '0.95rem' }}>
                  Active Lockouts &amp; Reservation Schedule
                </h3>
                <div className="text-muted text-truncate" style={{ fontSize: '0.74rem' }}>
                  {selectedSpace
                    ? `${selectedSpace.name}${selectedSpace.code ? ` (${selectedSpace.code})` : ''}`
                    : 'Selected Asset'}
                </div>
              </div>
              <span className="badge bg-primary-subtle text-primary text-xs font-monospace px-2.5 py-1 rounded-pill flex-shrink-0 ms-3">
                {schedules.length} slots
              </span>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary spinner-border-sm" role="status" />
                <p className="text-muted small mt-2">Loading calendar schedules...</p>
              </div>
            ) : schedules.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No active schedule locks"
                description="This billboard is completely open with zero conflicting bookings or maintenance blackouts."
              />
            ) : (
              <div className="table-container border-0">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Schedule Window</th>
                      <th>Type / Lockout Reason</th>
                      <th>Status</th>
                      {isStaff && <th className="text-end">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div className="d-flex align-items-center gap-1.5 text-xs text-secondary">
                            <CalendarDays size={13} className="text-muted" />
                            <span>{s.start_date}</span>
                            <span className="text-muted">&rarr;</span>
                            <span>{s.end_date}</span>
                          </div>
                        </td>

                        <td>
                          <span className="text-xs text-secondary">
                            {s.is_booked ? 'Active Client Booking' : 'Hardware Maintenance Blackout'}
                          </span>
                        </td>

                        <td>
                          <StatusBadge
                            status={s.is_booked ? 'active' : 'maintenance'}
                            label={s.is_booked ? 'Booked' : 'Maintenance'}
                            size="sm"
                          />
                        </td>

                        {isStaff && (
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn-ui-icon text-danger"
                              onClick={() => handleDeleteSchedule(s.id)}
                              title="Remove schedule blackout"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Block Dates Modal */}
      <Modal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        title="Block Billboard Schedule"
        subtitle="Reserve dates for technical maintenance, repairs, or private holds"
        size="md"
        footer={
          <>
            <button
              type="button"
              className="btn-ui btn-ui-secondary btn-ui-sm"
              onClick={() => setShowBlockModal(false)}
              disabled={submittingBlock}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-ui btn-ui-primary btn-ui-sm"
              onClick={handleBlockDates}
              disabled={submittingBlock}
            >
              {submittingBlock ? 'Saving...' : 'Apply Blackout Lock'}
            </button>
          </>
        }
      >
        <form onSubmit={handleBlockDates}>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="form-group-ui">
                <label className="form-label-ui">Start Date <span className="form-required">*</span></label>
                <input
                  type="date"
                  className="form-input-ui"
                  value={blockFormData.start_date}
                  onChange={(e) => setBlockFormData({ ...blockFormData, start_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="form-group-ui">
                <label className="form-label-ui">End Date <span className="form-required">*</span></label>
                <input
                  type="date"
                  className="form-input-ui"
                  value={blockFormData.end_date}
                  onChange={(e) => setBlockFormData({ ...blockFormData, end_date: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AvailabilityPage;