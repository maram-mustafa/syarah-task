-- Create database if not exists
CREATE DATABASE IF NOT EXISTS syarah_db;

USE syarah_db;

-- Grant privileges
GRANT ALL PRIVILEGES ON syarah_db.* TO 'syarah_user'@'%';
FLUSH PRIVILEGES;
