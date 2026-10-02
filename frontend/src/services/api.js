const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('hotel_auth_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
        localStorage.removeItem('hotel_auth_token');
        localStorage.removeItem('hotel_user_data');
        window.dispatchEvent(new Event('auth-logout'));
      }
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export const authAPI = {
  register: (payload) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/api/auth/me'),
};

export const roomAPI = {
  getRooms: (params = {}) => {
    const query = new URLSearchParams();
    if (params.type) query.append('type', params.type);
    if (params.maxPrice) query.append('maxPrice', params.maxPrice);
    if (params.sort) query.append('sort', params.sort);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/api/rooms${queryString}`);
  },
  getRoomById: (id) => request(`/api/rooms/${id}`),
  createRoom: (payload) => request('/api/rooms', { method: 'POST', body: JSON.stringify(payload) }),
  updateRoom: (id, payload) => request(`/api/rooms/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteRoom: (id) => request(`/api/rooms/${id}`, { method: 'DELETE' }),
};

export const bookingAPI = {
  createBooking: (payload) => request('/api/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  getMyBookings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/bookings/my${query ? `?${query}` : ''}`);
  },
  getAllBookings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/bookings${query ? `?${query}` : ''}`);
  },
  getBookingById: (id) => request(`/api/bookings/${id}`),
  cancelBooking: (id) => request(`/api/bookings/${id}/cancel`, { method: 'PATCH' }),
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

