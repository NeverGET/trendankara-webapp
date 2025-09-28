-- Migration 010: Cleanup Dynamic Content Tables
-- Purpose: Remove dynamic content management tables after mobile app deployment
-- Requirements: 8.4, 8.5 - System simplification post mobile app migration
--
-- IMPORTANT: This migration should ONLY be run AFTER the mobile app has been
-- deployed and verified to be working with the new mobile_cards based system.
--
-- Tables to be removed:
-- - content_pages: Dynamic content management (replaced by mobile_cards)
--
-- Tables to preserve:
-- - mobile_cards: New simplified card-based content system
-- - audit_log: Maintains audit trail
--
-- SAFETY CHECKS:
-- 1. Verify mobile app is deployed and functioning
-- 2. Backup database before running this migration
-- 3. Test rollback procedure in staging environment
-- 4. Ensure no references to content_pages exist in active code

-- ==============================================================================
-- SAFETY CHECK: Verify mobile_cards table exists and has data
-- This query should return at least 1 row before proceeding
-- ==============================================================================
-- SELECT COUNT(*) FROM mobile_cards WHERE is_active = 1;
-- Expected result: > 0 (at least one active mobile card exists)

-- ==============================================================================
-- BACKUP VERIFICATION: Ensure you have backed up the following tables
-- ==============================================================================
-- REQUIRED BACKUPS BEFORE EXECUTION:
-- - content_pages (all dynamic content data)
-- - audit_log (any content_pages related audit entries)

-- ==============================================================================
-- STEP 1: Remove content_pages table and its data
-- ==============================================================================

-- Remove foreign key constraints that reference content_pages
-- Check audit_log references to content_pages (no FK constraint, but clean up references)
UPDATE audit_log
SET entity_type = CONCAT('ARCHIVED_', entity_type)
WHERE entity_type = 'content_pages';

-- Drop the content_pages table
-- This removes all dynamic content management functionality
DROP TABLE IF EXISTS content_pages;

-- ==============================================================================
-- STEP 2: Clean up any remaining references in audit_log
-- ==============================================================================

-- Archive old content_pages audit entries for historical reference
-- but mark them as archived so they don't interfere with new system
UPDATE audit_log
SET action = CONCAT('ARCHIVED_', action)
WHERE entity_type = 'ARCHIVED_content_pages'
  AND action NOT LIKE 'ARCHIVED_%';

-- ==============================================================================
-- STEP 3: Verify cleanup completed successfully
-- ==============================================================================

-- These queries should return 0 rows after successful cleanup:
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'content_pages' AND table_schema = DATABASE();
-- SELECT COUNT(*) FROM audit_log WHERE entity_type = 'content_pages';

-- This query should return > 0 rows (mobile_cards should still exist):
-- SELECT COUNT(*) FROM mobile_cards WHERE is_active = 1;

-- ==============================================================================
-- ROLLBACK PROCEDURE (if needed)
-- ==============================================================================
--
-- WARNING: Rollback is only possible if you have proper backups!
--
-- To rollback this migration:
--
-- 1. Restore content_pages table from backup:
--    mysql> source backup_content_pages.sql;
--
-- 2. Restore audit_log references:
--    UPDATE audit_log
--    SET entity_type = 'content_pages'
--    WHERE entity_type = 'ARCHIVED_content_pages';
--
--    UPDATE audit_log
--    SET action = SUBSTRING(action, 10)  -- Remove 'ARCHIVED_' prefix
--    WHERE entity_type = 'content_pages'
--      AND action LIKE 'ARCHIVED_%';
--
-- 3. Verify rollback:
--    SELECT COUNT(*) FROM content_pages;
--    SELECT COUNT(*) FROM audit_log WHERE entity_type = 'content_pages';
--
-- ==============================================================================
-- POST-MIGRATION VERIFICATION CHECKLIST
-- ==============================================================================
--
-- After running this migration, verify:
-- ✓ Mobile app is still functioning correctly
-- ✓ mobile_cards table is intact and accessible
-- ✓ No application errors related to content_pages
-- ✓ Admin panel mobile cards management still works
-- ✓ API endpoints for mobile cards are responding
--
-- Performance improvements expected:
-- ✓ Reduced database complexity
-- ✓ Simplified content management workflow
-- ✓ Faster query performance (fewer joins needed)
--
-- ==============================================================================

-- Migration completed successfully
-- Dynamic content management system has been simplified to use mobile_cards only
-- content_pages table and its complex component system have been removed