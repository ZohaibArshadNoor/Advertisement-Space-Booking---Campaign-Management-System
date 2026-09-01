import React, { useState, useEffect } from 'react';
import { paymentsApi } from '../paymentsApi';
import { campaignService } from '../../../services/campaignService';
import { useAuth } from '../../../context/AuthContext';
import { extractErrorMessage } from '../../../utils/errorHandler';
import StatusBadge from '../../../components/ui/StatusBadge';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import Modal from '../../../components/ui/Modal';
import {
  CreditCard,
  Plus,
  FileText,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  CalendarDays,
  Building2,
  RefreshCw,
  Clock,
  Send,
  Eye,
  User
} from 'lucide-react';

export const PaymentsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'payments'

  // Invoices state
  const [invoices, setInvoices] = useState([]);
  const [invoicePagination, setInvoicePagination] = useState({ page: 1, pages: 1, total: 0 });
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('');
  const [invoicePage, setInvoicePage] = useState(1);

  // Payments state
  const [payments, setPayments] = useState([]);
  const [paymentPagination, setPaymentPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentPage, setPaymentPage] = useState(1);

  // Common UI State
  const [campaigns, setCampaigns] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceFormData, setInvoiceFormData] = useState({ campaign_id: '', tax_rate: '16.00', due_date: '' });
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    invoice_id: '',
    amount: '',
    payment_method: 'BANK_TRANSFER',
    transaction_reference: '',
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Selected Invoice for Details Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const canManageFinance = ['Administrator', 'Finance Officer', 'Sales Executive'].includes(user?.role);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const data = await campaignService.getCampaigns({ per_page: 50 });
        setCampaigns(data.campaigns || data.items || []);
      } catch (err) {
        console.error('Failed to load campaigns', err);
      }
    };
    loadCampaigns();
  }, []);

  const fetchInvoices = async () => {
    setInvoicesLoading(true);
    setError('');
    try {
      const params = { page: invoicePage, per_page: 10 };
      if (invoiceStatusFilter) params.status = invoiceStatusFilter;
      const data = await paymentsApi.getInvoices(params);
      setInvoices(data.invoices || data.items || []);
      setInvoicePagination(data.pagination || { page: 1, pages: 1, total: (data.invoices || []).length });
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load invoices.'));
    } finally {
      setInvoicesLoading(false);
    }
  };

  const fetchPayments = async () => {
    setPaymentsLoading(true);
    setError('');
    try {
      const params = { page: paymentPage, per_page: 10 };
      const data = await paymentsApi.getPayments(params);
      setPayments(data.payments || data.items || []);
      setPaymentPagination(data.pagination || { page: 1, pages: 1, total: (data.payments || []).length });
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load payments.'));
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'invoices') fetchInvoices();
    else fetchPayments();
  }, [activeTab, invoicePage, paymentPage, invoiceStatusFilter]);

  const handleCreateInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceFormData.campaign_id) {
      setError('Please select a campaign.');
      return;
    }
    setCreatingInvoice(true);
    setError('');
    try {
      await paymentsApi.createInvoice({
        campaign_id: parseInt(invoiceFormData.campaign_id),
        tax_rate: parseFloat(invoiceFormData.tax_rate) || 0,
        due_date: invoiceFormData.due_date || undefined,
      });
      setSuccessMsg('Invoice generated successfully!');
      setShowInvoiceModal(false);
      fetchInvoices();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to create invoice.'));
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handleCreatePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentFormData.invoice_id || !paymentFormData.amount) {
      setError('Please provide an invoice ID and payment amount.');
      return;
    }
    setSubmittingPayment(true);
    setError('');
    try {
      await paymentsApi.createPayment({
        invoice_id: parseInt(paymentFormData.invoice_id),
        amount: parseFloat(paymentFormData.amount),
        payment_method: paymentFormData.payment_method,
        transaction_reference: paymentFormData.transaction_reference,
      });
      setSuccessMsg('Payment recorded successfully!');
      setShowPaymentModal(false);
      if (activeTab === 'payments') fetchPayments();
      else fetchInvoices();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to record payment.'));
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleIssueInvoice = async (invoiceId) => {
    try {
      await paymentsApi.issueInvoice(invoiceId);
      setSuccessMsg('Invoice officially issued to advertiser.');
      fetchInvoices();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to issue invoice.'));
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices, Billing &amp; Settlements</h1>
          <p className="page-subtitle">
            Manage commercial invoices, track tax receivables, and reconcile client settlements.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={() => (activeTab === 'invoices' ? fetchInvoices() : fetchPayments())}
            className="btn-ui btn-ui-secondary btn-ui-sm"
            title="Refresh records"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
          {canManageFinance && (
            <div className="d-flex gap-1.5">
              <button
                type="button"
                className="btn-ui btn-ui-secondary btn-ui-sm"
                onClick={() => setShowPaymentModal(true)}
              >
                <span className="fw-bold font-monospace" style={{ fontSize: '0.78rem' }}>Rs.</span>
                <span>Record Payment</span>
              </button>
              <button
                type="button"
                className="btn-ui btn-ui-primary btn-ui-sm"
                onClick={() => setShowInvoiceModal(true)}
              >
                <Plus size={14} />
                <span>Create Invoice</span>
              </button>
            </div>
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

      {/* Tab Switcher & Filter Toolbar */}
      <div className="toolbar-ui">
        <div className="d-flex gap-1.5">
          <button
            type="button"
            className={`btn-ui btn-ui-sm ${activeTab === 'invoices' ? 'btn-ui-primary' : 'btn-ui-secondary'}`}
            onClick={() => setActiveTab('invoices')}
          >
            <FileText size={14} />
            <span>Commercial Invoices</span>
          </button>
          <button
            type="button"
            className={`btn-ui btn-ui-sm ${activeTab === 'payments' ? 'btn-ui-primary' : 'btn-ui-secondary'}`}
            onClick={() => setActiveTab('payments')}
          >
            <CreditCard size={14} />
            <span>Settlement Transactions</span>
          </button>
        </div>

        {activeTab === 'invoices' && (
          <div className="toolbar-filters">
            <select
              className="form-select-ui"
              style={{ width: 'auto', fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
              value={invoiceStatusFilter}
              onChange={(e) => {
                setInvoiceStatusFilter(e.target.value);
                setInvoicePage(1);
              }}
            >
              <option value="">All Invoice Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ISSUED">Issued</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Invoices Table */}
      {activeTab === 'invoices' && (
        <div className="card-enterprise">
          {invoicesLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary spinner-border-sm" role="status" />
              <p className="text-muted small mt-2">Loading commercial invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No invoices found"
              description="Generate a new invoice from confirmed campaign bookings."
              actionLabel="Create Invoice"
              onAction={() => setShowInvoiceModal(true)}
            />
          ) : (
            <>
              <div className="table-container border-0">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Space, Campaign &amp; Customer</th>
                      <th>Subtotal / Tax</th>
                      <th>Total Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td>
                          <span className="font-monospace text-xs text-primary fw-semibold">
                            {inv.invoice_number && !inv.invoice_number.startsWith('#INV-') ? inv.invoice_number : `INV-2026-${String(inv.id).padStart(4, '0')}`}
                          </span>
                        </td>

                        <td>
                          {/* Space Name */}
                          <div className="d-flex align-items-center gap-1.5 fw-bold text-xs text-primary-emphasis">
                            <Building2 size={13} className="text-primary flex-shrink-0" />
                            <span className="text-truncate" style={{ maxWidth: '280px' }} title={inv.space_name}>
                              {inv.space_name || 'Billboard Inventory Space'}
                            </span>
                          </div>

                          {/* Campaign & Billed Customer */}
                          <div className="text-xs text-muted mt-0.5 d-flex align-items-center gap-1 flex-wrap" style={{ fontSize: '0.72rem' }}>
                            <span className="fw-medium text-secondary">
                              {inv.campaign?.name || inv.campaign_name || (inv.campaign_id ? `Campaign #${inv.campaign_id}` : 'Direct Campaign')}
                            </span>
                            <span>•</span>
                            <span>
                              Client: <strong className="text-dark-emphasis">{inv.customer_name || inv.advertiser_name || 'Advertiser'}</strong>
                            </span>
                          </div>

                          {/* Purpose / Flighting info */}
                          {inv.purpose && inv.purpose !== inv.space_name && (
                            <div className="text-muted text-truncate mt-0.5" style={{ fontSize: '0.68rem', maxWidth: '280px' }}>
                              {inv.purpose}
                            </div>
                          )}
                        </td>

                        <td>
                          {(() => {
                            const subtotalVal = parseFloat(inv.subtotal || 0);
                            const taxVal = (inv.tax_amount !== undefined && inv.tax_amount !== null && inv.tax_amount !== '')
                              ? parseFloat(inv.tax_amount)
                              : (inv.tax !== undefined && inv.tax !== null && inv.tax !== '')
                              ? parseFloat(inv.tax)
                              : subtotalVal * 0.16;
                            const totalVal = parseFloat(inv.total_amount !== undefined && inv.total_amount !== null && inv.total_amount !== '' ? inv.total_amount : (subtotalVal + taxVal));

                            return (
                              <>
                                <div className="text-xs">
                                  <span className="text-muted">Net: </span>
                                  <span className="font-monospace">Rs. {subtotalVal.toLocaleString()}</span>
                                </div>
                                <div className="text-xs text-muted" style={{ fontSize: '0.7rem' }}>
                                  Tax: +Rs. {taxVal.toLocaleString()}
                                </div>
                              </>
                            );
                          })()}
                        </td>

                        <td>
                          {(() => {
                            const subtotalVal = parseFloat(inv.subtotal || 0);
                            const taxVal = (inv.tax_amount !== undefined && inv.tax_amount !== null && inv.tax_amount !== '')
                              ? parseFloat(inv.tax_amount)
                              : (inv.tax !== undefined && inv.tax !== null && inv.tax !== '')
                              ? parseFloat(inv.tax)
                              : subtotalVal * 0.16;
                            const totalVal = parseFloat(inv.total_amount !== undefined && inv.total_amount !== null && inv.total_amount !== '' ? inv.total_amount : (subtotalVal + taxVal));

                            return (
                              <span className="font-monospace text-xs text-primary-emphasis fw-bold">
                                Rs. {totalVal.toLocaleString()}
                              </span>
                            );
                          })()}
                        </td>

                        <td>
                          <span className="text-xs text-secondary d-flex align-items-center gap-1">
                            <CalendarDays size={12} className="text-muted" />
                            {inv.due_date || 'Immediate'}
                          </span>
                        </td>

                        <td>
                          <StatusBadge
                            status={
                              inv.status === 'PAID'
                                ? 'confirmed'
                                : inv.status === 'ISSUED' || inv.status === 'PARTIALLY_PAID'
                                ? 'pending'
                                : inv.status === 'OVERDUE'
                                ? 'rejected'
                                : 'draft'
                            }
                            label={inv.status}
                            size="sm"
                          />
                        </td>

                        <td className="text-end">
                          <div className="d-inline-flex align-items-center justify-content-end gap-1.5" style={{ minWidth: '140px' }}>
                            {/* View Invoice Details Button */}
                            <button
                              type="button"
                              className="btn-ui btn-ui-secondary btn-ui-sm d-inline-flex align-items-center gap-1"
                              onClick={() => setSelectedInvoice(inv)}
                              title="View full invoice line items and payment breakdown"
                            >
                              <Eye size={12} />
                              <span>Details</span>
                            </button>

                            {canManageFinance && inv.status === 'DRAFT' && (
                              <button
                                type="button"
                                className="btn-ui btn-ui-secondary btn-ui-sm"
                                onClick={() => handleIssueInvoice(inv.id)}
                                title="Issue Invoice"
                              >
                                <Send size={12} />
                                <span>Issue</span>
                              </button>
                            )}

                            {inv.status === 'PAID' ? (
                              <span className="badge bg-success-subtle text-success text-xs font-semibold py-1 px-2">
                                Paid in Full
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="btn-ui btn-ui-primary btn-ui-sm d-inline-flex align-items-center gap-1"
                                onClick={() => {
                                  setPaymentFormData({
                                    ...paymentFormData,
                                    invoice_id: inv.id,
                                    amount: inv.balance_due || inv.total_amount
                                  });
                                  setShowPaymentModal(true);
                                }}
                                title="Pay Invoice"
                              >
                                <CreditCard size={12} />
                                <span>Pay Now</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={invoicePage}
                totalPages={invoicePagination.pages || 1}
                totalRecords={invoicePagination.total || invoices.length}
                pageSize={10}
                onPageChange={(p) => setInvoicePage(p)}
              />
            </>
          )}
        </div>
      )}

      {/* Tab 2: Payments Table */}
      {activeTab === 'payments' && (
        <div className="card-enterprise">
          {paymentsLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary spinner-border-sm" role="status" />
              <p className="text-muted small mt-2">Loading settlement transactions...</p>
            </div>
          ) : payments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No settlement transactions recorded"
              description="Reconcile bank wire transfers or credit card receipts against open invoices."
              actionLabel="Record Payment"
              onAction={() => setShowPaymentModal(true)}
            />
          ) : (
            <>
              <div className="table-container border-0">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Payment Ref</th>
                      <th>Invoice ID</th>
                      <th>Settlement Amount</th>
                      <th>Method</th>
                      <th>Processed At</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <span className="font-monospace text-xs text-primary fw-semibold">
                            {p.transaction_reference && !p.transaction_reference.startsWith('#PAY-') ? p.transaction_reference : `TXN-2026-${String(p.id).padStart(4, '0')}`}
                          </span>
                        </td>

                        <td>
                          <span className="font-monospace text-xs text-secondary">
                            INV-2026-{String(p.invoice_id).padStart(4, '0')}
                          </span>
                        </td>

                        <td>
                          <span className="font-monospace text-xs text-success fw-bold">
                            +Rs. {parseFloat(p.amount || 0).toLocaleString()}
                          </span>
                        </td>

                        <td>
                          <span className="badge bg-subtle text-secondary border font-monospace text-xs">
                            {p.payment_method || 'BANK_TRANSFER'}
                          </span>
                        </td>

                        <td>
                          <span className="text-xs text-muted">
                            {p.created_at ? new Date(p.created_at).toLocaleString() : 'Recent'}
                          </span>
                        </td>

                        <td>
                          <StatusBadge
                            status={p.status === 'COMPLETED' ? 'active' : 'pending'}
                            label={p.status || 'COMPLETED'}
                            size="sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={paymentPage}
                totalPages={paymentPagination.pages || 1}
                totalRecords={paymentPagination.total || payments.length}
                pageSize={10}
                onPageChange={(p) => setPaymentPage(p)}
              />
            </>
          )}
        </div>
      )}

      {/* Create Invoice Modal */}
      <Modal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        title="Generate Commercial Invoice"
        subtitle="Calculate billables from active campaign space reservations"
        size="md"
        footer={
          <>
            <button
              type="button"
              className="btn-ui btn-ui-secondary btn-ui-sm"
              onClick={() => setShowInvoiceModal(false)}
              disabled={creatingInvoice}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-ui btn-ui-primary btn-ui-sm"
              onClick={handleCreateInvoiceSubmit}
              disabled={creatingInvoice}
            >
              {creatingInvoice ? 'Generating...' : 'Generate Invoice'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateInvoiceSubmit}>
          <div className="form-group-ui">
            <label className="form-label-ui">Select Campaign <span className="form-required">*</span></label>
            <select
              className="form-select-ui"
              value={invoiceFormData.campaign_id}
              onChange={(e) => setInvoiceFormData({ ...invoiceFormData, campaign_id: e.target.value })}
              required
            >
              <option value="">Select Campaign...</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.campaign_reference ? `(${c.campaign_reference})` : ''}
                </option>
              ))}
            </select>
          </div>

          {(() => {
            const selectedCampaign = campaigns.find((c) => String(c.id) === String(invoiceFormData.campaign_id));
            if (!selectedCampaign) return null;

            return (
              <div className="p-3 mb-3 rounded-2 border bg-light-subtle">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge bg-primary-subtle text-primary text-xs font-semibold">
                    Invoice Customer &amp; Inventory Scope
                  </span>
                  <span className="text-xs text-muted font-monospace">
                    {selectedCampaign.campaign_reference || selectedCampaign.reference_code}
                  </span>
                </div>

                <div className="row g-2 text-xs">
                  <div className="col-12 col-sm-6">
                    <span className="text-muted d-block">Client / Requestor:</span>
                    <strong className="text-primary-emphasis d-flex align-items-center gap-1">
                      <User size={12} className="text-primary flex-shrink-0" />
                      <span>{selectedCampaign.user_name || selectedCampaign.advertiser_name || 'Commercial Advertiser'}</span>
                    </strong>
                  </div>
                  <div className="col-12 col-sm-6">
                    <span className="text-muted d-block">Advertising Space(s):</span>
                    <strong className="text-dark-emphasis d-flex align-items-center gap-1">
                      <Building2 size={13} className="text-primary flex-shrink-0" />
                      {selectedCampaign.spaces_text || selectedCampaign.name || 'Billboard Inventory'}
                    </strong>
                  </div>
                  <div className="col-12 mt-1">
                    <span className="text-muted d-block">Billing Purpose:</span>
                    <span className="text-secondary">
                      Commercial advertising inventory reservation &amp; placement flighting for "{selectedCampaign.name}"
                    </span>
                  </div>
                  {selectedCampaign.budget && parseFloat(selectedCampaign.budget) > 0 && (
                    <div className="col-12 mt-0.5">
                      <span className="text-muted">Estimated Base Amount: </span>
                      <strong className="text-success font-monospace">
                        Rs. {parseFloat(selectedCampaign.budget).toLocaleString()}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="form-group-ui">
                <label className="form-label-ui">Sales Tax / GST (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input-ui font-monospace"
                  value={invoiceFormData.tax_rate}
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, tax_rate: e.target.value })}
                />
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="form-group-ui">
                <label className="form-label-ui">Payment Due Date</label>
                <input
                  type="date"
                  className="form-input-ui"
                  value={invoiceFormData.due_date}
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, due_date: e.target.value })}
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Settlement Payment"
        subtitle="Log wire transfer or payment receipt against an invoice"
        size="md"
        footer={
          <>
            <button
              type="button"
              className="btn-ui btn-ui-secondary btn-ui-sm"
              onClick={() => setShowPaymentModal(false)}
              disabled={submittingPayment}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-ui btn-ui-primary btn-ui-sm"
              onClick={handleCreatePaymentSubmit}
              disabled={submittingPayment}
            >
              {submittingPayment ? 'Saving...' : 'Record Payment'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreatePaymentSubmit}>
          {(() => {
            const selectedInvoice = invoices.find((inv) => String(inv.id) === String(paymentFormData.invoice_id));
            if (!selectedInvoice) return null;

            return (
              <div className="p-3 mb-3 rounded-2 border bg-light-subtle">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge bg-success-subtle text-success text-xs font-semibold">
                    Payment Target Inventory &amp; Bill
                  </span>
                  <span className="text-xs font-monospace fw-bold text-primary">
                    {selectedInvoice.invoice_number}
                  </span>
                </div>

                <div className="row g-2 text-xs">
                  <div className="col-12">
                    <span className="text-muted d-block">Advertising Space Paid For:</span>
                    <strong className="text-primary-emphasis d-flex align-items-center gap-1">
                      <Building2 size={13} className="text-primary flex-shrink-0" />
                      {selectedInvoice.space_name || 'Billboard Inventory Space'}
                    </strong>
                  </div>
                  <div className="col-12 col-sm-6 mt-1">
                    <span className="text-muted d-block">Campaign / Scope:</span>
                    <span className="text-secondary fw-medium">
                      {selectedInvoice.campaign_name || selectedInvoice.purpose}
                    </span>
                  </div>
                  <div className="col-12 col-sm-6 mt-1">
                    <span className="text-muted d-block">Outstanding Balance Due:</span>
                    <strong className="text-danger font-monospace">
                      Rs. {parseFloat(selectedInvoice.balance_due || selectedInvoice.total_amount || 0).toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="form-group-ui">
            <label className="form-label-ui">Invoice Reference ID <span className="form-required">*</span></label>
            <input
              type="number"
              className="form-input-ui font-monospace"
              placeholder="e.g. 1"
              value={paymentFormData.invoice_id}
              onChange={(e) => setPaymentFormData({ ...paymentFormData, invoice_id: e.target.value })}
              required
            />
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="form-group-ui">
                <label className="form-label-ui">Amount Settled (PKR Rs.) <span className="form-required">*</span></label>
                <input
                  type="number"
                  step="1"
                  className="form-input-ui font-monospace"
                  placeholder="e.g. 145000"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="form-group-ui">
                <label className="form-label-ui">Payment Channel</label>
                <select
                  className="form-select-ui"
                  value={paymentFormData.payment_method}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_method: e.target.value })}
                >
                  <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                  <option value="CREDIT_CARD">Corporate Credit Card</option>
                  <option value="CHEQUE">Cheque Clearance</option>
                  <option value="CASH">Cash Deposit</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-group-ui mb-0">
            <label className="form-label-ui">Bank Transaction Reference / Cheque #</label>
            <input
              type="text"
              className="form-input-ui font-monospace"
              placeholder="e.g. HBL-FT-940284"
              value={paymentFormData.transaction_reference}
              onChange={(e) => setPaymentFormData({ ...paymentFormData, transaction_reference: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Commercial Invoice Details Modal */}
      <Modal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        title="Commercial Tax Invoice Breakdown"
        subtitle={`Invoice Identifier: ${selectedInvoice?.invoice_number || ''}`}
        size="lg"
        footer={
          <div className="d-flex align-items-center justify-content-between w-100">
            <div>
              {selectedInvoice && selectedInvoice.status !== 'PAID' && (
                <button
                  type="button"
                  className="btn-ui btn-ui-primary btn-ui-sm d-inline-flex align-items-center gap-1"
                  onClick={() => {
                    const inv = selectedInvoice;
                    setSelectedInvoice(null);
                    setPaymentFormData({
                      ...paymentFormData,
                      invoice_id: inv.id,
                      amount: inv.balance_due || inv.total_amount
                    });
                    setShowPaymentModal(true);
                  }}
                >
                  <CreditCard size={12} />
                  <span>Settle / Pay Invoice</span>
                </button>
              )}
            </div>
            <button
              type="button"
              className="btn-ui btn-ui-secondary btn-ui-sm"
              onClick={() => setSelectedInvoice(null)}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedInvoice && (
          <div className="invoice-details-view">
            {/* Top Banner Card */}
            <div className="p-3 mb-3 rounded-2 border bg-light-subtle d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div>
                <span className="text-xs text-muted d-block font-monospace">
                  COMMERCIAL TAX INVOICE
                </span>
                <h6 className="fw-bold mb-0 text-primary font-monospace">
                  {selectedInvoice.invoice_number}
                </h6>
              </div>
              <div className="d-flex align-items-center gap-2">
                <StatusBadge
                  status={
                    selectedInvoice.status === 'PAID'
                      ? 'confirmed'
                      : selectedInvoice.status === 'ISSUED' || selectedInvoice.status === 'PARTIALLY_PAID'
                      ? 'pending'
                      : selectedInvoice.status === 'OVERDUE'
                      ? 'rejected'
                      : 'draft'
                  }
                  label={selectedInvoice.status}
                  size="md"
                />
                {selectedInvoice.status === 'PAID' ? (
                  <span className="badge bg-success-subtle text-success text-xs font-semibold py-1.5 px-2.5">
                    Paid in Full
                  </span>
                ) : (
                  <span className="badge bg-warning-subtle text-warning text-xs font-semibold py-1.5 px-2.5">
                    Unpaid Balance: Rs. {parseFloat(selectedInvoice.balance_due || selectedInvoice.total_amount || 0).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className="row g-3">
              {/* Customer & Company Details */}
              <div className="col-12 col-md-6">
                <div className="p-3 border rounded-2 h-100 bg-light-subtle">
                  <span className="badge bg-primary-subtle text-primary text-xs font-semibold mb-2">
                    Billed Customer / Entity
                  </span>
                  <div className="text-xs mb-2">
                    <span className="text-muted d-block">Client Name:</span>
                    <strong className="text-primary-emphasis d-flex align-items-center gap-1">
                      <User size={12} className="text-primary flex-shrink-0" />
                      <span>{selectedInvoice.customer_name || 'Commercial Advertiser'}</span>
                    </strong>
                  </div>
                  <div className="text-xs mb-2">
                    <span className="text-muted d-block">Company / Organization:</span>
                    <strong className="text-dark-emphasis d-flex align-items-center gap-1">
                      <Building2 size={12} className="text-primary flex-shrink-0" />
                      <span>{selectedInvoice.advertiser_name || selectedInvoice.customer_name || 'Direct Advertiser'}</span>
                    </strong>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted d-block">Invoice Due Date:</span>
                    <span className="text-secondary fw-medium d-flex align-items-center gap-1">
                      <CalendarDays size={13} className="text-muted" />
                      {selectedInvoice.due_date || 'Payable Upon Receipt'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Space & Flighting Scope */}
              <div className="col-12 col-md-6">
                <div className="p-3 border rounded-2 h-100 bg-light-subtle">
                  <span className="badge bg-info-subtle text-info text-xs font-semibold mb-2">
                    Advertising Inventory Space
                  </span>
                  <div className="text-xs mb-2">
                    <span className="text-muted d-block">Billboard Space Paid For:</span>
                    <strong className="text-primary-emphasis d-flex align-items-center gap-1">
                      <Building2 size={13} className="text-primary flex-shrink-0" />
                      {selectedInvoice.space_name || 'Billboard Inventory Placement'}
                    </strong>
                  </div>
                  <div className="text-xs mb-2">
                    <span className="text-muted d-block">Marketing Campaign:</span>
                    <span className="text-dark-emphasis fw-medium">
                      {selectedInvoice.campaign_name || `Campaign #${selectedInvoice.campaign_id}`}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted d-block">Scope &amp; Purpose:</span>
                    <span className="text-secondary">
                      {selectedInvoice.purpose || 'Commercial Advertising Placement'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comprehensive Line-Item Financial Breakdown */}
              <div className="col-12">
                <div className="p-3 border rounded-2 bg-light-subtle">
                  <span className="badge bg-secondary-subtle text-secondary text-xs font-semibold mb-2">
                    Commercial Statement &amp; Tax Calculation
                  </span>
                  <div className="table-responsive">
                    <table className="table table-sm table-borderless mb-0 text-xs">
                      <tbody>
                        <tr className="border-bottom">
                          <td className="text-muted py-1.5">Net Inventory Subtotal</td>
                          <td className="text-end font-monospace py-1.5 fw-medium">
                            Rs. {parseFloat(selectedInvoice.subtotal || 0).toLocaleString()}
                          </td>
                        </tr>
                        <tr className="border-bottom">
                          <td className="text-muted py-1.5">
                            Provincial Sales Tax / GST ({selectedInvoice.tax_rate || 16}%)
                          </td>
                          <td className="text-end font-monospace py-1.5 text-secondary">
                            +Rs. {parseFloat(selectedInvoice.tax_amount || selectedInvoice.tax || 0).toLocaleString()}
                          </td>
                        </tr>
                        <tr className="border-bottom fw-bold">
                          <td className="text-primary-emphasis py-2" style={{ fontSize: '0.85rem' }}>
                            Gross Total Amount
                          </td>
                          <td className="text-end font-monospace text-primary-emphasis py-2" style={{ fontSize: '0.85rem' }}>
                            Rs. {parseFloat(selectedInvoice.total_amount || 0).toLocaleString()}
                          </td>
                        </tr>
                        <tr className="border-bottom">
                          <td className="text-success py-1.5">
                            Total Settled / Amount Paid
                          </td>
                          <td className="text-end font-monospace text-success py-1.5 fw-semibold">
                            -Rs. {parseFloat(selectedInvoice.amount_paid || 0).toLocaleString()}
                          </td>
                        </tr>
                        <tr className="fw-bold">
                          <td className="text-danger py-2" style={{ fontSize: '0.9rem' }}>
                            Remaining Balance Due
                          </td>
                          <td className="text-end font-monospace text-danger py-2" style={{ fontSize: '0.9rem' }}>
                            Rs. {parseFloat(selectedInvoice.balance_due || 0).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentsPage;