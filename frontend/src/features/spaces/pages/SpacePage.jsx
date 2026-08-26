import React, { useState, useEffect } from 'react';
import { spacesApi } from '../spacesApi';
import { useAuth } from '../../../context/AuthContext';
import StatusBadge from '../../../components/ui/StatusBadge';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SpaceFormModal from '../components/SpaceFormModal';
import SpaceDetailsDrawer from '../components/SpaceDetailsDrawer';
import {
  Building2,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  MapPin,
  LayoutGrid,
  List,
  RefreshCw,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CATEGORY_OPTIONS = [
  'All Categories',
  '3D Anamorphic LED',
  'Highway Unipole',
  'Digital Totem Kiosk',
  'Overhead Bridge Banner',
  'Pylon LED Display',
];

const CITY_OPTIONS = ['All Cities', 'Lahore', 'Karachi', 'Islamabad', 'Dubai', 'New York'];

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Active & Available', value: 'ACTIVE' },
  { label: 'Under Maintenance', value: 'MAINTENANCE' },
];

export const SpacesPage = () => {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [inspectingSpace, setInspectingSpace] = useState(null);

  const isManagerOrAdmin =
    user?.role === 'Administrator' || user?.role === 'Space Manager';

  const fetchSpaces = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await spacesApi.getSpaces();
      setSpaces(data.spaces || data || []);
    } catch (err) {
      console.error('Failed to load spaces', err);
      setError(err.response?.data?.message || 'Failed to load advertising spaces.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, []);

  // Filter logic
  const filteredSpaces = spaces.filter((s) => {
    const nameMatch = (s.name || '').toLowerCase().includes(search.toLowerCase());
    const codeMatch = (s.code || '').toLowerCase().includes(search.toLowerCase());
    const cityMatch = (s.location?.city || '').toLowerCase().includes(search.toLowerCase());
    const matchesSearch = nameMatch || codeMatch || cityMatch;

    const matchesCat =
      selectedCategory === 'All Categories' ||
      (s.category?.name || '') === selectedCategory;

    const matchesCity =
      selectedCity === 'All Cities' ||
      (s.location?.city || '') === selectedCity;

    const matchesStatus =
      selectedStatus === '' ||
      (s.status || (s.is_active ? 'ACTIVE' : 'MAINTENANCE')) === selectedStatus;

    return matchesSearch && matchesCat && matchesCity && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSpaces.length / pageSize) || 1;
  const paginatedSpaces = filteredSpaces.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleCreateSpace = async (formData) => {
    await spacesApi.createSpace(formData);
    setFeedback({ type: 'success', message: 'Advertising space created successfully.' });
    fetchSpaces();
  };

  const handleEditSpace = async (formData) => {
    if (!editingSpace) return;
    await spacesApi.updateSpace(editingSpace.id, formData);
    setFeedback({ type: 'success', message: 'Advertising space updated successfully.' });
    setEditingSpace(null);
    fetchSpaces();
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Advertising Spaces</h1>
          <p className="page-subtitle">
            Catalog of high-impact digital LEDs, highway unipoles, and urban totems.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={fetchSpaces}
            className="btn-ui btn-ui-secondary btn-ui-sm"
            title="Reload space inventory"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>

          <div className="btn-group me-1" role="group" aria-label="View toggle">
            <button
              type="button"
              className={`btn-ui btn-ui-sm ${viewMode === 'table' ? 'btn-ui-primary' : 'btn-ui-secondary'}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List size={14} />
            </button>
            <button
              type="button"
              className={`btn-ui btn-ui-sm ${viewMode === 'grid' ? 'btn-ui-primary' : 'btn-ui-secondary'}`}
              onClick={() => setViewMode('grid')}
              title="Grid Cards View"
            >
              <LayoutGrid size={14} />
            </button>
          </div>

          {isManagerOrAdmin && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn-ui btn-ui-primary btn-ui-sm"
            >
              <Plus size={14} />
              <span>Add Space</span>
            </button>
          )}
        </div>
      </div>

      {feedback.message && (
        <div className={`alert-ui alert-${feedback.type} mb-3`}>
          <CheckCircle2 size={16} className="flex-shrink-0" />
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

      {/* Filters Toolbar */}
      <div className="toolbar-ui">
        <div className="toolbar-search">
          <Search size={15} className="toolbar-search-icon" />
          <input
            type="text"
            className="toolbar-search-input"
            placeholder="Search by space name, asset code, or city..."
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
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            className="form-select-ui"
            style={{ width: 'auto', fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              setCurrentPage(1);
            }}
          >
            {CITY_OPTIONS.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          <select
            className="form-select-ui"
            style={{ width: 'auto', fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area: Table View vs Grid View */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary spinner-border-sm" role="status" />
          <p className="text-muted small mt-2">Loading space inventory...</p>
        </div>
      ) : filteredSpaces.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No advertising spaces match your filters"
          description="Try clearing your search term, city, or medium category filters."
          actionLabel="Reset All Filters"
          onAction={() => {
            setSearch('');
            setSelectedCategory('All Categories');
            setSelectedCity('All Cities');
            setSelectedStatus('');
          }}
        />
      ) : viewMode === 'table' ? (
        <div className="card-enterprise">
          <div className="table-container border-0">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Asset &amp; Space Name</th>
                  <th>Location &amp; Hub</th>
                  <th>Category</th>
                  <th>Dimensions</th>
                  <th>Daily Rate</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSpaces.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div>
                          <div className="fw-semibold text-xs text-primary-emphasis">
                            {s.name}
                          </div>
                          <small className="text-muted font-monospace" style={{ fontSize: '0.68rem' }}>
                            {s.code || `ASSET-#${s.id}`}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="d-flex align-items-center gap-1 text-xs text-secondary">
                        <MapPin size={13} className="text-danger flex-shrink-0" />
                        <span>
                          {s.location?.city || 'Lahore'} ({s.location?.name || 'Central'})
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="badge bg-secondary-subtle text-secondary text-xs">
                        {s.category?.name || 'Digital LED'}
                      </span>
                    </td>

                    <td>
                      <span className="text-xs text-muted">
                        {s.dimensions || '40 x 20 ft'}
                      </span>
                    </td>

                    <td>
                      <span className="fw-semibold text-xs text-primary-emphasis">
                        ${parseFloat(s.base_price_per_day || s.daily_rate || 1200).toLocaleString()}
                        <span className="text-muted font-normal"> /d</span>
                      </span>
                    </td>

                    <td>
                      <StatusBadge status={s.status || (s.is_active ? 'active' : 'maintenance')} size="sm" />
                    </td>

                    <td className="text-end">
                      <div className="d-inline-flex align-items-center gap-1">
                        <button
                          type="button"
                          className="btn-ui-icon"
                          onClick={() => setInspectingSpace(s)}
                          title="Inspect Specifications"
                        >
                          <Eye size={14} />
                        </button>
                        {isManagerOrAdmin && (
                          <button
                            type="button"
                            className="btn-ui-icon"
                            onClick={() => setEditingSpace(s)}
                            title="Edit Space"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                        <Link
                          to={`/bookings?space_id=${s.id}`}
                          className="btn-ui btn-ui-secondary btn-ui-sm"
                          style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                        >
                          <span>Book</span>
                          <ChevronRight size={11} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={filteredSpaces.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      ) : (
        /* Grid Cards View */
        <div>
          <div className="row g-3 mb-4">
            {paginatedSpaces.map((s) => (
              <div key={s.id} className="col-12 col-md-6 col-xl-3">
                <div className="card-enterprise h-100 d-flex flex-column justify-content-between">
                  <div
                    className="p-3 text-white"
                    style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)', minHeight: '110px' }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-black bg-opacity-60 text-white text-xs">
                        {s.category?.name || 'Digital LED'}
                      </span>
                      <StatusBadge status={s.status || (s.is_active ? 'active' : 'maintenance')} size="sm" />
                    </div>
                    <div className="text-white fw-bold fs-6 mt-2 text-truncate">
                      ${parseFloat(s.base_price_per_day || s.daily_rate || 1200).toLocaleString()}<span className="text-white-50 text-xs font-normal"> /day</span>
                    </div>
                  </div>

                  <div className="p-3 flex-grow-1 d-flex flex-column justify-content-between">
                    <div>
                      <h4 className="fw-bold text-xs text-primary-emphasis mb-1">
                        {s.name}
                      </h4>
                      <p className="text-muted text-xs d-flex align-items-center gap-1 mb-2">
                        <MapPin size={12} className="text-danger" />
                        <span>{s.location?.city || 'Lahore'} • {s.dimensions || '40x20 ft'}</span>
                      </p>
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <button
                        type="button"
                        className="btn-ui btn-ui-secondary btn-ui-sm"
                        onClick={() => setInspectingSpace(s)}
                      >
                        <Eye size={12} />
                        <span>Inspect</span>
                      </button>
                      <Link
                        to={`/bookings?space_id=${s.id}`}
                        className="btn-ui btn-ui-primary btn-ui-sm"
                      >
                        <span>Book</span>
                        <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={filteredSpaces.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Modals & Drawers */}
      <SpaceFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSpace}
        isEditing={false}
      />

      <SpaceFormModal
        isOpen={!!editingSpace}
        onClose={() => setEditingSpace(null)}
        onSubmit={handleEditSpace}
        initialData={editingSpace}
        isEditing={true}
      />

      <SpaceDetailsDrawer
        isOpen={!!inspectingSpace}
        onClose={() => setInspectingSpace(null)}
        space={inspectingSpace}
        onEdit={(sp) => {
          setInspectingSpace(null);
          setEditingSpace(sp);
        }}
      />
    </div>
  );
};

export default SpacesPage;