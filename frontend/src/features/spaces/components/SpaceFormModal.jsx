import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { spacesApi } from '../spacesApi';
import {
  AlertCircle,
  MapPin,
  DollarSign,
  Monitor,
  Plus,
  Info,
  CheckCircle2,
  Layers,
  Sparkles
} from 'lucide-react';

const DEFAULT_CATEGORIES = [
  { id: 1, name: '3D Anamorphic LED' },
  { id: 2, name: 'Highway Unipole' },
  { id: 3, name: 'Digital Totem Kiosk' },
  { id: 4, name: 'Overhead Bridge Banner' },
  { id: 5, name: 'Pylon LED Display' },
];

const DEFAULT_LOCATIONS = [
  { id: 1, name: 'Mall Road Arterial Junction', city: 'Lahore' },
  { id: 2, name: 'Shahrah-e-Faisal Expressway', city: 'Karachi' },
  { id: 3, name: 'Blue Area Commercial Hub', city: 'Islamabad' },
  { id: 4, name: 'Sheikh Zayed Luxury Boulevard', city: 'Dubai' },
  { id: 5, name: 'Times Square Central Concourse', city: 'New York' },
];

export const SpaceFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isEditing = false,
}) => {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [locations, setLocations] = useState(DEFAULT_LOCATIONS);

  // Custom Category & Location toggle states
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [isAddingNewLocation, setIsAddingNewLocation] = useState(false);
  const [newLocationCity, setNewLocationCity] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category_id: 1,
    location_id: 1,
    dimensions: '40x20 ft',
    resolution: '3840x2160 (4K UHD)',
    daily_rate: '45000.00',
    status: 'ACTIVE',
    traffic_count: '450,000 / day',
    description: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch live categories and locations on modal open
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const catRes = await spacesApi.getCategories();
        if (catRes?.categories && catRes.categories.length > 0) {
          setCategories(catRes.categories);
        }
      } catch (err) {
        console.warn('Using default categories', err);
      }

      try {
        const locRes = await spacesApi.getLocations();
        if (locRes?.locations && locRes.locations.length > 0) {
          setLocations(locRes.locations);
        }
      } catch (err) {
        console.warn('Using default locations', err);
      }
    };

    loadData();
  }, [isOpen]);

  useEffect(() => {
    if (initialData && isEditing) {
      setFormData({
        name: initialData.name || '',
        code: initialData.code || 'ASSET-' + (initialData.id || 1),
        category_id: initialData.category_id || (categories[0]?.id || 1),
        location_id: initialData.location_id || (locations[0]?.id || 1),
        dimensions: initialData.dimensions || '40x20 ft',
        resolution: initialData.resolution || '3840x2160 (4K UHD)',
        daily_rate: initialData.base_rate || initialData.daily_rate || '45000.00',
        status: initialData.is_active === false ? 'INACTIVE' : 'ACTIVE',
        traffic_count: initialData.traffic_count || '450,000 / day',
        description: initialData.description || '',
      });
    } else {
      setFormData({
        name: '',
        code: 'LHR-LED-0' + Math.floor(10 + Math.random() * 90),
        category_id: categories[0]?.id || 1,
        location_id: locations[0]?.id || 1,
        dimensions: '40x20 ft',
        resolution: '3840x2160 (4K UHD)',
        daily_rate: '45000.00',
        status: 'ACTIVE',
        traffic_count: '450,000 / day',
        description: '',
      });
    }
    setIsAddingNewCategory(false);
    setNewCategoryName('');
    setIsAddingNewLocation(false);
    setNewLocationCity('');
    setNewLocationName('');
    setNewLocationAddress('');
    setErrors({});
    setSubmitError('');
  }, [initialData, isEditing, isOpen, categories.length, locations.length]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Space title is required.';
    if (!formData.code.trim()) newErrors.code = 'Asset Inventory Code is required.';
    if (!formData.daily_rate || Number(formData.daily_rate) <= 0) {
      newErrors.daily_rate = 'Base daily rate must be greater than zero.';
    }

    if (isAddingNewCategory && !newCategoryName.trim()) {
      newErrors.newCategory = 'New category name is required.';
    }

    if (isAddingNewLocation) {
      if (!newLocationCity.trim()) newErrors.newCity = 'City is required.';
      if (!newLocationName.trim()) newErrors.newLocationName = 'Location name is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      let finalCategoryId = formData.category_id;
      let finalLocationId = formData.location_id;

      // 1. Create custom category if specified
      if (isAddingNewCategory && newCategoryName.trim()) {
        try {
          const res = await spacesApi.createCategory({ name: newCategoryName.trim() });
          if (res?.category?.id) {
            finalCategoryId = res.category.id;
          }
        } catch (catErr) {
          console.warn('Category creation fallback to name payload', catErr);
        }
      }

      // 2. Create custom location if specified
      if (isAddingNewLocation && newLocationName.trim()) {
        try {
          const res = await spacesApi.createLocation({
            name: newLocationName.trim(),
            city: newLocationCity.trim(),
            address: newLocationAddress.trim() || `${newLocationName.trim()}, ${newLocationCity.trim()}`,
          });
          if (res?.location?.id) {
            finalLocationId = res.location.id;
          }
        } catch (locErr) {
          console.warn('Location creation fallback to payload', locErr);
        }
      }

      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        category_id: finalCategoryId,
        category_name: isAddingNewCategory ? newCategoryName.trim() : undefined,
        location_id: finalLocationId,
        location_name: isAddingNewLocation ? newLocationName.trim() : undefined,
        city: isAddingNewLocation ? newLocationCity.trim() : undefined,
        address: isAddingNewLocation ? newLocationAddress.trim() : undefined,
        base_rate: String(formData.daily_rate),
        daily_rate: String(formData.daily_rate),
        dimensions: formData.dimensions.trim(),
        resolution: formData.resolution,
        traffic_count: formData.traffic_count,
        description: formData.description.trim() || `${formData.name} - Premium advertising asset.`,
        is_active: formData.status === 'ACTIVE',
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error('Save space failed:', err);
      setSubmitError(
        err.response?.data?.message ||
        err.response?.data?.errors?.base_rate?.[0] ||
        'Failed to save advertising space. Please verify all fields.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Advertising Space' : 'Register Advertising Space'}
      subtitle="Configure physical billboard asset code, category, location, and daily rate"
      size="lg"
      footer={
        <>
          <button
            type="button"
            className="btn-ui btn-ui-secondary btn-ui-sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-ui btn-ui-primary btn-ui-sm"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Saving Space...' : isEditing ? 'Update Space' : 'Create Space'}
          </button>
        </>
      }
    >
      {submitError && (
        <div className="alert-ui alert-danger mb-3">
          <AlertCircle size={15} className="flex-shrink-0" />
          <div className="flex-grow-1 text-xs">{submitError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          {/* Space Name */}
          <div className="col-12 col-md-8">
            <div className="form-group-ui">
              <label className="form-label-ui" htmlFor="space-name">
                Advertising Space Name <span className="form-required">*</span>
              </label>
              <input
                id="space-name"
                type="text"
                className={`form-input-ui ${errors.name ? 'has-error' : ''}`}
                placeholder="e.g. Mall Road Mega Anamorphic 3D LED"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              {errors.name && <span className="form-error-msg">{errors.name}</span>}
            </div>
          </div>

          {/* Asset Inventory Code */}
          <div className="col-12 col-md-4">
            <div className="form-group-ui">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label-ui mb-0" htmlFor="space-code">
                  Asset Inventory Code <span className="form-required">*</span>
                </label>
              </div>
              <input
                id="space-code"
                type="text"
                className={`form-input-ui font-monospace ${errors.code ? 'has-error' : ''}`}
                placeholder="e.g. LHR-LED-042"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
              <span className="form-helper-text" style={{ fontSize: '0.68rem' }}>
                Unique hardware/SKU tag for billboard tracking &amp; maintenance.
              </span>
              {errors.code && <span className="form-error-msg">{errors.code}</span>}
            </div>
          </div>

          {/* Category & Medium Type */}
          <div className="col-12 col-md-6">
            <div className="form-group-ui">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label-ui mb-0" htmlFor="space-category">
                  Category &amp; Medium Type
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
                  className="btn btn-link p-0 text-decoration-none text-xs fw-semibold text-primary d-flex align-items-center gap-1"
                  style={{ fontSize: '0.72rem' }}
                >
                  <Plus size={11} />
                  <span>{isAddingNewCategory ? 'Choose Existing' : '+ Add New Category'}</span>
                </button>
              </div>

              {!isAddingNewCategory ? (
                <select
                  id="space-category"
                  className="form-select-ui"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div>
                  <input
                    type="text"
                    className={`form-input-ui ${errors.newCategory ? 'has-error' : ''}`}
                    placeholder="e.g. Curved Holographic LED"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    autoFocus
                  />
                  {errors.newCategory && (
                    <span className="form-error-msg">{errors.newCategory}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Metropolitan Location */}
          <div className="col-12 col-md-6">
            <div className="form-group-ui">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label-ui mb-0" htmlFor="space-location">
                  Metropolitan Location
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingNewLocation(!isAddingNewLocation)}
                  className="btn btn-link p-0 text-decoration-none text-xs fw-semibold text-primary d-flex align-items-center gap-1"
                  style={{ fontSize: '0.72rem' }}
                >
                  <Plus size={11} />
                  <span>{isAddingNewLocation ? 'Choose Existing' : '+ Add New Location'}</span>
                </button>
              </div>

              {!isAddingNewLocation ? (
                <select
                  id="space-location"
                  className="form-select-ui"
                  value={formData.location_id}
                  onChange={(e) => setFormData({ ...formData, location_id: Number(e.target.value) })}
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.city} - {l.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="d-flex flex-column gap-1.5 p-2.5 rounded border bg-subtle">
                  <div className="row g-2">
                    <div className="col-5">
                      <input
                        type="text"
                        className={`form-input-ui ${errors.newCity ? 'has-error' : ''}`}
                        placeholder="City (e.g. Peshawar)"
                        value={newLocationCity}
                        onChange={(e) => setNewLocationCity(e.target.value)}
                      />
                    </div>
                    <div className="col-7">
                      <input
                        type="text"
                        className={`form-input-ui ${errors.newLocationName ? 'has-error' : ''}`}
                        placeholder="Landmark / Road"
                        value={newLocationName}
                        onChange={(e) => setNewLocationName(e.target.value)}
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    className="form-input-ui"
                    placeholder="Full Address (e.g. University Road Commercial Corridor)"
                    value={newLocationAddress}
                    onChange={(e) => setNewLocationAddress(e.target.value)}
                  />
                  {(errors.newCity || errors.newLocationName) && (
                    <span className="form-error-msg">City and Location Name are required.</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Base Daily Rate */}
          <div className="col-12 col-md-4">
            <div className="form-group-ui">
              <label className="form-label-ui" htmlFor="space-rate">
                Base Daily Rate (PKR Rs.) <span className="form-required">*</span>
              </label>
              <input
                id="space-rate"
                type="number"
                step="1"
                className={`form-input-ui ${errors.daily_rate ? 'has-error' : ''}`}
                placeholder="45000"
                value={formData.daily_rate}
                onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                required
              />
              {errors.daily_rate && <span className="form-error-msg">{errors.daily_rate}</span>}
            </div>
          </div>

          {/* Physical Dimensions */}
          <div className="col-12 col-md-4">
            <div className="form-group-ui">
              <label className="form-label-ui" htmlFor="space-dimensions">
                Physical Dimensions
              </label>
              <input
                id="space-dimensions"
                type="text"
                className="form-input-ui"
                placeholder="e.g. 40x20 ft"
                value={formData.dimensions}
                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
              />
            </div>
          </div>

          {/* Operational Status */}
          <div className="col-12 col-md-4">
            <div className="form-group-ui">
              <label className="form-label-ui" htmlFor="space-status">
                Operational Status
              </label>
              <select
                id="space-status"
                className="form-select-ui"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">Active &amp; Available</option>
                <option value="MAINTENANCE">Under Maintenance</option>
                <option value="INACTIVE">Decommissioned</option>
              </select>
            </div>
          </div>

          {/* Space Description */}
          <div className="col-12">
            <div className="form-group-ui">
              <label className="form-label-ui" htmlFor="space-desc">
                Description &amp; Operational Notes
              </label>
              <textarea
                id="space-desc"
                rows="2"
                className="form-input-ui"
                placeholder="Prime viewing angle facing arterial traffic flow..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default SpaceFormModal;
