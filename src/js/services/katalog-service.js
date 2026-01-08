/**
 * Katalog Service
 * Handles all food catalog-related API calls
 */

class KatalogService extends ApiService {
    constructor() {
        super(API_CONFIG.KATALOG_BASE_URL);
    }

    /**
     * Get all foods (PUBLIC)
     * @param {Object} params - Query parameters (optional)
     * @returns {Promise<Array>} List of foods
     */
    async getAllFoods(params = {}) {
        try {
            console.log('🔧 KatalogService.getAllFoods called');
            console.log('🌐 Base URL:', this.baseUrl);
            console.log('📍 Endpoint:', API_CONFIG.endpoints.katalog.getAll);
            console.log('📍 Full URL:', `${this.baseUrl}${API_CONFIG.endpoints.katalog.getAll}`);
            
            let endpoint = API_CONFIG.endpoints.katalog.getAll;
            
            // Add query parameters if exists
            if (Object.keys(params).length > 0) {
                const queryString = new URLSearchParams(params).toString();
                endpoint += `?${queryString}`;
            }
            
            console.log('📡 Making GET request...');
            const response = await this.get(endpoint);
            console.log('✅ GET response received:', response);
            console.log('✅ Response type:', typeof response);
            
            // Handle different response formats
            if (Array.isArray(response)) {
                console.log('✅ Response is array, returning as is');
                return response;
            } else if (response && Array.isArray(response.data)) {
                console.log('✅ Response.data is array, returning response.data');
                return response.data;
            } else if (response && response.foods) {
                console.log('✅ Response.foods exists, returning response.foods');
                return response.foods;
            }
            
            console.log('⚠️ Unexpected response format, returning response.data or response');
            return response.data || response;
        } catch (error) {
            console.error('❌ Error fetching foods:', error);
            throw error;
        }
    }

    /**
     * Get food by ID (PUBLIC)
     * @param {string} id - Food ID
     * @returns {Promise<Object>} Food details
     */
    async getFoodById(id) {
        try {
            console.log('🔧 KatalogService.getFoodById called for ID:', id);
            const response = await this.get(API_CONFIG.endpoints.katalog.getById(id));
            console.log('✅ Food by ID response:', response);
            return response.data || response;
        } catch (error) {
            console.error(`Error fetching food ${id}:`, error);
            throw error;
        }
    }

    /**
     * Search foods (PUBLIC)
     * @param {string} query - Search query
     * @returns {Promise<Array>} List of matching foods
     */
    async searchFoods(query) {
        try {
            const endpoint = `${API_CONFIG.endpoints.katalog.search}?q=${encodeURIComponent(query)}`;
            const response = await this.get(endpoint);
            return response.data || response;
        } catch (error) {
            console.error('Error searching foods:', error);
            throw error;
        }
    }

    /**
     * Create food (ADMIN ONLY)
     * @param {Object} foodData - Food data
     * @returns {Promise<Object>} Created food
     */
    async createFood(foodData) {
        try {
            console.log('🔧 KatalogService.createFood called');
            console.log('📦 Data to send:', foodData);
            console.log('🌐 Base URL:', this.baseUrl);
            console.log('📍 Endpoint:', API_CONFIG.endpoints.katalog.create);
            console.log('📍 Full URL:', `${this.baseUrl}${API_CONFIG.endpoints.katalog.create}`);
            
            const response = await this.post(
                API_CONFIG.endpoints.katalog.create,
                foodData,
                true // requireAuth
            );
            
            console.log('✅ Create response:', response);
            return response.data || response;
        } catch (error) {
            console.error('Error creating food:', error);
            throw error;
        }
    }

    /**
     * Update food (ADMIN ONLY) - Try PATCH method instead of PUT
     * @param {string} id - Food ID
     * @param {FormData|Object} foodData - Updated food data
     * @returns {Promise<Object>} Updated food
     */
    async updateFood(id, foodData) {
        try {
            console.log('🔧 KatalogService.updateFood called');
            console.log('📦 Food ID:', id);
            console.log('📦 Data type:', foodData instanceof FormData ? 'FormData' : 'JSON');
            console.log('📍 Full URL:', `${this.baseUrl}${API_CONFIG.endpoints.katalog.update(id)}`);
            
            // Try PATCH method instead of PUT (JSON only for now)
            console.log('🔄 Trying PATCH method...');
            const response = await this.patch(
                API_CONFIG.endpoints.katalog.update(id),
                foodData,
                true // requireAuth
            );
            
            console.log('✅ Update response:', response);
            return response.data || response;
        } catch (error) {
            console.error(`Error updating food ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete food (ADMIN ONLY)
     * @param {string} id - Food ID
     * @returns {Promise<Object>} Delete response
     */
    async deleteFood(id) {
        try {
            const response = await this.delete(
                API_CONFIG.endpoints.katalog.delete(id),
                true // requireAuth
            );
            return response;
        } catch (error) {
            console.error(`Error deleting food ${id}:`, error);
            throw error;
        }
    }

    /**
     * Update food status (ADMIN ONLY)
     * @param {string} id - Food ID
     * @param {boolean} isAktif - Active status
     * @returns {Promise<Object>} Update response
     */
    async updateStatus(id, isAktif) {
        try {
            console.log('🔧 KatalogService.updateStatus called');
            console.log('📦 Food ID:', id);
            console.log('📦 is_aktif:', isAktif);
            
            const response = await this.post(
                API_CONFIG.endpoints.katalog.updateStatus(id),
                { is_aktif: isAktif },
                true // requireAuth
            );
            
            console.log('✅ Status update response:', response);
            return response.data || response;
        } catch (error) {
            console.error(`Error updating status for food ${id}:`, error);
            throw error;
        }
    }
}

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KatalogService;
}
