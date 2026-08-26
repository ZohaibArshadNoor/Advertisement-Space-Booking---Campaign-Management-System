import React, { useState } from 'react';
import {
  Sliders,
  ShieldCheck,
  Globe,
  Mail,
  Database,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
  Server
} from 'lucide-react';

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'booking' | 'notifications' | 'system'
  const [savedFeedback, setSavedFeedback] = useState(false);

  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'AdFlow Enterprise Advertising Network',
    supportEmail: 'ops@adflow.com',
    defaultCurrency: 'PKR (Rs.)',
    timezone: 'Asia/Karachi (UTC+5)',
    enablePublicRegistration: true,
  });

  const [bookingSettings, setBookingSettings] = useState({
    pessimisticLockTimeoutSeconds: 30,
    maxAdvanceBookingDays: 365,
    minBookingDurationDays: 1,
    autoCancelUnpaidHours: 48,
    requireCreativeReviewBeforeBroadcast: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Configuration &amp; Settings</h1>
          <p className="page-subtitle">
            Configure system parameters, booking locking rules, regional formats, and operational thresholds.
          </p>
        </div>
      </div>

      {savedFeedback && (
        <div className="alert-ui alert-success mb-4">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <div className="flex-grow-1 text-xs">
            System configuration parameters saved and active across all nodes.
          </div>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="d-flex gap-2 border-bottom mb-4 pb-2">
        <button
          type="button"
          className={`btn-ui btn-ui-sm ${activeTab === 'general' ? 'btn-ui-primary' : 'btn-ui-secondary'}`}
          onClick={() => setActiveTab('general')}
        >
          <Globe size={14} />
          <span>General &amp; Regional</span>
        </button>
        <button
          type="button"
          className={`btn-ui btn-ui-sm ${activeTab === 'booking' ? 'btn-ui-primary' : 'btn-ui-secondary'}`}
          onClick={() => setActiveTab('booking')}
        >
          <Lock size={14} />
          <span>Booking &amp; Collision Rules</span>
        </button>
        <button
          type="button"
          className={`btn-ui btn-ui-sm ${activeTab === 'system' ? 'btn-ui-primary' : 'btn-ui-secondary'}`}
          onClick={() => setActiveTab('system')}
        >
          <Server size={14} />
          <span>Service Health &amp; Database</span>
        </button>
      </div>

      {/* Tab 1: General */}
      {activeTab === 'general' && (
        <div className="card-enterprise p-4" style={{ maxWidth: '780px' }}>
          <form onSubmit={handleSave}>
            <div className="form-group-ui">
              <label className="form-label-ui">Platform Brand Name</label>
              <input
                type="text"
                className="form-input-ui"
                value={generalSettings.platformName}
                onChange={(e) => setGeneralSettings({ ...generalSettings, platformName: e.target.value })}
              />
            </div>

            <div className="form-group-ui">
              <label className="form-label-ui">Operational Support Email</label>
              <input
                type="email"
                className="form-input-ui"
                value={generalSettings.supportEmail}
                onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
              />
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div className="form-group-ui">
                  <label className="form-label-ui">Base Billing Currency</label>
                  <select
                    className="form-select-ui"
                    value={generalSettings.defaultCurrency}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, defaultCurrency: e.target.value })}
                  >
                    <option>USD ($)</option>
                    <option>PKR (Rs.)</option>
                    <option>AED (د.إ)</option>
                    <option>EUR (€)</option>
                  </select>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="form-group-ui">
                  <label className="form-label-ui">System Timezone</label>
                  <select
                    className="form-select-ui"
                    value={generalSettings.timezone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                  >
                    <option>Asia/Karachi (UTC+5)</option>
                    <option>Asia/Dubai (UTC+4)</option>
                    <option>America/New_York (UTC-5)</option>
                    <option>UTC (UTC+0)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group-ui mb-4">
              <label className="d-flex align-items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="form-check-input mt-0"
                  checked={generalSettings.enablePublicRegistration}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, enablePublicRegistration: e.target.checked })}
                />
                <span className="text-xs text-primary-emphasis fw-semibold">
                  Allow public advertiser registration via signup portal
                </span>
              </label>
              <span className="form-helper-text ms-4">
                When disabled, only administrators can provision new accounts.
              </span>
            </div>

            <button type="submit" className="btn-ui btn-ui-primary btn-ui-sm">
              <Save size={14} />
              <span>Save General Settings</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Booking Rules */}
      {activeTab === 'booking' && (
        <div className="card-enterprise p-4" style={{ maxWidth: '780px' }}>
          <form onSubmit={handleSave}>
            <div className="form-group-ui">
              <label className="form-label-ui">
                Pessimistic Locking Collision Timeout (seconds)
              </label>
              <input
                type="number"
                className="form-input-ui font-monospace"
                value={bookingSettings.pessimisticLockTimeoutSeconds}
                onChange={(e) => setBookingSettings({ ...bookingSettings, pessimisticLockTimeoutSeconds: Number(e.target.value) })}
              />
              <span className="form-helper-text">
                Maximum duration a database row lock is held while verifying date collisions across concurrent sessions.
              </span>
            </div>

            <div className="row g-3">
              <div className="col-6">
                <div className="form-group-ui">
                  <label className="form-label-ui">Max Advance Booking Window (Days)</label>
                  <input
                    type="number"
                    className="form-input-ui"
                    value={bookingSettings.maxAdvanceBookingDays}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, maxAdvanceBookingDays: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="form-group-ui">
                  <label className="form-label-ui">Auto-Cancel Unpaid Reservations (Hours)</label>
                  <input
                    type="number"
                    className="form-input-ui"
                    value={bookingSettings.autoCancelUnpaidHours}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, autoCancelUnpaidHours: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="form-group-ui mb-4">
              <label className="d-flex align-items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="form-check-input mt-0"
                  checked={bookingSettings.requireCreativeReviewBeforeBroadcast}
                  onChange={(e) => setBookingSettings({ ...bookingSettings, requireCreativeReviewBeforeBroadcast: e.target.checked })}
                />
                <span className="text-xs text-primary-emphasis fw-semibold">
                  Mandatory Creative Content Verification
                </span>
              </label>
              <span className="form-helper-text ms-4">
                Require Creative Reviewer approval before ads can be streamed to digital billboard hardware.
              </span>
            </div>

            <button type="submit" className="btn-ui btn-ui-primary btn-ui-sm">
              <Save size={14} />
              <span>Save Booking Parameters</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: System Health */}
      {activeTab === 'system' && (
        <div className="card-enterprise p-4" style={{ maxWidth: '780px' }}>
          <h4 className="fw-bold text-sm text-primary-emphasis mb-3">Service Health Diagnostics</h4>
          <div className="d-flex flex-column gap-3">
            <div className="p-3 rounded bg-subtle border d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-semibold text-xs text-primary-emphasis">PostgreSQL Primary Database</div>
                <div className="text-muted text-xs">Connected • Dialect: postgresql+psycopg2</div>
              </div>
              <span className="badge bg-success-subtle text-success text-xs">Healthy (1.2ms)</span>
            </div>

            <div className="p-3 rounded bg-subtle border d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-semibold text-xs text-primary-emphasis">JWT Authentication Subsystem</div>
                <div className="text-muted text-xs">Algorithm: HS256 • Access Token Expiry: 60 min</div>
              </div>
              <span className="badge bg-success-subtle text-success text-xs">Active</span>
            </div>

            <div className="p-3 rounded bg-subtle border d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-semibold text-xs text-primary-emphasis">Background Notification Dispatcher</div>
                <div className="text-muted text-xs">Async Task Worker • Polling Interval: 30s</div>
              </div>
              <span className="badge bg-success-subtle text-success text-xs">Running</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
