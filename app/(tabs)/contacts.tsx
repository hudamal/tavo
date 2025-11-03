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
import { Users, Plus, Edit, Trash2, X, Mail, Phone, Briefcase } from 'lucide-react-native';

I18nManager.forceRTL(true);

type Contact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  department: string | null;
  notes: string | null;
  created_at: string;
};

export default function ContactsScreen() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    notes: '',
  });

  const loadContacts = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل جهات الاتصال');
    }
  }, [user]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  };

  const openCreateModal = () => {
    setEditingContact(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      notes: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      position: contact.position || '',
      department: contact.department || '',
      notes: contact.notes || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      Alert.alert('خطأ', 'يرجى إدخال اسم جهة الاتصال');
      return;
    }

    try {
      if (editingContact) {
        const { error } = await supabase
          .from('contacts')
          .update({
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone || null,
            position: formData.position || null,
            department: formData.department || null,
            notes: formData.notes || null,
          })
          .eq('id', editingContact.id);

        if (error) throw error;
        Alert.alert('نجح', 'تم تحديث جهة الاتصال بنجاح');
      } else {
        const { error } = await supabase.from('contacts').insert({
          user_id: user!.id,
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          position: formData.position || null,
          department: formData.department || null,
          notes: formData.notes || null,
        });

        if (error) throw error;
        Alert.alert('نجح', 'تم إضافة جهة الاتصال بنجاح');
      }

      setModalVisible(false);
      loadContacts();
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء حفظ جهة الاتصال');
    }
  };

  const handleDelete = async (contact: Contact) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف "${contact.name}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('contacts').delete().eq('id', contact.id);

              if (error) throw error;
              Alert.alert('نجح', 'تم حذف جهة الاتصال بنجاح');
              loadContacts();
            } catch (error: any) {
              Alert.alert('خطأ', error.message || 'حدث خطأ أثناء حذف جهة الاتصال');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>جهات الاتصال</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>لا توجد جهات اتصال حتى الآن</Text>
            <Text style={styles.emptySubtext}>ابدأ بإضافة جهات اتصال جديدة</Text>
          </View>
        ) : (
          contacts.map((contact) => (
            <View key={contact.id} style={styles.contactCard}>
              <View style={styles.contactIcon}>
                <Users size={24} color="#10b981" />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactName}>{contact.name}</Text>
                {contact.position && (
                  <View style={styles.infoRow}>
                    <Briefcase size={14} color="#64748b" />
                    <Text style={styles.infoText}>{contact.position}</Text>
                  </View>
                )}
                {contact.email && (
                  <View style={styles.infoRow}>
                    <Mail size={14} color="#64748b" />
                    <Text style={styles.infoText}>{contact.email}</Text>
                  </View>
                )}
                {contact.phone && (
                  <View style={styles.infoRow}>
                    <Phone size={14} color="#64748b" />
                    <Text style={styles.infoText}>{contact.phone}</Text>
                  </View>
                )}
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openEditModal(contact)}
                >
                  <Edit size={20} color="#2563eb" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(contact)}
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
                {editingContact ? 'تعديل جهة الاتصال' : 'إضافة جهة اتصال جديدة'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>الاسم *</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل الاسم"
                placeholderTextColor="#94a3b8"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                textAlign="right"
              />

              <Text style={styles.label}>البريد الإلكتروني</Text>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor="#94a3b8"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
              />

              <Text style={styles.label}>رقم الهاتف</Text>
              <TextInput
                style={styles.input}
                placeholder="05XXXXXXXX"
                placeholderTextColor="#94a3b8"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                textAlign="right"
              />

              <Text style={styles.label}>المنصب</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل المنصب"
                placeholderTextColor="#94a3b8"
                value={formData.position}
                onChangeText={(text) => setFormData({ ...formData, position: text })}
                textAlign="right"
              />

              <Text style={styles.label}>القسم</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل القسم"
                placeholderTextColor="#94a3b8"
                value={formData.department}
                onChangeText={(text) => setFormData({ ...formData, department: text })}
                textAlign="right"
              />

              <Text style={styles.label}>ملاحظات</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="أدخل ملاحظات إضافية (اختياري)"
                placeholderTextColor="#94a3b8"
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={4}
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
    backgroundColor: '#10b981',
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
  contactCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'right',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
  },
  contactActions: {
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
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
