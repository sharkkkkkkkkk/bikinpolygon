# REFACTOR ARCHITECTURE — LINESIMA

## Landing Page SEO/Marketing + Web App GIS

## 1. KONTEKS

Project ini adalah **LineSima (Land Scaler System)**, aplikasi GIS untuk membantu pembuatan polygon dan Shapefile untuk kebutuhan OSS RBA, AMDALNET, serta kebutuhan geospasial lainnya.

Codebase saat ini menggunakan:

- React 19
- Vite
- React Router
- Tailwind CSS
- Leaflet
- React-Leaflet
- Leaflet Draw
- Turf.js
- @mapbox/shp-write
- pdf-lib
- Dexie.js / IndexedDB
- Node.js
- Express 5
- Supabase
- JWT
- bcrypt
- Gemini
- Mistral

Saat ini Landing Page dan Web App sudah dipisahkan secara **logical/module**, tetapi masih berada di dalam satu aplikasi React melalui:

```text
client/src/landing/
client/src/app/
```

dan masih menggunakan satu `App.jsx` / React Router.

Dokumentasi existing menunjukkan pemisahan tersebut, tetapi target akhir project harus ditingkatkan menjadi **dua aplikasi frontend yang benar-benar terpisah secara runtime**, bukan hanya pemisahan folder.

---

# 2. TUJUAN UTAMA

Refactor project menjadi:

```text
LANDING PAGE
=
SEO + MARKETING + CONTENT + AEO + CONVERSION

WEB APP
=
AUTH + GIS + GENERATOR + TOKEN + USER WORKSPACE

SERVER
=
API + BUSINESS LOGIC + SECURITY + DATABASE
```

Target production secara konseptual:

```text
https://linesima.com
```

untuk Landing Page.

```text
https://app.linesima.com
```

untuk Web App.

Namun untuk tahap ini:

> **JANGAN melakukan deployment production.**

Semua harus terlebih dahulu berjalan dan diuji secara lokal.

---

# 3. TARGET ARSITEKTUR FINAL

Ubah struktur existing menjadi:

```text
polygon/
│
├── package.json
├── vercel.json
│
├── landing-page/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── pages/
│       │   ├── LandingPage.jsx
│       │   ├── PricingPage.jsx
│       │   ├── BlogPage.jsx
│       │   ├── BlogPostPage.jsx
│       │   ├── GuidePage.jsx
│       │   ├── GuideDetailPage.jsx
│       │   ├── FAQPage.jsx
│       │   └── AboutPage.jsx
│       │
│       ├── components/
│       │   ├── LandingNavbar.jsx
│       │   ├── LandingFooter.jsx
│       │   ├── Hero.jsx
│       │   ├── CTA.jsx
│       │   ├── FeatureSection.jsx
│       │   ├── FAQSection.jsx
│       │   └── BlogCard.jsx
│       │
│       ├── seo/
│       │   └── SEOHead.jsx
│       │
│       └── lib/
│
├── web-app/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       │
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── DashboardPage.jsx
│       │   ├── TopUpPage.jsx
│       │   ├── HistoryPage.jsx
│       │   ├── AccountPage.jsx
│       │   ├── KelolaPage.jsx
│       │   └── AdminAEOPage.jsx
│       │
│       ├── components/
│       │   ├── DigitasiMap.jsx
│       │   ├── AmdalnetExportPanel.jsx
│       │   ├── PaymentModal.jsx
│       │   ├── DisclaimerModal.jsx
│       │   └── ...
│       │
│       ├── modules/
│       │   └── amdalnet/
│       │
│       ├── context/
│       │   └── AuthContext.jsx
│       │
│       ├── lib/
│       │   ├── api.js
│       │   └── supabase.js
│       │
│       ├── config/
│       │   ├── businessRules.js
│       │   ├── exportCosts.js
│       │   └── basemaps.js
│       │
│       └── db.js
│
└── server/
    ├── package.json
    ├── server.js
    └── routes/
        ├── auth.js
        ├── generator.js
        ├── kelola.js
        └── aeo.js
```

Jika struktur existing memiliki file dengan nama berbeda, lakukan mapping berdasarkan fungsi, bukan sekadar berdasarkan nama.

---

# 4. WAJIB: DUA VITE APP TERPISAH

Ini merupakan perubahan paling penting.

Jangan lagi menggunakan:

```text
client/src/landing/
client/src/app/
```

sebagai dua modul di dalam satu SPA.

Harus menjadi:

```text
landing-page/
web-app/
```

yang masing-masing memiliki:

```text
package.json
vite.config.js
index.html
src/main.jsx
src/App.jsx
```

Artinya:

```text
Landing Page
```

adalah satu frontend application.

Dan:

```text
Web App
```

adalah frontend application kedua.

Keduanya tetap menggunakan backend yang sama.

---

# 5. LOCAL DEVELOPMENT

Untuk local development gunakan:

```text
Landing Page
http://localhost:5173
```

```text
Web App
http://localhost:5174
```

```text
Backend
http://localhost:5000
```

Jika port existing berbeda, boleh menggunakan port alternatif selama tiga service tetap terpisah.

Target:

```text
localhost:5173
        │
        │ CTA / Login
        ▼
localhost:5174
        │
        ▼
localhost:5000/api
```

---

# 6. ROUTER HARUS TERPISAH

Jangan lagi menggunakan satu:

```text
client/src/App.jsx
```

sebagai master router untuk Landing dan Web App.

Landing memiliki router sendiri:

```text
landing-page/src/App.jsx
```

Contoh:

```text
/
 /solusi
 /fitur
 /harga
 /blog
 /blog/:slug
 /panduan
 /panduan/:slug
 /faq
 /tentang
```

Web App memiliki router sendiri:

```text
web-app/src/App.jsx
```

Contoh:

```text
/login
/register
/dashboard
/digitasi
/generator
/amdalnet
/topup
/riwayat
/account
/kelola
/admin/aeo
```

---

# 7. JANGAN GUNAKAN REACT ROUTER UNTUK MENYATUKAN KEDUANYA

Jangan melakukan:

```text
linesima.com/dashboard
```

melalui router Landing.

Jangan melakukan:

```text
linesima.com/login
```

melalui router Landing.

Sebaliknya gunakan navigation antar aplikasi:

```text
Landing
localhost:5173
       │
       │ window.location / anchor
       ▼
Web App
localhost:5174/login
```

Production nanti:

```text
linesima.com
       │
       ▼
app.linesima.com/login
```

Gunakan environment variable untuk URL.

---

# 8. DOMAIN BOUNDARY

Target:

```text
linesima.com
```

memiliki tanggung jawab:

```text
SEO
Marketing
Content
Blog
Panduan
FAQ
Pricing
AEO
Conversion
```

Target:

```text
app.linesima.com
```

memiliki tanggung jawab:

```text
Authentication
Dashboard
GIS
Digitasi
Generator
AMDALNET
Token
Top Up
History
Account
Admin
```

Jangan mencampurkan tanggung jawab tersebut.

---

# 9. LANDING PAGE

Pindahkan/adaptasikan fungsi berikut ke Landing Page:

```text
LandingPage.jsx
BlogPostPage.jsx
SEOHead.jsx
AEOEngine.jsx
LandingNavbar.jsx
LandingFooter.jsx
```

Landing Page harus menjadi **SEO Content Hub**.

Struktur:

```text
/
 /solusi/
 /fitur/
 /harga/
 /blog/
 /blog/:slug
 /panduan/
 /panduan/:slug
 /faq/
 /tentang/
```

---

# 10. LANDING PAGE TIDAK BOLEH MENJADI DASHBOARD

Landing Page tidak boleh memiliki:

- GIS workspace
- Leaflet Draw
- polygon editor
- generator SHP
- AMDALNET export
- token deduction
- dashboard user
- admin dashboard
- IndexedDB aplikasi

Landing Page hanya membutuhkan functionality publik yang relevan.

---

# 11. WEB APP

Pindahkan/adaptasikan fungsi aplikasi ke Web App:

```text
DashboardPage.jsx
DigitasiMap.jsx
AmdalnetExportPanel.jsx
PaymentModal.jsx
DisclaimerModal.jsx
AuthContext.jsx
db.js
modules/amdalnet/*
KelolaPage.jsx
AdminAEOPage.jsx
```

Web App menjadi pure product application.

---

# 12. AUTHENTICATION

Authentication **hanya berada di Web App**.

Landing Page tidak melakukan login penuh.

Landing Page cukup menyediakan:

```text
[ Mulai Gratis ]
[ Login ]
```

yang mengarahkan ke:

```text
http://localhost:5174/register
http://localhost:5174/login
```

Production:

```text
https://app.linesima.com/register
https://app.linesima.com/login
```

Pertahankan sistem existing:

- JWT
- bcrypt
- AuthContext
- protected route
- admin route
- user role
- token balance

Jangan membuat sistem authentication baru.

---

# 13. NAVIGASI DARI WEB APP KE LANDING

Web App boleh memiliki:

```text
← Kembali ke LineSima
```

yang mengarah ke:

```text
http://localhost:5173
```

Production:

```text
https://linesima.com
```

Gunakan environment variable.

Jangan menggunakan React Router untuk berpindah antar aplikasi.

---

# 14. PRICING

Pricing harus berada di Landing Page:

```text
linesima.com/harga
```

atau lokal:

```text
localhost:5173/harga
```

Landing Page menjelaskan:

- Free Tier
- Token
- Harga token
- Fitur
- batasan
- FAQ pricing

Tetapi proses transaksi/top-up berada di Web App.

---

# 15. TOP UP

Top Up merupakan fungsi aplikasi.

Flow:

```text
Landing
   │
   ▼
Harga
   │
   ▼
[ Top Up / Mulai Sekarang ]
   │
   ▼
Web App
   │
   ▼
Login/Register
   │
   ▼
Top Up
```

Jangan menjalankan proses payment/token mutation dari Landing Page.

Gunakan:

```text
web-app/src/pages/TopUpPage.jsx
```

dan/atau `PaymentModal.jsx` existing.

---

# 16. FREE TIER 50 m²

Implementasikan business rule:

```text
FREE_TIER_AREA_M2 = 50
```

Aturan:

```text
area <= 50 m²
    → FREE

area > 50 m²
    → TOKEN REQUIRED
```

Tidak ada perubahan terhadap sistem token existing selain menambahkan gate ini.

---

# 17. BACKEND ADALAH SOURCE OF TRUTH

Jangan percaya nilai area yang dikirim frontend.

Frontend dapat mengirim:

```json
{
  "coordinates": [...]
}
```

Backend harus:

1. validate geometry
2. calculate area
3. compare dengan 50 m²
4. check token
5. authorize export
6. deduct token jika diperlukan
7. generate/authorize file

Jangan hanya menerima:

```json
{
  "area": 10
}
```

sebagai dasar authorization.

User tidak boleh dapat bypass dengan mengubah nilai area dari DevTools.

---

# 18. EXPORT AUTHORIZATION

Buat centralized export authorization/business logic.

Konsep:

```text
authorizeExport(user, geometry, exportType)
```

Flow:

```text
Request Export
      │
      ▼
Validate Auth
      │
      ▼
Validate Geometry
      │
      ▼
Calculate Area
      │
      ├───────────────┐
      │               │
   <= 50 m²         > 50 m²
      │               │
      ▼               ▼
    FREE         Check Token
                      │
                ┌─────┴─────┐
                │           │
             Enough      Not Enough
                │           │
                ▼           ▼
             Deduct       Reject
                │
                ▼
             Export
```

---

# 19. TOKEN SYSTEM

Gunakan sistem token existing.

Jangan membuat:

```text
new wallet
new token system
new balance system
```

Audit dan reuse:

- balance
- token deduction
- transaction
- PaymentModal
- top-up
- user data
- Supabase

Jika diperlukan, buat service terpusat agar deduction tidak tersebar di banyak endpoint.

---

# 20. EXPORT COST

Gunakan biaya existing.

Codebase sebelumnya menunjukkan beberapa export seperti:

```text
File OSS = 5 Token
Cetak PDF = 5 Token
```

Jangan mengubah nilai tersebut kecuali memang terdapat business rule terbaru di codebase.

Jangan menulis:

```text
5
```

di banyak component.

Gunakan centralized configuration.

Contoh:

```js
EXPORT_COSTS = {
  OSS_SHP: 5,
  PDF: 5,
  AMDALNET_SHP: 5,
  AMDALNET_PDF: 5
}
```

Sesuaikan dengan biaya aktual yang ditemukan saat audit codebase.

---

# 21. FREE TIER HARUS KONSISTEN UNTUK EXPORT

Audit semua jalur:

```text
OSS SHP
PDF
AMDALNET SHP
AMDALNET PDF
Image Export
```

Tentukan mana yang memang menggunakan token.

Jangan biarkan satu jalur:

```text
>50 m² → token
```

sementara jalur lain:

```text
>50 m² → bypass
```

Jika fitur export tertentu memang gratis secara bisnis, dokumentasikan secara eksplisit.

---

# 22. PERBAIKI AMDALNET TOKEN BYPASS

Codebase sebelumnya ditemukan memiliki masalah:

```text
AMDALNET export berjalan client-side
```

sehingga dapat melewati pemotongan token.

Audit dan perbaiki.

Jangan:

```text
generate file
↓
baru deduct token
```

Gunakan authorization yang aman.

Tujuan:

```text
User tidak boleh mendapatkan export berbayar
tanpa authorization token.
```

---

# 23. IDEMPOTENCY TOKEN

Cegah token terpotong dua kali akibat:

- double click
- network retry
- browser retry
- request timeout
- duplicate request

Gunakan transaction-safe logic atau idempotency key.

Contoh:

```text
export_request_id
```

Satu request hanya boleh menghasilkan satu deduction.

---

# 24. FREE TIER UX

Jika area:

```text
42.5 m²
```

tampilkan:

```text
FREE TIER

Luas polygon:
42,5 m²

Batas gratis:
50 m²

Polygon memenuhi Free Tier.

[ Download SHP ]
```

---

# 25. PAID UX

Jika:

```text
125 m²
```

tampilkan:

```text
TOKEN REQUIRED

Luas polygon:
125 m²

Batas Free Tier:
50 m²

Saldo:
12 Token

Biaya export:
5 Token

[ Export dengan 5 Token ]
[ Top Up Token ]
```

Jika token tidak cukup:

```text
Saldo:
2 Token

Biaya:
5 Token

[ Top Up Token ]
```

Jangan menampilkan error teknis kepada user.

---

# 26. MULTI-BASEMAP

Pertahankan dan tingkatkan fitur Multi-Basemap pada Web App.

Basemap harus hanya berada di:

```text
web-app/
```

bukan Landing Page.

Minimal sediakan beberapa provider yang memang dapat digunakan secara gratis/open atau sesuai free-tier/provider terms.

Contoh kandidat:

```text
OpenStreetMap
OpenTopoMap
CARTO Light
CARTO Dark
Esri World Imagery
Esri World Topographic
```

Namun:

> Jangan menganggap semua provider tersebut unlimited/free untuk production.

Sebelum provider digunakan, periksa:

- license
- attribution
- rate limit
- commercial-use policy
- API key requirement
- production restrictions

---

# 27. BASEMAP CONFIG

Jangan menyebarkan tile URL ke component.

Buat:

```text
web-app/src/config/basemaps.js
```

Format konfigurasi minimal:

```js
{
  id: "osm",
  name: "OpenStreetMap",
  type: "tile",
  url: "...",
  attribution: "...",
  maxZoom: 19,
  requiresApiKey: false,
  enabled: true
}
```

Tambahkan metadata provider jika berguna:

```text
license
usagePolicy
requiresApiKey
environment
```

---

# 28. ATTRIBUTION

Attribution harus selalu terlihat sesuai requirement provider.

Jangan:

- menyembunyikan attribution
- menghapus attribution
- menutup attribution dengan UI
- menggunakan tile provider tanpa mematuhi ketentuannya

Untuk OpenStreetMap gunakan attribution yang sesuai kebijakan mereka.

Jangan melakukan bulk tile download atau prefetch.

---

# 29. BASEMAP SWITCHER

UI selector:

```text
BASEMAP

○ Street
○ Satellite
○ Topographic
○ Light
○ Dark
```

Mengganti basemap tidak boleh:

- menghapus polygon
- menghapus marker
- menghapus koordinat
- mengubah area
- menghapus BPN
- mereset drawing state
- reload halaman

Hanya background layer yang berubah.

---

# 30. MAP LAYER ARCHITECTURE

Pisahkan:

```text
BASEMAP
├── Street
├── Satellite
├── Topographic
├── Light
└── Dark

REFERENCE
└── BPN

USER DATA
├── Polygon
├── Marker
└── Preview

DRAWING
├── Draw
├── Edit
└── Delete
```

Basemap tidak boleh mengontrol state polygon.

---

# 31. BPN LAYER

Pertahankan:

- BPN layer
- WMS
- disclaimer
- layer toggle
- existing behavior

Multi-basemap harus coexist dengan BPN.

---

# 32. MAP FAILURE FALLBACK

Jika provider gagal:

```text
Satellite
   ↓
failed
   ↓
fallback / pilih OSM
```

Aplikasi tidak boleh crash.

Jangan membuat seluruh map blank karena satu provider gagal.

---

# 33. PERFORMANCE

Jangan mengaktifkan semua tile layer bersamaan.

Jika user memilih:

```text
Satellite
```

hanya Satellite yang aktif.

Ketika memilih:

```text
OSM
```

Satellite harus dilepas/dinonaktifkan.

Jangan melakukan aggressive tile prefetch.

---

# 34. AUTH + CROSS-APP NAVIGATION

Landing:

```text
[ Login ]
   ↓
app.linesima.com/login
```

Landing:

```text
[ Mulai Gratis ]
   ↓
app.linesima.com/register
```

Web App:

```text
[ LineSima ]
   ↓
linesima.com
```

Jangan membuat duplicate login implementation di Landing Page.

---

# 35. ENVIRONMENT VARIABLES

Landing:

```env
VITE_APP_URL=http://localhost:5174
VITE_API_URL=http://localhost:5000/api
```

Web App:

```env
VITE_MARKETING_URL=http://localhost:5173
VITE_API_URL=http://localhost:5000/api
```

Backend:

```env
GEMINI_API_KEY=
MISTRAL_API_KEY=
```

Production nanti dapat diganti menjadi:

```env
VITE_APP_URL=https://app.linesima.com
VITE_MARKETING_URL=https://linesima.com
```

Jangan hardcode production URL.

---

# 36. CORS

Backend harus mengizinkan:

```text
http://localhost:5173
http://localhost:5174
```

Jangan menggunakan:

```text
Access-Control-Allow-Origin: *
```

jika tidak diperlukan.

Gunakan allowlist environment.

---

# 37. SUPABASE

Tetap gunakan Supabase existing.

Tidak perlu membuat project Supabase baru.

Arsitektur:

```text
Landing Page
     │
     ▼
Backend API
     │
     ▼
Supabase

Web App
     │
     ▼
Backend API
     │
     ▼
Supabase
```

Jangan membuat database kedua.

---

# 38. INDEXEDDB

Dexie/IndexedDB hanya berada di Web App untuk kebutuhan aplikasi.

Contoh:

```text
web-app/src/db.js
```

Jangan membawa state GIS ke Landing Page.

---

# 39. SEO LANDING PAGE

Landing Page harus menjadi pusat topical authority.

Minimal:

```text
/
 /solusi/
 /fitur/
 /harga/
 /blog/
 /panduan/
 /faq/
 /tentang/
```

SEO harus mencakup:

- title
- meta description
- canonical
- OpenGraph
- semantic HTML
- structured data
- sitemap
- robots
- internal linking

Jangan membuat Web App menjadi pusat SEO.

---

# 40. AEO

AEO hanya untuk public content.

Struktur:

```text
Landing Page
     │
     ├── FAQ
     ├── Guide
     ├── Blog
     └── Structured Data
```

Jangan inject SEO/AEO markup secara tidak relevan ke halaman dashboard.

Hindari hidden keyword stuffing.

Jika menggunakan `sr-only`, hanya gunakan untuk content yang memang semantically valid dan bukan untuk menyembunyikan keyword spam.

---

# 41. ADMIN AEO

Jika AdminAEO membutuhkan authentication:

```text
app.linesima.com/admin/aeo
```

bukan:

```text
linesima.com/admin/aeo
```

Admin content management tetap menjadi bagian Web App.

Content yang sudah dipublish kemudian dapat ditampilkan oleh Landing Page.

---

# 42. BLOG ARCHITECTURE

Blog publik:

```text
linesima.com/blog
linesima.com/blog/:slug
```

Bukan:

```text
app.linesima.com/blog
```

Web App hanya boleh memiliki content-management interface jika dibutuhkan admin.

---

# 43. DATA FLOW CONTENT

Gunakan:

```text
Admin Web App
      │
      ▼
Backend
      │
      ▼
Supabase
      │
      ▼
Landing Page
      │
      ▼
Public Blog / Guide / FAQ
```

Landing Page tidak perlu menjadi admin editor.

---

# 44. CRS AMDALNET

Dokumentasi existing menyebut AMDALNET dengan EPSG:3857, tetapi implementasi codebase sebelumnya menunjukkan konfigurasi WGS84 / EPSG:4326.

**Jangan mengubah CRS hanya berdasarkan dokumentasi.**

Audit file:

```text
modules/amdalnet/constants.js
modules/amdalnet/exporter.js
modules/amdalnet/mapper.js
```

Pastikan `.prj` dan geometry export konsisten dengan standard yang benar-benar digunakan codebase.

Jika implementasi existing menggunakan:

```text
WGS 1984
EPSG:4326
```

pertahankan itu.

---

# 45. JANGAN MERUSAK FITUR EXISTING

Selama refactor jangan mengubah:

- polygon calculation
- coordinate parser
- Nominatim
- Google Maps URL parser
- BPN
- SHP format
- AMDALNET schema
- authentication logic
- database schema
- token pricing
- AI integration

kecuali diperlukan untuk pemisahan.

Ini adalah:

```text
ARCHITECTURE REFACTOR
```

bukan:

```text
PRODUCT REWRITE
```

---

# 46. DEPENDENCY ISOLATION

Landing Page jangan membawa dependency berat yang hanya diperlukan Web App.

Jika tidak digunakan di Landing:

```text
Leaflet
React-Leaflet
Leaflet Draw
Turf
shp-write
Dexie
pdf-lib
```

tidak perlu masuk bundle Landing.

Web App boleh menggunakannya.

Tujuan:

```text
Landing
↓
Small bundle
↓
Fast load
↓
SEO-friendly
```

---

# 47. ROOT PACKAGE.JSON

Root project harus dapat menjalankan seluruh sistem.

Ideal:

```bash
npm run dev
```

menjalankan:

```text
Landing
Web App
Backend
```

Tambahkan juga:

```bash
npm run dev:landing
npm run dev:app
npm run dev:server
```

Gunakan `concurrently` atau mekanisme yang sesuai.

---

# 48. BUILD

Harus dapat build secara independen:

```bash
npm run build:landing
```

dan:

```bash
npm run build:app
```

serta:

```bash
npm run build
```

untuk seluruh project jika memungkinkan.

Landing dan Web App tidak boleh saling bergantung pada build output.

---

# 49. TESTING

Setelah refactor:

## Landing

- [ ] Homepage
- [ ] Navigation
- [ ] SEO metadata
- [ ] Blog
- [ ] Panduan
- [ ] FAQ
- [ ] Pricing
- [ ] CTA
- [ ] Login redirect
- [ ] Register redirect
- [ ] Tidak ada GIS dependency yang tidak diperlukan
- [ ] Tidak ada console error

## Web App

- [ ] Login
- [ ] Register
- [ ] Protected route
- [ ] Dashboard
- [ ] Map
- [ ] Polygon drawing
- [ ] Polygon editing
- [ ] Area calculation
- [ ] Basemap switcher
- [ ] BPN layer
- [ ] SHP
- [ ] PDF
- [ ] AMDALNET
- [ ] Token
- [ ] Top Up
- [ ] History
- [ ] Account
- [ ] Admin
- [ ] AEO admin
- [ ] IndexedDB

## Backend

- [ ] Auth
- [ ] Generator
- [ ] Token authorization
- [ ] Token deduction
- [ ] AEO
- [ ] Admin
- [ ] CORS
- [ ] Supabase
- [ ] Environment variables

---

# 50. FREE TIER TEST MATRIX

Wajib melakukan test:

| Area | Token | Expected |
|---:|---:|---|
| 10 m² | 0 | FREE |
| 49 m² | 0 | FREE |
| 50 m² | 0 | FREE |
| 50.01 m² | 0 | TOKEN REQUIRED |
| 100 m² | 10 | Export + deduct |
| 100 m² | 2 | Insufficient Token |

Pastikan:

```text
50 m²
```

masih gratis.

Sedangkan:

```text
50.01 m²
```

sudah membutuhkan token.

---

# 51. SECURITY TEST

Coba manipulasi request:

```json
{
  "area": 10,
  "coordinates": [...]
}
```

tetapi geometry sebenarnya menghasilkan:

```text
> 50 m²
```

Backend harus menolak free export.

Expected:

```text
TOKEN_REQUIRED
```

Jangan mempercayai nilai `area` dari frontend.

---

# 52. DOUBLE DEDUCTION TEST

User menekan:

```text
Export
Export
Export
```

dengan sangat cepat.

Expected:

```text
Satu export transaction
Satu token deduction
```

bukan:

```text
Tiga deduction
```

---

# 53. BASEMAP TEST

Test:

```text
OSM
→ Satellite
→ Topographic
→ Light
→ Dark
```

Setiap perubahan:

```text
Polygon tetap
Coordinates tetap
Area tetap
BPN tetap
Marker tetap
Drawing state tetap
```

---

# 54. LOCAL RUNNING

Target:

```text
Landing:
http://localhost:5173

Web App:
http://localhost:5174

Backend:
http://localhost:5000
```

Jalankan:

```bash
npm run dev:landing
npm run dev:app
npm run dev:server
```

Kemudian:

```bash
npm run dev
```

harus dapat menjalankan ketiganya jika root script tersebut dibuat.

---

# 55. FINAL ARCHITECTURE

Target akhir wajib menjadi:

```text
                         LineSima
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
       LANDING PAGE                    WEB APP
       linesima.com                 app.linesima.com
              │                           │
       SEO / Marketing               Authentication
       Blog                          Dashboard
       Panduan                       GIS
       FAQ                           Digitasi
       Pricing                       Generator
       AEO                           AMDALNET
       Conversion                    Token
              │                      Top Up
              │                      History
              │                      Admin
              │                           │
              └─────────────┬─────────────┘
                            │
                            ▼
                          SERVER
                            │
                ┌───────────┴───────────┐
                │                       │
             Business                 API
              Rules                    Auth
                │                    Generator
           Free Tier                  AEO
             50 m²                    Admin
                │                       │
                └───────────┬───────────┘
                            ▼
                         SUPABASE
```

Business rule:

```text
Polygon ≤ 50 m²
        ↓
      FREE

Polygon > 50 m²
        ↓
   TOKEN REQUIRED
        ↓
   Check Balance
        ↓
 ┌──────┴──────┐
 │             │
Enough       Not Enough
 │             │
 ▼             ▼
Deduct       Top Up
 │
 ▼
Export
```

---

# 56. OUTPUT WAJIB DARI CODING AGENT

Setelah implementasi selesai, jangan hanya mengatakan "done".

Berikan laporan:

```text
1. Struktur folder sebelum
2. Struktur folder sesudah
3. File yang dipindahkan
4. File yang dibuat
5. File yang dihapus
6. Dependency yang dipindahkan
7. Routing Landing
8. Routing Web App
9. Local ports
10. API configuration
11. Auth flow
12. Free Tier implementation
13. Token flow
14. Top Up flow
15. Export authorization
16. Multi-basemap provider
17. Attribution provider
18. CRS AMDALNET hasil audit
19. Test result
20. Error yang masih ada
21. Risiko yang harus diperhatikan sebelum production
```

Jangan menyatakan refactor berhasil sebelum:

```text
Landing dapat berjalan sendiri
+
Web App dapat berjalan sendiri
+
Backend dapat berjalan
+
Landing → Web App navigation berhasil
+
Web App → Landing navigation berhasil
+
Authentication berhasil
+
Free Tier 50 m² berhasil
+
Token deduction berhasil
+
Top Up berhasil
+
Export berhasil
+
Multi-basemap berhasil
```

# FINAL PRINCIPLE

Jangan membuat:

```text
1 SPA
├── landing
└── app
```

Target yang benar adalah:

```text
2 FRONTEND APPLICATIONS

Landing Page
    ↓
linesima.com

Web App
    ↓
app.linesima.com

Shared Backend
    ↓
Supabase
```

Untuk sekarang semuanya **LOCAL FIRST**.

Jangan melakukan deployment production atau perubahan DNS sampai arsitektur lokal stabil dan seluruh test berhasil.