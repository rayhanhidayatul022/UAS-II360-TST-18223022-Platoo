/**
 * Dashboard Pembeli - Direct Catalog View
 * Shows food catalog directly from Katalog API
 */

const KATALOG_API_URL = 'https://18223044.tesatepadang.space';

let allFoods = [];
let currentFilter = 'all'; // Track current filter
let cart = JSON.parse(localStorage.getItem('platoo_cart') || '[]');

// Check authentication
document.addEventListener('DOMContentLoaded', async function() {
    checkAuth();
    await loadFoods();
    setupEventListeners();
    updateCartBadge();
});

// Expose functions to window for onclick handlers
window.addToCart = addToCart;
window.incrementQuantity = incrementQuantity;
window.decrementQuantity = decrementQuantity;

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('platoo_user') || '{}');
    
    // Check if user exists - check for email or id instead of username
    if (!user || !user.email) {
        console.log('Auth check failed: no user data');
        window.location.href = 'login.html';
        return;
    }
    
    // If role is penjual, redirect to penjual dashboard
    if (user.role === 'penjual' || user.role === 'admin') {
        console.log('User is penjual/admin, redirecting...');
        window.location.href = 'dashboard-penjual.html';
        return;
    }
    
    console.log('Auth success:', user);
    
    // Set user info
    const userName = document.getElementById('userName');
    const welcomeName = document.getElementById('welcomeName');
    const userInitial = document.getElementById('userInitial');
    
    if (userName) userName.textContent = user.nama || user.email || 'Pembeli';
    if (welcomeName) welcomeName.textContent = user.nama || user.email || 'Pembeli';
    if (userInitial) userInitial.textContent = (user.nama || user.email || 'P').charAt(0).toUpperCase();
}

function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('platoo_user');
            localStorage.removeItem('platoo_cart');
            localStorage.removeItem('platoo_auth_token');
            window.location.href = 'login.html';
        });
    }
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            filterFoods(searchTerm);
        });
    }
    
    // Filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update current filter
            currentFilter = this.dataset.filter;
            
            // Re-render with new filter
            filterFoods(searchInput ? searchInput.value.toLowerCase() : '');
        });
    });
}

async function loadFoods() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const restaurantGrid = document.getElementById('restaurantGrid');
    
    try {
        console.log('🔄 Loading foods from API...');
        
        if (loadingState) loadingState.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
        if (restaurantGrid) restaurantGrid.innerHTML = '';
        
        const response = await fetch(KATALOG_API_URL);
        
        if (!response.ok) {
            throw new Error('Failed to load foods');
        }
        
        const foods = await response.json();
        console.log('✅ Foods loaded:', foods);
        
        // Filter only ACTIVE foods with resto_id = 1
        allFoods = foods.filter(food => food.resto_id === 1 && food.is_aktif);
        console.log('✅ Filtered active foods for resto_id 1:', allFoods.length);
        
        if (loadingState) loadingState.style.display = 'none';
        
        if (allFoods.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
        } else {
            updateCounters();
            renderFoods(getFilteredFoods());
        }
    } catch (error) {
        console.error('Error loading foods:', error);
        if (loadingState) loadingState.style.display = 'none';
        showError('Gagal memuat katalog makanan');
    }
}

function filterFoods(searchTerm = '') {
    let filtered = getFilteredFoods();
    
    // Apply search
    if (searchTerm) {
        filtered = filtered.filter(food => 
            food.nama_makanan.toLowerCase().includes(searchTerm) ||
            (food.deskripsi && food.deskripsi.toLowerCase().includes(searchTerm))
        );
    }
    
    renderFoods(filtered);
}

function getFilteredFoods() {
    if (currentFilter === 'available') {
        // Only show foods that are active AND have stock
        return allFoods.filter(food => food.is_aktif && food.stok > 0);
    }
    // Show all foods
    return allFoods;
}

function updateCounters() {
    const countAll = document.getElementById('countAll');
    const countAvailable = document.getElementById('countAvailable');
    const totalFoods = document.getElementById('totalFoods');
    
    const allCount = allFoods.length;
    const availableCount = allFoods.filter(food => food.is_aktif && food.stok > 0).length;
    
    if (countAll) countAll.textContent = allCount;
    if (countAvailable) countAvailable.textContent = availableCount;
    if (totalFoods) totalFoods.textContent = currentFilter === 'all' ? allCount : availableCount;
}

function renderFoods(foods) {
    const grid = document.getElementById('restaurantGrid') || document.getElementById('foodGrid');
    const totalFoods = document.getElementById('totalFoods');
    
    if (!grid) {
        console.error('Grid element not found');
        return;
    }
    
    // Update counter
    if (totalFoods) {
        totalFoods.textContent = foods.length;
    }
    
    // Update filter counters
    updateCounters();
    
    if (foods.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 64px; margin-bottom: 16px;">🍽️</div>
                <h3 style="color: #6b7280; margin-bottom: 8px;">Tidak ada menu tersedia</h3>
                <p style="color: #9ca3af;">Coba kata kunci lain</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = foods.map(food => createFoodCard(food)).join('');
}

function createFoodCard(food) {
    const imageUrl = food.foto || food.image_url || '/src/img/placeholder-food.png';
    const isAvailable = food.is_aktif && food.stok > 0;
    const foodId = food.catalog_id || food.id;
    
    // Check if item is in cart
    const cartItem = cart.find(item => item.id === foodId);
    const inCart = cartItem !== undefined;
    const quantity = inCart ? cartItem.quantity : 0;
    
    // Status badge
    let statusBadge = '';
    if (!food.is_aktif) {
        statusBadge = '<div class="sold-out-badge" style="position: absolute; top: 10px; right: 10px; background: #dc2626; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">Tidak Aktif</div>';
    } else if (food.stok === 0) {
        statusBadge = '<div class="sold-out-badge" style="position: absolute; top: 10px; right: 10px; background: #f59e0b; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">Habis</div>';
    }
    
    // Button HTML - show quantity selector if in cart
    let buttonHtml;
    if (!isAvailable) {
        buttonHtml = `
            <button class="btn-order" disabled style="background: #d1d5db; cursor: not-allowed;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                Tidak Tersedia
            </button>
        `;
    } else if (inCart) {
        buttonHtml = `
            <div class="quantity-selector" id="quantity-${foodId}" data-max-stock="${food.stok}">
                <button class="qty-btn qty-minus" onclick="decrementQuantity(${foodId})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
                <div class="qty-display">
                    <span class="qty-number">${quantity}</span>
                    <span class="qty-label">di keranjang</span>
                </div>
                <button class="qty-btn qty-plus" onclick="incrementQuantity(${foodId}, '${food.nama_makanan.replace(/'/g, "\\'")}', ${food.harga}, '${imageUrl}', ${food.stok})" ${quantity >= food.stok ? 'disabled' : ''}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
            </div>
        `;
    } else {
        buttonHtml = `
            <button class="btn-order" onclick="addToCart(${foodId}, '${food.nama_makanan.replace(/'/g, "\\'")}', ${food.harga}, '${imageUrl}', ${food.stok})">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                Tambah ke Keranjang
            </button>
        `;
    }
    
    return `
        <div class="restaurant-card" style="${!isAvailable ? 'opacity: 0.7;' : ''}">
            <div class="card-image">
                <img src="${imageUrl}" alt="${food.nama_makanan}" onerror="this.src='/src/img/placeholder-food.png'">
                ${statusBadge}
            </div>
            <div class="card-content">
                <h3 class="card-title">${food.nama_makanan}</h3>
                ${food.deskripsi ? `<p class="card-description">${food.deskripsi.substring(0, 80)}${food.deskripsi.length > 80 ? '...' : ''}</p>` : ''}
                <div class="card-meta">
                    <span class="rating" style="font-weight: 700; color: #4B0082;">Rp ${parseInt(food.harga).toLocaleString('id-ID')}</span>
                    <span class="address" style="color: #6b7280;">Stok: ${food.stok}</span>
                </div>
                ${buttonHtml}
            </div>
        </div>
    `;
}

function addToCart(foodId, name, price, image, maxStock) {
    const existing = cart.find(item => item.id === foodId);
    
    if (existing) {
        if (existing.quantity >= maxStock) {
            showToast('Stok tidak mencukupi!', 'error');
            return;
        }
        existing.quantity += 1;
    } else {
        cart.push({
            id: foodId,
            name: name,
            price: price,
            image: image,
            quantity: 1,
            maxStock: maxStock
        });
    }
    
    localStorage.setItem('platoo_cart', JSON.stringify(cart));
    updateCartBadge();
    
    // Re-render the food cards to show quantity selector
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    filterFoods(searchTerm);
    
    showToast('Berhasil ditambahkan ke keranjang!', 'success');
}

function incrementQuantity(foodId, name, price, image, maxStock) {
    const existing = cart.find(item => item.id === foodId);
    
    if (!existing) return;
    
    if (existing.quantity >= maxStock) {
        showToast('Stok tidak mencukupi!', 'error');
        return;
    }
    
    existing.quantity += 1;
    // Update maxStock to ensure it's always current
    existing.maxStock = maxStock;
    localStorage.setItem('platoo_cart', JSON.stringify(cart));
    updateCartBadge();
    
    // Update only the quantity display without re-rendering
    updateQuantityDisplay(foodId, existing.quantity, maxStock);
}

function decrementQuantity(foodId) {
    const existing = cart.find(item => item.id === foodId);
    
    if (!existing) return;
    
    if (existing.quantity <= 1) {
        // Remove from cart - need to re-render to show button again
        cart = cart.filter(item => item.id !== foodId);
        localStorage.setItem('platoo_cart', JSON.stringify(cart));
        updateCartBadge();
        
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        filterFoods(searchTerm);
        
        showToast('Item dihapus dari keranjang', 'warning');
    } else {
        existing.quantity -= 1;
        localStorage.setItem('platoo_cart', JSON.stringify(cart));
        updateCartBadge();
        
        // Update only the quantity display
        const selector = document.getElementById(`quantity-${foodId}`);
        const maxStock = selector ? parseInt(selector.dataset.maxStock) : 999;
        updateQuantityDisplay(foodId, existing.quantity, maxStock);
    }
}

function updateQuantityDisplay(foodId, quantity, maxStock) {
    const selector = document.getElementById(`quantity-${foodId}`);
    if (!selector) return;
    
    // Update quantity number
    const qtyNumber = selector.querySelector('.qty-number');
    if (qtyNumber) {
        qtyNumber.textContent = quantity;
    }
    
    // Update plus button disabled state
    const plusBtn = selector.querySelector('.qty-plus');
    if (plusBtn) {
        if (quantity >= maxStock) {
            plusBtn.setAttribute('disabled', 'true');
        } else {
            plusBtn.removeAttribute('disabled');
        }
    }
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (badge) {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function showToast(message, type = 'success') {
    // Simple toast notification
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? '#10b981' : '#dc2626';
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function showError(message) {
    const grid = document.getElementById('restaurantGrid');
    if (grid) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 64px; margin-bottom: 16px;">⚠️</div>
                <h3 style="color: #dc2626; margin-bottom: 8px;">Terjadi Kesalahan</h3>
                <p style="color: #6b7280;">${message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 24px; background: #4B0082; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Coba Lagi</button>
            </div>
        `;
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
