import React from 'react';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';
import SEOHead from '../seo/SEOHead';
import { ShieldCheck, Lock, Eye, Database, Trash2, Mail, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
    const lastUpdated = "6 September 2026";

    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            <SEOHead
                title="Kebijakan Privasi (Privacy Policy) | BikinPolygon"
                description="Kebijakan privasi BikinPolygon mengenai pengumpulan data, penggunaan Google OAuth, keamanan informasi pengguna, dan hak privasi data Anda."
                canonicalUrl="https://bikinpolygon.xyz/privacy"
            />
            <LandingNavbar />

            <main className="flex-1 pt-32 pb-24">
                <div className="container mx-auto px-4 max-w-4xl">
                    {/* Header */}
                    <div className="text-center space-y-4 mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ADFA1D]/20 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                            Dokumen Resmi Perlindungan Data
                        </div>
                        <h1 className="text-3xl md:text-5xl font-outfit font-extrabold text-slate-950 tracking-tight">
                            Kebijakan Privasi (Privacy Policy)
                        </h1>
                        <p className="text-slate-600 text-sm md:text-base font-medium">
                            Terakhir diperbarui: <span className="font-semibold text-slate-900">{lastUpdated}</span> | Berlaku untuk platform <span className="font-bold text-slate-900">BikinPolygon</span> (bikinpolygon.xyz & app.bikinpolygon.xyz)
                        </p>
                    </div>

                    {/* Content Box */}
                    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-200/80 space-y-8 text-slate-700 text-sm md:text-base leading-relaxed">
                        
                        <section className="space-y-3">
                            <h2 className="text-xl md:text-2xl font-outfit font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-2 h-6 bg-[#ADFA1D] rounded-full inline-block"></span>
                                1. Pendahuluan
                            </h2>
                            <p>
                                Selamat datang di <strong>BikinPolygon</strong> ("kami", "aplikasi", atau "BikinPolygon GIS Workspace"). Kami berkomitmen untuk melindungi privasi dan keamanan data pribadi pengguna kami. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi Anda ketika Anda menggunakan situs web kami di <strong>https://bikinpolygon.xyz</strong> dan aplikasi web kami di <strong>https://app.bikinpolygon.xyz</strong>.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl md:text-2xl font-outfit font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-2 h-6 bg-[#ADFA1D] rounded-full inline-block"></span>
                                2. Informasi yang Kami Kumpulkan
                            </h2>
                            <p>Kami hanya mengumpulkan informasi yang esensial untuk menyediakan layanan pemetaan GIS dan perizinan lahan:</p>
                            <ul className="list-disc list-inside space-y-2 pl-2">
                                <li>
                                    <strong>Data Autentikasi Pengguna (Google OAuth & Email):</strong> Saat Anda masuk menggunakan Google Sign-In, kami menerima informasi profil publik dasar dari Google, yaitu <em>Nama Lengkap</em>, <em>Alamat Email</em>, dan <em>Foto Profil</em>. Kami <strong>tidak pernah</strong> memiliki akses ke kata sandi Google Anda.
                                </li>
                                <li>
                                    <strong>Data Geospasial & Proyek Pengguna:</strong> Titik koordinat latitude/longitude, batas polygon lahan, berkas Shapefile (.shp), GeoJSON, KML yang Anda gambar atau unggah ke dalam workspace BikinPolygon.
                                </li>
                                <li>
                                    <strong>Data Transaksi:</strong> Catatan histori pembelian durasi akses paket atau token melalui penyedia gerbang pembayaran resmi (Midtrans/QRIS). Kami <strong>tidak</strong> menyimpan informasi kartu debit/kredit Anda.
                                </li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl md:text-2xl font-outfit font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-2 h-6 bg-[#ADFA1D] rounded-full inline-block"></span>
                                3. Penggunaan Data Pengguna Google (Google User Data Compliance)
                            </h2>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950 text-xs md:text-sm space-y-2">
                                <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Kepatuhan Kebijakan Data Pengguna Layanan Google API:
                                </p>
                                <p>
                                    Penggunaan dan transfer informasi yang diterima BikinPolygon dari Google API ke aplikasi lain akan selalu mematuhi <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="underline font-bold text-emerald-800">Google API Services User Data Policy</a>, termasuk persyaratan <em>Limited Use</em>.
                                </p>
                            </div>
                            <p>Secara spesifik, data dari Google OAuth hanya digunakan untuk:</p>
                            <ul className="list-disc list-inside space-y-1.5 pl-2">
                                <li>Mengidentifikasi sesi login akun Anda secara aman.</li>
                                <li>Menghubungkan proyek polygon dan riwayat ekspor Shapefile ke akun Anda.</li>
                                <li>Mengirimkan notifikasi tagihan atau status perizinan jika diperlukan.</li>
                            </ul>
                            <p className="font-semibold text-slate-900">
                                Kami TIDAK PERNAH menjual data pribadi atau data Google Anda kepada pihak ketiga, dan TIDAK MENGGUNAKAN data akun Anda untuk tujuan periklanan atau penargetan iklan.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl md:text-2xl font-outfit font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-2 h-6 bg-[#ADFA1D] rounded-full inline-block"></span>
                                4. Penyimpanan dan Keamanan Data
                            </h2>
                            <p>
                                Seluruh data disimpan pada infrastruktur cloud terenkripsi (Supabase PostgreSQL & Cloudflare Security) yang memenuhi standar industri modern. Komunikasi antara browser pengguna dan server kami selalu menggunakan enkripsi aman HTTPS (SSL/TLS 256-bit).
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl md:text-2xl font-outfit font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-2 h-6 bg-[#ADFA1D] rounded-full inline-block"></span>
                                5. Penghapusan dan Hak Pengguna Atas Data
                            </h2>
                            <p>
                                Anda memiliki hak penuh untuk mengakses, memperbarui, atau meminta penghapusan permanen atas seluruh akun dan data geospasial Anda dari sistem kami.
                            </p>
                            <p>
                                Untuk meminta penghapusan akun atau data, Anda dapat menghubungi kami melalui email di <strong>support@bikinpolygon.xyz</strong> atau WhatsApp di <strong>+62-889-8384-0979</strong>. Data Anda akan dihapus dalam waktu 3x24 jam kerja.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl md:text-2xl font-outfit font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-2 h-6 bg-[#ADFA1D] rounded-full inline-block"></span>
                                6. Kontak Pengembang & Dukungan
                            </h2>
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2 text-xs md:text-sm">
                                <p><strong>Nama Aplikasi:</strong> BikinPolygon (BikinPolygon GIS Workspace)</p>
                                <p><strong>Domain Resmi:</strong> https://bikinpolygon.xyz & https://app.bikinpolygon.xyz</p>
                                <p><strong>Email Kontak Dukungan:</strong> support@bikinpolygon.xyz / admin@bikinpolygon.xyz</p>
                                <p><strong>WhatsApp Customer Support:</strong> +62 889-8384-0979</p>
                                <p><strong>Lokasi:</strong> Indonesia</p>
                            </div>
                        </section>

                        <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                            <Link to="/" className="text-sm font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                                ← Kembali ke Beranda BikinPolygon
                            </Link>
                            <Link to="/terms" className="text-sm font-bold text-slate-600 hover:text-slate-900">
                                Syarat & Ketentuan Layanan →
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <LandingFooter />
        </div>
    );
}
