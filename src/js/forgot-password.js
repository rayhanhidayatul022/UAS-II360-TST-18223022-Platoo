const SUPABASE_URL = 'https://nxamzwahwgakiatujxug.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YW16d2Fod2dha2lhdHVqeHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMDkwMjcsImV4cCI6MjA4MDU4NTAyN30.9nBRbYXKJmLcWbKcx0iICDNisdQNCg0dFjI_JGVt5pk';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase initialized for forgot-password');

// Fungsi untuk menampilkan modal fitur dalam pengembangan
function showDevelopmentModal() {
    const modal = document.getElementById('developmentModal');
    if (modal) {
        modal.style.display = 'flex';
        console.log('✅ Modal ditampilkan');
    } else {
        console.error('❌ Modal tidak ditemukan');
    }
}

// Fungsi untuk menutup modal
function closeModal() {
    const modal = document.getElementById('developmentModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Handle form submission
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('forgotPasswordForm');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🔔 Form submitted - menampilkan modal');
            
            // Tampilkan modal fitur dalam pengembangan
            showDevelopmentModal();
            
            return false;
        });
        
        console.log('✅ Event listener form terpasang');
    } else {
        console.error('❌ Form tidak ditemukan');
    }
    
    // Tutup modal jika klik di luar modal content
    const modal = document.getElementById('developmentModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
});

console.log('✅ Forgot password page loaded successfully!');
