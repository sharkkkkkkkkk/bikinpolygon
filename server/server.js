const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

// Sembunyikan header X-Powered-By demi keamanan
app.disable('x-powered-by');

// =====================================
// SECURITY CONFIGURATIONS & ANTI-DDOS
// =====================================

// Helmet untuk security headers ketat
app.use(helmet({
    contentSecurityPolicy: false, // Biarkan fleksibel untuk map tile & assets
    crossOriginEmbedderPolicy: false,
    hidePoweredBy: true,
    noSniff: true,
    xssFilter: true,
}));

// CORS dengan konfigurasi fleksibel untuk production
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const allowedOrigins = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',')
            : ['https://bikinpolygon.xyz', 'https://www.bikinpolygon.xyz', 'https://app.bikinpolygon.xyz', 'https://api.bikinpolygon.xyz', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

        if (allowedOrigins.includes(origin) ||
            origin.endsWith('.vercel.app') ||
            process.env.NODE_ENV === 'production') {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '2mb' })); // Batasi body payload max 2MB anti payload flood

// Anti-DDoS Global Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    limit: 100, // max 100 req per 15 menit
    message: { error: 'Terlalu banyak permintaan. Coba lagi nanti.' },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req, res) => req.path.includes('/proxy-tile') || req.path.includes('/payment'),
});
app.use(globalLimiter);

// Rate limiting ketat untuk submission & webhook
const submissionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    limit: 15, // max 15 submissions per 15 menit per IP
    message: { error: 'Terlalu banyak pengiriman data. Coba lagi dalam 15 menit.' },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});

// Rate limiting ketat untuk endpoint admin/kelola
const kelolaLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 menit
    limit: 30, // max 30 request per 5 menit
    message: { error: 'Akses dibatasi. Terlalu banyak permintaan ke panel kelola.' },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});

// Rate limiting ketat untuk login/auth (Anti Brute-Force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    limit: 5, // max 5 percobaan login per 15 menit
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

    if (req.path.includes('/kelola')) {
        console.log('[SECURITY LOG - KELOLA ACCESS]', JSON.stringify(logData));
    }

    next();
});

// Block suspicious patterns (Anti-Scraping & Anti-Exploit)
app.use((req, res, next) => {
    const suspiciousPatterns = [
        /admin/i,
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

app.use((req, res, next) => {
    req.supabase = supabase;
    next();
});

// =====================================
// ROUTES
// =====================================
const authRoutes = require('./routes/auth');
const kelolaRoutes = require('./routes/kelola');
const generatorRoutes = require('./routes/generator');
const aeoRoutes = require('./routes/aeo');
const paymentRoutes = require('./routes/payment');

// Apply rate limiters to specific routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/generator/save-submission', submissionLimiter);
app.use('/api/kelola', kelolaLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/kelola', kelolaRoutes);
app.use('/api/generator', generatorRoutes);
app.use('/api/aeo', aeoRoutes);
app.use('/api/payment', paymentRoutes);

// Health check endpoint
app.get('/', (req, res) => {
    res.send('BikinPolygon API is running');
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
    });
    res.status(500).json({ error: 'Terjadi kesalahan server' });
});

// Conditional listen for local development
if (process.env.NODE_ENV !== 'production' && require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export app for Vercel
module.exports = app;
