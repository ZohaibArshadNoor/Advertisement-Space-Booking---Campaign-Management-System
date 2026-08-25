import React, { useState, useEffect } from 'react';
import { adminApi } from '../adminApi';
import { 
  Users, 
  Building2, 
  ShieldCheck, 
  UserPlus, 
  Edit3, 
  Key, 
  Trash2, 
  Shield, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

const ROLE_BADGES = {
  Administrator: 'bg-danger',
  Advertiser: 'bg-primary',
  'Sales Executive': 'bg-success',
  'Space Manager': 'bg-info text-dark',
  'Creative Reviewer': 'bg-warning text-dark',
  'Finance Officer': 'bg-secondary',
};

const ROLE_NAME_TO_ID = {
  Advertiser: 1,
  'Sales Executive': 2,
  'Space Manager': 3,
  'Creative Reviewer': 4,
  'Finance Officer': 5,
  Administrator: 6,
};

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'advertisers' | 'audit'

  // Users State
  const [users, setUsers] = useState([]);
  const [userPagination, setUserPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [usersLoading, setUsersLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [userPage, setUserPage] = useState(1);

  // Advertisers State
  const [advertisers, setAdvertisers] = useState([]);
  const [advertisersLoading, setAdvertisersLoading] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);

  // Modals & Feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_name: 'Advertiser',
  });
  const [submittingUser, setSubmittingUser] = useState(false);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editUserFormData, setEditUserFormData] = useState({
    name: '',
    email: '',
    role_name: 'Advertiser',
  });
  const [updatingUser, setUpdatingUser] = useState(false);

  // Edit Advertiser Modal State
  const [editingAdvertiser, setEditingAdvertiser] = useState(null);
  const [advertiserFormData, setAdvertiserFormData] = useState({
    company_name: '',
    business_registration_number: '',
    tax_number: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Pakistan',
  });
  const [updatingAdvertiser, setUpdatingAdvertiser] = useState(false);

  // Reset Password Modal State
  const [resettingUserId, setResettingUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Fetch Users
  const fetchUsers = async () => {
    setUsersLoading(true);
    setError('');
    try {
      const params = { page: userPage, per_page: 10 };
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;

      const data = await adminApi.getUsers(params);
      setUsers(data.users || data.items || []);
      setUserPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load user accounts.');
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch Advertisers
  const fetchAdvertisers = async () => {
    setAdvertisersLoading(true);
    setError('');
    try {
      const data = await adminApi.getAdvertisers();
      setAdvertisers(data.advertisers || data.items || data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load advertiser profiles.');
    } finally {
      setAdvertisersLoading(false);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    setError('');
    try {
      const params = { page: auditPage, per_page: 15 };
      const data = await adminApi.getAuditLogs(params);
      setAuditLogs(data.audit_logs || data.items || []);
      setAuditPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load audit trail.');
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'advertisers') fetchAdvertisers();
    else if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab, userPage, auditPage, roleFilter]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmittingUser(true);
    setError('');
    try {
      await adminApi.createUser({
        name: createFormData.name,
        email: createFormData.email,
        password: createFormData.password,
        role_id: ROLE_NAME_TO_ID[createFormData.role_name] || 1,
      });
      setSuccessMsg('User account created successfully!');
      setShowCreateModal(false);
      setCreateFormData({ name: '', email: '', password: '', role_name: 'Advertiser' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setSubmittingUser(false);
    }
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setEditUserFormData({
      name: user.name,
      email: user.email,
      role_name: user.role?.name || user.role || 'Advertiser',
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setUpdatingUser(true);
    setError('');
    try {
      await adminApi.updateUser(editingUser.id, {
        name: editUserFormData.name,
        email: editUserFormData.email,
        role_id: ROLE_NAME_TO_ID[editUserFormData.role_name] || 1,
      });
      setSuccessMsg('User profile updated successfully!');
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setUpdatingUser(false);
    }
  };

  const openEditAdvertiser = (adv) => {
    setEditingAdvertiser(adv);
    setAdvertiserFormData({
      company_name: adv.company_name || '',
      business_registration_number: adv.business_registration_number || '',
      tax_number: adv.tax_number || '',
      email: adv.email || '',
      phone: adv.phone || '',
      address: adv.address || '',
      city: adv.city || '',
      country: adv.country || 'Pakistan',
    });
  };

  const handleUpdateAdvertiser = async (e) => {
    e.preventDefault();
    setUpdatingAdvertiser(true);
    setError('');
    try {
      await adminApi.updateAdvertiser(editingAdvertiser.id, advertiserFormData);
      setSuccessMsg('Customer / Company details updated successfully!');
      setEditingAdvertiser(null);
      fetchAdvertisers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update customer details.');
    } finally {
      setUpdatingAdvertiser(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await adminApi.toggleUserStatus(user.id, !user.is_active);
      setSuccessMsg(`User status updated to ${!user.is_active ? 'Active' : 'Inactive'}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    try {
      await adminApi.resetPassword(resettingUserId, newPassword);
      setSuccessMsg('Password reset successfully!');
      setResettingUserId(null);
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account?')) return;
    try {
      await adminApi.deleteUser(userId);
      setSuccessMsg('User account deleted.');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Administration Control Panel</h2>
          <p className="text-muted small mb-0">Manage customer accounts, company credentials, system roles, and audit compliance</p>
        </div>
        {activeTab === 'users' && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + Create New User
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger alert-dismissible">{error}</div>}
      {successMsg && <div className="alert alert-success alert-dismissible">{successMsg}</div>}

      {/* Tabs */}
      <ul className="nav nav-pills mb-4">
        <li className="nav-item">
          <button
            className={`nav-link d-inline-flex align-items-center gap-1.5 ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} />
            <span>User Accounts</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link d-inline-flex align-items-center gap-1.5 ${activeTab === 'advertisers' ? 'active' : ''}`}
            onClick={() => setActiveTab('advertisers')}
          >
            <Building2 size={16} />
            <span>Customer / Company Profiles</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link d-inline-flex align-items-center gap-1.5 ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <ShieldCheck size={16} />
            <span>Security Audit Logs</span>
          </button>
        </li>
      </ul>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <>
          {/* User Filters */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <form className="row g-2 align-items-center" onSubmit={(e) => { e.preventDefault(); setUserPage(1); fetchUsers(); }}>
                <div className="col-md-5">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by user name or email address..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setUserPage(1);
                    }}
                  >
                    <option value="">All Roles</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Advertiser">Advertiser</option>
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Space Manager">Space Manager</option>
                    <option value="Creative Reviewer">Creative Reviewer</option>
                    <option value="Finance Officer">Finance Officer</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <button type="submit" className="btn btn-dark w-100">Filter</button>
                </div>
                <div className="col-md-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100"
                    onClick={() => { setSearch(''); setRoleFilter(''); setUserPage(1); }}
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-body p-0">
              {usersLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary"></div>
                  <p className="text-muted mt-2">Loading user accounts...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-5">
                  <h5>No users found</h5>
                  <p className="text-muted small">Try adjusting your search criteria.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>User Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td className="fw-bold">{u.name}</td>
                          <td><code>{u.email}</code></td>
                          <td>
                            <span className={`badge ${ROLE_BADGES[u.role?.name || u.role] || 'bg-secondary'}`}>
                              {u.role?.name || u.role}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${u.is_active ? 'bg-success' : 'bg-danger'}`}>
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td><small className="text-muted">{u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</small></td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-primary me-1 d-inline-flex align-items-center gap-1"
                              onClick={() => openEditUser(u)}
                            >
                              <Edit3 size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              className={`btn btn-sm me-1 ${u.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                              onClick={() => handleToggleStatus(u)}
                            >
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary me-1"
                              onClick={() => setResettingUserId(u.id)}
                            >
                              Reset Key
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteUser(u.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {userPagination.pages > 1 && (
              <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
                <span className="text-muted small">
                  Page {userPagination.page} of {userPagination.pages} ({userPagination.total} users)
                </span>
                <div>
                  <button
                    className="btn btn-outline-secondary btn-sm me-2"
                    disabled={userPagination.page <= 1}
                    onClick={() => setUserPage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    disabled={userPagination.page >= userPagination.pages}
                    onClick={() => setUserPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 2: ADVERTISERS / COMPANY PROFILES */}
      {activeTab === 'advertisers' && (
        <div className="card shadow-sm border-0">
          <div className="card-body p-0">
            {advertisersLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary"></div>
                <p className="text-muted mt-2">Loading customer company profiles...</p>
              </div>
            ) : advertisers.length === 0 ? (
              <div className="text-center py-5">
                <h5>No advertiser companies registered</h5>
                <p className="text-muted small">Registered advertiser companies will be listed here.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Company Name</th>
                      <th>Tax / NTN #</th>
                      <th>Reg Number</th>
                      <th>Contact Email</th>
                      <th>Phone</th>
                      <th>Location</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advertisers.map((adv) => (
                      <tr key={adv.id}>
                        <td>
                          <div className="fw-bold">{adv.company_name}</div>
                          <span className={`badge ${adv.is_active ? 'bg-success' : 'bg-danger'} small`}>
                            {adv.is_active ? 'Active Customer' : 'Suspended'}
                          </span>
                        </td>
                        <td><code>{adv.tax_number || 'N/A'}</code></td>
                        <td><code>{adv.business_registration_number || 'N/A'}</code></td>
                        <td>{adv.email || 'N/A'}</td>
                        <td>{adv.phone || 'N/A'}</td>
                        <td><small className="text-muted">{adv.city ? `${adv.city}, ${adv.country}` : (adv.address || 'N/A')}</small></td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                            onClick={() => openEditAdvertiser(adv)}
                          >
                            <Edit3 size={13} />
                            <span>Edit Customer</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="card shadow-sm border-0">
          <div className="card-body p-0">
            {auditLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary"></div>
                <p className="text-muted mt-2">Loading audit events...</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-5">
                <h5>No audit logs found</h5>
                <p className="text-muted small">System events will be logged here.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Timestamp</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Entity ID</th>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td><small className="text-muted">{log.created_at ? new Date(log.created_at).toLocaleString() : ''}</small></td>
                        <td><strong>{log.user_name || 'System'}</strong> <small className="text-muted">({log.user_email || 'N/A'})</small></td>
                        <td>
                          <span className={`badge ${
                            log.action === 'CREATE' ? 'bg-success' :
                            log.action === 'DELETE' ? 'bg-danger' :
                            log.action === 'LOGIN' ? 'bg-primary' : 'bg-warning text-dark'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td><span className="badge bg-light text-dark border">{log.entity_type}</span></td>
                        <td><code>#{log.entity_id || 'N/A'}</code></td>
                        <td><small className="text-muted">{log.ip_address || '127.0.0.1'}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {auditPagination.pages > 1 && (
            <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
              <span className="text-muted small">
                Page {auditPagination.page} of {auditPagination.pages} ({auditPagination.total} logs)
              </span>
              <div>
                <button
                  className="btn btn-outline-secondary btn-sm me-2"
                  disabled={auditPagination.page <= 1}
                  onClick={() => setAuditPage((p) => p - 1)}
                >
                  Previous
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={auditPagination.page >= auditPagination.pages}
                  onClick={() => setAuditPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Edit User Account</h5>
                <button type="button" className="btn-close" onClick={() => setEditingUser(null)}></button>
              </div>
              <form onSubmit={handleUpdateUser}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={editUserFormData.name}
                      onChange={(e) => setEditUserFormData({ ...editUserFormData, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      required
                      value={editUserFormData.email}
                      onChange={(e) => setEditUserFormData({ ...editUserFormData, email: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">System Role *</label>
                    <select
                      className="form-select"
                      value={editUserFormData.role_name}
                      onChange={(e) => setEditUserFormData({ ...editUserFormData, role_name: e.target.value })}
                    >
                      <option value="Advertiser">Advertiser (Client)</option>
                      <option value="Sales Executive">Sales Executive</option>
                      <option value="Space Manager">Space Manager</option>
                      <option value="Creative Reviewer">Creative Reviewer</option>
                      <option value="Finance Officer">Finance Officer</option>
                      <option value="Administrator">System Administrator</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={updatingUser}>
                    {updatingUser ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer / Advertiser Profile Modal */}
      {editingAdvertiser && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Edit Customer / Company Profile</h5>
                <button type="button" className="btn-close" onClick={() => setEditingAdvertiser(null)}></button>
              </div>
              <form onSubmit={handleUpdateAdvertiser}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Company Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={advertiserFormData.company_name}
                        onChange={(e) => setAdvertiserFormData({ ...advertiserFormData, company_name: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Tax / NTN Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={advertiserFormData.tax_number}
                        onChange={(e) => setAdvertiserFormData({ ...advertiserFormData, tax_number: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Business Registration #</label>
                      <input
                        type="text"
                        className="form-control"
                        value={advertiserFormData.business_registration_number}
                        onChange={(e) => setAdvertiserFormData({ ...advertiserFormData, business_registration_number: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Corporate Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={advertiserFormData.email}
                        onChange={(e) => setAdvertiserFormData({ ...advertiserFormData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={advertiserFormData.phone}
                        onChange={(e) => setAdvertiserFormData({ ...advertiserFormData, phone: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        className="form-control"
                        value={advertiserFormData.city}
                        onChange={(e) => setAdvertiserFormData({ ...advertiserFormData, city: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Office Address</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={advertiserFormData.address}
                      onChange={(e) => setAdvertiserFormData({ ...advertiserFormData, address: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingAdvertiser(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={updatingAdvertiser}>
                    {updatingAdvertiser ? 'Updating...' : 'Save Customer Details'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Create User Account</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreateUser}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={createFormData.name}
                      onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      required
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Temporary Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      required
                      value={createFormData.password}
                      onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">System Role *</label>
                    <select
                      className="form-select"
                      value={createFormData.role_name}
                      onChange={(e) => setCreateFormData({ ...createFormData, role_name: e.target.value })}
                    >
                      <option value="Advertiser">Advertiser (Client)</option>
                      <option value="Sales Executive">Sales Executive</option>
                      <option value="Space Manager">Space Manager</option>
                      <option value="Creative Reviewer">Creative Reviewer</option>
                      <option value="Finance Officer">Finance Officer</option>
                      <option value="Administrator">System Administrator</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submittingUser}>
                    {submittingUser ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingUserId && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-bold">Reset Password</h6>
                <button type="button" className="btn-close" onClick={() => setResettingUserId(null)}></button>
              </div>
              <form onSubmit={handleResetPassword}>
                <div className="modal-body">
                  <label className="form-label small">New Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setResettingUserId(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger btn-sm">
                    Set Password
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

export default AdminPage;