/**
 * Checkout Integration Module
 * Handles voucher redemption and API integration for checkout process
 */

class CheckoutIntegration {
    constructor() {
        this.voucherService = voucherService;
        this.currentVoucher = null;
    }

    /**
     * Validate and apply voucher
     * @param {string} voucherCode - Voucher code to apply
     * @param {number} orderAmount - Total order amount
     * @returns {Promise<Object>} Voucher details and discount calculation
     */
    async applyVoucher(voucherCode, orderAmount) {
        try {
            Utils.showLoading(true);
            
            // Get voucher details from API
            const voucher = await this.voucherService.getVoucherByCode(voucherCode);
            
            console.log('✅ Voucher fetched:', voucher);
            
            // Validate voucher availability
            if (!voucher.is_available) {
                throw {
                    message: this.getVoucherUnavailableReason(voucher)
                };
            }
            
            // Check minimum order amount
            if (orderAmount < voucher.min_order_amount) {
                throw {
                    message: `Minimum pembelian untuk voucher ini adalah ${Utils.formatCurrency(voucher.min_order_amount)}`
                };
            }
            
            // Calculate discount
            const discountAmount = this.calculateDiscount(voucher, orderAmount);
            
            this.currentVoucher = {
                ...voucher,
                discount_amount: discountAmount,
                final_amount: orderAmount - discountAmount
            };
            
            Utils.showLoading(false);
            
            return this.currentVoucher;
            
        } catch (error) {
            Utils.showLoading(false);
            console.error('Error applying voucher:', error);
            throw error;
        }
    }

    /**
     * Calculate discount based on voucher type
     */
    calculateDiscount(voucher, orderAmount) {
        let discountAmount = 0;
        
        if (voucher.discount_type === 'PERCENT') {
            discountAmount = Math.floor((orderAmount * voucher.discount_value) / 100);
            
            // Apply max discount if exists
            if (voucher.max_discount_amount && discountAmount > voucher.max_discount_amount) {
                discountAmount = voucher.max_discount_amount;
            }
        } else if (voucher.discount_type === 'FIXED') {
            discountAmount = voucher.discount_value;
            
            // Discount tidak boleh lebih besar dari order amount
            if (discountAmount > orderAmount) {
                discountAmount = orderAmount;
            }
        }
        
        return discountAmount;
    }

    /**
     * Get reason why voucher is unavailable
     */
    getVoucherUnavailableReason(voucher) {
        if (!voucher.is_active) {
            return 'Voucher sudah tidak aktif';
        }
        
        if (voucher.is_not_started) {
            return `Voucher belum bisa digunakan. Berlaku mulai ${Utils.formatDate(voucher.start_at)}`;
        }
        
        if (voucher.is_expired) {
            return `Voucher sudah expired pada ${Utils.formatDate(voucher.end_at)}`;
        }
        
        if (voucher.remaining_redemptions <= 0) {
            return 'Kuota voucher sudah habis';
        }
        
        return 'Voucher tidak dapat digunakan';
    }

    /**
     * Redeem voucher after successful payment
     * @param {string} voucherCode - Voucher code
     * @param {number} orderAmount - Order amount before discount
     * @param {string} orderId - Order ID from system
     */
    async redeemVoucher(voucherCode, orderAmount, orderId) {
        try {
            Utils.showLoading(true);
            
            const redeemData = {
                order_amount: orderAmount,
                order_id: orderId
            };
            
            const result = await this.voucherService.redeemVoucher(voucherCode, redeemData);
            
            console.log('✅ Voucher redeemed successfully:', result);
            
            Utils.showLoading(false);
            
            return result;
            
        } catch (error) {
            Utils.showLoading(false);
            console.error('Error redeeming voucher:', error);
            
            // Don't throw error here, just log it
            // Payment already successful, voucher redemption failure shouldn't block the process
            const errorMsg = Utils.handleApiError(error);
            console.warn(`Voucher redemption failed: ${errorMsg}`);
            
            return null;
        }
    }

    /**
     * Remove currently applied voucher
     */
    removeVoucher() {
        this.currentVoucher = null;
    }

    /**
     * Get current applied voucher
     */
    getCurrentVoucher() {
        return this.currentVoucher;
    }

    /**
     * Check if user needs to login to voucher service
     */
    async ensureVoucherAuth() {
        const token = localStorage.getItem('platoo_auth_token');
        
        if (!token) {
            // Need to login to voucher service
            const user = Utils.getCurrentUser();
            
            if (!user || !user.email) {
                throw {
                    message: 'Email tidak ditemukan. Tidak dapat menggunakan voucher.'
                };
            }
            
            // Try to auto-login to voucher service
            // Note: This assumes password is same or stored somewhere
            // In production, you should handle this differently
            throw {
                message: 'Anda perlu login ke sistem voucher terlebih dahulu.'
            };
        }
    }
}

// Create singleton instance
const checkoutIntegration = new CheckoutIntegration();

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CheckoutIntegration, checkoutIntegration };
}
