import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Cases
export const getCases = () => api.get('/cases').then(res => res.data);
export const getCase = (id) => api.get(`/cases/${id}`).then(res => res.data);
export const createCase = (data) => api.post('/cases', data).then(res => res.data);

// Evidence
export const getEvidence = (params) => api.get('/evidence', { params }).then(res => res.data);
export const getEvidenceById = (id) => api.get(`/evidence/${id}`).then(res => res.data);
export const verifyEvidence = (id) => api.post(`/evidence/${id}/verify`).then(res => res.data);
export const recalculateHash = (id) => api.post(`/evidence/${id}/hash`).then(res => res.data);
export const streamUrl = (id) => `/api/evidence/${id}/stream`;
export const thumbnailUrl = (id) => `/api/evidence/${id}/thumbnail`;

// Acquisition
export const acquireEvidence = (formData, onUploadProgress) => 
  api.post('/acquisition', formData, { 
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  }).then(res => res.data);

// Recovery
export const runRecovery = (data) => api.post('/recovery', data).then(res => res.data);
export const getRecoveryResults = (id) => api.get(`/recovery/${id}`).then(res => res.data);

// Analysis
export const runAnalysis = (data) => api.post('/analysis', data).then(res => res.data);

// Events & Timeline
export const getEvents = (params) => api.get('/events', { params }).then(res => res.data);
export const getTimeline = (caseId) => api.get(`/timeline?case_id=${caseId}`).then(res => res.data);

// Audit
export const getAuditLogs = (params) => api.get('/audit', { params }).then(res => res.data);

// Ledger
export const getLedger = () => api.get('/ledger').then(res => res.data);
export const verifyLedger = () => api.post('/ledger/verify').then(res => res.data);

// Reports
export const generateReport = (data) => api.post('/reports', data).then(res => res.data);
export const getReports = (params) => api.get('/reports', { params }).then(res => res.data);

// Health
export const getHealth = () => api.get('/health').then(res => res.data);

// Vendors
export const getVendors = () => api.get('/vendors').then(res => res.data);

// Jobs
export const getJob = (id) => api.get(`/jobs/${id}`).then(res => res.data);

// Search
export const globalSearch = (q) => api.get(`/search?q=${q}`).then(res => res.data);

// Bookmarks & Annotations
export const getBookmarks = (evidenceId) => api.get(`/evidence/${evidenceId}/bookmarks`).then(res => res.data);
export const createBookmark = (evidenceId, data) => api.post(`/evidence/${evidenceId}/bookmarks`, data).then(res => res.data);
export const getAnnotations = (evidenceId) => api.get(`/evidence/${evidenceId}/annotations`).then(res => res.data);
export const createAnnotation = (evidenceId, data) => api.post(`/evidence/${evidenceId}/annotations`, data).then(res => res.data);

export default api;
