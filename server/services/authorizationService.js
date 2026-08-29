const turf = require('@turf/turf');

/**
 * Calculates the exact area in m2 from coordinates or manual input parameters
 */
function calculateGeometryArea(customPoints, lat, lng, manualArea) {
  let calculatedArea = 0;

  if (customPoints && Array.isArray(customPoints) && customPoints.length >= 3) {
    let points = [...customPoints];
    const first = points[0];
    const last = points[points.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      points.push(first);
    }
    const polygonGeoJSON = turf.polygon([points]);
    calculatedArea = turf.area(polygonGeoJSON);
  } else if (manualArea !== undefined && manualArea !== null && !isNaN(parseFloat(manualArea))) {
    calculatedArea = Math.max(0, parseFloat(manualArea));
  }

  return calculatedArea;
}

/**
 * Central Export Authorization Service (Duration Pass & Per-Token Access)
 */
async function authorizeExportService(supabase, userId, { exportType = 'OSS_SHP', customPoints, lat, lng, area }) {
  const calculatedArea = calculateGeometryArea(customPoints, lat, lng, area);

  if (!userId) {
    const error = new Error('User ID tidak ditemukan');
    error.status = 401;
    error.error = 'Unauthenticated';
    throw error;
  }

  // Fetch user details from Supabase
  const { data: user, error: dbError } = await supabase
    .from('users')
    .select('id, role, token_balance, access_until')
    .eq('id', userId)
    .single();

  if (dbError || !user) {
    const err = new Error('User tidak terdaftar dalam sistem');
    err.status = 404;
    err.error = 'User not found';
    throw err;
  }

  // 1. Admin accounts have unlimited access
  if (user.role === 'admin') {
    return {
      authorized: true,
      calculatedArea,
      accessType: 'ADMIN',
      message: `Export disetujui (Admin Access - ${calculatedArea.toFixed(2)} m²).`
    };
  }

  const now = new Date();
  const hasActiveTimePass = user.access_until && new Date(user.access_until) > now;
  const hasTokenBalance = (user.token_balance || 0) > 0;

  // 2. Active duration pass (Akses Harian 24 Jam, Mingguan 7 Hari, Bulanan 28 Hari)
  if (hasActiveTimePass) {
    return {
      authorized: true,
      calculatedArea,
      accessType: 'DURATION_PASS',
      expiresAt: user.access_until,
      message: `Export disetujui (Akses Durasi Aktif s.d. ${new Date(user.access_until).toLocaleString('id-ID')}).`
    };
  }

  // 3. Per-token balance backup access
  if (hasTokenBalance) {
    // Deduct 1 token for per-creation access if not on active duration pass
    await supabase
      .from('users')
      .update({ token_balance: Math.max(0, user.token_balance - 1) })
      .eq('id', userId);

    return {
      authorized: true,
      calculatedArea,
      accessType: 'TOKEN',
      remainingTokens: user.token_balance - 1,
      message: `Export disetujui (${user.token_balance - 1} token tersisa).`
    };
  }

  // 4. Access Expired / No active pass -> DENY ACCESS
  const accessError = new Error('Masa akses Anda telah habis. Akses Harian (24 Jam) / Mingguan / Bulanan telah kedaluwarsa.');
  accessError.status = 403;
  accessError.error = 'ACCESS_EXPIRED';
  accessError.details = 'Silakan beli Paket Akses Durasi (Top Up) untuk membuat polygon kembali.';
  throw accessError;
}

module.exports = {
  calculateGeometryArea,
  authorizeExportService
};
