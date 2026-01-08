// Login using Voucher API only
let currentRole = 'pembeli';

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
        
        // Check if user is pembeli (USER role)
        if (result.user.role !== 'USER') {
            showMessage('Akun tidak ditemukan.', 'error');
            await authService.logout();
            return;
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
        
        // Check if user is penjual (ADMIN role)
        if (result.user.role !== 'ADMIN') {
            showMessage('Akun tidak ditemukan.', 'error');
            await authService.logout();
            return;
        }

        // Save user data to localStorage
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