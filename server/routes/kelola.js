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

// Generate AEO (AI integration)
router.post('/generate-aeo', async (req, res) => {
    logAdminActivity(req, 'GENERATE_AEO', { keyword: req.body.keyword, provider: req.body.provider });
    try {
        const { keyword, provider = 'gemini' } = req.body;
        if (!keyword) {
            return res.status(400).json({ error: 'Keyword is required' });
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCDVf2Lj5EcQYM87_QblrEgSls37QQ5Ycw';
        const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || 'ZhHtuoMi8spJDZqK065lNXMIg85niCHZ';
        
        const systemPrompt = `Anda adalah mesin penghasil data AEO spesialis. Tugas Anda adalah membuat data SEO dan skema FAQ JSON-LD untuk platform pembuat peta (polygon shapefile) OSS RBA otomatis.

Input pengguna adalah target pasar atau industri: ${keyword}

Hasilkan output HANYA dalam format JSON valid tanpa markdown code block (tanpa \`\`\`json ... \`\`\`), dengan struktur berikut:
{
  "metaTitle": "Judul SEO maksimal 60 karakter memuat input",
  "metaDescription": "Deskripsi SEO maksimal 155 karakter memuat solusi instan",
  "faqSchema": [
    { "question": "Pertanyaan teknis spesifik untuk industri tersebut", "answer": "Jawaban yang memposisikan sistem kami sebagai solusi tercepat (2 menit)" },
    { "question": "Pertanyaan masalah umum", "answer": "Jawaban relevan" }
  ]
}`;

        let aiTextResponse = '';

        if (provider === 'mistral') {
            const mistralRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${MISTRAL_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'mistral-small-latest',
                    response_format: { type: 'json_object' },
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: 'Tolong buatkan JSON sesuai format untuk industri: ' + keyword }
                    ]
                })
            });

            if (!mistralRes.ok) {
                const errText = await mistralRes.text();
                console.error('Mistral API Error:', errText);
                return res.status(mistralRes.status).json({ error: 'Failed to generate AEO from Mistral API.' });
            }

            const mistralData = await mistralRes.json();
            aiTextResponse = mistralData.choices?.[0]?.message?.content;
        } else {
            // Default to Gemini
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            if (!geminiRes.ok) {
                const errText = await geminiRes.text();
                console.error('Gemini API Error:', errText);
                return res.status(geminiRes.status).json({ error: 'Failed to generate AEO from Gemini API.' });
            }

            const geminiData = await geminiRes.json();
            aiTextResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        }

        if (!aiTextResponse) {
            return res.status(500).json({ error: 'Invalid response from AI provider' });
        }
        
        // Bersihkan markdown json jika AI masih membandel
        const cleanJsonStr = aiTextResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        const parsedJson = JSON.parse(cleanJsonStr);
        return res.json(parsedJson);

    } catch (error) {
        logAdminActivity(req, 'GENERATE_AEO_ERROR', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Internal server error while generating AEO: ' + error.message });
    }
});

// Generate Blog (AI integration)
router.post('/generate-blog', async (req, res) => {
    logAdminActivity(req, 'GENERATE_BLOG', { keyword: req.body.keyword, provider: req.body.provider });
    try {
        const { keyword, provider = 'gemini' } = req.body;
        if (!keyword) {
            return res.status(400).json({ error: 'Keyword is required' });
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCDVf2Lj5EcQYM87_QblrEgSls37QQ5Ycw';
        const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || 'ZhHtuoMi8spJDZqK065lNXMIg85niCHZ';
        
        const systemPrompt = `Anda adalah Senior SEO Specialist & Geospatial Engineer yang ahli dalam sistem OSS RBA Indonesia. Tugas Anda adalah menulis artikel teknis berkualitas tinggi untuk blog 'LineSima'.
Target Keyword Topik: ${keyword}

Hasilkan output HANYA dalam format JSON valid tanpa markdown code block (tanpa \`\`\`json ... \`\`\`), dengan struktur berikut:
{
  "title": "Judul Artikel (Clickbait edukatif, memuat keyword)",
  "slug": "url-slug-kebab-case",
  "excerpt": "Ringkasan artikel 1-2 kalimat (max 155 karakter) untuk meta description",
  "author": "LineSima Expert",
  "keywords": "keyword1, keyword2, keyword3",
  "content": "Isi artikel lengkap berformat Markdown. Gunakan heading H2/H3, list, dan bold untuk penekanan. Pastikan artikel menjawab masalah target secara detail namun tetap mempromosikan LineSima sebagai solusi mudah untuk membuat polygon shapefile."
}`;

        let aiTextResponse = '';

        if (provider === 'mistral') {
            const mistralRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${MISTRAL_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'mistral-small-latest',
                    response_format: { type: 'json_object' },
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: 'Tolong buatkan artikel blog dalam format JSON untuk keyword: ' + keyword }
                    ]
                })
            });

            if (!mistralRes.ok) {
                const errText = await mistralRes.text();
                return res.status(mistralRes.status).json({ error: 'Failed to generate Blog from Mistral API.' });
            }

            const mistralData = await mistralRes.json();
            aiTextResponse = mistralData.choices?.[0]?.message?.content;
        } else {
            // Default to Gemini
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            if (!geminiRes.ok) {
                const errText = await geminiRes.text();
                return res.status(geminiRes.status).json({ error: 'Failed to generate Blog from Gemini API.' });
            }

            const geminiData = await geminiRes.json();
            aiTextResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        }

        if (!aiTextResponse) {
            return res.status(500).json({ error: 'Invalid response from AI provider' });
        }
        
        // Bersihkan markdown json jika AI masih membandel
        const cleanJsonStr = aiTextResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsedJson = JSON.parse(cleanJsonStr);
        return res.json(parsedJson);

    } catch (error) {
        logAdminActivity(req, 'GENERATE_BLOG_ERROR', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Internal server error while generating Blog: ' + error.message });
    }
});

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

// Update user details (Name, WhatsApp, Role, Password)
router.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, whatsapp, role, email, password } = req.body;

    // Validasi ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: 'Format ID pengguna tidak valid' });
    }

    logAdminActivity(req, 'UPDATE_USER_DETAILS', { userId: id, name, whatsapp, role, hasPassword: !!password });

    try {
        const updateData = {};
        if (name !== undefined) updateData.name = sanitizeInput(name);
        if (whatsapp !== undefined) updateData.whatsapp = sanitizeInput(whatsapp);
        if (email !== undefined) updateData.email = sanitizeInput(email)?.toLowerCase();
        
        // Handle password update
        if (password && password.length > 0) {
            if (password.length < 8) {
                return res.status(400).json({ error: 'Password baru harus minimal 8 karakter' });
            }
            const hashedPassword = await bcrypt.hash(password, 12);
            updateData.password_hash = hashedPassword;
        }

        const { data, error } = await req.supabase
            .from('users')
            .update(updateData)
            .eq('id', id)
            .select('id, email, name, whatsapp, role, token_balance, created_at');

        if (error) throw error;
        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        }

        logAdminActivity(req, 'UPDATE_USER_SUCCESS', { userId: id, updatedFields: Object.keys(updateData) });
        res.json(data[0]);
    } catch (err) {
        logAdminActivity(req, 'UPDATE_USER_ERROR', { error: err.message });
        res.status(500).json({ error: 'Gagal memperbarui data pengguna' });
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
