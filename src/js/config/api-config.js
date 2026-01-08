/**
 * API Configuration for Platoo Application
 * Centralized configuration for all API endpoints
 */

const API_CONFIG = {
    // Microservices Base URLs
    KATALOG_BASE_URL: 'https://18223044.tesatepadang.space',
    VOUCHER_BASE_URL: 'https://18223022.tesatepadang.space',
    
    // API Endpoints
    endpoints: {
        // Katalog Makanan Endpoints - Hit langsung ke base URL
        katalog: {
            getAll: '',  // Langsung ke base URL tanpa path
            getById: (id) => `/makanan/${id}`,
            create: '',
            update: (id) => `/makanan/${id}`,
            delete: (id) => `/makanan/${id}`,
            updateStatus: (id) => `/makanan/${id}/status`,
            search: '/search'
        },
        
        // Voucher Endpoints
        voucher: {
            getAll: '/vouchers',
            getByCode: (code) => `/vouchers/${code}`,
            create: '/vouchers',
            update: (id) => `/vouchers/${id}`,
            delete: (id) => `/vouchers/${id}`,
            redeem: (code) => `/vouchers/${code}/redeem`
        },
        
        // Auth Endpoints
        auth: {
            login: '/auth/login',
            register: '/auth/register'
        }
    },
    
    // Request timeout
    timeout: 30000,
    
    // Headers
    getHeaders: (includeAuth = false) => {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (includeAuth) {
            const token = localStorage.getItem('platoo_auth_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        return headers;
    }
};

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}
