# Dokumentasi Arsitektur: Pemisahan Landing Page (SEO & Marketing) dan Web App GIS (LineSima)

## 📌 Ringkasan Eksekutif
Untuk meningkatkan performa **SEO (Search Engine Optimization)**, **AEO (Answer Engine Optimization)**, dan efisiensi konversi **Marketing**, codebase **LineSima (Land Scaler System)** telah dipisahkan secara terstruktur ke dalam dua folder utama:
1. `client/src/landing/` — Khusus untuk Landing Page, Edukasi, Blog, SEO Meta, AEO Schema, dan Strategi Pemasaran.
2. `client/src/app/` — Khusus untuk Aplikasi Utama Web App GIS (Digitasi Map, Generator Shapefile OSS, AMDALNET Suite, dan Admin Panel).

Kedua modul ini saling terhubung secara seamless melalui **React Router** dan navigasi interaktif dua arah.

---

## 🗂️ Struktur Direktori Proyek

```text
client/src/
├── landing/                       # 🚀 LANDING PAGE, SEO & MARKETING FOCUS
│   ├── seo/
│   │   └── SEOHead.jsx            # Generasi Meta Tags, OpenGraph, & Schema.org JSON-LD
│   ├── components/
│   │   ├── AEOEngine.jsx          # AI Search Engine Optimization (ChatGPT, Perplexity, Gemini)
│   │   ├── LandingNavbar.jsx      # Navigation Bar khusus Landing Page dengan CTA ke GIS App
│   │   └── LandingFooter.jsx      # Footer SEO-friendly dengan internal linking
│   └── pages/
│       ├── LandingPage.jsx        # Landing Page utama (Hero Section, Features, Video, Testimoni)
│       ├── PaymentInfoPage.jsx    # Informasi Harga, Free Tier ≤ 50 m², & Top Up Token QRIS
│       └── BlogPostPage.jsx       # Reader Artikel Blog & Tutorial GIS / NIB OSS
│
├── app/                           # 🗺️ WEB APP GIS APPLICATION FOCUS
│   └── pages/
│       ├── DashboardPage.jsx      # GIS Digitasi Workspace (Leaflet, Multi-Basemap, Export OSS/AMDAL)
│       ├── KelolaPage.jsx         # Panel Admin Pengelolaan User, Transaksi, & Token Balance
│       └── AdminAEOPage.jsx       # Panel Admin Pengaturan Skenario AEO
│
├── components/                    # Core UI Component Library (Shadcn/UI, DigitasiMap, AmdalnetExportPanel)
├── context/                       # State AuthContext (Token balance, User role, JWT Session)
├── config/                        # Shared Business Rules (FREE_TIER_AREA_M2 = 50, Basemaps, Export Costs)
└── App.jsx                        # Master Router (Menghubungkan Rute Landing & Web App)
```

---

## 🔗 Hubungan & Navigasi Antara Landing Page dan Web App GIS

```mermaid
graph TD
    subgraph Landing Page Domain (SEO & Marketing)
        A[LandingPage.jsx - Rute /] -->|Klik CTA / Auth| B[DashboardPage.jsx - Rute /dashboard]
        A -->|Lihat Pricing| C[PaymentInfoPage.jsx - Rute /payment]
        A -->|Baca Artikel| D[BlogPostPage.jsx - Rute /blog/:slug]
        C -->|Pesan Jasa / Topup| B
    end

    subgraph Web App GIS Domain
        B -->|Navigasi Header '← Landing Page'| A
        B -->|Topup Token Modal| C
        B -->|Admin Only| E[KelolaPage.jsx - Rute /kelola]
        B -->|Admin Only| F[AdminAEOPage.jsx - Rute /admin/aeo]
    end
```

### 1. Dari Landing Page ke Web App GIS
* **Call to Action (CTA)**: Tombol `[ Buka Web App GIS ]`, `Mulai Gratis (≤50m²)`, dan `[ > MASUK SISTEM ]` mengarahkan pengguna secara instan ke rute `/dashboard`.
* **Sistem Autentikasi**: Pengguna dapat melakukan login langsung di Landing Page dan akan otomatis di-redirect ke Web App GIS sesuai role (`/dashboard` untuk user biasa, `/kelola` untuk admin).

### 2. Dari Web App GIS ke Landing Page
* **Navigasi Header**: Pada bagian kiri atas header `Dashboard.jsx`, terdapat link navigasi `← Landing Page` yang memungkinkan pengguna aplikasi kembali ke halaman publik dengan satu klik.

---

## 🚀 Optimasi SEO & AEO (Answer Engine Optimization)

### 1. `SEOHead.jsx`
Mengelola seluruh metadeta halaman publik secara terpusat:
* **Meta Title & Description**: Disesuaikan dengan target kata kunci berdaya konversi tinggi (*"Buat Polygon NIB OSS & Peta Tanah Online"*).
* **OpenGraph & Twitter Cards**: Tampilan visual menarik saat link dibagikan melalui WhatsApp, Twitter, atau LinkedIn.
* **Schema.org Structured Data**: Skema `SoftwareApplication` dan `Organization` terintegrasi.

### 2. `AEOEngine.jsx`
Dirancang khusus untuk mengoptimalkan visibilitas pada **AI Answer Engines (Google SGE, ChatGPT, Perplexity, Gemini)**:
* Memuat skenario solusi geospasial secara dinamis dari database.
* Meng-inject skema JSON-LD `FAQPage` secara otomatis ke dalam `<head>`.
* Menyediakan semantic HTML tersembunyi (`sr-only`) yang dapat dibaca dengan sempurna oleh crawler AI.

---

## 📊 Matriks Fitur & Distribusi Modul

| Modul / Fitur | Lokasi File | Fokus Utama |
| :--- | :--- | :--- |
| **Hero & Marketing Copy** | `client/src/landing/pages/LandingPage.jsx` | Konversi Pengunjung & SEO |
| **AEO Schema Generator** | `client/src/landing/components/AEOEngine.jsx` | Ranking AI Search Engines |
| **Pricing & Top Up Info** | `client/src/landing/pages/PaymentInfoPage.jsx` | Penjualan Token & Transparency |
| **Blog & Tutorial Reader** | `client/src/landing/pages/BlogPostPage.jsx` | Organic Traffic & Educational Content |
| **GIS Digitasi Canvas** | `client/src/app/pages/DashboardPage.jsx` | Eksekusi Pembuatan Polygon SHP & PDF |
| **AMDALNET Export Suite** | `client/src/components/AmdalnetExportPanel.jsx` | Ekspor Spesifik AMDALNET EPSG:3857 |
| **Multi-Basemap Switcher** | `client/src/components/DigitasiMap.jsx` | visualisasi Peta Citra Satelit / BPN |

---

## 🛠️ Langkah Menjalankan & Verifikasi

1. **Menjalankan Dev Server**:
   ```bash
   # Jalankan Server Backend Node.js
   node server/server.js

   # Menjalankan Client Vite React (secara terpisah)
   cd client && npm run dev
   ```

2. **Memverifikasi Build**:
   ```bash
   npm --prefix client run build
   ```
   *Status Build*: **Sukses (0 Errors)**.

---
*Dokumentasi ini dibuat secara otomatis sebagai panduan resmi arsitektur pemisahan Landing Page & Web App LineSima.*
