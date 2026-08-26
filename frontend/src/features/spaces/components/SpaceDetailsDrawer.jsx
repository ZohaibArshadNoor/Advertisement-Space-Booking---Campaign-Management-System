import React from 'react';
import Drawer from '../../../components/ui/Drawer';
import StatusBadge from '../../../components/ui/StatusBadge';
import {
  Building2,
  MapPin,
  CalendarDays,
  DollarSign,
  Monitor,
  Activity,
  CheckCircle,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SpaceDetailsDrawer = ({
  isOpen,
  onClose,
  space,
  onEdit,
}) => {
  if (!space) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={space.name}
      subtitle={`Asset Code: ${space.code || 'LHR-LED-042'} • ${space.location?.city || 'Lahore'}`}
      footer={
        <div className="d-flex justify-content-between w-100 align-items-center">
          <Link
            to={`/availability?space_id=${space.id}`}
            className="btn-ui btn-ui-secondary btn-ui-sm"
          >
            <CalendarDays size={13} />
            <span>Check Calendar</span>
          </Link>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn-ui btn-ui-secondary btn-ui-sm"
              onClick={() => onEdit(space)}
            >
              <span>Edit Asset</span>
            </button>
            <Link
              to={`/bookings?space_id=${space.id}`}
              className="btn-ui btn-ui-primary btn-ui-sm"
            >
              <span>Book Space</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      }
    >
      <div className="d-flex flex-column gap-4">
        {/* Banner / Visual Preview */}
        <div className="p-4 rounded-3 text-white d-flex flex-column justify-content-between" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)', minHeight: '140px' }}>
          <div className="d-flex justify-content-between align-items-start">
            <span className="badge bg-black bg-opacity-60 border border-light border-opacity-25 text-white text-xs">
              {space.category?.name || 'Digital LED Display'}
            </span>
            <StatusBadge status={space.status || (space.is_active ? 'active' : 'maintenance')} size="sm" />
          </div>
          <div>
            <div className="text-white-50 text-xs">Standard Commercial Daily Rate</div>
            <h3 className="fw-bold mb-0 text-white">${parseFloat(space.base_price_per_day || space.daily_rate || 1200).toLocaleString()}<span className="fs-6 fw-normal text-white-50"> / day</span></h3>
          </div>
        </div>

        {/* Technical Hardware Specifications */}
        <div>
          <h5 className="text-xs fw-bold text-uppercase tracking-wider text-muted mb-2">
            Hardware &amp; Physical Specifications
          </h5>
          <div className="card-enterprise p-3">
            <div className="row g-3">
              <div className="col-6">
                <span className="text-muted text-xs d-block">Dimensions</span>
                <span className="fw-semibold text-xs">{space.dimensions || '40 x 20 ft (Curved)'}</span>
              </div>
              <div className="col-6">
                <span className="text-muted text-xs d-block">Screen Resolution</span>
                <span className="fw-semibold text-xs">{space.resolution || '3840 x 2160 (4K UHD)'}</span>
              </div>
              <div className="col-6">
                <span className="text-muted text-xs d-block">Estimated Daily Impressions</span>
                <span className="fw-semibold text-xs text-primary">{space.daily_impressions || '450,000+ commuters'}</span>
              </div>
              <div className="col-6">
                <span className="text-muted text-xs d-block">Audio &amp; Video Capability</span>
                <span className="fw-semibold text-xs">Dynamic Video Loops (10s/15s)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Location & GIS Details */}
        <div>
          <h5 className="text-xs fw-bold text-uppercase tracking-wider text-muted mb-2">
            Geographic Location &amp; Traffic Hub
          </h5>
          <div className="card-enterprise p-3">
            <div className="d-flex align-items-start gap-2 mb-2">
              <MapPin size={16} className="text-danger flex-shrink-0 mt-0.5" />
              <div>
                <div className="fw-semibold text-xs text-primary-emphasis">
                  {space.location?.name || 'Mall Road Arterial Junction'}
                </div>
                <div className="text-muted text-xs">
                  {space.location?.address || 'Near Governor House & Commercial Strip'}, {space.location?.city || 'Lahore'}
                </div>
              </div>
            </div>
            <div className="p-2 rounded bg-subtle text-muted text-xs font-monospace">
              GPS: {space.location?.latitude || '31.5204'}° N, {space.location?.longitude || '74.3587'}° E
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default SpaceDetailsDrawer;
