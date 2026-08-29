import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AuthModal({ open, onOpenChange, onSuccess }) {
    const { login, register, loginWithGoogle } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleFallbackMode, setGoogleFallbackMode] = useState(false);
    const [googleEmail, setGoogleEmail] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (isRegister) {
            const ok = await register(email, password);
            setLoading(false);
            if (ok) setIsRegister(false);
        } else {
            const user = await login(email, password);
            setLoading(false);
            if (user) {
                onOpenChange(false);
                if (onSuccess) onSuccess(user);
            }
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const res = await loginWithGoogle();
            if (res?.providerNotEnabled) {
                setGoogleFallbackMode(true);
            } else if (res?.success) {
                onOpenChange(false);
                if (res.user && onSuccess) onSuccess(res.user);
            }
        } catch (e) {
            console.error("Google auth error", e);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleFallbackSubmit = async (e) => {
        e.preventDefault();
        if (!googleEmail) return;
        setLoading(true);
        try {
            const res = await loginWithGoogle(googleEmail);
            if (res?.success) {
                onOpenChange(false);
                setGoogleFallbackMode(false);
                if (res.user && onSuccess) onSuccess(res.user);
            }
        } catch (e) {
            console.error("Google fallback error", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) setGoogleFallbackMode(false); }}>
            <DialogContent className="sm:max-w-md bg-[#0F172A] border border-zinc-800 rounded-3xl p-8 shadow-2xl text-white">
                <DialogHeader className="text-center pb-4 border-b border-zinc-800">
                    <div className="mx-auto bg-[#ADFA1D] text-black font-outfit font-black text-lg p-2.5 rounded-2xl mb-2 w-fit shadow-[0_0_15px_rgba(173,250,29,0.3)]">
                        GIS
                    </div>
                    <DialogTitle className="text-xl font-outfit font-extrabold text-white tracking-tight">
                        {googleFallbackMode ? 'Masuk dengan Akun Google' : (isRegister ? 'Buat Akun BikinPolygon' : 'Masuk untuk Download')}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-400">
                        Area ≤ 50 m² Gratis (Free Tier) • 5 Token Bonus
                    </DialogDescription>
                </DialogHeader>

                {/* Google Sign In Direct View */}
                {googleFallbackMode ? (
                    <form onSubmit={handleGoogleFallbackSubmit} className="space-y-4 pt-2 animate-in fade-in duration-200">
                        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-slate-300 font-medium leading-relaxed flex items-center gap-2">
                            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                            </svg>
                            <span>Masukkan email Google (Gmail) Anda untuk autentikasi langsung:</span>
                        </div>
                        <div>
                            <Label className="font-bold text-slate-300 uppercase text-[11px]">Email Google (Gmail)</Label>
                            <Input 
                                type="email" 
                                required 
                                placeholder="nama.anda@gmail.com"
                                value={googleEmail} 
                                onChange={(e) => setGoogleEmail(e.target.value)}
                                className="mt-1 font-medium bg-zinc-900 border border-zinc-800 text-white rounded-xl h-11 focus:border-[#ADFA1D]"
                            />
                        </div>
                        <div className="flex gap-2 pt-1">
                            <Button 
                                type="button"
                                variant="outline"
                                onClick={() => setGoogleFallbackMode(false)}
                                className="w-1/3 bg-zinc-900 text-slate-300 border border-zinc-800 rounded-xl h-11 text-xs font-bold"
                            >
                                Kembali
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="w-2/3 bg-[#ADFA1D] hover:bg-[#9fe318] text-black font-extrabold rounded-xl h-11 text-xs uppercase shadow-[0_0_15px_rgba(173,250,29,0.3)]"
                            >
                                {loading ? 'Proses...' : 'Masuk via Google →'}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <>
                        {/* Google Sign In Button */}
                        <div className="pt-2">
                            <Button 
                                type="button" 
                                variant="outline"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-zinc-800 rounded-2xl h-12 flex items-center justify-center gap-3 transition-all text-sm"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                </svg>
                                {loading ? 'Menghubungkan...' : 'Masuk dengan Google'}
                            </Button>
                        </div>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800" /></div>
                            <div className="relative flex justify-center text-[10px] font-bold uppercase"><span className="bg-[#0F172A] px-2 text-slate-500">Atau Email</span></div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label className="font-bold text-slate-300 uppercase text-[11px]">Email</Label>
                                <Input 
                                    type="email" 
                                    required 
                                    placeholder="nama@email.com"
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1 font-medium bg-zinc-900 border border-zinc-800 text-white rounded-xl h-11 focus:border-[#ADFA1D]"
                                />
                            </div>
                            <div>
                                <Label className="font-bold text-slate-300 uppercase text-[11px]">Password</Label>
                                <Input 
                                    type="password" 
                                    required 
                                    placeholder="••••••••"
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1 font-medium bg-zinc-900 border border-zinc-800 text-white rounded-xl h-11 focus:border-[#ADFA1D]"
                                />
                            </div>

                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-[#ADFA1D] hover:bg-[#9fe318] text-black font-outfit font-extrabold rounded-2xl h-12 text-sm uppercase shadow-[0_0_20px_rgba(173,250,29,0.35)]"
                            >
                                {loading ? 'Proses...' : (isRegister ? 'Daftar Akun' : 'Masuk Sekarang →')}
                            </Button>
                        </form>

                        <div className="text-center pt-2">
                            <button 
                                type="button" 
                                onClick={() => setIsRegister(!isRegister)}
                                className="text-xs font-bold text-[#ADFA1D] hover:underline"
                            >
                                {isRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar Gratis'}
                            </button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
