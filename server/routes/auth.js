const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../middleware/authMiddleware');

router.post('/register', async (req, res) => {
    const { email, password, name, whatsapp } = req.body;
    const supabase = req.supabase;

    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    try {
        // Optimize: select only 'id' to check if user exists
        const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data, error } = await supabase
            .from('users')
            .insert([{
                email,
                password_hash: hashedPassword,
                role: 'user',
                name: name || '',
                whatsapp: whatsapp || ''
            }])
            .select('id, email, name, role, created_at');

        if (error) throw error;
        res.json({ message: 'User registered', user: data[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const supabase = req.supabase;
    const cleanEmail = email?.trim()?.toLowerCase();

    if (!cleanEmail || !password) return res.status(400).json({ error: 'Email dan password harus diisi' });

    try {
        const { data: user, error } = await supabase.from('users').select('*').eq('email', cleanEmail).maybeSingle();
        if (!user || error) return res.status(400).json({ error: 'Email atau password salah' });

        const validPass = await bcrypt.compare(password, user.password_hash);
        if (!validPass) return res.status(400).json({ error: 'Email atau password salah' });

        const token = jwt.sign({ id: user.id, role: user.role }, getJwtSecret(), { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name, token_balance: user.token_balance, access_until: user.access_until } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Profile / Session Refresh Endpoint
router.get('/me', async (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token tidak ditemukan' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, getJwtSecret(), async (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Token kadaluarsa' });
        try {
            const { data: user } = await req.supabase.from('users').select('id, email, name, role, token_balance, access_until').eq('id', decoded.id).single();
            if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
            res.json({ user });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
});

// Google Sync Endpoint for Google OAuth
router.post('/google-sync', async (req, res) => {
    const { email, name } = req.body;
    const supabase = req.supabase;

    if (!email) return res.status(400).json({ error: 'Email required' });

    try {
        // Check if user exists using maybeSingle() so it doesn't error when 0 rows found
        let { data: user, error: userFetchError } = await supabase.from('users').select('*').eq('email', email).maybeSingle();

        if (userFetchError) {
            console.error("Error searching user in DB:", userFetchError);
        }

        if (!user) {
            // Create user for Google login
            const dummyPassword = await bcrypt.hash(`google_${Date.now()}_${Math.random()}`, 10);
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert([{
                    email,
                    password_hash: dummyPassword,
                    role: 'user',
                    name: name || email.split('@')[0]
                }])
                .select();

            if (createError) {
                console.error("Error creating user in DB:", createError);
                throw createError;
            }
            user = newUser[0];
        }

        const token = jwt.sign({ id: user.id, role: user.role }, getJwtSecret(), { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
    } catch (err) {
        console.error("Google Sync Error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
