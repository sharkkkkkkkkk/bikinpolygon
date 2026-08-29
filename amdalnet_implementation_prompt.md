# Prompt: Implementasi Modul Export Tapak AMDALNET (Diperbarui)

Anda dapat menyalin (*copy-paste*) prompt di bawah ini ke AI asisten mana pun (Claude, ChatGPT, dsb) jika Anda ingin mengimplementasikan ulang fitur Export Tapak AMDALNET yang sudah sempurna dan bebas dari *bug* klasik di proyek React/Next.js lainnya:

***

**System Context & Role:**
Kamu adalah Senior Frontend Developer. Saya memiliki aplikasi pemetaan berbasis React/Next.js dengan library Leaflet yang sudah berjalan dengan baik (sudah memiliki fitur *Draw Polygon*, *Edit*, dan *Delete*). Saya ingin kamu menambahkan modul/fitur baru bernama **Export Tapak AMDALNET** tanpa merusak sistem peta (state/store) yang sudah ada. 

**Persyaratan Format AMDALNET (SHP):**
Saya memerlukan fitur untuk men-download `.zip` yang berisi format Shapefile (`.shp`, `.shx`, `.dbf`, `.prj`, `.cpg`) yang mematuhi standar berikut:
1. **Nama File Default:** `Tapak_proyek.*`
2. **CRS (Projection):** WGS 1984 Web Mercator Auxiliary Sphere (EPSG:3857).
3. **Encoding:** UTF-8
4. **Tipe Geometri:** Polygon
5. **Struktur DBF Wajib:**
   - `OBJECTID_1` (Numeric)
   - `PEMRAKARSA` (Character, max 100)
   - `KEGIATAN` (Character, max 254)
   - `TAHUN` (Numeric, max 4)
   - `PROVINSI` (Character, max 50)
   - `KETERANGAN` (Character, max 254)
   - `LAYER` (Character, isian default: "Tapak_proyek")
   - `AREA` (Numeric, presisi desimal 11, hasil perhitungan luas dalam m²)

**Fitur yang Harus Dibuat & Aturan Implementasi:**

1. **Form Metadata (React Hook Form + Zod)**: 
   Buat komponen Form UI menggunakan Tailwind CSS untuk mengumpulkan input pengguna: `PEMRAKARSA`, `KEGIATAN`, `TAHUN`, `PROVINSI` (keempatnya wajib), dan `KETERANGAN` (opsional).
   
2. **Hitung Luas Otomatis (Turf.js)**: 
   Ambil data GeoJSON dari poligon peta yang sedang aktif. Gunakan `@turf/turf` untuk menghitung luas dalam satuan meter persegi (m²), Hektar (Ha), dan Kilometer Persegi (Km²). Nilai m² harus dimasukkan ke atribut `AREA` di dalam Shapefile.

3. **Export SHP Bebas Bug (`@mapbox/shp-write` + `jszip` + `file-saver`)**:
   - **PENTING:** WAJIB gunakan `@mapbox/shp-write`, JANGAN gunakan `shp-write` versi lama karena mengandung *bug* `offset is not defined` pada *strict mode* modern (seperti Vite).
   - `shp-write` akan mengembalikan output buffer *Base64*. Oleh karena itu, saat Anda ingin menimpa (override) file `.prj` dan `.cpg`-nya menggunakan `JSZip`, pastikan memanggilnya menggunakan flag `base64: true`, yaitu: `await JSZip.loadAsync(shpBuffer, { base64: true });`.

4. **Export Laporan PDF (`pdf-lib` + `dom-to-image-more`)**:
   - **Screenshot Peta**: Gunakan library `dom-to-image-more` (JANGAN gunakan `html2canvas` karena elemen SVG polygon dari Leaflet akan tergeser/tidak akurat).
   - Saat mengambil *screenshot*, sembunyikan sementara UI bawaan Leaflet (dengan menetapkan `display: none` pada elemen `.leaflet-control-container`) agar hasil gambarnya bersih, lalu kembalikan seperti semula setelahnya.
   - **Responsive PDF Layout**: Ukuran tinggi (*height*) peta yang di-render di PDF harus dibatasi maksimal 450px. Untuk teks "N (Utara)", hindari penggunaan Unicode karakter panah atas `\u2191` karena `pdf-lib` dengan font bawaan (*WinAnsi*) akan melemparkan error "WinAnsi cannot encode". Cukup gunakan string `'N (Utara)'`.
   - **Dynamic Tabel Offset**: Posisi awal tabel (garis Y) yang menampilkan teks Pemrakarsa, Kegiatan, dsb. harus dikalkulasi secara dinamis bergantung pada tinggi gambar peta (misal: `imageBottomY - 40`) agar tidak pernah tumpang-tindih (overlap).

**Instruksi Tambahan (Aturan Teknis):**
- Pisahkan semua logika ke dalam module tersendiri (misalnya `src/modules/amdalnet/`).
- Berikan saya kode akhir yang *production-ready* untuk setiap file yang perlu dibuat beserta instruksi cara meng-install *dependencies* NPM-nya.

***
