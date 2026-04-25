import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';
import { Coins } from 'lucide-react';

// --- INTERACTIVE COMPONENTS ---

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
        
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

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

export default function PaymentPage() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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

    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-slate-900 overflow-x-hidden font-sans selection:bg-[#39FF14] selection:text-black">

            {/* Navbar */}
            <nav className="bg-[#1D4ED8] text-white border-b-4 border-black sticky top-0 z-50 px-4">
                <div className="container mx-auto flex h-20 items-center justify-between">
                    <div className="font-black text-2xl flex items-center gap-3 tracking-tighter uppercase group cursor-pointer">
                        <div className="bg-[#39FF14] p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-12 transition-transform duration-300">
                            <img src="/assets/logo.svg" alt="Logo" className="w-8 h-8 filter invert" />
                        </div>
                        <span className="text-[1.5rem] hidden sm:block">[ LineSima ]</span>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="ghost" asChild className="font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white text-black hover:bg-slate-100 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none uppercase transition-all">
                            <a href="/">[ &lt; KEMBALI ]</a>
                        </Button>
                    </div>
                </div>
            </nav>

            <section className="py-20 lg:py-32 relative">
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 2px, transparent 2px), linear-gradient(90deg, rgba(0,0,0,0.05) 2px, transparent 2px)', backgroundSize: '60px 60px', backgroundPosition: 'center center' }}></div>

                <div className="container px-4 max-w-5xl mx-auto relative z-10">
                    
                    <Reveal>
                        <div className="mb-12 text-center md:text-left">
                             <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter drop-shadow-[4px_4px_0px_rgba(0,0,0,0.2)] text-[#1D4ED8] mb-4">
                                AKTIVASI<br/>
                                <span className="text-[#39FF14] inline-block -rotate-2 hover:rotate-2 transition-transform duration-300 cursor-default" style={{ WebkitTextStroke: '3px #000' }}>TOKEN</span>
                             </h1>
                             <p className="font-mono font-bold text-lg opacity-60 uppercase tracking-widest">// LineSima Billing System</p>
                        </div>
                    </Reveal>

                    <Reveal delay={100}>
                        <div className="bg-[#1D4ED8] text-white rounded-[40px] p-8 md:p-16 relative shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] border-4 border-black">
                            
                            {/* Decorative Parallax Badge */}
                            <div 
                                className="absolute -top-6 -right-6 md:-top-10 md:-right-10 bg-[#39FF14] text-black font-black uppercase p-4 rounded-full border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-20 w-32 h-32 md:w-40 md:h-40 flex items-center justify-center text-center text-xl md:text-2xl hover:scale-110 transition-transform duration-200 cursor-pointer"
                                style={{ transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px) rotate(12deg)` }}
                            >
                                TOP UP<br/>SEKARANG
                            </div>

                            <div className="relative z-10 max-w-3xl">
                                <h2 className="text-3xl md:text-4xl font-black mb-6 uppercase border-b-4 border-black inline-block pb-2">Cara Pembayaran</h2>
                                <p className="font-bold text-lg md:text-xl mb-12 opacity-90 max-w-2xl bg-black/20 p-6 rounded-2xl border-l-8 border-[#39FF14] hover:bg-black/30 transition-colors">
                                    Ikuti dua langkah mudah di bawah ini untuk mengaktifkan akun atau menambah saldo token Anda.
                                </p>

                                <div className="space-y-12">
                                    
                                    <Reveal delay={200}>
                                        <TiltCard className="bg-white text-black p-8 md:p-10 rounded-[32px] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative cursor-crosshair">
                                            <div className="absolute -top-6 -left-4 md:-left-6 bg-[#39FF14] text-black font-black uppercase px-6 py-2 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-3 text-xl hover:rotate-0 transition-transform">
                                                LANGKAH 1
                                            </div>
                                            <h3 className="text-3xl md:text-4xl font-black mt-4 mb-8 uppercase">Transfer via QRIS</h3>
                                            
                                            <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start">
                                                <div className="bg-white p-4 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] inline-block w-fit transform -rotate-1 hover:rotate-1 transition-transform duration-300">
                                                    <img src={`/assets/qrispay.jpg?v=${new Date().getTime()}`} className="w-72 md:w-80 h-auto object-contain rounded-xl border-2 border-black" alt="Scan QRIS Disini" />
                                                </div>
                                                <div className="space-y-6 font-bold text-lg flex-1">
                                                    <p className="bg-[#F8FAFC] p-6 rounded-2xl border-4 border-black shadow-[inset_4px_4px_0px_rgba(0,0,0,0.05)]">
                                                        Gunakan aplikasi e-wallet atau mobile banking favorit Anda <span className="opacity-60">(GoPay, OVO, Dana, ShopeePay, BCA Mobile, dll)</span> untuk scan QRIS.
                                                    </p>
                                                    <div className="bg-black text-white p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(57,255,20,1)] relative overflow-hidden group">
                                                        <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-[20deg] group-hover:left-[200%] transition-all duration-1000"></div>
                                                        <div className="text-sm text-[#39FF14] font-mono mb-2 uppercase tracking-widest">Harga Paket:</div>
                                                        <div className="text-4xl md:text-5xl font-black tracking-tighter">Rp 50.000 <span className="text-xl md:text-2xl font-normal opacity-80 block md:inline mt-2 md:mt-0">/ 15 Token</span></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TiltCard>
                                    </Reveal>

                                    <Reveal delay={300}>
                                        <TiltCard className="bg-white text-black p-8 md:p-10 rounded-[32px] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative cursor-crosshair">
                                            <div className="absolute -top-6 -left-4 md:-left-6 bg-[#39FF14] text-black font-black uppercase px-6 py-2 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-2 text-xl hover:-rotate-2 transition-transform">
                                                LANGKAH 2
                                            </div>
                                            <h3 className="text-3xl md:text-4xl font-black mt-4 mb-6 uppercase">Konfirmasi Pembayaran</h3>
                                            <p className="font-bold text-xl mb-8 opacity-90 max-w-xl leading-relaxed">
                                                Sudah transfer? Bagus! Kirimkan bukti screenshot pembayaran ke admin melalui WhatsApp untuk menerima saldo.
                                            </p>
                                            <Button size="lg" className="w-full md:w-auto bg-[#39FF14] hover:bg-[#32e612] text-black border-4 border-black rounded-2xl font-black text-xl md:text-2xl h-20 px-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-wide gap-3 group" asChild>
                                                <a href="https://wa.me/6288983840979?text=Halo%20Admin,%20saya%20sudah%20transfer%20untuk%20top%20up%20token.%20Mohon%20diproses." target="_blank" rel="noreferrer">
                                                    <span className="group-hover:scale-110 transition-transform block">[ &gt; Konfirmasi WhatsApp ]</span>
                                                </a>
                                            </Button>
                                        </TiltCard>
                                    </Reveal>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            <Footer />
        </div>
    );
}
