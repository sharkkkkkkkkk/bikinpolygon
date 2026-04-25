const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// =====================================
// SECURITY CONFIGURATIONS
// =====================================

// Helmet untuk security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// CORS dengan konfigurasi fleksibel untuk production
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // In production, allow the Vercel domain and configured origins
        const allowedOrigins = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',')
            : ['http://localhost:5173', 'http://localhost:3000'];

        // Check if origin is in allowed list or if it's a vercel.app domain
        if (allowedOrigins.includes(origin) ||
            origin.endsWith('.vercel.app') ||
            process.env.NODE_ENV === 'production') {
            callback(null, true);
        } else {
            callback(null, true); // Allow all in development for easier testing
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));

// Rate limiting global
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    limit: 100, // maksimal 100 request per 15 menit
    message: { error: 'Terlalu banyak permintaan, coba lagi nanti.' },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});
app.use(globalLimiter);

// Rate limiting ketat untuk endpoint admin/kelola
const kelolaLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 menit
    limit: 30, // maksimal 30 request per 5 menit untuk admin (v8 uses 'limit' instead of 'max')
    message: { error: 'Akses dibatasi. Terlalu banyak permintaan ke panel kelola.' },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});

// Rate limiting ketat untuk login/auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    limit: 5, // maksimal 5 percobaan login per 15 menit
    message: { error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});

// =====================================
// SECURITY MIDDLEWARE
// =====================================

// Generate Request ID untuk logging
app.use((req, res, next) => {
    req.requestId = crypto.randomUUID();
    res.setHeader('X-Request-ID', req.requestId);
    next();
});

// Security logging middleware
app.use((req, res, next) => {
    const logData = {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
    };

    // Log semua akses ke endpoint kelola
    if (req.path.includes('/kelola')) {
        console.log('[SECURITY LOG - KELOLA ACCESS]', JSON.stringify(logData));
    }

    next();
});

// Block suspicious patterns
app.use((req, res, next) => {
    const suspiciousPatterns = [
        /admin/i, // Block akses ke /admin (gunakan /kelola)
        /wp-admin/i,
        /phpmyadmin/i,
        /\.env/i,
        /\.git/i,
        /config\.php/i,
        /xmlrpc/i,
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(req.path));

    if (isSuspicious && !req.path.includes('/kelola')) {
        console.log('[SECURITY ALERT] Blocked suspicious request:', {
            requestId: req.requestId,
            path: req.path,
            ip: req.ip,
            timestamp: new Date().toISOString(),
        });
        return res.status(404).json({ error: 'Not found' });
    }

    next();
});

// =====================================
// SUPABASE INIT
// =====================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_KEY in .env");
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

// Middleware to attach supabase
app.use((req, res, next) => {
    req.supabase = supabase;
    next();
});

// =====================================
// ROUTES
// =====================================
const authRoutes = require('./routes/auth');
const kelolaRoutes = require('./routes/kelola'); // Renamed from admin
const generatorRoutes = require('./routes/generator');
const aeoRoutes = require('./routes/aeo');

// Apply rate limiters to specific routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/kelola', kelolaLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/kelola', kelolaRoutes); // Changed from /api/admin
app.use('/api/generator', generatorRoutes);
app.use('/api/aeo', aeoRoutes);

// Health check endpoint
app.get('/', (req, res) => {
    res.send('LineSima API is running');
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('[ERROR]', {
        requestId: req.requestId,
        error: err.message,
        stack: err.stack,
    });
    res.status(500).json({ error: 'Terjadi kesalahan server' });
});

// Conditional listen for local development
if (process.env.NODE_ENV !== 'production' && require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`[SECURITY] Admin panel tersedia di /api/kelola`);
    });
}

// Export app for Vercel
module.exports = app;
