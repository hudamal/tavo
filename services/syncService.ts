import { supabase } from '@/lib/supabase';

export class SyncService {
  private static syncInterval: ReturnType<typeof setInterval> | null = null;
  private static readonly SYNC_INTERVAL_MS = 15 * 60 * 1000;

  static async startAutoSync(userId: string) {
    if (this.syncInterval) {
      this.stopAutoSync();
    }

    await this.syncNow(userId);

    this.syncInterval = setInterval(async () => {
      await this.syncNow(userId);
    }, this.SYNC_INTERVAL_MS);

    console.log('Auto-sync started - syncing every 15 minutes');
  }

  static stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Auto-sync stopped');
    }
  }

  static async syncNow(userId: string) {
    try {
      console.log('Starting sync for user:', userId);

      const now = new Date().toISOString();

      const { error: filesError } = await supabase
        .from('files')
        .update({ synced_at: now })
        .eq('user_id', userId);

      if (filesError) {
        console.error('Error syncing files:', filesError);
        return false;
      }

      console.log('Sync completed successfully at', now);
      return true;
    } catch (error) {
      console.error('Sync error:', error);
      return false;
    }
  }

  static async createBackup(userId: string) {
    try {
      console.log('Creating backup for user:', userId);

      const [filesResult, contactsResult] = await Promise.all([
        supabase.from('files').select('*').eq('user_id', userId),
        supabase.from('contacts').select('*').eq('user_id', userId),
      ]);

      const backupData = {
        timestamp: new Date().toISOString(),
        files: filesResult.data || [],
        contacts: contactsResult.data || [],
      };

      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'backup_created',
        resource_type: 'user',
        resource_id: userId,
        details: {
          files_count: backupData.files.length,
          contacts_count: backupData.contacts.length,
        },
      });

      console.log('Backup created successfully');
      return backupData;
    } catch (error) {
      console.error('Backup error:', error);
      throw error;
    }
  }
}
