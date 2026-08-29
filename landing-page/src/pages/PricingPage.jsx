import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, ShieldCheck, CheckCircle2, ArrowUpRight, Flame, Sparkles } from 'lucide-react';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';
import SEOHead from '../seo/SEOHead';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5174';

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

export default function PricingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-slate-900 overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#ADFA1D] selection:text-black">
            <SEOHead 
                title="Harga Paket & Durasi Akses | BikinPolygon GIS Workspace" 
                description="Informasi harga paket durasi akses harian, mingguan, dan bulanan pembuatan polygon NIB OSS RBA & AMDALNET KLHK presisi tinggi." 
                canonicalUrl="https://bikinpolygon.xyz/harga"
            />
            <LandingNavbar />

            <main id="main-content">
            <section className="pt-32 pb-24 relative">
                <div className="container px-4 max-w-5xl mx-auto relative z-10">
                    <Reveal>
                        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ADFA1D]/10 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                                TRANSPARAN & TANPA MEMORY LIMITED
                            </div>
                            <h1 className="text-4xl md:text-6xl font-outfit font-extrabold text-slate-950 tracking-tight">
                                Durasi Akses & Paket
                            </h1>
                            <p className="text-slate-600 text-sm md:text-base font-normal">
                                Pilih paket durasi akses tanpa batas token. Akses Free Tier (≤ 50 m²) gratis tersedia untuk semua pengguna.
                            </p>
                        </div>
                    </Reveal>

                    {/* Unbox Style Pricing Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        {/* Plan 1: Harian */}
                        <Reveal delay={100}>
                            <div className="bg-[#0F172A] rounded-3xl p-6 border border-zinc-800 shadow-2xl flex flex-col justify-between h-full relative overflow-hidden group hover:border-[#ADFA1D]/50 transition-all">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold uppercase tracking-widest text-[#ADFA1D] bg-[#ADFA1D]/10 px-3 py-1 rounded-full border border-[#ADFA1D]/20">
                                            AKSES HARIAN
                                        </span>
                                        <Zap className="w-5 h-5 text-[#ADFA1D]" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-outfit font-extrabold text-white">Rp 27.000</div>
                                        <div className="text-slate-400 text-xs mt-1">Akses Penuh 24 Jam</div>
                                    </div>
                                    <div className="space-y-3 pt-2 text-xs text-slate-300 font-medium">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span>Tanpa Batas Jumlah Polygon</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span>Ekspor Shapefile ZIP & PDF</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span>Overlay Persil BPN (WMS)</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-8">
                                    <a 
                                        href={`${APP_URL}/dashboard`} 
                                        className="w-full bg-white hover:bg-slate-100 text-black font-outfit font-extrabold text-xs py-3.5 rounded-full text-center block transition-all"
                                    >
                                        Beli Akses Harian
                                    </a>
                                </div>
                            </div>
                        </Reveal>

                        {/* Plan 2: Mingguan (Populer) */}
                        <Reveal delay={200}>
                            <div className="bg-[#0F172A] rounded-3xl p-6 border-2 border-[#ADFA1D] shadow-2xl flex flex-col justify-between h-full relative overflow-hidden group scale-105">
                                <div className="absolute top-0 right-0 bg-[#ADFA1D] text-black text-[10px] font-black px-4 py-1 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1">
                                    <span>POPULER</span>
                                    <Flame className="w-3 h-3 fill-black" />
                                </div>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold uppercase tracking-widest text-white bg-white/10 px-3 py-1 rounded-full border border-white/20">
                                            AKSES MINGGUAN
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-outfit font-extrabold text-white">Rp 97.000</div>
                                        <div className="text-[#ADFA1D] text-xs font-bold mt-1">Akses Penuh 7 Hari</div>
                                    </div>
                                    <div className="space-y-3 pt-2 text-xs text-slate-300 font-medium">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-[#ADFA1D] shrink-0" />
                                            <span>Tanpa Batas Jumlah Polygon</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-[#ADFA1D] shrink-0" />
                                            <span>Format AMDALNET KLHK & NIB OSS</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-[#ADFA1D] shrink-0" />
                                            <span>Prioritas Dukungan WA</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-8">
                                    <a 
                                        href={`${APP_URL}/dashboard`} 
                                        className="w-full bg-[#ADFA1D] hover:bg-[#9fe318] text-black font-outfit font-extrabold text-xs py-3.5 rounded-full text-center block shadow-[0_0_25px_rgba(173,250,29,0.4)] transition-all"
                                    >
                                        Beli Akses Mingguan
                                    </a>
                                </div>
                            </div>
                        </Reveal>

                        {/* Plan 3: Bulanan */}
                        <Reveal delay={300}>
                            <div className="bg-[#0F172A] rounded-3xl p-6 border border-zinc-800 shadow-2xl flex flex-col justify-between h-full relative overflow-hidden group hover:border-[#ADFA1D]/50 transition-all">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold uppercase tracking-widest text-[#ADFA1D] bg-[#ADFA1D]/10 px-3 py-1 rounded-full border border-[#ADFA1D]/20">
                                            AKSES BULANAN
                                        </span>
                                        <Sparkles className="w-5 h-5 text-[#ADFA1D]" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-outfit font-extrabold text-white">Rp 247.000</div>
                                        <div className="text-slate-400 text-xs mt-1">Akses Penuh 28 Hari</div>
                                    </div>
                                    <div className="space-y-3 pt-2 text-xs text-slate-300 font-medium">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span>Akses Penuh Selama 28 Hari</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span>Sangat Cocok Untuk Konsultan GIS</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span>Koreksi Luas Geodesik Otomatis</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-8">
                                    <a 
                                        href={`${APP_URL}/dashboard`} 
                                        className="w-full bg-white hover:bg-slate-100 text-black font-outfit font-extrabold text-xs py-3.5 rounded-full text-center block transition-all"
                                    >
                                        Beli Akses Bulanan
                                    </a>
                                </div>
                            </div>
                        </Reveal>
                    </div>

                    <Reveal delay={400}>
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center max-w-xl mx-auto space-y-3">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" /> PEMBAYARAN INSTANT QRIS
                            </div>
                            <h3 className="font-outfit font-extrabold text-xl text-slate-900">
                                Otomatis Aktif Seketika
                            </h3>
                            <p className="text-slate-500 text-xs leading-relaxed">
                                Seluruh transaksi diproses secara real-time via Scan QRIS All Payment (BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay). Akses Anda akan langsung terbuka setelah pembayaran berhasil.
                            </p>
                        </div>
                    </Reveal>
                </div>
            </section>
            </main>

            <LandingFooter />
        </div>
    );
}
