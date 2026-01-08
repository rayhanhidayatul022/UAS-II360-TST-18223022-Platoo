let voucherService;

async function handleSubmit(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    console.log('🚀 Form submitted!');
    
    const submitBtn = document.querySelector('.btn-submit');
    const originalHTML = submitBtn ? submitBtn.innerHTML : '';
    
    try {
        // Check if voucherService is initialized
        if (!voucherService) {
            console.error('❌ VoucherService not initialized!');
            await Utils.showAlert('Service belum siap, silakan refresh halaman', 'error');
            return false;
        }
        
        // Check authentication
        console.log('🔒 Checking authentication...');
        if (!Utils.requireAuth()) {
            console.log('❌ Not authenticated');
            return false;
        }
        console.log('✅ User authenticated');

        if (!submitBtn) {
            console.error('❌ Submit button not found!');
            await Utils.showAlert('Error: Submit button tidak ditemukan', 'error');
            return false;
        }
        
        submitBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="animation: spin 0.8s linear infinite;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Menyimpan...';
        submitBtn.disabled = true;

        // Collect form data
        console.log('📝 Collecting form data...');
        
        // Get and format dates to ISO string (with time)
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
        
        console.log('📦 Form data collected:', formData);
        console.log('📦 Will POST to:', `${voucherService.baseUrl}${API_CONFIG.endpoints.voucher.create}`);
        console.log('📦 Request body:', JSON.stringify(formData, null, 2));

        // Validation
        if (!formData.name || !formData.code) {
            console.log('⚠️ Name or code missing');
            await Utils.showAlert('Nama dan kode voucher wajib diisi!', 'warning');
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            return;
        }

        if (formData.discount_type === 'PERCENT' && (formData.discount_value < 1 || formData.discount_value > 100)) {
            console.log('⚠️ Invalid percentage value');
            await Utils.showAlert('Persentase diskon harus antara 1-100!', 'warning');
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            return;
        }

        if (formData.discount_value <= 0) {
            console.log('⚠️ Invalid discount value');
            await Utils.showAlert('Nilai diskon harus lebih dari 0!', 'warning');
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            return;
        }

        if (formData.min_order_amount < 0) {
            console.log('⚠️ Invalid min order amount');
            await Utils.showAlert('Minimal transaksi tidak boleh negatif!', 'warning');
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            return;
        }

        if (formData.max_total_redemptions < 1) {
            console.log('⚠️ Invalid quota');
            await Utils.showAlert('Kuota voucher minimal 1!', 'warning');
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            return;
        }

        if (new Date(formData.end_at) <= new Date(formData.start_at)) {
            console.log('⚠️ Invalid date range');
            await Utils.showAlert('Tanggal berakhir harus setelah tanggal mulai!', 'warning');
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            return;
        }

        console.log('✅ Validation passed');
        console.log('📤 Submitting voucher to API...');
        console.log('VoucherService instance:', voucherService);
        console.log('Target URL:', `${voucherService.baseUrl}/vouchers`);
        
        console.log('🔄 Making API call...');

        // Create voucher via API
        const response = await voucherService.createVoucher(formData);
        
        console.log('✅ API Response:', response);
        console.log('🎉 Voucher created successfully!');

        // Reset button state before showing alert
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;

        await Utils.showAlert('Voucher berhasil ditambahkan!', 'success');
        
        console.log('🔄 Redirecting to catalog...');
        window.location.href = 'voucher-catalog.html';
        
        return false;

    } catch (error) {
        console.error('❌ Error in handleSubmit:', error);
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        if (error.response) {
            console.error('API Error Response:', error.response);
        }
        
        if (submitBtn) {
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
        }

        const errorMsg = Utils.handleApiError(error);
        console.log('📢 Showing error alert:', errorMsg);
        await Utils.showAlert(`Gagal menambahkan voucher: ${errorMsg}`, 'error');
        
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('✨ Voucher Add page loaded');
    
    // Initialize service
    try {
        console.log('🔧 Initializing VoucherService...');
        voucherService = new VoucherService();
        console.log('✅ VoucherService initialized:', voucherService);
        console.log('✅ Base URL:', voucherService.baseUrl);
    } catch (error) {
        console.error('❌ Error initializing VoucherService:', error);
        Utils.showAlert('Gagal menginisialisasi service voucher', 'error');
        return;
    }
    
    const form = document.getElementById('voucherForm');
    if (form) {
        console.log('✅ Form found, attaching submit handler');
        
        // Remove any existing handlers
        form.onsubmit = null;
        
        // Add the submit handler
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
