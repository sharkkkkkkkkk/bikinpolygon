/**
 * Centralized Business Rules Configuration for BikinPolygon System (Server)
 * Durasi Akses (Hari) & Device Trial Scheme
 */
module.exports = {
  FREE_DEVICE_TRIAL_LIMIT: 1, // 1x Pemakaian Gratis
  ACCESS_PLANS: {
    '27000': { days: 1, name: 'Akses Harian (1 Hari)' },
    '97000': { days: 7, name: 'Akses Mingguan (7 Hari)', isPopular: true },
    '247000': { days: 28, name: 'Akses Bulanan (28 Hari)' }
  }
};
