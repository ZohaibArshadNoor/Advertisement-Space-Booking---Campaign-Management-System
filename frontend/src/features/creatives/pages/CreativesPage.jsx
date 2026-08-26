import React, { useState, useEffect } from 'react';
import { creativesApi } from '../creativesApi';
import { campaignService } from '../../../services/campaignService';
import { useAuth } from '../../../context/AuthContext';
import { extractErrorMessage } from '../../../utils/errorHandler';
import StatusBadge from '../../../components/ui/StatusBadge';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import {
  Image as ImageIcon,
  FileText,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Trash2,
  Eye,
  Download,
  AlertCircle,
  Plus,
  RefreshCw,
  Clock,
  Check,
  X,
  Layers
} from 'lucide-react';

const AssetThumbnail = ({ assetId, fileType, alt, onPreview }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let url = null;
    const fetchBlob = async () => {
      try {
        const blob = await creativesApi.downloadMediaBlob(assetId);
        if (active) {
          url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      } catch (e) {
        console.error('Failed to load thumbnail', e);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchBlob();
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [assetId]);

  if (loading) {
    return (
      <div className="rounded p-4 text-center mb-3 bg-subtle border">
        <div className="spinner-border spinner-border-sm text-primary" role="status" />
        <div className="small text-muted mt-1" style={{ fontSize: '0.72rem' }}>Loading artwork...</div>
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div className="rounded p-3 text-center mb-3 text-muted small d-flex align-items-center justify-content-center gap-1.5 bg-subtle border">
        <FileText size={16} />
        <span>Document / Banner File</span>
      </div>
    );
  }

  if (fileType?.startsWith('image/')) {
    return (
      <div
        className="rounded overflow-hidden mb-3 border position-relative"
        style={{ height: '170px', backgroundColor: '#090d16', cursor: 'pointer' }}
        onClick={() => onPreview(blobUrl, 'image', alt)}
        title="Click to inspect full resolution artwork"
      >
        <img
          src={blobUrl}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
        <span
          className="badge bg-dark bg-opacity-75 position-absolute bottom-0 end-0 m-2 text-xs"
          style={{ fontSize: '0.68rem' }}
        >
          🔍 Inspect
        </span>
      </div>
    );
  }

  if (fileType?.startsWith('video/')) {
    return (
      <div className="rounded overflow-hidden mb-3 border" style={{ backgroundColor: '#000' }}>
        <video src={blobUrl} controls style={{ width: '100%', maxHeight: '170px' }} />
      </div>
    );
  }

  return (
    <div className="rounded p-3 text-center mb-3 bg-subtle border">
      <a href={blobUrl} download={alt} className="btn-ui btn-ui-secondary btn-ui-sm">
        <Download size={13} />
        <span>Download Asset</span>
      </a>
    </div>
  );
};

export const CreativesPage = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [mediaAssets, setMediaAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Preview Modal state
  const [previewMedia, setPreviewMedia] = useState(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [file, setFile] = useState(null);
  const [dimensions, setDimensions] = useState('1920x1080');
  const [uploading, setUploading] = useState(false);

  // Rejection modal state
  const [rejectingAssetId, setRejectingAssetId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const canReview = ['Administrator', 'Creative Reviewer', 'Space Manager'].includes(user?.role);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const data = await campaignService.getCampaigns({ per_page: 50 });
        const list = data.campaigns || data.items || [];
        setCampaigns(list);
        if (list.length > 0) {
          setSelectedCampaignId(list[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to load campaigns', err);
      }
    };
    loadCampaigns();
  }, []);

  const fetchMedia = async (campaignId) => {
    if (!campaignId) return;
    setLoading(true);
    setError('');
    try {
      const data = await creativesApi.getCampaignMedia(campaignId);
      setMediaAssets(data.assets || data.media_assets || data.items || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load media assets.'));
      setMediaAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCampaignId) {
      fetchMedia(selectedCampaignId);
    }
  }, [selectedCampaignId]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a media file to upload.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (dimensions) formData.append('dimensions', dimensions);

      await creativesApi.uploadMedia(selectedCampaignId, formData);
      setSuccessMsg('Media asset uploaded successfully and submitted for review!');
      setShowUploadModal(false);
      setFile(null);
      fetchMedia(selectedCampaignId);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to upload creative asset.'));
    } finally {
      setUploading(false);
    }
  };

  const handleReviewStatus = async (assetId, status, reason = null) => {
    try {
      await creativesApi.updateStatus(assetId, {
        status,
        rejection_reason: reason,
      });
      setSuccessMsg(`Asset marked as ${status}`);
      setRejectingAssetId(null);
      setRejectionReason('');
      fetchMedia(selectedCampaignId);
    } catch (err) {
      setError(extractErrorMessage(err, `Failed to update status to ${status}.`));
    }
  };

  const handleDelete = async (assetId) => {
    if (!window.confirm('Are you sure you want to delete this media asset?')) return;
    try {
      await creativesApi.deleteMedia(assetId);
      setSuccessMsg('Asset deleted.');
      fetchMedia(selectedCampaignId);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to delete asset.'));
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Creative Artwork &amp; Media Review</h1>
          <p className="page-subtitle">
            Upload, inspect specifications, and verify compliance for billboard broadcasts.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={() => fetchMedia(selectedCampaignId)}
            className="btn-ui btn-ui-secondary btn-ui-sm"
            title="Reload assets"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
          {selectedCampaignId && (
            <button
              type="button"
              className="btn-ui btn-ui-primary btn-ui-sm"
              onClick={() => setShowUploadModal(true)}
            >
              <UploadCloud size={14} />
              <span>Upload Asset</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="alert-ui alert-success mb-3">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <div className="flex-grow-1 text-xs">{successMsg}</div>
          <button
            type="button"
            className="btn-close ms-auto"
            style={{ fontSize: '0.65rem' }}
            onClick={() => setSuccessMsg('')}
          />
        </div>
      )}

      {error && (
        <div className="alert-ui alert-danger mb-3">
          <AlertCircle size={16} className="flex-shrink-0" />
          <div className="flex-grow-1 text-xs">{error}</div>
        </div>
      )}

      {/* Campaign Selector Toolbar */}
      <div className="toolbar-ui">
        <div className="d-flex align-items-center gap-2 flex-grow-1">
          <label className="text-xs fw-semibold text-muted text-nowrap">
            Filter by Campaign:
          </label>
          <select
            className="form-select-ui"
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
          >
            {campaigns.length === 0 && <option value="">No campaigns found</option>}
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.reference_code || `#CMP-${c.id}`}) — Status: {c.status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Media Assets Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary spinner-border-sm" role="status" />
          <p className="text-muted small mt-2">Loading creative media assets...</p>
        </div>
      ) : mediaAssets.length === 0 ? (
        <div className="card-enterprise">
          <EmptyState
            icon={ImageIcon}
            title="No creative assets uploaded for this campaign"
            description="Upload high-resolution artwork or video files for compliance verification."
            actionLabel="Upload Media"
            onAction={() => setShowUploadModal(true)}
          />
        </div>
      ) : (
        <div className="row g-4">
          {mediaAssets.map((asset) => (
            <div key={asset.id} className="col-12 col-md-6 col-lg-4">
              <div className="card-enterprise h-100 d-flex flex-column justify-content-between p-3.5">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2.5">
                    <StatusBadge
                      status={
                        asset.status === 'APPROVED'
                          ? 'active'
                          : asset.status === 'REJECTED'
                          ? 'rejected'
                          : 'pending'
                      }
                      label={asset.status}
                      size="sm"
                    />
                    <span className="badge bg-subtle text-secondary border font-monospace text-xs">
                      {asset.dimensions || '1920x1080'}
                    </span>
                  </div>

                  <AssetThumbnail
                    assetId={asset.id}
                    fileType={asset.file_type}
                    alt={asset.original_filename || asset.filename}
                    onPreview={(url, type, title) => setPreviewMedia({ url, type, title })}
                  />

                  <h4
                    className="fw-bold text-xs text-primary-emphasis text-truncate mb-1"
                    title={asset.original_filename || asset.filename}
                  >
                    {asset.original_filename || asset.filename}
                  </h4>

                  <div className="d-flex align-items-center gap-1 text-muted mb-2" style={{ fontSize: '0.72rem' }}>
                    <Clock size={11} />
                    <span>
                      {asset.created_at ? new Date(asset.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>

                  {asset.status === 'REJECTED' && asset.rejection_reason && (
                    <div className="p-2 rounded bg-danger-subtle border border-danger-subtle text-xs text-danger mb-2">
                      <strong>Rejection Note:</strong> {asset.rejection_reason}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="border-top pt-2.5 mt-2 d-flex justify-content-between align-items-center">
                  <div className="d-flex gap-1">
                    {canReview && asset.status === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          className="btn-ui btn-ui-sm btn-ui-primary"
                          onClick={() => handleReviewStatus(asset.id, 'APPROVED')}
                          title="Approve Asset"
                        >
                          <Check size={13} />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          className="btn-ui btn-ui-sm btn-ui-secondary text-danger"
                          onClick={() => setRejectingAssetId(asset.id)}
                          title="Reject Asset"
                        >
                          <X size={13} />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn-ui-icon text-danger"
                    onClick={() => handleDelete(asset.id)}
                    title="Delete Asset"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Asset Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Creative Asset"
        subtitle="Submit high-resolution artwork or video for review"
        size="md"
        footer={
          <>
            <button
              type="button"
              className="btn-ui btn-ui-secondary btn-ui-sm"
              onClick={() => setShowUploadModal(false)}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-ui btn-ui-primary btn-ui-sm"
              onClick={handleUploadSubmit}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Submit Media'}
            </button>
          </>
        }
      >
        <form onSubmit={handleUploadSubmit}>
          <div className="form-group-ui">
            <label className="form-label-ui">Media File (PNG, JPG, MP4, WebM) <span className="form-required">*</span></label>
            <input
              type="file"
              className="form-input-ui"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
          </div>

          <div className="form-group-ui mb-0">
            <label className="form-label-ui">Pixel Dimensions / Resolution</label>
            <input
              type="text"
              className="form-input-ui font-monospace"
              placeholder="e.g. 1920x1080 or 3840x2160"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Rejection Note Modal */}
      <Modal
        isOpen={!!rejectingAssetId}
        onClose={() => { setRejectingAssetId(null); setRejectionReason(''); }}
        title="Reject Creative Media"
        subtitle="Provide feedback reason to the advertiser"
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn-ui btn-ui-secondary btn-ui-sm"
              onClick={() => { setRejectingAssetId(null); setRejectionReason(''); }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-ui btn-ui-primary btn-ui-sm"
              onClick={() => handleReviewStatus(rejectingAssetId, 'REJECTED', rejectionReason)}
            >
              Confirm Rejection
            </button>
          </>
        }
      >
        <div className="form-group-ui mb-0">
          <label className="form-label-ui">Reason for Compliance Rejection</label>
          <textarea
            className="form-input-ui"
            rows="3"
            placeholder="e.g. Resolution below minimum 4K standard, text unreadable..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </div>
      </Modal>

      {/* Full Preview Modal */}
      <Modal
        isOpen={!!previewMedia}
        onClose={() => setPreviewMedia(null)}
        title={previewMedia?.title || 'Artwork Preview'}
        subtitle="High resolution artwork verification"
        size="lg"
        footer={
          <button
            type="button"
            className="btn-ui btn-ui-secondary btn-ui-sm"
            onClick={() => setPreviewMedia(null)}
          >
            Close
          </button>
        }
      >
        {previewMedia && (
          <div className="text-center">
            <img
              src={previewMedia.url}
              alt={previewMedia.title}
              style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }}
              className="rounded border"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CreativesPage;