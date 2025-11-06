-- ============================================================
-- Migration: Create Products Table
-- Description: Creates the products table for Elasticsearch sync example
-- ============================================================

-- Drop table if exists (for clean re-runs)
DROP TABLE IF EXISTS products;

-- Create products table
CREATE TABLE products (
    -- Primary Key
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Product Information
    name VARCHAR(255) NOT NULL COMMENT 'Product name',
    description TEXT COMMENT 'Detailed product description',
    sku VARCHAR(100) NOT NULL UNIQUE COMMENT 'Stock Keeping Unit - unique identifier',

    -- Pricing & Inventory
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Product price',
    category VARCHAR(100) COMMENT 'Product category',
    stock_quantity INT NOT NULL DEFAULT 0 COMMENT 'Available stock quantity',

    -- Status & Metadata
    status ENUM('active', 'inactive', 'discontinued') NOT NULL DEFAULT 'active' COMMENT 'Product status',
    tags TEXT COMMENT 'JSON array of product tags',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes for performance
    INDEX idx_sku (sku),
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_updated_at (updated_at) COMMENT 'For polling-based sync if needed'

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Sample Data (Optional - for testing)
-- ============================================================

INSERT INTO products (name, description, sku, price, category, stock_quantity, status, tags) VALUES
(
    'Laptop Pro 15',
    'High-performance laptop with 16GB RAM and 512GB SSD. Perfect for development and content creation.',
    'LP-15-001',
    1299.99,
    'Electronics',
    50,
    'active',
    '["laptop", "electronics", "computers", "high-performance"]'
),
(
    'Wireless Mouse',
    'Ergonomic wireless mouse with adjustable DPI and long battery life.',
    'WM-002',
    29.99,
    'Accessories',
    200,
    'active',
    '["mouse", "wireless", "accessories", "ergonomic"]'
),
(
    'USB-C Cable',
    'Fast charging USB-C cable with data transfer speeds up to 10Gbps.',
    'UC-003',
    12.99,
    'Accessories',
    500,
    'active',
    '["cable", "usb", "charging", "accessories"]'
),
(
    'Mechanical Keyboard',
    'RGB mechanical keyboard with Cherry MX switches. Perfect for gaming and typing.',
    'MK-004',
    149.99,
    'Accessories',
    75,
    'active',
    '["keyboard", "mechanical", "gaming", "rgb"]'
),
(
    'External SSD 1TB',
    'Portable external SSD with USB 3.2 Gen 2 support. Read speeds up to 1050MB/s.',
    'SSD-1TB-005',
    179.99,
    'Storage',
    120,
    'active',
    '["storage", "ssd", "portable", "fast"]'
),
(
    '27" 4K Monitor',
    'Professional 4K monitor with IPS panel and HDR support. Perfect for designers.',
    'MON-27-4K-006',
    449.99,
    'Electronics',
    30,
    'active',
    '["monitor", "4k", "display", "professional"]'
),
(
    'Webcam HD',
    'Full HD 1080p webcam with built-in microphone. Ideal for video conferencing.',
    'WC-HD-007',
    79.99,
    'Accessories',
    150,
    'active',
    '["webcam", "camera", "video", "conferencing"]'
),
(
    'Desk Lamp LED',
    'Adjustable LED desk lamp with multiple brightness levels and USB charging port.',
    'DL-LED-008',
    39.99,
    'Office',
    100,
    'active',
    '["lamp", "led", "desk", "office"]'
),
(
    'Noise-Canceling Headphones',
    'Premium wireless headphones with active noise cancellation and 30-hour battery life.',
    'HP-NC-009',
    299.99,
    'Audio',
    60,
    'active',
    '["headphones", "audio", "wireless", "noise-canceling"]'
),
(
    'Smartphone Stand',
    'Adjustable aluminum smartphone stand compatible with all devices.',
    'SS-010',
    19.99,
    'Accessories',
    300,
    'active',
    '["stand", "phone", "accessories", "aluminum"]'
),
(
    'Vintage Laptop',
    'Classic laptop from 2010. No longer in production.',
    'VL-2010-999',
    99.99,
    'Electronics',
    5,
    'discontinued',
    '["laptop", "vintage", "discontinued"]'
);

-- ============================================================
-- Verification Queries
-- ============================================================

-- Count total products
-- SELECT COUNT(*) as total_products FROM products;

-- Count by status
-- SELECT status, COUNT(*) as count FROM products GROUP BY status;

-- Count by category
-- SELECT category, COUNT(*) as count FROM products GROUP BY category ORDER BY count DESC;

-- View all active products
-- SELECT id, name, sku, price, category, stock_quantity FROM products WHERE status = 'active';

-- ============================================================
-- Notes for Customization
-- ============================================================
--
-- To use this for your own table:
-- 1. Replace table name: products → table_x
-- 2. Modify columns to match your requirements
-- 3. Update indexes based on your query patterns
-- 4. Adjust sample data or remove it
-- 5. Update the model in src/models/ to match
--
-- ============================================================
