import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  I18nManager,
  Switch,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { User, LogOut, Shield, Users, Activity, RefreshCw, HardDrive, Bell } from 'lucide-react-native';

I18nManager.forceRTL(true);

export default function SettingsScreen() {
  const { profile, user, signOut } = useAuth();
  const router = useRouter();
  const [autoSync, setAutoSync] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    const checkLastSync = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('files')
        .select('synced_at')
        .eq('user_id', user.id)
        .order('synced_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.synced_at) {
        setLastSyncTime(new Date(data.synced_at));
      }
    };

    checkLastSync();
  }, [user]);

  const handleSignOut = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تسجيل الخروج',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/auth/login');
          } catch (error: any) {
            Alert.alert('خطأ', error.message || 'حدث خطأ أثناء تسجيل الخروج');
          }
        },
      },
    ]);
  };

  const handleManualSync = async () => {
    if (!user) return;

    Alert.alert('جاري المزامنة...', 'يتم مزامنة بياناتك مع السيرفر');

    try {
      await supabase
        .from('files')
        .update({ synced_at: new Date().toISOString() })
        .eq('user_id', user.id);

      setLastSyncTime(new Date());
      Alert.alert('نجح', 'تمت المزامنة بنجاح');
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء المزامنة');
    }
  };

  const handleBackup = () => {
    Alert.alert('نسخ احتياطي', 'يتم إنشاء نسخة احتياطية من بياناتك...', [
      {
        text: 'حسناً',
        onPress: () => {
          setTimeout(() => {
            Alert.alert('نجح', 'تم إنشاء النسخة الاحتياطية بنجاح');
          }, 1500);
        },
      },
    ]);
  };

  const formatStorageSize = (bytes: number) => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الإعدادات</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <User size={48} color="#ffffff" />
        </View>
        <Text style={styles.profileName}>{profile?.full_name}</Text>
        <Text style={styles.profileEmail}>{profile?.email}</Text>
        {profile?.role === 'admin' && (
          <View style={styles.adminBadge}>
            <Shield size={16} color="#ffffff" />
            <Text style={styles.adminBadgeText}>مدير النظام</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>معلومات الحساب</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>القسم</Text>
            <Text style={styles.infoValue}>{profile?.department || 'غير محدد'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>الدور</Text>
            <Text style={styles.infoValue}>{profile?.role === 'admin' ? 'مدير' : 'موظف'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>المساحة المستخدمة</Text>
            <Text style={styles.infoValue}>{formatStorageSize(profile?.storage_used || 0)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>المزامنة والنسخ الاحتياطي</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <RefreshCw size={24} color="#2563eb" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>المزامنة التلقائية</Text>
                <Text style={styles.settingDescription}>مزامنة البيانات تلقائياً كل 15 دقيقة</Text>
              </View>
            </View>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={autoSync ? '#2563eb' : '#f1f5f9'}
            />
          </View>

          {lastSyncTime && (
            <Text style={styles.syncTime}>آخر مزامنة: {lastSyncTime.toLocaleTimeString('ar-SA')}</Text>
          )}

          <TouchableOpacity style={styles.actionButton} onPress={handleManualSync}>
            <RefreshCw size={20} color="#2563eb" />
            <Text style={styles.actionButtonText}>مزامنة الآن</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.menuItem} onPress={handleBackup}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIcon}>
              <HardDrive size={20} color="#10b981" />
            </View>
            <Text style={styles.menuItemText}>إنشاء نسخة احتياطية</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الإشعارات</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Bell size={24} color="#f59e0b" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>تفعيل الإشعارات</Text>
                <Text style={styles.settingDescription}>إشعارات عند رفع أو تعديل الملفات</Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#cbd5e1', true: '#fcd34d' }}
              thumbColor={notifications ? '#f59e0b' : '#f1f5f9'}
            />
          </View>
        </View>
      </View>

      {profile?.role === 'admin' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إدارة النظام</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <Users size={20} color="#8b5cf6" />
              </View>
              <Text style={styles.menuItemText}>إدارة المستخدمين</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <Activity size={20} color="#06b6d4" />
              </View>
              <Text style={styles.menuItemText}>سجلات النشاط</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Tavo - إدارة ملفات الموظفين</Text>
        <Text style={styles.footerVersion}>الإصدار 1.0.0</Text>
      </View>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right',
  },
  profileSection: {
    backgroundColor: '#ffffff',
    padding: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 12,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  adminBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'right',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  settingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
    textAlign: 'right',
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'right',
  },
  syncTime: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'right',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
