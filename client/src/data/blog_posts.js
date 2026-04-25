[
    {
        "slug": "cara-mengatasi-gagal-upload-peta-polygon-oss-rba",
        "title": "Cara Mengatasi Gagal Upload Peta Polygon di OSS RBA (Paling Ampuh)",
        "excerpt": "Sering gagal saat upload file SHP di OSS? Simak panduan lengkap cara format file ZIP shapefile yang benar agar lolos verifikasi sistem OSS RBA.",
        "date": "2024-01-20",
        "author": "Admin LineSima",
        "keywords": "gagal upload peta oss, format shp oss rba, cara memperbaiki peta polygon oss, syarat file shp nib, solusi error oss polygon",
        "content": `
## Kenapa Sering Gagal Upload Peta di OSS?

Salah satu masalah paling umum yang dihadapi pengusaha saat mengurus NIB (Nomor Induk Berusaha) di sistem OSS RBA adalah **gagal upload peta lokasi usaha** atau **KKPR**. Pesan error yang sering muncul biasanya:
*   *"Format file tidak sesuai"*
*   *"Gagal memproses file shapefile"*
*   *"Koordinat tidak valid"*

Masalah ini 90% disebabkan karena **format file ZIP** atau **struktur Shapefile (.shp)** yang tidak sesuai dengan standar ketat sistem ESRI yang digunakan oleh Kementerian.

## Syarat Wajib File Peta OSS
Agar file Anda diterima, pastikan file ZIP Anda berisi minimal 3 file wajib ini dengan nama yang SAMA PERSIS:
1.  \`file.shp\` (Data geometri utama)
2.  \`file.shx\` (Index geometri)
3.  \`file.dbf\` (Database atribut)
*(Opsional tapi bagus: .prj untuk proyeksi koordinat)*

Seringkali, kalau Anda convert manual dari Google Earth (.kml) atau tools gratisan lain, file \`.shx\` atau \`.dbf\`-nya korup atau tidak terbaca.

## Solusi Paling Cepat & Valid (Tanpa Install Software)
Daripada pusing install ArcGIS atau QGIS yang berat dan ribet lisensinya, Anda bisa menggunakan tool otomatis.

**Langkah-langkah:**
1.  Buka [Google Maps](https://maps.google.com), cari lokasi usaha Anda.
2.  Salin link lokasi atau koordinatnya (Klik kanan > copy koordinat).
3.  Buka Dashboard **LineSima Generator**.
4.  Tempel link tersebut.
5.  Klik **Generate ZIP**.

Sistem kami otomatis membuatkan file \`.shp\`, \`.shx\`, dan \`.dbf\` yang sudah **ter-validasi 100% kompatibel dengan OSS RBA**.

## Kesimpulan
Jangan habiskan waktu berjam-jam hanya karena file error. Jika Anda bukan ahli GIS, serahkan urusan teknis pada tool generator otomatis. Fokuslah pada pengembangan bisnis Anda.

[Mulai Buat Polygon Sekarang →](/dashboard)
        `
    },
    {
        "slug": "panduan-lengkap-cara-buat-peta-polygon-nib",
        "title": "Panduan Lengkap Cara Buat Peta Polygon untuk NIB 2024",
        "excerpt": "Tutorial step-by-step membuat peta digital (polygon) untuk syarat pendaftaran NIB dan Izin Lokasi di OSS. Mudah, cepat, dan tanpa software berat.",
        "date": "2024-01-21",
        "author": "Tim Teknis GIS",
        "keywords": "cara buat peta nib, tutorial polygon oss, syarat peta lokasi usaha, bikin polygon untuk ijin usaha, panduan oss rba 2024",
        "content": `
## Apa itu Peta Polygon di NIB?
Saat mendaftar NIB di OSS, Anda diminta menentukan titik lokasi. Namun untuk jenis usaha tertentu, titik saja tidak cukup. Anda wajib mengunggah **Polygon** (area) yang menunjukkan batas-batas lahan usaha Anda.

Ini penting untuk verifikasi **KKPR (Kesesuaian Kegiatan Pemanfaatan Ruang)**. Pemerintah ingin memastikan usaha Anda tidak berdiri di zona hijau atau lahan sengketa.

## Cara Membuat Peta Polygon (Manual vs Otomatis)

### Cara Manual (Susah)
1.  Download software QGIS (Gratis tapi rumit).
2.  Cari citra satelit lokasi Anda.
3.  Gambar manual titik demi titik mengelilingi lahan.
4.  Export ke format ESRI Shapefile.
5.  Zip semua file.
*> Risiko: Salah proyeksi koordinat (WGS84) sering bikin file ditolak.*

### Cara Otomatis (Mudah di LineSima)
Kami menyediakan tool khusus untuk pengusaha non-teknis.
1.  Masuk ke menu **Dashboard**.
2.  Masukkan luas tanah (misal: 100 m²).
3.  Masukkan koordinat pusat.
4.  Sistem akan membuatkan "kotak" polygon presisi sesuai luas tanah tersebut.
5.  Download dan Upload.

## Tips Agar Verifikasi Cepat
*   Pastikan luas polygon di peta **sama atau mendekati** luas yang Anda input di form isian OSS. Beda dikit tidak apa-apa, tapi jangan terlalu jauh.
*   Gunakan proyeksi **WGS 84 (EPSG:4326)**. Tool kami sudah otomatis menggunakan standar ini.

Semoga NIB Anda cepat terbit!
        `
    }
];
