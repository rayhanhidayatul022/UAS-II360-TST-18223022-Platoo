let katalogService;


const SUPABASE_URL = 'https://nxamzwahwgakiatujxug.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YW16d2Fod2dha2lhdHVqeHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMDkwMjcsImV4cCI6MjA4MDU4NTAyN30.9nBRbYXKJmLcWbKcx0iICDNisdQNCg0dFjI_JGVt5pk';

/**
 * Upload image to Supabase Storage
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} Public URL of uploaded image
 */
async function uploadImageToSupabase(file) {
    try {
        const fileName = `food_${Date.now()}_${file.name}`;
        

        const formData = new FormData();
        formData.append('file', file);
        
        const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/resto-photos/katalog/${fileName}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: formData
        });
        
        if (!uploadResponse.ok) {
            throw new Error('Upload failed');
        }
        
    
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/resto-photos/katalog/${fileName}`;
        return publicUrl;
    } catch (error) {
        console.error('Error uploading to Supabase:', error);
        throw error;
    }
}

async function handleSubmit(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    console.log('🚀 Form submitted!');
    
    const submitBtn = document.querySelector('.btn-submit');
    const originalHTML = submitBtn ? submitBtn.innerHTML : '';
    
    try {
        if (!katalogService) {
            console.error('❌ KatalogService not initialized!');
            await Utils.showAlert('Service belum siap, silakan refresh halaman', 'error');
            return false;
        }
        
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
        
        Utils.showLoading(true);
        submitBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="animation: spin 0.8s linear infinite;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Menyimpan...';
        submitBtn.disabled = true;

        console.log('📝 Collecting form data...');
        
        let imageUrl = '';
        const imageInput = document.getElementById('image');
        if (imageInput && imageInput.files && imageInput.files[0]) {
            try {
                console.log('📤 Uploading image to Supabase...');
                imageUrl = await uploadImageToSupabase(imageInput.files[0]);
                console.log('✅ Image uploaded:', imageUrl);
            } catch (uploadError) {
                console.error('❌ Image upload failed:', uploadError);
                await Utils.showAlert('Gagal mengupload gambar. Lanjutkan tanpa gambar?', 'warning');
            }
        }
        
    
        const formData = {
            name: document.getElementById('nama_makanan').value.trim(),
            price: parseInt(document.getElementById('harga').value),
            stock: parseInt(document.getElementById('stok').value),
            resto_id: 1, // Fixed resto_id = 1
            description: document.getElementById('description') ? document.getElementById('description').value.trim() : '',
            image_url: imageUrl || '',
            is_active: true
        };
        
        console.log('📦 Form data prepared');
        console.log('📦 Will POST to:', `${katalogService.baseUrl}${API_CONFIG.endpoints.katalog.create}`);
        console.log('📦 Request body:', JSON.stringify(formData, null, 2));

        // Validation
        const nama = document.getElementById('nama_makanan').value.trim();
        const harga = parseInt(document.getElementById('harga').value);
        const stok = parseInt(document.getElementById('stok').value);
        
        if (!nama) {
            console.log('⚠️ Name missing');
            await Utils.showAlert('Nama makanan wajib diisi!', 'warning');
            Utils.showLoading(false);
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            return false;
        }

        if (harga <= 0 || isNaN(harga)) {
            console.log('⚠️ Invalid price');
            await Utils.showAlert('Harga harus lebih dari 0!', 'warning');
            Utils.showLoading(false);
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            return false;
        }

        if (stok < 0 || isNaN(stok)) {
            console.log('⚠️ Invalid stock');
            await Utils.showAlert('Stok tidak boleh negatif!', 'warning');
            Utils.showLoading(false);
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            return false;
        const namaMakanan = document.getElementById('nama_makanan').value;
        }

        // Send data to API
        console.log('📡 Sending data to API...');
        const response = await katalogService.createFood(formData);
        console.log('✅ API response:', response);

        Utils.showLoading(false);
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;

        await Utils.showAlert('Makanan berhasil ditambahkan!', 'success');

        window.location.href = 'food-catalog.html';

    } catch (error) {
        console.error('❌ Error submitting form:', error);
        Utils.showLoading(false);
        
        if (submitBtn) {
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
        }

        const errorMsg = Utils.handleApiError(error);
        await Utils.showAlert(`Gagal menambahkan makanan: ${errorMsg}`, 'error');
        
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('✨ Food Add page loaded');
    
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
    
    // Setup form submission
    const form = document.getElementById('foodForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
        console.log('✅ Form submit handler attached');
    } else {
        console.error('❌ Food form not found!');
    }
    
    // Setup image preview
    const imageInput = document.getElementById('image');
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const preview = document.getElementById('imagePreview');
                    const previewImg = document.getElementById('previewImg');
                    if (preview && previewImg) {
                        previewImg.src = event.target.result;
                        preview.style.display = 'block';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
        console.log('✅ Image preview handler attached');
    }
});
