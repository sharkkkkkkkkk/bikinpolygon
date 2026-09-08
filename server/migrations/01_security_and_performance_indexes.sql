-- Migration 01: Security & Performance Index Optimization for BikinPolygon
-- Description: Creates unique index on email, created_at DESC indexes for users and AEO scenarios

-- 1. Index for fast email lookup on login/register & email uniqueness enforcement
CREATE UNIQUE INDEX IF NOT EXISTS idx_bp_users_email ON bikinpolygon_users(email);

-- 2. Index for sorting users list by creation date in admin panel
CREATE INDEX IF NOT EXISTS idx_bp_users_created_at ON bikinpolygon_users(created_at DESC);

-- 3. Index for sorting AEO OSS scenarios
CREATE INDEX IF NOT EXISTS idx_aeo_created_at ON aeo_oss_scenarios(created_at DESC);
