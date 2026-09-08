-- Migration 02: Database Indexing & Payment Persistence Tables
-- Description: Creates payment_orders, device_access tables and comprehensive performance indexes across all tables

-- ==========================================================
-- 1. PAYMENT ORDERS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS payment_orders (
    id TEXT PRIMARY KEY, -- e.g. BP-17258...
    amount NUMERIC NOT NULL,
    total_payment NUMERIC,
    fee NUMERIC DEFAULT 0,
    payment_number TEXT,
    expired_at TEXT,
    device_id TEXT,
    user_id TEXT,
    email TEXT,
    plan_name TEXT,
    days INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending', -- 'pending' | 'completed' | 'expired'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for payment_orders
CREATE INDEX IF NOT EXISTS idx_orders_device_id ON payment_orders(device_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON payment_orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON payment_orders(created_at DESC);

-- ==========================================================
-- 2. DEVICE ACCESS TABLE (Hardware / Browser License Pass)
-- ==========================================================
CREATE TABLE IF NOT EXISTS device_access (
    device_id TEXT PRIMARY KEY,
    access_expiry BIGINT NOT NULL, -- Unix timestamp in milliseconds
    expires_at TIMESTAMPTZ,        -- Human-readable timestamp
    last_order_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for device_access expiration filtering
CREATE INDEX IF NOT EXISTS idx_device_access_expiry ON device_access(access_expiry);

-- ==========================================================
-- 3. BIKINPOLYGON USERS INDEXES (Auth & Duration Access)
-- ==========================================================
-- Fast lookup on login/register & prevent duplicate emails
CREATE UNIQUE INDEX IF NOT EXISTS idx_bp_users_email ON bikinpolygon_users(email);

-- Sorting users by registration date in admin panel
CREATE INDEX IF NOT EXISTS idx_bp_users_created_at ON bikinpolygon_users(created_at DESC);

-- Fast lookup for active duration passes (WHERE access_until > NOW())
CREATE INDEX IF NOT EXISTS idx_bp_users_access_until ON bikinpolygon_users(access_until);

-- Fast lookup for administrator role checks
CREATE INDEX IF NOT EXISTS idx_bp_users_role ON bikinpolygon_users(role);

-- ==========================================================
-- 4. AEO SCENARIOS & BLOG ARTICLES INDEXES (SEO / Content)
-- ==========================================================
-- Skenario AEO OSS
CREATE INDEX IF NOT EXISTS idx_aeo_created_at ON aeo_oss_scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aeo_is_active ON aeo_oss_scenarios(is_active);

-- Blog Articles (if table exists)
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_is_published ON articles(is_published, created_at DESC);
