/**
 * Centralized API Client
 * Handles all API communication, token management, and error handling
 */

const API_BASE_URL = 'https://infoassproj.onrender.com/api';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  /**
   * Get authentication token
   */
  getToken() {
    return this.token;
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.token;
  }

  /**
   * Build headers with authentication
   */
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Make API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: options.method || 'GET',
      headers: this.getHeaders(options.includeAuth !== false),
      ...options
    };

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw {
          status: response.status,
          message: error.error || error.message || 'Request failed',
          data: error
        };
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return { success: true };
      }

      return await response.json();
    } catch (error) {
      if (error.status === 401) {
        // Unauthorized - clear token and redirect to login
        this.clearToken();
        window.location.href = '/index.html';
      }
      throw error;
    }
  }

  // ──── AUTH ENDPOINTS ────
  async register(email, password, username) {
    return this.request('/auth/register', {
      method: 'POST',
      body: { email, password, username },
      includeAuth: false
    });
  }

  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
      includeAuth: false
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async verifyStudent(studentId, studentName) {
    return this.request('/auth/verify', {
      method: 'POST',
      body: { studentId, studentName },
      includeAuth: false
    });
  }

  // ──── ITEM ENDPOINTS ────
  async getItems(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.q) params.append('q', filters.q);

    const queryString = params.toString();
    return this.request(`/items${queryString ? '?' + queryString : ''}`, {
      includeAuth: false
    });
  }

  async createItem(itemData) {
    return this.request('/items', {
      method: 'POST',
      body: itemData
    });
  }

  async updateItemStatus(itemId, status) {
    return this.request(`/items/${itemId}`, {
      method: 'PATCH',
      body: { status }
    });
  }

  async deleteItem(itemId) {
    return this.request(`/items/${itemId}`, {
      method: 'DELETE'
    });
  }

  // ──── NOTIFICATION ENDPOINTS ────
  async getNotifications(page = 1, limit = 20) {
    return this.request(`/notifications?page=${page}&limit=${limit}`);
  }

  async markNotificationAsRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read/all', {
      method: 'PATCH'
    });
  }

  async deleteNotification(notificationId) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE'
    });
  }

  // ──── USER ENDPOINTS ────
  async getUserProfile() {
    return this.request('/users/profile');
  }

  async updateUserProfile(userData) {
    return this.request('/users/profile', {
      method: 'PATCH',
      body: userData
    });
  }

  async getUserItems(page = 1, limit = 10) {
    return this.request(`/users/my-items?page=${page}&limit=${limit}`);
  }

  async deleteUserAccount(password) {
    return this.request('/users/profile', {
      method: 'DELETE',
      body: { password }
    });
  }

  // ──── ADMIN ENDPOINTS ────
  async getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  async getAllUsers(page = 1, limit = 20, search = '') {
    return this.request(`/admin/users?page=${page}&limit=${limit}${search ? '&search=' + search : ''}`);
  }

  async getAllItems(page = 1, limit = 20, status = '', category = '') {
    let query = `?page=${page}&limit=${limit}`;
    if (status) query += `&status=${status}`;
    if (category) query += `&category=${category}`;
    return this.request(`/admin/items${query}`);
  }

  async deleteUserAdmin(userId) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE'
    });
  }

  async deleteItemAdmin(itemId) {
    return this.request(`/admin/items/${itemId}`, {
      method: 'DELETE'
    });
  }

  async getSystemLogs(level = 'all', limit = 100) {
    return this.request(`/admin/logs?level=${level}&limit=${limit}`);
  }
}

// Export singleton instance
export const api = new APIClient();

// Make it global for debugging
window.api = api;
