-- ============================================
-- USER PROFILE DATA SCHEMA
-- ============================================
-- For PostgreSQL database storage (optional)
-- If you want to store data in database instead of just email

-- Table 1: User Profiles (KYC Data)
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  
  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  
  -- Address Information
  street_number VARCHAR(50) NOT NULL,
  street_name VARCHAR(255) NOT NULL,
  city_town VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  post_code VARCHAR(20) NOT NULL,
  country_region VARCHAR(100) NOT NULL,
  
  -- Contact Information
  phone_number VARCHAR(20) NOT NULL,
  
  -- Metadata
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  kyc_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  
  -- Indexes for fast queries
  UNIQUE(user_id),
  INDEX idx_email (email),
  INDEX idx_status (kyc_status)
);

-- Table 2: Card Payments
CREATE TABLE card_payments (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  
  -- Card Information (MASKED)
  cardholder_name VARCHAR(255) NOT NULL,
  card_type VARCHAR(50) NOT NULL, -- visa, mastercard, amex, verve
  last_four_digits VARCHAR(4) NOT NULL,
  expiry_month VARCHAR(2) NOT NULL,
  expiry_year VARCHAR(2) NOT NULL,
  
  -- Withdrawal Details
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Processing Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, completed, failed, cancelled
  tracking_id VARCHAR(255) UNIQUE,
  
  -- Metadata
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  notes TEXT,
  
  -- Indexes
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_submitted_at (submitted_at)
);

-- Table 3: Referrals
CREATE TABLE referrals (
  id SERIAL PRIMARY KEY,
  referrer_id VARCHAR(255) NOT NULL,
  referrer_email VARCHAR(255) NOT NULL,
  
  referral_code VARCHAR(50) NOT NULL,
  
  -- Referred User Info
  referee_id VARCHAR(255),
  referee_email VARCHAR(255) NOT NULL,
  
  -- Earnings
  earnings DECIMAL(15, 2) DEFAULT 5.00,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, paid
  
  -- Metadata
  confirmed_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_referrer_id (referrer_id),
  INDEX idx_referee_email (referee_email),
  INDEX idx_code (referral_code),
  INDEX idx_status (status)
);

-- Table 4: Data Collection Logs
CREATE TABLE data_collection_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  email VARCHAR(255),
  data_type VARCHAR(50), -- profile, card_payment, referral
  status VARCHAR(50), -- success, failed
  error_message TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_data_type (data_type),
  INDEX idx_status (status)
);

-- ============================================
-- QUERIES FOR ADMIN
-- ============================================

-- View all profile submissions
SELECT 
  id,
  user_id,
  email,
  CONCAT(first_name, ' ', last_name) AS full_name,
  country,
  submitted_at,
  kyc_status
FROM user_profiles
ORDER BY submitted_at DESC
LIMIT 100;

-- View all pending card payments
SELECT 
  id,
  user_id,
  email,
  cardholder_name,
  card_type,
  CONCAT('****', last_four_digits) AS card_number,
  amount,
  status,
  submitted_at
FROM card_payments
WHERE status = 'pending'
ORDER BY submitted_at DESC;

-- View today's referrals
SELECT 
  id,
  referrer_id,
  referee_email,
  referral_code,
  earnings,
  status,
  created_at
FROM referrals
WHERE DATE(created_at) = CURDATE()
ORDER BY created_at DESC;

-- View referral earnings summary
SELECT 
  referrer_id,
  referrer_email,
  COUNT(*) AS total_referrals,
  SUM(earnings) AS total_earnings,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) AS confirmed_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_count
FROM referrals
GROUP BY referrer_id
ORDER BY total_earnings DESC;

-- ============================================
-- ADMIN OPERATIONS
-- ============================================

-- Approve a KYC profile
UPDATE user_profiles
SET kyc_status = 'approved'
WHERE id = 1;

-- Mark card payment as processed
UPDATE card_payments
SET status = 'completed', processed_at = NOW()
WHERE id = 1;

-- Confirm a referral
UPDATE referrals
SET status = 'confirmed'
WHERE id = 1;

-- View error logs
SELECT 
  user_id,
  data_type,
  error_message,
  timestamp
FROM data_collection_logs
WHERE status = 'failed'
ORDER BY timestamp DESC
LIMIT 50;

-- ============================================
-- INDEX OPTIMIZATION
-- ============================================

-- Speed up common queries
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_card_payments_status ON card_payments(status);
CREATE INDEX idx_referrals_code ON referrals(referral_code);

-- ============================================
-- BACKUP COMMANDS
-- ============================================

-- PostgreSQL: Backup all data
-- pg_dump -U username -h localhost database_name > backup.sql

-- PostgreSQL: Restore from backup
-- psql -U username -h localhost database_name < backup.sql

-- Export profile data to CSV
SELECT 
  user_id,
  email,
  first_name,
  last_name,
  phone_number,
  country,
  post_code,
  submitted_at
FROM user_profiles
INTO OUTFILE 'profiles.csv'
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n';

-- ============================================
-- STORED PROCEDURES (Optional)
-- ============================================

-- Procedure to process pending cards
DELIMITER //
CREATE PROCEDURE process_pending_payments()
BEGIN
  UPDATE card_payments
  SET status = 'processing',
      processed_at = NOW()
  WHERE status = 'pending'
  AND submitted_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE);
END//
DELIMITER ;

-- Run: CALL process_pending_payments();

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- Create a view for daily stats
CREATE VIEW daily_statistics AS
SELECT 
  DATE(submitted_at) as submission_date,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_submissions,
  'profile' as type
FROM user_profiles
GROUP BY DATE(submitted_at)

UNION ALL

SELECT 
  DATE(submitted_at),
  COUNT(DISTINCT user_id),
  COUNT(*),
  'card_payment'
FROM card_payments
GROUP BY DATE(submitted_at);

-- Query the view: SELECT * FROM daily_statistics;
