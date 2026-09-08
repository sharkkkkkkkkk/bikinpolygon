import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { ArrowLeft, Clock, Calendar, User, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';
import SEOHead from '../seo/SEOHead';

const fallbackArticles = {
    'kenapa-upload-polygon-oss-gagal-dan-solusinya': {
        slug: 'kenapa-upload-polygon-oss-gagal-dan-solusinya',
        title: "Kenapa Upload Polygon OSS Gagal? 5 Penyebab & Solusinya",
        excerpt: "Panduan mengatasi gagal upload peta polygon KKPR di sistem OSS RBA BKPM, dari validasi CRS WGS84 hingga koreksi luas otomatis.",
        author: "Spesialis GIS BikinPolygon",
        created_at: "2026-09-06T12:00:00Z",
        content: `
## 5 Penyebab Utama Upload Polygon OSS RBA Gagal & Cara Mengatasinya

Bagi para pelaku usaha dan konsultan perizinan yang sedang mengurus **Kesesuaian Kegiatan Pemanfaatan Ruang (KKPR)** di portal **OSS RBA (oss.go.id)**, masalah *error* saat mengunggah file peta polygon (.ZIP) sering kali menjadi kendala yang menghambat terbitnya NIB.

Berikut adalah 5 alasan utama kenapa file polygon OSS ditolak oleh sistem dan cara mengatasinya secara instan tanpa perlu software rumit:

---

### 1. Sistem Koordinat Bukan WGS84 (EPSG:4326)
- **Penyebab:** Banyak file SHP hasil ekspor Google Earth atau software CAD menggunakan proyeksi planar (*Web Mercator / UTM*) tanpa file proyeksi \`.prj\` yang valid.
- **Solusi:** Sistem OSS RBA mewajibkan sistem koordinat geografis **WGS84 (EPSG:4326)**. Di [BikinPolygon](https://www.bikinpolygon.xyz), seluruh polygon otomatis di-generate dengan proyeksi standar EPSG:4326 lengkap dengan berkas \`.prj\` resmi.

---

### 2. Berkas Komponen Shapefile Tidak Lengkap dalam ZIP
- **Penyebab:** Mengunggah hanya file \`.shp\` saja ke dalam ZIP.
- **Solusi:** Format Shapefile standar membutuhkan minimal **4 file wajib** dengan nama yang persis sama di dalam ZIP:
  1. \`lahan_usaha.shp\` (Geometri spasial)
  2. \`lahan_usaha.shx\` (Indeks geometri)
  3. \`lahan_usaha.dbf\` (Tabel atribut)
  4. \`lahan_usaha.prj\` (Informasi proyeksi koordinat)
  
  BikinPolygon otomatis mengemas keempat berkas ini dalam 1 file ZIP sekali klik.

---

### 3. Luas Polygon Tidak Cocok dengan Sertifikat Lahan
- **Penyebab:** Luas digitasi manual di Google Earth sering selisih beberapa meter persegi dengan luas fisik di Sertifikat Tanah (SHM/HGB) karena kelengkungan bumi (*ellipsoid distorsi*).
- **Solusi:** Gunakan fitur **Koreksi Luas Otomatis** di BikinPolygon. Masukkan angka sertifikat (misal: 500 m²), dan sistem akan mengkalibrasi skala polygon agar pas 100%.

---

### 4. Polygon Memiliki *Self-Intersection* (Garis Berpotongan)
- **Penyebab:** Garis batas polygon saling menyilang atau tumpang tindih (*invalid topology*).
- **Solusi:** Pastikan titik-titik digitasi berurutan searah jarum jam atau gunakan peta digitasi pintar BikinPolygon yang mencegah kesalahan topologi.

---

### 5. Kompresi Folder Bersarang (Nested Folder)
- **Penyebab:** Mengompres satu folder utuh sehingga di dalam ZIP terdapat sub-folder \`folder/file.shp\`.
- **Solusi:** Sistem OSS membaca berkas langsung di root ZIP. Pastikan file SHP berada langsung di tingkat pertama arsip ZIP.

---

### Kesimpulan & Cara Praktis:
Tidak perlu lagi pusing menginstal QGIS atau mengonversi KML manual. Buka [BikinPolygon GIS Workspace](https://www.bikinpolygon.xyz), gambar lahan Anda di atas peta satelit ber-layer persil BPN, lalu unduh berkas ZIP SHP yang tervalidasi 100% lolos sistem OSS RBA!
`
    },
    'cara-membuat-polygon-oss-di-hp': {
        slug: 'cara-membuat-polygon-oss-di-hp',
        title: "Cara Membuat Polygon OSS di HP Android & iPhone",
        excerpt: "Panduan praktis menggambar polygon lahan NIB OSS RBA langsung dari smartphone Android atau iPhone Anda tanpa software GIS.",
        author: "Tim GIS BikinPolygon",
        created_at: "2026-08-20T10:00:00Z",
        content: `
## Panduan Ringkas Digitasi Peta Lahan via Smartphone

Membuat berkas **Shapefile (.SHP)** untuk perizinan **NIB OSS RBA** kini tidak lagi memerlukan komputer spek tinggi maupun software berat seperti ArcGIS atau QGIS. Dengan menggunakan **BikinPolygon GIS Workspace**, Anda dapat langsung menggambar batas persil lahan langsung dari browser HP Android maupun iPhone.

### Langkah-Langkah Pembuatan:
1. **Buka Browser HP Anda**: Akses [bikinpolygon.xyz](https://www.bikinpolygon.xyz) lewat Chrome atau Safari.
2. **Cari Lokasi Lahan**: Masukkan alamat lokasi atau titik koordinat GPS (*latitude, longitude*).
3. **Aktifkan Layer Persil Tanah**: Gunakan fitur **Batas Persil Pertanahan** sebagai acuan patok fisik lahan.
4. **Digitasi Titik Lahan**: Sentuh layar untuk menambahkan titik-titik polygon batas lahan Anda secara akurat.
5. **Koreksi Luas (Opsional)**: Masukkan angka luas Sertifikat Tanah agar angka geodesik otomatis pas 100%.
6. **Unduh Paket SHP ZIP**: Klik tombol **Export Shapefile** untuk mendapatkan file ZIP komplit (.shp, .shx, .dbf, .prj).

---

> **Tips Penting**: Pastikan proyeksi koordinat yang terpilih adalah **WGS84 (EPSG:4326)** agar lolos verifikasi otomatis pada portal OSS RBA BKPM.
`
    },
    'cara-membuat-polygon-nib-dan-amdalnet-tanpa-gis': {
        slug: 'cara-membuat-polygon-nib-dan-amdalnet-tanpa-gis',
        title: "Cara Membuat Polygon NIB & AMDALNET Tanpa Software GIS",
        excerpt: "Trik mudah membuat berkas Shapefile tanpa perlu menginstal aplikasi berat seperti ArcGIS atau QGIS.",
        author: "Tim GIS BikinPolygon",
        created_at: "2026-08-22T10:00:00Z",
        content: `
## Solusi Praktis Tanpa ArcGIS atau QGIS

Bagi para pelaku usaha dan konsultan lingkungan, menginstal software desktop GIS sering kali menjadi kendala utama karena kerumitan ekspor tabel atribut dan sistem proyeksi koordinat.

### Keunggulan BikinPolygon GIS Engine:
- **Format Lengkap (.ZIP)**: Mengunduh sekaligus 4 berkas wajib: \`.shp\`, \`.shx\`, \`.dbf\`, dan \`.prj\`.
- **Atribut AMDALNET Standardized**: Tabel atribut otomatis disesuaikan dengan skema Form Pemrakarsa AMDALNET KLHK.
- **Auto Projection**: Konversi otomatis ke WGS84 EPSG:4326 dan Web Mercator EPSG:3857.

Dengan fitur ini, proses pengurusan **Tapak Proyek AMDALNET** maupun **Peta Lokasi Usaha NIB OSS** dapat diselesaikan hanya dalam kurun waktu kurang dari 5 menit!
`
    },
    'apa-itu-peta-polygon-oss-rba-dan-tapak-proyek-amdalnet': {
        slug: 'apa-itu-peta-polygon-oss-rba-dan-tapak-proyek-amdalnet',
        title: "Apa Itu Peta Polygon OSS RBA & Tapak Proyek AMDALNET?",
        excerpt: "Penjelasan mendalam mengenai fungsi data geospasial dalam proses Perizinan Berusaha Berbasis Risiko.",
        author: "Spesialis Geospasial",
        created_at: "2026-08-25T10:00:00Z",
        content: `
## Pemahaman Dasar Data Geospasial Perizinan

Dalam Permen LHK dan aturan terbaru Perizinan Berusaha Berbasis Risiko (OSS RBA), setiap rencana kegiatan usaha wajib menyertakan bukti lokasi berupa data spasial **Polygon Vektor (Shapefile)**.

### Mengapa Format SHP Wajib?
1. **Verifikasi Tumpang Tindih Lahan**: Sistem OSS melakukan *overlay* otomatis dengan Peta Indikatif Penghentian Pemberian Izin Baru (PIPPIB) dan RTRW Daerah.
2. **Validasi Geodesik Akurat**: Menghindari klaim luas lahan yang tidak sesuai dengan sertifikat hak milik/HGB pertanahan.
3. **Analisis Lingkungan AMDALNET**: Memetakan radius dampak lingkungan hidup di sekitar tapak proyek kegiatan usaha.

Gunakan **BikinPolygon** untuk memastikan seluruh parameter teknis geospasial Anda memenuhi kualifikasi standar pemerintah.
`
    },
    'cara-mendapatkan-nib-pelaku-usaha-di-oss-rba': {
        slug: 'cara-mendapatkan-nib-pelaku-usaha-di-oss-rba',
        title: "Cara Mendapatkan NIB Pelaku Usaha di OSS RBA",
        excerpt: "Langkah demi langkah mengurus Nomor Induk Berusaha (NIB) lengkap hingga tahap upload lokasi lahan.",
        author: "Konsultan Legal Perizinan",
        created_at: "2026-08-28T10:00:00Z",
        content: `
## Panduan Alur Pengurusan NIB OSS RBA Terbaru

Nomor Induk Berusaha (NIB) adalah identitas resmi bagi pelaku usaha di Indonesia. Berikut adalah alur lengkap pengurusan NIB OSS RBA:

### Langkah 1: Registrasi Hak Akses OSS
Buka situs resmi [oss.go.id](https://oss.go.id) dan buat akun Hak Akses menggunakan NIK KTP (untuk Usaha Mikro Kecil) atau Akta Pendirian PT/CV.

### Langkah 2: Pengisian Data Usaha & KBLI
Pilih Kode Klasifikasi Baku Lapangan Usaha Indonesia (KBLI) 5 digit yang sesuai dengan sektor usaha Anda.

### Langkah 3: Upload Peta Polygon Lahan Usaha
Pada tahap Tata Ruang (KKPR), Anda diwajibkan mengunggah file **Shapefile (.SHP)** lokasi kegiatan usaha.
- Gunakan [bikinpolygon.xyz](https://www.bikinpolygon.xyz) untuk menggambar polygon lahan Anda.
- Unduh berkas ZIP SHP dan upload ke formulir OSS.

### Langkah 4: Terbitnya NIB & Sertifikat Standar
Setelah polygon tervalidasi otomatis oleh sistem tata ruang, NIB Anda akan diterbitkan secara instan!
`
    }
};

export default function BlogPostPage() {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const { data, error } = await supabase
                    .from('articles')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (data) {
                    setPost(data);
                } else if (fallbackArticles[slug]) {
                    setPost(fallbackArticles[slug]);
                }
            } catch (err) {
                if (fallbackArticles[slug]) {
                    setPost(fallbackArticles[slug]);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-outfit text-sm font-bold text-slate-400">
                Memuat artikel...
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-6 p-4">
                <h1 className="text-3xl font-outfit font-extrabold text-slate-900">Artikel Tidak Ditemukan</h1>
                <Link to="/" className="bg-[#0F172A] text-[#ADFA1D] font-bold px-6 py-3 rounded-full text-sm">
                    ← Kembali ke Beranda
                </Link>
            </div>
        );
    }

    const articleSlug = post.slug || slug;

    const articleSchema = post ? {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "description": post.excerpt || post.title,
        "author": {
            "@type": "Person",
            "name": post.author || "Admin GIS"
        },
        "publisher": {
            "@type": "Organization",
            "name": "BikinPolygon",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.bikinpolygon.xyz/assets/logo.svg"
            }
        },
        "datePublished": post.created_at,
        "mainEntityOfPage": `https://www.bikinpolygon.xyz/blog/${articleSlug}`
    } : null;

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#ADFA1D] selection:text-black">
            <SEOHead 
                title={`${post.title} | BikinPolygon Blog`} 
                description={post.excerpt || post.title} 
                canonicalUrl={`https://www.bikinpolygon.xyz/blog/${articleSlug}`}
                type="article"
                schemaData={articleSchema}
            />
            <LandingNavbar />

            <main className="container max-w-4xl mx-auto px-4 pt-32 pb-24">
                <Link to="/" className="inline-flex items-center gap-2 font-bold text-xs text-slate-500 hover:text-slate-900 mb-8 uppercase tracking-wider">
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Beranda
                </Link>

                <article className="bg-white border border-slate-200/80 rounded-3xl p-8 md:p-14 shadow-sm">
                    <div className="flex flex-wrap gap-4 items-center text-xs font-semibold text-slate-400 mb-6 border-b border-slate-100 pb-6">
                        <span className="flex items-center gap-1.5 text-emerald-600 font-bold"><User className="w-3.5 h-3.5" /> {post.author || 'Admin GIS'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(post.created_at).toLocaleDateString('id-ID')}</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-outfit font-extrabold text-slate-950 tracking-tight mb-8 leading-tight">
                        {post.title}
                    </h1>

                    <div className="prose prose-slate prose-lg max-w-none prose-headings:font-outfit prose-headings:font-extrabold prose-a:text-emerald-600 prose-img:rounded-2xl">
                        <ReactMarkdown rehypePlugins={[rehypeRaw]}>{post.content}</ReactMarkdown>
                    </div>
                </article>
            </main>

            <LandingFooter />
        </div>
    );
}
