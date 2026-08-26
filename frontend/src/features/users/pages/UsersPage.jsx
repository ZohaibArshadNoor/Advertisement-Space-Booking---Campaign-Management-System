import React, { useState, useEffect } from 'react';
import { adminApi } from '../../admin/adminApi';
import StatusBadge from '../../../components/ui/StatusBadge';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import UserFormModal from '../components/UserFormModal';
import UserDetailsDrawer from '../components/UserDetailsDrawer';
import ResetPasswordModal from '../components/ResetPasswordModal';
import {
  Users,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Edit,
  Eye,
  Key,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

const ROLE_FILTER_OPTIONS = [
  'All Roles',
  'Administrator',
  'Advertiser',
  'Sales Executive',
  'Space Manager',
  'Creative Reviewer',
  'Finance Officer',
];

const STATUS_FILTER_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Active Accounts', value: 'true' },
  { label: 'Inactive Accounts', value: 'false' },
];

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [inspectingUser, setInspectingUser] = useState(null);
  const [resettingUser, setResettingUser] = useState(null);

  // Row Action Menu popup
  const [openActionId, setOpenActionId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getUsers();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load users', err);
      setError(err.response?.data?.message || 'Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered and searched data
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      String(u.id).includes(search);

    const matchesRole =
      roleFilter === 'All Roles' || u.role === roleFilter;

    const matchesStatus =
      statusFilter === '' ||
      (statusFilter === 'true' && u.is_active) ||
      (statusFilter === 'false' && !u.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handlers
  const handleCreateUser = async (formData) => {
    await adminApi.createUser({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role_id: formData.role_id,
    });
    setFeedback({ type: 'success', message: 'User account created successfully.' });
    fetchUsers();
  };

  const handleEditUser = async (formData) => {
    if (!editingUser) return;
    await adminApi.updateUser(editingUser.id, {
      name: formData.name,
      email: formData.email,
      role_id: formData.role_id,
    });
    setFeedback({ type: 'success', message: 'User details updated successfully.' });
    setEditingUser(null);
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    try {
      await adminApi.updateUserStatus(user.id, !user.is_active);
      setFeedback({
        type: 'success',
        message: `User '${user.name}' has been ${user.is_active ? 'deactivated' : 'activated'}.`,
      });
      fetchUsers();
      if (inspectingUser?.id === user.id) {
        setInspectingUser({ ...inspectingUser, is_active: !user.is_active });
      }
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to update account status.',
      });
    }
  };

  const handleResetPassword = async (userId, newPassword) => {
    await adminApi.resetUserPassword(userId, newPassword);
    setFeedback({ type: 'success', message: 'User password reset successfully.' });
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to permanently delete user '${user.name}' (${user.email})?`)) {
      return;
    }
    try {
      await adminApi.deleteUser(user.id);
      setFeedback({ type: 'success', message: 'User deleted successfully.' });
      fetchUsers();
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to delete user account.',
      });
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">
            Manage system access, assign operational roles, and audit account statuses.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={fetchUsers}
            className="btn-ui btn-ui-secondary btn-ui-sm"
            title="Reload user list"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn-ui btn-ui-primary btn-ui-sm"
          >
            <Plus size={14} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {feedback.message && (
        <div
          className={`alert-ui alert-${feedback.type} mb-3`}
          role="alert"
        >
          <AlertCircle size={16} className="flex-shrink-0" />
          <div className="flex-grow-1 text-xs">{feedback.message}</div>
          <button
            type="button"
            className="btn-close ms-auto"
            style={{ fontSize: '0.65rem' }}
            onClick={() => setFeedback({ type: '', message: '' })}
          />
        </div>
      )}

      {error && (
        <div className="alert-ui alert-danger mb-4">
          <AlertCircle size={16} className="flex-shrink-0" />
          <div className="flex-grow-1 text-xs">{error}</div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="toolbar-ui">
        <div className="toolbar-search">
          <Search size={15} className="toolbar-search-icon" />
          <input
            type="text"
            className="toolbar-search-input"
            placeholder="Search by name, email, or ID..."
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
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            {ROLE_FILTER_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            className="form-select-ui"
            style={{ width: 'auto', fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            {STATUS_FILTER_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="card-enterprise">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary spinner-border-sm" role="status" />
            <p className="text-muted small mt-2">Loading user records...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users match your criteria"
            description="Try adjusting your keyword search or active status filters."
            actionLabel={search || roleFilter !== 'All Roles' || statusFilter ? 'Clear All Filters' : 'Add First User'}
            onAction={() => {
              if (search || roleFilter !== 'All Roles' || statusFilter) {
                setSearch('');
                setRoleFilter('All Roles');
                setStatusFilter('');
              } else {
                setShowCreateModal(true);
              }
            }}
          />
        ) : (
          <>
            <div className="table-container border-0">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email Address</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((u) => (
                    <tr key={u.id}>
                      {/* User Column */}
                      <td>
                        <div className="d-flex align-items-center gap-2.5">
                          <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.78rem' }}>
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="fw-semibold text-xs text-primary-emphasis">
                              {u.name}
                            </div>
                            <small className="text-muted font-monospace" style={{ fontSize: '0.68rem' }}>
                              #{u.id}
                            </small>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td>
                        <span className="text-xs text-secondary">{u.email}</span>
                      </td>

                      {/* Role */}
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary text-xs">
                          {u.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <StatusBadge status={u.is_active ? 'active' : 'inactive'} size="sm" />
                      </td>

                      {/* Created Date */}
                      <td>
                        <span className="text-xs text-muted">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'System Default'}
                        </span>
                      </td>

                      {/* Actions Menu */}
                      <td className="text-end position-relative">
                        <div className="d-inline-flex align-items-center gap-1">
                          <button
                            type="button"
                            className="btn-ui-icon"
                            onClick={() => setInspectingUser(u)}
                            title="Inspect User Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-ui-icon"
                            onClick={() => setEditingUser(u)}
                            title="Edit User"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-ui-icon"
                            onClick={() => setResettingUser(u)}
                            title="Reset Password"
                          >
                            <Key size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-ui-icon text-danger"
                            onClick={() => handleDeleteUser(u)}
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Component */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={filteredUsers.length}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </div>

      {/* Modals & Drawers */}
      <UserFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateUser}
        isEditing={false}
      />

      <UserFormModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSubmit={handleEditUser}
        initialData={editingUser}
        isEditing={true}
      />

      <UserDetailsDrawer
        isOpen={!!inspectingUser}
        onClose={() => setInspectingUser(null)}
        user={inspectingUser}
        onEdit={(u) => {
          setInspectingUser(null);
          setEditingUser(u);
        }}
        onResetPassword={(u) => {
          setInspectingUser(null);
          setResettingUser(u);
        }}
        onToggleStatus={handleToggleStatus}
      />

      <ResetPasswordModal
        isOpen={!!resettingUser}
        onClose={() => setResettingUser(null)}
        user={resettingUser}
        onReset={handleResetPassword}
      />
    </div>
  );
};

export default UsersPage;
