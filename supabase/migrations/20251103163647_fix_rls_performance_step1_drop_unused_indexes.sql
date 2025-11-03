/*
  # Fix RLS Performance Issues - Step 1: Drop Unused Indexes

  Drop unused indexes to improve write performance and reduce maintenance overhead.
*/

DROP INDEX IF EXISTS idx_files_user_id;
DROP INDEX IF EXISTS idx_files_created_at;
DROP INDEX IF EXISTS idx_contacts_user_id;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_activity_logs_user_id;
