import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, ArrowLeft } from 'lucide-react';

const MARKETING_URL = import.meta.env.VITE_MARKETING_URL || 'https://bikinpolygon.xyz';

export default function LoginPage() {
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleMode, setGoogleMode] = useState(false);
    const [googleEmailInput, setGoogleEmailInput] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const loggedInUser = await login(email, password);
        setLoading(false);
        if (loggedInUser) {
            if (loggedInUser.role === 'admin') {
                navigate('/kelola');
            } else {
                navigate('/dashboard');
            }
        }
    };

    const handleGoogleOAuth = async () => {
        setLoading(true);
        const res = await loginWithGoogle();
        setLoading(false);
        if (res?.providerNotEnabled) {
            setGoogleMode(true);
        } else if (res?.success || res?.user) {
            const userObj = res?.user;
            if (userObj?.role === 'admin') {
                navigate('/kelola');
            } else {
                navigate('/dashboard');
            }
        }
    };

    const handleGoogleLoginSubmit = async (e) => {
        e.preventDefault();
        if (!googleEmailInput) return;
        setLoading(true);
        const res = await loginWithGoogle(googleEmailInput);
        setLoading(false);
        if (res?.success || res?.user) {
            const userObj = res?.user;
            if (userObj?.role === 'admin') {
                navigate('/kelola');
            } else {
                navigate('/dashboard');
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-4 py-12 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#ADFA1D] selection:text-black">
            <div className="w-full max-w-md bg-[#0F172A] rounded-3xl p-8 md:p-10 shadow-2xl border border-zinc-800 text-white relative overflow-hidden">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
                    <a href={MARKETING_URL} className="text-xs font-bold text-slate-400 hover:text-[#ADFA1D] flex items-center gap-1.5 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Landing Page</span>
                    </a>
                    <div className="font-mono text-[11px] font-bold text-[#ADFA1D] bg-[#ADFA1D]/10 px-2.5 py-0.5 rounded-full border border-[#ADFA1D]/20">
                        BikinPolygon Auth
                    </div>
                </div>

                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-[#ADFA1D] text-black font-outfit font-black text-xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(173,250,29,0.4)]">
                        GIS
                    </div>
                    <h1 className="text-2xl md:text-3xl font-outfit font-extrabold text-white tracking-tight">
                        Masuk Web App
                    </h1>
                    <p className="text-slate-400 font-normal text-xs mt-1.5">
                        Akses GIS Workspace & Generator Shapefile NIB OSS
                    </p>
                </div>

                {/* Google Sign In Direct Card / OAuth Trigger */}
                {googleMode ? (
                    <form onSubmit={handleGoogleLoginSubmit} className="space-y-4 mb-6 animate-in fade-in duration-200">
                        <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-slate-300 font-medium leading-relaxed flex items-center gap-2.5">
                            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                            </svg>
                            <span>Masukkan email Google (Gmail) Anda untuk masuk instan:</span>
                        </div>
                        <div>
                            <Label className="font-bold text-slate-300 uppercase text-[11px] tracking-wider">Email Google (Gmail)</Label>
                            <Input 
                                type="email" 
                                required 
                                placeholder="nama.anda@gmail.com"
                                value={googleEmailInput} 
                                onChange={(e) => setGoogleEmailInput(e.target.value)}
                                className="mt-1 font-medium bg-zinc-900 border border-zinc-800 text-white placeholder-slate-500 rounded-xl h-11 focus:border-[#ADFA1D]"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                type="button"
                                variant="outline"
                                onClick={() => setGoogleMode(false)}
                                className="w-1/3 bg-zinc-900 hover:bg-zinc-800 text-slate-300 border border-zinc-800 rounded-xl h-11 text-xs font-bold"
                            >
                                Batal
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
                    <div className="mb-5">
                        <Button 
                            type="button" 
                            variant="outline"
                            onClick={handleGoogleOAuth}
                            disabled={loading}
                            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-zinc-800 rounded-2xl h-12 flex items-center justify-center gap-3 transition-all text-sm"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                            </svg>
                            {loading ? 'Menghubungkan...' : 'Masuk via Google'}
                        </Button>
                    </div>
                )}

                {!googleMode && (
                    <>
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800" /></div>
                            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider"><span className="bg-[#0F172A] px-3 text-slate-500">Atau Email</span></div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label className="font-bold text-slate-300 uppercase text-[11px] tracking-wider">Email Address</Label>
                                <Input 
                                    type="email" 
                                    required 
                                    placeholder="nama@email.com"
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1 font-medium bg-zinc-900 border border-zinc-800 text-white placeholder-slate-500 rounded-xl h-11 focus:border-[#ADFA1D]"
                                />
                            </div>
                            <div>
                                <Label className="font-bold text-slate-300 uppercase text-[11px] tracking-wider">Password</Label>
                                <Input 
                                    type="password" 
                                    required 
                                    placeholder="••••••••"
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1 font-medium bg-zinc-900 border border-zinc-800 text-white placeholder-slate-500 rounded-xl h-11 focus:border-[#ADFA1D]"
                                />
                            </div>

                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-[#ADFA1D] hover:bg-[#9fe318] text-black font-outfit font-extrabold rounded-2xl h-12 text-sm uppercase shadow-[0_0_20px_rgba(173,250,29,0.35)] mt-2 transition-all"
                            >
                                {loading ? 'Proses...' : 'Masuk Sekarang →'}
                            </Button>
                        </form>
                    </>
                )}

                <div className="mt-8 text-center border-t border-zinc-800 pt-6">
                    <p className="text-xs font-medium text-slate-400">
                        Belum punya akun?{' '}
                        <Link to="/register" className="text-[#ADFA1D] font-bold hover:underline">
                            Daftar Sekarang
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
