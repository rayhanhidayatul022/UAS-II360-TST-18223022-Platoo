// Register using Voucher API only
let selectedRole = null;

// Role selection
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing event listeners...');

    // Image preview handler
    const fotoInput = document.getElementById('fotoRestoran');
    if (fotoInput) {
        fotoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Validasi ukuran file (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showMessage('Ukuran file terlalu besar! Maksimal 5MB', 'error');
                    this.value = '';
                    return;
                }

                // Validasi tipe file
                if (!file.type.startsWith('image/')) {
                    showMessage('File harus berupa gambar!', 'error');
                    this.value = '';
                    return;
                }

                // Preview gambar
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('imagePreview');
                    const previewImg = document.getElementById('previewImg');
                    previewImg.src = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Only for register.html with role selection
    const roleButtons = document.querySelectorAll('.role-btn');
    if (roleButtons.length > 0) {
        roleButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                selectedRole = this.dataset.role;
                console.log('Role selected:', selectedRole);
                
                // Update UI
                document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Show form
                setTimeout(() => {
                    document.getElementById('roleSelection').style.display = 'none';
                    document.getElementById('registerForm').style.display = 'block';
                    document.getElementById('userRole').value = selectedRole;
                    
                    // Show appropriate form section
                    if (selectedRole === 'pembeli') {
                        document.getElementById('pembeliForm').style.display = 'block';
                        document.getElementById('penjualForm').style.display = 'none';
                    } else {
                        document.getElementById('pembeliForm').style.display = 'none';
                        document.getElementById('penjualForm').style.display = 'block';
                    }
                }, 300);
            });
        });
    }

    // Back button (only in register.html)
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            console.log('Back button clicked');
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('roleSelection').style.display = 'block';
            document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
            selectedRole = null;
        });
    }

    // Form submission
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get role from hidden field or selected role
            const role = document.getElementById('userRole')?.value || selectedRole;
            console.log('Form submitted! Role:', role);
            
            // Remove previous messages
            const oldMessages = document.querySelectorAll('.error-message, .success-message');
            oldMessages.forEach(msg => msg.remove());
            
            const submitBtn = this.querySelector('.btn-submit');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Mendaftar...';
            
            try {
                if (role === 'pembeli') {
                    console.log('Calling registerPembeli...');
                    await registerPembeli();
                } else {
                    console.log('Calling registerPenjual...');
                    await registerPenjual();
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage('Terjadi kesalahan: ' + error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Daftar';
            }
        });
    }
    
    console.log('All event listeners initialized!');
});

async function registerPembeli() {
    const nama = document.getElementById('nama').value.trim();
    const telepon = document.getElementById('telepon').value.trim();
    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    console.log('RegisterPembeli called with:', { nama, telepon, email, username });
    
    // Validasi
    if (!nama || !telepon || !email || !username || !password) {
        showMessage('Semua field harus diisi!', 'error');
        return;
    }
    
    // Validasi email format
    if (!isValidEmail(email)) {
        showMessage('Format email tidak valid! Gunakan email yang proper (contoh: nama.anda@gmail.com)', 'error');
        return;
    }
    if (!emailRegex.test(email)) {
        showMessage('Format email tidak valid!', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('Password dan konfirmasi password tidak cocok!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password minimal 6 karakter!', 'error');
        return;
    }
    
    if (!validatePhone(telepon)) {
        showMessage('Format nomor telepon tidak valid!', 'error');
        return;
    }

    try {
        const result = await authService.register(email, password, nama);
        
        if (result.success) {
            showMessage('Registrasi berhasil! Silakan melakukan login.', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        } else {
            showMessage('Registrasi gagal. Silakan coba lagi.', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showMessage(error.message || 'Terjadi kesalahan saat registrasi.', 'error');
    }
}

async function registerPenjual() {
    const namaRestoran = document.getElementById('namaRestoran').value.trim();
    const email = document.getElementById('email').value.trim();
    const telepon = document.getElementById('telepon').value.trim();
    const alamat = document.getElementById('alamat').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const fotoInput = document.getElementById('fotoRestoran');
    const fotoFile = fotoInput ? fotoInput.files[0] : null;

    // Validasi
    if (!namaRestoran || !email || !telepon || !alamat || !password) {
        showMessage('Semua field harus diisi!', 'error');
        return;
    }
    
    // Validasi email format
    if (!isValidEmail(email)) {
        showMessage('Format email tidak valid! Gunakan email yang proper (contoh: nama.anda@gmail.com)', 'error');
        return;
    }

    if (fotoInput && !fotoFile) {
        showMessage('Foto restoran harus diupload!', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('Password dan konfirmasi password tidak cocok!', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('Password minimal 6 karakter!', 'error');
        return;
    }

    if (!validatePhone(telepon)) {
        showMessage('Format nomor telepon tidak valid!', 'error');
        return;
    }

    try {
        console.log('📤 Sending registration request:', { email, namaRestoran, role: 'ADMIN' });
        const result = await authService.register(email, password, namaRestoran, 'ADMIN');
        
        console.log('📥 Registration result:', result);
        
        if (result.success) {
            showMessage('Registrasi berhasil! Cek email Anda untuk konfirmasi, lalu login.', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        } else {
            console.error('❌ Registration failed:', result);
            showMessage(result.message || 'Registrasi gagal. Silakan coba lagi.', 'error');
        }
    } catch (error) {
        console.error('❌ Register error:', error);
        console.error('Error details:', {
            message: error.message,
            data: error.data,
            response: error.response,
            status: error.status
        });
        showMessage(error.message || error.data?.message || 'Terjadi kesalahan saat registrasi.', 'error');
    }
}

function validatePhone(phone) {
    // Format Indonesia: 08xxxxxxxxxx (minimal 10 digit)
    const phoneRegex = /^08\d{8,12}$/;
    return phoneRegex.test(phone);
}

function isValidEmail(email) {
    // Regex dasar
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return false;
    }
    
    // Validasi tambahan untuk Supabase:
    // 1. Minimal harus ada huruf (tidak hanya angka)
    // 2. Username minimal 3 karakter
    const [username, domain] = email.split('@');
    
    if (username.length < 3) {
        return false;
    }
    
    // Username harus mengandung minimal 1 huruf
    if (!/[a-zA-Z]/.test(username)) {
        return false;
    }
    
    // Domain harus valid (minimal ada titik dan 2 karakter setelah titik)
    const domainParts = domain.split('.');
    if (domainParts.length < 2 || domainParts[domainParts.length - 1].length < 2) {
        return false;
    }
    
    return true;
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
    messageDiv.textContent = message;
    
    const form = document.getElementById('registerForm');
    form.insertBefore(messageDiv, form.firstChild);
}
