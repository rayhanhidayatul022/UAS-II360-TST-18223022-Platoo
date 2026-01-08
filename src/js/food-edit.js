let katalogService;
let foodId = null;
let currentFood = null;

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
        
        // Upload to Supabase Storage
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
        
        // Get public URL
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/resto-photos/katalog/${fileName}`;
        return publicUrl;
    } catch (error) {
        console.error('Error uploading to Supabase:', error);
        throw error;
    }
}

async function loadFoodData() {
    try {
        // Ensure katalogService is initialized
        if (!katalogService) {
            console.error('❌ KatalogService not initialized!');
            await Utils.showAlert('Service belum siap, silakan refresh halaman', 'error');
            return;
        }
        
        // Get food ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        foodId = urlParams.get('id');

        console.log('� Full URL:', window.location.href);
        console.log('🔍 URL Search params:', window.location.search);
        console.log('📥 Food ID from URL:', foodId);
        console.log('📥 Food ID type:', typeof foodId);

        if (!foodId) {
            console.error('❌ No food ID in URL!');
            await Utils.showAlert('ID makanan tidak ditemukan di URL!', 'error');
            window.location.href = 'food-catalog.html';
            return;
        }

        Utils.showLoading(true);

        // Fetch food data from API
        console.log('🔍 Fetching food from API...');
        console.log('🔧 KatalogService:', katalogService);
        console.log('🌐 Base URL:', katalogService.baseUrl);
        
        const foods = await katalogService.getAllFoods();
        console.log('📦 All foods:', foods);
        console.log('📦 Total foods:', foods.length);
        console.log('📦 First food sample:', foods[0]);
        console.log('📦 First food ID:', foods[0]?.id);
        console.log('📦 First food ID type:', typeof foods[0]?.id);
        
        // Find food by ID
        console.log('🔍 Looking for food with ID:', foodId, '(type:', typeof foodId, ')');
        currentFood = foods.find(f => {
            // API uses catalog_id, not id
            const foodIdFromApi = f.catalog_id || f.id;
            const match = foodIdFromApi === foodId || foodIdFromApi === parseInt(foodId) || String(foodIdFromApi) === foodId;
            if (match) {
                console.log('✅ Match found!', f);
            }
            return match;
        });
        
        console.log('🎯 Search result:', currentFood);
        
        if (!currentFood) {
            console.error('❌ Food not found with ID:', foodId);
            console.error('❌ Available IDs:', foods.map(f => f.catalog_id || f.id).slice(0, 10));
            await Utils.showAlert('Makanan tidak ditemukan!', 'error');
            window.location.href = 'food-catalog.html';
            return;
        }
        
        // Update foodId to use the correct ID from API response
        foodId = currentFood.catalog_id || currentFood.id;
        console.log('✅ Using catalog_id:', foodId);
        
        console.log('✅ Food found:', currentFood);

        // Populate form fields
        document.getElementById('nama_makanan').value = currentFood.name || currentFood.nama_makanan || '';
        document.getElementById('harga').value = currentFood.price || currentFood.harga || 0;
        document.getElementById('stok').value = currentFood.stock || currentFood.stok || 0;
        
        if (document.getElementById('description')) {
            document.getElementById('description').value = currentFood.description || currentFood.deskripsi || '';
        }
        
        if (document.getElementById('image_url')) {
            document.getElementById('image_url').value = currentFood.image_url || currentFood.foto || '';
        }
        
        // Set checkbox is_aktif
        const isAktifCheckbox = document.getElementById('is_aktif');
        if (isAktifCheckbox) {
            isAktifCheckbox.checked = currentFood.is_aktif === true;
            console.log('✅ is_aktif set to:', currentFood.is_aktif);
            
            // Update toggle status badge
            if (typeof updateToggleStatus === 'function') {
                updateToggleStatus();
            }
        }

        console.log('✅ Form populated with food data');
        Utils.showLoading(false);

    } catch (error) {
        console.error('❌ Error loading food:', error);
        Utils.showLoading(false);

        const errorMsg = Utils.handleApiError(error);
        await Utils.showAlert(`Gagal memuat data makanan: ${errorMsg}`, 'error');
        window.location.href = 'food-catalog.html';
    }
}

async function handleSubmit(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    console.log('🚀 Form submitted for update!');
    
    const submitBtn = document.querySelector('.btn-submit');
    const originalHTML = submitBtn ? submitBtn.innerHTML : '';
    
    try {
        // Check if katalogService is initialized
        if (!katalogService) {
            console.error('❌ KatalogService not initialized!');
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
        
        Utils.showLoading(true);
        submitBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="animation: spin 0.8s linear infinite;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Menyimpan...';
        submitBtn.disabled = true;

        // Collect form data
        console.log('📝 Collecting form data...');
        
        // Get is_aktif value
        const isAktif = document.getElementById('is_aktif').checked;
        console.log('🔘 is_aktif checkbox value:', isAktif);
        
        // Prepare JSON data for API with correct field names (sesuai backend)
        const foodData = {
            nama_makanan: document.getElementById('nama_makanan').value.trim(),
            harga: parseInt(document.getElementById('harga').value),
            stok: parseInt(document.getElementById('stok').value),
            foto: currentFood.foto || currentFood.image_url || '' // Keep old image
        };
        
        // Add description if field exists
        const descField = document.getElementById('description');
        if (descField && descField.value.trim()) {
            foodData.deskripsi = descField.value.trim();
        }
        
        console.log('📦 JSON data prepared (backend format):', foodData);
        console.log('📦 Separate is_aktif value:', isAktif);

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
        }

        // Send data to API
        console.log('📡 Updating food via API...');
        console.log('📡 Food ID to update:', foodId);
        console.log('📡 Food ID type:', typeof foodId);
        console.log('📡 Current food object:', currentFood);
        console.log('📡 JSON data to send:', JSON.stringify(foodData, null, 2));
        
        if (!foodId) {
            console.error('❌ Food ID is missing!');
            await Utils.showAlert('Error: ID makanan tidak valid', 'error');
            Utils.showLoading(false);
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            return false;
        }
        
        // Step 1: Update food data
        const response = await katalogService.updateFood(foodId, foodData);
        console.log('✅ API response:', response);
        
        // Step 2: Update status separately (backend has separate endpoint)
        if (currentFood.is_aktif !== isAktif) {
            console.log('🔄 Updating is_aktif status to:', isAktif);
            try {
                const statusResponse = await katalogService.updateStatus(foodId, isAktif);
                console.log('✅ Status updated:', statusResponse);
            } catch (statusError) {
                console.error('⚠️ Failed to update status:', statusError);
                // Continue anyway, main data is saved
            }
        }

        Utils.showLoading(false);
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;

        // Show success message
        await Utils.showAlert('Makanan berhasil diupdate!', 'success');

        // Redirect to catalog
        window.location.href = 'food-catalog.html';

    } catch (error) {
        console.error('❌ Error updating food:', error);
        Utils.showLoading(false);
        
        if (submitBtn) {
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
        }

        const errorMsg = Utils.handleApiError(error);
        await Utils.showAlert(`Gagal mengupdate makanan: ${errorMsg}`, 'error');
        
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('✨ Food Edit page loaded');
    
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
    
    // Load food data
    await loadFoodData();
    
    // Setup form submission
    const form = document.getElementById('foodForm') || document.getElementById('foodEditForm');
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
