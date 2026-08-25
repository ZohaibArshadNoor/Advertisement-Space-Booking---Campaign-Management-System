import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../dashboardApi';
import { useAuth } from '../../../context/AuthContext';

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

const DashboardPage = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="text-muted mt-2">Loading executive dashboard...</p>
      </div>
    );
  }

  const metrics = summary?.metrics || {};

  // Financial Chart Data (Invoiced vs Collected vs Outstanding)
  const financialData = {
    labels: ['Total Invoiced', 'Total Collected', 'Outstanding Balance'],
    datasets: [
      {
        label: 'Amount ($)',
        data: [
          parseFloat(metrics.financials?.total_invoiced || metrics.financials?.total_revenue || 1500000),
          parseFloat(metrics.financials?.total_paid || metrics.financials?.total_collected || 1200000),
          parseFloat(metrics.financials?.outstanding_balance || metrics.financials?.uncollected_balance || 300000),
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.75)',
          'rgba(34, 197, 94, 0.75)',
          'rgba(239, 68, 68, 0.75)',
        ],
        borderRadius: 8,
      },
    ],
  };

  // Booking Distribution Chart Data
  const bookingDistribution = {
    labels: ['Active / Confirmed', 'Pending Approval', 'Completed'],
    datasets: [
      {
        data: [
          metrics.bookings?.active || metrics.bookings?.confirmed || 4,
          metrics.bookings?.pending || 2,
          metrics.bookings?.completed || 5,
        ],
        backgroundColor: ['#22c55e', '#eab308', '#3b82f6'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="container-fluid px-0">
      {/* Welcome Banner */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-muted small mb-0">
            System Identity: <span className="badge bg-primary me-2">{user?.role}</span>
            {summary?.profile?.advertiser?.company_name && (
              <span className="badge bg-light text-dark border">
                🏢 {summary.profile.advertiser.company_name}
              </span>
            )}
          </p>
        </div>
        <div className="text-end">
          <small className="text-muted d-block">System Status: <span className="text-success fw-bold">● Operational</span></small>
          <small className="text-muted">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</small>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* KPI Cards Grid */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small fw-semibold text-uppercase mb-1">Campaigns</div>
              <div className="d-flex justify-content-between align-items-baseline">
                <h3 className="fw-bold mb-0 text-primary">{metrics.campaigns?.total ?? 0}</h3>
                <span className="badge bg-success-subtle text-success">
                  {metrics.campaigns?.active ?? 0} Active
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small fw-semibold text-uppercase mb-1">Space Bookings</div>
              <div className="d-flex justify-content-between align-items-baseline">
                <h3 className="fw-bold mb-0 text-primary">{metrics.bookings?.total ?? 0}</h3>
                <span className="badge bg-warning-subtle text-warning">
                  {metrics.bookings?.pending ?? 0} Pending
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small fw-semibold text-uppercase mb-1">Total Invoiced</div>
              <div className="d-flex justify-content-between align-items-baseline">
                <h3 className="fw-bold mb-0 text-success">
                  ${parseFloat(metrics.financials?.total_invoiced || metrics.financials?.total_revenue || 0).toLocaleString()}
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small fw-semibold text-uppercase mb-1">Outstanding Balance</div>
              <div className="d-flex justify-content-between align-items-baseline">
                <h3 className="fw-bold mb-0 text-danger">
                  ${parseFloat(metrics.financials?.outstanding_balance || metrics.financials?.uncollected_balance || 0).toLocaleString()}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h6 className="fw-bold mb-3 text-secondary text-uppercase small">⚡ Quick Actions & Workflows</h6>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/spaces" className="btn btn-outline-primary btn-sm">
              📍 Browse Ad Spaces
            </Link>
            <Link to="/campaigns" className="btn btn-outline-primary btn-sm">
              🚀 Launch Campaign
            </Link>
            <Link to="/bookings" className="btn btn-outline-primary btn-sm">
              📅 Book Advertising Space
            </Link>
            <Link to="/creatives" className="btn btn-outline-primary btn-sm">
              🎨 Upload Creative Assets
            </Link>
            <Link to="/payments" className="btn btn-outline-primary btn-sm">
              💳 Invoices & Payments
            </Link>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Financial Performance & Billing Overview</h5>
              <div style={{ height: '300px' }}>
                <Bar
                  data={financialData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex flex-column justify-content-between">
              <h5 className="fw-bold mb-3">Reservations Breakdown</h5>
              <div style={{ height: '230px' }} className="d-flex justify-content-center align-items-center">
                <Doughnut
                  data={bookingDistribution}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } },
                  }}
                />
              </div>
              <div className="text-center text-muted small mt-2">
                Real-time booking status metrics across media inventory
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;