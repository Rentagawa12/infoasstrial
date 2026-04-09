/**
 * Client-Side Router
 * Handles page navigation and authentication checks
 */

import { api } from './api.js';

class Router {
  constructor() {
    this.routes = {
      '/': 'index.html',
      '/home': 'index.html',
      '/login': 'index.html', // Same page, different view
      '/register': 'index.html',
      '/dashboard': 'index.html',
      '/profile': 'user-profile.html',
      '/my-items': 'my-items.html',
      '/notifications': 'notifications.html',
      '/settings': 'settings.html',
      '/admin': 'admin-dashboard.html'
    };

    this.protectedRoutes = [
      '/profile',
      '/my-items',
      '/notifications',
      '/settings',
      '/dashboard'
    ];

    this.adminRoutes = ['/admin'];
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return api.isAuthenticated();
  }

  /**
   * Check if user is admin
   */
  async isAdmin() {
    try {
      const user = await api.getCurrentUser();
      return user.role === 'admin';
    } catch {
      return false;
    }
  }

  /**
   * Navigate to a route
   */
  navigate(path) {
    const page = this.routes[path] || 'index.html';
    window.location.href = `/${page}`;
  }

  /**
   * Handle protected routes
   */
  async handleRoute(path) {
    // Check if route is protected
    if (this.protectedRoutes.includes(path)) {
      if (!this.isAuthenticated()) {
        console.warn('Access denied: User not authenticated');
        this.navigate('/login');
        return false;
      }
    }

    // Check if route requires admin
    if (this.adminRoutes.includes(path)) {
      if (!this.isAuthenticated() || !(await this.isAdmin())) {
        console.warn('Access denied: Admin role required');
        this.navigate('/');
        return false;
      }
    }

    return true;
  }

  /**
   * Get current page from URL
   */
  getCurrentPage() {
    const hash = window.location.hash.slice(1);
    return hash || '/';
  }
}

// Export singleton instance
export const router = new Router();
window.router = router;
