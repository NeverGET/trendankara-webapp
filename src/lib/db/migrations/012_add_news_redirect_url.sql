-- Migration 012: Add redirect_url to news table
-- Purpose: Allow news articles to link to external sources
-- Requirements: Mobile API news endpoint with redirect support

-- Add redirect_url column to news table
ALTER TABLE news
ADD COLUMN IF NOT EXISTS redirect_url VARCHAR(500) NULL
COMMENT 'External URL for news redirect to original source'
AFTER content;

-- Add index for quick lookups (prefix index for VARCHAR)
CREATE INDEX IF NOT EXISTS idx_news_redirect ON news(redirect_url(255));
