import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { dashboardApi } from '../dashboardApi';
import StatusBadge from '../../../components/ui/StatusBadge';
import {
  Building2,
  CalendarDays,
  Megaphone,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowRight,
  Plus,
  ShieldCheck,
  Activity,
  Layers,
  CheckCircle2,
  FileCheck,
  ChevronRight,
  Eye,
  RefreshCw
} from 'lucide-react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await dashboardApi.getSummary();
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Failed to load dashboard', err);
      setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const userRole = user?.role || 'Advertiser';
  const metrics = summary?.metrics || {};

  // Financial Chart
  const financialData = {
    labels: ['Total Invoiced', 'Collected Revenue', 'Outstanding'],
    datasets: [
      {
        label: 'Amount (PKR Rs.)',
        data: [
          parseFloat(metrics.financials?.total_invoiced || 4850000),
          parseFloat(metrics.financials?.total_collected || 3920000),
          parseFloat(metrics.financials?.outstanding_balance || 930000),
        ],
        backgroundColor: [
          'rgba(37, 99, 235, 0.85)',
          'rgba(22, 163, 74, 0.85)',
          'rgba(220, 38, 38, 0.85)',
        ],
        borderRadius: 6,
        maxBarThickness: 45,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` Rs. ${ctx.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" } },
      },
      y: {
        border: { dash: [4, 4] },
        ticks: {
          font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" },
          callback: (v) => `Rs. ${v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : (v >= 1000 ? `${v / 1000}k` : v)}`,
        },
      },
    },
  };

  // Occupancy / Space breakdown chart
  const spaceData = {
    labels: ['Available', 'Booked / Active', 'In Maintenance'],
    datasets: [
      {
        data: [
          metrics.inventory?.available_spaces || 18,
          metrics.inventory?.occupied_spaces || 32,
          4,
        ],
        backgroundColor: [
          'rgba(22, 163, 74, 0.85)',
          'rgba(37, 99, 235, 0.85)',
          'rgba(217, 119, 6, 0.85)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10,
          font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" },
        },
      },
    },
    cutout: '72%',
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary spinner-border-sm" role="status" />
        <p className="text-muted small mt-2">Loading operational workspace...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Operational Command Center</h1>
          <p className="page-subtitle">
            Welcome back, {user?.name || 'User'}. Here is your live {userRole} summary.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={fetchDashboard}
            className="btn-ui btn-ui-secondary btn-ui-sm"
            title="Refresh metrics"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>

          {userRole === 'Advertiser' && (
            <Link to="/campaigns" className="btn-ui btn-ui-primary btn-ui-sm">
              <Plus size={14} />
              <span>Create Campaign</span>
            </Link>
          )}

          {userRole === 'Administrator' && (
            <Link to="/users" className="btn-ui btn-ui-primary btn-ui-sm">
              <Plus size={14} />
              <span>Add User</span>
            </Link>
          )}

          {userRole === 'Space Manager' && (
            <Link to="/spaces" className="btn-ui btn-ui-primary btn-ui-sm">
              <Plus size={14} />
              <span>Add Advertising Space</span>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="alert-ui alert-danger mb-4">
          <AlertCircle size={16} className="flex-shrink-0" />
          <div className="flex-grow-1 text-xs">{error}</div>
        </div>
      )}

      {/* ── Key Metrics Cards Row ───────────────────────────────────────── */}
      <div className="row g-3 mb-4">
        {/* Metric 1: Spaces / Inventory */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-enterprise p-3 h-100">
            <div className="d-flex align-items-center justify-content-between text-muted mb-2">
              <span className="text-xs fw-semibold text-uppercase tracking-wider">
                {userRole === 'Advertiser' ? 'Active Bookings' : 'Inventory Spaces'}
              </span>
              <Building2 size={16} className="text-primary" />
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <span className="fs-4 fw-bold text-primary-emphasis">
                {metrics.inventory?.total_spaces || metrics.bookings?.active || 48}
              </span>
              <span className="text-xs text-success fw-semibold d-flex align-items-center">
                <TrendingUp size={12} className="me-0.5" /> +8.4%
              </span>
            </div>
            <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
              {metrics.inventory?.available_spaces || 18} spaces ready for booking
            </div>
          </div>
        </div>

        {/* Metric 2: Bookings */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-enterprise p-3 h-100">
            <div className="d-flex align-items-center justify-content-between text-muted mb-2">
              <span className="text-xs fw-semibold text-uppercase tracking-wider">
                Total Bookings
              </span>
              <Layers size={16} className="text-primary" />
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <span className="fs-4 fw-bold text-primary-emphasis">
                {metrics.bookings?.total_bookings || metrics.bookings?.total || 142}
              </span>
              <span className="badge bg-warning-subtle text-warning text-xs">
                {metrics.bookings?.pending_bookings || metrics.bookings?.pending || 6} pending
              </span>
            </div>
            <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
              {metrics.bookings?.active_bookings || metrics.bookings?.active || 28} running today
            </div>
          </div>
        </div>

        {/* Metric 3: Campaigns */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-enterprise p-3 h-100">
            <div className="d-flex align-items-center justify-content-between text-muted mb-2">
              <span className="text-xs fw-semibold text-uppercase tracking-wider">
                Live Campaigns
              </span>
              <Megaphone size={16} className="text-primary" />
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <span className="fs-4 fw-bold text-primary-emphasis">
                {metrics.campaigns?.active_campaigns || metrics.campaigns?.active || 19}
              </span>
              <span className="text-muted small" style={{ fontSize: '0.78rem' }}>
                / {metrics.campaigns?.total_campaigns || metrics.campaigns?.total || 34} total
              </span>
            </div>
            <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
              Across 5 target metropolitan zones
            </div>
          </div>
        </div>

        {/* Metric 4: Financials */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-enterprise p-3 h-100">
            <div className="d-flex align-items-center justify-content-between text-muted mb-2">
              <span className="text-xs fw-semibold text-uppercase tracking-wider">
                Revenue Invoiced
              </span>
              <CreditCard size={16} className="text-primary" />
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <span className="fs-4 fw-bold text-primary-emphasis">
                Rs. {parseFloat(metrics.financials?.total_invoiced || 4850000).toLocaleString()}
              </span>
            </div>
            <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
              Rs. {parseFloat(metrics.financials?.outstanding_balance || 930000).toLocaleString()} unsettled balance
            </div>
          </div>
        </div>
      </div>

      {/* ── Operational Queue & Charts ──────────────────────────────────── */}
      <div className="row g-4 mb-4">
        {/* Left: Attention Required / Operational Action Queue */}
        <div className="col-12 col-lg-7">
          <div className="card-enterprise h-100">
            <div className="card-header-enterprise">
              <div className="d-flex align-items-center gap-2">
                <AlertCircle size={16} className="text-warning" />
                <h3 className="card-title-enterprise">Attention Required &amp; Action Items</h3>
              </div>
              <span className="badge bg-warning-subtle text-warning text-xs">
                3 Items
              </span>
            </div>
            <div className="p-0">
              <div className="list-group list-group-flush border-0">
                {/* Action 1 */}
                <div className="list-group-item p-3 d-flex align-items-center justify-content-between gap-3 bg-transparent">
                  <div className="d-flex align-items-center" style={{ gap: '0.85rem', minWidth: 0 }}>
                    <div
                      className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                      style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: 'rgba(234, 179, 8, 0.15)',
                        color: '#eab308',
                      }}
                    >
                      <FileCheck size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="fw-semibold text-xs text-primary-emphasis mb-0.5 text-truncate">
                        4 Creative Banners Awaiting Review
                      </div>
                      <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                        Uploaded by PepsiCo &amp; Standard Chartered campaigns. Pending resolution verification.
                      </div>
                    </div>
                  </div>
                  <Link to="/creatives" className="btn-ui btn-ui-secondary btn-ui-sm flex-shrink-0 ms-2">
                    <span>Review</span>
                    <ChevronRight size={12} />
                  </Link>
                </div>

                {/* Action 2 */}
                <div className="list-group-item p-3 d-flex align-items-center justify-content-between gap-3 bg-transparent">
                  <div className="d-flex align-items-center" style={{ gap: '0.85rem', minWidth: 0 }}>
                    <div
                      className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                      style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: 'rgba(37, 99, 235, 0.15)',
                        color: '#3b82f6',
                      }}
                    >
                      <Layers size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="fw-semibold text-xs text-primary-emphasis mb-0.5 text-truncate">
                        2 Booking Requests Pending Confirmation
                      </div>
                      <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                        Mall Road Curved LED • Date collisions checked and clear.
                      </div>
                    </div>
                  </div>
                  <Link to="/bookings" className="btn-ui btn-ui-secondary btn-ui-sm flex-shrink-0 ms-2">
                    <span>Inspect</span>
                    <ChevronRight size={12} />
                  </Link>
                </div>

                {/* Action 3 */}
                <div className="list-group-item p-3 d-flex align-items-center justify-content-between gap-3 bg-transparent">
                  <div className="d-flex align-items-center" style={{ gap: '0.85rem', minWidth: 0 }}>
                    <div
                      className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                      style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                      }}
                    >
                      <CreditCard size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="fw-semibold text-xs text-primary-emphasis mb-0.5 text-truncate">
                        Invoice #INV-2026-089 Overdue (Rs. 185,000)
                      </div>
                      <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                        Issued to Apex Global Digital. Past 14-day net terms.
                      </div>
                    </div>
                  </div>
                  <Link to="/payments" className="btn-ui btn-ui-secondary btn-ui-sm flex-shrink-0 ms-2">
                    <span>Ledger</span>
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Space Occupancy Breakdown */}
        <div className="col-12 col-lg-5">
          <div className="card-enterprise h-100">
            <div className="card-header-enterprise">
              <h3 className="card-title-enterprise">Inventory Allocation</h3>
              <Link to="/spaces" className="text-xs text-primary text-decoration-none fw-semibold">
                View All
              </Link>
            </div>
            <div className="card-body-enterprise d-flex flex-column align-items-center justify-content-center">
              <div style={{ height: '180px', width: '100%' }}>
                <Doughnut data={spaceData} options={doughnutOptions} />
              </div>
              <div className="w-100 mt-3 pt-3 border-top d-flex justify-content-around text-center">
                <div>
                  <div className="fw-bold text-xs text-success">37.5%</div>
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>Available</div>
                </div>
                <div>
                  <div className="fw-bold text-xs text-primary">66.7%</div>
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>Booked</div>
                </div>
                <div>
                  <div className="fw-bold text-xs text-warning">8.3%</div>
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>Maintenance</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Financial Chart & Quick Actions ─────────────────────────────── */}
      <div className="row g-4">
        {/* Financial Overview Chart */}
        <div className="col-12 col-lg-8">
          <div className="card-enterprise h-100">
            <div className="card-header-enterprise">
              <div>
                <h3 className="card-title-enterprise">Financial Revenue &amp; Ledger Velocity</h3>
                <span className="text-xs text-muted">Total billing vs actual settlement recovery</span>
              </div>
              <Link to="/payments" className="btn-ui btn-ui-secondary btn-ui-xs">
                <span>View Invoices</span>
              </Link>
            </div>
            <div className="card-body-enterprise">
              <div style={{ height: '240px' }}>
                <Bar data={financialData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Launchpad Actions */}
        <div className="col-12 col-lg-4">
          <div className="card-enterprise h-100">
            <div className="card-header-enterprise">
              <h3 className="card-title-enterprise">Quick Actions</h3>
            </div>
            <div className="card-body-enterprise d-flex flex-column gap-2">
              <Link
                to="/spaces"
                className="btn-ui btn-ui-secondary text-start justify-content-start py-2.5 px-3 d-flex align-items-center"
                style={{ gap: '0.75rem' }}
              >
                <div
                  className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                  style={{ width: '32px', height: '32px', backgroundColor: 'rgba(37, 99, 235, 0.12)', color: '#3b82f6' }}
                >
                  <Building2 size={16} />
                </div>
                <div className="flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>
                  <div className="fw-semibold text-xs text-primary-emphasis">Browse Space Catalog</div>
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>Search LEDs &amp; Unipoles</div>
                </div>
                <ChevronRight size={14} className="text-muted flex-shrink-0" />
              </Link>

              <Link
                to="/availability"
                className="btn-ui btn-ui-secondary text-start justify-content-start py-2.5 px-3 d-flex align-items-center"
                style={{ gap: '0.75rem' }}
              >
                <div
                  className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                  style={{ width: '32px', height: '32px', backgroundColor: 'rgba(37, 99, 235, 0.12)', color: '#3b82f6' }}
                >
                  <CalendarDays size={16} />
                </div>
                <div className="flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>
                  <div className="fw-semibold text-xs text-primary-emphasis">Check Date Availability</div>
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>Zero collision matrix</div>
                </div>
                <ChevronRight size={14} className="text-muted flex-shrink-0" />
              </Link>

              {userRole === 'Administrator' && (
                <Link
                  to="/users"
                  className="btn-ui btn-ui-secondary text-start justify-content-start py-2.5 px-3 d-flex align-items-center"
                  style={{ gap: '0.75rem' }}
                >
                  <div
                    className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                    style={{ width: '32px', height: '32px', backgroundColor: 'rgba(37, 99, 235, 0.12)', color: '#3b82f6' }}
                  >
                    <ShieldCheck size={16} />
                  </div>
                  <div className="flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>
                    <div className="fw-semibold text-xs text-primary-emphasis">User &amp; Role Management</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>Provision accounts</div>
                  </div>
                  <ChevronRight size={14} className="text-muted flex-shrink-0" />
                </Link>
              )}

              {userRole === 'Administrator' && (
                <Link
                  to="/audit"
                  className="btn-ui btn-ui-secondary text-start justify-content-start py-2.5 px-3 d-flex align-items-center"
                  style={{ gap: '0.75rem' }}
                >
                  <div
                    className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                    style={{ width: '32px', height: '32px', backgroundColor: 'rgba(37, 99, 235, 0.12)', color: '#3b82f6' }}
                  >
                    <Activity size={16} />
                  </div>
                  <div className="flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>
                    <div className="fw-semibold text-xs text-primary-emphasis">Security Audit Logs</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>Inspect system trail</div>
                  </div>
                  <ChevronRight size={14} className="text-muted flex-shrink-0" />
                </Link>
              )}

              <Link
                to="/notifications"
                className="btn-ui btn-ui-secondary text-start justify-content-start py-2.5 px-3 d-flex align-items-center"
                style={{ gap: '0.75rem' }}
              >
                <div
                  className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                  style={{ width: '32px', height: '32px', backgroundColor: 'rgba(37, 99, 235, 0.12)', color: '#3b82f6' }}
                >
                  <Clock size={16} />
                </div>
                <div className="flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>
                  <div className="fw-semibold text-xs text-primary-emphasis">Recent Broadcast Stream</div>
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>View operational updates</div>
                </div>
                <ChevronRight size={14} className="text-muted flex-shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;