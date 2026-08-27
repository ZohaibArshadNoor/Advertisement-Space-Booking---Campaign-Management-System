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
  RefreshCw,
  Search,
  UploadCloud,
  FileText
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

  // Financial Chart for Admin/Finance
  const financialData = {
    labels: ['Total Invoiced', 'Collected Revenue', 'Outstanding'],
    datasets: [
      {
        label: 'Amount (PKR Rs.)',
        data: [
          parseFloat(metrics.financials?.total_invoiced || 0),
          parseFloat(metrics.financials?.total_collected || 0),
          parseFloat(metrics.financials?.outstanding_balance || 0),
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
          <h1 className="page-title">
            {userRole === 'Advertiser' ? 'Advertiser Campaign Hub' : 'Operational Command Center'}
          </h1>
          <p className="page-subtitle">
            {userRole === 'Advertiser'
              ? `Welcome back, ${user?.name || 'Advertiser'}. Manage your billboard campaigns, space reservations, and billing.`
              : `Welcome back, ${user?.name || 'User'}. Here is your live ${userRole} summary.`}
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

      {/* ── Key Metrics Cards Row (Role-Scoped) ────────────────────────── */}
      <div className="row g-3 mb-4">
        {/* Metric 1 */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-enterprise p-3 h-100">
            <div className="d-flex align-items-center justify-content-between text-muted mb-2">
              <span className="text-xs fw-semibold text-uppercase tracking-wider">
                {userRole === 'Finance Officer'
                  ? 'Total Invoiced'
                  : userRole === 'Advertiser'
                  ? 'My Bookings'
                  : userRole === 'Sales Executive'
                  ? 'Active Campaigns'
                  : 'Inventory Spaces'}
              </span>
              {userRole === 'Finance Officer' ? (
                <CreditCard size={16} className="text-primary" />
              ) : userRole === 'Advertiser' ? (
                <Building2 size={16} className="text-primary" />
              ) : userRole === 'Sales Executive' ? (
                <Megaphone size={16} className="text-primary" />
              ) : (
                <Building2 size={16} className="text-primary" />
              )}
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="fs-4 fw-bold text-primary-emphasis">
                {userRole === 'Finance Officer'
                  ? `Rs. ${parseFloat(metrics.financials?.total_invoiced || 0).toLocaleString()}`
                  : userRole === 'Advertiser'
                  ? metrics.bookings?.total || 0
                  : userRole === 'Sales Executive'
                  ? metrics.campaigns?.active_campaigns || metrics.campaigns?.active || 0
                  : metrics.inventory?.total_spaces || 0}
              </span>
              {userRole === 'Advertiser' ? (
                <span className="badge bg-primary-subtle text-primary text-xs">
                  {metrics.bookings?.active || 0} active
                </span>
              ) : userRole === 'Finance Officer' ? (
                <span className="badge bg-primary-subtle text-primary text-xs">
                  Billed
                </span>
              ) : (
                <span className="badge bg-success-subtle text-success text-xs">
                  <TrendingUp size={12} className="me-1" /> Active
                </span>
              )}
            </div>
            <div className="text-muted small mt-1.5" style={{ fontSize: '0.75rem' }}>
              {userRole === 'Finance Officer'
                ? 'Total commercial receivables billed'
                : userRole === 'Advertiser'
                ? `${metrics.bookings?.pending || 0} pending confirmation`
                : userRole === 'Sales Executive'
                ? 'Strategic client campaigns running'
                : `${metrics.inventory?.available_spaces || 0} spaces ready for booking`}
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-enterprise p-3 h-100">
            <div className="d-flex align-items-center justify-content-between text-muted mb-2">
              <span className="text-xs fw-semibold text-uppercase tracking-wider">
                {userRole === 'Finance Officer'
                  ? 'Revenue Collected'
                  : userRole === 'Advertiser'
                  ? 'My Campaigns'
                  : userRole === 'Sales Executive'
                  ? 'Pending Bookings'
                  : 'Total Bookings'}
              </span>
              {userRole === 'Finance Officer' ? (
                <CheckCircle2 size={16} className="text-success" />
              ) : userRole === 'Advertiser' ? (
                <Megaphone size={16} className="text-primary" />
              ) : (
                <Layers size={16} className="text-primary" />
              )}
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="fs-4 fw-bold text-primary-emphasis">
                {userRole === 'Finance Officer'
                  ? `Rs. ${parseFloat(metrics.financials?.total_collected || 0).toLocaleString()}`
                  : userRole === 'Advertiser'
                  ? metrics.campaigns?.total || 0
                  : userRole === 'Sales Executive'
                  ? metrics.bookings?.pending_bookings || metrics.bookings?.pending || 0
                  : metrics.bookings?.total_bookings || metrics.bookings?.total || 0}
              </span>
              <span className={`badge ${userRole === 'Finance Officer' ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'} text-xs`}>
                {userRole === 'Finance Officer'
                  ? 'Settled'
                  : userRole === 'Advertiser'
                  ? `${metrics.campaigns?.active || 0} active`
                  : `${metrics.bookings?.pending_bookings || 0} pending`}
              </span>
            </div>
            <div className="text-muted small mt-1.5" style={{ fontSize: '0.75rem' }}>
              {userRole === 'Finance Officer'
                ? 'Verified bank & card settlements'
                : userRole === 'Advertiser'
                ? 'Targeted physical & digital campaigns'
                : 'Across all client accounts'}
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-enterprise p-3 h-100">
            <div className="d-flex align-items-center justify-content-between text-muted mb-2">
              <span className="text-xs fw-semibold text-uppercase tracking-wider">
                {userRole === 'Finance Officer'
                  ? 'Outstanding Balance'
                  : userRole === 'Advertiser'
                  ? 'Total Invoiced'
                  : 'Live Campaigns'}
              </span>
              {userRole === 'Finance Officer' || userRole === 'Advertiser' ? (
                <CreditCard size={16} className="text-warning" />
              ) : (
                <Megaphone size={16} className="text-primary" />
              )}
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="fs-4 fw-bold text-primary-emphasis">
                {userRole === 'Finance Officer'
                  ? `Rs. ${parseFloat(metrics.financials?.outstanding_balance || 0).toLocaleString()}`
                  : userRole === 'Advertiser'
                  ? `Rs. ${parseFloat(metrics.financials?.total_invoiced || 0).toLocaleString()}`
                  : metrics.campaigns?.active_campaigns || metrics.campaigns?.active || 0}
              </span>
            </div>
            <div className="text-muted small mt-1.5" style={{ fontSize: '0.75rem' }}>
              {userRole === 'Finance Officer'
                ? 'Pending client payment receipts'
                : userRole === 'Advertiser'
                ? `Rs. ${parseFloat(metrics.financials?.total_paid || 0).toLocaleString()} settled`
                : 'Across 5 target metropolitan zones'}
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-enterprise p-3 h-100">
            <div className="d-flex align-items-center justify-content-between text-muted mb-2">
              <span className="text-xs fw-semibold text-uppercase tracking-wider">
                {userRole === 'Finance Officer'
                  ? 'Unsettled Invoices'
                  : userRole === 'Advertiser'
                  ? 'Outstanding Balance'
                  : 'Platform Revenue'}
              </span>
              <CreditCard size={16} className="text-primary" />
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="fs-4 fw-bold text-primary-emphasis">
                {userRole === 'Finance Officer'
                  ? `${metrics.financials?.unsettled_invoices_count || 0} Invoices`
                  : userRole === 'Advertiser'
                  ? `Rs. ${parseFloat(metrics.financials?.outstanding_balance || 0).toLocaleString()}`
                  : `Rs. ${parseFloat(metrics.financials?.total_collected || 0).toLocaleString()}`}
              </span>
            </div>
            <div className="text-muted small mt-1.5" style={{ fontSize: '0.75rem' }}>
              {userRole === 'Finance Officer'
                ? 'Awaiting reconciliation or clearance'
                : userRole === 'Advertiser'
                ? 'Due on active campaign invoices'
                : 'Collected platform revenue ledger'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Operational Queue & Charts ──────────────────────────────────── */}
      {userRole === 'Advertiser' ? (
        <div className="row g-4 mb-4">
          {/* Advertiser Quick Action Hub */}
          <div className="col-12 col-lg-7">
            <div className="card-enterprise h-100">
              <div className="card-header-enterprise">
                <div className="d-flex align-items-center gap-2">
                  <Activity size={16} className="text-primary" />
                  <h3 className="card-title-enterprise">Advertiser Quick Actions</h3>
                </div>
                <span className="badge bg-primary-subtle text-primary text-xs">
                  Active Tools
                </span>
              </div>
              <div className="p-3">
                <div className="quick-actions-grid">
                  <Link
                    to="/spaces"
                    className="quick-action-card"
                  >
                    <div
                      className="quick-action-icon bg-primary-subtle text-primary"
                    >
                      <Search size={18} />
                    </div>
                    <div className="quick-action-content">
                      <div className="quick-action-title">
                        Browse Billboard Catalog
                      </div>
                      <div className="quick-action-desc">
                        Explore physical &amp; digital prime spaces
                      </div>
                    </div>
                  </Link>

                  <Link
                    to="/availability"
                    className="quick-action-card"
                  >
                    <div
                      className="quick-action-icon bg-success-subtle text-success"
                    >
                      <CalendarDays size={18} />
                    </div>
                    <div className="quick-action-content">
                      <div className="quick-action-title">
                        Check Live Availability
                      </div>
                      <div className="quick-action-desc">
                        Real-time space reservation calendar
                      </div>
                    </div>
                  </Link>

                  <Link
                    to="/campaigns"
                    className="quick-action-card"
                  >
                    <div
                      className="quick-action-icon bg-warning-subtle text-warning"
                    >
                      <Megaphone size={18} />
                    </div>
                    <div className="quick-action-content">
                      <div className="quick-action-title">
                        Launch New Campaign
                      </div>
                      <div className="quick-action-desc">
                        Define target dates and select locations
                      </div>
                    </div>
                  </Link>

                  <Link
                    to="/payments"
                    className="quick-action-card"
                  >
                    <div
                      className="quick-action-icon bg-purple-subtle text-purple"
                    >
                      <FileText size={18} />
                    </div>
                    <div className="quick-action-content">
                      <div className="quick-action-title">
                        Invoices &amp; Receipts
                      </div>
                      <div className="quick-action-desc">
                        View balance and payment receipts
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Network Billboard Inventory Snapshot */}
          <div className="col-12 col-lg-5">
            <div className="card-enterprise h-100">
              <div className="card-header-enterprise">
                <h3 className="card-title-enterprise">Network Inventory Allocation</h3>
                <Link to="/spaces" className="text-xs text-primary text-decoration-none fw-semibold">
                  Browse All
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
      ) : (
        /* Staff / Admin Dashboard View */
        <div className="row g-4 mb-4">
          <div className="col-12 col-lg-7">
            <div className="card-enterprise h-100">
              <div className="card-header-enterprise">
                <div className="d-flex align-items-center gap-2">
                  <AlertCircle size={16} className="text-warning" />
                  <h3 className="card-title-enterprise">Attention Required &amp; Action Items</h3>
                </div>
                <span className="badge bg-warning-subtle text-warning text-xs">
                  Operational Queue
                </span>
              </div>
              <div className="p-0">
                <div className="list-group list-group-flush border-0">
                  {userRole === 'Finance Officer' ? (
                    <>
                      <div className="list-group-item p-3 d-flex align-items-center justify-content-between gap-3 bg-transparent">
                        <div className="d-flex align-items-center" style={{ gap: '0.85rem', minWidth: 0 }}>
                          <div
                            className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                            style={{ width: '36px', height: '36px', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}
                          >
                            <CreditCard size={18} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-semibold text-xs text-primary-emphasis mb-0.5 text-truncate">
                              Commercial Invoices Awaiting Settlement
                            </div>
                            <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                              Review issued, overdue, and pending client invoices.
                            </div>
                          </div>
                        </div>
                        <Link to="/payments" className="btn-ui btn-ui-secondary btn-ui-sm flex-shrink-0 ms-2">
                          <span>Reconcile</span>
                          <ChevronRight size={12} />
                        </Link>
                      </div>

                      <div className="list-group-item p-3 d-flex align-items-center justify-content-between gap-3 bg-transparent">
                        <div className="d-flex align-items-center" style={{ gap: '0.85rem', minWidth: 0 }}>
                          <div
                            className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                            style={{ width: '36px', height: '36px', backgroundColor: 'rgba(22, 163, 74, 0.15)', color: '#16a34a' }}
                          >
                            <FileText size={18} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-semibold text-xs text-primary-emphasis mb-0.5 text-truncate">
                              Payment Settlements &amp; Ledger Logs
                            </div>
                            <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                              Verify client wire transfers, cheques, and credit receipts.
                            </div>
                          </div>
                        </div>
                        <Link to="/payments" className="btn-ui btn-ui-secondary btn-ui-sm flex-shrink-0 ms-2">
                          <span>View Ledger</span>
                          <ChevronRight size={12} />
                        </Link>
                      </div>
                    </>
                  ) : userRole === 'Creative Reviewer' ? (
                    <>
                      <div className="list-group-item p-3 d-flex align-items-center justify-content-between gap-3 bg-transparent">
                        <div className="d-flex align-items-center" style={{ gap: '0.85rem', minWidth: 0 }}>
                          <div
                            className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                            style={{ width: '36px', height: '36px', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}
                          >
                            <FileCheck size={18} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-semibold text-xs text-primary-emphasis mb-0.5 text-truncate">
                              Creative Assets Awaiting Review
                            </div>
                            <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                              Pending resolution &amp; content compliance verification.
                            </div>
                          </div>
                        </div>
                        <Link to="/creatives" className="btn-ui btn-ui-secondary btn-ui-sm flex-shrink-0 ms-2">
                          <span>Review</span>
                          <ChevronRight size={12} />
                        </Link>
                      </div>

                      <div className="list-group-item p-3 d-flex align-items-center justify-content-between gap-3 bg-transparent">
                        <div className="d-flex align-items-center" style={{ gap: '0.85rem', minWidth: 0 }}>
                          <div
                            className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                            style={{ width: '36px', height: '36px', backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#3b82f6' }}
                          >
                            <Layers size={18} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-semibold text-xs text-primary-emphasis mb-0.5 text-truncate">
                              Approved Campaign Media Library
                            </div>
                            <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                              Inspect live active artwork attached to flighted campaigns.
                            </div>
                          </div>
                        </div>
                        <Link to="/creatives" className="btn-ui btn-ui-secondary btn-ui-sm flex-shrink-0 ms-2">
                          <span>Inspect</span>
                          <ChevronRight size={12} />
                        </Link>
                      </div>
                    </>
                  ) : userRole === 'Space Manager' ? (
                    <>
                      <div className="list-group-item p-3 d-flex align-items-center justify-content-between gap-3 bg-transparent">
                        <div className="d-flex align-items-center" style={{ gap: '0.85rem', minWidth: 0 }}>
                          <div
                            className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                            style={{ width: '36px', height: '36px', backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#3b82f6' }}
                          >
                            <Layers size={18} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-semibold text-xs text-primary-emphasis mb-0.5 text-truncate">
                              Space Reservations Pending Approval
                            </div>
                            <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                              Inspect requested billboard dates and confirm space holds.
                            </div>
                          </div>
                        </div>
                        <Link to="/bookings" className="btn-ui btn-ui-secondary btn-ui-sm flex-shrink-0 ms-2">
                          <span>Inspect</span>
                          <ChevronRight size={12} />
                        </Link>
                      </div>

                      <div className="list-group-item p-3 d-flex align-items-center justify-content-between gap-3 bg-transparent">
                        <div className="d-flex align-items-center" style={{ gap: '0.85rem', minWidth: 0 }}>
                          <div
                            className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                            style={{ width: '36px', height: '36px', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}
                          >
                            <Building2 size={18} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-semibold text-xs text-primary-emphasis mb-0.5 text-truncate">
                              Block Maintenance &amp; Availability Schedule
                            </div>
                            <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                              Manage structural repairs, maintenance, and rate cards.
                            </div>
                          </div>
                        </div>
                        <Link to="/availability" className="btn-ui btn-ui-secondary btn-ui-sm flex-shrink-0 ms-2">
                          <span>Manage</span>
                          <ChevronRight size={12} />
                        </Link>
                      </div>
                    </>
                  ) : userRole === 'Sales Executive' ? (
                    <>
                      <div className="list-group-item p-3 d-flex align-items-center justify-content-between gap-3 bg-transparent">
                        <div className="d-flex align-items-center" style={{ gap: '0.85rem', minWidth: 0 }}>
                          <div
                            className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                            style={{ width: '36px', height: '36px', backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#3b82f6' }}
                          >
                            <Megaphone size={18} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-semibold text-xs text-primary-emphasis mb-0.5 text-truncate">
                              Campaign Pipeline &amp; Client Proposals
                            </div>
                            <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                              Review draft campaigns and activate approved flights.
                            </div>
                          </div>
                        </div>
                        <Link to="/campaigns" className="btn-ui btn-ui-secondary btn-ui-sm flex-shrink-0 ms-2">
                          <span>Campaigns</span>
                          <ChevronRight size={12} />
                        </Link>
                      </div>

                      <div className="list-group-item p-3 d-flex align-items-center justify-content-between gap-3 bg-transparent">
                        <div className="d-flex align-items-center" style={{ gap: '0.85rem', minWidth: 0 }}>
                          <div
                            className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                            style={{ width: '36px', height: '36px', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}
                          >
                            <Layers size={18} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-semibold text-xs text-primary-emphasis mb-0.5 text-truncate">
                              Pending Client Reservation Requests
                            </div>
                            <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                              Negotiate placements and confirm client booking slots.
                            </div>
                          </div>
                        </div>
                        <Link to="/bookings" className="btn-ui btn-ui-secondary btn-ui-sm flex-shrink-0 ms-2">
                          <span>Bookings</span>
                          <ChevronRight size={12} />
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Administrator panoramic view */}
                      <div className="list-group-item p-3 d-flex align-items-center justify-content-between gap-3 bg-transparent">
                        <div className="d-flex align-items-center" style={{ gap: '0.85rem', minWidth: 0 }}>
                          <div
                            className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                            style={{ width: '36px', height: '36px', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}
                          >
                            <FileCheck size={18} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-semibold text-xs text-primary-emphasis mb-0.5 text-truncate">
                              Creative Assets Awaiting Review
                            </div>
                            <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                              Pending resolution &amp; content compliance verification.
                            </div>
                          </div>
                        </div>
                        <Link to="/creatives" className="btn-ui btn-ui-secondary btn-ui-sm flex-shrink-0 ms-2">
                          <span>Review</span>
                          <ChevronRight size={12} />
                        </Link>
                      </div>

                      <div className="list-group-item p-3 d-flex align-items-center justify-content-between gap-3 bg-transparent">
                        <div className="d-flex align-items-center" style={{ gap: '0.85rem', minWidth: 0 }}>
                          <div
                            className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                            style={{ width: '36px', height: '36px', backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#3b82f6' }}
                          >
                            <Layers size={18} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-semibold text-xs text-primary-emphasis mb-0.5 text-truncate">
                              Booking Requests Pending Confirmation
                            </div>
                            <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                              Verify schedule overlaps and approve booking slots.
                            </div>
                          </div>
                        </div>
                        <Link to="/bookings" className="btn-ui btn-ui-secondary btn-ui-sm flex-shrink-0 ms-2">
                          <span>Inspect</span>
                          <ChevronRight size={12} />
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="card-enterprise h-100">
              <div className="card-header-enterprise">
                <h3 className="card-title-enterprise">Revenue &amp; Ledger Velocity</h3>
                <Link to="/payments" className="text-xs text-primary text-decoration-none fw-semibold">
                  Ledger
                </Link>
              </div>
              <div className="card-body-enterprise">
                <div style={{ height: '220px', width: '100%' }}>
                  <Bar data={financialData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;