import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import Kelola from '@/pages/Kelola';
import PaymentInfo from '@/pages/PaymentInfo';
import BlogPost from '@/pages/BlogPost';
import AdminAEO from '@/pages/AdminAEO';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  console.log("PrivateRoute check:", { user, loading });
  if (loading) return <div className="p-20 text-center font-bold">Loading Auth...</div>;
  if (!user) {
    console.log("No user found, redirecting to /");
    return <Navigate to="/" />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-20 text-center font-bold">Loading Auth...</div>;
  return user && user.role === 'admin' ? children : <Navigate to="/" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/payment" element={<PaymentInfo />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/kelola" element={<AdminRoute><Kelola /></AdminRoute>} />
      <Route path="/admin/aeo" element={<AdminRoute><AdminAEO /></AdminRoute>} />
      <Route path="/blog/:slug" element={<BlogPost />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-white">
      <BrowserRouter>
        <HelmetProvider>
          <AuthProvider>
             <AppRoutes />
             <Toaster />
          </AuthProvider>
        </HelmetProvider>
      </BrowserRouter>
    </div>
  )
}

export default App
