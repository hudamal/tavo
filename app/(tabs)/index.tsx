import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  I18nManager,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { FileText, Users, Bell, HardDrive, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';

I18nManager.forceRTL(true);

type DashboardStats = {
  totalFiles: number;
  totalContacts: number;
  unreadNotifications: number;
  storageUsed: number;
};

type RecentFile = {
  id: string;
  title: string;
  file_type: string;
  created_at: string;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
};

export default function DashboardScreen() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalFiles: 0,
    totalContacts: 0,
    unreadNotifications: 0,
    storageUsed: 0,
  });
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      const [filesResult, contactsResult, notificationsResult] = await Promise.all([
        supabase.from('files').select('*', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('contacts').select('*', { count: 'exact' }).eq('user_id', user.id),
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false }),
      ]);

      const recentFilesResult = await supabase
        .from('files')
        .select('id, title, file_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalFiles: filesResult.count || 0,
        totalContacts: contactsResult.count || 0,
        unreadNotifications: notificationsResult.data?.length || 0,
        storageUsed: profile?.storage_used || 0,
      });

      setRecentFiles(recentFilesResult.data || []);
      setNotifications(notificationsResult.data || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }, [user, profile]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-SA');
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>مرحباً، {profile?.full_name || 'المستخدم'}</Text>
        <Text style={styles.subtitle}>نظرة عامة على ملفاتك وبياناتك</Text>
      </View>

      <View style={styles.statsGrid}>
        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/files')}>
          <View style={styles.statIconContainer}>
            <FileText size={24} color="#2563eb" />
          </View>
          <Text style={styles.statValue}>{stats.totalFiles}</Text>
          <Text style={styles.statLabel}>إجمالي الملفات</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/contacts')}>
          <View style={styles.statIconContainer}>
            <Users size={24} color="#10b981" />
          </View>
          <Text style={styles.statValue}>{stats.totalContacts}</Text>
          <Text style={styles.statLabel}>جهات الاتصال</Text>
        </TouchableOpacity>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Bell size={24} color="#f59e0b" />
          </View>
          <Text style={styles.statValue}>{stats.unreadNotifications}</Text>
          <Text style={styles.statLabel}>إشعارات جديدة</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <HardDrive size={24} color="#8b5cf6" />
          </View>
          <Text style={styles.statValue}>{formatBytes(stats.storageUsed)}</Text>
          <Text style={styles.statLabel}>مساحة مستخدمة</Text>
        </View>
      </View>

      {recentFiles.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الملفات الأخيرة</Text>
          {recentFiles.map((file) => (
            <View key={file.id} style={styles.fileCard}>
              <View style={styles.fileIcon}>
                <FileText size={20} color="#2563eb" />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{file.title}</Text>
                <View style={styles.fileMetaRow}>
                  <Clock size={14} color="#64748b" />
                  <Text style={styles.fileMeta}>{formatDate(file.created_at)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {notifications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الإشعارات الأخيرة</Text>
          {notifications.slice(0, 5).map((notification) => (
            <View key={notification.id} style={styles.notificationCard}>
              <View style={styles.notificationDot} />
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>{formatDate(notification.created_at)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'right',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'right',
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fileMeta: {
    fontSize: 14,
    color: '#64748b',
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
    marginTop: 6,
    marginLeft: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'right',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'right',
  },
  notificationTime: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
  },
});
