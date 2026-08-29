import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TopUpPage from './pages/TopUpPage';
import KelolaPage from './pages/KelolaPage';
import AdminAEOPage from './pages/AdminAEOPage';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-mono font-bold text-lg">
                // Loading user session...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

const AdminRoute = ({ children }) => {
    const { user, loading, logout } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-mono font-bold text-lg">
                // Memeriksa autentikasi admin...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 text-white font-['Plus_Jakarta_Sans',sans-serif]">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-outfit font-extrabold text-white">Akses Dibatasi</h2>
                        <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                            Laman <code className="text-[#ADFA1D] bg-black/40 px-2 py-0.5 rounded">/kelola</code> wajib login menggunakan akun Administrator yang terdaftar di database.
                        </p>
                    </div>
                    <div className="bg-zinc-800/60 p-3.5 rounded-2xl text-left border border-zinc-700/50 text-xs space-y-1">
                        <div className="text-slate-400 font-bold">Akun Terhubung:</div>
                        <div className="text-white font-mono text-xs truncate">{user.email}</div>
                        <div className="text-amber-400 font-medium">Role: {user.role || 'user'} (Bukan Admin)</div>
                    </div>
                    <div className="flex flex-col gap-3 pt-2">
                        <button 
                            onClick={() => {
                                logout();
                                window.location.href = '/login';
                            }} 
                            className="bg-[#ADFA1D] hover:bg-[#9fe318] text-black font-bold text-sm px-6 py-3 rounded-full transition-all shadow-md"
                        >
                            Masuk Akun Admin Database
                        </button>
                        <a 
                            href="/dashboard" 
                            className="text-slate-400 hover:text-white font-semibold text-xs py-2 transition-colors"
                        >
                            ← Kembali ke GIS Dashboard
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return children;
};

export default function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        
                        {/* Public GIS Workspace Route */}
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route 
                            path="/topup" 
                            element={
                                <ProtectedRoute>
                                    <TopUpPage />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/kelola" 
                            element={
                                <AdminRoute>
                                    <KelolaPage />
                                </AdminRoute>
                            } 
                        />
                        <Route 
                            path="/admin-aeo" 
                            element={
                                <AdminRoute>
                                    <AdminAEOPage />
                                </AdminRoute>
                            } 
                        />

                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ErrorBoundary>
    );
}
