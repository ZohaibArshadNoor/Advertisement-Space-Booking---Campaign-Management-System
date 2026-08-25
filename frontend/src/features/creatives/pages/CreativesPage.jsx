import React, { useState, useEffect } from 'react';
import { creativesApi } from '../creativesApi';
import { campaignService } from '../../../services/campaignService';
import { useAuth } from '../../../context/AuthContext';
import { extractErrorMessage } from '../../../utils/errorHandler';
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
  Plus 
} from 'lucide-react';

const STATUS_BADGES = {
  PENDING: 'bg-warning text-dark',
  APPROVED: 'bg-success',
  REJECTED: 'bg-danger',
};

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
      <div className="bg-light rounded p-4 text-center mb-3">
        <div className="spinner-border spinner-border-sm text-primary"></div>
        <div className="small text-muted mt-1">Loading artwork...</div>
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div className="bg-light rounded p-3 text-center mb-3 text-muted small d-flex align-items-center justify-content-center gap-1.5">
        <FileText size={16} />
        <span>Document File</span>
      </div>
    );
  }

  if (fileType?.startsWith('image/')) {
    return (
      <div
        className="rounded overflow-hidden mb-3 border position-relative"
        style={{ height: '180px', backgroundColor: '#111', cursor: 'pointer' }}
        onClick={() => onPreview(blobUrl, 'image', alt)}
        title="Click to view full image"
      >
        <img
          src={blobUrl}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
        <span className="badge bg-dark bg-opacity-75 position-absolute bottom-0 end-0 m-2">
          🔍 Click to view
        </span>
      </div>
    );
  }

  if (fileType?.startsWith('video/')) {
    return (
      <div className="rounded overflow-hidden mb-3 border" style={{ backgroundColor: '#000' }}>
        <video src={blobUrl} controls style={{ width: '100%', maxHeight: '180px' }} />
      </div>
    );
  }

  return (
    <div className="bg-light rounded p-3 text-center mb-3">
      <a href={blobUrl} download={alt} className="btn btn-sm btn-outline-primary">
        ⬇️ Download File
      </a>
    </div>
  );
};

const CreativesPage = () => {
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

  // Load user's or all campaigns
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

  // Fetch media for selected campaign
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
      return setError('Please select a file to upload.');
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
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Creative Assets</h2>
          <p className="text-muted small mb-0">Upload, manage, and verify campaign banners and media files</p>
        </div>
        {selectedCampaignId && (
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
            + Upload Asset
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger alert-dismissible">{error}</div>}
      {successMsg && <div className="alert alert-success alert-dismissible">{successMsg}</div>}

      {/* Campaign Selector Bar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-3">
              <label className="fw-semibold text-secondary small">Selected Campaign:</label>
            </div>
            <div className="col-md-9">
              <select
                className="form-select"
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
              >
                {campaigns.length === 0 && <option value="">No campaigns available</option>}
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.reference_code || `#${c.id}`}) — Status: {c.status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary"></div>
          <p className="text-muted mt-2">Loading creative assets...</p>
        </div>
      ) : mediaAssets.length === 0 ? (
        <div className="text-center py-5 card border-0 shadow-sm">
          <h5>No creative assets uploaded for this campaign</h5>
          <p className="text-muted small">Upload high-resolution artwork or video files to submit for review.</p>
        </div>
      ) : (
        <div className="row g-4">
          {mediaAssets.map((asset) => (
            <div key={asset.id} className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className={`badge ${STATUS_BADGES[asset.status] || 'bg-secondary'}`}>
                        {asset.status}
                      </span>
                      <span className="badge bg-light text-secondary border">
                        {asset.dimensions || 'Custom Spec'}
                      </span>
                    </div>

                    <AssetThumbnail
                      assetId={asset.id}
                      fileType={asset.file_type}
                      alt={asset.original_filename || asset.filename}
                      onPreview={(url, type, title) => setPreviewMedia({ url, type, title })}
                    />

                    <h6 className="fw-bold text-truncate mb-1" title={asset.original_filename || asset.filename}>
                      📄 {asset.original_filename || asset.filename}
                    </h6>

                    <p className="text-muted small mb-2">
                      Ref: <strong className="text-primary">{asset.media_reference}</strong> • Size: {asset.file_size_bytes ? `${(asset.file_size_bytes / (1024 * 1024)).toFixed(2)} MB` : 'N/A'} • Type: {asset.file_type || 'Media'}
                    </p>

                    {asset.rejection_reason && (
                      <div className="alert alert-danger py-2 small mb-2">
                        <strong>Rejection Reason:</strong> {asset.rejection_reason}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-top d-flex justify-content-between align-items-center">
                    <div>
                      {canReview && asset.status === 'PENDING' && (
                        <>
                          <button
                            className="btn btn-sm btn-success me-1"
                            onClick={() => handleReviewStatus(asset.id, 'APPROVED')}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-sm btn-danger me-1"
                            onClick={() => setRejectingAssetId(asset.id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDelete(asset.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Artwork Preview Modal */}
      {previewMedia && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }} onClick={() => setPreviewMedia(null)}>
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{previewMedia.title || 'Artwork Preview'}</h5>
                <button type="button" className="btn-close" onClick={() => setPreviewMedia(null)}></button>
              </div>
              <div className="modal-body text-center p-0 bg-dark rounded-bottom overflow-hidden">
                {previewMedia.type === 'image' && (
                  <img
                    src={previewMedia.url}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                  />
                )}
                {previewMedia.type === 'video' && (
                  <video src={previewMedia.url} controls autoPlay style={{ maxWidth: '100%', maxHeight: '70vh' }} />
                )}
              </div>
              <div className="modal-footer">
                <a href={previewMedia.url} download={previewMedia.title || 'artwork'} className="btn btn-primary btn-sm">
                  ⬇️ Download Original
                </a>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPreviewMedia(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Upload Creative Asset</h5>
                <button type="button" className="btn-close" onClick={() => setShowUploadModal(false)}></button>
              </div>
              <form onSubmit={handleUploadSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Asset File (Images, MP4, PDF) *</label>
                    <input
                      type="file"
                      className="form-control"
                      required
                      accept=".png,.jpg,.jpeg,.mp4,.pdf"
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Target Dimensions / Format</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 1920x1080 or Billboard Spec"
                      value={dimensions}
                      onChange={(e) => setDimensions(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload & Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingAssetId && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-danger">Reject Creative Asset</h5>
                <button type="button" className="btn-close" onClick={() => setRejectingAssetId(null)}></button>
              </div>
              <div className="modal-body">
                <label className="form-label">Reason for rejection *</label>
                <textarea
                  className="form-control"
                  rows="3"
                  required
                  placeholder="Explain what changes the advertiser must make..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                ></textarea>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setRejectingAssetId(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={!rejectionReason.trim()}
                  onClick={() => handleReviewStatus(rejectingAssetId, 'REJECTED', rejectionReason)}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreativesPage;