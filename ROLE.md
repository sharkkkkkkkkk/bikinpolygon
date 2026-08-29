## ROLE

Bertindak sebagai **Senior Technical SEO Engineer + SEO Developer + Semantic SEO Specialist + AI Search Optimization Engineer**.

Saya memiliki sebuah project dengan folder:

```text
/landingpage
```

Di dalam sistem tersebut **sudah terdapat keyword SEO yang telah saya tentukan**.

Tugas Anda adalah melakukan **audit terlebih dahulu**, kemudian mengimplementasikan strategi SEO secara menyeluruh pada folder `landingpage` tanpa merusak fitur, UI, routing, responsivitas, maupun logic aplikasi yang sudah berjalan.

---

# TUJUAN UTAMA

Optimalkan `landingpage` agar:

1. Mudah di-crawl oleh Googlebot.
2. Mudah di-index oleh search engine.
3. Mudah dipahami search engine.
4. Memiliki semantic structure yang kuat.
5. Memaksimalkan peluang ranking berdasarkan keyword yang SUDAH ADA.
6. Memaksimalkan peluang muncul pada AI-powered search seperti:
   - Google AI Overviews
   - Google AI Mode
   - ChatGPT Search
   - sistem pencarian berbasis AI lainnya.
7. Memiliki struktur HTML yang dapat dipahami crawler tanpa bergantung sepenuhnya pada JavaScript.
8. Memiliki internal linking yang jelas.
9. Memiliki structured data/schema.org yang valid dan relevan.
10. Memiliki sitemap dan robots.txt yang benar.
11. Memiliki metadata SEO yang dinamis dan konsisten.
12. Tidak melakukan keyword stuffing atau teknik black-hat SEO.

---

# ATURAN PALING PENTING

## JANGAN LANGSUNG MENGUBAH CODE

Sebelum melakukan perubahan:

### STEP 1 — AUDIT PROJECT

Periksa terlebih dahulu:

```text
/landingpage
```

Cari dan identifikasi:

- framework
- routing
- entry point
- layout
- page components
- metadata system
- existing SEO implementation
- existing keyword configuration
- existing sitemap
- existing robots.txt
- existing schema.org
- existing canonical
- existing Open Graph
- existing Twitter Card
- existing internal links
- image implementation
- image alt text
- heading hierarchy
- JavaScript rendering
- SSR/SSG/CSR
- dynamic routes
- URL structure
- loading strategy
- font loading
- asset handling
- public/static directory
- environment variables
- deployment configuration

Jangan berasumsi menggunakan Next.js, React, Vite, Astro, atau framework tertentu.

**Identifikasi framework berdasarkan source code project.**

---

# STEP 2 — TEMUKAN KEYWORD YANG SUDAH ADA

Cari seluruh keyword yang sudah tersedia di project.

Search seluruh:

```text
/landingpage
```

untuk menemukan:

```text
keyword
keywords
seo
meta
title
description
slug
search
query
tags
topic
category
```

Juga periksa:

```text
JSON
TS
TSX
JS
JSX
MD
MDX
YAML
database configuration
CMS configuration
```

Buat mapping:

```text
Primary Keyword
Secondary Keywords
Long-tail Keywords
Related Terms
Search Intent
Target Page
```

**JANGAN mengganti keyword yang sudah ditentukan tanpa alasan teknis yang kuat.**

Gunakan keyword existing sebagai source of truth.

---

# STEP 3 — BUAT SEO KEYWORD MAP

Setiap keyword harus dipetakan ke halaman yang paling relevan.

Contoh struktur:

```text
Keyword
├── Primary Keyword
├── Secondary Keyword
├── Related Keyword
├── Search Intent
├── Target URL
├── Page Title
├── Meta Description
├── H1
├── H2 Topics
├── Internal Links
└── Structured Data
```

Pastikan:

### 1 halaman = 1 primary search intent

Hindari membuat banyak halaman yang menargetkan keyword yang sama tanpa alasan.

Tujuannya menghindari:

```text
keyword cannibalization
```

---

# STEP 4 — IMPLEMENTASI TITLE

Setiap halaman indexable harus memiliki:

```html
<title>
```

yang unik.

Formula dasar:

```text
Primary Keyword + Value Proposition | Brand
```

Tetapi jangan memaksakan formula tersebut jika tidak natural.

Pastikan title:

- unik
- relevan
- menggambarkan isi halaman
- mengandung keyword utama jika natural
- tidak keyword stuffing
- tidak sama antar halaman

Jangan membuat title seperti:

```text
keyword keyword keyword keyword
```

---

# STEP 5 — IMPLEMENTASI META DESCRIPTION

Setiap halaman indexable harus memiliki:

```html
<meta name="description">
```

Gunakan keyword utama secara natural.

Description harus:

- menjelaskan isi halaman
- memiliki search intent yang sesuai
- menarik untuk diklik
- unik
- tidak sekadar mengulang title

Jangan membuat meta description generik untuk semua halaman.

---

# STEP 6 — CANONICAL URL

Setiap halaman indexable harus memiliki canonical URL:

```html
<link rel="canonical" href="https://DOMAIN/URL">
```

Canonical harus:

- absolute URL
- konsisten HTTPS
- menggunakan URL utama
- tidak menghasilkan canonical yang menunjuk ke halaman berbeda tanpa alasan
- tidak menghasilkan self-conflicting canonical

Jangan hardcode domain jika project sudah memiliki konfigurasi environment.

Gunakan konfigurasi:

```text
SITE_URL
NEXT_PUBLIC_SITE_URL
PUBLIC_SITE_URL
```

atau mekanisme konfigurasi yang sesuai framework.

Jika belum tersedia, buat konfigurasi yang aman.

---

# STEP 7 — ROBOTS META

Untuk halaman publik yang memang ingin di-index:

```html
<meta name="robots" content="index, follow">
```

Tetapi jangan menambahkan secara berlebihan jika default framework sudah memungkinkan indexing.

Pastikan halaman yang memang harus indexable tidak memiliki:

```text
noindex
nofollow
```

secara tidak sengaja.

---

# STEP 8 — ROBOTS.TXT

Buat/perbaiki:

```text
/robots.txt
```

di root public website.

Tujuan:

- Google dapat crawl halaman publik.
- crawler AI yang relevan tidak diblokir.
- sitemap dapat ditemukan.

Jangan memblokir seluruh website dengan:

```text
Disallow: /
```

Jangan menggunakan robots.txt sebagai mekanisme utama untuk `noindex`.

Gunakan robots.txt untuk kontrol crawling, bukan untuk menyembunyikan halaman dari index.

Pastikan konfigurasi final mempertimbangkan crawler seperti:

```text
Googlebot
Bingbot
OAI-SearchBot
```

dan crawler relevan lainnya.

Contoh baseline:

```text
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: *
Allow: /

Sitemap: https://DOMAIN/sitemap.xml
```

**Sesuaikan dengan kebutuhan project.**

Jangan mengizinkan crawler jika ada bagian private/admin/API yang memang harus terlindungi.

---

# STEP 9 — AI CRAWLABILITY

Target utama:

```text
Google Search
Google AI Overviews
Google AI Mode
ChatGPT Search
AI-powered search engines
```

Jangan membuat klaim bahwa ada markup khusus yang "menjamin" muncul di AI.

Implementasikan fondasi yang benar:

```text
crawlable
indexable
semantically structured
text accessible
internally linked
structured data
clear entities
clear topical relevance
high-quality content
```

Pastikan:

```text
OAI-SearchBot
```

tidak diblokir untuk halaman publik yang memang ingin ditemukan di ChatGPT Search.

Jika project menggunakan:

```text
Cloudflare
WAF
CDN
Bot Protection
Rate Limiting
```

audit apakah crawler legitimate berpotensi mendapatkan:

```text
403
429
challenge page
empty HTML
```

Jangan mematikan security secara global.

Jika diperlukan, buat pengecualian yang aman dan terukur untuk crawler legitimate.

---

# STEP 10 — XML SITEMAP

Implementasikan:

```text
/sitemap.xml
```

Sitemap harus berisi URL canonical yang:

- public
- indexable
- status 200
- bukan redirect
- bukan noindex
- bukan duplicate

Jangan memasukkan:

```text
/admin
/api
/auth
/login
private pages
404
redirect URLs
duplicate URLs
```

Jika website memiliki dynamic routes, sitemap harus dapat menghasilkan URL tersebut secara otomatis.

Jika jumlah halaman besar, gunakan sitemap index jika diperlukan.

---

# STEP 11 — INTERNAL LINKING

Audit seluruh internal linking.

Pastikan halaman penting dapat ditemukan melalui:

```text
Homepage
→ Category
→ Landing Page
→ Detail Page
```

Gunakan HTML anchor:

```html
<a href="/target-page">
```

bukan hanya:

```javascript
onClick={() => navigate(...)}
```

jika link tersebut memang merupakan navigasi yang harus dapat ditemukan crawler.

Anchor text harus deskriptif.

Hindari:

```text
Klik di sini
Selengkapnya
Read more
```

jika dapat menggunakan anchor yang lebih informatif.

Contoh:

```text
Layanan konsultasi AMDAL
```

lebih informatif daripada:

```text
Klik di sini
```

---

# STEP 12 — SEMANTIC HTML

Audit struktur HTML.

Gunakan elemen semantic:

```html
<header>
<nav>
<main>
<section>
<article>
<aside>
<footer>
```

Pastikan hanya terdapat satu:

```html
<h1>
```

untuk primary topic halaman jika memang sesuai dengan struktur halaman.

Hierarchy:

```text
H1
 ├── H2
 │    ├── H3
 │    └── H3
 └── H2
      └── H3
```

Jangan menggunakan heading hanya untuk styling.

---

# STEP 13 — CONTENT ACCESSIBILITY UNTUK CRAWLER

Konten SEO penting harus tersedia dalam HTML/text yang dapat dirender crawler.

Hindari membuat seluruh konten penting hanya:

```text
canvas
image
background image
client-only JavaScript
hidden content
```

Jika konten penting berasal dari JavaScript:

- pastikan crawler tetap dapat merendernya
- lebih baik gunakan SSR/SSG/server-rendered content jika framework mendukung
- jangan mengandalkan interaksi user untuk menampilkan informasi SEO utama

Konten yang terlihat user dan structured data harus konsisten.

---

# STEP 14 — STRUCTURED DATA

Implementasikan schema.org JSON-LD hanya jika sesuai dengan isi halaman.

Jangan memasukkan schema secara asal.

Pertimbangkan schema yang relevan seperti:

```text
Organization
WebSite
WebPage
BreadcrumbList
Article
FAQPage
LocalBusiness
Service
Product
```

**Pilih berdasarkan tipe halaman yang sebenarnya.**

Jangan membuat schema yang tidak sesuai dengan konten visible.

Contoh baseline:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "...",
  "description": "...",
  "url": "..."
}
</script>
```

Untuk breadcrumb:

```text
Home
→ Category
→ Current Page
```

gunakan:

```text
BreadcrumbList
```

Jika halaman benar-benar merupakan service page, gunakan:

```text
Service
```

Jika benar-benar merupakan organization profile, gunakan:

```text
Organization
```

Jangan melakukan schema stuffing.

---

# STEP 15 — ENTITY SEO

Jangan hanya mengoptimalkan keyword.

Identifikasi entity utama dari setiap halaman:

```text
Brand
Organization
Service
Product
Location
Person
Industry
Topic
```

Pastikan entity tersebut konsisten antara:

```text
Title
H1
Content
Internal links
Schema
Open Graph
Metadata
```

Jika relevan, gunakan:

```text
sameAs
```

untuk menghubungkan entity dengan profil resmi yang benar.

Jangan membuat `sameAs` palsu.

---

# STEP 16 — OPEN GRAPH

Implementasikan:

```text
og:title
og:description
og:url
og:type
og:image
og:site_name
```

Jika halaman merupakan article/content:

```text
og:type = article
```

Jika homepage/general page:

```text
website
```

Pastikan image memiliki URL absolute.

---

# STEP 17 — TWITTER/X CARD

Implementasikan metadata yang relevan:

```text
twitter:card
twitter:title
twitter:description
twitter:image
```

Gunakan image yang relevan dengan halaman.

---

# STEP 18 — IMAGE SEO

Audit semua image.

Pastikan:

```html
<img
  src="..."
  alt="descriptive relevant text"
/>
```

Jangan menggunakan:

```text
alt="image"
alt="photo"
alt=""
```

untuk gambar yang memiliki makna.

Namun jangan memasukkan keyword secara paksa.

Gunakan:

```text
descriptive alt text
```

Optimalkan:

- file size
- format modern jika tersedia
- dimensions
- lazy loading untuk image non-critical
- eager loading untuk hero image jika diperlukan
- width/height untuk mengurangi layout shift

---

# STEP 19 — CORE WEB VITALS

Audit:

```text
LCP
INP
CLS
```

dan faktor pendukung:

```text
JavaScript bundle
CSS
font loading
image size
render blocking resources
third-party scripts
```

Jangan mengorbankan UX hanya demi SEO.

Prioritaskan:

```text
fast initial render
stable layout
responsive interaction
mobile performance
```

---

# STEP 20 — MOBILE SEO

Pastikan semua landing page:

```text
mobile responsive
```

dan konten SEO utama tetap tersedia pada mobile.

Jangan membuat:

```text
desktop-only content
mobile-only keyword content
```

yang berbeda secara signifikan tanpa alasan.

Pastikan:

- viewport benar
- text readable
- buttons usable
- navigation crawlable
- content tidak terpotong
- no horizontal overflow

---

# STEP 21 — URL STRUCTURE

Audit URL.

URL ideal:

```text
/service/amdal
/service/konsultasi-amdal
/blog/panduan-amdal
```

Hindari:

```text
/page?id=123
/page?x=abc
/page/123456
```

jika slug deskriptif dapat digunakan.

Gunakan lowercase.

Hindari URL yang terlalu panjang dan tidak relevan.

---

# STEP 22 — DUPLICATE CONTENT

Cari kemungkinan duplicate:

```text
www vs non-www
http vs https
trailing slash
query parameters
duplicate routes
duplicate landing pages
```

Gunakan:

```text
canonical
redirect
consistent internal linking
```

sesuai kasus.

---

# STEP 23 — SEO CONTENT ARCHITECTURE

Jangan hanya menempatkan keyword di:

```text
title
meta description
H1
```

Bangun topical relevance.

Untuk setiap primary keyword, identifikasi:

```text
Primary Topic
Supporting Topics
Related Questions
Entities
Subtopics
User Intent
```

Kemudian pastikan halaman memberikan jawaban yang lengkap dan natural.

Contoh:

```text
Primary Topic
│
├── Apa itu?
├── Manfaat
├── Proses
├── Persyaratan
├── Biaya
├── Waktu
├── FAQ
└── Related Services
```

**Hanya tambahkan section yang benar-benar relevan dengan bisnis dan search intent.**

Jangan membuat konten filler hanya untuk mengejar panjang artikel.

---

# STEP 24 — FAQ

Jika halaman memang memiliki pertanyaan umum yang relevan:

Buat FAQ yang benar-benar membantu user.

FAQ harus:

- visible
- natural
- sesuai search intent
- bukan keyword stuffing

Jangan membuat ratusan FAQ otomatis hanya untuk SEO.

---

# STEP 25 — BREADCRUMBS

Jika website memiliki struktur halaman bertingkat, implementasikan breadcrumb:

```text
Home
→ Category
→ Current Page
```

Tampilkan breadcrumb kepada user dan, jika sesuai, gunakan:

```text
BreadcrumbList
```

structured data.

---

# STEP 26 — JAVASCRIPT SEO

Karena project kemungkinan menggunakan framework JavaScript:

Audit apakah:

```text
title
meta
H1
content
canonical
structured data
internal links
```

tersedia ketika crawler melakukan rendering.

Jangan hanya menambahkan metadata setelah:

```text
useEffect()
```

jika framework mendukung server-side metadata.

Gunakan mekanisme metadata resmi framework.

---

# STEP 27 — HTTP STATUS

Pastikan halaman SEO utama memberikan:

```text
HTTP 200
```

Jangan menghasilkan:

```text
soft 404
500
403
429
```

untuk crawler legitimate.

Pastikan redirect:

```text
301/308
```

digunakan secara tepat ketika URL memang berubah.

---

# STEP 28 — SEO HEADERS

Audit HTTP response headers yang relevan:

```text
X-Robots-Tag
Content-Type
Cache-Control
Content-Encoding
```

Pastikan tidak terdapat:

```text
X-Robots-Tag: noindex
```

pada halaman yang seharusnya di-index.

Pastikan HTML:

```text
Content-Type: text/html
```

dan tidak dikirim sebagai response yang salah.

---

# STEP 29 — AI-READABLE CONTENT

Optimalkan konten agar mudah dipahami sistem retrieval/AI tanpa membuat file atau markup palsu.

Gunakan struktur:

```text
clear heading
short explanatory paragraph
bullet points
tables when useful
definitions
FAQ
entity relationships
internal references
```

Untuk informasi penting, gunakan kalimat yang jelas dan factual.

Contoh:

```text
Apa itu [Entity]?

[Entity] adalah ...
```

Kemudian:

```text
Manfaat
Proses
Persyaratan
...
```

Tujuannya bukan "memanipulasi AI", tetapi membuat informasi mudah diekstrak dan dipahami.

---

# STEP 30 — JANGAN MEMBUAT `AI.TXT` ATAU FILE PALSU

Jangan membuat:

```text
ai.txt
ai-crawler.txt
chatgpt.txt
llm.txt
```

hanya dengan asumsi bahwa file tersebut meningkatkan ranking.

Prioritaskan standar yang benar:

```text
robots.txt
sitemap.xml
HTML semantic
structured data
canonical
internal links
quality content
```

---

# STEP 31 — SEO VALIDATION

Setelah implementasi selesai, jalankan audit otomatis.

Periksa:

### Metadata

```text
title exists
title unique
description exists
description unique
canonical exists
robots valid
```

### Content

```text
H1 exists
H1 unique
heading hierarchy valid
keyword mapping valid
content visible
```

### Crawl

```text
robots.txt accessible
sitemap accessible
important URLs reachable
internal links valid
no accidental noindex
```

### Technical

```text
HTTP 200
HTTPS
canonical consistency
mobile viewport
structured data valid
```

### Images

```text
alt text
dimensions
lazy loading
image optimization
```

### AI/Search

```text
OAI-SearchBot not accidentally blocked
Googlebot not blocked
important content available as text
structured data matches visible content
```

---

# STEP 32 — BUILD SEO AUDIT REPORT

Setelah implementasi, buat laporan:

```text
SEO_IMPLEMENTATION_REPORT.md
```

Format:

# SEO Implementation Report

## 1. Project Analysis

Framework:\
Rendering:\
Routing:\
Deployment:

## 2. Existing Keywords

| Keyword | Intent | Target URL | Status |
| ------- | ------ | ---------- | ------ |

## 3. Implemented Changes

- Metadata
- Canonical
- Robots
- Sitemap
- Schema
- Internal linking
- Semantic HTML
- Image SEO
- Performance
- Mobile SEO
- AI crawler accessibility

## 4. Files Changed

```text
file
purpose
changes
```

## 5. SEO Issues Fixed

```text
issue
severity
solution
```

## 6. Remaining Issues

```text
issue
reason
recommendation
```

## 7. Validation

```text
robots.txt: PASS/FAIL
sitemap.xml: PASS/FAIL
canonical: PASS/FAIL
metadata: PASS/FAIL
structured data: PASS/FAIL
internal links: PASS/FAIL
mobile: PASS/FAIL
crawlability: PASS/FAIL
```

---

# STEP 33 — JANGAN MERUSAK SISTEM

Sangat penting:

Jangan mengubah:

```text
business logic
API behavior
authentication
database
existing UI
design system
existing features
user flow
```

kecuali perubahan tersebut memang diperlukan untuk SEO dan tidak mengubah behavior aplikasi.

Jika perubahan berpotensi merusak fitur:

```text
STOP
```

dan jelaskan sebelum melakukan perubahan besar.

---

# STEP 34 — PRIORITAS IMPLEMENTASI

Gunakan prioritas:

### P0 — Critical

```text
crawlability
indexability
robots.txt
sitemap
canonical
HTTP status
metadata
SSR/SSG/HTML content
```

### P1 — High

```text
semantic HTML
internal linking
structured data
heading hierarchy
URL architecture
image SEO
mobile SEO
```

### P2 — Optimization

```text
Core Web Vitals
content architecture
entity optimization
Open Graph
Twitter Card
FAQ
breadcrumb
```

---

# STEP 35 — FINAL REQUIREMENT

Sebelum menyatakan selesai:

1. Audit project.
2. Temukan keyword existing.
3. Buat keyword map.
4. Implementasikan technical SEO.
5. Implementasikan crawlability.
6. Implementasikan sitemap.
7. Implementasikan robots.txt.
8. Pastikan crawler AI yang relevan tidak diblokir.
9. Implementasikan structured data yang relevan.
10. Optimalkan semantic HTML.
11. Optimalkan internal linking.
12. Optimalkan metadata.
13. Optimalkan image SEO.
14. Audit mobile.
15. Audit JavaScript rendering.
16. Audit HTTP status.
17. Audit duplicate/canonical.
18. Jalankan validation.
19. Perbaiki error yang ditemukan.
20. Buat `SEO_IMPLEMENTATION_REPORT.md`.

---

# HASIL AKHIR YANG SAYA INGINKAN

Saya tidak hanya ingin:

```text
SEO meta tags
```

tetapi sebuah implementasi:

```text
                    ┌───────────────────┐
                    │ Existing Keywords │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Keyword Mapping   │
                    └─────────┬─────────┘
                              │
             ┌────────────────▼────────────────┐
             │         Landing Pages           │
             └────────────────┬────────────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
       ▼                      ▼                      ▼
 Technical SEO          Semantic SEO          Content SEO
       │                      │                      │
       ├─ Sitemap             ├─ H1/H2              ├─ Search Intent
       ├─ Robots              ├─ Schema              ├─ Topics
       ├─ Canonical           ├─ Entity              ├─ FAQ
       ├─ Metadata            ├─ Breadcrumb          └─ Internal Links
       └─ HTTP                └─ HTML
                              │
                    ┌─────────▼─────────┐
                    │ Crawlable Content │
                    └─────────┬─────────┘
                              │
             ┌────────────────┼─────────────────┐
             ▼                ▼                 ▼
         Googlebot        AI Search        Other Crawlers
             │                │                 │
             └────────────────┼─────────────────┘
                              ▼
                     Search Visibility
```

---

# IMPORTANT SEO PRINCIPLE

Jangan menjanjikan:

```text
"pasti ranking #1"
"pasti masuk Google AI Overview"
"pasti muncul di ChatGPT"
```

Target implementasi adalah membuat website:

```text
crawlable
indexable
understandable
semantically structured
technically healthy
AI-search discoverable
```

Setelah implementasi, tampilkan kepada saya:

1. **Framework yang terdeteksi**
2. **Keyword yang ditemukan**
3. **Keyword mapping**
4. **Daftar file yang diubah**
5. **Perubahan yang dilakukan**
6. **Masalah SEO sebelum implementasi**
7. **Masalah yang berhasil diperbaiki**
8. **Masalah yang masih tersisa**
9. **SEO validation result**
10. **Cara melakukan test crawl secara lokal**
11. **Checklist deployment production**
12. **Isi final ****`robots.txt`**
13. **Struktur ****`sitemap.xml`**
14. **Structured data yang digunakan**
15. **Rekomendasi lanjutan**

Jangan mengarang hasil audit.

Semua hasil harus berdasarkan source code aktual di:

```text
/landingpage
```
