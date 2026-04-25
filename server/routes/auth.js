const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
    const { email, password, name, whatsapp } = req.body;
    const supabase = req.supabase;

    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    try {
        // Check if user exists
        const { data: existingUser } = await supabase.from('users').select('*').eq('email', email).single();
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
            .select();

        if (error) throw error;
        res.json({ message: 'User registered', user: data[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const supabase = req.supabase;

    try {
        const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
        if (!user || error) return res.status(400).json({ error: 'Invalid credentials' });

        const validPass = await bcrypt.compare(password, user.password_hash);
        if (!validPass) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role, token_balance: user.token_balance } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
