const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../middleware/authMiddleware');

const DATA_DIR = path.join(__dirname, '../data');
const ACCESS_FILE = path.join(DATA_DIR, 'deviceAccess.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

if (!fs.existsSync(DATA_DIR)) {
    try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}

function loadDeviceAccess() {
    try {
        if (fs.existsSync(ACCESS_FILE)) {
            const data = JSON.parse(fs.readFileSync(ACCESS_FILE, 'utf8'));
            return new Map(Object.entries(data));
        }
    } catch (e) {
        console.warn("Failed to load deviceAccess.json:", e);
    }
    return new Map();
}

function saveDeviceAccess(map) {
    try {
        const obj = {};
        for (const [k, v] of map.entries()) {
            obj[k] = v;
        }
        fs.writeFileSync(ACCESS_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (e) {
        console.warn("Failed to save deviceAccess.json:", e);
    }
}

function loadOrders() {
    try {
        if (fs.existsSync(ORDERS_FILE)) {
            const data = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
            return new Map(Object.entries(data));
        }
    } catch (e) {
        console.warn("Failed to load orders.json:", e);
    }
    return new Map();
}

function saveOrders(map) {
    try {
        const obj = {};
        for (const [k, v] of map.entries()) {
            obj[k] = v;
        }
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (e) {
        console.warn("Failed to save orders.json:", e);
    }
}

// In-memory store backed by JSON files
const orders = loadOrders();
const deviceAccess = loadDeviceAccess();

const PAKASIR_SLUG = process.env.PAKASIR_SLUG || 'bikinpolygon';
const PAKASIR_API_KEY = process.env.PAKASIR_API_KEY || 'bSrdqpCoBg6KeZZdCtTiDsQZM0vghZJn';

// Pricing duration mapping (in days)
const PRICING_PLANS = {
    '27000': { days: 1, name: 'Akses Harian (1 Hari)', ms: 1 * 24 * 60 * 60 * 1000 },
    '97000': { days: 7, name: 'Akses Mingguan (7 Hari)', ms: 7 * 24 * 60 * 60 * 1000 },
    '247000': { days: 28, name: 'Akses Bulanan (28 Hari)', ms: 28 * 24 * 60 * 60 * 1000 }
};

// Helper function to grant duration access pass to database user automatically
async function grantUserDurationAccessInDB(supabase, userId, userEmail, days) {
    if (!supabase || (!userId && !userEmail)) return false;
    try {
        let query = supabase.from('users').select('id, email, access_until');
        if (userId) {
            query = query.eq('id', userId);
        } else if (userEmail) {
            query = query.eq('email', userEmail.toLowerCase());
        }

        const { data: dbUser, error: fetchErr } = await query.maybeSingle();
        if (fetchErr || !dbUser) {
            console.warn(`[Payment DB Grant] User not found by id: ${userId} / email: ${userEmail}`);
            return false;
        }

        const now = new Date();
        const currentExp = dbUser.access_until ? new Date(dbUser.access_until) : now;
        const baseTime = currentExp > now ? currentExp : now;
        const newExpDate = new Date(baseTime.getTime() + (days * 24 * 60 * 60 * 1000));
        const newAccessUntilStr = newExpDate.toISOString();

        const { error: updateErr } = await supabase
            .from('users')
            .update({ access_until: newAccessUntilStr })
            .eq('id', dbUser.id);

        if (updateErr) {
            console.error('[Payment DB Grant Error]', updateErr);
            return false;
        }

        console.log(`[Pakasir DB Grant Success] User: ${dbUser.email} (ID: ${dbUser.id}) granted +${days} Days. Access Until: ${newAccessUntilStr}`);
        return true;
    } catch (err) {
        console.error('[Payment DB Grant Exception]', err);
        return false;
    }
}

// 1. Create Payment Order via Pakasir API (Custom QRIS)
router.post('/create-order', async (req, res) => {
    const { amount, deviceId, redirectUrl, userId, email } = req.body;
    
    if (!amount || !deviceId) {
        return res.status(400).json({ error: 'Amount and deviceId are required' });
    }

    const plan = PRICING_PLANS[String(amount)];
    if (!plan) {
        return res.status(400).json({ error: 'Invalid plan amount' });
    }

    // Extract user info from Authorization token if available
    let targetUserId = userId || null;
    let targetEmail = email || null;

    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, getJwtSecret());
            if (decoded) {
                targetUserId = decoded.id || targetUserId;
                targetEmail = decoded.email || targetEmail;
            }
        } catch (e) {}
    }

    const orderId = `BP-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const redirect = redirectUrl || `https://app.bikinpolygon.xyz/dashboard?order_id=${orderId}`;
    const payUrl = `https://app.pakasir.com/pay/${PAKASIR_SLUG}/${amount}?order_id=${orderId}&qris_only=1&redirect=${encodeURIComponent(redirect)}`;
    let paymentNumber = null;
    let totalPayment = Number(amount);
    let fee = 0;
    let expiredAt = null;
    let qrImageUrl = null;

    // Call Pakasir API Transaction Create (QRIS Method - Section C.2)
    try {
        const createRes = await fetch('https://app.pakasir.com/api/transactioncreate/qris', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                project: PAKASIR_SLUG,
                order_id: orderId,
                amount: Number(amount),
                api_key: PAKASIR_API_KEY
            })
        });

        const pakData = await createRes.json();
        console.log(`[Pakasir API transactioncreate Response]`, pakData);

        if (pakData?.payment?.payment_number) {
            paymentNumber = pakData.payment.payment_number;
            totalPayment = pakData.payment.total_payment || Number(amount);
            fee = pakData.payment.fee || 0;
            expiredAt = pakData.payment.expired_at || null;
            qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(paymentNumber)}`;
        }
    } catch (apiErr) {
        console.error('[Pakasir Transaction Create API Error]', apiErr);
    }

    if (!qrImageUrl) {
        qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(payUrl)}`;
    }

    const orderData = {
        orderId,
        amount: Number(amount),
        totalPayment,
        fee,
        paymentNumber,
        expiredAt,
        deviceId,
        userId: targetUserId,
        email: targetEmail,
        planName: plan.name,
        days: plan.days,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    orders.set(orderId, orderData);
    saveOrders(orders);

    res.json({
        success: true,
        orderId,
        payUrl,
        paymentNumber,
        totalPayment,
        fee,
        expiredAt,
        qrImageUrl: qrImageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(payUrl)}`,
        plan,
        userId: targetUserId,
        email: targetEmail
    });
});

// Helper: Query Pakasir API to check order status
async function verifyPakasirOrder(supabase, orderId, amount, deviceId, currentUserId = null, currentUserEmail = null) {
    if (!PAKASIR_API_KEY || !orderId) return false;

    const amountsToTry = amount ? [String(amount)] : ['27000', '97000', '247000'];
    
    for (const amt of amountsToTry) {
        try {
            const url = `https://app.pakasir.com/api/transactiondetail?project=${PAKASIR_SLUG}&amount=${amt}&order_id=${orderId}&api_key=${PAKASIR_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data?.transaction?.status === 'completed') {
                const planAmt = data.transaction.amount || amt;
                const plan = PRICING_PLANS[String(planAmt)] || { days: 1 };
                const days = plan.days;
                const targetDevice = deviceId || data.transaction.device_id || 'unknown';

                let order = orders.get(orderId) || { orderId, amount: Number(planAmt), status: 'completed' };
                order.status = 'completed';
                if (currentUserId) order.userId = currentUserId;
                if (currentUserEmail) order.email = currentUserEmail;
                orders.set(orderId, order);
                saveOrders(orders);

                // Update User Account in Supabase DB automatically
                const userIdToCredit = order.userId || currentUserId;
                const emailToCredit = order.email || currentUserEmail;
                if (supabase && (userIdToCredit || emailToCredit)) {
                    await grantUserDurationAccessInDB(supabase, userIdToCredit, emailToCredit, days);
                }

                if (targetDevice !== 'unknown') {
                    const currentExp = Number(deviceAccess.get(targetDevice) || Date.now());
                    const newExp = Math.max(currentExp, Date.now()) + (days * 24 * 60 * 60 * 1000);
                    deviceAccess.set(targetDevice, newExp);
                    saveDeviceAccess(deviceAccess);
                    console.log(`[Pakasir Verified] Device: ${targetDevice}, Order: ${orderId}, Expiry: ${new Date(newExp).toISOString()}`);
                }
                return true;
            }
        } catch (e) {
            console.error('[Pakasir Status Check Error]', e);
        }
    }
    return false;
}

// 2. Check Order / Device Access Status
router.get('/check-status', async (req, res) => {
    const { order_id, device_id, amount } = req.query;

    let targetUserId = null;
    let targetEmail = null;

    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, getJwtSecret());
            if (decoded) {
                targetUserId = decoded.id;
                targetEmail = decoded.email;
            }
        } catch (e) {}
    }

    let deviceExpiry = Number(deviceAccess.get(device_id) || 0);
    let isActive = deviceExpiry > Date.now();

    // Check specific order status
    let orderObj = order_id ? orders.get(order_id) : null;

    // Only attempt Pakasir verification if order_id is present and not yet completed
    if (order_id && (!orderObj || orderObj.status !== 'completed')) {
        const isVerified = await verifyPakasirOrder(req.supabase, order_id, amount, device_id, targetUserId, targetEmail);
        orderObj = orders.get(order_id) || orderObj;
    }

    const isOrderCompleted = orderObj ? orderObj.status === 'completed' : false;

    res.json({
        isActive,
        isOrderCompleted,
        orderStatus: orderObj ? orderObj.status : 'pending',
        deviceExpiry,
        remainingDays: isActive ? Math.ceil((deviceExpiry - Date.now()) / (1000 * 60 * 60 * 24)) : 0
    });
});

// 3. Claim Order Endpoint (Manual Order ID Verification & Credit)
router.post('/claim-order', async (req, res) => {
    const { orderId, deviceId } = req.body;

    if (!orderId || typeof orderId !== 'string') {
        return res.status(400).json({ error: 'Order ID transaksi wajib diisi' });
    }

    const cleanOrderId = orderId.trim();

    let targetUserId = null;
    let targetEmail = null;

    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, getJwtSecret());
            if (decoded) {
                targetUserId = decoded.id;
                targetEmail = decoded.email;
            }
        } catch (e) {}
    }

    if (!targetUserId && !targetEmail) {
        return res.status(401).json({ error: 'Silakan login terlebih dahulu untuk mengklaim transaksi pembayaran' });
    }

    try {
        const isVerified = await verifyPakasirOrder(req.supabase, cleanOrderId, null, deviceId, targetUserId, targetEmail);

        if (isVerified) {
            // Fetch updated user from DB
            const { data: updatedUser } = await req.supabase
                .from('users')
                .select('id, email, name, role, access_until, token_balance')
                .eq('id', targetUserId)
                .single();

            return res.json({
                success: true,
                message: `Order ${cleanOrderId} berhasil diverifikasi! Hak akses paket telah diaktifkan ke akun Anda.`,
                user: updatedUser
            });
        } else {
            return res.status(400).json({
                error: `Order ID "${cleanOrderId}" belum terverifikasi selesai di gateway Pakasir. Pastikan Order ID benar dan pembayaran sudah berhasil diselesaikan.`
            });
        }
    } catch (err) {
        console.error('[Claim Order Error]', err);
        return res.status(500).json({ error: 'Terjadi kesalahan saat mengklaim order ID.' });
    }
});

// 4. Pakasir Webhook Endpoint (Automatic Payment Confirmation)
const handleWebhookRequest = async (req, res) => {
    const { amount, order_id, project, status, email, user_id } = req.body;
    console.log(`[Pakasir Webhook Received] Order: ${order_id}, Status: ${status}, Amount: ${amount}`);

    if (status === 'completed' && order_id) {
        let order = orders.get(order_id);
        const plan = PRICING_PLANS[String(amount)];
        const days = plan ? plan.days : (amount >= 247000 ? 28 : (amount >= 97000 ? 7 : 1));
        const deviceId = order ? order.deviceId : (req.body.deviceId || 'unknown');
        const targetUserId = order ? order.userId : (user_id || null);
        const targetEmail = order ? order.email : (email || null);

        if (order) {
            order.status = 'completed';
            orders.set(order_id, order);
            saveOrders(orders);
        }

        // 1. Grant Access in SQLite / Supabase Database for User Account
        if (req.supabase && (targetUserId || targetEmail)) {
            await grantUserDurationAccessInDB(req.supabase, targetUserId, targetEmail, days);
        }

        // 2. Grant Device-level Access Pass
        if (deviceId !== 'unknown') {
            const currentExp = Number(deviceAccess.get(deviceId) || Date.now());
            const newExp = Math.max(currentExp, Date.now()) + (days * 24 * 60 * 60 * 1000);
            deviceAccess.set(deviceId, newExp);
            saveDeviceAccess(deviceAccess);
            console.log(`[Pakasir Webhook Success] Device: ${deviceId}, Duration: ${days} Days, Active Until: ${new Date(newExp).toISOString()}`);
        }
    }

    res.json({ status: 'ok', message: 'Webhook processed successfully' });
};

router.post('/pakasir-webhook', handleWebhookRequest);
router.post('/webhook', handleWebhookRequest);

module.exports = router;
