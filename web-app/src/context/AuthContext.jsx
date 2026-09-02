import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const syncInProgress = useRef(false);

    const syncGoogleUser = async (email, name) => {
        if (!email) return;
        if (syncInProgress.current) return;
        syncInProgress.current = true;

        try {
            console.log('[AUTH] Syncing Google user:', email);
            const res = await api.post('/auth/google-sync', { email, name: name || email.split('@')[0] });

            if (res.data && res.data.token) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                setUser(res.data.user);
                toast({ title: 'Sukses Login Google', description: `Selamat datang, ${res.data.user.email}` });
                console.log('[AUTH] Sync success, user set:', res.data.user.email);
            }
        } catch (err) {
            console.error('[AUTH] Google Sync Failed:', err.response?.data || err.message);
            toast({
                title: 'Gagal Sinkronisasi',
                description: err.response?.data?.error || 'Gagal menghubungkan akun Google',
                variant: 'destructive'
            });
        } finally {
            syncInProgress.current = false;
        }
    };

    useEffect(() => {
        // 1. Restore existing session from localStorage
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);
                // Fetch fresh profile & role directly from DB
                api.get('/auth/me').then(res => {
                    if (res.data && res.data.user) {
                        setUser(res.data.user);
                        localStorage.setItem('user', JSON.stringify(res.data.user));
                    }
                }).catch(() => {});
            } catch (e) {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
        setLoading(false);

        // 2. Handle Google OAuth redirect — manually parse hash tokens
        const hash = window.location.hash;
        if (hash && hash.includes('access_token=')) {
            console.log('[AUTH] Detected OAuth hash tokens in URL');

            // Parse the JWT access_token to extract user email
            const hashParams = new URLSearchParams(hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');

            if (accessToken) {
                try {
                    const base64Url = accessToken.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const pad = base64.length % 4;
                    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
                    const payload = JSON.parse(atob(padded));
                    const email = payload.email;
                    const name = payload.user_metadata?.full_name || payload.user_metadata?.name || '';

                    console.log('[AUTH] Extracted email from token:', email);

                    if (email) {
                        // Clean URL immediately
                        window.history.replaceState(null, '', window.location.pathname);

                        // Set session in Supabase client if available
                        if (supabase && supabase.auth && refreshToken) {
                            supabase.auth.setSession({
                                access_token: accessToken,
                                refresh_token: refreshToken
                            }).catch(() => {});
                        }

                        // Sync with our backend
                        syncGoogleUser(email, name);
                    }
                } catch (decodeErr) {
                    console.error('[AUTH] Failed to decode access_token:', decodeErr);
                    window.history.replaceState(null, '', window.location.pathname);
                }
            }
        }

        // 3. Listen for future Supabase auth state changes (token refresh, etc.)
        if (supabase && supabase.auth) {
            const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
                console.log('[AUTH] Supabase event:', event);
                if (session?.user?.email && event === 'SIGNED_IN') {
                    const name = session.user.user_metadata?.full_name || '';
                    syncGoogleUser(session.user.email, name);
                }
            });

            return () => {
                authListener?.subscription?.unsubscribe();
            };
        }
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            toast({ title: 'Berhasil Masuk', description: `Selamat datang kembali, ${data.user.email}` });
            return data.user;
        } catch (error) {
            toast({
                title: 'Gagal Masuk',
                description: error.response?.data?.error || 'Email atau password salah',
                variant: 'destructive',
            });
            return null;
        }
    };

    const register = async (email, password) => {
        try {
            await api.post('/auth/register', { email, password });
            toast({ title: 'Akun Berhasil Dibuat', description: 'Silakan masuk dengan email dan password Anda.' });
            return true;
        } catch (error) {
            toast({
                title: 'Gagal Pendaftaran',
                description: error.response?.data?.error || 'Gagal membuat akun baru',
                variant: 'destructive',
            });
            return false;
        }
    };

    const loginWithGoogle = async (directGoogleEmail = null) => {
        // Fallback: direct email sync
        if (directGoogleEmail) {
            try {
                const res = await api.post('/auth/google-sync', {
                    email: directGoogleEmail,
                    name: directGoogleEmail.split('@')[0]
                });
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                setUser(res.data.user);
                toast({ title: 'Sukses Login Google', description: `Selamat datang, ${res.data.user.email}` });
                return { success: true, user: res.data.user };
            } catch (error) {
                toast({
                    title: 'Gagal Login Google',
                    description: error.response?.data?.error || error.message || 'Gagal menghubungkan ke Google',
                    variant: 'destructive'
                });
                return null;
            }
        }

        // Official Supabase Google OAuth Redirect
        if (supabase && supabase.auth) {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/dashboard'
                }
            });
            if (error) {
                console.error('[AUTH] OAuth error:', error);
                if (error.message?.includes('provider is not enabled') || error.status === 400) {
                    return { providerNotEnabled: true };
                }
                toast({
                    title: 'Gagal Google OAuth',
                    description: error.message || 'Gagal menghubungkan ke Google',
                    variant: 'destructive'
                });
                return null;
            }
            return { isRedirecting: true };
        } else {
            return { providerNotEnabled: true };
        }
    };

    const logout = () => {
        if (supabase && supabase.auth) {
            supabase.auth.signOut().catch(() => {});
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        toast({ title: 'Sudah Keluar', description: 'Anda telah berhasil logout.' });
    };

    return (
        <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
