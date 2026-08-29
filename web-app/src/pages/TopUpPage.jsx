import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';
import { Sparkles, Flame, ShieldCheck, ArrowRight, Loader2, Check, QrCode } from 'lucide-react';
import QRCodePaymentModal from '@/components/QRCodePaymentModal';
import { useAuth } from '@/context/AuthContext';

export default function TopUpPage() {
    const { user, loading } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState('97000');
    const [qrModalOpen, setQrModalOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            window.location.href = `/login?redirect=${encodeURIComponent('/topup')}`;
        }
    }, [user, loading]);

    const plans = [
        {
            id: '27000',
            amount: 27000,
            title: 'Akses Harian (1 Hari)',
            desc: 'Akses Penuh 24 Jam',
            priceFormatted: 'Rp 27.000',
            isPopular: false
        },
        {
            id: '97000',
            amount: 97000,
            title: 'Akses Mingguan (7 Hari)',
            desc: 'Akses Penuh 7 Hari',
            priceFormatted: 'Rp 97.000',
            isPopular: true
        },
        {
            id: '247000',
            amount: 247000,
            title: 'Akses Bulanan (28 Hari)',
            desc: 'Akses Penuh 28 Hari',
            priceFormatted: 'Rp 247.000',
            isPopular: false
        }
    ];

    const handleCheckout = () => {
        if (!user) {
            window.location.href = `/login?redirect=${encodeURIComponent('/topup')}`;
            return;
        }
        setQrModalOpen(true);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-slate-900 overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif]">
            {/* Header Navbar */}
            <nav className="bg-[#0F172A] text-white sticky top-0 z-50 px-4 py-3 border-b border-zinc-800 shadow-md">
                <div className="container mx-auto flex items-center justify-between">
                    <a href="/dashboard" className="font-outfit font-extrabold text-xl flex items-center gap-2 tracking-tight">
                        <div className="w-8 h-8 rounded-full bg-[#ADFA1D] flex items-center justify-center text-black">
                            <img src="/assets/logo.svg" alt="Logo" className="w-4 h-4 filter invert" />
                        </div>
                        <span>Bikin<span className="text-[#ADFA1D]">Polygon</span></span>
                    </a>
                    <Button asChild variant="outline" className="border-zinc-700 text-slate-300 hover:text-white hover:bg-zinc-800 font-bold text-xs h-9 rounded-xl">
                        <a href="/dashboard">← Kembali ke Workspace</a>
                    </Button>
                </div>
            </nav>

            <section className="py-16 md:py-24 relative flex-1 flex items-center justify-center">
                <div className="container px-4 max-w-3xl mx-auto">
                    <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ADFA1D]/10 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5" /> BikinPolygon Pass
                        </div>
                        <h1 className="text-3xl md:text-5xl font-outfit font-extrabold text-slate-950 tracking-tight">
                            PILIH DURASI AKSES
                        </h1>
                        <p className="text-slate-600 text-xs md:text-sm">
                            Nikmati pembuatan Polygon Shapefile (AMDALNET/OSS NIB) dan Laporan PDF tanpa batasan jumlah token. Pembayaran cepat & instant via Scan QRIS.
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-2xl space-y-4">
                        {plans.map((plan) => {
                            const isSelected = selectedPlan === plan.id;
                            return (
                                <div
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan.id)}
                                    className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer flex items-center justify-between ${
                                        isSelected
                                            ? 'border-blue-600 bg-blue-50/50 shadow-md scale-[1.01]'
                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                    }`}
                                >
                                    {plan.isPopular && (
                                        <div className="absolute -top-3 left-4 bg-amber-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                            <span>POPULER</span>
                                            <Flame className="w-3 h-3 fill-white" />
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                            isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                                        }`}>
                                            {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                        </div>
                                        <div>
                                            <div className="font-outfit font-bold text-slate-900 text-base">
                                                {plan.title}
                                            </div>
                                            <div className="text-slate-500 text-xs font-medium">
                                                {plan.desc}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="font-outfit font-extrabold text-slate-900 text-lg md:text-xl">
                                        {plan.priceFormatted}
                                    </div>
                                </div>
                            );
                        })}

                        <div className="pt-4 space-y-3">
                            <Button
                                onClick={handleCheckout}
                                className="w-full bg-[#0F172A] hover:bg-slate-800 text-[#ADFA1D] font-outfit font-extrabold text-base h-14 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
                            >
                                <QrCode className="w-5 h-5 text-[#ADFA1D]" />
                                <span>Bayar via QRIS (QR Code Instant)</span>
                                <ArrowRight className="w-5 h-5" />
                            </Button>

                            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-semibold text-center pt-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                <span>Akses Otomatis Aktif Setelah Pembayaran Scan QRIS</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <QRCodePaymentModal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} />

            <Footer />
        </div>
    );
}
