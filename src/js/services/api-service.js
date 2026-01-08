/**
 * API Service Layer
 * Handles all HTTP requests to microservices
 */

class ApiService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    /**
     * Generic HTTP request handler
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            method: options.method || 'GET',
            headers: API_CONFIG.getHeaders(options.requireAuth),
            ...options
        };

        // Add body if exists
        if (options.body) {
            config.body = JSON.stringify(options.body);
        }

        console.log('🌐 ApiService.request');
        console.log('  - URL:', url);
        console.log('  - Method:', config.method);
        console.log('  - Headers:', config.headers);
        console.log('  - Body:', config.body);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
            
            config.signal = controller.signal;

            console.log('📡 Sending fetch request...');
            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            console.log('📥 Response received');
            console.log('  - Status:', response.status);
            console.log('  - Status Text:', response.statusText);
            console.log('  - OK:', response.ok);

            // Parse response
            let data;
            const contentType = response.headers.get('content-type');
            console.log('  - Content-Type:', contentType);
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
                console.log('  - JSON Data:', data);
            } else {
                data = await response.text();
                console.log('  - Text Data:', data);
            }

            // Handle errors
            if (!response.ok) {
                console.error('❌ Response not OK');
                throw {
                    status: response.status,
                    message: data.message || data.error || 'Request failed',
                    data: data
                };
            }

            console.log('✅ Request successful');
            return data;
        } catch (error) {
            console.error(`❌ API Request Error [${endpoint}]:`, error);
            
            if (error.name === 'AbortError') {
                throw { message: 'Request timeout', status: 408 };
            }
            
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint, requireAuth = false) {
        return this.request(endpoint, { method: 'GET', requireAuth });
    }

    /**
     * POST request
     */
    async post(endpoint, body, requireAuth = false) {
        console.log('🚀 ApiService.post called');
        console.log('  - Endpoint:', endpoint);
        console.log('  - Body:', body);
        console.log('  - Require Auth:', requireAuth);
        console.log('  - Full URL:', `${this.baseUrl}${endpoint}`);
        
        const result = await this.request(endpoint, { method: 'POST', body, requireAuth });
        console.log('✅ POST completed:', result);
        return result;
    }

    /**
     * PUT request
     */
    async put(endpoint, body, requireAuth = false) {
        return this.request(endpoint, { method: 'PUT', body, requireAuth });
    }

    /**
     * PATCH request
     */
    async patch(endpoint, body, requireAuth = false) {
        return this.request(endpoint, { method: 'PATCH', body, requireAuth });
    }

    /**
     * DELETE request
     */
    async delete(endpoint, requireAuth = false) {
        return this.request(endpoint, { method: 'DELETE', requireAuth });
    }
}

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}
