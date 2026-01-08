/**
 * Auth Service
 * Handles authentication using Voucher Microservice
 */

class AuthService extends ApiService {
    constructor() {
        super(API_CONFIG.VOUCHER_BASE_URL);
    }

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} User data and token
     */
    async login(email, password) {
        try {
            const response = await this.post(
                API_CONFIG.endpoints.auth.login,
                { email, password }
            );
            
            console.log('✅ Login response:', response);
            
            // Save authentication data to localStorage
            if (response.success && response.data) {
                const { user, session } = response.data;
                
                // Save token
                localStorage.setItem('platoo_auth_token', session.access_token);
                localStorage.setItem('platoo_refresh_token', session.refresh_token);
                localStorage.setItem('platoo_token_expires_at', session.expires_at);
                
                // Save user data
                const userData = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    full_name: user.full_name || 'User'
                };
                localStorage.setItem('platoo_user', JSON.stringify(userData));
                
                return {
                    success: true,
                    user: user,
                    session: session
                };
            }
            
            return { success: false, message: 'Login failed' };
            
        } catch (error) {
            console.error('❌ Login error:', error);
            return { 
                success: false, 
                message: error.message || error.data?.message || 'Login gagal'
            };
        }
    }

    /**
     * Register new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} full_name - User full name
     * @param {string} role - User role (USER or ADMIN), default USER
     * @returns {Promise<Object>} Registration result
     */
    async register(email, password, full_name, role = 'USER') {
        try {
            const response = await this.post(
                API_CONFIG.endpoints.auth.register,
                { email, password, full_name, role }
            );
            
            console.log('✅ Register response:', response);
            
            return response;
            
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    }

    /**
     * Logout user
     */
    logout() {
        // Clear all auth data
        localStorage.removeItem('platoo_auth_token');
        localStorage.removeItem('platoo_refresh_token');
        localStorage.removeItem('platoo_token_expires_at');
        localStorage.removeItem('platoo_user');
        localStorage.removeItem('platoo_user_role');
        
        console.log('✅ User logged out');
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        const token = localStorage.getItem('platoo_auth_token');
        const expiresAt = localStorage.getItem('platoo_token_expires_at');
        
        if (!token) {
            return false;
        }
        
        // Check if token is expired
        if (expiresAt) {
            const now = Math.floor(Date.now() / 1000);
            if (now > expiresAt) {
                this.logout();
                return false;
            }
        }
        
        return true;
    }

    /**
     * Get current user from localStorage
     * @returns {Object|null}
     */
    getCurrentUser() {
        try {
            const userData = localStorage.getItem('platoo_user');
            if (!userData) {
                return null;
            }
            return JSON.parse(userData);
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    /**
     * Get current user profile from API
     * Note: Voucher API doesn't have dedicated profile endpoint,
     * so we use the stored user data from login
     * @returns {Promise<Object>}
     */
    async getProfile() {
        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }
        return user;
    }

    /**
     * Check if current user is admin
     * @returns {boolean}
     */
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'ADMIN';
    }

    /**
     * Check if current user is regular user
     * @returns {boolean}
     */
    isUser() {
        const user = this.getCurrentUser();
        return user && user.role === 'USER';
    }

    /**
     * Require authentication - redirect to login if not authenticated
     * @param {string} redirectUrl - URL to redirect if not authenticated
     * @returns {boolean}
     */
    requireAuth(redirectUrl = 'login.html') {
        if (!this.isAuthenticated()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    /**
     * Require admin role - redirect if not admin
     * @param {string} redirectUrl - URL to redirect if not admin
     * @returns {boolean}
     */
    requireAdmin(redirectUrl = 'dashboard-pembeli.html') {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        
        if (!this.isAdmin()) {
            window.location.href = redirectUrl;
            return false;
        }
        
        return true;
    }
}

// Create singleton instance
const authService = new AuthService();

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthService, authService };
}
