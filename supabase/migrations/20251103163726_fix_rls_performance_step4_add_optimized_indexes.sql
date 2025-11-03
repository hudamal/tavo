/*
  # Fix RLS Performance Issues - Step 4: Add Optimized Indexes

  Replace removed unused indexes with composite indexes optimized for common query patterns.
  These indexes support:
  - Filtering by user_id (for RLS)
  - Sorting by created_at (most common sort order)
*/

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_files_user_created ON files(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_user_created ON contacts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_action ON activity_logs(user_id, action);
