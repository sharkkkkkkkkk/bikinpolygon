import { Component, ArrowUpRight } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-black text-white border-t-8 border-black pt-24 pb-12 relative overflow-hidden z-20">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#39FF14 2px, transparent 2px), linear-gradient(90deg, #39FF14 2px, transparent 2px)', backgroundSize: '60px 60px', backgroundPosition: 'center center' }}></div>

            <div className="container mx-auto px-4 max-w-[1400px] relative z-10">
                
                {/* Brutalist Banner inside Footer */}
                <div className="bg-[#39FF14] text-black border-4 border-black rounded-[32px] p-8 md:p-12 mb-20 flex flex-col md:flex-row justify-between items-center gap-8 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Siap Mulai?</h2>
                        <p className="font-bold text-lg opacity-80 max-w-md">Bergabunglah dan otomasi pembuatan shapefile Anda hari ini.</p>
                    </div>
                    <a href="/payment" className="bg-black text-[#39FF14] border-4 border-black px-10 py-5 rounded-2xl font-black text-2xl uppercase hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-0 active:shadow-none transition-all cursor-pointer whitespace-nowrap">
                        Mulai Sekarang
                    </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
                    {/* Brand */}
                    <div className="space-y-6 lg:col-span-1">
                        <div className="flex items-center gap-3 font-black text-3xl uppercase tracking-tighter">
                            <div className="bg-[#39FF14] p-2 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transform -rotate-6">
                                <img src="/assets/logo.svg" alt="Logo" className="w-8 h-8 filter invert" />
                            </div>
                            <span>LineSima</span>
                        </div>
                        <p className="text-lg font-bold text-white/70 max-w-sm">
                            Sistem presisi pembuatan Polygon Geospasial. Automasi digitasi lahan secara instan untuk NIB OSS.
                        </p>
                        <div className="inline-block bg-white/10 px-4 py-2 font-mono text-[#39FF14] text-sm border border-white/20 rounded-lg shadow-[inset_2px_2px_0px_rgba(0,0,0,0.5)]">
                            ● STATUS: ONLINE
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h3 className="font-black text-xl mb-6 text-[#39FF14] uppercase border-b-2 border-[#39FF14]/30 pb-2 inline-block">Product</h3>
                        <ul className="space-y-4 font-bold text-lg">
                            {['Features', 'Pricing', 'API'].map((item) => (
                                <li key={item}>
                                    <a href="#" className="flex items-center group">
                                        <span className="w-0 overflow-hidden group-hover:w-6 transition-all duration-300 text-[#39FF14]">&gt;&gt;</span>
                                        <span className="group-hover:text-[#39FF14] group-hover:translate-x-2 transition-all duration-300">{item}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="font-black text-xl mb-6 text-[#39FF14] uppercase border-b-2 border-[#39FF14]/30 pb-2 inline-block">Company</h3>
                        <ul className="space-y-4 font-bold text-lg">
                            <li>
                                <a href="/about" className="flex items-center group">
                                    <span className="w-0 overflow-hidden group-hover:w-6 transition-all duration-300 text-[#39FF14]">&gt;&gt;</span>
                                    <span className="group-hover:text-[#39FF14] group-hover:translate-x-2 transition-all duration-300">About Us</span>
                                </a>
                            </li>
                            <li>
                                <a href="/privacy" className="flex items-center group">
                                    <span className="w-0 overflow-hidden group-hover:w-6 transition-all duration-300 text-[#39FF14]">&gt;&gt;</span>
                                    <span className="group-hover:text-[#39FF14] group-hover:translate-x-2 transition-all duration-300">Privacy Policy</span>
                                </a>
                            </li>
                            <li>
                                <a href="/terms" className="flex items-center group">
                                    <span className="w-0 overflow-hidden group-hover:w-6 transition-all duration-300 text-[#39FF14]">&gt;&gt;</span>
                                    <span className="group-hover:text-[#39FF14] group-hover:translate-x-2 transition-all duration-300">Terms of Service</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Ecosystem */}
                    <div>
                        <h3 className="font-black text-xl mb-6 text-[#39FF14] uppercase border-b-2 border-[#39FF14]/30 pb-2 inline-block">Ecosystem</h3>
                        <ul className="space-y-4 font-bold text-lg">
                            <li>
                                <a href="/" className="flex items-center gap-2 group hover:text-[#39FF14] transition-colors bg-white/5 p-3 rounded-xl border border-white/10 hover:border-[#39FF14]">
                                    <span className="flex-1">Main WebApp</span>
                                    <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </a>
                            </li>
                            <li>
                                <a href="/api-docs" className="flex items-center gap-2 group hover:text-[#39FF14] transition-colors bg-white/5 p-3 rounded-xl border border-white/10 hover:border-[#39FF14]">
                                    <span className="flex-1">API Documentation</span>
                                    <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t-4 border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="font-mono text-white/50 text-sm font-bold uppercase">
                        &copy; {new Date().getFullYear()} LineSima Systems. <br className="md:hidden" />All rights reserved.
                    </div>
                    <div className="flex gap-4">
                        {['TW', 'IG', 'DC'].map((social) => (
                            <a key={social} href="#" className="w-14 h-14 bg-white/5 border-2 border-white/20 rounded-full flex items-center justify-center font-black text-lg hover:bg-[#39FF14] hover:text-black hover:border-[#39FF14] transition-all hover:-translate-y-2 hover:shadow-[0_10px_0_0_rgba(57,255,20,0.3)]">
                                {social}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
