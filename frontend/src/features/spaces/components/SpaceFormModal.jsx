import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { AlertCircle, MapPin, DollarSign, Monitor } from 'lucide-react';

const CATEGORIES = [
  { id: 1, name: '3D Anamorphic LED' },
  { id: 2, name: 'Highway Unipole' },
  { id: 3, name: 'Digital Totem Kiosk' },
  { id: 4, name: 'Overhead Bridge Banner' },
  { id: 5, name: 'Pylon LED Display' },
];

const LOCATIONS = [
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
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category_id: 1,
    location_id: 1,
    dimensions: '40x20 ft',
    resolution: '3840x2160 (4K UHD)',
    daily_rate: '1200.00',
    status: 'ACTIVE',
    traffic_count: '450,000 / day',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (initialData && isEditing) {
      setFormData({
        name: initialData.name || '',
        code: initialData.code || '',
        category_id: initialData.category_id || 1,
        location_id: initialData.location_id || 1,
        dimensions: initialData.dimensions || '40x20 ft',
        resolution: initialData.resolution || '3840x2160 (4K UHD)',
        daily_rate: initialData.daily_rate || '1200.00',
        status: initialData.status || 'ACTIVE',
        traffic_count: initialData.traffic_count || '450,000 / day',
      });
    } else {
      setFormData({
        name: '',
        code: 'LHR-LED-0' + Math.floor(10 + Math.random() * 90),
        category_id: 1,
        location_id: 1,
        dimensions: '40x20 ft',
        resolution: '3840x2160 (4K UHD)',
        daily_rate: '1200.00',
        status: 'ACTIVE',
        traffic_count: '450,000 / day',
      });
    }
    setErrors({});
    setSubmitError('');
  }, [initialData, isEditing, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Space title is required.';
    if (!formData.code.trim()) newErrors.code = 'Asset code is required.';
    if (!formData.daily_rate || Number(formData.daily_rate) <= 0) {
      newErrors.daily_rate = 'Base daily rate must be greater than zero.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || 'Failed to save advertising space.'
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
      subtitle="Configure physical asset dimensions, operational rate card, and location"
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

          <div className="col-12 col-md-4">
            <div className="form-group-ui">
              <label className="form-label-ui" htmlFor="space-code">
                Asset Inventory Code <span className="form-required">*</span>
              </label>
              <input
                id="space-code"
                type="text"
                className={`form-input-ui font-monospace ${errors.code ? 'has-error' : ''}`}
                placeholder="e.g. LHR-LED-042"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
              {errors.code && <span className="form-error-msg">{errors.code}</span>}
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="form-group-ui">
              <label className="form-label-ui" htmlFor="space-category">
                Category &amp; Medium Type
              </label>
              <select
                id="space-category"
                className="form-select-ui"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="form-group-ui">
              <label className="form-label-ui" htmlFor="space-location">
                Metropolitan Location
              </label>
              <select
                id="space-location"
                className="form-select-ui"
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: Number(e.target.value) })}
              >
                {LOCATIONS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.city} - {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="form-group-ui">
              <label className="form-label-ui" htmlFor="space-rate">
                Base Daily Rate (PKR Rs.) <span className="form-required">*</span>
              </label>
              <div className="position-relative">
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
              </div>
              {errors.daily_rate && <span className="form-error-msg">{errors.daily_rate}</span>}
            </div>
          </div>

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
        </div>
      </form>
    </Modal>
  );
};

export default SpaceFormModal;
