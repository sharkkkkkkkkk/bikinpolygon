import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import BlogPostPage from './pages/BlogPostPage';

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/harga" element={<PricingPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          {/* Catch-all: redirect to homepage to avoid soft 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}
