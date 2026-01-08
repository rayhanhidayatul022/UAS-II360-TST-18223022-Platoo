/**
 * Utility Functions for Platoo Application
 */

const Utils = {
    /**
     * Show custom modal
     */
    showModal: function(title, message, type = 'success', showCancel = false) {
        return new Promise((resolve) => {
            const modal = document.getElementById('customModal');
            if (!modal) {
                alert(message);
                resolve(true);
                return;
            }
            
            const modalTitle = document.getElementById('modalTitle');
            const modalMessage = document.getElementById('modalMessage');
            const modalIcon = document.getElementById('modalIcon');
            const modalConfirm = document.getElementById('modalConfirm');
            const modalCancel = document.getElementById('modalCancel');
            
            if (modalTitle) modalTitle.textContent = title;
            if (modalMessage) modalMessage.textContent = message;
            if (modalIcon) modalIcon.className = 'modal-icon ' + type;
            
            if (modalCancel) {
                modalCancel.style.display = showCancel ? 'block' : 'none';
            }
            
            modal.classList.add('show');
            
            if (modalConfirm) {
                modalConfirm.onclick = () => {
                    modal.classList.remove('show');
                    resolve(true);
                };
            }
            
            if (modalCancel) {
                modalCancel.onclick = () => {
                    modal.classList.remove('show');
                    resolve(false);
                };
            }
            
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                    resolve(false);
                }
            };
        });
    },

    /**
     * Show alert message
     */
    showAlert: function(message, type = 'success') {
        const titles = {
            success: 'Berhasil!',
            error: 'Gagal!',
            warning: 'Peringatan!',
            question: 'Konfirmasi'
        };
        return this.showModal(titles[type] || 'Informasi', message, type, false);
    },

    /**
     * Show confirmation dialog
     */
    showConfirm: function(message, title = 'Konfirmasi') {
        return this.showModal(title, message, 'question', true);
    },

    /**
     * Get current user from localStorage
     */
    getCurrentUser: function() {
        // Use authService if available, otherwise fallback to direct localStorage access
        if (typeof authService !== 'undefined') {
            return authService.getCurrentUser();
        }
        
        try {
            const userData = localStorage.getItem('platoo_user');
            if (!userData) return null;
            return JSON.parse(userData);
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated: function() {
        // Use authService if available
        if (typeof authService !== 'undefined') {
            return authService.isAuthenticated();
        }
        
        const user = this.getCurrentUser();
        return user !== null;
    },

    /**
     * Redirect to login if not authenticated
     */
    requireAuth: function(redirectUrl = 'login.html') {
        if (!this.isAuthenticated()) {
            this.showAlert('Silakan login terlebih dahulu', 'warning')
                .then(() => {
                    window.location.href = redirectUrl;
                });
            return false;
        }
        return true;
    },

    /**
     * Format currency to IDR
     */
    formatCurrency: function(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },

    /**
     * Format date to Indonesian locale
     */
    formatDate: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    },

    /**
     * Format datetime to Indonesian locale
     */
    formatDateTime: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Debounce function
     */
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Validate email format
     */
    isValidEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Generate unique ID
     */
    generateId: function() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Handle API errors
     */
    handleApiError: function(error) {
        console.error('API Error:', error);
        
        let message = 'Terjadi kesalahan';
        
        if (error.status === 401) {
            message = 'Sesi Anda telah berakhir. Silakan login kembali.';
            // Clear auth data
            localStorage.removeItem('platoo_auth_token');
            localStorage.removeItem('platoo_user_role');
        } else if (error.status === 403) {
            message = 'Anda tidak memiliki akses untuk melakukan operasi ini.';
        } else if (error.status === 404) {
            message = 'Data tidak ditemukan.';
        } else if (error.status === 408) {
            message = 'Koneksi timeout. Periksa koneksi internet Anda.';
        } else if (error.message) {
            message = error.message;
        }
        
        return message;
    },

    /**
     * Show loading overlay
     */
    showLoading: function(show = true) {
        let overlay = document.getElementById('loadingOverlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Loading...</p>
                </div>
            `;
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            `;
            document.body.appendChild(overlay);
        }
        
        overlay.style.display = show ? 'flex' : 'none';
    }
};

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
