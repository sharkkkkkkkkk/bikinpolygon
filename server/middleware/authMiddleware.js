const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            console.error('CRITICAL SECURITY ALERT: JWT_SECRET environment variable is not defined!');
        }
        return 'bikinpolygon_dev_secret_key_2026_change_in_prod';
    }
    return secret;
};

const verifyUser = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token tidak ditemukan' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, getJwtSecret(), (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Token tidak valid atau sudah kadaluarsa' });
        req.user = decoded;
        next();
    });
};

const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token tidak ditemukan' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, getJwtSecret(), async (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Token tidak valid atau sudah kadaluarsa' });

        // Cek role terbaru langsung dari database Supabase
        try {
            if (req.supabase && decoded.id) {
                const { data: dbUser } = await req.supabase
                    .from('users')
                    .select('id, email, role, name')
                    .eq('id', decoded.id)
                    .single();

                if (dbUser) {
                    if (dbUser.role === 'admin') {
                        req.user = dbUser;
                        return next();
                    } else {
                        return res.status(403).json({ error: 'Akses ditolak. Akun ini tidak memiliki peran administrator di database.' });
                    }
                }
            }
        } catch (dbErr) {
            console.error('[AUTH CHECK ERROR]', dbErr.message);
        }

        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Akses ditolak. Anda bukan administrator.' });
        }
        req.user = decoded;
        next();
    });
};

module.exports = {
    getJwtSecret,
    verifyUser,
    verifyAdmin
};
