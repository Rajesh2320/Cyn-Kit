/**
 * AdminService - Handles all admin operations for Cynthia's Kitchen
 * Communicates with Google Apps Script backend for data persistence
 */

class AdminService {
  /**
   * Initialize AdminService with Google Apps Script URL
   * @param {string} googleAppsScriptUrl - The deployed Google Apps Script URL
   */
  constructor(googleAppsScriptUrl) {
    if (!googleAppsScriptUrl) {
      throw new Error('Google Apps Script URL is required');
    }
    this.googleAppsScriptUrl = googleAppsScriptUrl;
    this.isAuthenticated = false;
    this.adminPassword = null;
  }

  /**
   * Verify admin password with server
   * @param {string} password - Admin password
   * @returns {Promise<boolean>} True if password is valid
   */
  async verifyPassword(password) {
    try {
      const response = await fetch(
        `${this.googleAppsScriptUrl}?action=verifyPassword&password=${encodeURIComponent(password)}`
      );

      if (!response.ok) {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }

      const result = await response.json();

      if (result.status === 'success' && result.verified === true) {
        this.isAuthenticated = true;
        this.adminPassword = password;
        console.log('✅ Admin authenticated successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Password verification error:', error);
      throw error;
    }
  }

  /**
   * Get all orders with optional filters
   * @param {object} options - Filter options
   * @param {string} options.statusFilter - Filter by status (Pending, Confirmed, Completed)
   * @param {string} options.searchOrderId - Search by Order ID
   * @param {string} options.searchPhone - Search by phone number
   * @returns {Promise<array>} Array of orders
   */
  async getOrders(options = {}) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.');
    }

    try {
      const response = await fetch(
        `${this.googleAppsScriptUrl}?action=getOrders&password=${encodeURIComponent(this.adminPassword)}`
      );

      if (!response.ok) {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }

      const result = await response.json();

      if (result.status === 'success' && result.orders) {
        let orders = result.orders;

        // Apply filters if provided
        if (options.statusFilter) {
          orders = orders.filter(order => order['Order Status'] === options.statusFilter);
        }

        if (options.searchOrderId) {
          const searchId = options.searchOrderId.toUpperCase();
          orders = orders.filter(order => order['Order ID'].includes(searchId));
        }

        if (options.searchPhone) {
          orders = orders.filter(order => order['Phone'].includes(options.searchPhone));
        }

        console.log(`📦 Loaded ${orders.length} orders`);
        return orders;
      }

      return [];
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      throw error;
    }
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} newStatus - New status (Pending, Confirmed, Completed)
   * @param {number} rowIndex - Row index in Google Sheet
   * @returns {Promise<object>} Updated order result
   */
  async updateOrderStatus(orderId, newStatus, rowIndex) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.');
    }

    if (!newStatus || !['Pending', 'Confirmed', 'Completed'].includes(newStatus)) {
      throw new Error('Invalid status. Must be Pending, Confirmed, or Completed');
    }

    try {
      const response = await fetch(
        `${this.googleAppsScriptUrl}?action=updateStatus&password=${encodeURIComponent(this.adminPassword)}&rowIndex=${rowIndex}&status=${encodeURIComponent(newStatus)}`
      );

      if (!response.ok) {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }

      const result = await response.json();

      if (result.status === 'success') {
        console.log(`✅ Order ${orderId} updated to ${newStatus}`);
        return result;
      }

      throw new Error(result.message || 'Failed to update order');
    } catch (error) {
      console.error(`❌ Error updating order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Delete order from database
   * @param {string} orderId - Order ID
   * @param {number} rowIndex - Row index in Google Sheet
   * @returns {Promise<object>} Delete result
   */
  async deleteOrder(orderId, rowIndex) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.');
    }

    try {
      const response = await fetch(
        `${this.googleAppsScriptUrl}?action=deleteOrder&password=${encodeURIComponent(this.adminPassword)}&rowIndex=${rowIndex}`
      );

      if (!response.ok) {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }

      const result = await response.json();

      if (result.status === 'success') {
        console.log(`🗑️ Order ${orderId} deleted successfully`);
        return result;
      }

      throw new Error(result.message || 'Failed to delete order');
    } catch (error) {
      console.error(`❌ Error deleting order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Get analytics/statistics
   * @returns {Promise<object>} Analytics data
   */
  async getAnalytics() {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.');
    }

    try {
      const response = await fetch(
        `${this.googleAppsScriptUrl}?action=getAnalytics&password=${encodeURIComponent(this.adminPassword)}`
      );

      if (!response.ok) {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }

      const result = await response.json();

      if (result.status === 'success') {
        console.log('📊 Analytics loaded');
        return result.analytics;
      }

      return null;
    } catch (error) {
      console.error('❌ Error loading analytics:', error);
      throw error;
    }
  }

  /**
   * Logout - clears authentication state
   */
  logout() {
    this.isAuthenticated = false;
    this.adminPassword = null;
    console.log('🚪 Admin logged out');
  }

  /**
   * Check if currently authenticated
   * @returns {boolean} Authentication status
   */
  isLoggedIn() {
    return this.isAuthenticated;
  }
}

// Export for use in HTML
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminService;
}
