
let foodList = [];
let katalogService;

async function fetchCatalogData() {
    try {
        if (!katalogService) {
            console.error('❌ KatalogService not initialized!');
            throw new Error('KatalogService not initialized');
        }
        
        Utils.showLoading(true);
        
        // Fetch all foods from API
        console.log('🔄 Fetching foods from API...');
        console.log('🔧 KatalogService:', katalogService);
        console.log('🌐 Base URL:', katalogService.baseUrl);
        
        const foods = await katalogService.getAllFoods();
        
        console.log('✅ Foods fetched from API:', foods);
        
        // Filter by restaurant ID = 1
        let filteredFoods = [];
        if (Array.isArray(foods)) {
            filteredFoods = foods.filter(food => food.resto_id === 1 || food.resto_id === '1');
            console.log('✅ Filtered foods (resto_id = 1):', filteredFoods);
        }
        
        foodList = filteredFoods;
        
        Utils.showLoading(false);
        return foodList;
        
    } catch (error) {
        console.error('Error fetching foods:', error);
        Utils.showLoading(false);
        
        const errorMsg = Utils.handleApiError(error);
        await Utils.showAlert(`Gagal memuat data katalog: ${errorMsg}`, 'error');
        return [];
    }
}


function renderCatalogTable(catalogItems) {
    const foodGrid = document.getElementById('foodGrid');
    
    if (!foodGrid) {
        console.error('❌ Food grid element not found!');
        return;
    }

    foodGrid.innerHTML = '';
    
    if (catalogItems.length === 0) {
        foodGrid.innerHTML = `
            <div class="empty-state">
                <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3>Belum Ada Makanan</h3>
                <p>Katalog makanan Anda masih kosong.<br>Mulai tambahkan makanan untuk resto ID 1.</p>
                <button class="btn-add-from-empty" onclick="window.location.href='food-add.html'">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Makanan Baru
                </button>
            </div>
        `;
        return;
    }

    catalogItems.forEach(item => {
        const card = createFoodCard(item);
        foodGrid.appendChild(card);
    });
}


function createFoodCard(item) {
    const div = document.createElement('div');
    div.className = 'food-card';
    
    // Format data from API response
    const foodName = item.name || item.nama_makanan || '-';
    const price = item.price || item.harga || 0;
    const stock = item.stock || item.stok || 0;
    const imageUrl = item.image_url || item.foto || '/src/img/placeholder-food.png';
    const description = item.description || item.deskripsi || '';
    
    // Status handling - if stock is 0 or is_active is false, show "Habis"
    // Determine status: check is_aktif first, then stock
    const isActive = item.is_aktif === true || item.is_aktif === undefined; // Default true if not set
    const hasStock = stock > 0;
    
    let statusClass, statusText;
    if (!isActive) {
        statusClass = 'status-nonaktif';
        statusText = 'Tidak Aktif';
    } else if (!hasStock) {
        statusClass = 'status-habis';
        statusText = 'Habis';
    } else {
        statusClass = 'status-tersedia';
        statusText = 'Tersedia';
    }
    
    div.innerHTML = `
        <img src="${imageUrl}" alt="${foodName}" class="food-image" 
             onerror="this.src='/src/img/placeholder-food.png'">
        
        <div class="card-header">
            <div class="food-info">
                <div class="food-name">${foodName}</div>
            </div>
            <span class="status-badge ${statusClass}">
                <span class="status-dot"></span>
                ${statusText}
            </span>
        </div>
        
        <div class="card-body">
            <div class="info-grid">
                <div class="info-item">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <div class="info-label">Harga per Porsi</div>
                        <div class="info-value">${Utils.formatCurrency(price)}</div>
                    </div>
                </div>
                
                <div class="info-item">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <div>
                        <div class="info-label">Stok Tersedia</div>
                        <div class="info-value">${stock} Porsi</div>
                    </div>
                </div>
                
                ${description ? `
                <div class="info-item">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                        <div class="info-label">Deskripsi</div>
                        <div class="info-value">${description.substring(0, 80)}${description.length > 80 ? '...' : ''}</div>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="card-actions">
            <a href="food-edit.html?id=${item.catalog_id || item.id}" class="btn-action btn-edit">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
            </a>
        </div>
    `;
    
    return div;
}



async function handleDelete(foodId, foodName) {
    const confirmed = await Utils.showConfirm(
        `Yakin ingin menghapus "${foodName}"? Tindakan ini tidak dapat dibatalkan.`,
        'Hapus Makanan'
    );
    
    if (!confirmed) return;
    
    try {
        Utils.showLoading(true);
        
        // Delete food via API
        await katalogService.deleteFood(foodId);
        
        Utils.showLoading(false);
        
        await Utils.showAlert('Makanan berhasil dihapus!', 'success');
        
        // Reload catalog
        await loadCatalog();
        
    } catch (error) {
        console.error('Error deleting food:', error);
        Utils.showLoading(false);
        
        const errorMsg = Utils.handleApiError(error);
        await Utils.showAlert(`Gagal menghapus makanan: ${errorMsg}`, 'error');
    }
}

async function handleToggleStatus(foodId, foodName, currentStatus) {
    const newStatus = !currentStatus;
    const action = newStatus ? 'mengaktifkan' : 'menonaktifkan';
    
    const confirmed = await Utils.showConfirm(
        `Yakin ingin ${action} "${foodName}"?`,
        'Ubah Status Makanan'
    );
    
    if (!confirmed) return;
    
    try {
        Utils.showLoading(true);
        
        // Update food status via API
        await katalogService.updateFood(foodId, {
            is_active: newStatus
        });
        
        Utils.showLoading(false);
        
        const statusText = newStatus ? 'diaktifkan' : 'dinonaktifkan';
        await Utils.showAlert(`Makanan berhasil ${statusText}!`, 'success');
        
        // Reload catalog
        await loadCatalog();
        
    } catch (error) {
        console.error('Error toggling status:', error);
        Utils.showLoading(false);
        
        const errorMsg = Utils.handleApiError(error);
        await Utils.showAlert(`Gagal mengubah status: ${errorMsg}`, 'error');
    }
}

async function loadCatalog() {
    try {
        // Check if user is authenticated
        if (!Utils.requireAuth()) {
            return;
        }
        
        const catalogItems = await fetchCatalogData();
        renderCatalogTable(catalogItems);
        
    } catch (error) {
        console.error('Error loading catalog:', error);
        await Utils.showAlert('Terjadi kesalahan saat memuat katalog', 'error');
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    console.log('✨ Food Catalog page loaded');
    
    // Initialize service
    try {
        console.log('🔧 Initializing KatalogService...');
        katalogService = new KatalogService();
        console.log('✅ KatalogService initialized:', katalogService);
        console.log('✅ Base URL:', katalogService.baseUrl);
    } catch (error) {
        console.error('❌ Error initializing KatalogService:', error);
        await Utils.showAlert('Gagal menginisialisasi service katalog', 'error');
        return;
    }
    
    // Load catalog after service is initialized
    await loadCatalog();
});
