import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, ScrollView, Switch, ActivityIndicator, View } from 'react-native';
import { MotiView, AnimatePresence } from '@/components/MotiShim';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { WebLayout } from './WebLayout';
import { Button } from '../../../components/Button';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../../theme';
import { db } from '../../../services/supabase';
import { 
  User, Mail, Phone, Briefcase, Plus, Search, Edit3, X, MapPin, Building, CreditCard
} from 'lucide-react-native';

import { useNotifications } from '../../../components/NotificationProvider';

export const CreateClient = () => {
  const { colors } = useTheme();
  const { showToast } = useNotifications();
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingClient, setEditingClient] = useState<any>(null);

  const [formData, setFormData] = useState({
    clientname: '',
    emailid: '',
    mobile: '',
    gstin: '',
    addressline1: '',
    landmark: '',
    bankholdername: '',
    accountnumber: '',
    ifsccode: '',
    optional1: '' // Category
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const data = await db.clients.getAll();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingClient) {
        await db.clients.update(editingClient.clientid, formData);
        showToast('Client profile updated successfully!');
      } else {
        await db.clients.create(formData);
        showToast('New client registered successfully!');
      }
      setShowForm(false);
      setEditingClient(null);
      resetForm();
      fetchClients();
    } catch (error) {
      showToast('Failed to save client details', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      clientname: '', emailid: '', mobile: '', gstin: '',
      addressline1: '', landmark: '', bankholdername: '',
      accountnumber: '', ifsccode: '', optional1: ''
    });
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await db.clients.update(id, { isactive: newStatus });
      showToast(newStatus ? 'Client account activated' : 'Client account disabled', 'info');
      fetchClients();
    } catch (error) {
      showToast('Error updating status', 'error');
    }
  };

  const FormField = ({ label, value, onChange, placeholder, icon: Icon, width = '48%' }: any) => (
    <View style={{ width, marginBottom: 16 }}>
      <TText variant="caption" style={styles.label}>{label}</TText>
      <TView style={[styles.inputWrapper, { backgroundColor: colors.surfaceSecondary }]}>
        <Icon size={16} color={colors.textSecondary} />
        <TextInput 
          value={value} 
          onChangeText={onChange} 
          placeholder={placeholder} 
          style={[styles.input, { color: colors.text }]} 
          placeholderTextColor={colors.textSecondary}
        />
      </TView>
    </View>
  );

  if (loading) {
    return (
      <WebLayout>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </WebLayout>
    );
  }

  return (
    <WebLayout>
      <View style={styles.header}>
        <View>
          <TText variant="title">Client Directory</TText>
          <TText variant="caption">Manage business profiles, tax info, and banking for all clients</TText>
        </View>
        <Button 
          title="Register Client" 
          icon={<Plus size={18} color="#fff" />} 
          onPress={() => setShowForm(true)}
          style={{ width: 180 }}
        />
      </View>

      <AnimatePresence>
        {showForm && (
          <View style={styles.overlay}>
             <MotiView 
                from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                style={[styles.formCard, { backgroundColor: colors.card, ...SHADOWS.lg }]}
             >
                <View style={styles.formHeader}>
                  <TText variant="subtitle">{editingClient ? 'Edit Client Profile' : 'New Client Registration'}</TText>
                  <TouchableOpacity onPress={() => setShowForm(false)}><X size={24} color={colors.textSecondary} /></TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <TText variant="caption" style={styles.sectionDivider}>Basic Info</TText>
                  <View style={styles.grid}>
                    <FormField label="Full Name / Company" value={formData.clientname} onChange={(v:any)=>setFormData({...formData, clientname:v})} placeholder="e.g. Acme Corp" icon={Building} width="100%" />
                    <FormField label="Email ID" value={formData.emailid} onChange={(v:any)=>setFormData({...formData, emailid:v})} placeholder="billing@client.com" icon={Mail} />
                    <FormField label="Mobile No" value={formData.mobile} onChange={(v:any)=>setFormData({...formData, mobile:v})} placeholder="9876543210" icon={Phone} />
                    <FormField label="GSTIN" value={formData.gstin} onChange={(v:any)=>setFormData({...formData, gstin:v})} placeholder="27AAAAA0000A1Z5" icon={CreditCard} />
                    <FormField label="Category" value={formData.optional1} onChange={(v:any)=>setFormData({...formData, optional1:v})} placeholder="e.g. Retailer" icon={Briefcase} />
                  </View>

                  <TText variant="caption" style={styles.sectionDivider}>Address & Location</TText>
                  <View style={styles.grid}>
                    <FormField label="Address Line" value={formData.addressline1} onChange={(v:any)=>setFormData({...formData, addressline1:v})} placeholder="Street, Area..." icon={MapPin} width="100%" />
                    <FormField label="Landmark" value={formData.landmark} onChange={(v:any)=>setFormData({...formData, landmark:v})} placeholder="Near Public Park" icon={MapPin} width="100%" />
                  </View>

                  <TText variant="caption" style={styles.sectionDivider}>Bank Details</TText>
                  <View style={styles.grid}>
                    <FormField label="Bank Holder Name" value={formData.bankholdername} onChange={(v:any)=>setFormData({...formData, bankholdername:v})} placeholder="Account Holder" icon={User} width="100%" />
                    <FormField label="Account Number" value={formData.accountnumber} onChange={(v:any)=>setFormData({...formData, accountnumber:v})} placeholder="502000xxxx" icon={CreditCard} />
                    <FormField label="IFSC Code" value={formData.ifsccode} onChange={(v:any)=>setFormData({...formData, ifsccode:v})} placeholder="HDFC0001234" icon={CreditCard} />
                  </View>

                  <Button title={editingClient ? "Update Profile" : "Save Client"} onPress={handleSave} style={{ marginTop: 24 }} />
                </ScrollView>
             </MotiView>
          </View>
        )}
      </AnimatePresence>

      <TView style={[styles.listCard, { backgroundColor: colors.card, ...SHADOWS.sm }]}>
        <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
          <TText style={[styles.col, { flex: 2 }]} variant="caption">Client & Category</TText>
          <TText style={[styles.col, { flex: 1.5 }]} variant="caption">Address & Landmark</TText>
          <TText style={styles.col} variant="caption">Contact Details</TText>
          <TText style={[styles.col, { flex: 1.5 }]} variant="caption">Bank / GSTIN</TText>
          <TText style={[styles.col, { flex: 0.5 }]} variant="caption">Status</TText>
          <View style={{ width: 60 }} />
        </View>
        {clients.map((c) => (
          <View key={c.clientid} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
            {/* Name & Category */}
            <View style={[styles.col, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
               <TView style={[styles.avatar, { backgroundColor: COLORS.primary + '15' }]}>
                  <TText style={{ color: COLORS.primary, fontWeight: '800' }}>{c.clientname[0]}</TText>
               </TView>
               <View style={{ marginLeft: 12 }}>
                  <TText style={{ fontWeight: '600' }}>{c.clientname}</TText>
                  <TText variant="caption" style={{ fontSize: 10 }}>{c.optional1 || 'General'}</TText>
               </View>
            </View>

            {/* Address */}
            <View style={[styles.col, { flex: 1.5 }]}>
              <TText variant="body" style={{ fontSize: 13 }}>{c.addressline1 || '-'}</TText>
              <TText variant="caption" style={{ fontSize: 11 }}>{c.landmark ? `📍 ${c.landmark}` : ''}</TText>
            </View>

            {/* Contact */}
            <View style={styles.col}>
              <TText variant="body" style={{ fontSize: 13 }}>📞 {c.mobile}</TText>
              <TText variant="caption" style={{ fontSize: 11 }}>✉️ {c.emailid || '-'}</TText>
            </View>

            {/* Bank / GST */}
            <View style={[styles.col, { flex: 1.5 }]}>
              <TText variant="caption" style={{ fontWeight: '700' }}>GST: {c.gstin || 'N/A'}</TText>
              <TText variant="caption" style={{ fontSize: 11 }}>{c.accountnumber ? `Bank: ${c.accountnumber} (${c.ifsccode})` : 'No Bank Info'}</TText>
            </View>

            {/* Status */}
            <View style={[styles.col, { flex: 0.5 }]}>
              <Switch value={c.isactive} onValueChange={() => toggleStatus(c.clientid, c.isactive)} trackColor={{ false: colors.border, true: COLORS.primary }} />
            </View>

            <TouchableOpacity onPress={() => { setEditingClient(c); setFormData({ ...c }); setShowForm(true); }} style={styles.iconBtn}>
              <Edit3 size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}
      </TView>
    </WebLayout>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  listCard: { borderRadius: RADIUS.xl, padding: 24 },
  tableHeader: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, marginBottom: 8 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  col: { flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  iconBtn: { padding: 8 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, justifyContent: 'center', alignItems: 'center' },
  formCard: { width: '90%', maxWidth: 650, maxHeight: '90%', padding: 32, borderRadius: RADIUS.xl },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  sectionDivider: { color: COLORS.primary, fontWeight: '800', marginVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.primary + '30', paddingBottom: 4 },
  label: { marginBottom: 6, fontWeight: '700', fontSize: 12 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48, borderRadius: RADIUS.md },
  input: { flex: 1, marginLeft: 12 },
});
