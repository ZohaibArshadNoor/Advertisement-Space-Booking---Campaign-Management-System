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
  Eye
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
                <DollarSign size={14} />
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
                      <th>Campaign &amp; Advertiser</th>
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
                          <div className="fw-semibold text-xs text-primary-emphasis">
                            {inv.campaign?.name || (inv.campaign_id ? `Campaign #${inv.campaign_id}` : 'Direct Space Campaign')}
                          </div>
                          <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                            Tax Rate: {inv.tax_rate || 16}% (Provincial GST)
                          </small>
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
                                ✓ Paid in Full
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
                  {c.name} ({c.reference_code})
                </option>
              ))}
            </select>
          </div>

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
    </div>
  );
};

export default PaymentsPage;