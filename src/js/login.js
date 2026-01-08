// Login using Voucher API only
let currentRole = 'pembeli';
let modalShownThisPageLoad = false;

// Initialize testing accounts and modal on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing...');
    
    // Set user_type for testing accounts if not exists
    const testingAccounts = [
        { email: 'user@platoo.com', user_type: 'pembeli' },
        { email: 'admin@platoo.com', user_type: 'penjual' }
    ];
    
    testingAccounts.forEach(account => {
        const key = 'platoo_user_type_' + account.email;
        if (!localStorage.getItem(key)) {
            const info = {
                email: account.email,
                user_type: account.user_type,
                registered_at: new Date().toISOString()
            };
            localStorage.setItem(key, JSON.stringify(info));
            console.log('✅ Testing account initialized:', account.email);
        }
    });
    
    // Initialize modal
    const infoBtn = document.getElementById('infoBtn');
    const infoModal = document.getElementById('infoModal');
    const closeModal = document.querySelector('.close-modal');
    
    if (infoBtn && infoModal && closeModal) {
        console.log('✅ Modal elements found');
        
        // Auto-show modal on page load - ALWAYS show on every page load
        setTimeout(() => {
            console.log('📢 Showing modal automatically on page load');
            infoModal.style.display = 'flex';
            modalShownThisPageLoad = true;
        }, 800);
        
        // Button click handler
        infoBtn.addEventListener('click', () => {
            console.log('👆 Info button clicked');
            infoModal.style.display = 'flex';
        });
        
        // Close button handler
        closeModal.addEventListener('click', () => {
            console.log('❌ Close button clicked');
            infoModal.style.display = 'none';
        });
        
        // Click outside to close
        window.addEventListener('click', (e) => {
            if (e.target === infoModal) {
                console.log('👆 Clicked outside modal');
                infoModal.style.display = 'none';
            }
        });
    } else {
        console.error('❌ Modal elements not found:', { infoBtn, infoModal, closeModal });
    }
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        currentRole = this.dataset.role;
        
        // Update UI
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        // Update hidden field
        document.getElementById('userRole').value = currentRole;
        
        // Update label text
        const emailLabel = document.getElementById('emailLabel');
        const emailInput = document.getElementById('email');
        if (currentRole === 'penjual') {
            emailLabel.textContent = 'Email Restoran';
            emailInput.placeholder = 'Masukkan email restoran';
        } else {
            emailLabel.textContent = 'Email';
            emailInput.placeholder = 'Masukkan email Anda';
        }
    });
});

// Form submission
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get role from hidden field or currentRole
    const role = document.getElementById('userRole')?.value || currentRole;
    
    // Remove previous messages
    const oldMessages = document.querySelectorAll('.error-message, .success-message');
    oldMessages.forEach(msg => msg.remove());
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showMessage('Email dan password harus diisi!', 'error');
        return;
    }
    
    const submitBtn = this.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Login...';
    
    try {
        if (role === 'pembeli') {
            await loginPembeli(email, password);
        } else {
            await loginPenjual(email, password);
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Terjadi kesalahan: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
});

async function loginPembeli(email, password) {
    try {
        const result = await authService.login(email, password);
        
        console.log('Login result:', result);
        
        if (!result.success) {
            // Check if email not confirmed
            if (result.message && (result.message.includes('not confirmed') || result.data?.detail?.includes('not confirmed'))) {
                showMessage('Email belum dikonfirmasi! Silakan cek inbox email Anda dan klik link konfirmasi.', 'error');
            } else {
                showMessage(result.message || 'Email atau password salah!', 'error');
            }
            return;
        }
        
        if (!result.user) {
            showMessage('Data user tidak ditemukan!', 'error');
            return;
        }
        
        // Cek user_type dari localStorage (workaround karena backend tidak support role)
        const userTypeKey = 'platoo_user_type_' + email;
        const userTypeData = localStorage.getItem(userTypeKey);
        
        if (userTypeData) {
            const userType = JSON.parse(userTypeData);
            console.log('Found user_type in localStorage:', userType);
            
            // Jika user_type adalah penjual, redirect ke login penjual
            if (userType.user_type === 'penjual') {
                showMessage('Silakan login sebagai penjual!', 'error');
                // Switch to penjual tab
                document.querySelector('[data-role="penjual"]').click();
                return;
            }
        }

        // Save user data to localStorage
        localStorage.setItem('platoo_user', JSON.stringify({
            id: result.user.id,
            nama: result.user.full_name || result.user.email,
            email: result.user.email,
            role: 'pembeli'
        }));

        showMessage('Login berhasil! Mengalihkan...', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard-pembeli.html';
        }, 1500);
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Terjadi kesalahan saat login. Silakan coba lagi.', 'error');
    }
}

async function loginPenjual(email, password) {
    try {
        const result = await authService.login(email, password);
        
        console.log('Login result:', result);
        
        if (!result.success) {
            // Check if email not confirmed
            if (result.message && (result.message.includes('not confirmed') || result.data?.detail?.includes('not confirmed'))) {
                showMessage('Email belum dikonfirmasi! Silakan cek inbox email Anda dan klik link konfirmasi.', 'error');
            } else {
                showMessage(result.message || 'Email atau password salah!', 'error');
            }
            return;
        }
        
        if (!result.user) {
            showMessage('Data user tidak ditemukan!', 'error');
            return;
        }
        
        // Cek user_type dari localStorage (workaround karena backend tidak support role)
        const userTypeKey = 'platoo_user_type_' + email;
        const userTypeData = localStorage.getItem(userTypeKey);
        
        if (userTypeData) {
            const userType = JSON.parse(userTypeData);
            console.log('Found user_type in localStorage:', userType);
            
            // Validasi bahwa user ini adalah penjual
            if (userType.user_type !== 'penjual') {
                showMessage('Akun ini bukan akun penjual!', 'error');
                // Switch to pembeli tab
                document.querySelector('[data-role="pembeli"]').click();
                return;
            }
        } else {
            // Fallback: Jika tidak ada data user_type, tapi user login via tab penjual
            // Anggap dia penjual dan simpan info-nya
            console.log('No user_type found, creating penjual entry (fallback)');
            const penjualInfo = {
                email: email,
                user_type: 'penjual',
                registered_at: new Date().toISOString()
            };
            localStorage.setItem(userTypeKey, JSON.stringify(penjualInfo));
            console.log('✅ Penjual info saved to localStorage:', penjualInfo);
        }

        // Save user data to localStorage dengan role penjual
        localStorage.setItem('platoo_user', JSON.stringify({
            id: result.user.id,
            nama_restoran: result.user.full_name || result.user.email,
            email: result.user.email,
            alamat: '',
            role: 'penjual'
        }));

        showMessage('Login berhasil! Mengalihkan...', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard-penjual.html';
        }, 1500);
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Terjadi kesalahan saat login. Silakan coba lagi.', 'error');
    }
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
    messageDiv.textContent = message;
    
    const form = document.getElementById('loginForm');
    form.insertBefore(messageDiv, form.firstChild);
}