import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Footer from '@/components/Footer';
import { CheckCircle2, Map, Zap, Shield, Loader2, Coins, Menu, X, BookOpen } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { KABUPATEN_JAWA } from '@/data/locations';
import { Badge } from '@/components/ui/badge';
import {
    MONEY_KEYWORDS,
    TECHNICAL_KEYWORDS,
    PROFESSIONAL_KEYWORDS,
    LONG_TAIL_KEYWORDS,
    generateSchemaMarkup
} from '@/data/seo_keywords';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';

// --- AEO ENGINE COMPONENT ---
function AEOEngine() {
    const [aeoData, setAeoData] = useState([]);

    useEffect(() => {
        // Fetch active AEO scenarios dynamically
        api.get('/aeo').then(res => setAeoData(res.data.filter(item => item.is_active))).catch(console.error);
    }, []);

    useEffect(() => {
        if (aeoData.length === 0) return;

        // Generate and Inject JSON-LD Schema
        const faqs = aeoData.filter(i => i.schema_type === 'FAQPage');
        
        if (faqs.length > 0) {
            const schema = {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": faqs.map(faq => ({
                    "@type": "Question",
                    "name": faq.target_problem,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": faq.solution_text
                    }
                }))
            };

            const script = document.createElement('script');
            script.type = "application/ld+json";
            script.innerHTML = JSON.stringify(schema);
            document.head.appendChild(script);

            return () => { 
                if (document.head.contains(script)) {
                    document.head.removeChild(script); 
                }
            };
        }
    }, [aeoData]);

    if (aeoData.length === 0) return null;

    return (
        // INVISIBLE SEMANTIC HTML: Tailwind's 'sr-only' makes it visually hidden 
        // but strictly readable by AI Answer Engines, bots, and screen readers.
        <section className="sr-only" aria-label="Answer Engine Optimization Content">
            {aeoData.map(item => (
                <article key={item.id}>
                    <h2>{item.target_problem}</h2>
                    <p>{item.solution_text}</p>
                </article>
            ))}
        </section>
    );
}

// --- INTERACTIVE COMPONENTS ---

// 1. Tilt Effect Card (3D Hover)
const TiltCard = ({ children, className }) => {
    const cardRef = useRef(null);
    const [tiltStyle, setTiltStyle] = useState({});

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg rotation
        const rotateY = ((x - centerX) / centerX) * 10;

        setTiltStyle({
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
            transition: 'transform 0.1s ease-out'
        });
    };

    const handleMouseLeave = () => {
        setTiltStyle({
            transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
            transition: 'transform 0.5s ease-out'
        });
    };

    return (
        <div 
            ref={cardRef} 
            className={className} 
            style={tiltStyle}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </div>
    );
};

// 2. Scroll Reveal Animation
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
                transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
                transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`
            }}
            className={className}
        >
            {children}
        </div>
    );
};

// --- MAIN PAGE ---

export default function Landing() {
    const { login, user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [posts, setPosts] = useState([]);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Track mouse for parallax background elements
    useEffect(() => {
        const handleGlobalMouseMove = (e) => {
            setMousePos({ 
                x: (e.clientX / window.innerWidth) - 0.5, 
                y: (e.clientY / window.innerHeight) - 0.5 
            });
        };
        window.addEventListener('mousemove', handleGlobalMouseMove);
        return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
    }, []);

    useEffect(() => {
        const fetchPosts = async () => {
            const { data } = await supabase
                .from('articles')
                .select('*')
                .eq('is_published', true)
                .order('created_at', { ascending: false })
                .limit(6);
            if (data) setPosts(data);
        };
        fetchPosts();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const loggedInUser = await login(email, password);
            if (loggedInUser) {
                if (loggedInUser.role === 'admin') window.location.href = '/kelola';
                else window.location.href = '/dashboard';
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-slate-900 overflow-x-hidden font-sans selection:bg-[#39FF14] selection:text-black">
            <Helmet>
                <title>Buat Polygon NIB OSS & Peta Tanah Online | LineSima</title>
                <script type="application/ld+json">
                    {JSON.stringify(generateSchemaMarkup("Pembuatan Polygon OSS", "Indonesia"))}
                </script>
            </Helmet>

            {/* Navbar */}
            <nav className="bg-[#1D4ED8] text-white border-b-4 border-black sticky top-0 z-50 px-4 transition-transform duration-300">
                <div className="container mx-auto flex h-20 items-center justify-between">
                    <div className="font-black text-2xl flex items-center gap-3 tracking-tighter uppercase group cursor-pointer">
                        <div className="bg-[#39FF14] p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-12 transition-transform duration-300">
                            <img src="/assets/logo.svg" alt="Logo" className="w-8 h-8 filter invert" />
                        </div>
                        <span className="text-[1.5rem]">[ LineSima ]</span>
                    </div>

                    <div className="hidden md:flex gap-4 items-center">
                        <a href="/" className="font-bold border-2 border-transparent hover:border-[#39FF14] px-4 py-2 rounded-xl transition-all">
                            Beranda
                        </a>
                        <div className="relative group">
                            <button className="font-bold border-2 border-transparent hover:border-[#39FF14] px-4 py-2 rounded-xl transition-all flex items-center gap-1">
                                Solusi Industri <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>
                            <div className="absolute left-0 mt-2 w-56 bg-white text-black border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden z-50">
                                <a href="#" className="px-4 py-3 font-bold hover:bg-[#39FF14] border-b-2 border-black">UMKM</a>
                                <a href="#" className="px-4 py-3 font-bold hover:bg-[#39FF14] border-b-2 border-black">Restoran</a>
                                <a href="#" className="px-4 py-3 font-bold hover:bg-[#39FF14] border-b-2 border-black">Gudang</a>
                                <a href="#" className="px-4 py-3 font-bold hover:bg-[#39FF14]">Konsultan Perizinan</a>
                            </div>
                        </div>
                        <div className="relative group">
                            <button className="font-bold border-2 border-transparent hover:border-[#39FF14] px-4 py-2 rounded-xl transition-all flex items-center gap-1">
                                Harga <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>
                            <div className="absolute left-0 mt-2 w-48 bg-white text-black border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden z-50">
                                <a href="/payment" className="px-4 py-3 font-bold hover:bg-[#39FF14] border-b-2 border-black">Regular</a>
                                <a href="/payment" className="px-4 py-3 font-bold hover:bg-[#39FF14] border-b-2 border-black">Pro</a>
                                <a href="/payment" className="px-4 py-3 font-bold hover:bg-[#39FF14]">Unlimited</a>
                            </div>
                        </div>
                        {user ? (
                            <Button asChild className="bg-[#39FF14] hover:bg-[#32e612] text-black font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] rounded-xl uppercase h-12 px-6 transition-all">
                                <a href="/dashboard">Dashboard</a>
                            </Button>
                        ) : (
                            <>
                                <button onClick={() => document.getElementById('auth-card').scrollIntoView({ behavior: 'smooth' })} className="font-bold border-2 border-transparent hover:border-[#39FF14] px-4 py-2 rounded-xl transition-all">
                                    Masuk
                                </button>
                                <Button onClick={() => document.getElementById('auth-card').scrollIntoView({ behavior: 'smooth' })} className="bg-[#39FF14] hover:bg-[#32e612] text-black font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] rounded-xl uppercase h-12 px-6 transition-all">
                                    Mulai Sekarang
                                </Button>
                            </>
                        )}
                    </div>
                    <button className="md:hidden bg-[#39FF14] text-black p-2 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b-4 border-black p-6 shadow-[0px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 text-black">
                        <a href="/" className="font-bold text-lg border-b-2 border-black pb-2 hover:text-[#39FF14] transition-colors">Beranda</a>
                        <div className="font-bold text-lg border-b-2 border-black pb-2 text-slate-500">Solusi Industri</div>
                        <a href="/payment" className="font-bold text-lg border-b-2 border-black pb-2 hover:text-[#39FF14] transition-colors">Harga / Cara Pembayaran</a>
                        {user ? (
                            <a href="/dashboard" className="bg-[#39FF14] text-black font-black border-2 border-black p-4 text-center uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-2">Dashboard</a>
                        ) : (
                            <div className="flex flex-col gap-3 mt-2">
                                <button onClick={() => { setIsMenuOpen(false); document.getElementById('auth-card')?.scrollIntoView({ behavior: 'smooth' })}} className="font-bold border-2 border-black p-4 text-center uppercase">Masuk</button>
                                <button onClick={() => { setIsMenuOpen(false); document.getElementById('auth-card')?.scrollIntoView({ behavior: 'smooth' })}} className="bg-[#39FF14] hover:bg-[#32e612] text-black font-black border-2 border-black p-4 text-center uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Mulai Sekarang</button>
                            </div>
                        )}
                    </div>
                )}
            </nav>

            {/* HERO SECTION */}
            <section className="relative pt-20 pb-40 lg:pt-32 lg:pb-52 overflow-hidden bg-[#1D4ED8] text-white">
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.1) 2px, transparent 2px)', backgroundSize: '60px 60px', backgroundPosition: 'center center' }}></div>
                
                {/* Interactive Parallax Overlays */}
                <div 
                    className="absolute inset-0 right-0 left-1/2 bg-[url('/assets/satelit-dark.jpg')] bg-cover bg-center mix-blend-luminosity opacity-20 pointer-events-none transition-transform duration-100 ease-out"
                    style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` }}
                ></div>

                {/* Parallax Sticker */}
                <div 
                    className="absolute top-[10%] left-[45%] w-32 h-32 bg-[#39FF14] rounded-full border-4 border-black flex items-center justify-center text-center text-black font-black text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10 hidden lg:flex transition-transform duration-100 ease-out cursor-pointer hover:scale-110"
                    style={{ transform: `translate(${mousePos.x * -40}px, ${mousePos.y * -40}px) rotate(-12deg)` }}
                >
                    UNDUH<br/>INSTAN
                </div>

                <div className="container relative z-20 grid lg:grid-cols-12 gap-12 items-center px-4 mx-auto max-w-[1400px]">
                    <div className="lg:col-span-7 space-y-8">
                        <Reveal>
                            <div className="inline-flex items-center font-mono font-bold bg-black/30 text-[#39FF14] px-4 py-2 rounded-lg text-sm border border-white/20 hover:bg-black/50 transition-colors cursor-default">
                                // Layanan Resmi Geospasial
                            </div>
                        </Reveal>
                        
                        <Reveal delay={100}>
                            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter leading-[0.95] uppercase drop-shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
                                PEMBUATAN<br />
                                <span className="text-[#39FF14] inline-block -rotate-2 hover:rotate-2 transition-transform duration-300">POLYGON</span><br />
                                NIB OSS
                            </h1>
                        </Reveal>
                        
                        <Reveal delay={200}>
                            <p className="text-xl md:text-2xl font-semibold bg-black/20 p-6 rounded-2xl border-l-4 border-[#39FF14] max-w-2xl leading-relaxed hover:bg-black/30 transition-colors">
                                Hemat berjam-jam waktu Anda dibanding belajar QGIS atau menunggu Biro Jasa. Buat file Polygon (.shp) presisi tinggi untuk NIB OSS dalam hitungan menit.
                            </p>
                        </Reveal>
                        
                        <Reveal delay={300}>
                            <div className="flex flex-wrap items-center gap-4 pt-4">
                                {['Standar ESRI Shapefile', 'Akurasi Tinggi', 'Dokumentasi Lengkap'].map((text, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur-md border-2 border-white/20 px-5 py-3 rounded-full font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:-translate-y-1 hover:bg-white/20 transition-all cursor-default">
                                        <div className="w-4 h-4 rounded-full bg-[#39FF14] border-2 border-black animate-pulse"></div>
                                        {text}
                                    </div>
                                ))}
                            </div>
                        </Reveal>
                    </div>

                    {/* Glassmorphism Auth Forms with Tilt Effect */}
                    <div className="lg:col-span-5 flex flex-col gap-8 justify-center lg:justify-end relative" id="auth-card">
                        <svg 
                            className="absolute -left-20 top-1/4 w-32 h-32 hidden lg:block drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)] transition-transform duration-100 ease-out" 
                            style={{ transform: `translate(${mousePos.x * 60}px, ${mousePos.y * 60}px) rotate(12deg)` }}
                            viewBox="0 0 120 80" fill="none"
                        >
                            <path d="M10 20 Q60 5 100 40" stroke="#39FF14" strokeWidth="4" strokeLinecap="round" />
                            <path d="M85 28 L100 40 L88 52" stroke="#39FF14" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>

                        <Reveal delay={400}>
                            <TiltCard className="w-full bg-white/10 backdrop-blur-[24px] border border-white/40 p-8 rounded-[32px] shadow-[0_24px_48px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(255,255,255,0.2)] relative overflow-hidden group">
                                <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-[20deg] group-hover:left-[200%] transition-all duration-1000 z-0"></div>

                                <div className="relative z-10">
                                    <div className="font-mono text-[#39FF14] font-bold mb-6 pb-4 border-b-2 border-dashed border-white/20">// AKSES SISTEM</div>
                                    {user ? (
                                        <>
                                            <h3 className="text-3xl font-black mb-2 uppercase">Selamat Datang!</h3>
                                            <p className="mb-6 opacity-90 font-mono text-sm">{user.email}</p>
                                            <div className="bg-black/40 border-2 border-black rounded-2xl p-6 text-center mb-6 shadow-[inset_0_4px_8px_rgba(0,0,0,0.5)] hover:bg-black/50 transition-colors">
                                                <p className="font-mono text-[#39FF14] text-sm mb-2 font-bold uppercase">Saldo Token</p>
                                                <p className="text-5xl font-black text-white">{user.token_balance} <span className="text-xl">Token</span></p>
                                            </div>
                                            <Button asChild className="w-full bg-[#39FF14] hover:bg-[#32e612] text-black border-4 border-black rounded-2xl font-black text-xl h-16 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-wide">
                                                <a href="/dashboard">[ &gt; BUKA DASHBOARD ]</a>
                                            </Button>
                                        </>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-5">
                                            <div>
                                                <label className="block font-mono font-bold text-sm mb-2 tracking-widest">USERNAME</label>
                                                <Input type="email" placeholder="nama@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-white/90 text-black border-4 border-transparent focus-visible:border-[#39FF14] focus-visible:ring-0 rounded-2xl p-6 font-bold text-lg shadow-[inset_0_4px_6px_rgba(0,0,0,0.1)] transition-all h-auto" />
                                            </div>
                                            <div>
                                                <label className="block font-mono font-bold text-sm mb-2 tracking-widest">PASSWORD</label>
                                                <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-white/90 text-black border-4 border-transparent focus-visible:border-[#39FF14] focus-visible:ring-0 rounded-2xl p-6 font-bold text-lg shadow-[inset_0_4px_6px_rgba(0,0,0,0.1)] transition-all h-auto" />
                                            </div>
                                            <Button type="submit" disabled={isLoading} className="w-full bg-[#39FF14] hover:bg-[#32e612] text-black border-4 border-black rounded-2xl font-black text-xl h-16 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-wide mt-4">
                                                {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "[ > MASUK SISTEM ]"}
                                            </Button>
                                        </form>
                                    )}
                                </div>
                            </TiltCard>
                        </Reveal>

                        {!user && (
                            <Reveal delay={500}>
                                <div className="w-full bg-[#ff2a2a]/10 backdrop-blur-[24px] border border-[#ff2a2a]/40 p-8 rounded-[32px] shadow-[0_24px_48px_rgba(0,0,0,0.3)] mt-2 hover:bg-[#ff2a2a]/20 transition-colors">
                                    <div className="font-mono text-[#ff2a2a] font-bold mb-4 pb-4 border-b-2 border-dashed border-white/20">⚠ // AKTIVASI AKUN</div>
                                    <p className="font-bold text-white/90 mb-6 leading-relaxed">Belum memiliki akses? Wajib aktivasi akun terlebih dahulu.</p>
                                    <Button size="lg" className="w-full bg-[#ff2a2a] hover:bg-[#e62626] text-white border-4 border-black rounded-2xl font-black text-lg h-16 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-wide" asChild>
                                        <a href="/payment">[ &gt; AKTIVASI DISINI ]</a>
                                    </Button>
                                </div>
                            </Reveal>
                        )}
                    </div>
                </div>
            </section>

            {/* MARQUEE DIVIDER */}
            <div className="bg-[#39FF14] border-y-8 border-black overflow-hidden py-4 -mt-8 relative z-30 flex whitespace-nowrap rotate-1 origin-left">
                <div className="animate-[marquee_20s_linear_infinite] flex gap-8 items-center font-black text-2xl uppercase tracking-widest text-black">
                    {Array(10).fill("DIGITASI POLYGON INSTAN • NIB OSS • SHAPEFILE BPN • ").map((text, i) => (
                        <span key={i}>{text}</span>
                    ))}
                </div>
            </div>

            {/* BENTO FEATURES SECTION */}
            <section className="bg-white text-black -mt-16 pt-32 pb-24 rounded-t-[60px] lg:rounded-t-[80px] relative z-20 shadow-[0_-20px_60px_rgba(0,0,0,0.2)]">
                <div className="container px-4 max-w-[1400px] mx-auto">
                    <Reveal>
                        <div className="max-w-3xl mb-20">
                            <p className="font-mono text-[#1D4ED8] font-bold text-xl uppercase mb-4 tracking-widest">// Kenapa LineSima?</p>
                            <h2 className="text-5xl md:text-[4.5rem] font-black tracking-tighter leading-[1.05] uppercase">
                                Satu Platform.<br/>Semua Kebutuhan Geospasial.
                            </h2>
                        </div>
                    </Reveal>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 auto-rows-[auto]">
                        <Reveal delay={100} className="md:col-span-2 md:row-span-2">
                            <TiltCard className="h-full bg-[#E0E7FF] border-4 border-black rounded-[40px] p-10 flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-crosshair relative overflow-hidden group">
                                <div className="absolute -right-10 -bottom-10 text-[10rem] opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">⬡</div>
                                <div className="text-6xl mb-12">⬡</div>
                                <div className="relative z-10">
                                    <h3 className="text-4xl lg:text-5xl font-black uppercase mb-6 leading-tight">Standar ESRI Shapefile</h3>
                                    <p className="text-xl font-bold opacity-80 leading-relaxed max-w-md">Output file .shp, .shx, .dbf kompatibel dengan ArcGIS, QGIS, dan semua platform GIS tanpa konversi.</p>
                                </div>
                            </TiltCard>
                        </Reveal>

                        <Reveal delay={200} className="md:col-span-2">
                            <TiltCard className="h-full bg-[#39FF14] border-4 border-black rounded-[40px] p-10 flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-crosshair">
                                <div className="text-5xl mb-6">◎</div>
                                <h3 className="text-3xl font-black uppercase mb-4">Akurasi Tinggi</h3>
                                <p className="text-lg font-bold opacity-90">Digitasi berbasis citra satelit resolusi tinggi. Proyeksi WGS84 / UTM standar BPN.</p>
                            </TiltCard>
                        </Reveal>

                        <Reveal delay={300} className="md:col-span-1">
                            <TiltCard className="h-full bg-[#F8FAFC] border-4 border-black rounded-[40px] p-10 flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-crosshair">
                                <div className="text-5xl mb-6">⟁</div>
                                <h3 className="text-2xl font-black uppercase mb-4">Layer BPN</h3>
                                <p className="font-bold opacity-80">Overlay Peta Bidang Tanah resmi dari WMTS ATR/BPN.</p>
                            </TiltCard>
                        </Reveal>

                        <Reveal delay={400} className="md:col-span-1">
                            <TiltCard className="h-full bg-black text-white border-4 border-black rounded-[40px] p-10 flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] transition-all cursor-crosshair">
                                <div className="text-5xl mb-6 text-[#39FF14] animate-pulse">⬛</div>
                                <h3 className="text-2xl font-black uppercase mb-4">Ekspor Instan</h3>
                                <p className="font-bold opacity-80 text-white/80">Unduh hasil format SHP langsung dari browser.</p>
                            </TiltCard>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* CARA PENGGUNAAN / VIDEO TUTORIAL SECTION */}
            <section className="py-32 bg-[#F8FAFC]">
                <div className="container px-4 max-w-[1400px] mx-auto">
                    <Reveal>
                        <div className="max-w-3xl mb-16 mx-auto text-center flex flex-col items-center">
                            <Badge className="bg-[#1D4ED8] text-white hover:bg-[#1D4ED8] font-mono font-bold text-sm px-4 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-6 rounded-lg uppercase cursor-default">
                                // Video Tutorial
                            </Badge>
                            <h2 className="text-5xl md:text-[4.5rem] font-black tracking-tighter leading-[1.05] uppercase">
                                Cara Penggunaan
                            </h2>
                        </div>
                    </Reveal>

                    <Reveal delay={100}>
                        <div className="max-w-5xl mx-auto">
                            <TiltCard className="bg-[#39FF14] p-4 md:p-8 rounded-[40px] border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative group cursor-pointer">
                                <div className="absolute -top-6 -left-6 bg-white text-black font-black uppercase p-4 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10 w-24 h-24 flex items-center justify-center text-center text-xl transform -rotate-12 group-hover:rotate-12 transition-transform duration-300">
                                    ▶ PLAY
                                </div>
                                <div className="aspect-video w-full rounded-[24px] overflow-hidden border-4 border-black bg-black relative">
                                    <iframe 
                                        width="100%" 
                                        height="100%" 
                                        src="https://www.youtube.com/embed/3DpbXQSG0fY" 
                                        title="Cara Penggunaan LineSima" 
                                        frameBorder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                        allowFullScreen
                                        className="absolute inset-0 w-full h-full"
                                    ></iframe>
                                </div>
                            </TiltCard>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* PRICING SECTION */}
            <section className="py-32 bg-white border-y-8 border-black">
                <div className="container px-4 max-w-[1400px] mx-auto">
                    <Reveal>
                        <div className="bg-black text-white rounded-[60px] p-12 lg:p-20 relative shadow-[16px_16px_0px_0px_rgba(57,255,20,1)] border-4 border-black overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#1D4ED8] rounded-bl-full opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
                            
                            <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
                                <div>
                                    <h2 className="text-4xl md:text-5xl font-black uppercase mb-8 leading-tight">Sistem Token Fleksibel & Hemat</h2>
                                    <p className="text-xl font-bold opacity-80 mb-10 leading-relaxed">
                                        Tidak ada biaya tersembunyi atau langganan bulanan yang mengikat. Cukup isi ulang saldo token saat Anda membutuhkannya.
                                    </p>
                                    <Button size="lg" className="bg-[#39FF14] hover:bg-[#32e612] text-black border-4 border-black rounded-2xl font-black text-xl h-16 shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] active:translate-y-[4px] active:shadow-none uppercase tracking-wide px-8 transition-all" asChild>
                                        <a href="/payment">Lihat Cara Pembayaran</a>
                                    </Button>
                                </div>

                                <div className="space-y-6">
                                    <TiltCard className="bg-white/10 p-8 rounded-3xl border-2 border-white/20 backdrop-blur-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
                                        <div className="flex items-center gap-6 mb-4">
                                            <div className="p-4 bg-[#1D4ED8] rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                                                <Coins className="w-10 h-10 text-white" />
                                            </div>
                                            <div>
                                                <div className="font-mono text-[#39FF14] font-bold text-sm uppercase">Self-Service</div>
                                                <div className="text-4xl font-black">5 Token</div>
                                            </div>
                                        </div>
                                        <p className="font-bold opacity-80 text-lg">
                                            Dapatkan hasil shapefile presisi tinggi hanya dengan 5 token per kali generate.
                                        </p>
                                    </TiltCard>

                                    <TiltCard className="bg-amber-500 p-8 rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group cursor-pointer hover:-translate-y-1 transition-transform">
                                        <div className="font-mono text-black font-black text-sm uppercase tracking-widest mb-2 border-b-2 border-black/20 pb-2 inline-block">LAYANAN DONE-FOR-YOU</div>
                                        <div className="text-3xl md:text-4xl font-black text-black leading-none mb-3">Rp 150.000<span className="text-lg opacity-80">/polygon</span></div>
                                        <p className="font-bold text-black/80 text-lg mb-6 leading-tight">
                                            Bingung atau gagal self-service? Kami buatkan file SHP siap upload untuk Anda. 100% dijamin lolos OSS RBA.
                                        </p>
                                        <Button size="lg" className="w-full bg-black hover:bg-slate-900 text-amber-500 font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] uppercase tracking-wide" asChild>
                                            <a href="https://wa.me/6288983840979?text=Halo%20Admin,%20saya%20ingin%20menggunakan%20jasa%20pembuatan%20polygon%20Done-For-You." target="_blank" rel="noreferrer">
                                                [ Pesan Jasa Sekarang ]
                                            </a>
                                        </Button>
                                    </TiltCard>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* BLOG SECTION */}
            <section className="py-32 bg-[#F8FAFC]">
                <div className="container px-4 max-w-[1400px] mx-auto">
                    <Reveal>
                        <div className="mb-20">
                            <Badge className="bg-[#1D4ED8] text-white hover:bg-[#1D4ED8] font-mono font-bold text-sm px-4 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-6 rounded-lg uppercase cursor-default">
                                Blog & Tutorial
                            </Badge>
                            <h2 className="text-5xl font-black uppercase tracking-tighter">Panduan OSS & GIS</h2>
                        </div>
                    </Reveal>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {posts.length > 0 ? (
                            posts.map((post, index) => (
                                <Reveal key={post.id} delay={index * 100}>
                                    <Link to={`/blog/${post.slug}`} className="group block h-full">
                                        <TiltCard className="bg-white border-4 border-black rounded-[32px] overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all h-full flex flex-col cursor-pointer">
                                            <div className="p-8 flex-1 flex flex-col">
                                                <div className="text-sm font-black text-[#1D4ED8] mb-4 flex items-center gap-2 uppercase">
                                                    <BookOpen className="w-5 h-5" />
                                                    Tutorial
                                                </div>
                                                <h3 className="text-2xl font-black mb-4 group-hover:text-[#1D4ED8] transition-colors leading-tight uppercase">
                                                    {post.title}
                                                </h3>
                                                <p className="font-bold text-black/70 line-clamp-3 mb-8 flex-1">
                                                    {post.excerpt}
                                                </p>
                                                <div className="flex items-center text-sm font-bold text-black/50 mt-auto pt-6 border-t-2 border-black/10 font-mono">
                                                    <span>{post.author || 'Admin'}</span>
                                                    <span className="mx-4">•</span>
                                                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </TiltCard>
                                    </Link>
                                </Reveal>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 font-bold opacity-50 text-xl font-mono">
                                // Belum ada artikel terbaru.
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Inline CSS for Marquee */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}} />

            <AEOEngine />
            <Footer />
        </div>
    );
}
