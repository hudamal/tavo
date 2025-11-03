import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  I18nManager,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { FileText, Plus, Edit, Trash2, X } from 'lucide-react-native';

I18nManager.forceRTL(true);

type File = {
  id: string;
  title: string;
  description: string | null;
  file_type: 'document' | 'image' | 'pdf' | 'other';
  file_url: string;
  file_size: number;
  created_at: string;
  updated_at: string;
};

export default function FilesScreen() {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file_type: 'document' as 'document' | 'image' | 'pdf' | 'other',
    file_url: '',
  });

  const loadFiles = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل الملفات');
    }
  }, [user]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  };

  const openCreateModal = () => {
    setEditingFile(null);
    setFormData({
      title: '',
      description: '',
      file_type: 'document',
      file_url: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (file: File) => {
    setEditingFile(file);
    setFormData({
      title: file.title,
      description: file.description || '',
      file_type: file.file_type,
      file_url: file.file_url,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.file_url) {
      Alert.alert('خطأ', 'يرجى ملء العنوان ورابط الملف');
      return;
    }

    try {
      if (editingFile) {
        const { error } = await supabase
          .from('files')
          .update({
            title: formData.title,
            description: formData.description || null,
            file_type: formData.file_type,
            file_url: formData.file_url,
            synced_at: new Date().toISOString(),
          })
          .eq('id', editingFile.id);

        if (error) throw error;

        await supabase.from('notifications').insert({
          user_id: user!.id,
          title: 'تحديث ملف',
          message: `تم تحديث الملف "${formData.title}"`,
          type: 'file_update',
        });

        Alert.alert('نجح', 'تم تحديث الملف بنجاح');
      } else {
        const { error } = await supabase.from('files').insert({
          user_id: user!.id,
          title: formData.title,
          description: formData.description || null,
          file_type: formData.file_type,
          file_url: formData.file_url,
          file_size: 0,
        });

        if (error) throw error;

        await supabase.from('notifications').insert({
          user_id: user!.id,
          title: 'ملف جديد',
          message: `تم رفع الملف "${formData.title}"`,
          type: 'file_upload',
        });

        Alert.alert('نجح', 'تم إنشاء الملف بنجاح');
      }

      setModalVisible(false);
      loadFiles();
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء حفظ الملف');
    }
  };

  const handleDelete = async (file: File) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف الملف "${file.title}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('files').delete().eq('id', file.id);

              if (error) throw error;

              await supabase.from('notifications').insert({
                user_id: user!.id,
                title: 'حذف ملف',
                message: `تم حذف الملف "${file.title}"`,
                type: 'file_delete',
              });

              Alert.alert('نجح', 'تم حذف الملف بنجاح');
              loadFiles();
            } catch (error: any) {
              Alert.alert('خطأ', error.message || 'حدث خطأ أثناء حذف الملف');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الملفات</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {files.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>لا توجد ملفات حتى الآن</Text>
            <Text style={styles.emptySubtext}>ابدأ بإضافة ملفات جديدة</Text>
          </View>
        ) : (
          files.map((file) => (
            <View key={file.id} style={styles.fileCard}>
              <View style={styles.fileIcon}>
                <FileText size={24} color="#2563eb" />
              </View>
              <View style={styles.fileContent}>
                <Text style={styles.fileTitle}>{file.title}</Text>
                {file.description && (
                  <Text style={styles.fileDescription}>{file.description}</Text>
                )}
                <Text style={styles.fileDate}>{formatDate(file.created_at)}</Text>
              </View>
              <View style={styles.fileActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openEditModal(file)}
                >
                  <Edit size={20} color="#2563eb" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(file)}
                >
                  <Trash2 size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingFile ? 'تعديل الملف' : 'إضافة ملف جديد'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>العنوان</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل عنوان الملف"
                placeholderTextColor="#94a3b8"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                textAlign="right"
              />

              <Text style={styles.label}>الوصف</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="أدخل وصف الملف (اختياري)"
                placeholderTextColor="#94a3b8"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
                textAlign="right"
              />

              <Text style={styles.label}>رابط الملف</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com/file.pdf"
                placeholderTextColor="#94a3b8"
                value={formData.file_url}
                onChangeText={(text) => setFormData({ ...formData, file_url: text })}
                textAlign="right"
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>حفظ</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 8,
  },
  fileCard: {
    flexDirection: 'row',
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
  fileContent: {
    flex: 1,
  },
  fileTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'right',
  },
  fileDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'right',
  },
  fileDate: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
  },
  fileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalForm: {
    padding: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  saveButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
