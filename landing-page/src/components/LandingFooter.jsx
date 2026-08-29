import React from 'react';
import { ArrowUpRight, ShieldCheck, Zap, Globe, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5174';

export default function LandingFooter() {
    return (
        <footer className="bg-[#09090B] text-white pt-20 pb-12 relative overflow-hidden z-20 border-t border-zinc-800">
            {/* Subtle background radial light */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#ADFA1D]/5 blur-[120px] pointer-events-none"></div>

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                {/* Unbox Style Dark CTA Banner Container */}
                <div className="bg-gradient-to-r from-zinc-900 via-[#0F172A] to-zinc-900 border border-zinc-800 rounded-3xl p-8 md:p-12 mb-16 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl relative overflow-hidden group">
                    {/* Glowing highlight corner */}
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#ADFA1D]/10 rounded-full blur-3xl group-hover:bg-[#ADFA1D]/20 transition-all"></div>

                    <div className="space-y-2 text-center md:text-left relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ADFA1D]/10 border border-[#ADFA1D]/20 text-[#ADFA1D] text-xs font-bold uppercase tracking-wider">
                            <Zap className="w-3.5 h-3.5 fill-[#ADFA1D]" /> Pembuatan Instant Presisi Tinggi
                        </div>
                        <h2 className="text-3xl md:text-4xl font-outfit font-extrabold tracking-tight text-white">
                            Siap Digitasi Lahan Anda Sekarang?
                        </h2>
                        <p className="text-slate-400 text-sm md:text-base max-w-lg leading-relaxed">
                            Otomatiskan pembuatan polygon Shapefile (.shp) NIB OSS & AMDALNET. Nikmati ekspor Free Tier (≤ 50 m²) gratis.
                        </p>
                    </div>

                    <a 
                        href={`${APP_URL}/dashboard`} 
                        className="relative z-10 bg-[#ADFA1D] hover:bg-[#9fe318] text-black font-outfit font-extrabold text-base px-8 py-4 rounded-full shadow-[0_0_30px_rgba(173,250,29,0.35)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                        <span>Buka GIS Web App Now</span>
                        <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                    </a>
                </div>

                {/* Footer Multi-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
                    {/* Col 1: Brand Info */}
                    <div className="space-y-4">
                        <Link to="/" className="flex items-center gap-3 font-outfit font-extrabold text-2xl text-white tracking-tight">
                            <div className="w-8 h-8 rounded-full bg-[#ADFA1D] flex items-center justify-center text-black shadow-[0_0_15px_rgba(173,250,29,0.4)]">
                                <img src="/assets/logo.svg" alt="Logo" className="w-4 h-4 filter invert" />
                            </div>
                            <span>Bikin<span className="text-[#ADFA1D]">Polygon</span></span>
                        </Link>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Platform GIS Land Scaler presisi tinggi untuk pembuatan Polygon (.shp) NIB OSS RBA, AMDALNET, dan Peta Lahan Tanpa Software Tambahan.
                        </p>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            SYSTEM STATUS: ONLINE (v2.0)
                        </div>
                    </div>

                    {/* Col 2: Fitur & Solusi */}
                    <div>
                        <h3 className="font-outfit font-bold text-sm uppercase text-slate-200 tracking-wider mb-4 border-b border-zinc-800 pb-2">
                            Fitur & Solusi
                        </h3>
                        <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
                            <li><Link to="/" className="hover:text-[#ADFA1D] transition-colors">Polygon NIB OSS RBA</Link></li>
                            <li><Link to="/" className="hover:text-[#ADFA1D] transition-colors">AMDALNET Export Suite</Link></li>
                            <li><Link to="/" className="hover:text-[#ADFA1D] transition-colors">Overlay Persil BPN (WMS)</Link></li>
                            <li><Link to="/harga" className="hover:text-[#ADFA1D] transition-colors">1x Free & Paket Akses</Link></li>
                        </ul>
                    </div>

                    {/* Col 3: Bantuan & Fast-Track */}
                    <div>
                        <h3 className="font-outfit font-bold text-sm uppercase text-slate-200 tracking-wider mb-4 border-b border-zinc-800 pb-2">
                            Bantuan & Layanan
                        </h3>
                        <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
                            <li><Link to="/harga" className="hover:text-[#ADFA1D] transition-colors">Daftar Harga & Paket Akses</Link></li>
                            <li>
                                <a href="https://wa.me/6288983840979?text=Halo%20Admin,%20saya%20butuh%20bantuan%20BikinPolygon." target="_blank" rel="noreferrer" className="hover:text-[#ADFA1D] transition-colors flex items-center gap-1.5 text-emerald-400 font-bold">
                                    <span>Konsultasi Jasa Digitasi WA</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Col 4: Quick Launch Web App */}
                    <div>
                        <h3 className="font-outfit font-bold text-sm uppercase text-slate-200 tracking-wider mb-4 border-b border-zinc-800 pb-2">
                            Aplikasi GIS
                        </h3>
                        <div className="space-y-3">
                            <a 
                                href={`${APP_URL}/dashboard`} 
                                className="flex items-center justify-between group bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-[#ADFA1D]/40 p-3.5 rounded-2xl transition-all"
                            >
                                <div className="text-xs">
                                    <div className="font-bold text-white group-hover:text-[#ADFA1D] transition-colors">GIS Workspace Dashboard</div>
                                    <div className="text-[10px] text-slate-400">Direct Map Digitization Tool</div>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#ADFA1D] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Legal Notice */}
                <div className="border-t border-zinc-800/80 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs font-medium">
                    <div>
                        &copy; {new Date().getFullYear()} BikinPolygon GIS Systems. Hak Cipta Dilindungi.
                    </div>
                    <div className="flex items-center gap-6">
                        <Link to="/" className="hover:text-slate-400 transition-colors">Privasi</Link>
                        <Link to="/" className="hover:text-slate-400 transition-colors">Syarat & Ketentuan</Link>
                        <Link to="/" className="hover:text-slate-400 transition-colors">Dokumentasi API</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
