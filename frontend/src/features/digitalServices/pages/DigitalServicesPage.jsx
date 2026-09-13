import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { campaignsApi } from '../../campaigns/campaignsApi';
import { DIGITAL_CATEGORIES } from '../digitalServicesData';
import { digitalServicesApi } from '../digitalServicesApi';
import Modal from '../../../components/ui/Modal';
import EmptyState from '../../../components/ui/EmptyState';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import {
  Globe,
  Video,
  Search,
  Share2,
  Zap,
  Radio,
  Sparkles,
  CheckCircle2,
  Tag,
  Calendar,
  Layers,
  Info,
  DollarSign,
  TrendingUp,
  Percent,
  Check,
  Megaphone,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  X,
  Plus,
  Clock,
  Sliders,
  Calculator,
  Building2,
  Briefcase,
  Trash2,
  Edit2,
  RotateCcw
} from 'lucide-react';

const ICON_MAP = {
  Video: Video,
  Search: Search,
  Share2: Share2,
  Zap: Zap,
  Radio: Radio,
  Sparkles: Sparkles,
};

const PRESET_VOLUMES = [50, 100, 250, 500, 1000];

export const DigitalServicesPage = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'Advertiser';
  const isAdmin = userRole === 'Administrator' || userRole === 'Space Manager' || userRole === 'Sales Executive';

  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'custom' | 'booked'
  const [selectedCategory, setSelectedCategory] = useState('All Services');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [servicesCatalog, setServicesCatalog] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [bookedServices, setBookedServices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Booking Status Filter State
  const [bookedStatusFilter, setBookedStatusFilter] = useState('ALL');

  // Base Rates State (Dynamic & Editable by Admin)
  const [baseRates, setBaseRates] = useState(DIGITAL_BASE_RATES);
  const [editingBaseRate, setEditingBaseRate] = useState(null);
  const [editRateForm, setEditRateForm] = useState({
    platform: '',
    category: '',
    pricingModel: 'CPM',
    baseRatePerUnit: 100,
    unitName: '1,000 Views',
    minUnits: 50,
    desc: '',
  });
  const [savingBaseRate, setSavingBaseRate] = useState(false);
  const [showAddBaseRateModal, setShowAddBaseRateModal] = useState(false);
  const [newBaseRateForm, setNewBaseRateForm] = useState({
    platform: '',
    category: 'Video & OTT Ads',
    pricingModel: 'CPM',
    baseRatePerUnit: 150,
    unitName: '1,000 Impressions',
    minUnits: 50,
    desc: '',
  });
  const [baseRateToDelete, setBaseRateToDelete] = useState(null);
  const [deletingBaseRate, setDeletingBaseRate] = useState(false);

  // Catalog Service Deletion State
  const [catalogServiceToDelete, setCatalogServiceToDelete] = useState(null);
  const [deletingCatalogService, setDeletingCatalogService] = useState(false);

  // Booking Modal State (Pre-Built Packages)
  const [bookingService, setBookingService] = useState(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState(''); // Empty initially
  const [startDate, setStartDate] = useState('');
  const [calculatedEndDate, setCalculatedEndDate] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [modalError, setModalError] = useState('');

  // Admin: Create Digital Service Modal State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminFormData, setAdminFormData] = useState({
    title: '',
    category: '',
    platform: '',
    tagline: '',
    durationDays: '',
    originalPrice: '',
    discountedPrice: '',
    discountPercent: '',
    discountLabel: '',
    discountType: 'promo',
    estimatedReach: '',
    cpm: '',
    iconName: 'Video',
    colorTheme: 'primary',
    deliverablesText: '',
  });
  const [savingAdminService, setSavingAdminService] = useState(false);

  const handleOpenAdminModal = () => {
    setAdminFormData({
      title: '',
      category: '',
      platform: '',
      tagline: '',
      durationDays: '',
      originalPrice: '',
      discountedPrice: '',
      discountPercent: '',
      discountLabel: '',
      discountType: 'promo',
      estimatedReach: '',
      cpm: '',
      iconName: 'Video',
      colorTheme: 'primary',
      deliverablesText: '',
    });
    setShowAdminModal(true);
  };

  // Custom Package Calculator State
  const [customCalc, setCustomCalc] = useState({
    platform: '', // Empty initially
    durationDays: 30,
    targetVolume: 100, // e.g. 100k views/impressions
    campaignId: '', // Empty initially
  });
  const [customCalcResult, setCustomCalcResult] = useState(null);

  // SweetAlert Cancellation Dialog State
  const [serviceToCancel, setServiceToCancel] = useState(null);
  const [cancelingService, setCancelingService] = useState(false);

  // Toast notification
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success', title = '') => {
    setToast({ message, type, title });
    setTimeout(() => setToast(null), 4000);
  };

  const normalizeStatus = (status) => {
    if (!status) return 'PENDING';
    const s = String(status).toUpperCase().trim();
    if (['PENDING', 'APPROVED', 'PROVISIONED', 'ACTIVE', 'COMPLETED', 'REJECTED', 'CANCELLED'].includes(s)) {
      return s;
    }
    return 'PENDING';
  };

  const getStatusBadge = (status = 'PENDING') => {
    const s = normalizeStatus(status);
    switch (s) {
      case 'PENDING':
        return (
          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle text-xs px-2.5 py-1 d-inline-flex align-items-center gap-1">
            <Clock size={11} />
            <span>Pending Review</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="badge bg-info-subtle text-info border border-info-subtle text-xs px-2.5 py-1 d-inline-flex align-items-center gap-1">
            <Check size={11} />
            <span>Approved</span>
          </span>
        );
      case 'PROVISIONED':
        return (
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle text-xs px-2.5 py-1 d-inline-flex align-items-center gap-1">
            <ShieldCheck size={11} />
            <span>Provisioned</span>
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="badge bg-success text-white text-xs px-2.5 py-1 d-inline-flex align-items-center gap-1">
            <Zap size={11} />
            <span>Active (Live)</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle text-xs px-2.5 py-1">
            Completed
          </span>
        );
      case 'REJECTED':
        return (
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle text-xs px-2.5 py-1">
            Rejected
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="badge bg-light text-muted border text-xs px-2.5 py-1">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="badge bg-light text-dark border text-xs px-2.5 py-1">
            {status}
          </span>
        );
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const res = await digitalServicesApi.updateBookedServiceStatus(bookingId, newStatus);
      showToast(res.message || `Service status changed to ${newStatus}`, 'success', 'Status Updated');
      fetchBookedServices();
    } catch (err) {
      console.error('Failed to update status', err);
      showToast('Failed to update service status.', 'danger', 'Update Error');
    }
  };

  // Dynamic Price & Discount Calculation Helpers for Admin Modal
  const handleAdminOriginalPriceChange = (val) => {
    const orig = val === '' ? '' : Number(val);
    const pct = Number(adminFormData.discountPercent) || 0;
    const discounted = orig !== '' && orig > 0 ? Math.round(orig * (1 - pct / 100)) : '';
    setAdminFormData((prev) => ({
      ...prev,
      originalPrice: val,
      discountedPrice: discounted,
      discountLabel: pct > 0 ? `${pct}% OFF Special Offer` : (prev.discountLabel || ''),
    }));
  };

  const handleAdminDiscountPercentChange = (val) => {
    const pct = val === '' ? '' : Math.max(0, Math.min(100, Number(val)));
    const orig = Number(adminFormData.originalPrice) || 0;
    const discounted = orig > 0 && pct !== '' ? Math.round(orig * (1 - Number(pct) / 100)) : (orig > 0 ? orig : '');
    setAdminFormData((prev) => ({
      ...prev,
      discountPercent: val,
      discountedPrice: discounted,
      discountLabel: Number(pct) > 0 ? `${pct}% OFF Special Offer` : '',
    }));
  };

  const handleAdminDiscountedPriceChange = (val) => {
    const discounted = val === '' ? '' : Number(val);
    const orig = Number(adminFormData.originalPrice) || 0;
    let pct = 0;
    if (orig > 0 && discounted !== '' && discounted < orig) {
      pct = Math.round(((orig - discounted) / orig) * 100);
    }
    setAdminFormData((prev) => ({
      ...prev,
      discountedPrice: val,
      discountPercent: pct > 0 ? pct : '',
      discountLabel: pct > 0 ? `${pct}% OFF Special Offer` : '',
    }));
  };

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const res = await digitalServicesApi.getCatalog();
      setServicesCatalog(res.services || []);
    } catch (err) {
      console.error('Failed to load services catalog', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await campaignsApi.getCampaigns();
      const list = res.campaigns || res || [];
      setCampaigns(list);
    } catch (err) {
      console.error('Failed to load campaigns', err);
    }
  };

  const fetchBookedServices = async () => {
    try {
      const res = await digitalServicesApi.getBookedServices();
      setBookedServices(res.services || []);
    } catch (err) {
      console.error('Failed to load booked digital services', err);
    }
  };

  const fetchBaseRates = async () => {
    try {
      const res = await digitalServicesApi.getBaseRates();
      setBaseRates(res.baseRates || DIGITAL_BASE_RATES);
    } catch (err) {
      console.error('Failed to load base rates', err);
    }
  };

  useEffect(() => {
    fetchCatalog();
    fetchCampaigns();
    fetchBookedServices();
    fetchBaseRates();
  }, []);

  // Handlers for Base Rates Management
  const handleOpenEditBaseRate = (rate) => {
    setEditingBaseRate(rate);
    setEditRateForm({
      platform: rate.platform,
      category: rate.category,
      pricingModel: rate.pricingModel,
      baseRatePerUnit: rate.baseRatePerUnit,
      unitName: rate.unitName,
      minUnits: rate.minUnits,
      desc: rate.desc || '',
    });
  };

  const handleSaveEditBaseRate = async (e) => {
    e.preventDefault();
    if (!editingBaseRate) return;
    setSavingBaseRate(true);
    try {
      const res = await digitalServicesApi.updateBaseRate(editingBaseRate.platform, editRateForm);
      showToast(res.message, 'success', 'Base Rate Updated');
      setBaseRates(res.baseRates);
      setEditingBaseRate(null);
    } catch (err) {
      console.error('Failed to save base rate', err);
      showToast('Failed to update base rate.', 'danger', 'Error');
    } finally {
      setSavingBaseRate(false);
    }
  };

  const handleAddCustomBaseRate = async (e) => {
    e.preventDefault();
    if (!newBaseRateForm.platform.trim()) {
      showToast('Please provide a platform name.', 'warning', 'Required Field');
      return;
    }
    setSavingBaseRate(true);
    try {
      const res = await digitalServicesApi.addBaseRate(newBaseRateForm);
      showToast(res.message, 'success', 'Platform Added');
      setBaseRates(res.baseRates);
      setShowAddBaseRateModal(false);
      setNewBaseRateForm({
        platform: '',
        category: 'Video & OTT Ads',
        pricingModel: 'CPM',
        baseRatePerUnit: 150,
        unitName: '1,000 Impressions',
        minUnits: 50,
        desc: '',
      });
    } catch (err) {
      console.error('Failed to add platform base rate', err);
      showToast(err.message || 'Failed to add platform base rate.', 'danger', 'Error');
    } finally {
      setSavingBaseRate(false);
    }
  };

  const handleConfirmDeleteBaseRate = async () => {
    if (!baseRateToDelete) return;
    setDeletingBaseRate(true);
    try {
      const res = await digitalServicesApi.deleteBaseRate(baseRateToDelete.platform);
      showToast(res.message, 'info', 'Base Rate Removed');
      setBaseRates(res.baseRates);
      setBaseRateToDelete(null);
      if (customCalc.platform === baseRateToDelete.platform) {
        setCustomCalc((prev) => ({ ...prev, platform: '' }));
      }
    } catch (err) {
      console.error('Failed to delete base rate', err);
      showToast('Failed to remove platform base rate.', 'danger', 'Error');
    } finally {
      setDeletingBaseRate(false);
    }
  };

  const handleResetBaseRates = async () => {
    try {
      const res = await digitalServicesApi.resetBaseRates();
      showToast('Standard platform base rates have been restored to defaults.', 'success', 'Base Rates Reset');
      setBaseRates(res.baseRates);
    } catch (err) {
      console.error('Failed to reset base rates', err);
      showToast('Failed to reset base rates.', 'danger', 'Error');
    }
  };

  const handleConfirmDeleteCatalogService = async () => {
    if (!catalogServiceToDelete) return;
    setDeletingCatalogService(true);
    try {
      const res = await digitalServicesApi.deleteService(catalogServiceToDelete.id);
      showToast(res.message || `Service '${catalogServiceToDelete.title}' removed from catalog.`, 'info', 'Service Removed');
      setCatalogServiceToDelete(null);
      fetchCatalog();
    } catch (err) {
      console.error('Failed to delete service', err);
      showToast('Failed to delete digital service.', 'danger', 'Error');
    } finally {
      setDeletingCatalogService(false);
    }
  };

  // Update calculated end date whenever startDate or bookingService duration changes
  useEffect(() => {
    if (startDate && bookingService) {
      const duration = bookingService.durationDays || 30;
      const start = new Date(startDate);
      const end = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);
      setCalculatedEndDate(end.toISOString().split('T')[0]);
    }
  }, [startDate, bookingService]);

  // Recalculate Custom Package Price
  useEffect(() => {
    if (!customCalc.platform) {
      setCustomCalcResult(null);
      return;
    }
    const baseRateObj = baseRates.find((b) => b.platform === customCalc.platform);
    if (!baseRateObj) return;

    const units = Number(customCalc.targetVolume) || baseRateObj.minUnits;
    const baseTotal = units * baseRateObj.baseRatePerUnit;
    
    // Apply duration factor & volume discount
    let volumeDiscountPct = 0;
    if (units >= 500) volumeDiscountPct = 15;
    else if (units >= 200) volumeDiscountPct = 10;
    else if (units >= 100) volumeDiscountPct = 5;

    const discountAmount = Math.round((baseTotal * volumeDiscountPct) / 100);
    const finalPrice = baseTotal - discountAmount;

    setCustomCalcResult({
      platform: baseRateObj.platform,
      category: baseRateObj.category,
      units,
      unitName: baseRateObj.unitName,
      pricingModel: baseRateObj.pricingModel,
      baseTotal,
      volumeDiscountPct,
      discountAmount,
      finalPrice,
      durationDays: customCalc.durationDays,
    });
  }, [customCalc, baseRates]);

  // Filtered Services
  const filteredServices = servicesCatalog.filter((srv) => {
    const matchesCategory = selectedCategory === 'All Services' || srv.category === selectedCategory;
    const matchesSearch =
      srv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (srv.tagline && srv.tagline.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (srv.platform && srv.platform.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleOpenBooking = (service) => {
    setModalError('');
    setBookingService(service);
    setSelectedCampaignId(''); // Empty initially so user explicitly chooses
    
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    const duration = service.durationDays || 30;
    const end = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
    setCalculatedEndDate(end.toISOString().split('T')[0]);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!selectedCampaignId) {
      setModalError('Please select an active campaign to affiliate this digital service.');
      return;
    }

    const selectedCampaign = campaigns.find((c) => String(c.id) === String(selectedCampaignId));
    const initialStatus = isAdmin ? 'PROVISIONED' : 'PENDING';

    setSubmittingBooking(true);
    try {
      const res = await digitalServicesApi.bookDigitalService({
        campaign_id: selectedCampaignId,
        campaign_name: selectedCampaign?.name,
        service_id: bookingService.id,
        service_title: bookingService.title,
        platform: bookingService.platform,
        category: bookingService.category,
        original_price: bookingService.originalPrice,
        agreed_price: bookingService.discountedPrice,
        discount_applied: bookingService.discountLabel,
        duration_days: bookingService.durationDays || 30,
        start_date: startDate,
        end_date: calculatedEndDate,
        is_standalone: false,
        status: initialStatus,
        requester_name: user?.name || 'Advertiser',
      });

      showToast(
        isAdmin
          ? res.message
          : `Service request submitted! Status is Pending Admin Review.`,
        'success',
        isAdmin ? 'Service Provisioned' : 'Request Submitted'
      );
      setBookingService(null);
      fetchBookedServices();
    } catch (err) {
      console.error('Booking failed', err);
      setModalError('Failed to activate digital service. Please try again.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Custom Package Direct Activation
  const handleBookCustomPackage = async () => {
    if (!customCalcResult) return;
    if (!customCalc.campaignId) {
      showToast('Please select an active campaign for this custom package.', 'warning', 'Campaign Required');
      return;
    }

    const selectedCampaign = campaigns.find((c) => String(c.id) === String(customCalc.campaignId));
    const today = new Date().toISOString().split('T')[0];
    const duration = customCalcResult.durationDays;
    const end = new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const initialStatus = isAdmin ? 'PROVISIONED' : 'PENDING';

    try {
      const res = await digitalServicesApi.bookDigitalService({
        campaign_id: customCalc.campaignId,
        campaign_name: selectedCampaign?.name,
        service_id: `custom_${Date.now().toString().slice(-4)}`,
        service_title: `Custom ${customCalcResult.platform} (${customCalcResult.units}k ${customCalcResult.unitName})`,
        platform: customCalcResult.platform,
        category: customCalcResult.category,
        original_price: customCalcResult.baseTotal,
        agreed_price: customCalcResult.finalPrice,
        discount_applied: customCalcResult.volumeDiscountPct > 0 ? `${customCalcResult.volumeDiscountPct}% Volume Discount` : 'Custom Base Rate',
        duration_days: duration,
        start_date: today,
        end_date: end,
        is_standalone: false,
        status: initialStatus,
        requester_name: user?.name || 'Advertiser',
      });

      showToast(
        isAdmin
          ? res.message
          : `Custom package request submitted! Status is Pending Admin Review.`,
        'success',
        isAdmin ? 'Custom Package Provisioned' : 'Request Submitted'
      );
      fetchBookedServices();
      setActiveTab('booked');
    } catch (err) {
      console.error('Custom booking failed', err);
      showToast('Failed to activate custom package.', 'danger', 'Error');
    }
  };

  // Admin Create Service Submit
  const handleAdminCreateService = async (e) => {
    e.preventDefault();
    if (!adminFormData.title.trim() || !adminFormData.platform || !adminFormData.category) {
      showToast('Please fill all required fields.', 'warning', 'Incomplete Form');
      return;
    }

    setSavingAdminService(true);
    try {
      const deliverablesList = adminFormData.deliverablesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await digitalServicesApi.createService({
        ...adminFormData,
        deliverables: deliverablesList,
      });

      showToast(res.message, 'success', 'Catalog Updated');
      setShowAdminModal(false);
      fetchCatalog();
    } catch (err) {
      console.error('Admin create failed', err);
      showToast('Failed to create service.', 'danger', 'Error');
    } finally {
      setSavingAdminService(false);
    }
  };

  const handleOpenCancelDialog = (service) => {
    setServiceToCancel(service);
  };

  const handleConfirmCancelService = async () => {
    if (!serviceToCancel) return;
    setCancelingService(true);
    try {
      await digitalServicesApi.removeBookedService(serviceToCancel.id);
      showToast('Digital service reservation cancelled successfully.', 'info', 'Reservation Cancelled');
      setServiceToCancel(null);
      fetchBookedServices();
    } catch (err) {
      console.error('Failed to remove service', err);
      showToast('Failed to cancel service reservation.', 'danger', 'Error');
    } finally {
      setCancelingService(false);
    }
  };

  const selectedCampaignObj = campaigns.find((c) => String(c.id) === String(selectedCampaignId));
  const customSelectedCampaignObj = campaigns.find((c) => String(c.id) === String(customCalc.campaignId));
  const selectedBaseRate = DIGITAL_BASE_RATES.find((b) => b.platform === customCalc.platform);

  const filteredBookedServices = bookedServices.filter((bk) => {
    if (bookedStatusFilter === 'ALL') return true;
    return normalizeStatus(bk.status) === bookedStatusFilter;
  });

  const bookedCounts = {
    ALL: bookedServices.length,
    PENDING: bookedServices.filter((b) => normalizeStatus(b.status) === 'PENDING').length,
    APPROVED: bookedServices.filter((b) => normalizeStatus(b.status) === 'APPROVED').length,
    PROVISIONED: bookedServices.filter((b) => normalizeStatus(b.status) === 'PROVISIONED').length,
    ACTIVE: bookedServices.filter((b) => normalizeStatus(b.status) === 'ACTIVE').length,
    COMPLETED: bookedServices.filter((b) => normalizeStatus(b.status) === 'COMPLETED').length,
    REJECTED: bookedServices.filter((b) => normalizeStatus(b.status) === 'REJECTED').length,
    CANCELLED: bookedServices.filter((b) => normalizeStatus(b.status) === 'CANCELLED').length,
  };

  return (
    <div className="d-flex flex-column gap-4 w-100" style={{ boxSizing: 'border-box' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div
          className={`position-fixed top-0 end-0 m-4 p-3 rounded-3 shadow-lg border d-flex align-items-center gap-3 bg-surface z-toast transition-all`}
          style={{
            zIndex: 9999,
            maxWidth: '380px',
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: toast.type === 'success' ? 'var(--color-success-border)' : 'var(--color-brand-500)',
          }}
        >
          <div
            className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-white p-2`}
            style={{ backgroundColor: toast.type === 'success' ? 'var(--color-success-dot)' : 'var(--color-brand-600)' }}
          >
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <Info size={16} />}
          </div>
          <div style={{ minWidth: 0 }}>
            {toast.title && <div className="fw-bold text-xs text-primary-emphasis">{toast.title}</div>}
            <div className="text-xs text-secondary text-truncate" style={{ fontSize: '0.78rem' }}>
              {toast.message}
            </div>
          </div>
          <button
            type="button"
            className="btn-close ms-auto"
            onClick={() => setToast(null)}
            style={{ fontSize: '0.65rem' }}
          />
        </div>
      )}

      {/* Header Banner (Clean, Professional) */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 pb-3 border-bottom w-100" style={{ boxSizing: 'border-box' }}>
        <div style={{ minWidth: 0 }}>
          <h1 className="fs-4 fw-bold text-primary-emphasis mb-1">
            Digital Marketing Services &amp; Ad Packages
          </h1>
          <p className="text-muted text-xs mb-0">
            Select fixed-duration YouTube Ads, Meta Reels, Google PPC, and Programmatic RTB packages or build a custom campaign package.
          </p>
        </div>

        {/* Action & Tab Buttons */}
        <div className="d-flex align-items-center gap-2 flex-wrap flex-shrink-0">
          {isAdmin && (
            <button
              type="button"
              className="btn-ui btn-ui-secondary btn-ui-sm d-inline-flex align-items-center gap-1.5"
              onClick={handleOpenAdminModal}
              title="Add a new digital package to the catalog"
            >
              <Plus size={14} className="flex-shrink-0 text-primary" />
              <span>Add Digital Service</span>
            </button>
          )}

          <button
            type="button"
            className={`btn-ui btn-ui-sm d-inline-flex align-items-center gap-1.5 ${
              activeTab === 'catalog' ? 'btn-ui-primary' : 'btn-ui-secondary'
            }`}
            onClick={() => setActiveTab('catalog')}
          >
            <Globe size={14} className="flex-shrink-0" />
            <span>Pre-Built Packages</span>
          </button>

          <button
            type="button"
            className={`btn-ui btn-ui-sm d-inline-flex align-items-center gap-1.5 ${
              activeTab === 'custom' ? 'btn-ui-primary' : 'btn-ui-secondary'
            }`}
            onClick={() => setActiveTab('custom')}
          >
            <Calculator size={14} className="flex-shrink-0" />
            <span>Custom Package &amp; Base Rates</span>
          </button>

          <button
            type="button"
            className={`btn-ui btn-ui-sm d-inline-flex align-items-center gap-1.5 ${
              activeTab === 'booked' ? 'btn-ui-primary' : 'btn-ui-secondary'
            }`}
            onClick={() => setActiveTab('booked')}
          >
            <Layers size={14} className="flex-shrink-0" />
            <span>My Booked Services ({bookedServices.length})</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: PRE-BUILT CATALOG PACKAGES
          ========================================================================= */}
      {activeTab === 'catalog' && (
        <>
          {/* Controls Bar: Category Pills & Themed Search */}
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 w-100" style={{ boxSizing: 'border-box' }}>
            {/* Category Filter Pills (Generous 8px gap, zero collision) */}
            <div className="d-flex align-items-center gap-2 flex-wrap pb-1" style={{ maxWidth: '100%' }}>
              {DIGITAL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`btn btn-sm text-xs rounded-pill px-3 py-1.5 flex-shrink-0 transition-all ${
                    selectedCategory === cat
                      ? 'btn-primary fw-bold text-white shadow-xs'
                      : 'btn-outline-secondary border-subtle text-secondary'
                  }`}
                  style={{ fontSize: '0.74rem' }}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Themed Search Input */}
            <div className="position-relative flex-shrink-0" style={{ width: '100%', maxWidth: '320px' }}>
              <Search
                size={15}
                className="position-absolute top-50 start-0 translate-middle-y ms-3 text-primary"
              />
              <input
                type="text"
                className="form-control-ui form-control-ui-sm ps-5 pe-4 w-100"
                placeholder="Search packages, channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '0.8rem', height: '38px', borderRadius: 'var(--radius-md)' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn-ui-icon position-absolute top-50 end-0 translate-middle-y me-2"
                  onClick={() => setSearchQuery('')}
                  style={{ width: '20px', height: '20px' }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Service Cards Grid (Strict Equal Widths, No-Collision Flex) */}
          <div className="ui-service-grid">
            {filteredServices.map((service) => {
              const IconComponent = ICON_MAP[service.iconName] || Globe;
              const discountClass =
                service.discountType === 'promo'
                  ? 'ui-discount-tag-promo'
                  : service.discountType === 'bundle'
                  ? 'ui-discount-tag-bundle'
                  : 'ui-discount-tag-growth';

              return (
                <div key={service.id} className="ui-service-card shadow-xs">
                  <div>
                    {/* Header: Icon & Discount Pill */}
                    <div className="ui-service-header">
                      <div
                        className="ui-service-icon-box"
                        style={{
                          backgroundColor:
                            service.colorTheme === 'danger'
                              ? 'rgba(220, 38, 38, 0.1)'
                              : service.colorTheme === 'primary'
                              ? 'rgba(37, 99, 235, 0.1)'
                              : service.colorTheme === 'info'
                              ? 'rgba(2, 132, 199, 0.1)'
                              : service.colorTheme === 'warning'
                              ? 'rgba(217, 119, 6, 0.1)'
                              : 'rgba(124, 58, 237, 0.1)',
                          color:
                            service.colorTheme === 'danger'
                              ? '#dc2626'
                              : service.colorTheme === 'primary'
                              ? '#2563eb'
                              : service.colorTheme === 'info'
                              ? '#0284c7'
                              : service.colorTheme === 'warning'
                              ? '#d97706'
                              : '#7c3aed',
                        }}
                      >
                        <IconComponent size={22} className="flex-shrink-0" />
                      </div>

                      <div className="d-flex align-items-center gap-1.5 ms-auto">
                        <span className={`ui-discount-tag ${discountClass}`}>
                          <Percent size={11} className="flex-shrink-0" />
                          <span>{service.discountLabel}</span>
                        </span>

                        {isAdmin && (
                          <button
                            type="button"
                            className="btn-ui btn-ui-secondary btn-ui-sm text-danger p-0 d-inline-flex align-items-center justify-content-center flex-shrink-0"
                            onClick={() => setCatalogServiceToDelete(service)}
                            title="Delete Catalog Package"
                            style={{ width: '28px', height: '28px' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title, Platform & Clean Separated Badges */}
                    <div className="mb-2.5" style={{ minWidth: 0 }}>
                      <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                        <span className="badge bg-secondary-subtle text-secondary text-xs" style={{ fontSize: '0.7rem' }}>
                          {service.platform}
                        </span>
                        <span className="badge bg-light-subtle text-muted border text-xs" style={{ fontSize: '0.7rem' }}>
                          {service.category}
                        </span>
                        <span className="badge bg-primary-subtle text-primary text-xs d-inline-flex align-items-center gap-1" style={{ fontSize: '0.7rem' }}>
                          <Clock size={11} className="flex-shrink-0" />
                          <span>{service.durationDays || 30} Days Fixed Run</span>
                        </span>
                      </div>
                      <h4 className="fw-bold text-xs text-primary-emphasis mb-1.5" style={{ fontSize: '1.02rem', lineHeight: '1.35' }}>
                        {service.title}
                      </h4>
                      <p className="text-muted text-xs mb-3" style={{ fontSize: '0.77rem', lineHeight: '1.45' }}>
                        {service.tagline}
                      </p>
                    </div>

                    {/* Reach & CPM Metric Strip */}
                    <div className="p-2.5 rounded-2 bg-light-subtle border mb-3 d-flex align-items-center justify-content-between text-xs" style={{ boxSizing: 'border-box' }}>
                      <div className="d-flex align-items-center gap-1.5" style={{ minWidth: 0 }}>
                        <TrendingUp size={14} className="text-primary flex-shrink-0" />
                        <span className="text-truncate fw-semibold text-primary-emphasis" style={{ fontSize: '0.74rem' }}>
                          {service.estimatedReach}
                        </span>
                      </div>
                      <span className="badge bg-success-subtle text-success flex-shrink-0 font-monospace" style={{ fontSize: '0.7rem' }}>
                        {service.cpm}
                      </span>
                    </div>

                    {/* Deliverables List */}
                    <div className="d-flex flex-column gap-1.5 mb-3" style={{ width: '100%' }}>
                      <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.66rem', letterSpacing: '0.5px' }}>
                        Included Deliverables:
                      </div>
                      {service.deliverables.map((item, idx) => (
                        <div key={idx} className="ui-deliverable-item">
                          <Check size={13} className="text-success flex-shrink-0 mt-0.5" />
                          <span title={item}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Pricing & Action */}
                  <div>
                    <div className="ui-pricing-bar">
                      <div className="d-flex align-items-baseline gap-2" style={{ minWidth: 0 }}>
                        <span className="fs-5 fw-bold text-primary-emphasis font-monospace">
                          Rs. {service.discountedPrice.toLocaleString()}
                        </span>
                        <span className="text-muted text-decoration-line-through font-monospace" style={{ fontSize: '0.76rem' }}>
                          Rs. {service.originalPrice.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-success text-xs fw-semibold ms-auto" style={{ fontSize: '0.72rem' }}>
                        Save {service.discountPercent}%
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn-ui btn-ui-primary btn-ui-sm w-100 mt-3 d-inline-flex align-items-center justify-content-center gap-1.5 py-2"
                      onClick={() => handleOpenBooking(service)}
                    >
                      <Zap size={14} className="flex-shrink-0" />
                      <span>Book Package ({service.durationDays || 30} Days)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* =========================================================================
          TAB 2: CUSTOM PACKAGE CALCULATOR & BASE RATES
          ========================================================================= */}
      {activeTab === 'custom' && (
        <div className="d-flex flex-column gap-4 w-100" style={{ boxSizing: 'border-box' }}>
          
          {/* Section 1: Standard Base Rates Table */}
          <div className="card-ui p-4 border w-100" style={{ boxSizing: 'border-box' }}>
            <div className="pb-2.5 mb-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <h5 className="fw-bold text-xs text-primary-emphasis text-uppercase mb-0.5" style={{ letterSpacing: '0.5px' }}>
                  Digital Advertising Standard Base Rates
                </h5>
                <span className="text-muted text-xs">
                  Official platform baseline unit costs before volume tier discounts
                </span>
              </div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      className="btn-ui btn-ui-secondary btn-ui-sm d-inline-flex align-items-center gap-1.5"
                      onClick={() => setShowAddBaseRateModal(true)}
                      title="Add a custom platform base rate"
                    >
                      <Plus size={13} className="text-primary flex-shrink-0" />
                      <span>Add Custom Platform</span>
                    </button>
                    <button
                      type="button"
                      className="btn-ui btn-ui-secondary btn-ui-sm d-inline-flex align-items-center gap-1.5"
                      onClick={handleResetBaseRates}
                      title="Reset all base rates to system defaults"
                    >
                      <RotateCcw size={13} className="text-secondary flex-shrink-0" />
                      <span>Reset Defaults</span>
                    </button>
                  </>
                )}
                <span className="badge bg-primary-subtle text-primary text-xs">
                  Transparent Pricing
                </span>
              </div>
            </div>

            <div className="table-responsive">
              <table className="enterprise-table mb-0">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Category</th>
                    <th>Pricing Model</th>
                    <th>Base Unit Rate</th>
                    <th>Minimum Order</th>
                    <th>Description</th>
                    {isAdmin && <th className="text-end" style={{ width: '100px' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {baseRates.map((rate, idx) => (
                    <tr key={rate.platform || idx}>
                      <td>
                        <div className="fw-bold text-xs text-primary-emphasis">{rate.platform}</div>
                      </td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary text-xs">{rate.category}</span>
                      </td>
                      <td>
                        <span className="text-xs font-monospace">{rate.pricingModel}</span>
                      </td>
                      <td>
                        <span className="fw-bold text-primary font-monospace text-xs">
                          Rs. {rate.baseRatePerUnit} / {rate.unitName}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-muted font-monospace">
                          {rate.minUnits?.toLocaleString()} {rate.unitName}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-secondary">{rate.desc}</span>
                      </td>
                      {isAdmin && (
                        <td className="text-end">
                          <div className="d-flex align-items-center justify-content-end gap-1">
                            <button
                              type="button"
                              className="btn-ui btn-ui-secondary btn-ui-sm text-primary p-0 d-inline-flex align-items-center justify-content-center"
                              onClick={() => handleOpenEditBaseRate(rate)}
                              title={`Edit base rate for ${rate.platform}`}
                              style={{ width: '30px', height: '30px' }}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn-ui btn-ui-secondary btn-ui-sm text-danger p-0 d-inline-flex align-items-center justify-content-center"
                              onClick={() => setBaseRateToDelete(rate)}
                              title={`Delete ${rate.platform}`}
                              style={{ width: '30px', height: '30px' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Interactive Custom Package Calculator (Cohesive Aligned Layout) */}
          <div className="card-ui p-4 border w-100" style={{ boxSizing: 'border-box' }}>
            <div className="pb-2.5 mb-3 border-bottom">
              <h5 className="fw-bold text-xs text-primary-emphasis text-uppercase mb-0.5" style={{ letterSpacing: '0.5px' }}>
                Build a Custom Digital Advertising Package
              </h5>
              <span className="text-muted text-xs">
                Select a channel, set your target reach volume, and choose duration to automatically compute investment.
              </span>
            </div>

            <div className="row g-3 align-items-end">
              {/* 1. Select Platform (44px height aligned, generous padding) */}
              <div className="col-12 col-md-4">
                <label className="form-label-ui fw-semibold text-xs mb-1.5 d-block">
                  Advertising Platform <span className="text-danger">*</span>
                </label>
                <select
                  className="ui-calc-select w-100"
                  value={customCalc.platform}
                  onChange={(e) => setCustomCalc({ ...customCalc, platform: e.target.value })}
                >
                  <option value="">-- Select Platform --</option>
                  {baseRates.map((b) => (
                    <option key={b.platform} value={b.platform}>
                      {b.platform} (Rs. {b.baseRatePerUnit} / {b.unitName})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Target Reach Volume with Integrated Unit Suffix Addon (44px height aligned) */}
              <div className="col-12 col-md-4">
                <div className="d-flex align-items-center justify-content-between mb-1.5">
                  <label className="form-label-ui fw-semibold text-xs mb-0">
                    Target Volume <span className="text-danger">*</span>
                  </label>
                  <div className="d-flex align-items-center gap-1">
                    {PRESET_VOLUMES.map((pv) => (
                      <button
                        key={pv}
                        type="button"
                        className={`ui-quick-preset-btn ${customCalc.targetVolume === pv ? 'active' : ''}`}
                        onClick={() => setCustomCalc({ ...customCalc, targetVolume: pv })}
                        title={`Set ${pv}k units`}
                      >
                        {pv >= 1000 ? '1M' : `${pv}k`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ui-input-unit-group">
                  <input
                    type="number"
                    min="10"
                    step="10"
                    placeholder="e.g. 100"
                    value={customCalc.targetVolume}
                    onChange={(e) => setCustomCalc({ ...customCalc, targetVolume: e.target.value })}
                  />
                  <div className="unit-addon">
                    {selectedBaseRate ? `k ${selectedBaseRate.unitName.replace('1,000 ', '')}` : 'k Units'}
                  </div>
                </div>
              </div>

              {/* 3. Campaign Flight Duration (44px height aligned) */}
              <div className="col-12 col-md-4">
                <label className="form-label-ui fw-semibold text-xs mb-1.5 d-block">
                  Flight Duration
                </label>
                <select
                  className="ui-calc-select w-100"
                  value={customCalc.durationDays}
                  onChange={(e) => setCustomCalc({ ...customCalc, durationDays: Number(e.target.value) })}
                >
                  <option value={7}>7 Days (Sprint Blitz)</option>
                  <option value={14}>14 Days (Standard Two-Week Run)</option>
                  <option value={30}>30 Days (Full Month Flight)</option>
                  <option value={60}>60 Days (Enterprise Two-Month Flight)</option>
                  <option value={90}>90 Days (Quarterly Campaign Flight)</option>
                </select>
              </div>
            </div>

            {/* Price Calculation Output & Campaign Affiliation Card */}
            {customCalcResult ? (
              <div className="ui-calc-result-box">
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
                  <div>
                    <div className="fw-bold text-xs text-primary-emphasis fs-6 mb-1.5 d-flex align-items-center gap-2 flex-wrap">
                      <span>Custom {customCalcResult.platform} Plan</span>
                      <span className="badge bg-primary-subtle text-primary py-0.5 px-2 text-xs">
                        {customCalcResult.durationDays} Days Flight
                      </span>
                    </div>
                    <div className="text-muted text-xs" style={{ lineHeight: '1.5' }}>
                      Target Volume: {(customCalcResult.units * 1000).toLocaleString()} {customCalcResult.platform === 'Google Ads' ? 'Intent Clicks' : 'Views / Impressions'} • Base Rate: Rs. {customCalcResult.baseTotal.toLocaleString()}
                      {customCalcResult.volumeDiscountPct > 0 && (
                        <span className="text-success ms-2 fw-semibold">
                          ({customCalcResult.volumeDiscountPct}% Volume Savings: -Rs. {customCalcResult.discountAmount.toLocaleString()})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-md-end flex-shrink-0">
                    <div className="fs-4 fw-bold text-primary font-monospace">
                      Rs. {customCalcResult.finalPrice.toLocaleString()}
                    </div>
                    <div className="text-muted text-xs">Agreed Package Investment</div>
                  </div>
                </div>

                {/* Campaign Selection Row (Cleanly Formatted with Standalone Option) */}
                <div className="pt-3 border-top">
                  <label className="form-label-ui fw-semibold text-xs mb-1.5 d-block">
                    Affiliate to Campaign (or Direct Booking) <span className="text-danger">*</span>
                  </label>

                  <div className="d-flex flex-column flex-md-row align-items-stretch gap-2.5">
                    <div className="flex-fill" style={{ minWidth: 0 }}>
                      <select
                        className="ui-calc-select w-100"
                        value={customCalc.campaignId}
                        onChange={(e) => setCustomCalc({ ...customCalc, campaignId: e.target.value })}
                      >
                        <option value="">-- Select an Option --</option>
                        <option value="STANDALONE">Direct Standalone Booking (No Campaign Affiliation)</option>
                        {campaigns.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} • Total Budget: Rs. {parseFloat(c.budget || 1500000).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      className="btn-ui btn-ui-primary btn-ui-sm d-inline-flex align-items-center justify-content-center gap-1.5 px-4 flex-shrink-0"
                      onClick={handleBookCustomPackage}
                      disabled={!customCalc.campaignId}
                      style={{ height: '44px', minWidth: '180px' }}
                    >
                      <Zap size={14} className="flex-shrink-0" />
                      <span>Book Custom Package</span>
                    </button>
                  </div>

                  {/* Selected Campaign / Standalone Preview Box */}
                  {customCalc.campaignId === 'STANDALONE' ? (
                    <div className="ui-campaign-preview-box mt-2.5">
                      <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                        <Zap size={16} className="text-success flex-shrink-0" />
                        <div style={{ minWidth: 0 }}>
                          <div className="fw-bold text-xs text-primary-emphasis text-truncate">
                            Direct Standalone Booking
                          </div>
                          <div className="text-muted text-xs" style={{ fontSize: '0.72rem' }}>
                            Independent digital deployment without campaign affiliation
                          </div>
                        </div>
                      </div>
                      <span className="badge bg-success text-white text-xs px-2.5 py-1 font-monospace flex-shrink-0">
                        Direct Booking
                      </span>
                    </div>
                  ) : customSelectedCampaignObj ? (
                    <div className="ui-campaign-preview-box mt-2.5">
                      <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                        <Briefcase size={16} className="text-primary flex-shrink-0" />
                        <div style={{ minWidth: 0 }}>
                          <div className="fw-bold text-xs text-primary-emphasis text-truncate">
                            {customSelectedCampaignObj.name}
                          </div>
                          <div className="text-muted text-xs" style={{ fontSize: '0.72rem' }}>
                            Channel: {customSelectedCampaignObj.marketing_channel || 'Digital Marketing'}
                          </div>
                        </div>
                      </div>
                      <span className="badge bg-primary text-white text-xs px-2.5 py-1 font-monospace flex-shrink-0">
                        Budget: Rs. {parseFloat(customSelectedCampaignObj.budget || 1500000).toLocaleString()}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="mt-3 p-3 rounded-2 border text-center text-muted text-xs bg-surface" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
                Select an advertising platform above to configure custom audience volume and flight duration.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: MY BOOKED DIGITAL SERVICES / SERVICE REQUESTS
          ========================================================================= */}
      {activeTab === 'booked' && (
        <div className="d-flex flex-column gap-3 w-100" style={{ boxSizing: 'border-box' }}>
          
          {/* Status Filter Chips Bar (No Header Label, Zero Collision) */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2.5 p-3 rounded-3 border bg-surface" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {[
                { id: 'ALL', label: 'All Requests', count: bookedCounts.ALL },
                { id: 'PENDING', label: 'Pending Review', count: bookedCounts.PENDING, color: 'warning' },
                { id: 'APPROVED', label: 'Approved', count: bookedCounts.APPROVED, color: 'info' },
                { id: 'PROVISIONED', label: 'Provisioned', count: bookedCounts.PROVISIONED, color: 'primary' },
                { id: 'ACTIVE', label: 'Active (Live)', count: bookedCounts.ACTIVE, color: 'success' },
                { id: 'COMPLETED', label: 'Completed', count: bookedCounts.COMPLETED, color: 'secondary' },
                { id: 'REJECTED', label: 'Rejected', count: bookedCounts.REJECTED, color: 'danger' },
                { id: 'CANCELLED', label: 'Cancelled', count: bookedCounts.CANCELLED, color: 'muted' },
              ].map((filterTab) => (
                <button
                  key={filterTab.id}
                  type="button"
                  className={`btn-ui btn-ui-sm py-1.5 px-3 d-inline-flex align-items-center gap-2 text-xs transition-all ${
                    bookedStatusFilter === filterTab.id ? 'btn-ui-primary' : 'btn-ui-secondary'
                  }`}
                  onClick={() => setBookedStatusFilter(filterTab.id)}
                  style={{ fontSize: '0.76rem', borderRadius: 'var(--radius-full)' }}
                >
                  <span>{filterTab.label}</span>
                  <span
                    className={`badge rounded-pill ${
                      bookedStatusFilter === filterTab.id
                        ? 'bg-white text-primary'
                        : filterTab.color
                        ? `bg-${filterTab.color}-subtle text-${filterTab.color}`
                        : 'bg-secondary-subtle text-secondary'
                    }`}
                    style={{ fontSize: '0.68rem', padding: '0.18rem 0.45rem' }}
                  >
                    {filterTab.count}
                  </span>
                </button>
              ))}
            </div>

            {isAdmin && (
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle text-xs px-3 py-1.5 flex-shrink-0">
                Admin Status Management Active
              </span>
            )}
          </div>

          {bookedServices.length === 0 ? (
            <div className="card-ui p-5 text-center">
              <EmptyState
                icon={Globe}
                title="No Digital Services Booked Yet"
                description="Explore our high-impact YouTube, Meta, Google Search, and Programmatic advertising packages to launch your first digital campaign."
                actionLabel="Explore Digital Catalog"
                onAction={() => setActiveTab('catalog')}
              />
            </div>
          ) : filteredBookedServices.length === 0 ? (
            <div className="card-ui p-4 text-center border">
              <p className="text-muted text-xs mb-2">No booked digital services found matching filter '{bookedStatusFilter}'.</p>
              <button
                type="button"
                className="btn-ui btn-ui-secondary btn-ui-sm"
                onClick={() => setBookedStatusFilter('ALL')}
              >
                Clear Filter
              </button>
            </div>
          ) : (
            <div className="card-ui p-0 overflow-hidden border">
              <div className="p-3 border-bottom bg-light-subtle d-flex align-items-center justify-content-between flex-wrap gap-2">
                <span className="fw-bold text-xs text-primary-emphasis text-uppercase" style={{ letterSpacing: '0.5px' }}>
                  Digital Marketing Deployments &amp; Service Requests ({filteredBookedServices.length})
                </span>
                <span className="text-muted text-xs">
                  Showing {bookedStatusFilter === 'ALL' ? 'all' : bookedStatusFilter.toLowerCase()} services
                </span>
              </div>
              <div className="table-responsive">
                <table className="enterprise-table mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: '10%' }}>Ref ID</th>
                      <th style={{ width: '22%' }}>Digital Service</th>
                      <th style={{ width: '18%' }}>Affiliation / Requester</th>
                      <th style={{ width: '14%' }}>Flight Window</th>
                      <th style={{ width: '12%' }}>Agreed Fee</th>
                      <th style={{ width: '10%' }}>Status</th>
                      <th style={{ width: '14%' }} className="text-end">Management</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookedServices.map((bk) => {
                      const currentStatus = normalizeStatus(bk.status);
                      return (
                        <tr key={bk.id}>
                          <td>
                            <span className="font-monospace text-xs text-primary fw-bold">{bk.id}</span>
                          </td>
                          <td>
                            <div className="fw-bold text-xs text-primary-emphasis">{bk.service_title}</div>
                            <div className="d-flex align-items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="badge bg-secondary-subtle text-secondary text-xs" style={{ fontSize: '0.68rem' }}>
                                {bk.platform}
                              </span>
                              <span className="badge bg-light text-muted border text-xs" style={{ fontSize: '0.68rem' }}>
                                {bk.category}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="fw-semibold text-xs text-primary-emphasis text-truncate" style={{ maxWidth: '180px' }}>
                              {bk.campaign_name || 'Direct Booking'}
                            </div>
                            <div className="text-muted text-xs d-flex align-items-center gap-1 mt-0.5" style={{ fontSize: '0.7rem' }}>
                              <span>By: {bk.requester_name || 'Advertiser'}</span>
                              {bk.campaign_id && <span>• #{bk.campaign_id}</span>}
                            </div>
                          </td>
                          <td>
                            <div className="text-xs font-monospace text-secondary">
                              {bk.start_date || 'TBD'} &rarr; {bk.end_date || 'TBD'}
                            </div>
                            <span className="text-muted text-xs" style={{ fontSize: '0.68rem' }}>
                              ({bk.duration_days || 30} Days Flight)
                            </span>
                          </td>
                          <td>
                            <div className="font-monospace fw-bold text-xs text-primary-emphasis">
                              Rs. {bk.agreed_price?.toLocaleString()}
                            </div>
                            <span className="badge bg-success-subtle text-success text-xs" style={{ fontSize: '0.65rem' }}>
                              {bk.discount_applied || 'Standard Rate'}
                            </span>
                          </td>
                          <td>
                            {getStatusBadge(currentStatus)}
                          </td>
                          <td className="text-end">
                            <div className="d-flex align-items-center justify-content-end gap-1.5 flex-nowrap">
                              {isAdmin ? (
                                <>
                                  {/* Quick 1-Click Approve / Reject for PENDING items */}
                                  {currentStatus === 'PENDING' && (
                                    <div className="btn-group btn-group-sm flex-shrink-0" role="group">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1 py-1 px-2"
                                        onClick={() => handleUpdateBookingStatus(bk.id, 'APPROVED')}
                                        title="Approve Service Request"
                                        style={{ fontSize: '0.7rem' }}
                                      >
                                        <Check size={11} />
                                        <span>Approve</span>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 py-1 px-2"
                                        onClick={() => handleUpdateBookingStatus(bk.id, 'REJECTED')}
                                        title="Reject Service Request"
                                        style={{ fontSize: '0.7rem' }}
                                      >
                                        <X size={11} />
                                        <span>Reject</span>
                                      </button>
                                    </div>
                                  )}

                                  {/* Admin Status Change Selector Dropdown */}
                                  <select
                                    className="table-action-select"
                                    value={currentStatus}
                                    onChange={(e) => handleUpdateBookingStatus(bk.id, e.target.value)}
                                    style={{
                                      width: '148px',
                                      height: '36px',
                                      fontSize: '0.8rem',
                                      lineHeight: 'normal',
                                      fontWeight: '500',
                                    }}
                                    title="Change Request Status"
                                  >
                                    <option value="PENDING">Pending Review</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="PROVISIONED">Provisioned</option>
                                    <option value="ACTIVE">Active (Live)</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="REJECTED">Rejected</option>
                                    <option value="CANCELLED">Cancelled</option>
                                  </select>

                                  <button
                                    type="button"
                                    className="btn-ui btn-ui-secondary btn-ui-sm text-danger flex-shrink-0 d-inline-flex align-items-center justify-content-center"
                                    onClick={() => handleOpenCancelDialog(bk)}
                                    title="Cancel or Delete Service"
                                    style={{ width: '36px', height: '36px', padding: 0 }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              ) : (
                                /* Advertiser View: Cancel Option */
                                <button
                                  type="button"
                                  className="btn-ui btn-ui-secondary btn-ui-sm text-danger d-inline-flex align-items-center gap-1 flex-shrink-0"
                                  onClick={() => handleOpenCancelDialog(bk)}
                                  title="Cancel Service Reservation"
                                  disabled={['CANCELLED', 'REJECTED', 'COMPLETED'].includes(currentStatus)}
                                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                                >
                                  <X size={12} />
                                  <span>Cancel</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL 1: BOOKING & ACTIVATION (CLEANED - PROPER CAMPAIGN PREVIEW)
          ========================================================================= */}
      {bookingService && (
        <Modal
          isOpen={Boolean(bookingService)}
          onClose={() => setBookingService(null)}
          title={`Activate Digital Service: ${bookingService.title}`}
          subtitle={`Platform: ${bookingService.platform} • Fixed Duration: ${bookingService.durationDays || 30} Days`}
          size="lg"
        >
          <form onSubmit={handleConfirmBooking} className="d-flex flex-column gap-3 w-100" style={{ boxSizing: 'border-box', gap: '1.25rem' }}>
            
            {modalError && (
              <div className="alert alert-danger py-2 px-3 text-xs mb-0 d-flex align-items-center gap-2">
                <Info size={14} className="flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Campaign Selection (Empty by Default) */}
            <div className="p-3 rounded-2 bg-light-subtle border w-100" style={{ boxSizing: 'border-box' }}>
              <label className="fw-bold text-xs text-primary-emphasis mb-1.5 d-block">
                Affiliate to Campaign (or Direct Booking) <span className="text-danger">*</span>
              </label>
              
              <select
                className="form-select-ui w-100 mb-2"
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                required
                style={{ fontSize: '0.8rem', height: '40px', borderRadius: 'var(--radius-sm)' }}
              >
                <option value="">-- Select an Option --</option>
                <option value="STANDALONE">Direct Standalone Booking (No Campaign Affiliation)</option>
                {campaigns.map((cmp) => (
                  <option key={cmp.id} value={cmp.id}>
                    {cmp.name} • Total Budget: Rs. {parseFloat(cmp.budget || 1500000).toLocaleString()}
                  </option>
                ))}
              </select>

              {/* Clean Selected Campaign / Standalone Preview Box */}
              {selectedCampaignId === 'STANDALONE' ? (
                <div className="ui-campaign-preview-box" style={{ minHeight: '44px' }}>
                  <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                    <Zap size={16} className="text-success flex-shrink-0" />
                    <div style={{ minWidth: 0 }}>
                      <div className="fw-bold text-xs text-primary-emphasis text-truncate">
                        Direct Standalone Booking
                      </div>
                      <div className="text-muted text-xs" style={{ fontSize: '0.72rem' }}>
                        Independent digital provisioning without campaign linking
                      </div>
                    </div>
                  </div>
                  <span className="badge bg-success text-white text-xs px-2.5 py-1 font-monospace flex-shrink-0">
                    Direct Purchase
                  </span>
                </div>
              ) : selectedCampaignObj ? (
                <div className="ui-campaign-preview-box" style={{ minHeight: '44px' }}>
                  <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                    <Briefcase size={16} className="text-primary flex-shrink-0" />
                    <div style={{ minWidth: 0 }}>
                      <div className="fw-bold text-xs text-primary-emphasis text-truncate">
                        {selectedCampaignObj.name}
                      </div>
                      <div className="text-muted text-xs" style={{ fontSize: '0.72rem' }}>
                        Channel: {selectedCampaignObj.marketing_channel || 'Digital Marketing'}
                      </div>
                    </div>
                  </div>
                  <span className="badge bg-primary text-white text-xs px-2.5 py-1 font-monospace flex-shrink-0">
                    Budget: Rs. {parseFloat(selectedCampaignObj.budget || 1500000).toLocaleString()}
                  </span>
                </div>
              ) : (
                <div className="text-muted text-xs" style={{ fontSize: '0.72rem', minHeight: '18px' }}>
                  Choose a marketing campaign to deduct this investment from, or select Standalone Booking.
                </div>
              )}
            </div>

            {/* Fixed Flight Dates Configuration */}
            <div className="p-3 rounded-2 border bg-surface w-100" style={{ backgroundColor: 'var(--color-bg-surface)', boxSizing: 'border-box' }}>
              <div className="d-flex align-items-center gap-1.5 mb-2.5">
                <Clock size={14} className="text-primary flex-shrink-0" />
                <span className="fw-bold text-xs text-primary-emphasis text-uppercase" style={{ letterSpacing: '0.5px' }}>
                  Fixed Package Flight Duration ({bookingService.durationDays || 30} Days)
                </span>
              </div>

              <div className="row g-2.5">
                <div className="col-12 col-md-6">
                  <label className="form-label-ui">Activation Start Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-input-ui w-100"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    style={{ height: '40px' }}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-ui">Concludes On (Auto-Calculated)</label>
                  <input
                    type="date"
                    className="form-input-ui w-100 bg-light-subtle"
                    value={calculatedEndDate}
                    disabled
                    readOnly
                    style={{ height: '40px' }}
                  />
                </div>
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="p-3 rounded-2 border bg-surface w-100" style={{ backgroundColor: 'var(--color-bg-surface)', boxSizing: 'border-box' }}>
              <div className="d-flex justify-content-between text-xs text-muted mb-1">
                <span>Standard Catalog Price:</span>
                <span className="font-monospace text-decoration-line-through">
                  Rs. {bookingService.originalPrice.toLocaleString()}
                </span>
              </div>
              <div className="d-flex justify-content-between text-xs text-success mb-1">
                <span>Package Offer ({bookingService.discountLabel}):</span>
                <span className="font-monospace">- Rs. {(bookingService.originalPrice - bookingService.discountedPrice).toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
                <span className="fw-bold text-xs text-primary-emphasis text-uppercase">
                  Agreed Package Investment:
                </span>
                <div className="text-end">
                  <div className="fs-5 fw-bold text-primary font-monospace">
                    Rs. {bookingService.discountedPrice.toLocaleString()}
                  </div>
                  <div className="text-success text-xs" style={{ fontSize: '0.68rem' }}>
                    Savings: Rs. {(bookingService.originalPrice - bookingService.discountedPrice).toLocaleString()} ({bookingService.discountPercent}% OFF)
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top">
              <button
                type="button"
                className="btn-ui btn-ui-secondary btn-ui-sm"
                onClick={() => setBookingService(null)}
                disabled={submittingBooking}
                style={{ height: '38px', minWidth: '90px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-ui btn-ui-primary btn-ui-sm d-inline-flex align-items-center gap-1.5 px-4"
                disabled={submittingBooking || !selectedCampaignId}
                style={{ height: '38px', minWidth: '220px' }}
              >
                <Zap size={14} className="flex-shrink-0" />
                <span>{submittingBooking ? 'Activating...' : 'Confirm & Activate Package'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL 2: ADMIN ADD DIGITAL SERVICE TO CATALOG
          ========================================================================= */}
      {showAdminModal && (
        <Modal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          title="Create New Digital Marketing Service"
          subtitle="Add a new digital advertising package or bundle with dynamic pricing to the catalog"
          size="lg"
        >
          <form
            onSubmit={handleAdminCreateService}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* 1. Basic Info & Channel */}
            <div
              className="p-4 rounded-3 border bg-surface w-100"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                boxSizing: 'border-box',
                width: '100%',
              }}
            >
              <div
                className="fw-bold text-xs text-primary-emphasis text-uppercase mb-3.5 pb-2.5 border-bottom"
                style={{ letterSpacing: '0.5px' }}
              >
                1. Service Identification &amp; Channel
              </div>

              <div className="row g-3.5">
                <div className="col-12 col-md-6">
                  <label className="form-label-ui mb-1.5">
                    Service Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input-ui w-100"
                    placeholder="e.g. YouTube 4K Premium Takeover"
                    value={adminFormData.title}
                    onChange={(e) => setAdminFormData({ ...adminFormData, title: e.target.value })}
                    style={{ height: '40px', width: '100%' }}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label-ui mb-1.5">Tagline / Short Summary</label>
                  <input
                    type="text"
                    className="form-input-ui w-100"
                    placeholder="e.g. Guaranteed high-impact video view completion"
                    value={adminFormData.tagline}
                    onChange={(e) => setAdminFormData({ ...adminFormData, tagline: e.target.value })}
                    style={{ height: '40px', width: '100%' }}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label-ui mb-1.5">
                    Platform Channel <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select-ui w-100"
                    value={adminFormData.platform}
                    onChange={(e) => setAdminFormData({ ...adminFormData, platform: e.target.value })}
                    required
                    style={{ fontSize: '0.8rem', height: '40px', borderRadius: 'var(--radius-sm)', width: '100%' }}
                  >
                    <option value="">-- Select Platform --</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Meta Ads">Meta Ads</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="DSP Network">DSP Network</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Full Omnichannel">Full Omnichannel</option>
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label-ui mb-1.5">
                    Category <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select-ui w-100"
                    value={adminFormData.category}
                    onChange={(e) => setAdminFormData({ ...adminFormData, category: e.target.value })}
                    required
                    style={{ fontSize: '0.8rem', height: '40px', borderRadius: 'var(--radius-sm)', width: '100%' }}
                  >
                    <option value="">-- Select Category --</option>
                    {DIGITAL_CATEGORIES.filter((c) => c !== 'All Services').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Duration & Dynamic Pricing Engine */}
            <div
              className="p-4 rounded-3 border bg-surface w-100"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                boxSizing: 'border-box',
                width: '100%',
              }}
            >
              <div
                className="d-flex align-items-center justify-content-between mb-3.5 pb-2.5 border-bottom flex-wrap gap-2"
              >
                <span
                  className="fw-bold text-xs text-primary-emphasis text-uppercase"
                  style={{ letterSpacing: '0.5px' }}
                >
                  2. Duration &amp; Dynamic Pricing Engine
                </span>
                <span className="badge bg-primary-subtle text-primary text-xs px-2.5 py-1 font-monospace">
                  Auto-Calculated Engine
                </span>
              </div>

              {/* Duration Section */}
              <div className="mb-4 pb-3.5 border-bottom">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <label className="form-label-ui fw-semibold text-xs mb-0">
                    Flight Duration (Days) <span className="text-danger">*</span>
                  </label>
                  <span className="text-muted text-xs">Choose or select preset flight duration</span>
                </div>
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <div style={{ width: '120px', flexShrink: 0 }}>
                    <input
                      type="number"
                      className="form-input-ui w-100 font-monospace fw-semibold"
                      placeholder="e.g. 30"
                      value={adminFormData.durationDays}
                      onChange={(e) =>
                        setAdminFormData({
                          ...adminFormData,
                          durationDays: e.target.value === '' ? '' : Math.max(1, Number(e.target.value)),
                        })
                      }
                      min="1"
                      style={{ height: '40px' }}
                      required
                    />
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-wrap ms-md-2">
                    <span className="text-muted text-xs me-1 fw-medium">Presets:</span>
                    {[7, 14, 30, 45, 60, 90].map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={`ui-quick-preset-btn ${adminFormData.durationDays === d ? 'active' : ''}`}
                        style={{ height: '36px', minWidth: '72px', padding: '0 12px', fontSize: '0.78rem' }}
                        onClick={() => setAdminFormData({ ...adminFormData, durationDays: d })}
                      >
                        {d} Days
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing & Discount Inputs */}
              <div className="row g-3.5 mb-3.5">
                <div className="col-12 col-md-4">
                  <div className="mb-1.5" style={{ minHeight: '22px', display: 'flex', alignItems: 'center' }}>
                    <label className="form-label-ui mb-0">
                      Standard Catalog Price (Rs.) <span className="text-danger">*</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    className="form-input-ui w-100 font-monospace"
                    placeholder="e.g. 50000"
                    value={adminFormData.originalPrice}
                    onChange={(e) => handleAdminOriginalPriceChange(e.target.value)}
                    min="1000"
                    step="1000"
                    style={{ height: '40px' }}
                    required
                  />
                  <div className="form-helpertext text-muted text-xs mt-1.5" style={{ fontSize: '0.72rem' }}>
                    Gross catalogue list rate
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="d-flex align-items-center justify-content-between mb-1.5" style={{ minHeight: '22px' }}>
                    <label className="form-label-ui mb-0">Discount %</label>
                    <span className="badge bg-primary-subtle text-primary text-xs font-monospace">
                      {adminFormData.discountPercent || 0}% OFF
                    </span>
                  </div>
                  <input
                    type="number"
                    className="form-input-ui w-100 font-monospace"
                    placeholder="0"
                    value={adminFormData.discountPercent}
                    onChange={(e) => handleAdminDiscountPercentChange(e.target.value)}
                    min="0"
                    max="100"
                    style={{ height: '40px' }}
                  />
                  <div className="d-flex align-items-center gap-1.5 mt-1.5 flex-nowrap overflow-x-auto pb-1">
                    {[0, 10, 15, 20, 25, 30, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        className={`ui-quick-preset-btn ${adminFormData.discountPercent === pct ? 'active' : ''}`}
                        style={{ fontSize: '0.7rem', height: '24px', minWidth: '36px', padding: '0 6px' }}
                        onClick={() => handleAdminDiscountPercentChange(pct)}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="mb-1.5" style={{ minHeight: '22px', display: 'flex', alignItems: 'center' }}>
                    <label className="form-label-ui mb-0">
                      Agreed Final Price (Rs.) <span className="text-danger">*</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    className="form-input-ui w-100 fw-bold text-primary font-monospace"
                    placeholder="e.g. 40000"
                    value={adminFormData.discountedPrice}
                    onChange={(e) => handleAdminDiscountedPriceChange(e.target.value)}
                    min="1000"
                    step="1000"
                    style={{ height: '40px' }}
                    required
                  />
                  <div className="form-helpertext text-muted text-xs mt-1.5" style={{ fontSize: '0.72rem' }}>
                    Net price after discount
                  </div>
                </div>
              </div>

              {/* Promotional Badge / Offer Label (Clean Dedicated Sub-Row) */}
              <div className="pt-3 border-top mt-2">
                <label className="form-label-ui mb-1.5">Promotional Badge / Offer Label</label>
                <input
                  type="text"
                  className="form-input-ui w-100"
                  placeholder="e.g. 20% OFF Special Offer"
                  value={adminFormData.discountLabel}
                  onChange={(e) => setAdminFormData({ ...adminFormData, discountLabel: e.target.value })}
                  style={{ height: '40px' }}
                />
              </div>

              {/* Dynamic Price Banner */}
              <div
                className="mt-3.5 p-3 rounded-2 bg-light-subtle border d-flex align-items-center justify-content-between flex-wrap gap-2"
                style={{ minHeight: '52px', boxSizing: 'border-box' }}
              >
                <div className="text-xs text-secondary d-flex align-items-center gap-2 flex-wrap">
                  <span>
                    Standard Price:{' '}
                    {Number(adminFormData.originalPrice) > 0 ? (
                      <strong className="font-monospace text-decoration-line-through">
                        Rs. {Number(adminFormData.originalPrice).toLocaleString()}
                      </strong>
                    ) : (
                      <strong className="font-monospace">Rs. 0</strong>
                    )}
                  </span>
                  <span className="text-success">
                    &bull; Savings:{' '}
                    <strong className="font-monospace">
                      Rs.{' '}
                      {Number(
                        (adminFormData.originalPrice || 0) - (adminFormData.discountedPrice || 0)
                      ).toLocaleString()}
                    </strong>{' '}
                    ({adminFormData.discountPercent || 0}% OFF)
                  </span>
                </div>
                <div className="text-end">
                  <span className="text-xs text-muted me-2">Advertiser Pays:</span>
                  <span className="fs-5 fw-bold text-primary font-monospace">
                    Rs. {Number(adminFormData.discountedPrice || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Performance Metrics & Deliverables */}
            <div
              className="p-4 rounded-3 border bg-surface w-100"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                boxSizing: 'border-box',
                width: '100%',
              }}
            >
              <div
                className="fw-bold text-xs text-primary-emphasis text-uppercase mb-3.5 pb-2.5 border-bottom"
                style={{ letterSpacing: '0.5px' }}
              >
                3. Audience Reach &amp; Deliverables
              </div>

              <div className="row g-3.5 mb-3.5 w-100" style={{ margin: 0 }}>
                <div className="col-12 col-md-6 px-0 pe-md-2">
                  <label className="form-label-ui mb-1.5">Estimated Reach / Audience</label>
                  <input
                    type="text"
                    className="form-input-ui w-100"
                    placeholder="e.g. 500,000+ Views & Impressions"
                    value={adminFormData.estimatedReach}
                    onChange={(e) => setAdminFormData({ ...adminFormData, estimatedReach: e.target.value })}
                    style={{ height: '40px', width: '100%' }}
                  />
                </div>

                <div className="col-12 col-md-6 px-0 ps-md-2">
                  <label className="form-label-ui mb-1.5">CPM Rate (Display Metric)</label>
                  <input
                    type="text"
                    className="form-input-ui w-100"
                    placeholder="e.g. Rs. 200 CPM"
                    value={adminFormData.cpm}
                    onChange={(e) => setAdminFormData({ ...adminFormData, cpm: e.target.value })}
                    style={{ height: '40px', width: '100%' }}
                  />
                </div>
              </div>

              <div className="w-100 mt-2">
                <label className="form-label-ui mb-1.5">Included Deliverables (One deliverable per line)</label>
                <textarea
                  className="form-textarea-ui w-100"
                  rows="3"
                  placeholder="e.g. Dedicated Full HD/4K Video Delivery&#10;Targeted Demographic & Geographic Filtering&#10;Real-time Analytics Dashboard & CTR Tracking"
                  value={adminFormData.deliverablesText}
                  onChange={(e) => setAdminFormData({ ...adminFormData, deliverablesText: e.target.value })}
                  style={{ height: '88px', minHeight: '88px', resize: 'vertical', width: '100%' }}
                />
              </div>

              {/* Deliverables Preview Tags */}
              {adminFormData.deliverablesText.trim() && (
                <div className="d-flex flex-wrap gap-2 mt-3 w-100">
                  {adminFormData.deliverablesText
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((del, idx) => (
                      <span
                        key={idx}
                        className="badge bg-light text-secondary border text-xs px-2.5 py-1.5 d-inline-flex align-items-center gap-1.5"
                        style={{ height: '30px', fontSize: '0.74rem' }}
                      >
                        <Check size={12} className="text-success flex-shrink-0" />
                        <span>{del}</span>
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="d-flex align-items-center justify-content-end gap-2 pt-3 border-top w-100">
              <button
                type="button"
                className="btn-ui btn-ui-secondary btn-ui-sm"
                onClick={() => setShowAdminModal(false)}
                disabled={savingAdminService}
                style={{ height: '40px', minWidth: '95px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-ui btn-ui-primary btn-ui-sm d-inline-flex align-items-center gap-1.5 px-4"
                disabled={savingAdminService}
                style={{ height: '40px', minWidth: '220px' }}
              >
                <Plus size={14} className="flex-shrink-0" />
                <span>{savingAdminService ? 'Publishing Package...' : 'Create & Publish Service'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: EDIT BASE RATE
          ========================================================================= */}
      {editingBaseRate && (
        <Modal
          isOpen={Boolean(editingBaseRate)}
          onClose={() => !savingBaseRate && setEditingBaseRate(null)}
          title={`Update Base Rate: ${editingBaseRate.platform}`}
          subtitle="Modify pricing model, unit rates, minimum volumes, and channel description"
          size="md"
        >
          <form onSubmit={handleSaveEditBaseRate} className="d-flex flex-column gap-3 w-100" style={{ boxSizing: 'border-box' }}>
            <div className="p-3 rounded-2 border bg-surface" style={{ backgroundColor: 'var(--color-bg-surface)', boxSizing: 'border-box' }}>
              <div className="row g-2.5">
                <div className="col-12 col-md-6">
                  <label className="form-label-ui">Platform</label>
                  <input
                    type="text"
                    className="form-input-ui w-100 bg-light-subtle"
                    value={editRateForm.platform}
                    disabled
                    readOnly
                    style={{ height: '38px' }}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-ui">Category <span className="text-danger">*</span></label>
                  <select
                    className="form-select-ui w-100"
                    value={editRateForm.category}
                    onChange={(e) => setEditRateForm({ ...editRateForm, category: e.target.value })}
                    required
                    style={{ fontSize: '0.8rem', height: '38px', borderRadius: 'var(--radius-sm)' }}
                  >
                    {DIGITAL_CATEGORIES.filter((c) => c !== 'All Services').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-ui">Base Unit Rate (Rs.) <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-input-ui w-100 font-monospace fw-bold text-primary"
                    value={editRateForm.baseRatePerUnit}
                    onChange={(e) => setEditRateForm({ ...editRateForm, baseRatePerUnit: Number(e.target.value) })}
                    min="1"
                    style={{ height: '38px' }}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-ui">Pricing Model <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-input-ui w-100 font-monospace"
                    value={editRateForm.pricingModel}
                    onChange={(e) => setEditRateForm({ ...editRateForm, pricingModel: e.target.value })}
                    placeholder="e.g. CPM (Cost per 1k) or CPC"
                    style={{ height: '38px' }}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-ui">Unit Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-input-ui w-100"
                    value={editRateForm.unitName}
                    onChange={(e) => setEditRateForm({ ...editRateForm, unitName: e.target.value })}
                    placeholder="e.g. 1,000 Views"
                    style={{ height: '38px' }}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-ui">Minimum Units <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-input-ui w-100 font-monospace"
                    value={editRateForm.minUnits}
                    onChange={(e) => setEditRateForm({ ...editRateForm, minUnits: Number(e.target.value) })}
                    min="1"
                    style={{ height: '38px' }}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label-ui">Description</label>
                  <input
                    type="text"
                    className="form-input-ui w-100"
                    value={editRateForm.desc}
                    onChange={(e) => setEditRateForm({ ...editRateForm, desc: e.target.value })}
                    placeholder="Platform description"
                    style={{ height: '38px' }}
                  />
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top">
              <button
                type="button"
                className="btn-ui btn-ui-secondary btn-ui-sm"
                onClick={() => setEditingBaseRate(null)}
                disabled={savingBaseRate}
                style={{ height: '38px', minWidth: '90px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-ui btn-ui-primary btn-ui-sm d-inline-flex align-items-center gap-1.5 px-4"
                disabled={savingBaseRate}
                style={{ height: '38px', minWidth: '160px' }}
              >
                <Check size={14} className="flex-shrink-0" />
                <span>{savingBaseRate ? 'Saving Rate...' : 'Save Base Rate'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: ADD CUSTOM PLATFORM BASE RATE
          ========================================================================= */}
      {showAddBaseRateModal && (
        <Modal
          isOpen={showAddBaseRateModal}
          onClose={() => !savingBaseRate && setShowAddBaseRateModal(false)}
          title="Add Custom Digital Platform Rate"
          subtitle="Configure a new digital advertising platform rate card for custom packages"
          size="md"
        >
          <form onSubmit={handleAddCustomBaseRate} className="d-flex flex-column gap-3 w-100" style={{ boxSizing: 'border-box' }}>
            <div className="p-3 rounded-2 border bg-surface" style={{ backgroundColor: 'var(--color-bg-surface)', boxSizing: 'border-box' }}>
              <div className="row g-2.5">
                <div className="col-12 col-md-6">
                  <label className="form-label-ui">Platform Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-input-ui w-100"
                    placeholder="e.g. LinkedIn Ads"
                    value={newBaseRateForm.platform}
                    onChange={(e) => setNewBaseRateForm({ ...newBaseRateForm, platform: e.target.value })}
                    style={{ height: '38px' }}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-ui">Category <span className="text-danger">*</span></label>
                  <select
                    className="form-select-ui w-100"
                    value={newBaseRateForm.category}
                    onChange={(e) => setNewBaseRateForm({ ...newBaseRateForm, category: e.target.value })}
                    required
                    style={{ fontSize: '0.8rem', height: '38px', borderRadius: 'var(--radius-sm)' }}
                  >
                    {DIGITAL_CATEGORIES.filter((c) => c !== 'All Services').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-ui">Base Unit Rate (Rs.) <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-input-ui w-100 font-monospace fw-bold text-primary"
                    placeholder="e.g. 180"
                    value={newBaseRateForm.baseRatePerUnit}
                    onChange={(e) => setNewBaseRateForm({ ...newBaseRateForm, baseRatePerUnit: Number(e.target.value) })}
                    min="1"
                    style={{ height: '38px' }}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-ui">Pricing Model <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-input-ui w-100 font-monospace"
                    placeholder="e.g. CPM (Cost per 1k) or CPC"
                    value={newBaseRateForm.pricingModel}
                    onChange={(e) => setNewBaseRateForm({ ...newBaseRateForm, pricingModel: e.target.value })}
                    style={{ height: '38px' }}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-ui">Unit Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-input-ui w-100"
                    placeholder="e.g. 1,000 Impressions"
                    value={newBaseRateForm.unitName}
                    onChange={(e) => setNewBaseRateForm({ ...newBaseRateForm, unitName: e.target.value })}
                    style={{ height: '38px' }}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-ui">Minimum Units <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-input-ui w-100 font-monospace"
                    placeholder="e.g. 50"
                    value={newBaseRateForm.minUnits}
                    onChange={(e) => setNewBaseRateForm({ ...newBaseRateForm, minUnits: Number(e.target.value) })}
                    min="1"
                    style={{ height: '38px' }}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label-ui">Description</label>
                  <input
                    type="text"
                    className="form-input-ui w-100"
                    placeholder="e.g. B2B Decision-maker targeted sponsored content"
                    value={newBaseRateForm.desc}
                    onChange={(e) => setNewBaseRateForm({ ...newBaseRateForm, desc: e.target.value })}
                    style={{ height: '38px' }}
                  />
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top">
              <button
                type="button"
                className="btn-ui btn-ui-secondary btn-ui-sm"
                onClick={() => setShowAddBaseRateModal(false)}
                disabled={savingBaseRate}
                style={{ height: '38px', minWidth: '90px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-ui btn-ui-primary btn-ui-sm d-inline-flex align-items-center gap-1.5 px-4"
                disabled={savingBaseRate}
                style={{ height: '38px', minWidth: '180px' }}
              >
                <Plus size={14} className="flex-shrink-0" />
                <span>{savingBaseRate ? 'Adding Platform...' : 'Add Platform Rate'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          SWEETALERT CONFIRMATION DIALOG: CANCEL RESERVATION
          ========================================================================= */}
      <ConfirmDialog
        isOpen={Boolean(serviceToCancel)}
        onClose={() => !cancelingService && setServiceToCancel(null)}
        title="Cancel Digital Service Reservation?"
        message="Are you sure you want to cancel this digital advertising reservation? The allocated flight dates and budget will be released immediately."
        itemName={serviceToCancel ? `${serviceToCancel.service_title} • ${serviceToCancel.platform}` : ''}
        type="warning"
        confirmText="Yes, Cancel Reservation"
        cancelText="Keep Reservation"
        confirmButtonClass="btn-ui btn-ui-danger"
        onConfirm={handleConfirmCancelService}
        isLoading={cancelingService}
      />

      {/* =========================================================================
          SWEETALERT CONFIRMATION DIALOG: DELETE CATALOG SERVICE
          ========================================================================= */}
      <ConfirmDialog
        isOpen={Boolean(catalogServiceToDelete)}
        onClose={() => !deletingCatalogService && setCatalogServiceToDelete(null)}
        title="Delete Digital Service Package?"
        message="Are you sure you want to remove this digital marketing service package from the catalog? Advertisers will no longer be able to book it."
        itemName={catalogServiceToDelete ? `${catalogServiceToDelete.title} (${catalogServiceToDelete.platform})` : ''}
        type="danger"
        confirmText="Yes, Delete Package"
        cancelText="Cancel"
        confirmButtonClass="btn-ui btn-ui-danger"
        onConfirm={handleConfirmDeleteCatalogService}
        isLoading={deletingCatalogService}
      />

      {/* =========================================================================
          SWEETALERT CONFIRMATION DIALOG: DELETE BASE RATE / CUSTOM SERVICE
          ========================================================================= */}
      <ConfirmDialog
        isOpen={Boolean(baseRateToDelete)}
        onClose={() => !deletingBaseRate && setBaseRateToDelete(null)}
        title="Delete Platform Base Rate?"
        message="Are you sure you want to delete this advertising platform rate card? Custom package calculations for this platform will be disabled."
        itemName={baseRateToDelete ? `${baseRateToDelete.platform} (Rs. ${baseRateToDelete.baseRatePerUnit} / ${baseRateToDelete.unitName})` : ''}
        type="danger"
        confirmText="Yes, Delete Base Rate"
        cancelText="Cancel"
        confirmButtonClass="btn-ui btn-ui-danger"
        onConfirm={handleConfirmDeleteBaseRate}
        isLoading={deletingBaseRate}
      />
    </div>
  );
};

export default DigitalServicesPage;
