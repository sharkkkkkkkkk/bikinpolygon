const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../middleware/authMiddleware');

// In-memory caching maps backed by Supabase tables: payment_orders & device_access
const orders = new Map();
const deviceAccess = new Map();

// Optional one-time migration from legacy JSON files if they exist on disk
const DATA_DIR = path.join(__dirname, '../data');
const ACCESS_FILE = path.join(DATA_DIR, 'deviceAccess.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

try {
    if (fs.existsSync(ACCESS_FILE)) {
        const legacyAccess = JSON.parse(fs.readFileSync(ACCESS_FILE, 'utf8'));
        for (const [k, v] of Object.entries(legacyAccess)) {
            deviceAccess.set(k, Number(v));
        }
    }
    if (fs.existsSync(ORDERS_FILE)) {
        const legacyOrders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
        for (const [k, v] of Object.entries(legacyOrders)) {
            orders.set(k, v);
        }
    }
} catch (e) {
    console.warn('[Payment Store] Legacy JSON migration check warning:', e.message);
}

const PAKASIR_SLUG = process.env.PAKASIR_SLUG || 'bikinpolygon';
const PAKASIR_API_KEY = process.env.PAKASIR_API_KEY;

// Pricing duration mapping (in days)
const PRICING_PLANS = {
    '27000': { days: 1, name: 'Akses Harian (1 Hari)', ms: 1 * 24 * 60 * 60 * 1000 },
    '97000': { days: 7, name: 'Akses Mingguan (7 Hari)', ms: 7 * 24 * 60 * 60 * 1000 },
    '247000': { days: 28, name: 'Akses Bulanan (28 Hari)', ms: 28 * 24 * 60 * 60 * 1000 }
};

// --- Database persistence helpers for Supabase ---
async function saveOrderToDB(supabase, orderData) {
    orders.set(orderData.orderId, orderData);
    if (!supabase) return;
    try {
        await supabase.from('payment_orders').upsert({
            id: orderData.orderId,
            amount: Number(orderData.amount),
            total_payment: Number(orderData.totalPayment || orderData.amount),
            fee: Number(orderData.fee || 0),
            payment_number: orderData.paymentNumber || null,
            expired_at: orderData.expiredAt || null,
            device_id: orderData.deviceId || null,
            user_id: orderData.userId || null,
            email: orderData.email ? orderData.email.toLowerCase() : null,
            plan_name: orderData.planName || null,
            days: Number(orderData.days || 1),
            status: orderData.status || 'pending',
            updated_at: new Date().toISOString()
        });
    } catch (err) {
        // Non-blocking error if table is not yet migrated in Supabase
        console.warn('[Payment Orders DB Save Warning]', err.message);
    }
}

async function getOrderFromDB(supabase, orderId) {
    if (!orderId) return null;
    let order = orders.get(orderId);
    if (order) return order;

    if (supabase) {
        try {
            const { data } = await supabase.from('payment_orders').select('*').eq('id', orderId).maybeSingle();
            if (data) {
                order = {
                    orderId: data.id,
                    amount: Number(data.amount),
                    totalPayment: Number(data.total_payment || data.amount),
                    fee: Number(data.fee || 0),
                    paymentNumber: data.payment_number,
                    expiredAt: data.expired_at,
                    deviceId: data.device_id,
                    userId: data.user_id,
                    email: data.email,
                    planName: data.plan_name,
                    days: data.days,
                    status: data.status,
                    createdAt: data.created_at
                };
                orders.set(orderId, order);
                return order;
            }
        } catch (err) {
            console.warn('[Payment Orders DB Read Warning]', err.message);
        }
    }
    return null;
}

async function saveDeviceAccessToDB(supabase, deviceId, expiryTimestamp, orderId = null) {
    if (!deviceId || deviceId === 'unknown') return;
    deviceAccess.set(deviceId, Number(expiryTimestamp));
    if (!supabase) return;
    try {
        await supabase.from('device_access').upsert({
            device_id: deviceId,
            access_expiry: Number(expiryTimestamp),
            expires_at: new Date(Number(expiryTimestamp)).toISOString(),
            last_order_id: orderId || null,
            updated_at: new Date().toISOString()
        });
    } catch (err) {
        console.warn('[Device Access DB Save Warning]', err.message);
    }
}

async function getDeviceAccessFromDB(supabase, deviceId) {
    if (!deviceId || deviceId === 'unknown') return 0;
    let exp = Number(deviceAccess.get(deviceId) || 0);
    if (exp > Date.now()) return exp;

    if (supabase) {
        try {
            const { data } = await supabase.from('device_access').select('access_expiry').eq('device_id', deviceId).maybeSingle();
            if (data?.access_expiry) {
                exp = Number(data.access_expiry);
                deviceAccess.set(deviceId, exp);
                return exp;
            }
        } catch (err) {
            console.warn('[Device Access DB Read Warning]', err.message);
        }
    }
    return exp;
}

// Helper function to grant duration access pass to database user automatically
async function grantUserDurationAccessInDB(supabase, userId, userEmail, days) {
    if (!supabase || (!userId && !userEmail)) return false;
    try {
        let query = supabase.from('bikinpolygon_users').select('id, email, access_until');
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
            .from('bikinpolygon_users')
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

                let order = await getOrderFromDB(supabase, orderId) || { orderId, amount: Number(planAmt), status: 'completed' };
                order.status = 'completed';
                if (currentUserId) order.userId = currentUserId;
                if (currentUserEmail) order.email = currentUserEmail;
                await saveOrderToDB(supabase, order);

                // Update User Account in Supabase DB automatically
                const userIdToCredit = order.userId || currentUserId;
                const emailToCredit = order.email || currentUserEmail;
                if (supabase && (userIdToCredit || emailToCredit)) {
                    await grantUserDurationAccessInDB(supabase, userIdToCredit, emailToCredit, days);
                }

                if (targetDevice !== 'unknown') {
                    const currentExp = await getDeviceAccessFromDB(supabase, targetDevice);
                    const newExp = Math.max(currentExp, Date.now()) + (days * 24 * 60 * 60 * 1000);
                    await saveDeviceAccessToDB(supabase, targetDevice, newExp, orderId);
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

    // Call Pakasir API Transaction Create (QRIS Method)
    if (PAKASIR_API_KEY) {
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

    await saveOrderToDB(req.supabase, orderData);

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

// 2. Check Order / Device Access Status & Synchronize with User Account
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

    let deviceExpiry = await getDeviceAccessFromDB(req.supabase, device_id);
    let isActive = deviceExpiry > Date.now();

    // Check user account access_until in Supabase DB if user is authenticated
    if (req.supabase && (targetUserId || targetEmail)) {
        try {
            let query = req.supabase.from('bikinpolygon_users').select('id, role, access_until');
            if (targetUserId) {
                query = query.eq('id', targetUserId);
            } else if (targetEmail) {
                query = query.eq('email', targetEmail.toLowerCase());
            }

            const { data: dbUser } = await query.maybeSingle();
            if (dbUser) {
                if (dbUser.role === 'admin') {
                    isActive = true;
                    deviceExpiry = Math.max(deviceExpiry, Date.now() + 365 * 24 * 60 * 60 * 1000);
                } else if (dbUser.access_until) {
                    const userExp = new Date(dbUser.access_until).getTime();
                    if (userExp > Date.now()) {
                        isActive = true;
                        deviceExpiry = Math.max(deviceExpiry, userExp);
                        // Synchronize this active duration to current device
                        if (device_id && device_id !== 'unknown') {
                            await saveDeviceAccessToDB(req.supabase, device_id, deviceExpiry);
                        }
                    }
                }
            }
        } catch (userCheckErr) {
            console.warn('[Check Status User DB Lookup Warning]', userCheckErr.message);
        }
    }

    // Check specific order status
    let orderObj = order_id ? await getOrderFromDB(req.supabase, order_id) : null;

    // Only attempt Pakasir verification if order_id is present and not yet completed
    if (order_id && (!orderObj || orderObj.status !== 'completed')) {
        const isVerified = await verifyPakasirOrder(req.supabase, order_id, amount, device_id, targetUserId, targetEmail);
        orderObj = await getOrderFromDB(req.supabase, order_id) || orderObj;
        if (isVerified) {
            deviceExpiry = await getDeviceAccessFromDB(req.supabase, device_id);
            isActive = deviceExpiry > Date.now();
        }
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
                .from('bikinpolygon_users')
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
                error: `Order ID "${cleanOrderId}" belum terverifikasi selesai. Pastikan Order ID benar dan pembayaran sudah berhasil diselesaikan.`
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
        let order = await getOrderFromDB(req.supabase, order_id);
        const plan = PRICING_PLANS[String(amount)];
        const days = plan ? plan.days : (amount >= 247000 ? 28 : (amount >= 97000 ? 7 : 1));
        const deviceId = order ? order.deviceId : (req.body.deviceId || 'unknown');
        const targetUserId = order ? order.userId : (user_id || null);
        const targetEmail = order ? order.email : (email || null);

        if (order) {
            order.status = 'completed';
        } else {
            order = {
                orderId: order_id,
                amount: Number(amount),
                deviceId,
                userId: targetUserId,
                email: targetEmail,
                days,
                status: 'completed'
            };
        }
        await saveOrderToDB(req.supabase, order);

        // 1. Grant Access in Supabase Database for User Account
        if (req.supabase && (targetUserId || targetEmail)) {
            await grantUserDurationAccessInDB(req.supabase, targetUserId, targetEmail, days);
        }

        // 2. Grant Device-level Access Pass in Supabase
        if (deviceId !== 'unknown') {
            const currentExp = await getDeviceAccessFromDB(req.supabase, deviceId);
            const newExp = Math.max(currentExp, Date.now()) + (days * 24 * 60 * 60 * 1000);
            await saveDeviceAccessToDB(req.supabase, deviceId, newExp, order_id);
            console.log(`[Pakasir Webhook Success] Device: ${deviceId}, Duration: ${days} Days, Active Until: ${new Date(newExp).toISOString()}`);
        }
    }

    res.json({ status: 'ok', message: 'Webhook processed successfully' });
};

router.post('/pakasir-webhook', handleWebhookRequest);
router.post('/webhook', handleWebhookRequest);

module.exports = router;
