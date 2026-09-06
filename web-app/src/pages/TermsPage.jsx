import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
    const lastUpdated = "6 September 2026";

    return (
        <div className="min-h-screen bg-[#0F172A] text-white font-['Plus_Jakarta_Sans',sans-serif] p-4 md:p-8">
            <div className="container mx-auto max-w-4xl pt-8 pb-16">
                
                {/* Top Nav */}
                <div className="mb-8">
                    <a 
                        href="/dashboard" 
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#ADFA1D] hover:underline bg-white/5 border border-white/10 px-4 py-2 rounded-full transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali ke GIS Dashboard</span>
                    </a>
                </div>

                {/* Header */}
                <div className="text-center space-y-4 mb-10">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ADFA1D]/10 border border-[#ADFA1D]/30 text-[#ADFA1D] text-xs font-bold uppercase tracking-wider">
                        <FileText className="w-4 h-4" />
                        Ketentuan Layanan Resmi
                    </div>
                    <h1 className="text-3xl md:text-5xl font-outfit font-extrabold text-white tracking-tight">
                        Syarat dan Ketentuan (Terms of Service)
                    </h1>
                    <p className="text-slate-400 text-sm md:text-base">
                        Terakhir diperbarui: <span className="text-white font-semibold">{lastUpdated}</span> | Platform <span className="text-[#ADFA1D] font-bold">BikinPolygon</span>
                    </p>
                </div>

                {/* Card Container */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-12 space-y-8 text-slate-300 text-sm md:text-base leading-relaxed shadow-2xl">
                    
                    <section className="space-y-3">
                        <h2 className="text-xl md:text-2xl font-outfit font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-6 bg-[#ADFA1D] rounded-full inline-block"></span>
                            1. Penerimaan Ketentuan
                        </h2>
                        <p>
                            Dengan mengakses atau menggunakan situs web <strong>https://bikinpolygon.xyz</strong> dan aplikasi <strong>https://app.bikinpolygon.xyz</strong>, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak menyetujui salah satu ketentuan, Anda tidak diperkenankan menggunakan layanan kami.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl md:text-2xl font-outfit font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-6 bg-[#ADFA1D] rounded-full inline-block"></span>
                            2. Deskripsi Layanan
                        </h2>
                        <p>
                            <strong>BikinPolygon</strong> menyediakan platform perangkat lunak berbasis web (Software-as-a-Service) untuk pembuatan, penyuntingan, koreksi luas, dan ekspor data geospasial Shapefile (.shp, .shx, .dbf, .prj) serta format spasial lainnya untuk kebutuhan pelaporan perizinan OSS RBA BKPM dan AMDALNET KLHK.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl md:text-2xl font-outfit font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-6 bg-[#ADFA1D] rounded-full inline-block"></span>
                            3. Akun dan Keamanan
                        </h2>
                        <p>
                            Anda bertanggung jawab penuh untuk menjaga keamanan akses akun Google OAuth atau kredensial yang Anda gunakan untuk masuk ke platform kami. Aktivitas yang dilakukan melalui akun Anda merupakan tanggung jawab Anda sepenuhnya.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl md:text-2xl font-outfit font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-6 bg-[#ADFA1D] rounded-full inline-block"></span>
                            4. Ketentuan Pembayaran dan Paket
                        </h2>
                        <ul className="list-disc list-inside space-y-1.5 pl-2">
                            <li><strong>Free Tier:</strong> Pengguna berhak atas ekspor polygon gratis untuk batas luas ≤ 50 m².</li>
                            <li><strong>Paket Durasi Akses:</strong> Pembayaran akses premium diproses secara instan melalui sistem QRIS / Midtrans resmi. Pembelian paket bersifat final dan tidak dapat dikembalikan (*non-refundable*), kecuali terjadi kesalahan teknis dari pihak sistem kami.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl md:text-2xl font-outfit font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-6 bg-[#ADFA1D] rounded-full inline-block"></span>
                            5. Batasan Tanggung Jawab
                        </h2>
                        <p>
                            BikinPolygon menyediakan perkakas bantu geospasial. Pengguna bertanggung jawab penuh atas kebenaran batas persil tanah, koordinat GPS, dan dokumen sertifikat yang diunggah ke portal perizinan instansi pemerintah.
                        </p>
                    </section>

                    <div className="pt-6 border-t border-zinc-800 flex items-center justify-between">
                        <a href="/dashboard" className="text-sm font-bold text-[#ADFA1D] hover:underline">
                            ← Kembali ke Dashboard
                        </a>
                        <a href="/privacy" className="text-sm font-bold text-slate-400 hover:text-white">
                            Kebijakan Privasi →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
