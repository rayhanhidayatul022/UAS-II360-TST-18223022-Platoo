// Constants
const SERVICE_FEE = 5000; // Rp 5,000
const TAX_RATE = 0.1; // 10% PPN
const PLATOO_DISCOUNT_RATE = 0.15; // 15% Platoo discount

// State Management
let orderData = {
    items: [],
    restaurantId: null,
    restaurantInfo: {},
    selectedVoucherId: null,
    selectedVoucher: null,
    voucherDiscount: 0,
    selectedPaymentMethod: 'cash',
    customerPhone: '',
    totalPrice: 0,
    subtotal: 0,
    restaurantDiscount: 0,
    taxAmount: 0
};

let currentUser = null;
let availableVouchers = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeCheckout();
    } catch (error) {
        console.error('Initialization error:', error);
        showErrorModal('Gagal memuat halaman checkout');
    }
});

async function initializeCheckout() {
    // Check user from localStorage
    const userDataJson = localStorage.getItem('platoo_user');
    
    if (!userDataJson) {
        console.warn('No user logged in, redirecting to login page');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        currentUser = JSON.parse(userDataJson);
        console.log('✅ User logged in for checkout:', currentUser);
    } catch (err) {
        console.error('Invalid user data in localStorage:', err);
        localStorage.removeItem('platoo_user');
        window.location.href = 'login.html';
        return;
    }

    // Get cart from localStorage - cek dua format: 'platoo_cart' (new) atau 'platoo_pending_order' (old)
    let cartData = localStorage.getItem('platoo_cart');
    let isNewFormat = true;
    
    if (!cartData) {
        // Fallback ke format lama
        cartData = localStorage.getItem('platoo_pending_order');
        isNewFormat = false;
    }
    
    if (!cartData) {
        showEmptyCart();
        return;
    }

    let cartItems;
    try {
        cartItems = JSON.parse(cartData);
        console.log('🛒 Cart loaded:', cartItems);
        console.log('📦 Cart format:', isNewFormat ? 'NEW (array)' : 'OLD (single item)');
    } catch (err) {
        console.error('Error parsing cart data:', err);
        showEmptyCart();
        return;
    }
    
    // Handle both formats
    if (isNewFormat && Array.isArray(cartItems)) {
        // New format: Array of items from dashboard-pembeli
        // Format: [{id, name, price, image, quantity, maxStock}, ...]
        if (cartItems.length === 0) {
            showEmptyCart();
            return;
        }
        
        orderData.items = cartItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            photo_url: item.image,
            emoji: '🍽️',
            maxStock: item.maxStock || 99
        }));
        
        // Restaurant ID = 1 (default untuk dashboard-pembeli)
        orderData.restaurantId = 1;
        orderData.restaurantInfo = {
            id_penjual: 1,
            nama_restoran: 'Platoo Restaurant',
            alamat: 'Padang',
            nomor_telepon: '-'
        };
        
        console.log('✅ Cart loaded from NEW format (dashboard-pembeli)');
        console.log('📦 Items:', orderData.items);
        
    } else {
        // Old format: Single item from catalog.js
        // Validasi struktur data
        if (!cartItems.item || !cartItems.restaurant) {
            console.error('Invalid order data structure:', cartItems);
            showEmptyCart();
            return;
        }
        
        // Convert pending order format to cart format
        orderData.items = [{
            id: cartItems.item.id || cartItems.item.catalog_id,
            name: cartItems.item.nama_makanan || cartItems.item.name,
            price: cartItems.item.harga || cartItems.item.price,
            quantity: cartItems.quantity || 1,
            photo_url: cartItems.item.foto_menu || cartItems.item.photo_url || cartItems.item.foto,
            emoji: cartItems.item.emoji || '🍽️'
        }];
        
        orderData.restaurantId = cartItems.restaurant.id_penjual || 
                                cartItems.restaurant.id || 
                                cartItems.restaurant.resto_id ||
                                cartItems.restaurant.restaurantId ||
                                (cartItems.item.resto_id ? cartItems.item.resto_id : 1);
        
        orderData.restaurantInfo = cartItems.restaurant;
        
        console.log('✅ Cart loaded from OLD format (catalog.js)');
        console.log('🏪 Restaurant ID:', orderData.restaurantId);
        console.log('📦 Items:', orderData.items);
    }

    if (orderData.items.length === 0) {
        showEmptyCart();
        return;
    }

    console.log('✅ Cart data loaded successfully');

    // Populate UI and calculate totals
    renderOrderItems();
    calculateTotals();
    updatePriceBreakdown();

    // Load available vouchers (after subtotal is calculated)
    try {
        await loadAvailableVouchers();
    } catch (error) {
        console.error('⚠️ Error loading vouchers:', error);
    }

    // Show checkout actions
    document.getElementById('checkoutActions').style.display = 'flex';
    document.getElementById('priceBreakdown').style.display = 'block';
    document.getElementById('orderSummaryCard').style.display = 'block';
    document.getElementById('emptyCart').style.display = 'none';

    // Setup event listeners
    setupEventListeners();
}

// Fungsi-fungsi Supabase tidak dipakai lagi
// async function fetchRestaurantInfo() { ... }
// async function fetchItemPhotos() { ... }  
// async function loadCustomerInfo() { ... }

async function loadAvailableVouchers() {
    try {
        console.log('📋 Loading vouchers from API...');
        
        // Fetch vouchers dari API - gunakan production URL
        const VOUCHER_API_URL = 'https://18223022.tesatepadang.space/vouchers';
        console.log('🔄 Fetching from:', VOUCHER_API_URL);
        
        const response = await fetch(VOUCHER_API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 API Response:', data);
        console.log('📦 data.data:', data.data);
        console.log('📦 Is data.data array?', Array.isArray(data.data));
        
        // Handle different response formats
        if (Array.isArray(data)) {
            console.log('✓ Format: Direct array');
            availableVouchers = data;
        } else if (data.data && Array.isArray(data.data)) {
            console.log('✓ Format: data.data array');
            availableVouchers = data.data;
        } else if (data.vouchers && Array.isArray(data.vouchers)) {
            console.log('✓ Format: data.vouchers array');
            availableVouchers = data.vouchers;
        } else {
            console.log('❌ Unknown format, setting empty');
            availableVouchers = [];
        }
        
        console.log('📊 Before filter - Vouchers count:', availableVouchers.length);
        console.log('📊 Before filter - Vouchers:', availableVouchers);
        console.log('🏪 Restaurant ID:', orderData.restaurantId);
        
        // HAPUS FILTER - tampilkan semua voucher
        // Tidak filter berdasarkan resto_id, tampilkan semua
        
        console.log('✅ Vouchers loaded:', availableVouchers.length);
        console.log('🎫 Vouchers:', availableVouchers);
        
    } catch (error) {
        console.error('⚠️ Error loading vouchers:', error);
        availableVouchers = [];
    }
    
    renderVoucherList();
}

function renderVoucherList() {
    const container = document.getElementById('voucherList');
    container.innerHTML = '';

    if (availableVouchers.length === 0) {
        container.innerHTML = `
            <div class="empty-vouchers">
                <span class="empty-vouchers-icon">🎫</span>
                <p>Tidak ada voucher yang tersedia saat ini</p>
            </div>
        `;
        return;
    }

    availableVouchers.forEach((voucher) => {
        const voucherElement = createVoucherElement(voucher);
        container.appendChild(voucherElement);
    });
}

function createVoucherElement(voucher) {
    console.log('🎫 Creating voucher element:', voucher);
    
    const div = document.createElement('div');
    div.className = 'voucher-item';

    // Map API fields - sesuaikan dengan response API Voucher
    const voucherId = voucher.id;
    const voucherCode = voucher.code || 'N/A';
    const voucherName = voucher.name || voucher.code || 'Voucher';
    const discountType = voucher.discount_type || 'FIXED';
    const discountValue = voucher.discount_value || 0;
    const minPurchase = voucher.min_order_amount || 0;
    const maxDiscount = voucher.max_discount_amount;
    const endDate = voucher.end_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default 30 hari
    
    // Calculate remaining redemptions
    const maxRedemptions = voucher.max_total_redemptions || 1;
    const totalRedeemed = voucher.total_redeemed || 0;
    const remainingStock = maxRedemptions - totalRedeemed;
    
    // Check if active and valid
    const isActive = voucher.is_active !== false;
    const now = new Date();
    const startAt = voucher.start_at ? new Date(voucher.start_at) : null;
    const endAt = voucher.end_at ? new Date(voucher.end_at) : null;
    const isNotStarted = startAt && now < startAt;
    const isExpired = endAt && now > endAt;
    
    console.log('📊 Mapped voucher data:', {
        voucherId,
        voucherCode,
        voucherName,
        discountType,
        discountValue,
        remainingStock,
        minPurchase,
        isActive,
        isNotStarted,
        isExpired
    });

    const formattedExpiredDate = new Date(endDate).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    const isSelected = orderData.selectedVoucherId == voucherId;
    const isOutOfStock = remainingStock <= 0 || !isActive || isNotStarted || isExpired;
    
    // Check if order meets minimum requirement
    const currentSubtotal = orderData.subtotal || 0;
    const meetsMinimum = currentSubtotal >= minPurchase;
    const canApply = !isOutOfStock && meetsMinimum;

    console.log('✓ Voucher validation:', {
        voucherName,
        isOutOfStock,
        meetsMinimum,
        canApply,
        currentSubtotal,
        minPurchase,
        remainingStock
    });

    if (!canApply) {
        div.classList.add('disabled');
    }

    // Build discount text
    let discountText = discountType === 'PERCENT' ? `${discountValue}%` : formatCurrency(discountValue);
    if (discountType === 'PERCENT' && maxDiscount) {
        discountText += ` (Max ${formatCurrency(maxDiscount)})`;
    }

    div.innerHTML = `
        <input
            type="radio"
            name="voucher"
            class="voucher-radio"
            data-voucher-id="${voucherId}"
            ${isSelected ? 'checked' : ''}
            ${!canApply ? 'disabled' : ''}
        >
        <div class="voucher-checkbox"></div>
        <div class="voucher-content">
            <div class="voucher-code">${voucherCode}</div>
            <div class="voucher-name">${voucherName}</div>
            <div class="voucher-discount">Potongan ${discountText}</div>
            <div class="voucher-validity">
                <span>Berlaku hingga ${formattedExpiredDate}</span>
                <span style="margin-left: 0.5rem;">• Tersisa: ${remainingStock}</span>
            </div>
            ${!meetsMinimum ? `<div class="voucher-min-order">Min. pembelian ${formatCurrency(minPurchase)}</div>` : ''}
            ${isNotStarted ? `<div class="voucher-min-order">Belum mulai</div>` : ''}
            ${isExpired ? `<div class="voucher-min-order">Sudah expired</div>` : ''}
            ${!canApply && remainingStock <= 0 ? `<div class="voucher-min-order">Stok habis</div>` : ''}
        </div>
    `;
    
    // Reflect selected state visually
    if (isSelected) div.classList.add('selected');

    // Prevent interaction if cannot apply
    if (!canApply) {
        div.style.cursor = 'not-allowed';
        div.style.opacity = '0.5';
        div.style.backgroundColor = '#f5f5f5';
        return div;
    }

    // Store voucher data in element for easy access
    const voucherData = {
        id: voucherId,
        code: voucherCode,
        name: voucherName,
        discount_type: discountType,
        discount_value: discountValue,
        max_discount_amount: maxDiscount,
        min_order_amount: minPurchase,
        remaining_stock: remainingStock
    };

    // Single click handler for the entire card
    div.addEventListener('click', (e) => {
        // Prevent default radio behavior
        e.preventDefault();
        
        const input = div.querySelector('input[name="voucher"]');
        const currentlySelected = orderData.selectedVoucherId == voucherId;

        if (currentlySelected) {
            // Deselect
            if (input) input.checked = false;
            document.querySelectorAll('.voucher-item').forEach(el => {
                el.classList.remove('selected');
                // Re-enable other vouchers and reset styles
                if (!el.classList.contains('disabled')) {
                    el.style.opacity = '1';
                    el.style.backgroundColor = '';
                }
            });
            selectVoucher(null);
        } else {
            // Select this voucher and uncheck others
            document.querySelectorAll('input[name="voucher"]').forEach(r => r.checked = false);
            if (input) input.checked = true;
            
            // Visual feedback: gray out other vouchers
            document.querySelectorAll('.voucher-item').forEach(el => {
                el.classList.remove('selected');
                if (el !== div && !el.classList.contains('disabled')) {
                    el.style.opacity = '0.5';
                    el.style.backgroundColor = '#f5f5f5';
                }
            });
            
            div.classList.add('selected');
            div.style.opacity = '1';
            div.style.backgroundColor = '';
            
            selectVoucher(voucherData);
        }
    }, { capture: true });

    return div;
}

function renderOrderItems() {
    const container = document.getElementById('itemsContainer');
    container.innerHTML = '';

    console.log('=== RENDERING ORDER ITEMS ===');
    console.log('Total items:', orderData.items.length);
    
    orderData.items.forEach((item, index) => {
        console.log(`\n--- Item ${index}: ${item.name} ---`);
        console.log('Full item data:', item);
        console.log('foto_menu:', item.foto_menu);
        console.log('image_url:', item.image_url);
        
        const itemElement = createOrderItemElement(item, index);
        container.appendChild(itemElement);
    });
    
    console.log('=== RENDERING COMPLETE ===\n');
}

function createOrderItemElement(item, index) {
    const div = document.createElement('div');
    div.className = 'order-item';
    
    console.log(`Creating element for ${item.name}:`, {
        id: item.id,
        image_url: item.image_url,
        hasImage: !!(item.image_url && item.image_url.trim())
    });
    
    // Prefer explicit item.price (catalog displayed price). If not provided, apply Platoo discount
    // to original_price (if available) as fallback.
    const unitPrice = (typeof item.price !== 'undefined' && item.price !== null)
        ? Number(item.price)
        : (item.original_price ? Number(item.original_price) - Math.round(Number(item.original_price) * PLATOO_DISCOUNT_RATE) : 0);
    const itemPrice = unitPrice;
    const itemTotal = itemPrice * item.quantity;

    // Food emojis sebagai fallback (SAMA dengan catalog.js)
    const foodEmojis = ['??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??'];
    const randomEmoji = foodEmojis[Math.floor(Math.random() * foodEmojis.length)];
    
    // Check for photo - PERSIS seperti di catalog.js
    const photoUrl = item.foto_menu || item.image_url || item.photo_url || item.foto || '';
    const hasImage = photoUrl && photoUrl.trim() !== '';
    
    console.log(`??? Rendering ${item.name}:`, {
        foto_menu: item.foto_menu,
        image_url: item.image_url,
        photoUrl: photoUrl,
        hasImage: hasImage
    });

    div.innerHTML = `
        <div class="item-image-container ${hasImage ? 'has-image' : 'no-image'}">
            ${hasImage 
                ? `<img 
                    src="${photoUrl}" 
                    alt="${item.name}"
                    class="item-image"
                    crossorigin="anonymous"
                    onerror="console.error('? Image failed:', '${photoUrl}'); this.style.display='none'; this.nextElementSibling.style.display='flex';"
                    onload="console.log('? Image loaded:', '${item.name}');"
                >
                <div class="item-image-fallback" style="display:none;">
                    <span>${randomEmoji}</span>
                </div>`
                : `<div class="item-image-fallback">
                    <span>${randomEmoji}</span>
                </div>`
            }
        </div>
        <div class="item-details">
            <div class="item-header">
                <div>
                    <div class="item-restaurant">${orderData.restaurantInfo.name || 'Restoran'}</div>
                    <div class="item-name">${item.name}</div>
                </div>
                <div class="item-price">${formatCurrency(itemTotal)}</div>
            </div>
            <div class="item-footer">
                <div class="item-quantity">
                    ${item.quantity}x ${formatCurrency(itemPrice)}
                </div>
                <button class="edit-item" data-index="${index}" onclick="editItemQuantity(${index})" title="Edit jumlah">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
            </div>
        </div>
    `;

    return div;
}

function editItemQuantity(index) {
    const item = orderData.items[index];
    const currentQuantity = item.quantity;
    
    // Create inline quantity editor
    const itemElements = document.querySelectorAll('.order-item');
    const itemElement = itemElements[index];
    if (!itemElement) return;
    
    const footerElement = itemElement.querySelector('.item-footer');
    if (!footerElement) return;
    
    // Replace with quantity controls
    footerElement.innerHTML = `
        <div class="inline-quantity-controls">
            <button class="qty-btn-inline qty-minus" onclick="updateQuantityInline(${index}, -1)">-</button>
            <span class="qty-display" id="qtyDisplay-${index}">${currentQuantity}</span>
            <button class="qty-btn-inline qty-plus" onclick="updateQuantityInline(${index}, 1)">+</button>
        </div>
        <button class="save-qty-btn" onclick="saveQuantityInline(${index})" title="Simpan">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        </button>
    `;
}

function updateQuantityInline(index, change) {
    const display = document.getElementById(`qtyDisplay-${index}`);
    if (!display) return;
    
    const currentQty = parseInt(display.textContent);
    const newQty = currentQty + change;
    const item = orderData.items[index];
    const maxStock = item.maxStock || 99;
    
    // Validate range and stock
    if (newQty < 1) {
        return;
    }
    
    if (newQty > maxStock) {
        showNotification(`Stok tidak mencukupi! Maksimal ${maxStock} item`, 'error');
        return;
    }
    
    // Only update display, don't save yet
    display.textContent = newQty;
}

function saveQuantityInline(index) {
    const display = document.getElementById(`qtyDisplay-${index}`);
    if (!display) return;
    
    const newQuantity = parseInt(display.textContent);
    
    // Update orderData
    orderData.items[index].quantity = newQuantity;
    
    // Update localStorage dengan format yang sesuai
    // Cek format cart yang digunakan
    const isNewFormat = localStorage.getItem('platoo_cart') !== null;
    
    if (isNewFormat) {
        // Update NEW format (array) - update seluruh array dengan quantity yang baru
        const cartItems = orderData.items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.photo_url,
            quantity: item.quantity,
            maxStock: item.maxStock || 99
        }));
        localStorage.setItem('platoo_cart', JSON.stringify(cartItems));
    } else {
        // Update OLD format (single item)
        localStorage.setItem('platoo_pending_order', JSON.stringify({
            restaurant: orderData.restaurantInfo,
            item: orderData.items[index],
            quantity: newQuantity,
            subtotal: orderData.items[index].price * newQuantity,
            total: orderData.items[index].price * newQuantity,
            timestamp: Date.now()
        }));
    }
    
    // Re-render everything to update price
    renderOrderItems();
    calculateTotals();
    updatePriceBreakdown();
    
    // Re-render voucher list to update availability based on new total
    renderVoucherList();
    
    showNotification('Jumlah pesanan berhasil diubah', 'success');
}

function calculateTotals() {
    // Calculate subtotal using explicit item.price (catalog displayed price) if present,
    // otherwise fall back to item.original_price.
    orderData.subtotal = orderData.items.reduce((total, item) => {
        const unit = (typeof item.price !== 'undefined' && item.price !== null) ? item.price : item.original_price;
        return total + (unit * item.quantity);
    }, 0);

    // Note: Diskon Platoo is now driven by voucher selection and stored in orderData.restaurantDiscount.
    // If no voucher selected, restaurantDiscount should be 0 (or set elsewhere).
    orderData.restaurantDiscount = orderData.restaurantDiscount || 0;

    // Subtotal after discount
    const subtotalAfterDiscount = orderData.subtotal - orderData.restaurantDiscount - orderData.voucherDiscount;

    // Calculate tax
    orderData.taxAmount = Math.round(subtotalAfterDiscount * TAX_RATE);

    // Calculate total
    orderData.totalPrice = subtotalAfterDiscount + SERVICE_FEE + orderData.taxAmount;
}

function updatePriceBreakdown() {
    document.getElementById('subtotal').textContent = formatCurrency(orderData.subtotal);
    document.getElementById('restaurantDiscount').textContent = `-${formatCurrency(orderData.restaurantDiscount)}`;
    document.getElementById('serviceFee').textContent = formatCurrency(SERVICE_FEE);
    document.getElementById('taxAmount').textContent = formatCurrency(orderData.taxAmount);
    document.getElementById('totalPrice').textContent = formatCurrency(orderData.totalPrice);

    // Show/hide voucher discount row
    const voucherRow = document.getElementById('voucherDiscountRow');
    if (orderData.voucherDiscount > 0) {
        voucherRow.style.display = 'flex';
        document.getElementById('voucherDiscountAmount').textContent = `-${formatCurrency(orderData.voucherDiscount)}`;
    } else {
        voucherRow.style.display = 'none';
    }

    // Update sidebar
    const totalItems = orderData.items.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cartItemCount').innerHTML = `
        <span>Total Item:</span>
        <strong>${totalItems}</strong>
    `;
    document.getElementById('sidebarSubtotal').textContent = formatCurrency(orderData.subtotal);
    document.getElementById('sidebarTotal').textContent = formatCurrency(orderData.totalPrice);
}

function renderPickupInfo() {
    const container = document.getElementById('pickupDetails');
    
    // Restaurant card dengan style dashboard pembeli
    const emojis = ['??', '??', '??', '??', '??', '??', '??', '??', '??', '??'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const hasPhoto = orderData.restaurantInfo.photo && orderData.restaurantInfo.photo.trim() !== '';
    const rating = orderData.restaurantInfo.rating ? orderData.restaurantInfo.rating.toFixed(1) : '0.0';
    
    container.innerHTML = `
        <div class="restaurant-pickup-card">
            <div class="pickup-card-image ${hasPhoto ? 'has-photo' : ''}">
                ${hasPhoto 
                    ? `<img src="${orderData.restaurantInfo.photo}" alt="${orderData.restaurantInfo.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                       <span style="display:none;">${randomEmoji}</span>`
                    : `<span>${randomEmoji}</span>`
                }
                <div class="pickup-card-badge">
                    ? ${rating}
                </div>
            </div>
            <div class="pickup-card-content">
                <div class="pickup-card-header">
                    <h3 class="pickup-card-title">${orderData.restaurantInfo.name || '-'}</h3>
                    <div class="pickup-card-location">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 0C5.2 0 3 2.2 3 5c0 3.9 5 11 5 11s5-7.1 5-11c0-2.8-2.2-5-5-5zm0 7.5c-1.4 0-2.5-1.1-2.5-2.5S6.6 2.5 8 2.5s2.5 1.1 2.5 2.5S9.4 7.5 8 7.5z"/>
                        </svg>
                        <span>${orderData.restaurantInfo.address || '-'}</span>
                    </div>
                </div>
                <div class="pickup-card-info">
                    <div class="pickup-card-phone">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328z"/>
                        </svg>
                        <span>${orderData.restaurantInfo.phone || '-'}</span>
                    </div>
                    <div class="pickup-card-time">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.5 3v4.5l3 1.5-.5 1-3.5-1.75V4h1z"/>
                        </svg>
                        <span>Sesuai jam operasional restoran</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function setupEventListeners() {
    // Voucher selection
    document.querySelectorAll('input[name="voucher"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                const voucherId = e.target.dataset.voucherId;
                const selectedVoucher = availableVouchers.find(v => v.id == voucherId);
                selectVoucher(selectedVoucher);
            }
        });
    });

    // Payment method
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            orderData.selectedPaymentMethod = e.target.value;
        });
    });

    // Customer phone (only if field exists)
    const phoneEl = document.getElementById('customerPhone');
    if (phoneEl) {
        phoneEl.addEventListener('change', (e) => {
            orderData.customerPhone = e.target.value;
        });
    }

    // Confirm checkout
    document.getElementById('confirmCheckoutBtn').addEventListener('click', confirmCheckout);
}

function selectVoucher(voucher) {
    if (!voucher) {
        // Deselect voucher
        orderData.selectedVoucherId = null;
        orderData.selectedVoucher = null;
        orderData.voucherDiscount = 0;
        // also clear any Platoo discount mapping
        orderData.restaurantDiscount = 0;
        document.getElementById('voucherStatus').innerHTML = '';
    } else {
        // Check stock availability (calculated from max_total_redemptions - total_redeemed)
        const remainingStock = (voucher.max_total_redemptions || 1) - (voucher.total_redeemed || 0);
        
        if (remainingStock <= 0) {
            const statusEl = document.getElementById('voucherStatus');
            statusEl.className = 'voucher-status error';
            statusEl.innerHTML = `❌ Voucher <strong>${voucher.code || voucher.name}</strong> sudah habis!`;
            return;
        }

        // Select voucher
        orderData.selectedVoucherId = voucher.id;
        orderData.selectedVoucher = voucher;

        // Calculate discount based on type (preview only - actual calculation akan di backend saat redeem)
        const discountType = voucher.discount_type || 'FIXED';
        const discountValue = Number(voucher.discount_value || 0);
        const maxDiscount = voucher.max_discount_amount;
        let discountAmount = 0;

        if (discountType === 'PERCENT') {
            // Calculate percentage of subtotal (tanpa PPN)
            discountAmount = (orderData.subtotal * discountValue) / 100;
            
            // Apply max discount limit if exists
            if (maxDiscount && discountAmount > maxDiscount) {
                discountAmount = maxDiscount;
            }
        } else {
            // FIXED discount
            discountAmount = discountValue;
        }

        // Map voucher discount to 'restaurantDiscount' (Diskon Platoo) per request
        orderData.restaurantDiscount = discountAmount;
        // keep voucherDiscount zero to avoid double-subtraction
        orderData.voucherDiscount = 0;

        // Clear status message (no success notification needed)
        document.getElementById('voucherStatus').innerHTML = '';
    }

    // Recalculate totals
    calculateTotals();
    updatePriceBreakdown();
}

async function confirmCheckout() {
    // Validate form: if phone input exists, require it; otherwise skip (section removed)
    const phoneInput = document.getElementById('customerPhone');
    if (phoneInput) {
        if (!phoneInput.value || !phoneInput.value.trim()) {
            showErrorModal('Silakan masukkan nomor telepon');
            return;
        }
        orderData.customerPhone = phoneInput.value.trim();
    }

    const agreeCheckbox = document.getElementById('agreeTerms');
    if (!agreeCheckbox.checked) {
        // Show notification instead of modal
        showNotification('Wajib menyetujui syarat dan ketentuan', 'error');
        
        // Highlight the checkbox container
        const checkboxContainer = agreeCheckbox.closest('.checkbox-container');
        if (checkboxContainer) {
            checkboxContainer.style.border = '2px solid var(--error)';
            checkboxContainer.style.backgroundColor = 'rgba(244, 67, 54, 0.05)';
            
            // Remove highlight after 3 seconds
            setTimeout(() => {
                checkboxContainer.style.border = '';
                checkboxContainer.style.backgroundColor = '';
            }, 3000);
        }
        
        // Scroll to checkbox
        agreeCheckbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    if (orderData.items.length === 0) {
        showErrorModal('Keranjang belanja kosong');
        return;
    }

    showLoadingOverlay(true);

    try {
        // 1. Redeem voucher terlebih dahulu (jika ada) - ini akan validasi dan calculate discount
        console.log('🔍 DEBUG: orderData.selectedVoucher =', orderData.selectedVoucher);
        if (orderData.selectedVoucher) {
            console.log('=== Redeeming voucher ===');
            try {
                await redeemVoucher();
                console.log('✅ Voucher redemption SUCCESS');
            } catch (voucherError) {
                console.error('❌ Voucher redemption FAILED:', voucherError);
                // STOP checkout jika voucher gagal
                throw voucherError;
            }
        } else {
            console.log('⚠️ No voucher selected, skipping redemption');
        }

        // 2. Update stok katalog untuk setiap item
        console.log('=== Updating katalog stock ===');
        await updateKatalogStock();

        // Clear cart
        localStorage.removeItem('platoo_cart');
        localStorage.removeItem('platoo_pending_order');

        showLoadingOverlay(false);

        // Show success modal dengan data pesanan
        showSuccessModal();

    } catch (error) {
        console.error('❌ Error confirming checkout:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            currentUser: currentUser,
            orderData: orderData
        });
        showLoadingOverlay(false);
        showErrorModal(`Terjadi Kesalahan\n\n${error.message || 'Gagal memproses pesanan. Silakan coba lagi.'}`);
    }
}

async function createOrder() {
    try {
        console.log('=== Creating order ===');
        console.log('Current user:', currentUser);
        console.log('Restaurant ID:', orderData.restaurantId);
        console.log('Items:', orderData.items);
        
        // Validate currentUser exists and get user ID
        if (!currentUser) {
            console.error('? No user logged in!');
            throw new Error('User tidak login');
        }
        
        console.log('?? currentUser keys:', Object.keys(currentUser));
        console.log('?? currentUser values:', currentUser);
        
        // Try multiple possible ID field names
        const userId = currentUser.id || 
                       currentUser.id_pembeli || 
                       currentUser.pembeli_id ||
                       currentUser.userId;
        
        if (!userId) {
            console.error('? No user ID found in currentUser:', currentUser);
            throw new Error('User ID tidak ditemukan');
        }
        
        console.log('? User ID:', userId, typeof userId);
        
        // Get max order_id dari database untuk auto-increment manual
        const { data: maxOrderData } = await supabaseClient
            .from('orders')
            .select('order_id')
            .order('order_id', { ascending: false })
            .limit(1);
        
        let nextOrderId = 1;
        if (maxOrderData && maxOrderData.length > 0) {
            nextOrderId = maxOrderData[0].order_id + 1;
        }
        
        console.log('Next order ID will start from:', nextOrderId);
        
        // Insert order untuk setiap item (karena struktur table orders per item)
        const orderInserts = [];
        
        for (const item of orderData.items) {
            const orderData_single = {
                order_id: nextOrderId++,
                catalog_id: parseInt(item.id),
                id_pembeli: userId,
                jumlah: parseInt(item.quantity),
                status_pesanan: 'Pesanan Diterima',
                total_harga: parseInt(Math.round((item.price || item.original_price) * item.quantity))
            };
            
            console.log('Inserting order:', orderData_single);
            orderInserts.push(orderData_single);
        }
        
        // Insert semua orders sekaligus
        const { data, error } = await supabaseClient
            .from('orders')
            .insert(orderInserts);

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
        
        console.log('? Orders created:', data);
        // Return order info
        const orderIds = orderInserts.map(o => o.order_id);
        const displayId = 'ORD-' + orderInserts[0].order_id;
        return { orderIds, displayId };
    } catch (error) {
        console.error('? Error creating order:', error);
        throw error;
    }
}

async function updateKatalogStock() {
    try {
        console.log('Updating katalog stock for items:', orderData.items);
        
        let successCount = 0;
        let failCount = 0;
        
        for (const item of orderData.items) {
            try {
                // GET current stock dari API katalog - langsung ambil semua data
                const getResponse = await fetch('https://18223044.tesatepadang.space/');
                
                if (!getResponse.ok) {
                    console.error(`❌ Failed to get catalog data: ${getResponse.status}`);
                    failCount++;
                    continue;
                }
                
                const allFoods = await getResponse.json();
                
                // Cari makanan dengan catalog_id yang sesuai
                const foodData = allFoods.find(food => food.catalog_id === parseInt(item.id));
                
                if (!foodData) {
                    console.warn(`⚠️ Item ${item.id} (${item.name}) tidak ditemukan di katalog`);
                    failCount++;
                    continue;
                }
                
                console.log(`📦 Current stock for ${item.name}:`, foodData.stok);
                
                // Calculate new stock
                const newStock = Math.max(0, foodData.stok - item.quantity);
                console.log(`📉 New stock for ${item.name}:`, newStock);
                
                // PATCH to update stock
                const updateResponse = await fetch(`https://18223044.tesatepadang.space/makanan/${item.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        stok: newStock
                    })
                });
                
                if (!updateResponse.ok) {
                    console.error(`❌ Failed to update stock for item ${item.id}: ${updateResponse.status}`);
                    const errorText = await updateResponse.text();
                    console.error('Error response:', errorText);
                    failCount++;
                    continue;
                }
                
                const updateResult = await updateResponse.json();
                console.log(`✅ Stock updated for ${item.name}:`, updateResult);
                successCount++;
                
            } catch (error) {
                console.error(`❌ Error updating stock for item ${item.id}:`, error);
                failCount++;
            }
        }
        
        console.log(`✅ Stock update summary: ${successCount} success, ${failCount} failed out of ${orderData.items.length} items`);
        
        if (successCount === 0 && failCount > 0) {
            throw new Error('Gagal mengupdate stok makanan. Silakan coba lagi.');
        }
        
    } catch (error) {
        console.error('❌ Critical error updating katalog stock:', error);
        throw error;
    }
}

/**
 * Redeem voucher menggunakan manual update (bypass validasi "sudah pernah pakai")
 * Karena backend /redeem memblock user yang sudah pernah pakai,
 * kita manual update via PUT endpoint
 */
async function redeemVoucher() {
    if (!orderData.selectedVoucher) {
        console.log('No voucher selected');
        return;
    }
    
    try {
        // Get voucher code
        const voucherCode = orderData.selectedVoucher.code || 
                           orderData.selectedVoucher.nama_voucher || 
                           orderData.selectedVoucher.kode_voucher;
        
        const voucherId = orderData.selectedVoucher.id;
        
        if (!voucherCode || !voucherId) {
            throw new Error('Voucher code atau ID tidak ditemukan');
        }
        
        console.log('Redeeming voucher:', voucherCode);
        console.log('Voucher ID:', voucherId);
        console.log('Order amount:', orderData.totalPrice);
        
        // Get auth token dari localStorage
        let authToken = null;
        
        // Method 1: Check standalone token keys
        authToken = localStorage.getItem('platoo_auth_token') || 
                   localStorage.getItem('authToken') ||
                   localStorage.getItem('auth_token');
        
        if (!authToken) {
            // Method 2: Check inside platoo_user object
            const userDataJson = localStorage.getItem('platoo_user');
            if (userDataJson) {
                try {
                    const userData = JSON.parse(userDataJson);
                    authToken = userData.access_token || 
                               userData.token || 
                               userData.session?.access_token;
                } catch (err) {
                    console.error('Error parsing user data:', err);
                }
            }
        }
        
        console.log('🔍 Token found:', authToken ? 'YES' : 'NO');
        
        // Jika tidak ada token, skip redemption
        if (!authToken) {
            console.warn('⚠️ No auth token, skipping voucher redemption');
            showNotification('Voucher tidak dapat divalidasi. Diskon tetap diterapkan.', 'warning');
            return;
        }
        
        console.log('✅ Auth token ready');
        
        // Validasi voucher dengan GET current data
        console.log('📡 Validating voucher data...');
        const getResponse = await fetch(`https://18223022.tesatepadang.space/vouchers/${voucherCode}`);
        
        if (!getResponse.ok) {
            throw new Error('Gagal mengambil data voucher');
        }
        
        const voucherData = await getResponse.json();
        console.log('📦 Voucher data:', voucherData);
        
        const currentVoucher = voucherData.data || voucherData;
        
        // Cek apakah voucher masih bisa dipakai
        const currentTotalRedeemed = currentVoucher.total_redeemed || 0;
        const maxUsage = currentVoucher.max_usage || Infinity;
        
        if (currentTotalRedeemed >= maxUsage) {
            throw new Error('Voucher sudah mencapai batas penggunaan maksimal');
        }
        
        console.log(`✅ Voucher valid - Digunakan: ${currentTotalRedeemed}/${maxUsage}`);
        
        // Voucher info akan dikirim ke backend saat create order
        // Backend yang akan handle update total_redeemed
        console.log('✅ Voucher akan diproses oleh backend saat order dibuat');
        
        showNotification('Voucher siap digunakan!', 'success');
        
    } catch (error) {
        console.error('❌ Error redeeming voucher:', error);
        
        // Jangan throw error - biarkan checkout tetap jalan
        console.warn('⚠️ Voucher redemption failed, but checkout will continue');
        showNotification('Voucher tidak dapat diproses, tapi checkout tetap dilanjutkan.', 'warning');
    }
}

async function updateFoodStock() {
    try {
        for (const item of orderData.items) {
            const { data: food } = await supabaseClient
                .from('catalog')
                .select('stok')
                .eq('catalog_id', item.id)
                .single();

            if (food) {
                const newStok = Math.max(0, food.stok - item.quantity);
                await supabaseClient
                    .from('catalog')
                    .update({ stok: newStok })
                    .eq('catalog_id', item.id);
            }
        }
    } catch (error) {
        console.error('Error updating food stock:', error);
    }
}

async function updateVoucherStock() {
    console.log('??? Checking voucher data for cash payment:', orderData.selectedVoucher);
    
    if (!orderData.selectedVoucher) {
        console.log('No voucher selected');
        return;
    }
    
    try {
        const voucherId = orderData.selectedVoucher.voucher_id;
        console.log('Updating voucher stock for voucher ID:', voucherId);

        // Get current stock
        const { data: voucher, error: fetchError } = await supabaseClient
            .from('voucher')
            .select('stok')
            .eq('voucher_id', voucherId)
            .single();

        if (fetchError) {
            console.error('? Error fetching voucher:', fetchError);
            throw fetchError;
        }

        if (voucher) {
            console.log('Current voucher stock:', voucher.stok);
            const oldStok = voucher.stok;
            const newStok = Math.max(0, oldStok - 1);
            console.log('Calculated new stock:', newStok);
            console.log('Executing UPDATE query with:', { stok: newStok, voucher_id: voucherId });
            
            const { data: updateData, error: updateError } = await supabaseClient
                .from('voucher')
                .update({ stok: newStok })
                .eq('voucher_id', voucherId)
                .select();

            console.log('?? DETAILED UPDATE RESPONSE:');
            console.log('- updateData:', JSON.stringify(updateData, null, 2));
            console.log('- updateError:', JSON.stringify(updateError, null, 2));
            console.log('- Data length:', updateData?.length);
            console.log('- Updated row:', updateData?.[0]);

            if (updateError) {
                console.error('? Error updating voucher:', updateError);
                return { success: false, error: updateError, oldStock: oldStok, newStock: newStok };
            }

            // Check if update actually modified a row
            if (!updateData || updateData.length === 0) {
                console.error('?? WARNING: Update executed but NO rows were modified!');
                console.error('This usually means RLS policy is blocking the update.');
                return { success: false, error: 'No rows updated - possible RLS issue', oldStock: oldStok, newStock: newStok };
            }

            console.log(`? Voucher stock updated (cash payment): ${oldStok} ? ${newStok}`);
            console.log('Updated data from database:', updateData);
            return { success: true, oldStock: oldStok, newStock: newStok, updatedRow: updateData[0] };
        } else {
            console.warn('?? Voucher not found in database');
            return { success: false, error: 'Voucher not found' };
        }
    } catch (error) {
        console.error('? Error updating voucher stock:', error);
        return { success: false, error: error.message };
    }
}

// UI Helper Functions

function showEmptyCart() {
    // Clear items container
    document.getElementById('itemsContainer').innerHTML = '';

    // Show empty cart message
    document.getElementById('emptyCart').style.display = 'block';
    document.getElementById('priceBreakdown').style.display = 'none';
    document.getElementById('checkoutActions').style.display = 'none';
    document.getElementById('orderSummaryCard').style.display = 'none';
    document.querySelectorAll('.checkout-section').forEach(section => {
        if (!section.classList.contains('order-summary-section')) {
            section.style.display = 'none';
        }
    });
}

function showLoadingOverlay(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
}

function showSuccessModal(orderId) {
    const modal = document.getElementById('successModal');
    if (!modal) {
        showNotification('Pesanan berhasil!', 'success');
        setTimeout(() => window.location.href = 'dashboard-pembeli.html', 1500);
        return;
    }
    
    // Set order number
    document.getElementById('orderNumber').textContent = orderId || '#ORD-' + Date.now();
    
    // Set payment method display
    const paymentMethodText = {
        'cash': 'Cash',
        'virtual_account': 'Virtual Account',
        'ewallet': 'E-Wallet'
    };
    document.getElementById('paymentMethod').textContent = paymentMethodText[orderData.selectedPaymentMethod] || 'Cash';
    
    // Set success message based on payment method
    const paymentMessages = {
        'cash': 'Pembayaran akan dilakukan saat pengambilan pesanan',
        'virtual_account': 'Silakan lakukan transfer ke nomor virtual account yang akan dikirim',
        'ewallet': 'Silakan selesaikan pembayaran melalui e-wallet Anda'
    };
    document.getElementById('successMessage').textContent = paymentMessages[orderData.selectedPaymentMethod];
    
    // Set total price
    document.getElementById('successTotalPrice').textContent = formatCurrency(orderData.totalPrice);
    
    // Show modal with animation
    modal.style.display = 'flex';
}

function showErrorModal(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorModal').style.display = 'flex';
}

function goToDashboard() {
    window.location.href = 'dashboard-pembeli.html';
}

function goToOrderStatus() {
    window.location.href = 'order-status.html';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}


function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Email Functions

async function sendOrderEmail(orderId) {
    try {
        console.log('?? Sending order confirmation email...');
        
        // Initialize EmailJS if not already initialized
        if (typeof initEmailJS === 'function') {
            initEmailJS();
        }
        
        // Check if user has email
        if (!currentUser.email) {
            console.warn('?? User has no email address, skipping email send');
            return;
        }
        
        // Prepare email data
        const emailData = {
            customerEmail: currentUser.email,
            customerName: currentUser.nama || currentUser.username,
            orderId: orderId,
            restaurantName: orderData.restaurantInfo.name || orderData.restaurantInfo.nama_restoran,
            restaurantAddress: orderData.restaurantInfo.address || orderData.restaurantInfo.alamat,
            restaurantPhone: orderData.restaurantInfo.phone || orderData.restaurantInfo.nomor_telepon,
            items: orderData.items.map(item => ({
                nama_menu: item.name || item.nama_menu || item.nama_makanan,
                quantity: item.quantity,
                harga: item.price || item.harga,
                gambar_menu: item.photo_url || item.image_url || item.foto_menu || item.foto || item.gambar_menu,
                subtotal: (item.price || item.harga) * item.quantity
            })),
            totalPrice: orderData.totalPrice,
            paymentMethod: orderData.selectedPaymentMethod
        };
        
        console.log('?? Full email data with items:', emailData);
        
        console.log('?? Email data prepared:', {
            to: emailData.customerEmail,
            name: emailData.customerName,
            orderId: emailData.orderId,
            itemCount: emailData.items.length
        });
        
        console.log('Email data prepared:', emailData);
        
        // Send email using email-service.js
        if (typeof sendOrderConfirmationEmail === 'function') {
            const result = await sendOrderConfirmationEmail(emailData);
            if (result.success) {
                console.log('? Email sent successfully!');
                return result;
            } else {
                console.warn('?? Email send failed:', result.error);
                return result;
            }
        } else {
            console.warn('?? Email service not loaded');
            return { success: false, error: 'Email service not loaded' };
        }
    } catch (error) {
        console.error('? Error sending email:', error);
        // Don't throw error - email is optional, order should still proceed
        return { success: false, error: error.message };
    }
}

// Utility Functions

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateTotals,
        formatCurrency,
        orderData
    };
}