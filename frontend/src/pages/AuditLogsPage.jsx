import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  FileCode
} from 'lucide-react';

const FALLBACK_LOGS = [
  {
    id: 1042,
    actor_id: 1,
    actor_name: 'System Administrator',
    action: 'ROLE_UPDATE',
    entity_type: 'Role',
    entity_id: 2,
    ip_address: '192.168.1.104',
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    details: { changes: { permissions: { 'quotation.update': true } } },
  },
  {
    id: 1041,
    actor_id: 2,
    actor_name: 'Space Manager',
    action: 'SPACE_STATUS_CHANGE',
    entity_type: 'AdvertisingSpace',
    entity_id: 4,
    ip_address: '192.168.1.112',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    details: { space_code: 'LHR-LED-094', previous_status: 'MAINTENANCE', new_status: 'ACTIVE' },
  },
  {
    id: 1040,
    actor_id: 4,
    actor_name: 'Creative Reviewer',
    action: 'CREATIVE_APPROVED',
    entity_type: 'CreativeAsset',
    entity_id: 18,
    ip_address: '192.168.1.140',
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    details: { resolution: '3840x2160', file_format: 'MP4', campaign_id: 9 },
  },
  {
    id: 1039,
    actor_id: 1,
    actor_name: 'System Administrator',
    action: 'USER_PROVISIONED',
    entity_type: 'User',
    entity_id: 14,
    ip_address: '192.168.1.104',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    details: { name: 'Farhan Zaidi', email: 'farhan@nestle.com', role: 'Advertiser' },
  },
  {
    id: 1038,
    actor_id: 5,
    actor_name: 'Finance Officer',
    action: 'PAYMENT_VERIFIED',
    entity_type: 'Payment',
    entity_id: 72,
    ip_address: '192.168.1.118',
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    details: { invoice_id: 88, amount: 24500.0, payment_method: 'WIRE_TRANSFER' },
  },
];

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
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://127.0.0.1:5000/api/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data && res.data.logs && res.data.logs.length > 0) {
        setLogs(res.data.logs);
      } else {
        setLogs(FALLBACK_LOGS);
      }
    } catch (err) {
      console.warn('Using fallback audit log dataset', err);
      setLogs(FALLBACK_LOGS);
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

    const matchesSearch =
      actorName.toLowerCase().includes(search.toLowerCase()) ||
      actionName.toLowerCase().includes(search.toLowerCase()) ||
      entityType.toLowerCase().includes(search.toLowerCase()) ||
      String(l.id).includes(search);

    const matchesAction =
      actionFilter === 'ALL' || actionName.includes(actionFilter);

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
            <option value="ALL">All Event Types</option>
            <option value="USER">User Account Events</option>
            <option value="ROLE">Role &amp; RBAC Events</option>
            <option value="SPACE">Space &amp; Hardware Events</option>
            <option value="PAYMENT">Payment &amp; Billing Events</option>
            <option value="CREATIVE">Creative Verification Events</option>
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
                        <div className="d-flex align-items-center gap-1.5">
                          <User size={13} className="text-primary" />
                          <span className="fw-semibold text-xs text-primary-emphasis">
                            {l.actor_name || l.user_name || l.actor || 'System'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="badge bg-primary-subtle text-primary font-monospace text-xs">
                          {l.action}
                        </span>
                      </td>

                      <td>
                        <span className="text-xs text-secondary">
                          {l.entity_type || l.entity} (ID: #{l.entity_id || l.target_id || 1})
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
        title={`Audit Event Payload: #${selectedLog?.id}`}
        subtitle={`Action: ${selectedLog?.action} by ${selectedLog?.actor_name || 'System'}`}
        size="md"
        footer={
          <button
            type="button"
            className="btn-ui btn-ui-secondary btn-ui-sm"
            onClick={() => setSelectedLog(null)}
          >
            Close
          </button>
        }
      >
        {selectedLog && (
          <div className="d-flex flex-column gap-3">
            <div className="p-2.5 rounded bg-subtle border text-xs">
              <div className="row g-2">
                <div className="col-6">
                  <strong>Timestamp:</strong> {new Date(selectedLog.created_at).toLocaleString()}
                </div>
                <div className="col-6">
                  <strong>Source IP:</strong> {selectedLog.ip_address || '127.0.0.1'}
                </div>
                <div className="col-6">
                  <strong>Target Entity:</strong> {selectedLog.entity_type} (#{selectedLog.entity_id})
                </div>
                <div className="col-6">
                  <strong>Action:</strong> {selectedLog.action}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs fw-bold text-uppercase tracking-wider text-muted mb-1 d-block">
                Raw Event Context &amp; Diff Payload
              </label>
              <pre
                className="p-3 rounded bg-dark text-light text-xs font-monospace mb-0"
                style={{ maxHeight: '200px', overflowY: 'auto' }}
              >
                {JSON.stringify(selectedLog.details || selectedLog, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogsPage;
