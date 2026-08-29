import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Zap } from 'lucide-react';

const MARKETING_URL = import.meta.env.VITE_MARKETING_URL || 'https://bikinpolygon.xyz';

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const success = await register(email, password);
        setLoading(false);
        if (success) {
            navigate('/login');
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
                    <div className="font-mono text-[11px] font-bold text-[#ADFA1D] bg-[#ADFA1D]/10 px-2.5 py-0.5 rounded-full border border-[#ADFA1D]/20 flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-[#ADFA1D]" /> 1x Trial Gratis
                    </div>
                </div>

                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-[#ADFA1D] text-black font-outfit font-black text-xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(173,250,29,0.4)]">
                        GIS
                    </div>
                    <h1 className="text-2xl md:text-3xl font-outfit font-extrabold text-white tracking-tight">
                        Buat Akun Gratis
                    </h1>
                    <p className="text-slate-400 font-normal text-xs mt-1.5">
                        Dapatkan Akses 1x Trial Gratis untuk Ekspor Polygon Lahan
                    </p>
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
                            placeholder="Minimal 6 Karakter"
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
                        {loading ? 'Membuat Akun...' : 'Daftar Sekarang →'}
                    </Button>
                </form>

                <div className="mt-8 text-center border-t border-zinc-800 pt-6">
                    <p className="text-xs font-medium text-slate-400">
                        Sudah punya akun?{' '}
                        <Link to="/login" className="text-[#ADFA1D] font-bold hover:underline">
                            Masuk Sekarang
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
