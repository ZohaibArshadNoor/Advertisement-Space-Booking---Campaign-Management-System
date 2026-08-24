import React, { useState, useEffect } from 'react';
import { spacesApi } from '../spacesApi';

const SpacesPage = () => {
  const [spaces, setSpaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    // Load categories for filter dropdown
    const loadCategories = async () => {
      try {
        const data = await spacesApi.getCategories();
        setCategories(data.categories || data || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    loadCategories();
  }, []);

  const fetchSpaces = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, per_page: 9 };
      if (search) params.search = search;
      if (categoryId) params.category_id = categoryId;

      const data = await spacesApi.getSpaces(params);
      setSpaces(data.spaces || data.items || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load advertising spaces.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, [page, categoryId]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSpaces();
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Advertising Spaces</h2>
          <p className="text-muted small mb-0">Browse and discover high-impact advertising media</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <form className="row g-2" onSubmit={handleSearch}>
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Search by space name, location, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Categories (Billboards, Digital, etc.)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-primary w-100">Filter</button>
            </div>
          </form>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Spaces Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary"></div>
          <p className="text-muted mt-2">Loading spaces...</p>
        </div>
      ) : spaces.length === 0 ? (
        <div className="text-center py-5 card border-0 shadow-sm">
          <h5>No advertising spaces found</h5>
          <p className="text-muted small">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="row g-4">
          {spaces.map((space) => (
            <div key={space.id} className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body d-flex flex-direction-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-primary-subtle text-primary fw-bold">
                        {space.category?.name || 'Space'}
                      </span>
                      <span className="fw-bold text-success fs-5">
                        ${space.base_rate_per_day ? `${parseFloat(space.base_rate_per_day).toLocaleString()}/day` : 'Inquire'}
                      </span>
                    </div>
                    <h5 className="fw-bold mb-1">{space.name}</h5>
                    <p className="text-muted small mb-2">
                      📍 {space.location?.city ? `${space.location.name}, ${space.location.city}` : (space.location?.name || 'Prime Location')}
                    </p>
                    <p className="small text-secondary mb-3">
                      {space.description ? space.description.slice(0, 110) + '...' : 'Premium visibility advertising space.'}
                    </p>
                  </div>
                  <div className="pt-2 border-top d-flex justify-content-between align-items-center">
                    <span className="text-muted small">
                      Dimensions: {space.width && space.height ? `${space.width}x${space.height} ft` : 'Standard'}
                    </span>
                    <button className="btn btn-outline-primary btn-sm rounded-2">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <span className="text-muted small">
            Page {pagination.page} of {pagination.pages} ({pagination.total} spaces)
          </span>
          <div>
            <button
              className="btn btn-outline-secondary btn-sm me-2"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpacesPage;