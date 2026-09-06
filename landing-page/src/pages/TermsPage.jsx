import React from 'react';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';
import SEOHead from '../seo/SEOHead';
import { FileText, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsPage() {
    const lastUpdated = "6 September 2026";

    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            <SEOHead
                title="Syarat dan Ketentuan Layanan (Terms of Service) | BikinPolygon"
                description="Syarat dan ketentuan penggunaan layanan platform geospasial BikinPolygon untuk pembuatan Shapefile OSS & AMDALNET."
                canonicalUrl="https://www.bikinpolygon.xyz/terms"
            />
            <LandingNavbar />

            <main className="flex-1 pt-32 pb-24">
                <div className="container mx-auto px-4 max-w-4xl">
                    {/* Header */}
                    <div className="text-center space-y-4 mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ADFA1D]/20 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                            <FileText className="w-4 h-4 text-emerald-700" />
                            Ketentuan Layanan Resmi
                        </div>
                        <h1 className="text-3xl md:text-5xl font-outfit font-extrabold text-slate-950 tracking-tight">
                            Syarat dan Ketentuan (Terms of Service)
                        </h1>
                        <p className="text-slate-600 text-sm md:text-base font-medium">
                            Terakhir diperbarui: <span className="font-semibold text-slate-900">{lastUpdated}</span> | Platform <span className="font-bold text-slate-900">BikinPolygon</span>
                        </p>
                    </div>

                    {/* Content Box */}
                    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-200/80 space-y-8 text-slate-700 text-sm md:text-base leading-relaxed">
                        
                        <section className="space-y-3">
                            <h2 className="text-xl md:text-2xl font-outfit font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-2 h-6 bg-[#ADFA1D] rounded-full inline-block"></span>
                                1. Penerimaan Ketentuan
                            </h2>
                            <p>
                                Dengan mengakses atau menggunakan situs web <strong>https://www.bikinpolygon.xyz</strong> dan aplikasi <strong>https://app.bikinpolygon.xyz</strong>, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak menyetujui salah satu ketentuan, Anda tidak diperkenankan menggunakan layanan kami.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl md:text-2xl font-outfit font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-2 h-6 bg-[#ADFA1D] rounded-full inline-block"></span>
                                2. Deskripsi Layanan
                            </h2>
                            <p>
                                <strong>BikinPolygon</strong> menyediakan platform perangkat lunak berbasis web (Software-as-a-Service) untuk pembuatan, penyuntingan, koreksi luas, dan ekspor data geospasial Shapefile (.shp, .shx, .dbf, .prj) serta format spasial lainnya untuk kebutuhan pelaporan perizinan OSS RBA BKPM dan AMDALNET KLHK.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl md:text-2xl font-outfit font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-2 h-6 bg-[#ADFA1D] rounded-full inline-block"></span>
                                3. Akun dan Keamanan
                            </h2>
                            <p>
                                Anda bertanggung jawab penuh untuk menjaga keamanan akses akun Google OAuth atau kredensial yang Anda gunakan untuk masuk ke platform kami. Aktivitas yang dilakukan melalui akun Anda merupakan tanggung jawab Anda sepenuhnya.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl md:text-2xl font-outfit font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-2 h-6 bg-[#ADFA1D] rounded-full inline-block"></span>
                                4. Ketentuan Pembayaran dan Paket
                            </h2>
                            <ul className="list-disc list-inside space-y-1.5 pl-2">
                                <li><strong>Free Tier:</strong> Pengguna berhak atas ekspor polygon gratis untuk batas luas ≤ 50 m².</li>
                                <li><strong>Paket Durasi Akses:</strong> Pembayaran akses premium diproses secara instan melalui sistem QRIS / Midtrans resmi. Pembelian paket bersifat final dan tidak dapat dikembalikan (*non-refundable*), kecuali terjadi kesalahan teknis dari pihak sistem kami.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl md:text-2xl font-outfit font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-2 h-6 bg-[#ADFA1D] rounded-full inline-block"></span>
                                5. Batasan Tanggung Jawab
                            </h2>
                            <p>
                                BikinPolygon menyediakan perkakas bantu geospasial. Pengguna bertanggung jawab penuh atas kebenaran batas persil tanah, koordinat GPS, dan dokumen sertifikat yang diunggah ke portal perizinan instansi pemerintah.
                            </p>
                        </section>

                        <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                            <Link to="/" className="text-sm font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                                ← Kembali ke Beranda BikinPolygon
                            </Link>
                            <Link to="/privacy" className="text-sm font-bold text-slate-600 hover:text-slate-900">
                                Kebijakan Privasi →
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <LandingFooter />
        </div>
    );
}
