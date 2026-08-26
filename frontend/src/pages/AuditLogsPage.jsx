import React, { useState, useEffect } from 'react';
import { adminApi } from '../features/admin/adminApi';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import {
  Activity,
  Search,
  Filter,
  Eye,
  RefreshCw,
  AlertCircle,
  Shield,
  Clock,
  User,
  FileCode,
  ArrowRight
} from 'lucide-react';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getAuditLogs({ per_page: 100 });
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs', err);
      setError(err.response?.data?.message || 'Failed to load audit trail records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    const actorName = l.actor_name || l.user_name || l.actor || 'System';
    const actionName = l.action || '';
    const entityType = l.entity_type || l.entity || '';
    const userEmail = l.user_email || '';

    const matchesSearch =
      actorName.toLowerCase().includes(search.toLowerCase()) ||
      userEmail.toLowerCase().includes(search.toLowerCase()) ||
      actionName.toLowerCase().includes(search.toLowerCase()) ||
      entityType.toLowerCase().includes(search.toLowerCase()) ||
      String(l.id).includes(search) ||
      String(l.entity_id || '').includes(search);

    const matchesAction =
      actionFilter === 'ALL' || actionName === actionFilter || actionName.includes(actionFilter);

    return matchesSearch && matchesAction;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Security &amp; Operational Audit Trail</h1>
          <p className="page-subtitle">
            Immutable system activity log tracking user authentication, state mutations, and access events.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={fetchLogs}
            className="btn-ui btn-ui-secondary btn-ui-sm"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="toolbar-ui">
        <div className="toolbar-search">
          <Search size={15} className="toolbar-search-icon" />
          <input
            type="text"
            className="toolbar-search-input"
            placeholder="Search by actor, action keyword, or entity..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="toolbar-filters">
          <select
            className="form-select-ui"
            style={{ width: 'auto', fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">All Actions</option>
            <option value="UPDATE_STATUS">Status Changes (Activate/Deactivate)</option>
            <option value="CREATE">Creation Operations</option>
            <option value="UPDATE">Updates &amp; Edits</option>
            <option value="DELETE">Deletions</option>
            <option value="LOGIN">Authentication</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card-enterprise">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary spinner-border-sm" role="status" />
            <p className="text-muted small mt-2">Loading audit trail records...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No audit events found"
            description="No log events match the active search criteria."
          />
        ) : (
          <>
            <div className="table-container border-0">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Timestamp</th>
                    <th>Actor / Operator</th>
                    <th>Action</th>
                    <th>Target Entity</th>
                    <th>IP Address</th>
                    <th className="text-end">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <span className="font-monospace text-xs text-muted">
                          #{l.id}
                        </span>
                      </td>

                      <td>
                        <span className="text-xs text-secondary d-flex align-items-center gap-1">
                          <Clock size={12} className="text-muted" />
                          {new Date(l.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 bg-primary-subtle text-primary fw-bold"
                            style={{ width: '28px', height: '28px', fontSize: '0.72rem' }}
                          >
                            {(l.user_name || l.actor_name || l.actor || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div className="d-flex flex-column" style={{ minWidth: 0, lineHeight: 1.2 }}>
                            <span className="fw-semibold text-xs text-primary-emphasis text-truncate">
                              {l.user_name || l.actor_name || l.actor || 'System'}
                            </span>
                            <span className="text-muted font-monospace text-truncate" style={{ fontSize: '0.68rem', marginTop: '2px' }}>
                              {l.user_email || 'system@internal'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`badge ${
                          l.action === 'UPDATE_STATUS'
                            ? 'bg-warning-subtle text-warning'
                            : l.action === 'CREATE'
                            ? 'bg-success-subtle text-success'
                            : l.action === 'DELETE'
                            ? 'bg-danger-subtle text-danger'
                            : 'bg-primary-subtle text-primary'
                        } font-monospace text-xs`}>
                          {l.action}
                        </span>
                      </td>

                      <td>
                        <span className="text-xs text-secondary">
                          <strong className="text-primary-emphasis">{l.entity_type || l.entity}</strong> (#{l.entity_id || l.target_id || 1})
                        </span>
                      </td>

                      <td>
                        <span className="font-monospace text-xs text-muted">
                          {l.ip_address || '127.0.0.1'}
                        </span>
                      </td>

                      <td className="text-end">
                        <button
                          type="button"
                          className="btn-ui-icon"
                          onClick={() => setSelectedLog(l)}
                          title="Inspect Event Payload"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={filteredLogs.length}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </>
        )}
      </div>

      {/* Inspect Event Payload Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Audit Event Inspection: #${selectedLog?.id}`}
        subtitle={`Action ${selectedLog?.action} performed by ${selectedLog?.user_name || selectedLog?.actor_name || 'System'}`}
        size="lg"
        footer={
          <div className="d-flex justify-content-between align-items-center w-100">
            <span className="text-muted text-xs font-monospace">
              Record ID: #{selectedLog?.id}
            </span>
            <button
              type="button"
              className="btn-ui btn-ui-secondary btn-ui-sm"
              onClick={() => setSelectedLog(null)}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedLog && (
          <div className="d-flex flex-column gap-3">
            {/* Metadata Summary Card */}
            <div className="card-enterprise p-3 bg-subtle">
              <div className="row g-3">
                <div className="col-6 col-md-3">
                  <span className="text-muted text-xs d-block mb-1">Action Type</span>
                  <span className={`badge ${
                    selectedLog.action === 'UPDATE_STATUS'
                      ? 'bg-warning-subtle text-warning'
                      : selectedLog.action === 'CREATE'
                      ? 'bg-success-subtle text-success'
                      : selectedLog.action === 'DELETE'
                      ? 'bg-danger-subtle text-danger'
                      : 'bg-primary-subtle text-primary'
                  } font-monospace text-xs`}>
                    {selectedLog.action}
                  </span>
                </div>

                <div className="col-6 col-md-3">
                  <span className="text-muted text-xs d-block mb-1">Target Entity</span>
                  <span className="fw-semibold text-xs text-primary-emphasis">
                    {selectedLog.entity_type} <span className="text-muted font-monospace">(#{selectedLog.entity_id || 'N/A'})</span>
                  </span>
                </div>

                <div className="col-6 col-md-3">
                  <span className="text-muted text-xs d-block mb-1">Operator</span>
                  <div className="d-flex flex-column" style={{ minWidth: 0 }}>
                    <span className="fw-semibold text-xs text-primary-emphasis text-truncate">
                      {selectedLog.user_name || selectedLog.actor_name || 'System Auto'}
                    </span>
                    <span className="text-muted text-truncate font-monospace" style={{ fontSize: '0.68rem' }}>
                      {selectedLog.user_email || 'system@internal'}
                    </span>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <span className="text-muted text-xs d-block mb-1">Timestamp &amp; IP</span>
                  <div className="text-xs text-secondary">
                    {new Date(selectedLog.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <span className="text-muted font-monospace" style={{ fontSize: '0.68rem' }}>
                    {selectedLog.ip_address || '127.0.0.1'}
                  </span>
                </div>
              </div>
            </div>

            {/* State Mutation Diff or Payload Block */}
            {selectedLog.old_values && selectedLog.new_values && typeof selectedLog.old_values === 'object' && typeof selectedLog.new_values === 'object' ? (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <label className="text-xs fw-bold text-uppercase tracking-wider text-muted mb-0">
                    State Mutation Comparison
                  </label>
                  <span className="text-muted text-xs font-monospace">Old vs New Values</span>
                </div>

                <div className="card-enterprise overflow-hidden">
                  <div className="table-container border-0 m-0">
                    <table className="enterprise-table mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: '30%' }}>Attribute</th>
                          <th style={{ width: '35%' }}>Previous State (Before)</th>
                          <th style={{ width: '35%' }}>New State (After)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from(new Set([...Object.keys(selectedLog.old_values), ...Object.keys(selectedLog.new_values)])).map((key) => {
                          const oldVal = selectedLog.old_values[key];
                          const newVal = selectedLog.new_values[key];
                          const isChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);

                          return (
                            <tr key={key} className={isChanged ? 'bg-subtle' : ''}>
                              <td className="fw-semibold font-monospace text-xs text-primary-emphasis">
                                {key}
                              </td>
                              <td>
                                {oldVal !== undefined ? (
                                  <span className="badge bg-danger-subtle text-danger font-monospace text-xs">
                                    {typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal)}
                                  </span>
                                ) : (
                                  <span className="text-muted text-xs italic">—</span>
                                )}
                              </td>
                              <td>
                                {newVal !== undefined ? (
                                  <span className="badge bg-success-subtle text-success font-monospace text-xs fw-bold">
                                    {typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal)}
                                  </span>
                                ) : (
                                  <span className="text-muted text-xs italic">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : selectedLog.new_values && typeof selectedLog.new_values === 'object' ? (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <label className="text-xs fw-bold text-uppercase tracking-wider text-muted mb-0">
                    Initialized Entity Attributes
                  </label>
                  <span className="badge bg-success-subtle text-success text-xs">Creation Payload</span>
                </div>

                <div className="card-enterprise overflow-hidden">
                  <div className="table-container border-0 m-0">
                    <table className="enterprise-table mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: '35%' }}>Attribute</th>
                          <th style={{ width: '65%' }}>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(selectedLog.new_values).map(([k, v]) => (
                          <tr key={k}>
                            <td className="fw-semibold font-monospace text-xs text-primary-emphasis">
                              {k}
                            </td>
                            <td>
                              <span className="font-monospace text-xs text-secondary">
                                {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : selectedLog.old_values && typeof selectedLog.old_values === 'object' ? (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <label className="text-xs fw-bold text-uppercase tracking-wider text-muted mb-0">
                    Deleted Entity Snapshot
                  </label>
                  <span className="badge bg-danger-subtle text-danger text-xs">Purged Record</span>
                </div>

                <div className="card-enterprise overflow-hidden">
                  <div className="table-container border-0 m-0">
                    <table className="enterprise-table mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: '35%' }}>Attribute</th>
                          <th style={{ width: '65%' }}>Purged Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(selectedLog.old_values).map(([k, v]) => (
                          <tr key={k}>
                            <td className="fw-semibold font-monospace text-xs text-primary-emphasis">
                              {k}
                            </td>
                            <td>
                              <span className="font-monospace text-xs text-danger">
                                {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs fw-bold text-uppercase tracking-wider text-muted mb-2 d-block">
                  Raw Event Context
                </label>
                <div className="card-enterprise p-3">
                  <pre
                    className="m-0 p-3 rounded bg-subtle text-xs font-monospace"
                    style={{ maxHeight: '240px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  >
                    {JSON.stringify(selectedLog.details || selectedLog, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Raw JSON Payload (Collapsible / Secondary Context) */}
            <details className="text-xs text-muted">
              <summary style={{ cursor: 'pointer', userSelect: 'none' }} className="fw-semibold text-primary">
                View Raw JSON Event Object
              </summary>
              <pre
                className="mt-2 p-2.5 rounded bg-subtle text-xs font-monospace border mb-0"
                style={{ maxHeight: '180px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogsPage;
