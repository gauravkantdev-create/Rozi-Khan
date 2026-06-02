-- =======================================================
-- SQL DDL for RoziKhan Relational Database Schema
-- =======================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_email_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Email OTPs Table
CREATE TABLE IF NOT EXISTS email_otps (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    stock INTEGER DEFAULT 0,
    ratings NUMERIC(3, 2) DEFAULT 0.00,
    num_reviews INTEGER DEFAULT 0,
    supplier VARCHAR(255),
    created_by VARCHAR(36) REFERENCES users(id) ON delete SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- 4. Product Images Table (Array in MongoDB normalized to separate table)
CREATE TABLE IF NOT EXISTS product_images (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON delete CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- 5. Product Reviews Table (Subdocuments in MongoDB normalized to separate table)
CREATE TABLE IF NOT EXISTS product_reviews (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON delete CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON delete CASCADE,
    name VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);

-- 6. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON delete RESTRICT,
    
    -- Shipping Details
    shipping_fullname VARCHAR(255) NOT NULL,
    shipping_email VARCHAR(255),
    shipping_phone VARCHAR(50),
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_state VARCHAR(100) NOT NULL,
    shipping_postalcode VARCHAR(50) NOT NULL,
    shipping_country VARCHAR(100) DEFAULT 'India',
    
    -- Billing Details
    billing_fullname VARCHAR(255) NOT NULL,
    billing_email VARCHAR(255),
    billing_phone VARCHAR(50),
    billing_address TEXT NOT NULL,
    billing_city VARCHAR(100) NOT NULL,
    billing_state VARCHAR(100) NOT NULL,
    billing_postalcode VARCHAR(50) NOT NULL,
    billing_country VARCHAR(100) DEFAULT 'India',
    
    -- Razorpay Details
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_signature VARCHAR(255),
    
    -- Financials & Status
    payment_method VARCHAR(50) DEFAULT 'Razorpay',
    payment_status VARCHAR(50) DEFAULT 'Paid',
    status VARCHAR(50) DEFAULT 'Pending',
    cancel_reason TEXT,
    cancelled_at TIMESTAMP,
    items_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    shipping_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    delivery_estimate VARCHAR(100) DEFAULT '5-8 business days',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 7. Order Items Table (Subdocuments in MongoDB normalized to separate table)
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON delete CASCADE,
    product_id VARCHAR(36), -- Nullable to support deletion of items from catalog
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    image TEXT,
    category VARCHAR(100),
    supplier VARCHAR(255) DEFAULT 'RoziKhan Verified Supplier',
    quantity INTEGER NOT NULL CHECK (quantity >= 1)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 8. Order Status Histories Table (Subdocuments in MongoDB normalized to separate table)
CREATE TABLE IF NOT EXISTS order_status_histories (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON delete CASCADE,
    status VARCHAR(50) NOT NULL,
    note TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_status_histories_order_id ON order_status_histories(order_id);
