import api from './api';

const DEVICE_ID_KEY = 'bp_device_id';
const FREE_TRIAL_KEY = 'bp_free_trial_used';
const ACCESS_EXPIRY_KEY = 'bp_access_expiry';
const LAST_ORDER_ID_KEY = 'bp_last_order_id';
const LAST_ORDER_AMOUNT_KEY = 'bp_last_order_amount';

// Generate or retrieve persistent Device ID
export function getDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = 'DEV-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
}

export function saveLastOrderInfo(orderId, amount) {
    if (orderId) localStorage.setItem(LAST_ORDER_ID_KEY, orderId);
    if (amount) localStorage.setItem(LAST_ORDER_AMOUNT_KEY, String(amount));
}

export function getLastOrderInfo() {
    return {
        orderId: localStorage.getItem(LAST_ORDER_ID_KEY),
        amount: localStorage.getItem(LAST_ORDER_AMOUNT_KEY)
    };
}

// Check if free trial has been used on this device
export function hasUsedFreeTrial() {
    return localStorage.getItem(FREE_TRIAL_KEY) === 'true';
}

// Mark free trial as used
export function markFreeTrialUsed() {
    localStorage.setItem(FREE_TRIAL_KEY, 'true');
}

// Check if device currently has active paid access pass
export async function checkAccessStatus(orderId = null) {
    const deviceId = getDeviceId();
    const lastOrder = getLastOrderInfo();
    const targetOrderId = orderId || lastOrder.orderId;
    const targetAmount = lastOrder.amount;

    try {
        const res = await api.get('/payment/check-status', {
            params: { 
                device_id: deviceId, 
                order_id: targetOrderId,
                amount: targetAmount
            }
        });
        if (res.data?.deviceExpiry) {
            localStorage.setItem(ACCESS_EXPIRY_KEY, String(res.data.deviceExpiry));
        }
        return res.data;
    } catch (err) {
        const cachedExp = Number(localStorage.getItem(ACCESS_EXPIRY_KEY) || 0);
        return {
            isActive: cachedExp > Date.now(),
            deviceExpiry: cachedExp,
            remainingDays: cachedExp > Date.now() ? Math.ceil((cachedExp - Date.now()) / (1000 * 60 * 60 * 24)) : 0
        };
    }
}

// Create QRIS / Payment transaction order
export async function createPaymentOrder(amount) {
    const deviceId = getDeviceId();
    const redirectUrl = window.location.origin + '/dashboard';
    const res = await api.post('/payment/create-order', {
        amount,
        deviceId,
        redirectUrl
    });
    if (res.data?.orderId) {
        saveLastOrderInfo(res.data.orderId, amount);
    }
    return res.data;
}

export async function claimPaymentOrder(orderId) {
    const deviceId = getDeviceId();
    const res = await api.post('/payment/claim-order', {
        orderId,
        deviceId
    });
    if (res.data?.success) {
        await checkAccessStatus(orderId);
    }
    return res.data;
}

export const createPakasirOrder = createPaymentOrder;
