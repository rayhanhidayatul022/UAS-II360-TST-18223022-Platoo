let voucherService;
let voucherId = null;
let currentVoucher = null;

async function loadVoucherData() {
    try {
        // Ensure voucherService is initialized
        if (!voucherService) {
            console.error('❌ VoucherService not initialized!');
            await Utils.showAlert('Service belum siap, silakan refresh halaman', 'error');
            return;
        }
        
        // Get voucher ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        voucherId = urlParams.get('id');

        console.log('📥 Loading voucher with ID:', voucherId);

        if (!voucherId) {
            await Utils.showAlert('ID voucher tidak ditemukan!', 'error');
            window.location.href = 'voucher-catalog.html';
            return;
        }

        Utils.showLoading(true);

        // Fetch voucher data from API
        console.log('🔍 Fetching voucher from API...');
        console.log('🔧 VoucherService:', voucherService);
        console.log('🌐 Base URL:', voucherService.baseUrl);
        
        const vouchers = await voucherService.getAllVouchers();
        console.log('📦 All vouchers:', vouchers);
        
        // Find voucher by ID
        currentVoucher = vouchers.find(v => v.id === voucherId || v.id === parseInt(voucherId));
        
        if (!currentVoucher) {
            console.error('❌ Voucher not found with ID:', voucherId);
            await Utils.showAlert('Voucher tidak ditemukan!', 'error');
            window.location.href = 'voucher-catalog.html';
            return;
        }
        
        console.log('✅ Voucher found:', currentVoucher);

        // Populate form fields
        document.getElementById('name').value = currentVoucher.name || '';
        document.getElementById('code').value = currentVoucher.code || '';
        
        // Set discount type
        if (currentVoucher.discount_type === 'FIXED') {
            document.getElementById('discount_type_fixed').checked = true;
        } else {
            document.getElementById('discount_type_percent').checked = true;
        }

        document.getElementById('discount_value').value = currentVoucher.discount_value || 0;
        document.getElementById('min_order_amount').value = currentVoucher.min_order_amount || 0;
        document.getElementById('max_total_redemptions').value = currentVoucher.max_total_redemptions || 0;
        
        // Format dates for input (YYYY-MM-DD)
        if (currentVoucher.start_at) {
            try {
                const startDate = new Date(currentVoucher.start_at);
                const formattedStart = startDate.toISOString().split('T')[0];
                document.getElementById('start_at').value = formattedStart;
                console.log('✅ Start date set:', formattedStart);
            } catch (err) {
                console.error('Error formatting start date:', err);
            }
        }
        
        if (currentVoucher.end_at) {
            try {
                const endDate = new Date(currentVoucher.end_at);
                const formattedEnd = endDate.toISOString().split('T')[0];
                document.getElementById('end_at').value = formattedEnd;
                console.log('✅ End date set:', formattedEnd);
            } catch (err) {
                console.error('Error formatting end date:', err);
            }
        }

        document.getElementById('is_active').checked = currentVoucher.is_active === true || currentVoucher.is_active === 'true';

        console.log('✅ Form populated with voucher data');
        Utils.showLoading(false);

    } catch (error) {
        console.error('❌ Error loading voucher:', error);
        Utils.showLoading(false);

        const errorMsg = Utils.handleApiError(error);
        await Utils.showAlert(`Gagal memuat data voucher: ${errorMsg}`, 'error');
        window.location.href = 'voucher-catalog.html';
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🚀 Update form submitted!');
    
    try {
        if (!Utils.requireAuth()) {
            return;
        }

        if (!voucherId) {
            await Utils.showAlert('ID voucher tidak valid!', 'error');
            return;
        }

        const submitBtn = document.querySelector('.btn-submit');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="animation: spin 0.8s linear infinite;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Menyimpan...';
        submitBtn.disabled = true;

        // Collect form data
        const startDate = new Date(document.getElementById('start_at').value);
        const endDate = new Date(document.getElementById('end_at').value);
        
        // Set time to start of day for start_at and end of day for end_at
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        const formData = {
            name: document.getElementById('name').value.trim(),
            code: document.getElementById('code').value.trim().toUpperCase(),
            discount_type: document.querySelector('input[name="discount_type"]:checked').value,
            discount_value: parseInt(document.getElementById('discount_value').value),
            min_order_amount: parseInt(document.getElementById('min_order_amount').value) || 0,
            max_total_redemptions: parseInt(document.getElementById('max_total_redemptions').value),
            start_at: startDate.toISOString(),
            end_at: endDate.toISOString(),
            is_active: document.getElementById('is_active').checked
        };

        console.log('📦 Updated data:', formData);

        // Validation
        if (!formData.name || !formData.code) {
            await Utils.showAlert('Nama dan kode voucher wajib diisi!', 'warning');
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            return;
        }

        if (formData.discount_type === 'PERCENT' && (formData.discount_value < 1 || formData.discount_value > 100)) {
            await Utils.showAlert('Persentase diskon harus antara 1-100!', 'warning');
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            return;
        }

        if (formData.discount_value <= 0) {
            await Utils.showAlert('Nilai diskon harus lebih dari 0!', 'warning');
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            return;
        }

        if (formData.min_order_amount < 0) {
            await Utils.showAlert('Minimal transaksi tidak boleh negatif!', 'warning');
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            return;
        }

        if (formData.max_total_redemptions < 1) {
            await Utils.showAlert('Kuota voucher minimal 1!', 'warning');
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            return;
        }

        if (new Date(formData.end_at) <= new Date(formData.start_at)) {
            await Utils.showAlert('Tanggal berakhir harus setelah tanggal mulai!', 'warning');
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            return;
        }

        console.log('📤 Updating voucher via API...');

        // Update voucher via API
        const response = await voucherService.updateVoucher(voucherId, formData);
        
        console.log('✅ Voucher updated:', response);

        // Reset button
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;

        await Utils.showAlert('Voucher berhasil diperbarui!', 'success');
        
        window.location.href = 'voucher-catalog.html';
        
        return false;

    } catch (error) {
        console.error('❌ Error updating voucher:', error);
        
        if (submitBtn) {
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
        }

        const errorMsg = Utils.handleApiError(error);
        await Utils.showAlert(`Gagal memperbarui voucher: ${errorMsg}`, 'error');
        
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('✨ Voucher Edit page loaded');
    
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
    
    // Load existing voucher data after service is initialized
    await loadVoucherData();
    
    const form = document.getElementById('voucherForm');
    if (form) {
        console.log('✅ Form found, attaching submit handler');
        
        // Remove existing handlers
        form.onsubmit = null;
        
        // Add submit handler
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await handleSubmit(e);
            return false;
        });
        
        console.log('✅ Submit handler attached');
    } else {
        console.error('❌ Form not found!');
    }
});
