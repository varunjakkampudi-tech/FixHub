-- Fix Hub Platform Database Migration 001
-- PostgreSQL 16+ with PostGIS Spatial Extension

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Users table (Customer, Merchant, Technician, Admin)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'merchant', 'technician', 'admin')),
    locale VARCHAR(10) DEFAULT 'en' CHECK (locale IN ('en', 'te')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Merchants table
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(150) NOT NULL,
    description TEXT,
    categories TEXT[] NOT NULL, -- e.g. ARRAY['electrician', 'plumbing']
    coverage_zones TEXT[] NOT NULL, -- e.g. ARRAY['Tanuku-Central', 'Tanuku-East']
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location GEOMETRY(Point, 4326),
    rating NUMERIC(3, 2) DEFAULT 5.00,
    total_reviews INT DEFAULT 0,
    total_jobs INT DEFAULT 0,
    kyc_status VARCHAR(20) DEFAULT 'verified' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
    is_available BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_merchants_categories ON merchants USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_merchants_location ON merchants USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_merchants_active_available ON merchants(is_active, is_available);

-- 3. Technicians table
CREATE TABLE IF NOT EXISTS technicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    skills TEXT[] NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_technicians_merchant_id ON technicians(merchant_id);

-- 4. Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(30) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES users(id),
    merchant_id UUID REFERENCES merchants(id),
    technician_id UUID REFERENCES technicians(id),
    category VARCHAR(50) NOT NULL,
    service_title VARCHAR(150) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location GEOMETRY(Point, 4326),
    scheduled_type VARCHAR(20) DEFAULT 'instant' CHECK (scheduled_type IN ('instant', 'scheduled')),
    scheduled_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) NOT NULL DEFAULT 'requested' CHECK (
        status IN (
            'requested',
            'offered',
            'accepted',
            'technician_assigned',
            'on_the_way',
            'arrived',
            'quote_pending',
            'quote_accepted',
            'in_progress',
            'completed',
            'payment_pending',
            'settled',
            'cancelled',
            'disputed'
        )
    ),
    inspection_fee NUMERIC(10, 2) DEFAULT 149.00,
    labor_charge NUMERIC(10, 2) DEFAULT 0.00,
    parts_charge NUMERIC(10, 2) DEFAULT 0.00,
    platform_fee NUMERIC(10, 2) DEFAULT 50.00,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) DEFAULT 199.00,
    payment_method VARCHAR(30) DEFAULT 'cash_on_completion' CHECK (payment_method IN ('cash_on_completion', 'online_upi', 'online_card')),
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    paid_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_merchant_id ON bookings(merchant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_technician_id ON bookings(technician_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_location ON bookings USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

-- 5. Booking Offers (for smart multi-merchant dispatch)
CREATE TABLE IF NOT EXISTS booking_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'offered' CHECK (status IN ('offered', 'accepted', 'rejected', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(booking_id, merchant_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_offers_lookup ON booking_offers(booking_id, status);

-- 6. Quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES technicians(id),
    items JSONB NOT NULL, -- Array of { description: string, amount: number }
    labor_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    parts_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quotes_booking ON quotes(booking_id);

-- 7. Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
    customer_id UUID NOT NULL REFERENCES users(id),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    technician_id UUID REFERENCES technicians(id),
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_merchant ON reviews(merchant_id);

-- 8. Disputes table
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_reference VARCHAR(30) NOT NULL UNIQUE,
    booking_id UUID NOT NULL REFERENCES bookings(id),
    raised_by UUID NOT NULL REFERENCES users(id),
    reason VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_disputes_booking ON disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

-- 9. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    channel VARCHAR(30) NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'push', 'in_app')),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'read')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, status);

-- 10. Audit Logs & Outbox Events (Transactional Outbox Pattern)
CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregate_type VARCHAR(50) NOT NULL,
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox_events(status, created_at);
