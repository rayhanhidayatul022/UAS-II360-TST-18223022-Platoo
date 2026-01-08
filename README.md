<div align="center">
  <br />
    <a href="#" target="_blank">
      <img src="src/img/logoPlatoo.png" alt="Platoo Banner" width="200"/>
    </a>
  <br />

  <br>
  <div>
    <img src="https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
    <img src="https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
    <img src="https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E" alt="JavaScript" />
    <img src="https://img.shields.io/badge/supabase-3ECF8E.svg?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  </div>

  <h3 align="center">Platoo : Platform Food Waste Reduction</h3>

  <div align="center">
    Platoo adalah <b>Web Application</b> berbasis <b>Vanilla JavaScript</b><br/>
    yang dirancang untuk mengurangi food waste dengan menghubungkan restoran<br/>
    dan konsumen dalam satu ekosistem terintegrasi.<br/>
    <b>#StartFromYourPlate</b>
  </div>

  <br/>

  <div align="center">
    🚀 <a href="https://platoo-tst.vercel.app/" target="_blank"><b>Live Demo</b></a> &nbsp;•&nbsp;
    📦 <a href="#-how-to-run"><b>Local Setup</b></a> &nbsp;•&nbsp;
    🎓 <b>Tugas 3 - Teknologi Sistem Terintegrasi</b>
  </div>
</div>

---

## 👥 Anggota Tim

| NIM | Nama | Role |
|-----|------|------|
| **18223022** | Rayhan Hidayatul Fikri | Voucher Service & Frontend Integration |
| **18223044** | Princessfa Azzahra Alvin | Katalog Makanan Service & Frontend Integration |

---

## 📑 Table of Contents
1. [🍽️ Tentang Platoo](#️-tentang-platoo)
2. [✨ Fitur Utama](#-fitur-utama)
3. [🏗️ Arsitektur Sistem](#️-arsitektur-sistem)
4. [🔐 Autentikasi & Otorisasi](#-autentikasi--otorisasi)
5. [🛠️ Teknologi](#️-teknologi)
6. [🚀 How to Run](#-how-to-run)
7. [🎯 Akun Testing](#-akun-testing)

---

## 🍽️ Tentang Platoo

**Platoo** hadir sebagai solusi digital untuk mengatasi permasalahan **food waste** melalui distribusi dan pemanfaatan makanan tidak terjual. Platform ini menghubungkan restoran dengan konsumen dalam satu ekosistem terintegrasi.

### 🎯 Konsep Utama

**Kurangi Food Waste ➜ Hemat Biaya ➜ Peduli Lingkungan**

Restoran dapat mempublikasikan makanan yang masih layak konsumsi namun berisiko tidak terjual (mendekati masa kedaluwarsa atau stok berlebih), sementara konsumen mendapatkan makanan berkualitas dengan harga lebih terjangkau.

### 💡 Filosofi Nama

*Platoo* berasal dari kata **"Plato"** (piring) yang melambangkan tempat di mana makanan disajikan, dengan penambahan "o" untuk memberikan kesan modern dan mudah diingat. Tagline **#StartFromYourPlate** mengajak setiap orang untuk memulai perubahan dari piring mereka sendiri.

---

## ✨ Fitur Utama

### 👤 Untuk Pembeli
- 🛒 **Browse Katalog Makanan** - Lihat makanan dari berbagai restoran
- 🔍 **Filter & Search** - Cari makanan berdasarkan ketersediaan stok
- 🛍️ **Keranjang Belanja** - Kelola pesanan dengan mudah
- 💳 **Checkout dengan Voucher** - Gunakan voucher untuk diskon tambahan
- 📊 **Dashboard Interaktif** - Kelola akun dan pesanan

### 🏪 Untuk Penjual/Restoran
- ➕ **Manajemen Katalog** - Tambah, edit, hapus menu makanan
- 📸 **Upload Foto Produk** - Tampilkan menu dengan foto menarik
- 📦 **Kelola Stok** - Update ketersediaan produk real-time
- 🎫 **Manajemen Voucher** - Buat dan kelola voucher diskon
- 💰 **Atur Harga & Diskon** - Kontrol pricing strategy
- 📋 **Kelola Pesanan** - Monitor dan proses pesanan masuk

### 🔐 Sistem Autentikasi
- 📝 **Register & Login** - Sistem autentikasi terpisah untuk Pembeli dan Penjual
- 🔑 **JWT Authentication** - Keamanan dengan token-based auth
- 👥 **Role-Based Access** - Pembatasan akses berdasarkan role user

---

## 🏗️ Arsitektur Sistem

### Microservices Architecture

```
┌─────────────────┐
│   Frontend      │
│  (Vanilla JS)   │
└────────┬────────┘
         │
         ├──────────┐
         │          │
    ┌────▼─────┐ ┌─▼──────────┐
    │ Voucher  │ │  Katalog   │
    │ Service  │ │  Makanan   │
    │ (API 1)  │ │  (API 2)   │
    └────┬─────┘ └─┬──────────┘
         │         │
         └────┬────┘
              │
        ┌─────▼─────┐
        │  Supabase │
        │ (Database)│
        └───────────┘
```

### API Endpoints

#### 🎫 Voucher Service
- `GET /vouchers` - List semua voucher
- `GET /vouchers/:code` - Detail voucher by code
- `POST /vouchers` - Create voucher (Admin only)
- `POST /vouchers/:code/redeem` - Redeem voucher (User only)
- `PUT /vouchers/:id` - Update voucher (Admin only)
- `DELETE /vouchers/:id` - Delete voucher (Admin only)

#### 🍔 Katalog Makanan Service
- `GET /` - List semua makanan
- `GET /makanan/:id` - Detail makanan by ID
- `POST /` - Create makanan (Admin only)
- `PUT /makanan/:id` - Update makanan (Admin only)
- `DELETE /makanan/:id` - Delete makanan (Admin only)

#### 🔐 Authentication Service
- `POST /auth/register` - Register user baru
- `POST /auth/login` - Login user

---

## 🔐 Autentikasi & Otorisasi

### Role-Based Access Control

| Role | Akses |
|------|-------|
| **Pembeli (USER)** | Browse katalog, checkout, gunakan voucher |
| **Penjual (ADMIN)** | Kelola katalog, buat voucher, lihat pesanan |

### Authentication Flow

1. User register dengan role (Pembeli/Penjual)
2. Login menggunakan email & password
3. Backend generate JWT token
4. Token disimpan di localStorage
5. Setiap request ke protected endpoint menyertakan token
6. Backend verify token dan check role

---

## 🛠️ Teknologi

### Frontend
- **HTML5** - Struktur halaman
- **CSS3** - Styling dan animasi
- **Vanilla JavaScript** - Logic dan interaksi
- **Fetch API** - HTTP requests

### Backend & Services
- **Node.js + Express** - REST API server
- **Supabase Auth** - Authentication system
- **Supabase Database** - PostgreSQL database
- **Docker** - Containerization untuk deployment

### Deployment
- **Frontend**: Vercel
- **Backend**: Self-hosted dengan Docker di STB (Server Tim Belantara)

### Tools & Libraries
- Git & GitHub - Version control
- VS Code - Code editor
- Postman - API testing

---

## 🚀 How to Run

### Prerequisites
```bash
# Install Live Server (VSCode Extension) atau
npm install -g live-server
```

### Clone Repository
```bash
git clone https://github.com/rayhanhidayatul022/UAS-II360-TST-18223022-Platoo.git
cd UAS-II360-TST-18223022-Platoo
```

### Konfigurasi API (Optional)
File konfigurasi API sudah ada di `src/js/config/api-config.js`:
```javascript
const API_CONFIG = {
    KATALOG_BASE_URL: 'https://18223044.tesatepadang.space',
    VOUCHER_BASE_URL: 'https://18223022.tesatepadang.space',
    // ...
};
```

### Run Development Server

#### Opsi 1: Using Live Server (VSCode Extension)
1. Buka folder project di VS Code
2. Klik kanan pada `index.html`
3. Pilih "Open with Live Server"
4. Browser akan otomatis membuka `http://localhost:5500`

#### Opsi 2: Using live-server CLI
```bash
live-server
```

#### Opsi 3: Simple Python Server
```bash
# Python 3
python -m http.server 8000

# Buka browser: http://localhost:8000
```

### Struktur Folder
```
UAS-II360-TST-18223022-Platoo/
├── index.html                 # Landing page
├── login.html                 # Halaman login
├── register.html             # Halaman register
├── dashboard-pembeli.html    # Dashboard pembeli
├── dashboard-penjual.html    # Dashboard penjual
├── checkout.html             # Halaman checkout
├── src/
│   ├── css/                  # Styling files
│   ├── js/
│   │   ├── config/          # API configuration
│   │   ├── services/        # API service layer
│   │   ├── utils/           # Utility functions
│   │   └── *.js            # Page-specific scripts
│   └── img/                 # Images & assets
└── README.md
```

---

## 🎯 Akun Testing

Untuk memudahkan testing aplikasi, tersedia akun demo:

### 👤 Akun Pembeli
```
Email    : user@platoo.com
Password : 123456
```

### 🏪 Akun Penjual
```
Email    : admin@platoo.com
Password : 123456
```

> 💡 **Catatan**: Akun testing akan otomatis ditampilkan dalam popup saat membuka halaman login/register

---

## 📸 Screenshots

> 🚧 Coming soon...

---

## 🎓 Garis Besar Tugas 3

### Integrasi Layanan

Untuk pemenuhan Tugas 3, masing-masing anggota kelompok telah:

1. **Mempelajari** layanan yang telah dibuat beserta API endpoint dan backend yang di-deploy pada STB
2. **Mengintegrasikan** kedua layanan (Voucher & Katalog) pada satu frontend
3. **Membangun** layanan Checkout untuk memanggil API endpoint dari kedua service
4. **Mengimplementasikan** autentikasi dan otorisasi untuk akses layanan (Bonus)

### Pembagian Tugas Frontend

| Halaman | Deskripsi | PIC |
|---------|-----------|-----|
| **Catalog Pembeli** | Mengambil semua data katalog makanan dari API | Rayhan Hidayatul Fikri |
| **Checkout & Voucher** | Implementasi pembayaran dan penggunaan voucher | Princessfa Azzahra Alvin |

---

## 🔗 Links

- 🌐 **Live Demo**: [https://platoo-tst.vercel.app/](https://platoo-tst.vercel.app/)
- 📦 **Repository**: [GitHub](https://github.com/rayhanhidayatul022/UAS-II360-TST-18223022-Platoo)
- 🎫 **Voucher Service API**: `https://18223022.tesatepadang.space`
- 🍔 **Katalog Service API**: `https://18223044.tesatepadang.space`

---

## 📝 License

Tugas 3 - Teknologi Sistem Terintegrasi  
© 2025 Rayhan Hidayatul Fikri & Princessfa Azzahra Alvin

---

<div align="center">
  <br/>
  <b>Platoo - Selamatkan Rasa, Selamatkan Bumi</b><br/>
  <b>#StartFromYourPlate</b> 🍽️
  <br/><br/>
</div>
