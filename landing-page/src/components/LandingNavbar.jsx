import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, ArrowUpRight, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5174';

export default function LandingNavbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="fixed top-4 left-0 right-0 z-50 px-4 pointer-events-none">
            <div className="max-w-6xl mx-auto bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 rounded-full px-5 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center justify-between pointer-events-auto transition-all duration-300">
                {/* Brand Logo */}
                <Link to="/" className="flex items-center gap-3 font-outfit font-extrabold text-xl text-white tracking-tight group">
                    <div className="w-9 h-9 rounded-full bg-[#ADFA1D] flex items-center justify-center text-black shadow-[0_0_15px_rgba(173,250,29,0.4)] group-hover:scale-110 transition-transform">
                        <img src="/assets/logo.svg" alt="BikinPolygon Logo" className="w-5 h-5 filter invert" />
                    </div>
                    <span className="flex items-center gap-1">
                        Bikin<span className="text-[#ADFA1D]">Polygon</span>
                    </span>
                </Link>

                {/* Desktop Nav Links */}
                <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-slate-300">
                    <Link to="/" className="px-4 py-2 rounded-full hover:text-white hover:bg-white/5 transition-all">
                        Beranda
                    </Link>
                    <a href="#specifications" className="px-4 py-2 rounded-full hover:text-white hover:bg-white/5 transition-all">
                        Spesifikasi Teknis
                    </a>
                    <a href="#faq" className="px-4 py-2 rounded-full hover:text-white hover:bg-white/5 transition-all">
                        Pertanyaan Umum
                    </a>
                    <a href="https://wa.me/6288983840979?text=Halo%20Admin,%20saya%20butuh%20bantuan%20BikinPolygon." target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full hover:text-white hover:bg-white/5 transition-all">
                        Jasa Fast-Track WA
                    </a>
                </nav>

                {/* Right Action CTA Button */}
                <div className="hidden md:flex items-center gap-3">
                    <a 
                        href={`${APP_URL}/dashboard`} 
                        className="bg-[#ADFA1D] hover:bg-[#9fe318] text-black font-extrabold text-xs px-5 py-2.5 rounded-full shadow-[0_0_20px_rgba(173,250,29,0.35)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                        <Zap className="w-3.5 h-3.5 fill-black" />
                        <span>Buka GIS Web App</span>
                    </a>
                </div>

                {/* Mobile Menu Toggle */}
                <button 
                    className="md:hidden w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors" 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle Navigation Menu"
                >
                    {isMenuOpen ? <X className="w-5 h-5 text-[#ADFA1D]" /> : <Menu className="w-5 h-5 text-white" />}
                </button>
            </div>

            {/* Mobile Navigation Drawer Dropdown */}
            {isMenuOpen && (
                <div className="md:hidden mt-2 max-w-6xl mx-auto bg-[#0F172A]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-white pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link to="/" onClick={() => setIsMenuOpen(false)} className="font-bold text-base border-b border-white/10 pb-3 hover:text-[#ADFA1D]">
                        Beranda
                    </Link>
                    <a href="#specifications" onClick={() => setIsMenuOpen(false)} className="font-bold text-base border-b border-white/10 pb-3 hover:text-[#ADFA1D]">
                        Spesifikasi Teknis
                    </a>
                    <a href="#faq" onClick={() => setIsMenuOpen(false)} className="font-bold text-base border-b border-white/10 pb-3 hover:text-[#ADFA1D]">
                        Pertanyaan Umum
                    </a>
                    <div className="pt-2 flex flex-col gap-3">
                        <a 
                            href={`${APP_URL}/dashboard`} 
                            onClick={() => setIsMenuOpen(false)} 
                            className="w-full bg-[#ADFA1D] hover:bg-[#9fe318] text-black font-extrabold py-3.5 rounded-2xl text-center text-sm shadow-[0_0_20px_rgba(173,250,29,0.4)] flex items-center justify-center gap-2"
                        >
                            <Zap className="w-4 h-4 fill-black" />
                            <span>Buka GIS Web App Now</span>
                        </a>
                    </div>
                </div>
            )}
        </header>
    );
}
