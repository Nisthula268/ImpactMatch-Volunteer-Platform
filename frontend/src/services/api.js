import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (data)     => api.post('/auth/register', data),
  login:          (data)     => api.post('/auth/login', data),
  getMe:          ()         => api.get('/auth/me'),
  updateProfile:  (data)     => api.put('/auth/profile', data),
  uploadPicture:  (formData) => api.post('/auth/upload-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ── Opportunities ─────────────────────────────────────────────────────────────
export const opportunityAPI = {
  getAll:   (params) => api.get('/opportunities', { params }),
  getMy:    ()       => api.get('/opportunities/my'),
  getById:  (id)     => api.get(`/opportunities/${id}`),
  create:   (data)   => api.post('/opportunities', data),
  update:   (id, data) => api.put(`/opportunities/${id}`, data),
  delete:   (id)     => api.delete(`/opportunities/${id}`),
};

// ── Applications ──────────────────────────────────────────────────────────────
export const applicationAPI = {
  apply:          (data)        => api.post('/applications', data),
  getMy:          ()            => api.get('/applications/my'),
  getByOpportunity: (oppId)     => api.get(`/applications/opportunity/${oppId}`),
  updateStatus:   (id, data)    => api.put(`/applications/${id}/status`, data),
};

// ── AI Matching ───────────────────────────────────────────────────────────────
export const matchingAPI = {
  getMatched: ()    => api.get('/matching/opportunities'),
  getScore:   (id)  => api.get(`/matching/score/${id}`),
};

// ── Attendance ────────────────────────────────────────────────────────────────
export const attendanceAPI = {
  checkIn:  (data) => api.post('/attendance/checkin', data),
  checkOut: (data) => api.post('/attendance/checkout', data),
  getMy:    ()     => api.get('/attendance/my'),
};

// ── Certificates ──────────────────────────────────────────────────────────────
export const certificateAPI = {
  getMy:     ()             => api.get('/certificates/my'),
  getIssued: ()             => api.get('/certificates/issued'),
  issue:     (applicationId) => api.post(`/certificates/issue/${applicationId}`),
  verify:    (code)         => api.get(`/certificates/verify/${code}`),

  // Returns a blob for browser download
  download: (certificateId) =>
    api.get(`/certificates/download/${certificateId}`, { responseType: 'blob' }),
};

// ── Mentorship ────────────────────────────────────────────────────────────────
export const mentorshipAPI = {
  getMentors:    ()          => api.get('/mentorship/mentors'),
  requestMentor: (data)      => api.post('/mentorship/request', data),
  getMy:         ()          => api.get('/mentorship/my'),
  getRequests:   ()          => api.get('/mentorship/requests'),
  respond:       (id, data)  => api.put(`/mentorship/${id}/respond`, data),
  addSession:    (id, data)  => api.post(`/mentorship/${id}/session`, data),
  complete:      (id, data)  => api.put(`/mentorship/${id}/complete`, data),
};

export default api;
