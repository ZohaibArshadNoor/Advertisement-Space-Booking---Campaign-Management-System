import React, { useState, useEffect } from 'react';
import { paymentsApi } from '../paymentsApi';
import { campaignService } from '../../../services/campaignService';
import { useAuth } from '../../../context/AuthContext';
import { extractErrorMessage } from '../../../utils/errorHandler';
import { 
  CreditCard, 
  Plus, 
  FileText, 
  CheckCircle2, 
  DollarSign, 
  AlertCircle, 
  CalendarDays, 
  Building2 
} from 'lucide-react';

const INVOICE_STATUS_BADGES = {
  DRAFT: 'bg-secondary',
  ISSUED: 'bg-warning text-dark',
  PARTIALLY_PAID: 'bg-info text-dark',
  PAID: 'bg-success',
  OVERDUE: 'bg-danger',
  CANCELLED: 'bg-dark',
};

const PAYMENT_STATUS_BADGES = {
  PENDING: 'bg-warning text-dark',
  COMPLETED: 'bg-success',
  FAILED: 'bg-danger',
  REFUNDED: 'bg-secondary',
};

const PaymentsPage = () => {
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

  // Fetch campaigns for dropdowns
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

  // Fetch Invoices
  const fetchInvoices = async () => {
    setInvoicesLoading(true);
    setError('');
    try {
      const params = { page: invoicePage, per_page: 10 };
      if (invoiceStatusFilter) params.status = invoiceStatusFilter;
      const data = await paymentsApi.getInvoices(params);
      setInvoices(data.invoices || data.items || []);
      setInvoicePagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load invoices.'));
    } finally {
      setInvoicesLoading(false);
    }
  };

  // Fetch Payments
  const fetchPayments = async () => {
    setPaymentsLoading(true);
    setError('');
    try {
      const params = { page: paymentPage, per_page: 10 };
      const data = await paymentsApi.getPayments(params);
      setPayments(data.payments || data.items || []);
      setPaymentPagination(data.pagination || { page: 1, pages: 1, total: 0 });
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

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setCreatingInvoice(true);
    setError('');
    try {
      await paymentsApi.createInvoice({
        campaign_id: parseInt(invoiceFormData.campaign_id),
        tax_rate: invoiceFormData.tax_rate,
        due_date: invoiceFormData.due_date || undefined,
      });
      setSuccessMsg('Invoice generated successfully!');
      setShowInvoiceModal(false);
      setInvoiceFormData({ campaign_id: '', tax_rate: '16.00', due_date: '' });
      fetchInvoices();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to generate invoice.'));
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setSubmittingPayment(true);
    setError('');
    try {
      await paymentsApi.recordPayment({
        invoice_id: parseInt(paymentFormData.invoice_id),
        amount: parseFloat(paymentFormData.amount),
        payment_method: paymentFormData.payment_method,
        transaction_reference: paymentFormData.transaction_reference,
      });
      setSuccessMsg('Payment recorded and reconciled successfully!');
      setShowPaymentModal(false);
      setPaymentFormData({ invoice_id: '', amount: '', payment_method: 'BANK_TRANSFER', transaction_reference: '' });
      if (activeTab === 'invoices') fetchInvoices();
      else fetchPayments();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to record payment.'));
    } finally {
      setSubmittingPayment(false);
    }
  };

  const openPaymentForInvoice = (invoice) => {
    setPaymentFormData({
      invoice_id: invoice.id,
      amount: (invoice.total_amount - (invoice.paid_amount || 0)).toFixed(2),
      payment_method: 'BANK_TRANSFER',
      transaction_reference: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
    });
    setShowPaymentModal(true);
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Billing & Payments</h2>
          <p className="text-muted small mb-0">Manage campaign invoices, financial reconciliations, and payment receipts</p>
        </div>
        <div className="d-flex gap-2">
          {canManageFinance && (
            <button className="btn btn-outline-primary" onClick={() => setShowInvoiceModal(true)}>
              + Generate Invoice
            </button>
          )}
          {canManageFinance && (
            <button className="btn btn-primary" onClick={() => setShowPaymentModal(true)}>
              + Record Payment
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger alert-dismissible">{error}</div>}
      {successMsg && <div className="alert alert-success alert-dismissible">{successMsg}</div>}

      {/* Tabs */}
      <ul className="nav nav-pills mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'invoices' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoices')}
          >
            📄 Invoices
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            💳 Transaction History
          </button>
        </li>
      </ul>

      {/* TAB 1: INVOICES */}
      {activeTab === 'invoices' && (
        <>
          {/* Invoice Filter Bar */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <div className="row g-2 align-items-center">
                <div className="col-md-4">
                  <select
                    className="form-select"
                    value={invoiceStatusFilter}
                    onChange={(e) => {
                      setInvoiceStatusFilter(e.target.value);
                      setInvoicePage(1);
                    }}
                  >
                    <option value="">All Invoice Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ISSUED">Issued (Unpaid)</option>
                    <option value="PARTIALLY_PAID">Partially Paid</option>
                    <option value="PAID">Paid</option>
                    <option value="OVERDUE">Overdue</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <button className="btn btn-outline-secondary w-100" onClick={() => setInvoiceStatusFilter('')}>
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-body p-0">
              {invoicesLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary"></div>
                  <p className="text-muted mt-2">Loading invoices...</p>
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-5">
                  <h5>No invoices found</h5>
                  <p className="text-muted small">Invoices generated for campaigns will show up here.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Invoice #</th>
                        <th>Campaign</th>
                        <th>Subtotal</th>
                        <th>Tax</th>
                        <th>Total Due</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="fw-semibold text-primary">{inv.invoice_number}</td>
                          <td>
                            <div className="fw-bold">{inv.campaign?.name || `Campaign #${inv.campaign_id}`}</div>
                            <small className="text-muted">{inv.advertiser?.company_name || ''}</small>
                          </td>
                          <td>${parseFloat(inv.subtotal || 0).toLocaleString()}</td>
                          <td>${parseFloat(inv.tax_amount || 0).toLocaleString()} ({inv.tax_rate}%)</td>
                          <td className="fw-bold text-success">${parseFloat(inv.total_amount || 0).toLocaleString()}</td>
                          <td><small>{inv.due_date || 'Upon Receipt'}</small></td>
                          <td>
                            <span className={`badge ${INVOICE_STATUS_BADGES[inv.status] || 'bg-secondary'}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="text-end">
                            {inv.status !== 'PAID' && canManageFinance && (
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => openPaymentForInvoice(inv)}
                              >
                                Pay Invoice
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {invoicePagination.pages > 1 && (
              <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
                <span className="text-muted small">
                  Page {invoicePagination.page} of {invoicePagination.pages} ({invoicePagination.total} total)
                </span>
                <div>
                  <button
                    className="btn btn-outline-secondary btn-sm me-2"
                    disabled={invoicePagination.page <= 1}
                    onClick={() => setInvoicePage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    disabled={invoicePagination.page >= invoicePagination.pages}
                    onClick={() => setInvoicePage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 2: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="card shadow-sm border-0">
          <div className="card-body p-0">
            {paymentsLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary"></div>
                <p className="text-muted mt-2">Loading transactions...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-5">
                <h5>No payment transactions recorded</h5>
                <p className="text-muted small">Processed payments will be logged here.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Payment Ref</th>
                      <th>Invoice #</th>
                      <th>Transaction ID</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Payment Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="fw-semibold text-primary">{p.payment_reference || `#${p.id}`}</td>
                        <td>{p.invoice?.invoice_number || `Invoice #${p.invoice_id}`}</td>
                        <td><code className="text-secondary">{p.transaction_reference || 'N/A'}</code></td>
                        <td className="fw-bold text-success">${parseFloat(p.amount || 0).toLocaleString()}</td>
                        <td><span className="badge bg-light text-dark border">{p.payment_method}</span></td>
                        <td><small>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : 'N/A'}</small></td>
                        <td>
                          <span className={`badge ${PAYMENT_STATUS_BADGES[p.status] || 'bg-secondary'}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {paymentPagination.pages > 1 && (
            <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
              <span className="text-muted small">
                Page {paymentPagination.page} of {paymentPagination.pages} ({paymentPagination.total} total)
              </span>
              <div>
                <button
                  className="btn btn-outline-secondary btn-sm me-2"
                  disabled={paymentPagination.page <= 1}
                  onClick={() => setPaymentPage((p) => p - 1)}
                >
                  Previous
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={paymentPagination.page >= paymentPagination.pages}
                  onClick={() => setPaymentPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generate Invoice Modal */}
      {showInvoiceModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Generate Campaign Invoice</h5>
                <button type="button" className="btn-close" onClick={() => setShowInvoiceModal(false)}></button>
              </div>
              <form onSubmit={handleCreateInvoice}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Campaign *</label>
                    <select
                      className="form-select"
                      required
                      value={invoiceFormData.campaign_id}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, campaign_id: e.target.value })}
                    >
                      <option value="">Select a campaign...</option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (Budget: ${parseFloat(c.budget || 0).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Tax Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={invoiceFormData.tax_rate}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, tax_rate: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Due Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={invoiceFormData.due_date}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowInvoiceModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={creatingInvoice}>
                    {creatingInvoice ? 'Generating...' : 'Create Invoice'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Record Payment</h5>
                <button type="button" className="btn-close" onClick={() => setShowPaymentModal(false)}></button>
              </div>
              <form onSubmit={handleRecordPayment}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Invoice *</label>
                    <select
                      className="form-select"
                      required
                      value={paymentFormData.invoice_id}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, invoice_id: e.target.value })}
                    >
                      <option value="">Select invoice to pay...</option>
                      {invoices.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoice_number} — Total: ${parseFloat(inv.total_amount).toLocaleString()} (Status: {inv.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Payment Amount ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      required
                      placeholder="e.g. 50000"
                      value={paymentFormData.amount}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Payment Method *</label>
                    <select
                      className="form-select"
                      value={paymentFormData.payment_method}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_method: e.target.value })}
                    >
                      <option value="BANK_TRANSFER">Bank Transfer (Wire/IBFT)</option>
                      <option value="CREDIT_CARD">Credit Card / Debit Card</option>
                      <option value="ONLINE">Online Payment Gateway</option>
                      <option value="CHEQUE">Cheque / Demand Draft</option>
                      <option value="CASH">Cash</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Transaction Reference *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. TRX-98234 or Check #"
                      value={paymentFormData.transaction_reference}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, transaction_reference: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success" disabled={submittingPayment}>
                    {submittingPayment ? 'Recording...' : 'Confirm Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;