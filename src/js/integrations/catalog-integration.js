/**
 * Catalog Integration Module (Pembeli)
 * Handles food catalog display and API integration
 */

class CatalogIntegration {
    constructor() {
        this.katalogService = katalogService;
        this.foodList = [];
        this.filteredFoodList = [];
        this.currentFilters = {
            search: '',
            priceMin: 0,
            priceMax: Infinity,
            available: true
        };
    }

    /**
     * Load all foods from API
     */
    async loadFoods() {
        try {
            Utils.showLoading(true);
            
            const foods = await this.katalogService.getAllFoods();
            
            console.log('✅ Foods loaded from API:', foods);
            
            this.foodList = Array.isArray(foods) ? foods : [];
            this.filteredFoodList = [...this.foodList];
            
            // Filter only available foods for buyers
            this.applyFilters();
            
            Utils.showLoading(false);
            
            return this.filteredFoodList;
            
        } catch (error) {
            Utils.showLoading(false);
            console.error('Error loading foods:', error);
            
            const errorMsg = Utils.handleApiError(error);
            await Utils.showAlert(`Gagal memuat katalog makanan: ${errorMsg}`, 'error');
            
            return [];
        }
    }

    /**
     * Search foods by name or description
     */
    async searchFoods(query) {
        try {
            if (!query || query.trim() === '') {
                this.filteredFoodList = [...this.foodList];
                this.applyFilters();
                return this.filteredFoodList;
            }
            
            this.currentFilters.search = query.toLowerCase();
            this.applyFilters();
            
            return this.filteredFoodList;
            
        } catch (error) {
            console.error('Error searching foods:', error);
            return [];
        }
    }

    /**
     * Filter foods by price range
     */
    filterByPrice(minPrice, maxPrice) {
        this.currentFilters.priceMin = minPrice || 0;
        this.currentFilters.priceMax = maxPrice || Infinity;
        this.applyFilters();
        return this.filteredFoodList;
    }

    /**
     * Apply all filters
     */
    applyFilters() {
        this.filteredFoodList = this.foodList.filter(food => {
            // Filter by availability
            if (this.currentFilters.available && !food.is_active) {
                return false;
            }
            
            // Filter by stock
            if (food.stock <= 0) {
                return false;
            }
            
            // Filter by search query
            if (this.currentFilters.search) {
                const name = (food.name || '').toLowerCase();
                const description = (food.description || '').toLowerCase();
                const searchQuery = this.currentFilters.search;
                
                if (!name.includes(searchQuery) && !description.includes(searchQuery)) {
                    return false;
                }
            }
            
            // Filter by price range
            const price = food.price || 0;
            if (price < this.currentFilters.priceMin || price > this.currentFilters.priceMax) {
                return false;
            }
            
            return true;
        });
    }

    /**
     * Get food by ID
     */
    async getFoodById(id) {
        try {
            // Check if already in cache
            const cachedFood = this.foodList.find(f => f.id === id);
            if (cachedFood) {
                return cachedFood;
            }
            
            // Fetch from API
            const food = await this.katalogService.getFoodById(id);
            return food;
            
        } catch (error) {
            console.error('Error getting food by ID:', error);
            throw error;
        }
    }

    /**
     * Render food cards for catalog page
     */
    renderFoodCards(containerId = 'foodGrid') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container not found:', containerId);
            return;
        }
        
        container.innerHTML = '';
        
        if (this.filteredFoodList.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">
                    <p>Tidak ada makanan yang tersedia saat ini.</p>
                </div>
            `;
            return;
        }
        
        this.filteredFoodList.forEach(food => {
            const card = this.createFoodCard(food);
            container.appendChild(card);
        });
    }

    /**
     * Create food card element
     */
    createFoodCard(food) {
        const div = document.createElement('div');
        div.className = 'food-card';
        div.dataset.foodId = food.id;
        
        const imageUrl = food.image_url || food.foto || '/src/img/placeholder-food.png';
        const name = food.name || food.nama_makanan || '-';
        const description = food.description || food.deskripsi || '';
        const price = food.price || food.harga || 0;
        const stock = food.stock || food.stok || 0;
        
        const stockLabel = stock > 0 
            ? `<span class="stock-badge available">Tersedia (${stock})</span>`
            : `<span class="stock-badge unavailable">Habis</span>`;
        
        div.innerHTML = `
            <div class="food-image">
                <img src="${imageUrl}" alt="${name}" onerror="this.src='/src/img/placeholder-food.png'">
                ${stockLabel}
            </div>
            <div class="food-info">
                <h3 class="food-name">${name}</h3>
                ${description ? `<p class="food-description">${description}</p>` : ''}
                <div class="food-footer">
                    <span class="food-price">${Utils.formatCurrency(price)}</span>
                    ${stock > 0 
                        ? `<button class="btn-add-to-cart" data-food-id="${food.id}">+ Tambah</button>`
                        : `<button class="btn-add-to-cart" disabled>Habis</button>`
                    }
                </div>
            </div>
        `;
        
        return div;
    }

    /**
     * Get all foods (without filters)
     */
    getAllFoods() {
        return this.foodList;
    }

    /**
     * Get filtered foods
     */
    getFilteredFoods() {
        return this.filteredFoodList;
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.currentFilters = {
            search: '',
            priceMin: 0,
            priceMax: Infinity,
            available: true
        };
        this.filteredFoodList = [...this.foodList];
    }
}

// Create singleton instance
const catalogIntegration = new CatalogIntegration();

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CatalogIntegration, catalogIntegration };
}
