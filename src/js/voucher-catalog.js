let voucherList = [];
let voucherService;

async function fetchCatalogData() {
    try {
        // Ensure voucherService is initialized
        if (!voucherService) {
            console.error('❌ VoucherService not initialized!');
            throw new Error('VoucherService not initialized');
        }
        
        Utils.showLoading(true);
        
        // Fetch all vouchers from API
        console.log('🔄 Fetching vouchers from API...');
        console.log('🔧 VoucherService:', voucherService);
        console.log('🌐 Base URL:', voucherService.baseUrl);
        
        const response = await voucherService.getAllVouchers();
        
        console.log('📦 Raw API Response:', response);
        
        // Handle different response formats
        let vouchers = [];
        if (Array.isArray(response)) {
            vouchers = response;
        } else if (response && Array.isArray(response.data)) {
            vouchers = response.data;
        } else if (response && response.vouchers) {
            vouchers = response.vouchers;
        }
        
        console.log('✅ Parsed vouchers:', vouchers);
        
        voucherList = vouchers;
        
        Utils.showLoading(false);
        return voucherList;
        
    } catch (error) {
        console.error('❌ Error fetching vouchers:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response,
            stack: error.stack
        });
        Utils.showLoading(false);
        
        const errorMsg = Utils.handleApiError(error);
        await Utils.showAlert(`Gagal memuat data voucher: ${errorMsg}`, 'error');
        return [];
    }
}


function renderCatalogTable(catalogItems) {
    const container = document.querySelector('#voucherGrid');
    
    if (!container) {
        console.error('Voucher grid container not found!');
        return;
    }

    container.innerHTML = '';
    
    if (catalogItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <h3>Belum ada voucher</h3>
                <p>Mulai buat voucher pertama untuk menarik lebih banyak pelanggan</p>
                <button onclick="window.location.href='voucher-add.html'" class="btn-add-from-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Buat Voucher Pertama
                </button>
            </div>
        `;
        return;
    }

    catalogItems.forEach(item => {
        const card = createVoucherCard(item);
        container.appendChild(card);
    });
}


function createVoucherCard(item) {
    const card = document.createElement('div');
    card.className = 'voucher-card';
    
    // Format data dari API response
    const voucherName = item.name || item.nama_voucher || 'Voucher';
    const voucherCode = item.code || '-';
    
    // Format discount display
    let discountDisplay = '-';
    let discountIcon = '';
    if (item.discount_type === 'PERCENT') {
        discountDisplay = `${item.discount_value}%`;
        discountIcon = '<svg class="discount-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>';
    } else if (item.discount_type === 'FIXED') {
        discountDisplay = `Rp ${item.discount_value.toLocaleString('id-ID')}`;
        discountIcon = '<svg class="discount-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
    }
    
    // Format min purchase
    const minPurchase = item.min_order_amount ? `Rp ${item.min_order_amount.toLocaleString('id-ID')}` : 'Tidak ada minimum';
    
    // Format dates
    const startDate = item.start_at ? new Date(item.start_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
    const endDate = item.end_at ? new Date(item.end_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
    
    // Status check
    const isActive = item.is_active && 
                     (!item.end_at || new Date(item.end_at) > new Date()) &&
                     (item.total_redeemed < item.max_total_redemptions);
    
    const statusClass = isActive ? 'status-aktif' : 'status-nonaktif';
    const statusText = isActive ? 'Aktif' : 'Tidak Aktif';
    
    // Usage stats
    const usagePercent = item.max_total_redemptions > 0 
        ? Math.round((item.total_redeemed / item.max_total_redemptions) * 100) 
        : 0;
    
    card.innerHTML = `
        <div class="card-header">
            <div class="voucher-info">
                <h3 class="voucher-name">${voucherName}</h3>
                <div class="voucher-code">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>${voucherCode}</span>
                </div>
            </div>
            <div class="status-badge ${statusClass}">
                <span class="status-dot"></span>
                ${statusText}
            </div>
        </div>
        
        <div class="card-body">
            <div class="discount-section">
                ${discountIcon}
                <div class="discount-value">${discountDisplay}</div>
                <div class="discount-label">Potongan Harga</div>
            </div>
            
            <div class="info-grid">
                <div class="info-item">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <div>
                        <div class="info-label">Min. Transaksi</div>
                        <div class="info-value">${minPurchase}</div>
                    </div>
                </div>
                
                <div class="info-item">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                        <div class="info-label">Periode</div>
                        <div class="info-value">${startDate} - ${endDate}</div>
                    </div>
                </div>
                
                <div class="info-item">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div>
                        <div class="info-label">Penggunaan</div>
                        <div class="info-value">${item.total_redeemed}/${item.max_total_redemptions}</div>
                    </div>
                </div>
            </div>
            
            <div class="usage-bar">
                <div class="usage-progress" style="width: ${usagePercent}%"></div>
            </div>
        </div>
        
        <div class="card-actions">
            <button class="btn-action btn-edit" onclick="window.location.href='voucher-edit.html?id=${item.id}'" title="Edit Voucher">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
            </button>
            <button class="btn-action btn-delete" onclick="handleDelete('${item.id}', '${voucherName}', ${item.total_redeemed})" title="Hapus Voucher">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Hapus
            </button>
        </div>
    `;
    
    return card;
}


async function handleDelete(voucherId, voucherName, totalRedeemed) {
    // Check if voucher has been used
    if (totalRedeemed > 0) {
        await Utils.showAlert(
            `Voucher "${voucherName}" sudah pernah digunakan ${totalRedeemed} kali dan tidak bisa dihapus.`,
            'warning'
        );
        return;
    }
    
    const confirmed = await Utils.showConfirm(
        `Yakin ingin menghapus voucher "${voucherName}"?`,
        'Hapus Voucher'
    );
    
    if (!confirmed) return;
    
    try {
        Utils.showLoading(true);
        
        await voucherService.deleteVoucher(voucherId);
        
        Utils.showLoading(false);
        await Utils.showAlert('Voucher berhasil dihapus!', 'success');
        
        // Reload catalog
        await loadCatalog();
        
    } catch (error) {
        console.error('Error deleting voucher:', error);
        Utils.showLoading(false);
        
        const errorMsg = Utils.handleApiError(error);
        await Utils.showAlert(`Gagal menghapus voucher: ${errorMsg}`, 'error');
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
    console.log('✨ Voucher Catalog page loaded');
    
    // Initialize service
    try {
        console.log('🔧 Initializing VoucherService...');
        voucherService = new VoucherService();
        console.log('✅ VoucherService initialized:', voucherService);
        console.log('✅ Base URL:', voucherService.baseUrl);
    } catch (error) {
        console.error('❌ Error initializing VoucherService:', error);
        await Utils.showAlert('Gagal menginisialisasi service voucher', 'error');
        return;
    }
    
    // Load catalog after service is initialized
    await loadCatalog();
});
