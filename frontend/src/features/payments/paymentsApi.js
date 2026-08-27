import apiClient from '../../services/apiClient';

export const paymentsApi = {
  // Invoices Endpoints
  getInvoices: async (params = {}) => {
    const response = await apiClient.get('/invoices', { params });
    return response.data;
  },

  getInvoiceById: async (id) => {
    const response = await apiClient.get(`/invoices/${id}`);
    return response.data;
  },

  createInvoice: async (invoiceData) => {
    const response = await apiClient.post('/invoices', invoiceData);
    return response.data;
  },

  issueInvoice: async (invoiceId) => {
    const response = await apiClient.patch(`/invoices/${invoiceId}/status`, { status: 'ISSUED' });
    return response.data;
  },

  // Payments Endpoints
  getPayments: async (params = {}) => {
    const response = await apiClient.get('/payments', { params });
    return response.data;
  },

  createPayment: async (paymentData) => {
    const response = await apiClient.post('/payments', paymentData);
    return response.data;
  },

  recordPayment: async (paymentData) => {
    const response = await apiClient.post('/payments', paymentData);
    return response.data;
  },

  updatePaymentStatus: async (paymentId, status) => {
    const response = await apiClient.patch(`/payments/${paymentId}/status`, { status });
    return response.data;
  },
};