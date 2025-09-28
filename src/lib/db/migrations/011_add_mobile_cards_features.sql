-- Migration: Add time limit and multiple redirect options to mobile_cards
-- Purpose: Support time-limited cards and various contact methods for sponsors
-- Date: 2024-12-28

-- Check if columns exist before adding them
-- Using stored procedure to handle conditional column addition

DELIMITER $$

DROP PROCEDURE IF EXISTS AddColumnIfNotExists$$

CREATE PROCEDURE AddColumnIfNotExists(
    IN tableName VARCHAR(100),
    IN columnName VARCHAR(100),
    IN columnDefinition VARCHAR(500)
)
BEGIN
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = tableName
        AND COLUMN_NAME = columnName
    ) THEN
        SET @sql = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN ', columnName, ' ', columnDefinition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- Add time limit fields to mobile_cards table
CALL AddColumnIfNotExists('mobile_cards', 'valid_from', 'TIMESTAMP NULL DEFAULT NULL COMMENT "Card becomes active from this date"');
CALL AddColumnIfNotExists('mobile_cards', 'valid_until', 'TIMESTAMP NULL DEFAULT NULL COMMENT "Card expires after this date"');
CALL AddColumnIfNotExists('mobile_cards', 'is_time_limited', 'BOOLEAN DEFAULT FALSE COMMENT "Whether card has time restrictions"');

-- Add multiple redirect/contact options
CALL AddColumnIfNotExists('mobile_cards', 'redirect_type', 'VARCHAR(50) NULL DEFAULT "website" COMMENT "Type of redirect: website, email, phone, whatsapp, instagram, tiktok, location"');
CALL AddColumnIfNotExists('mobile_cards', 'contact_email', 'VARCHAR(255) NULL COMMENT "Sponsor email address"');
CALL AddColumnIfNotExists('mobile_cards', 'contact_phone', 'VARCHAR(50) NULL COMMENT "Sponsor phone number"');
CALL AddColumnIfNotExists('mobile_cards', 'contact_whatsapp', 'VARCHAR(50) NULL COMMENT "Sponsor WhatsApp number"');
CALL AddColumnIfNotExists('mobile_cards', 'social_instagram', 'VARCHAR(255) NULL COMMENT "Instagram profile URL"');
CALL AddColumnIfNotExists('mobile_cards', 'social_tiktok', 'VARCHAR(255) NULL COMMENT "TikTok profile URL"');
CALL AddColumnIfNotExists('mobile_cards', 'location_latitude', 'DECIMAL(10, 8) NULL COMMENT "Sponsor location latitude"');
CALL AddColumnIfNotExists('mobile_cards', 'location_longitude', 'DECIMAL(11, 8) NULL COMMENT "Sponsor location longitude"');
CALL AddColumnIfNotExists('mobile_cards', 'location_address', 'TEXT NULL COMMENT "Sponsor full address"');

-- Clean up stored procedure
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;

-- Create indexes only if they don't exist
DELIMITER $$

CREATE PROCEDURE CreateIndexIfNotExists(
    IN tableName VARCHAR(100),
    IN indexName VARCHAR(100),
    IN indexDefinition VARCHAR(500)
)
BEGIN
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = tableName
        AND INDEX_NAME = indexName
    ) THEN
        SET @sql = CONCAT('CREATE INDEX ', indexName, ' ON ', tableName, indexDefinition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- Add indexes for efficient querying
CALL CreateIndexIfNotExists('mobile_cards', 'idx_mobile_cards_time_limit', '(is_time_limited, valid_from, valid_until)');
CALL CreateIndexIfNotExists('mobile_cards', 'idx_mobile_cards_redirect_type', '(redirect_type)');

-- Clean up
DROP PROCEDURE IF EXISTS CreateIndexIfNotExists;

-- Update existing cards to have website as default redirect type
UPDATE mobile_cards
SET redirect_type = 'website'
WHERE redirect_url IS NOT NULL AND redirect_url != '' AND redirect_type IS NULL;