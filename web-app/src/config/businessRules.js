/**
 * Centralized Business Rules Configuration for BikinPolygon System (Client)
 * Durasi Akses (Hari) & Device Trial Scheme
 */
export const FREE_DEVICE_TRIAL_LIMIT = 1; // 1x Pemakaian Gratis

export const ACCESS_PLANS = {
  DAILY: { id: '27000', amount: 27000, name: 'Akses Harian (1 Hari)', days: 1 },
  WEEKLY: { id: '97000', amount: 97000, name: 'Akses Mingguan (7 Hari)', days: 7, isPopular: true },
  MONTHLY: { id: '247000', amount: 247000, name: 'Akses Bulanan (28 Hari)', days: 28 },
};
