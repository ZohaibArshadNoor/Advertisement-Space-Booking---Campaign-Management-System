import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { availabilityApi } from '../availabilityApi';
import { spacesApi } from '../../spaces/spacesApi';
import { useAuth } from '../../../context/AuthContext';

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
  ShieldAlert
} from 'lucide-react';

const AvailabilityPage = () => {
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

  // Block Dates Modal (Staff / Admin)
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockFormData, setBlockFormData] = useState({
    start_date: '',
    end_date: '',
    is_booked: false,
  });
  const [submittingBlock, setSubmittingBlock] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isStaff = user?.role === 'Administrator' || user?.role === 'Space Manager' || user?.role === 'Sales Executive';

  // Load spaces on mount
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
        setError('Failed to load advertising spaces list.');
      } finally {
        setSpacesLoading(false);
      }
    };
    fetchSpaces();
  }, []);

  // Fetch schedule whenever selectedSpaceId changes
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

  const selectedSpace = spaces.find((s) => s.id.toString() === selectedSpaceId);

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <CalendarDays className="text-primary" size={28} />
            Space Availability & Booking Calendar
          </h2>
          <p className="text-muted small mb-0">Inspect occupancy timelines, verify slot availability, and prevent scheduling collisions</p>
        </div>
        {isStaff && selectedSpaceId && (
          <button className="btn btn-outline-danger d-inline-flex align-items-center gap-1.5" onClick={() => setShowBlockModal(true)}>
            <Lock size={15} />
            <span>Block Dates (Maintenance)</span>
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger alert-dismissible">{error}</div>}
      {successMsg && <div className="alert alert-success alert-dismissible">{successMsg}</div>}

      {/* Space Selector Bar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-md-5">
              <label className="form-label small fw-semibold text-uppercase text-secondary">
                Select Advertising Space
              </label>
              {spacesLoading ? (
                <div className="spinner-border spinner-border-sm text-primary"></div>
              ) : (
                <select
                  className="form-select"
                  value={selectedSpaceId}
                  onChange={(e) => setSelectedSpaceId(e.target.value)}
                >
                  {spaces.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.city || s.location?.city || 'City'} (${s.daily_rate}/day)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedSpace && (
              <div className="col-md-7">
                <div className="p-2 border rounded bg-light d-flex justify-content-between align-items-center">
                  <div>
                    <span className="fw-bold">{selectedSpace.name}</span>
                    <small className="text-muted d-block">{selectedSpace.location?.address || selectedSpace.category?.name || 'Billboard'}</small>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-primary fs-6">${selectedSpace.daily_rate}/day</span>
                    <small className="text-muted d-block">{selectedSpace.dimensions || 'Standard Size'}</small>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collision & Availability Checker */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white py-3 border-bottom">
          <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
            <Search size={18} className="text-primary" />
            Live Date Range Availability Checker
          </h5>
        </div>
        <div className="card-body">
          <form className="row g-3 align-items-end" onSubmit={handleCheckAvailability}>
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Target Start Date *</label>
              <input
                type="date"
                className="form-control"
                required
                value={checkStartDate}
                onChange={(e) => setCheckStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Target End Date *</label>
              <input
                type="date"
                className="form-control"
                required
                value={checkEndDate}
                onChange={(e) => setCheckEndDate(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <button type="submit" className="btn btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2" disabled={checking}>
                <Search size={16} />
                {checking ? 'Checking Collisions...' : 'Check Availability'}
              </button>
            </div>
          </form>

          {/* Checker Result Display */}
          {checkResult && (
            <div className={`mt-3 p-3 rounded border ${checkResult.available ? 'bg-success-subtle border-success' : 'bg-danger-subtle border-danger'}`}>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-start gap-2">
                  {checkResult.available ? (
                    <CheckCircle2 className="text-success mt-0.5" size={20} />
                  ) : (
                    <AlertTriangle className="text-danger mt-0.5" size={20} />
                  )}
                  <div>
                    <h6 className={`fw-bold mb-1 ${checkResult.available ? 'text-success' : 'text-danger'}`}>
                      {checkResult.available ? 'Available for Reservation' : 'Conflict Detected / Unavailable'}
                    </h6>
                    <p className="small mb-0 text-dark">{checkResult.message}</p>
                  </div>
                </div>
                {checkResult.available && (
                  <Link to="/bookings" className="btn btn-sm btn-success d-inline-flex align-items-center gap-1">
                    <span>Book Space Now</span>
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Existing Schedules Timeline Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">📅 Occupancy & Blocked Schedule Timeline</h5>
          <span className="badge bg-secondary">{schedules.length} Scheduled Slot(s)</span>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
              <p className="text-muted mt-2">Loading schedules...</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-5">
              <h5>No active bookings or blocks for this space</h5>
              <p className="text-muted small">This advertising space is 100% open for reservations!</p>
              <Link to="/bookings" className="btn btn-primary btn-sm">
                Reserve Space Now
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Schedule Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Duration</th>
                    <th>Status</th>
                    {isStaff && <th className="text-end">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => {
                    const start = new Date(s.start_date);
                    const end = new Date(s.end_date);
                    const days = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
                    return (
                      <tr key={s.id}>
                        <td>
                          <span className="fw-bold">
                            {s.is_booked ? '📢 Active Campaign Reservation' : '🔒 Maintenance / VIP Hold'}
                          </span>
                        </td>
                        <td><code>{s.start_date}</code></td>
                        <td><code>{s.end_date}</code></td>
                        <td><span className="badge bg-light text-dark border">{days} Day(s)</span></td>
                        <td>
                          <span className={`badge ${s.is_booked ? 'bg-danger' : 'bg-warning text-dark'}`}>
                            {s.is_booked ? 'Occupied' : 'Blocked'}
                          </span>
                        </td>
                        {isStaff && (
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteSchedule(s.id)}
                            >
                              Remove Slot
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Block Dates Modal */}
      {showBlockModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Block Space Schedule</h5>
                <button type="button" className="btn-close" onClick={() => setShowBlockModal(false)}></button>
              </div>
              <form onSubmit={handleBlockDates}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Space</label>
                    <input
                      type="text"
                      className="form-control"
                      disabled
                      value={selectedSpace?.name || 'Selected Space'}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Start Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={blockFormData.start_date}
                      onChange={(e) => setBlockFormData({ ...blockFormData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">End Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={blockFormData.end_date}
                      onChange={(e) => setBlockFormData({ ...blockFormData, end_date: e.target.value })}
                    />
                  </div>
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="isBookedCheck"
                      checked={blockFormData.is_booked}
                      onChange={(e) => setBlockFormData({ ...blockFormData, is_booked: e.target.checked })}
                    />
                    <label className="form-check-label small" htmlFor="isBookedCheck">
                      Mark as Booked (Otherwise marked as Maintenance Hold)
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowBlockModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger" disabled={submittingBlock}>
                    {submittingBlock ? 'Saving...' : 'Block Dates'}
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

export default AvailabilityPage;