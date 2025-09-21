-- Migration 007: Add show_results column to polls table
-- Adds show_results enum column to control when poll results are visible

ALTER TABLE polls
ADD COLUMN show_results ENUM('never', 'after_voting', 'always') NOT NULL DEFAULT 'after_voting'
COMMENT 'Controls when poll results are visible: never = Results hidden, after_voting = Show after user votes, always = Results always visible';

-- Add index for performance when filtering by show_results
ALTER TABLE polls
ADD INDEX idx_polls_show_results (show_results);