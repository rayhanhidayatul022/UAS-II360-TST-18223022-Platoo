/**
 * Voucher Service
 * Handles all voucher-related API calls
 */

class VoucherService extends ApiService {
    constructor() {
        super(API_CONFIG.VOUCHER_BASE_URL);
    }

    /**
     * Get all vouchers (PUBLIC)
     */
    async getAllVouchers() {
        try {
            console.log('🔄 Fetching vouchers from:', `${this.baseUrl}${API_CONFIG.endpoints.voucher.getAll}`);
            const response = await this.get(API_CONFIG.endpoints.voucher.getAll);
            console.log('✅ Vouchers fetched successfully:', response);
            return response.data || response;
        } catch (error) {
            console.error('❌ Error fetching vouchers:', error);
            throw error;
        }
    }

    /**
     * Get voucher by code (PUBLIC)
     */
    async getVoucherByCode(code) {
        try {
            const response = await this.get(API_CONFIG.endpoints.voucher.getByCode(code));
            return response.data || response;
        } catch (error) {
            console.error(`Error fetching voucher ${code}:`, error);
            throw error;
        }
    }

    /**
     * Create voucher (ADMIN ONLY)
     */
    async createVoucher(voucherData) {
        try {
            console.log('🔧 VoucherService.createVoucher called');
            console.log('📦 Data to send:', voucherData);
            console.log('🌐 Base URL:', this.baseUrl);
            console.log('📍 Endpoint:', API_CONFIG.endpoints.voucher.create);
            console.log('� Full URL:', `${this.baseUrl}${API_CONFIG.endpoints.voucher.create}`);
            console.log('🔐 Require Auth: true');
            
            const token = localStorage.getItem('platoo_auth_token');
            console.log('🎫 Token exists:', !!token);
            if (token) {
                console.log('🎫 Token preview:', token.substring(0, 20) + '...');
            }
            
            console.log('📄 JSON Body:', JSON.stringify(voucherData, null, 2));
            console.log('📡 Making POST request...');
            
            const response = await this.post(
                API_CONFIG.endpoints.voucher.create,
                voucherData,
                true // requireAuth
            );
            
            console.log('✅ POST response received:', response);
            console.log('✅ Response type:', typeof response);
            console.log('✅ Response keys:', response ? Object.keys(response) : 'null');
            
            // Return the whole response for consistency
            if (response && typeof response === 'object') {
                return response.data || response.voucher || response;
            }
            return response;
        } catch (error) {
            console.error('❌ Error in VoucherService.createVoucher:', error);
            console.error('❌ Error details:', {
                message: error.message,
                status: error.status,
                data: error.data
            });
            throw error;
        }
    }

    /**
     * Update voucher (ADMIN ONLY)
     */
    async updateVoucher(id, voucherData) {
        try {
            console.log('🔧 VoucherService.updateVoucher called');
            console.log('📦 Voucher ID:', id);
            console.log('📦 Data to update:', voucherData);
            
            const response = await this.put(
                API_CONFIG.endpoints.voucher.update(id),
                voucherData,
                true // requireAuth
            );
            
            console.log('✅ PUT response received:', response);
            
            // Return the whole response for consistency
            if (response && typeof response === 'object') {
                return response.data || response.voucher || response;
            }
            return response;
        } catch (error) {
            console.error(`❌ Error updating voucher ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete voucher (ADMIN ONLY)
     */
    async deleteVoucher(id) {
        try {
            const response = await this.delete(
                API_CONFIG.endpoints.voucher.delete(id),
                true // requireAuth
            );
            return response;
        } catch (error) {
            console.error(`Error deleting voucher ${id}:`, error);
            throw error;
        }
    }

    /**
     * Redeem voucher (USER ONLY)
     */
    async redeemVoucher(code, orderData) {
        try {
            const response = await this.post(
                API_CONFIG.endpoints.voucher.redeem(code),
                orderData,
                true // requireAuth
            );
            return response.data || response;
        } catch (error) {
            console.error(`Error redeeming voucher ${code}:`, error);
            throw error;
        }
    }

    /**
     * Login to voucher service
     */
    async login(email, password) {
        try {
            const response = await this.post(
                API_CONFIG.endpoints.auth.login,
                { email, password }
            );
            
            // Save token if login successful
            if (response.data && response.data.session) {
                localStorage.setItem('platoo_auth_token', response.data.session.access_token);
                localStorage.setItem('platoo_user_role', response.data.user.role);
            }
            
            return response.data || response;
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    }

    /**
     * Register to voucher service
     */
    async register(email, password, full_name) {
        try {
            const response = await this.post(
                API_CONFIG.endpoints.auth.register,
                { email, password, full_name }
            );
            return response.data || response;
        } catch (error) {
            console.error('Error registering:', error);
            throw error;
        }
    }
}

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoucherService;
}
