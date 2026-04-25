const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// =====================================
// SECURITY MIDDLEWARE UNTUK PANEL KELOLA
// =====================================

// Token blacklist untuk session yang di-invalidate
const tokenBlacklist = new Set();

// Admin activity log (dalam production, simpan ke database)
const adminActivityLog = [];

// Fungsi untuk log aktivitas admin
const logAdminActivity = (req, action, details = {}) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent'),
        details,
    };
    adminActivityLog.push(logEntry);
    console.log('[ADMIN ACTIVITY]', JSON.stringify(logEntry));

    // Batasi log di memory (simpan 1000 entri terakhir)
    if (adminActivityLog.length > 1000) {
        adminActivityLog.shift();
    }
};

// Middleware verifikasi admin yang lebih ketat
const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logAdminActivity(req, 'UNAUTHORIZED_ACCESS', { reason: 'No token provided' });
        return res.status(401).json({ error: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];

    // Cek apakah token ada di blacklist
    if (tokenBlacklist.has(token)) {
        logAdminActivity(req, 'BLACKLISTED_TOKEN', { reason: 'Token has been invalidated' });
        return res.status(403).json({ error: 'Sesi telah berakhir, silakan login kembali' });
    }

    // Verifikasi token
    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
        if (err) {
            const errorType = err.name === 'TokenExpiredError' ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN';
            logAdminActivity(req, errorType, { error: err.message });
            return res.status(403).json({ error: 'Token tidak valid atau sudah kadaluarsa' });
        }

        // Verifikasi role admin
        if (decoded.role !== 'admin') {
            logAdminActivity(req, 'FORBIDDEN_ACCESS', {
                userId: decoded.id,
                role: decoded.role,
                reason: 'Non-admin trying to access kelola'
            });
            return res.status(403).json({ error: 'Akses ditolak. Anda bukan administrator.' });
        }

        // Cek apakah token terlalu tua (re-auth setelah 12 jam)
        const tokenAge = Date.now() / 1000 - decoded.iat;
        if (tokenAge > 12 * 60 * 60) { // 12 jam
            logAdminActivity(req, 'SESSION_TOO_OLD', { tokenAge: tokenAge / 3600 });
            return res.status(403).json({ error: 'Sesi terlalu lama, silakan login kembali' });
        }

        req.user = decoded;
        next();
    });
};

// Middleware validasi input
const validateInput = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field] && req.body[field] !== 0);
    if (missingFields.length > 0) {
        return res.status(400).json({
            error: `Field yang diperlukan tidak lengkap: ${missingFields.join(', ')}`
        });
    }
    next();
};

// Sanitasi input untuk mencegah injection
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return input.trim().replace(/[<>]/g, '');
    }
    return input;
};

router.use(verifyAdmin);

// =====================================
// ROUTES
// =====================================

// Get all users
router.get('/users', async (req, res) => {
    logAdminActivity(req, 'VIEW_USERS', { action: 'List all users' });

    try {
        const { data: users, error } = await req.supabase
            .from('users')
            .select('id, email, name, whatsapp, role, token_balance, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            logAdminActivity(req, 'VIEW_USERS_ERROR', { error: error.message });
            return res.status(500).json({ error: error.message });
        }

        logAdminActivity(req, 'VIEW_USERS_SUCCESS', { userCount: users.length });
        res.json(users);
    } catch (err) {
        logAdminActivity(req, 'VIEW_USERS_ERROR', { error: err.message });
        res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data pengguna' });
    }
});

// Get admin activity logs (hanya untuk super admin)
router.get('/logs', async (req, res) => {
    logAdminActivity(req, 'VIEW_LOGS', { action: 'View admin activity logs' });

    // Kembalikan 100 log terakhir
    const recentLogs = adminActivityLog.slice(-100).reverse();
    res.json(recentLogs);
});

// Create User manually
router.post('/users', validateInput(['email', 'password']), async (req, res) => {
    const { email, password, name, whatsapp, initialTokens } = req.body;
    const supabase = req.supabase;

    // Sanitasi input
    const sanitizedEmail = sanitizeInput(email)?.toLowerCase();
    const sanitizedName = sanitizeInput(name);
    const sanitizedWhatsapp = sanitizeInput(whatsapp);

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
        return res.status(400).json({ error: 'Format email tidak valid' });
    }

    // Validasi password strength
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password harus minimal 8 karakter' });
    }

    logAdminActivity(req, 'CREATE_USER', {
        email: sanitizedEmail,
        name: sanitizedName
    });

    try {
        // Cek apakah email sudah ada
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', sanitizedEmail)
            .single();

        if (existingUser) {
            logAdminActivity(req, 'CREATE_USER_FAILED', {
                reason: 'Email already exists',
                email: sanitizedEmail
            });
            return res.status(400).json({ error: 'Email sudah terdaftar' });
        }

        const hashedPassword = await bcrypt.hash(password, 12); // Tingkatkan rounds

        const { data, error } = await supabase.from('users').insert([{
            email: sanitizedEmail,
            password_hash: hashedPassword,
            name: sanitizedName || '',
            whatsapp: sanitizedWhatsapp || '',
            token_balance: parseInt(initialTokens) || 0,
            role: 'user'
        }]).select('id, email, name, whatsapp, role, token_balance, created_at');

        if (error) {
            logAdminActivity(req, 'CREATE_USER_ERROR', { error: error.message });
            throw error;
        }

        logAdminActivity(req, 'CREATE_USER_SUCCESS', {
            userId: data[0].id,
            email: sanitizedEmail
        });

        res.json(data[0]);
    } catch (err) {
        logAdminActivity(req, 'CREATE_USER_ERROR', { error: err.message });
        res.status(500).json({ error: 'Gagal membuat pengguna baru' });
    }
});

// Update user tokens
router.put('/users/:id/tokens', validateInput(['amount']), async (req, res) => {
    const { amount } = req.body;
    const { id } = req.params;

    // Validasi ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: 'Format ID pengguna tidak valid' });
    }

    // Validasi amount
    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount)) {
        return res.status(400).json({ error: 'Jumlah token harus berupa angka' });
    }

    logAdminActivity(req, 'UPDATE_TOKENS', { userId: id, amount: parsedAmount });

    try {
        const { data: user, error: fetchError } = await req.supabase
            .from('users')
            .select('id, email, token_balance')
            .eq('id', id)
            .single();

        if (fetchError || !user) {
            logAdminActivity(req, 'UPDATE_TOKENS_FAILED', {
                reason: 'User not found',
                userId: id
            });
            return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        }

        const oldBalance = user.token_balance || 0;
        const newBalance = oldBalance + parsedAmount;

        // Cegah saldo negatif
        if (newBalance < 0) {
            logAdminActivity(req, 'UPDATE_TOKENS_FAILED', {
                reason: 'Would result in negative balance',
                oldBalance,
                requestedChange: parsedAmount
            });
            return res.status(400).json({
                error: 'Saldo tidak boleh negatif',
                currentBalance: oldBalance
            });
        }

        const { error } = await req.supabase
            .from('users')
            .update({ token_balance: newBalance })
            .eq('id', id);

        if (error) throw error;

        logAdminActivity(req, 'UPDATE_TOKENS_SUCCESS', {
            userId: id,
            email: user.email,
            oldBalance,
            newBalance,
            change: parsedAmount
        });

        res.json({
            message: 'Saldo token berhasil diperbarui',
            oldBalance,
            newBalance,
            change: parsedAmount
        });
    } catch (err) {
        logAdminActivity(req, 'UPDATE_TOKENS_ERROR', { error: err.message });
        res.status(500).json({ error: 'Gagal memperbarui saldo token' });
    }
});

// Delete user (dengan soft delete atau hard delete)
router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { permanent } = req.query; // ?permanent=true untuk hard delete

    // Validasi ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: 'Format ID pengguna tidak valid' });
    }

    logAdminActivity(req, 'DELETE_USER_ATTEMPT', {
        userId: id,
        permanent: permanent === 'true'
    });

    try {
        // Cek apakah user ada
        const { data: user, error: fetchError } = await req.supabase
            .from('users')
            .select('id, email, role')
            .eq('id', id)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        }

        // Cegah hapus admin lain
        if (user.role === 'admin') {
            logAdminActivity(req, 'DELETE_USER_BLOCKED', {
                reason: 'Cannot delete admin user',
                targetEmail: user.email
            });
            return res.status(403).json({ error: 'Tidak dapat menghapus akun administrator' });
        }

        const { error } = await req.supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;

        logAdminActivity(req, 'DELETE_USER_SUCCESS', {
            userId: id,
            email: user.email
        });

        res.json({ message: 'Pengguna berhasil dihapus' });
    } catch (err) {
        logAdminActivity(req, 'DELETE_USER_ERROR', { error: err.message });
        res.status(500).json({ error: 'Gagal menghapus pengguna' });
    }
});

module.exports = router;
