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

const { verifyAdmin, getJwtSecret } = require('../middleware/authMiddleware');

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

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

        if (provider === 'mistral' && !MISTRAL_API_KEY) {
            return res.status(500).json({ error: 'MISTRAL_API_KEY environment variable is not configured.' });
        }
        if (provider === 'gemini' && !GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not configured.' });
        }
        
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

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

        if (provider === 'mistral' && !MISTRAL_API_KEY) {
            return res.status(500).json({ error: 'MISTRAL_API_KEY environment variable is not configured.' });
        }
        if (provider === 'gemini' && !GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not configured.' });
        }
        
        const systemPrompt = `Anda adalah Senior SEO Specialist & Geospatial Engineer yang ahli dalam sistem OSS RBA Indonesia. Tugas Anda adalah menulis artikel teknis berkualitas tinggi untuk blog 'BikinPolygon'.
Target Keyword Topik: ${keyword}

Hasilkan output HANYA dalam format JSON valid tanpa markdown code block (tanpa \`\`\`json ... \`\`\`), dengan struktur berikut:
{
  "title": "Judul Artikel (Clickbait edukatif, memuat keyword)",
  "slug": "url-slug-kebab-case",
  "excerpt": "Ringkasan artikel 1-2 kalimat (max 155 karakter) untuk meta description",
  "author": "BikinPolygon Expert",
  "keywords": "keyword1, keyword2, keyword3",
  "content": "Isi artikel lengkap berformat Markdown. Gunakan heading H2/H3, list, dan bold untuk penekanan. Pastikan artikel menjawab masalah target secara detail namun tetap mempromosikan BikinPolygon sebagai solusi mudah untuk membuat polygon shapefile."
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

// Get users with optional pagination
router.get('/users', async (req, res) => {
    logAdminActivity(req, 'VIEW_USERS', { action: 'List users' });

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const { data: users, count, error } = await req.supabase
            .from('users')
            .select('id, email, name, whatsapp, role, token_balance, access_until, created_at', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            logAdminActivity(req, 'VIEW_USERS_ERROR', { error: error.message });
            return res.status(500).json({ error: error.message });
        }

        logAdminActivity(req, 'VIEW_USERS_SUCCESS', { userCount: users ? users.length : 0 });
        
        if (req.query.page || req.query.limit) {
            return res.json({
                users: users || [],
                pagination: {
                    total: count || 0,
                    page,
                    limit,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            });
        }

        res.json(users || []);
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
    const { email, password, name, whatsapp, initialTokens, role } = req.body;
    const supabase = req.supabase;

    // Sanitasi input
    const sanitizedEmail = sanitizeInput(email)?.toLowerCase();
    const sanitizedName = sanitizeInput(name);
    const sanitizedWhatsapp = sanitizeInput(whatsapp);
    const validRole = (role === 'admin' || role === 'user') ? role : 'user';

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
        name: sanitizedName,
        role: validRole
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
            role: validRole
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

// Update user details (Name, WhatsApp, Role, Password, Token Balance, Access Until)
router.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, whatsapp, role, email, password, token_balance, access_until } = req.body;

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
        if (role !== undefined && (role === 'admin' || role === 'user')) updateData.role = role;
        if (token_balance !== undefined) updateData.token_balance = Math.max(0, parseInt(token_balance) || 0);
        if (access_until !== undefined) updateData.access_until = access_until;
        
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
            .select('id, email, name, whatsapp, role, token_balance, access_until, created_at');

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

// Manage User Duration Pass Access (Akses Harian 1 Hari/24 Jam, Mingguan 7 Hari, Bulanan 28 Hari)
router.put('/users/:id/duration-pass', async (req, res) => {
    const { id } = req.params;
    const { days } = req.body; // days can be 1 (24 Hours), 7 (7 Days), 28 (28 Days), or 0 (Expire Now)

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: 'Format ID pengguna tidak valid' });
    }

    try {
        const { data: user, error: fetchErr } = await req.supabase
            .from('users')
            .select('id, access_until')
            .eq('id', id)
            .single();

        if (fetchErr || !user) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        }

        let newAccessUntil;
        if (days === 0 || days === 'expire') {
            newAccessUntil = new Date().toISOString(); // Expires immediately
        } else {
            const currentExp = user.access_until && new Date(user.access_until) > new Date()
                ? new Date(user.access_until)
                : new Date();
            const daysToAdd = parseInt(days) || 1;
            currentExp.setTime(currentExp.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
            newAccessUntil = currentExp.toISOString();
        }

        const { data, error } = await req.supabase
            .from('users')
            .update({ access_until: newAccessUntil })
            .eq('id', id)
            .select('id, email, name, whatsapp, role, token_balance, access_until, created_at');

        if (error) throw error;

        logAdminActivity(req, 'GRANT_DURATION_PASS', { userId: id, days, newAccessUntil });
        res.json({ message: `Masa akses durasi berhasil diperbarui s.d ${newAccessUntil}`, user: data[0] });
    } catch (err) {
        logAdminActivity(req, 'GRANT_DURATION_PASS_ERROR', { userId: id, error: err.message });
        res.status(500).json({ error: err.message || 'Gagal memperbarui masa akses durasi' });
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
