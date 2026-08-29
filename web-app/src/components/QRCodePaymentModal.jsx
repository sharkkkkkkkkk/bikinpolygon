import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Flame, Check, ArrowRight, Loader2, Sparkles, QrCode, Copy, RefreshCw, MessageSquare, CheckCircle2 } from 'lucide-react';
import { createPaymentOrder, checkAccessStatus, claimPaymentOrder } from '../lib/deviceAccess';
import { useAuth } from '@/context/AuthContext';

export default function QRCodePaymentModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState('97000'); // Default: Akses Mingguan 7 Hari
    const [step, setStep] = useState('select'); // 'select' | 'qr'
    const [loading, setLoading] = useState(false);
    const [orderData, setOrderData] = useState(null);
    const [copied, setCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState(900); // 15 Minutes timer
    const [claimOrderId, setClaimOrderId] = useState('');
    const [claimLoading, setClaimLoading] = useState(false);
    const [claimStatus, setClaimStatus] = useState(null);

    const handleClaimOrder = async () => {
        if (!claimOrderId.trim()) return;
        if (!user) {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
            return;
        }

        setClaimLoading(true);
        setClaimStatus(null);
        try {
            const res = await claimPaymentOrder(claimOrderId.trim());
            if (res?.success) {
                setClaimStatus({
                    type: 'success',
                    message: res.message || 'Pembayaran berhasil diverifikasi! Hak akses paket telah diaktifkan ke akun Anda.'
                });
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                setClaimStatus({
                    type: 'error',
                    message: res?.error || 'Order ID tidak ditemukan atau pembayaran belum terkonfirmasi di Pakasir.'
                });
            }
        } catch (err) {
            setClaimStatus({
                type: 'error',
                message: err.response?.data?.error || 'Gagal memverifikasi Order ID. Silakan pastikan Order ID sudah benar.'
            });
        } finally {
            setClaimLoading(false);
        }
    };

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

    useEffect(() => {
        let timer;
        if (step === 'qr' && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [step, timeLeft]);

    // Auto-poll payment status every 3 seconds when QR code is visible
    useEffect(() => {
        let pollInterval;
        if (step === 'qr' && orderData?.orderId) {
            pollInterval = setInterval(async () => {
                try {
                    const status = await checkAccessStatus(orderData.orderId);
                    if (status?.isOrderCompleted || status?.orderStatus === 'completed') {
                        clearInterval(pollInterval);
                        alert('🎉 Pembayaran Berhasil! Pakasir Webhook telah mengonfirmasi pembayaran & hak akses BikinPolygon Pass Anda aktif.');
                        window.location.reload();
                    }
                } catch (e) {}
            }, 3000);
        }
        return () => clearInterval(pollInterval);
    }, [step, orderData]);

    const formatTimer = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const activePlan = plans.find(p => p.id === selectedPlan) || plans[1];

    const handleGenerateQR = async () => {
        // Redirection check: user MUST be logged in to purchase access pass
        if (!user) {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
            return;
        }

        setLoading(true);
        try {
            const data = await createPaymentOrder(selectedPlan);
            setOrderData(data);
            setStep('qr');
            setTimeLeft(900);
        } catch (err) {
            console.error('[Payment Order Error]', err);
            alert('Gagal menyiapkan QR Code pembayaran. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyAmount = () => {
        const amtToCopy = orderData?.totalPayment || activePlan.amount;
        navigator.clipboard.writeText(amtToCopy.toString());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleVerifyStatus = async () => {
        setLoading(true);
        try {
            const status = await checkAccessStatus(orderData?.orderId);
            if (status?.isOrderCompleted || status?.orderStatus === 'completed') {
                alert('🎉 Pembayaran Berhasil Terverifikasi! Pakasir Webhook telah mengaktifkan BikinPolygon Pass Anda.');
                window.location.reload();
            } else {
                alert('Sistem belum menerima konfirmasi Webhook dari Pakasir. Silakan selesaikan pembayaran via QR Code.');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsAppConfirm = () => {
        const message = `Halo Admin BikinPolygon, saya sudah melakukan pembayaran via QR Code QRIS untuk paket *${activePlan.title}* (${activePlan.priceFormatted}).%0A%0AOrder ID: *${orderData?.orderId || 'NEW'}*%0AMohon bantu aktivasi akun saya. Terima kasih!`;
        window.open(`https://wa.me/6285183020614?text=${message}`, '_blank');
    };

    // QR Code Image generator URL (Custom Pakasir QRIS OR fallback API)
    const qrImageUrl = orderData?.qrImageUrl
        ? orderData.qrImageUrl
        : (orderData?.payUrl
            ? `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(orderData.payUrl)}`
            : `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=https://bikinpolygon.xyz/pay/${selectedPlan}`);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) setStep('select');
            onClose();
        }}>
            <DialogContent style={{ zIndex: 999999 }} className="max-w-md bg-white rounded-3xl p-6 md:p-7 border border-slate-200 shadow-2xl font-['Plus_Jakarta_Sans',sans-serif]">
                {step === 'select' ? (
                    <>
                        <DialogHeader className="text-left space-y-2">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider w-fit">
                                <Sparkles className="w-3.5 h-3.5" /> BikinPolygon Pass
                            </div>
                            <DialogTitle className="text-xl md:text-2xl font-outfit font-extrabold text-slate-900 tracking-tight uppercase">
                                PILIH DURASI AKSES
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 text-xs md:text-sm leading-relaxed">
                                Pembayaran cepat & otomatis via scan QRIS All Payment (BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay).
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 my-4">
                            {plans.map((plan) => {
                                const isSelected = selectedPlan === plan.id;
                                return (
                                    <div
                                        key={plan.id}
                                        onClick={() => setSelectedPlan(plan.id)}
                                        className={`relative rounded-2xl p-4 border-2 transition-all cursor-pointer flex items-center justify-between ${
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

                                        <div className="flex items-center gap-3.5">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                                            }`}>
                                                {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                            </div>
                                            <div>
                                                <div className="font-outfit font-bold text-slate-900 text-sm md:text-base">
                                                    {plan.title}
                                                </div>
                                                <div className="text-slate-500 text-xs font-medium">
                                                    {plan.desc}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="font-outfit font-extrabold text-slate-900 text-base md:text-lg">
                                            {plan.priceFormatted}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="pt-2 space-y-2">
                            <Button
                                onClick={handleGenerateQR}
                                disabled={loading}
                                className="w-full bg-[#0F172A] hover:bg-slate-800 text-[#ADFA1D] font-outfit font-extrabold text-sm md:text-base h-12 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-[#ADFA1D]" />
                                        <span>Menyiapkan QR Code...</span>
                                    </>
                                ) : (
                                    <>
                                        <QrCode className="w-4 h-4 text-[#ADFA1D]" />
                                        <span>Bayar via QRIS (QR Code Instant)</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </Button>

                            {/* Claim Order ID Section */}
                            <div className="pt-3 border-t border-slate-200/80 mt-3 space-y-2">
                                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                                    <span>Sudah Transfer / Punya Order ID?</span>
                                    <span className="text-blue-600 font-extrabold text-[10px]">VERIFIKASI ANGKAT</span>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Contoh: BP-1787994124678-5113"
                                        value={claimOrderId}
                                        onChange={(e) => setClaimOrderId(e.target.value)}
                                        className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-xl font-mono focus:outline-none focus:border-blue-600 bg-slate-50 text-slate-900"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={handleClaimOrder}
                                        disabled={claimLoading || !claimOrderId.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 rounded-xl shrink-0"
                                    >
                                        {claimLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Klaim'}
                                    </Button>
                                </div>
                                {claimStatus && (
                                    <div className={`text-[11px] font-bold p-2.5 rounded-xl border ${
                                        claimStatus.type === 'success'
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                            : 'bg-rose-50 text-rose-800 border-rose-300'
                                    }`}>
                                        {claimStatus.message}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-semibold text-center pt-1">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                <span>Akses Otomatis Aktif Setelah Pembayaran Scan QRIS</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Step 2: Display QR Code */}
                        <DialogHeader className="text-center space-y-1">
                            <div className="mx-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-[11px] font-bold uppercase tracking-wider">
                                ⏳ Selesaikan Pembayaran: {formatTimer(timeLeft)}
                            </div>
                            <DialogTitle className="text-xl font-outfit font-extrabold text-slate-900 tracking-tight">
                                SCAN QRIS DENGAN M-BANKING / E-WALLET
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 text-xs">
                                Paket: <span className="font-bold text-slate-800">{activePlan.title}</span> • Nominal: <span className="font-extrabold text-emerald-600">{activePlan.priceFormatted}</span>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col items-center justify-center my-4 space-y-3">
                            {/* QRIS Code Canvas Card */}
                            <div className="p-4 bg-white border-2 border-slate-200 rounded-3xl shadow-xl flex flex-col items-center relative group">
                                <div className="flex items-center justify-between w-full pb-2 mb-2 border-b border-slate-100">
                                    <span className="font-black text-xs text-red-600 tracking-widest uppercase">QRIS</span>
                                    <span className="text-[10px] text-slate-400 font-semibold">GPN Instant Payment</span>
                                </div>
                                <img
                                    src={qrImageUrl}
                                    alt="QRIS Payment QR Code"
                                    className="w-48 h-48 rounded-xl object-contain bg-white p-1"
                                />
                                <div className="mt-2 text-[10px] text-slate-500 font-medium text-center">
                                    Mendukung GoPay, OVO, Dana, ShopeePay, BCA, Mandiri, BRI, BNI, LinkAja
                                </div>
                            </div>

                            {/* Nominal Box */}
                            <div className="w-full bg-slate-50 rounded-2xl p-3 border border-slate-200 flex items-center justify-between text-xs">
                                <div>
                                    <div className="text-slate-400 font-medium text-[10px]">TOTAL NOMINAL TRANSFER</div>
                                    <div className="font-outfit font-extrabold text-slate-900 text-base">{activePlan.priceFormatted}</div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCopyAmount}
                                    className="h-8 text-[11px] font-bold border-slate-300 bg-white hover:bg-slate-100 text-slate-700"
                                >
                                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copied ? 'Tersalin' : 'Salin Nominal'}</span>
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Button
                                onClick={handleVerifyStatus}
                                disabled={loading}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-outfit font-extrabold text-xs md:text-sm h-11 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                ) : (
                                    <RefreshCw className="w-4 h-4 text-white" />
                                )}
                                <span>Menunggu Konfirmasi Webhook Pakasir...</span>
                            </Button>



                            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-semibold text-center pt-1">
                                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>Konfirmasi dilakukan otomatis via Webhook Pakasir setelah Anda scan QRIS</span>
                            </div>

                            <Button
                                onClick={() => setStep('select')}
                                variant="ghost"
                                className="w-full text-slate-400 hover:text-slate-600 text-[11px] h-8 font-medium mt-1"
                            >
                                ← Ubah Paket Akses
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
