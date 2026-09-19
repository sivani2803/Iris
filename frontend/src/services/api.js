import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach Authorization header if token exists in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('iris_jwt_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Offline queue for health events
const QUEUE_KEY = 'iris_offline_health_events';

export function queueOfflineEvent(eventData) {
  try {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    queue.push({ ...eventData, queuedAt: new Date().toISOString() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return true;
  } catch (e) {
    console.error('Failed to queue offline event:', e);
    return false;
  }
}

export function getOfflineQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

export function clearOfflineQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

// Emergency API calls
export const emergencyApi = {
  sendHealthEvent: async (eventData) => {
    try {
      const res = await api.post('/emergency/health-event', eventData);
      return res.data;
    } catch (err) {
      // If network offline or connection failure, queue locally
      if (!err.response) {
        queueOfflineEvent(eventData);
        throw new Error('Connection interrupted. Event queued locally for transmission.');
      }
      throw err;
    }
  },
  getActive: () => api.get('/emergency/active'),
  getById: (id) => api.get(`/emergency/${id}`),
  accept: (id, caretakerId) => api.post(`/emergency/${id}/accept`, { caretakerId }),
  decline: (id, reason) => api.post(`/emergency/${id}/decline`, { reason }),
  enRoute: (id, caretakerId) => api.post(`/emergency/${id}/en-route`, { caretakerId }),
  arrived: (id, caretakerId) => api.post(`/emergency/${id}/arrived`, { caretakerId }),
  resolve: (id, notes) => api.post(`/emergency/${id}/resolve`, { resolutionNotes: notes }),
  reassess: (id, reason) => api.post(`/emergency/${id}/reassess`, { reason }),
  reset: () => api.post('/emergency/reset')
};

// Senior & Vitals API
export const seniorApi = {
  getMe: () => api.get('/seniors/me'),
  getMyHealth: () => api.get('/seniors/me/health'),
  getProfile: (id) => api.get(`/seniors/${id}`),
  getHealth: (id) => api.get(`/seniors/${id}/health`),
  updateProfile: (id, data) => api.put(`/seniors/${id}`, data)
};

// Medicines API
export const medicineApi = {
  getMyMedicines: () => api.get('/medicines/me'),
  getForSenior: (seniorId) => api.get(`/medicines/${seniorId}`),
  addMedicine: (data) => api.post('/medicines', data),
  updateStatus: (id, status) => api.patch(`/medicines/${id}/status`, { status })
};

// Appointments API
export const appointmentApi = {
  getMyAppointments: () => api.get('/appointments/me'),
  getForSenior: (seniorId) => api.get(`/appointments/${seniorId}`),
  addAppointment: (data) => api.post('/appointments', data)
};

// Auth & Connection API
export const authApi = {
  connectSenior: (data) => api.post('/auth/connect-senior', data),
  updateLanguage: (preferredLanguage) => api.patch('/auth/profile/language', { preferredLanguage })
};

// Caretaker API
export const caretakerApi = {
  getAll: () => api.get('/caretakers'),
  getById: (id) => api.get(`/caretakers/${id}`),
  setAvailability: (id, availability) => api.patch(`/caretakers/${id}/availability`, { availability })
};

// Connect & Contribute API
export const connectContributeApi = {
  getOrganizations: (category) => api.get('/connect-contribute/organizations', { params: category ? { category } : {} }),
  getOrganization: (id) => api.get(`/connect-contribute/organizations/${id}`),
  participate: (data) => api.post('/connect-contribute/participate', data),
  getMyParticipations: () => api.get('/connect-contribute/my-participations'),
};

export default api;
