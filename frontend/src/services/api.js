import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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
  getProfile: (id = 'S102') => api.get(`/seniors/${id}`),
  getHealth: (id = 'S102') => api.get(`/seniors/${id}/health`),
  updateProfile: (id, data) => api.put(`/seniors/${id}`, data)
};

// Caretaker API
export const caretakerApi = {
  getAll: () => api.get('/caretakers'),
  getById: (id) => api.get(`/caretakers/${id}`),
  setAvailability: (id, availability) => api.patch(`/caretakers/${id}/availability`, { availability })
};

export default api;
