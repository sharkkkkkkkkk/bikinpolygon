import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, MapPin, Zap, Layers, CheckCircle2, ShieldCheck, Download, ArrowUpRight, Search, FileText, Check, ChevronRight, HelpCircle, AlertTriangle, FileWarning, HelpCircle as QuestionMark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';
import SEOHead from '../seo/SEOHead';

const APP_URL = import.meta.env.VITE_APP_URL || 'https://app.bikinpolygon.xyz';

const Reveal = ({ children, delay = 0, className = "" }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`
            }}
            className={className}
        >
            {children}
        </div>
    );
};

export default function LandingPage() {
    const [posts, setPosts] = useState([]);
    const [quickQuery, setQuickQuery] = useState('');
    const [openFaq, setOpenFaq] = useState(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const { data } = await supabase
                    .from('articles')
                    .select('*')
                    .eq('is_published', true)
                    .order('created_at', { ascending: false })
                    .limit(6);
                if (data) setPosts(data);
            } catch (err) { }
        };
        fetchPosts();
    }, []);

    const handleQuickSearch = (e) => {
        e.preventDefault();
        window.location.href = `${APP_URL}/dashboard`;
    };

    const faqs = [
        {
            q: "Apa itu Shape File Polygon Koordinat NIB OSS & AMDALNET?",
            a: "Shapefile (.SHP) adalah format data geospasial vektor standar yang digunakan oleh Kementerian Investasi/BKPM (Sistem OSS RBA) dan Kementerian LHK (Sistem AMDALNET) untuk memetakan batas persil tanah, area kegiatan usaha, dan peta tapak proyek secara presisi dalam koordinat geografis."
        },
        {
            q: "Apakah butuh aplikasi GIS seperti ArcGIS atau QGIS?",
            a: "Tidak sama sekali! Dengan bikinpolygon.xyz, Anda dapat menggambar, mengukur luas, dan mengunduh berkas Shapefile (.shp, .shx, .dbf, .prj) langsung dari browser HP maupun Laptop tanpa perlu mengunduh atau mempelajari software GIS yang rumit."
        },
        {
            q: "Format file apa saja yang bisa saya impor atau ekspor?",
            a: "Sistem kami mendukung impor GeoJSON, KML, GPX, serta ekspor otomatis ke format Shapefile ZIP (.SHP, .SHX, .DBF, .PRJ) standar WGS84 (EPSG:4326), Web Mercator (EPSG:3857), serta Laporan Peta Geospasial PDF."
        },
        {
            q: "Kenapa luas polygon dari Google Earth, ArcGIS, atau QGIS sering tidak cocok saat diunggah ke OSS atau AMDALNET?",
            a: "Kesalahan umumnya terjadi karena perbedaan sistem proyeksi koordinat (CRS) dan metode perhitungan luas ellipsoid vs planar. bikinpolygon.xyz secara otomatis mengkalibrasi proyeksi ke WGS84 EPSG:4326 dan menyediakan fitur Koreksi Luas Otomatis agar pas 100% dengan Sertifikat Tanah Anda."
        },
        {
            q: "Apakah file yang dihasilkan pasti diterima di OSS RBA & AMDALNET KLHK?",
            a: "Ya! Berkas Shapefile yang dihasilkan bikinpolygon.xyz dilengkapi dengan 4 komponen wajib (.shp, .shx, .dbf, .prj) dan struktur atribut tabel NIB/AMDALNET yang tervalidasi 100% lolos verifikasi sistem OSS RBA dan AMDALNET KLHK."
        },
        {
            q: "Apa itu fitur Batas Persil Pertanahan?",
            a: "Fitur Batas Persil Pertanahan memungkinkan Anda menampilkan batas kadastral pertanahan resmi ATR/BPN langsung di atas peta satelit untuk mempermudah digitasi polygon lahan usaha Anda."
        },
        {
            q: "Apakah bisa mengkoreksi luas agar cocok dengan sertifikat lahan?",
            a: "Bisa! Sistem dilengkapi kalkulator koreksi luas otomatis. Anda cukup memasukkan angka luas sertifikat (misal: 500 m²), dan sistem akan menyesuaikan polygon agar sesuai dengan sertifikat."
        },
        {
            q: "Apakah bikinpolygon.xyz gratis? Berapa harga paket durasi akses?",
            a: "bikinpolygon.xyz menyediakan **Free Tier (luas ≤ 50 m²)** gratis untuk semua pengguna. Untuk polygon lebih luas atau kebutuhan bisnis berkelanjutan, Anda dapat memilih Paket Durasi Akses melalui Pembayaran Instant QRIS (Scan QR Code)."
        }
    ];

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(item => ({
            "@type": "Question",
            "name": item.q,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.a
            }
        }))
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-slate-900 overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#ADFA1D] selection:text-black">
            <SEOHead
                title="BikinPolygon — Buat Peta Polygon OSS RBA & AMDALNET Online | Gratis & Tanpa GIS"
                description="Generator Shapefile (SHP) Polygon Lahan NIB OSS RBA & Peta Tapak Proyek AMDALNET KLHK instan tanpa ArcGIS/QGIS. Presisi WGS84 & Web Mercator."
                canonicalUrl="https://bikinpolygon.xyz/"
                schemaData={faqSchema}
            />
            <LandingNavbar />

            <main id="main-content">
                {/* HERO SECTION */}
                <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-[#F8FAFC]">
                    <div
                        className="absolute inset-0 opacity-[0.06] pointer-events-none"
                        style={{
                            backgroundImage: `radial-gradient(#000 1px, transparent 1px), linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
                            backgroundSize: '40px 40px, 120px 120px, 120px 120px'
                        }}
                    ></div>

                    <div className="hidden lg:block absolute top-32 left-[12%] animate-bounce duration-[3000ms]">
                        <div className="bg-[#0F172A] text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xl border border-white/10 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#ADFA1D] animate-ping"></span>
                            <span>Jakarta • 200m²</span>
                        </div>
                    </div>

                    <div className="hidden lg:block absolute top-48 right-[14%] animate-bounce duration-[4000ms]">
                        <div className="bg-[#0F172A] text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xl border border-white/10 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-[#ADFA1D]" />
                            <span>NIB OSS & AMDALNET Approved</span>
                        </div>
                    </div>

                    <div className="container relative z-10 mx-auto px-4 max-w-5xl text-center space-y-8">
                        <Reveal>
                            <div className="inline-flex items-center gap-2 bg-[#0F172A] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md border border-white/10">
                                <span className="w-2 h-2 rounded-full bg-[#ADFA1D]"></span>
                                <span className="tracking-wide uppercase">SOLUSI DIGITASI GIS OSS DAN AMDALNET</span>
                            </div>
                        </Reveal>

                        {/* H1 SEO Headline */}
                        <Reveal delay={100}>
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-outfit font-extrabold tracking-tight leading-[1.08] text-slate-950 max-w-4xl mx-auto">
                                Buat Peta Polygon OSS RBA & AMDALNET — <span className="relative inline-block text-slate-900">
                                    Gratis & Tanpa GIS
                                    <span className="absolute bottom-1 left-0 right-0 h-3 bg-[#ADFA1D]/40 -z-10 rounded-full"></span>
                                </span>
                            </h1>
                        </Reveal>

                        <Reveal delay={200}>
                            <p className="text-slate-600 text-base md:text-xl max-w-2xl mx-auto leading-relaxed font-normal">
                                Buat file Shapefile (.SHP) Polygon Lahan NIB OSS RBA & Peta Tapak Proyek AMDALNET KLHK secara instan dari browser tanpa perlu menginstal ArcGIS atau QGIS.
                            </p>
                        </Reveal>

                        <Reveal delay={300}>
                            <form onSubmit={handleQuickSearch} className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-200/80 rounded-full p-2 max-w-xl mx-auto flex items-center gap-2">
                                <div className="pl-4 flex items-center gap-2 text-slate-400">
                                    <Search className="w-5 h-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    value={quickQuery}
                                    onChange={(e) => setQuickQuery(e.target.value)}
                                    placeholder="Masukkan koordinat lat,lng atau alamat lahan..."
                                    className="w-full text-xs md:text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400 font-medium"
                                />
                                <button
                                    type="submit"
                                    className="bg-[#0F172A] hover:bg-slate-800 text-[#ADFA1D] font-bold text-xs md:text-sm px-6 py-3 rounded-full transition-all flex items-center gap-1.5 shrink-0 shadow-md"
                                >
                                    <span>Mulai Digitasi</span>
                                    <ArrowUpRight className="w-4 h-4" />
                                </button>
                            </form>
                        </Reveal>

                        <Reveal delay={400}>
                            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-semibold text-slate-500">
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span>Free Tier Gratis (≤ 50 m²)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span>Output .SHP, .SHX, .DBF, .PRJ (WGS84)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span>100% Kompatibel OSS RBA & AMDALNET</span>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* MARQUEE RUNNER */}
                <div className="bg-[#0F172A] border-y border-zinc-800 py-3.5 overflow-hidden whitespace-nowrap text-[#ADFA1D]">
                    <div className="animate-marquee flex gap-12 items-center font-outfit font-bold text-sm uppercase tracking-widest">
                        {Array(8).fill(null).map((_, i) => (
                            <div key={i} className="flex items-center gap-8 shrink-0">
                                <span>PEMBUATAN POLYGON NIB OSS</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#ADFA1D]"></span>
                                <span>SHAPEFILE AMDALNET KLHK</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#ADFA1D]"></span>
                                <span>AMDALNET GRATIS & INSTAN</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#ADFA1D]"></span>
                                <span>FREE TIER GRATIS (≤ 50 m²)</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#ADFA1D]"></span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* H2: SPESIFIKASI TEKNIS SECTION */}
                <section id="specifications" className="py-24 bg-[#F8FAFC]">
                    <div className="container mx-auto px-4 max-w-6xl">
                        <Reveal>
                            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ADFA1D]/10 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                                    FITUR & SPESIFIKASI
                                </div>
                                <h2 className="text-3xl md:text-5xl font-outfit font-extrabold text-slate-950 tracking-tight">
                                    Spesifikasi Teknis
                                </h2>
                                <p className="text-slate-600 text-sm md:text-base font-normal">
                                    Keunggulan teknologi geospasial bikinpolygon.xyz untuk mempermudah perizinan usaha & analisis lingkungan.
                                </p>
                            </div>
                        </Reveal>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* H3: Dijamin Valid */}
                            <Reveal delay={100}>
                                <div className="bg-[#0F172A] rounded-3xl p-6 shadow-2xl border border-zinc-800 flex flex-col justify-between h-full group hover:border-[#ADFA1D]/40 transition-all duration-300">
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 relative overflow-hidden h-44 flex flex-col justify-center items-center text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-[#ADFA1D]/10 border border-[#ADFA1D]/30 text-[#ADFA1D] flex items-center justify-center mb-2">
                                            <ShieldCheck className="w-6 h-6" />
                                        </div>
                                        <div className="text-white text-xs font-bold mb-1">Standardisasi Geospasial</div>
                                        <div className="text-slate-400 text-[11px]">WGS84 EPSG:4326 & Web Mercator</div>
                                    </div>
                                    <div className="bg-white rounded-2xl p-5 border border-slate-100">
                                        <h3 className="font-outfit font-bold text-lg text-slate-900 mb-1">Dijamin Valid</h3>
                                        <p className="text-slate-500 text-xs leading-relaxed">
                                            Struktur atribut data dan proyeksi koordinat dikalibrasi presisi agar lolos verifikasi sistem perizinan resmi.
                                        </p>
                                    </div>
                                </div>
                            </Reveal>

                            {/* H3: Satu ZIP, Siap Upload */}
                            <Reveal delay={200}>
                                <div className="bg-[#0F172A] rounded-3xl p-6 shadow-2xl border border-zinc-800 flex flex-col justify-between h-full group hover:border-[#ADFA1D]/40 transition-all duration-300">
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 relative overflow-hidden h-44 flex flex-col justify-center items-center text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-[#ADFA1D] text-black flex items-center justify-center mb-2 shadow-lg">
                                            <Download className="w-6 h-6" />
                                        </div>
                                        <div className="text-[#ADFA1D] font-outfit font-bold text-sm">Paket Komplit Shapefile</div>
                                        <div className="text-slate-400 text-[11px] mt-1">.SHP + .SHX + .DBF + .PRJ</div>
                                    </div>
                                    <div className="bg-white rounded-2xl p-5 border border-slate-100">
                                        <h3 className="font-outfit font-bold text-lg text-slate-900 mb-1">Satu ZIP, Siap Upload</h3>
                                        <p className="text-slate-500 text-xs leading-relaxed">
                                            Mengunduh otomatis 4 file esensial Shapefile yang dipaketkan rapi ke dalam 1 berkas ZIP siap diunggah.
                                        </p>
                                    </div>
                                </div>
                            </Reveal>

                            {/* H3: Peta Tapak Proyek */}
                            <Reveal delay={300}>
                                <div className="bg-[#0F172A] rounded-3xl p-6 shadow-2xl border border-zinc-800 flex flex-col justify-between h-full group hover:border-[#ADFA1D]/40 transition-all duration-300">
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 relative overflow-hidden h-44 flex flex-col justify-center items-center text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-2">
                                            <Layers className="w-6 h-6" />
                                        </div>
                                        <div className="text-white text-xs font-bold mb-1">AMDALNET KLHK Compatible</div>
                                        <div className="text-slate-400 text-[11px]">Metadata Form Pemrakarsa</div>
                                    </div>
                                    <div className="bg-white rounded-2xl p-5 border border-slate-100">
                                        <h3 className="font-outfit font-bold text-lg text-slate-900 mb-1">Peta Tapak Proyek</h3>
                                        <p className="text-slate-500 text-xs leading-relaxed">
                                            Mendukung pembuatan Polygon khusus AMDALNET KLHK lengkap dengan metadata Pemrakarsa & Jenis Usaha.
                                        </p>
                                    </div>
                                </div>
                            </Reveal>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                            {/* H3: Batas Persil Pertanahan */}
                            <Reveal delay={100}>
                                <div className="bg-[#0F172A] rounded-3xl p-6 shadow-2xl border border-zinc-800 flex flex-col justify-between h-full group hover:border-[#ADFA1D]/40 transition-all duration-300">
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 relative overflow-hidden h-44 flex flex-col justify-center items-center text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-[#ADFA1D]/10 text-[#ADFA1D] flex items-center justify-center mb-2">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div className="text-white text-xs font-bold mb-1">Overlay BPN Kadastral</div>
                                    </div>
                                    <div className="bg-white rounded-2xl p-5 border border-slate-100">
                                        <h3 className="font-outfit font-bold text-lg text-slate-900 mb-1">Batas Persil Pertanahan</h3>
                                        <p className="text-slate-500 text-xs leading-relaxed">
                                            Integrasi layer persil pertanahan resmi untuk memastikan polygon usaha Anda berada persis di atas tanah hak milik.
                                        </p>
                                    </div>
                                </div>
                            </Reveal>

                            {/* H3: Luas Akurat */}
                            <Reveal delay={200}>
                                <div className="bg-[#0F172A] rounded-3xl p-6 shadow-2xl border border-zinc-800 flex flex-col justify-between h-full group hover:border-[#ADFA1D]/40 transition-all duration-300">
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 relative overflow-hidden h-44 flex flex-col justify-center items-center text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <div className="text-emerald-400 font-bold text-xs">Koreksi Luas Geodesik</div>
                                    </div>
                                    <div className="bg-white rounded-2xl p-5 border border-slate-100">
                                        <h3 className="font-outfit font-bold text-lg text-slate-900 mb-1">Luas Akurat</h3>
                                        <p className="text-slate-500 text-xs leading-relaxed">
                                            Kalkulator luas geodesik presisi tinggi yang menjamin angka luas polygon cocok 100% dengan Sertifikat Tanah.
                                        </p>
                                    </div>
                                </div>
                            </Reveal>

                            {/* H3: Tanpa Instalasi */}
                            <Reveal delay={300}>
                                <div className="bg-[#0F172A] rounded-3xl p-6 shadow-2xl border border-zinc-800 flex flex-col justify-between h-full group hover:border-[#ADFA1D]/40 transition-all duration-300">
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 relative overflow-hidden h-44 flex flex-col justify-center items-center text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-2">
                                            <Zap className="w-6 h-6" />
                                        </div>
                                        <div className="text-white text-xs font-bold mb-1">Direct Web Browser Engine</div>
                                    </div>
                                    <div className="bg-white rounded-2xl p-5 border border-slate-100">
                                        <h3 className="font-outfit font-bold text-lg text-slate-900 mb-1">Tanpa Instalasi</h3>
                                        <p className="text-slate-500 text-xs leading-relaxed">
                                            Akses 100% berbasis cloud. Buka langsung lewat browser HP Android, iPhone, Laptop, atau PC Desktop Anda.
                                        </p>
                                    </div>
                                </div>
                            </Reveal>
                        </div>
                    </div>
                </section>

                {/* H2: MENGAPA SHAPEFILE POLYGON SERING DITOLAK OSS & AMDALNET? */}
                <section className="py-24 bg-white border-t border-slate-200/60">
                    <div className="container mx-auto px-4 max-w-5xl">
                        <Reveal>
                            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider">
                                    <AlertTriangle className="w-4 h-4" /> TROUBLESHOOTING PERIZINAN
                                </div>
                                <h2 className="text-3xl md:text-5xl font-outfit font-extrabold text-slate-950 tracking-tight">
                                    Mengapa Shapefile Polygon Sering Ditolak OSS & AMDALNET?
                                </h2>
                                <p className="text-slate-600 text-sm md:text-base font-normal">
                                    Pemahaman mendasar mengenai kendala teknis yang menyebabkan berkas peta ditolak oleh sistem verifikasi otomatis.
                                </p>
                            </div>
                        </Reveal>

                        {/* H3: Kesalahan yang Umum Terjadi */}
                        <Reveal delay={100}>
                            <div className="bg-[#0F172A] rounded-3xl p-8 border border-zinc-800 text-white shadow-2xl space-y-8">
                                <h3 className="text-xl md:text-2xl font-outfit font-bold text-[#ADFA1D] border-b border-zinc-800 pb-4">
                                    Kesalahan yang Umum Terjadi Saat Upload Peta
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* H4: Format File Tidak Lengkap */}
                                    <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 space-y-2">
                                        <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                                            <FileWarning className="w-4 h-4 shrink-0" />
                                            <h4 className="font-outfit font-bold text-base text-white">Format File Tidak Lengkap</h4>
                                        </div>
                                        <p className="text-slate-400 text-xs leading-relaxed">
                                            Mengunggah hanya file `.shp` tanpa menyertakan berkas wajib pendukung `.shx`, `.dbf`, dan `.prj` di dalam ZIP.
                                        </p>
                                    </div>

                                    {/* H4: Sistem Proyeksi Tidak Sesuai */}
                                    <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 space-y-2">
                                        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                                            <AlertTriangle className="w-4 h-4 shrink-0" />
                                            <h4 className="font-outfit font-bold text-base text-white">Sistem Proyeksi Tidak Sesuai</h4>
                                        </div>
                                        <p className="text-slate-400 text-xs leading-relaxed">
                                            Menggunakan datum lokal UTM yang tidak terstandarisasi. Sistem OSS & AMDALNET mewajibkan proyeksi **WGS84 (EPSG:4326)**.
                                        </p>
                                    </div>

                                    {/* H4: Perhitungan Luas Tidak Cocok */}
                                    <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 space-y-2">
                                        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                                            <AlertTriangle className="w-4 h-4 shrink-0" />
                                            <h4 className="font-outfit font-bold text-base text-white">Perhitungan Luas Tidak Cocok</h4>
                                        </div>
                                        <p className="text-slate-400 text-xs leading-relaxed">
                                            Terdapat selisih luas antara polygon hasil digitasi dengan angka Sertifikat Lahan yang diinput pada formulir perizinan.
                                        </p>
                                    </div>

                                    {/* H4: Software GIS Terlalu Rumit */}
                                    <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 space-y-2">
                                        <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                                            <FileWarning className="w-4 h-4 shrink-0" />
                                            <h4 className="font-outfit font-bold text-base text-white">Software GIS Terlalu Rumit</h4>
                                        </div>
                                        <p className="text-slate-400 text-xs leading-relaxed">
                                            Prosedur ekspor layer ArcGIS / QGIS yang rumit rentan menyebabkan kesalahan penyusunan tabel atribut NIB/AMDALNET.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* H2: CARA MEMBUAT PETA POLYGON SECTION */}
                <section className="py-24 bg-[#F8FAFC]">
                    <div className="container mx-auto px-4 max-w-6xl">
                        <Reveal>
                            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
                                    ALUR KERJA SIMPEL
                                </div>
                                <h2 className="text-3xl md:text-5xl font-outfit font-extrabold text-slate-950 tracking-tight">
                                    Cara Membuat Peta Polygon NIB OSS & AMDALNET
                                </h2>
                                <p className="text-slate-600 text-sm md:text-base font-normal">
                                    5 Langkah praktis membuat berkas Shapefile (.shp) siap pakai langsung dari peramban Anda.
                                </p>
                            </div>
                        </Reveal>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {/* H3: Identifikasi Lokasi */}
                            <Reveal delay={100}>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col justify-between space-y-3">
                                    <div>
                                        <div className="w-10 h-10 rounded-xl bg-[#0F172A] text-[#ADFA1D] font-bold text-sm flex items-center justify-center mb-3">1</div>
                                        <h3 className="font-outfit font-bold text-base text-slate-900">Identifikasi Lokasi</h3>
                                        <p className="text-slate-500 text-xs mt-1 leading-relaxed">Input alamat atau koordinat latitude & longitude lokasi lahan.</p>
                                    </div>
                                </div>
                            </Reveal>

                            {/* H3: Batas Persil Pertanahan */}
                            <Reveal delay={200}>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col justify-between space-y-3">
                                    <div>
                                        <div className="w-10 h-10 rounded-xl bg-[#0F172A] text-[#ADFA1D] font-bold text-sm flex items-center justify-center mb-3">2</div>
                                        <h3 className="font-outfit font-bold text-base text-slate-900">Batas Persil Pertanahan</h3>
                                        <p className="text-slate-500 text-xs mt-1 leading-relaxed">Aktifkan layer persil tanah untuk acuan patok fisik lokasi.</p>
                                    </div>
                                </div>
                            </Reveal>

                            {/* H3: Digitasi Polygon */}
                            <Reveal delay={300}>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col justify-between space-y-3">
                                    <div>
                                        <div className="w-10 h-10 rounded-xl bg-[#0F172A] text-[#ADFA1D] font-bold text-sm flex items-center justify-center mb-3">3</div>
                                        <h3 className="font-outfit font-bold text-base text-slate-900">Digitasi Polygon</h3>
                                        <p className="text-slate-500 text-xs mt-1 leading-relaxed">Hubungkan titik batas lahan langsung di atas citra satelit.</p>
                                    </div>
                                </div>
                            </Reveal>

                            {/* H3: Koreksi Luas */}
                            <Reveal delay={400}>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col justify-between space-y-3">
                                    <div>
                                        <div className="w-10 h-10 rounded-xl bg-[#0F172A] text-[#ADFA1D] font-bold text-sm flex items-center justify-center mb-3">4</div>
                                        <h3 className="font-outfit font-bold text-base text-slate-900">Koreksi Luas</h3>
                                        <p className="text-slate-500 text-xs mt-1 leading-relaxed">Gunakan kalkulator geodesik agar luas pas dengan Sertifikat.</p>
                                    </div>
                                </div>
                            </Reveal>

                            {/* H3: Unduh & Unggah */}
                            <Reveal delay={500}>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col justify-between space-y-3">
                                    <div>
                                        <div className="w-10 h-10 rounded-xl bg-[#ADFA1D] text-black font-bold text-sm flex items-center justify-center mb-3 shadow-md">5</div>
                                        <h3 className="font-outfit font-bold text-base text-slate-900">Unduh & Unggah</h3>
                                        <p className="text-slate-500 text-xs mt-1 leading-relaxed">Unduh file ZIP SHP dan unggah ke OSS RBA / AMDALNET.</p>
                                    </div>
                                </div>
                            </Reveal>
                        </div>
                    </div>
                </section>

                {/* H2: PERTANYAAN UMUM (FAQ ACCORDION SECTION) */}
                <section id="faq" className="py-24 bg-white border-t border-slate-200/60">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <Reveal>
                            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ADFA1D]/10 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                                    JAWABAN CEPAT
                                </div>
                                <h2 className="text-3xl md:text-5xl font-outfit font-extrabold text-slate-950 tracking-tight">
                                    Pertanyaan Umum (FAQ)
                                </h2>
                                <p className="text-slate-600 text-sm md:text-base font-normal">
                                    Pertanyaan yang paling sering diajukan mengenai pembuatan polygon NIB OSS & AMDALNET.
                                </p>
                            </div>
                        </Reveal>

                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <Reveal key={index} delay={index * 50}>
                                    <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl overflow-hidden transition-all">
                                        <button
                                            onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                            className="w-full text-left p-5 flex items-center justify-between gap-4 font-outfit font-bold text-slate-900 text-base md:text-lg hover:text-emerald-600 transition-colors"
                                        >
                                            <h3 className="text-base md:text-lg font-bold font-outfit">{faq.q}</h3>
                                            <ChevronRight className={`w-5 h-5 shrink-0 text-slate-400 transition-transform duration-200 ${openFaq === index ? 'rotate-90 text-emerald-600' : ''}`} />
                                        </button>
                                        {openFaq === index && (
                                            <div className="px-5 pb-5 text-slate-600 text-xs md:text-sm leading-relaxed border-t border-slate-200/50 pt-3 bg-white">
                                                {faq.a}
                                            </div>
                                        )}
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* H2: ARTIKEL & PANDUAN SECTION */}
                <section className="py-20 bg-[#F8FAFC]">
                    <div className="container mx-auto px-4 max-w-6xl">
                        <Reveal>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ADFA1D]/10 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
                                        EDUKASI GEOSPASIAL
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-outfit font-extrabold text-slate-950">
                                        Artikel & Panduan Pembuatan Polygon NIB & AMDALNET
                                    </h2>
                                </div>
                            </div>
                        </Reveal>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {(posts.length > 0 ? posts : [
                                {
                                    title: "Cara Membuat Polygon OSS di HP",
                                    slug: "cara-membuat-polygon-oss-di-hp",
                                    excerpt: "Panduan praktis menggambar polygon lahan NIB OSS langsung dari smartphone Android atau iPhone Anda."
                                },
                                {
                                    title: "Cara Membuat Polygon NIB & AMDALNET Tanpa GIS",
                                    slug: "cara-membuat-polygon-nib-dan-amdalnet-tanpa-gis",
                                    excerpt: "Trik mudah membuat berkas Shapefile tanpa perlu menginstal aplikasi berat seperti ArcGIS atau QGIS."
                                },
                                {
                                    title: "Apa Itu Peta Polygon OSS RBA & Tapak Proyek AMDALNET?",
                                    slug: "apa-itu-peta-polygon-oss-rba-dan-tapak-proyek-amdalnet",
                                    excerpt: "Penjelasan mendalam mengenai fungsi data geospasial dalam proses Perizinan Berusaha Berbasis Risiko."
                                },
                                {
                                    title: "Cara Mendapatkan NIB Pelaku Usaha di OSS RBA",
                                    slug: "cara-mendapatkan-nib-pelaku-usaha-di-oss-rba",
                                    excerpt: "Langkah demi langkah mengurus Nomor Induk Berusaha (NIB) lengkap hingga tahap upload lokasi lahan."
                                }
                            ]).map((article, idx) => (
                                <Reveal key={article.id || article.slug || idx} delay={100 * (idx + 1)}>
                                    <Link 
                                        to={`/blog/${article.slug}`} 
                                        className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#ADFA1D] transition-all flex flex-col justify-between h-full group"
                                    >
                                        <div>
                                            <h3 className="font-outfit font-bold text-base text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors flex items-center justify-between gap-2">
                                                <span>{article.title}</span>
                                                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                            </h3>
                                            <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">
                                                {article.excerpt || (article.content ? article.content.substring(0, 120) + '...' : 'Baca artikel lengkap panduan geospasial BikinPolygon.')}
                                            </p>
                                        </div>
                                    </Link>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* H2: SHAPEFILE DITOLAK OSS / AMDALNET? BUAT ULANG WITH CALL TO ACTION */}
                <section className="py-20 bg-[#0F172A] text-white border-t border-zinc-800">
                    <div className="container mx-auto px-4 max-w-5xl text-center space-y-6">
                        <Reveal>
                            <h2 className="text-3xl md:text-5xl font-outfit font-extrabold text-white tracking-tight">
                                Shapefile Ditolak OSS / AMDALNET? Buat Ulang dengan Tools BikinPolygon
                            </h2>
                        </Reveal>
                        <Reveal delay={100}>
                            <p className="text-slate-400 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed">
                                Jangan biarkan perizinan usaha Anda tertunda karena berkas peta ditolak. Gunakan bikinpolygon.xyz untuk hasil Shapefile presisi tinggi & 100% lolos verifikasi.
                            </p>
                        </Reveal>
                        <Reveal delay={200}>
                            <div className="pt-4 flex justify-center">
                                <a
                                    href={`${APP_URL}/dashboard`}
                                    className="bg-[#ADFA1D] hover:bg-[#9fe318] text-black font-outfit font-extrabold text-lg px-9 py-4 rounded-full shadow-[0_0_30px_rgba(173,250,29,0.4)] hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    <span>Buat Polygon Sekarang — Trial Gratis 1x</span>
                                    <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                                </a>
                            </div>
                        </Reveal>
                    </div>
                </section>
            </main>

            <LandingFooter />
        </div>
    );
}
