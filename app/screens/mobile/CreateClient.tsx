import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, ActivityIndicator, Platform, Modal, View, SafeAreaView, RefreshControl } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { Button } from '../../../components/Button';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../../theme';
import { db } from '../../../services/supabase';
import { useNotifications } from '../../../components/NotificationProvider';
import { Plus, Search, Edit2, User, Building, MapPin, CreditCard, Mail, Phone, Briefcase, X, ChevronRight, ChevronLeft, Hash } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const FormField = ({ label, value, onChange, placeholder, icon: Icon, keyboardType = 'default' }: any) => {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 16 }}>
      <TText variant="caption" style={styles.label}>{label}</TText>
      <TView style={[styles.inputWrapper, { backgroundColor: colors.surfaceSecondary }]}>
        <Icon size={16} color={colors.textSecondary} />
        <TextInput 
          value={value} 
          onChangeText={onChange} 
          placeholder={placeholder} 
          keyboardType={keyboardType}
          style={[styles.input, { color: colors.text }]} 
          placeholderTextColor={colors.textSecondary}
        />
      </TView>
    </View>
  );
};

const MobileClientManagement = () => {
  const { colors } = useTheme();
  const { showToast } = useNotifications();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const fetchClients = useCallback(async () => {
    try {
      const data = await db.clients.getAll();
      setClients(data);
    } catch (error) {
       console.error(error);
    } finally {
       setLoading(false);
       setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSave = async () => {
    if (!formData.clientname) return showToast('Client name is required', 'error');
    setLoading(true);
    try {
      if (editingClient) {
        await db.clients.update(editingClient.clientid, formData);
        showToast('Client updated!');
      } else {
        await db.clients.create(formData);
        showToast('Client registered!');
      }
      setShowForm(false);
      setEditingClient(null);
      resetForm();
      fetchClients();
    } catch (error) {
      showToast('Save failed', 'error');
    } finally {
      setLoading(false);
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
      await db.clients.update(id, { isactive: !currentStatus });
      fetchClients();
      showToast('Status updated');
    } catch (error) {
       showToast('Error updating status', 'error');
    }
  };

  const filteredClients = clients.filter(c => 
    c.clientname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && clients.length === 0) return <TView style={{flex: 1, justifyContent: 'center'}}><ActivityIndicator size="large" color={COLORS.primary} /></TView>;

  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TView style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <TText variant="subtitle" style={{ fontWeight: '900' }}>Add Client</TText>
        <TView style={{ width: 40 }} />
      </TView>

      <TView style={styles.searchContainer}>
        <TView style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput 
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or company..." 
            style={{ marginLeft: 8, flex: 1, color: colors.text, fontWeight: '600' }} 
          />
        </TView>
      </TView>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {filteredClients.map((c, i) => (
          <MotiView
            key={c.clientid}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: i * 50 }}
            style={[styles.clientCard, { backgroundColor: 'transparent', borderWidth: 1.2, borderColor: c.isactive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)' }]}
          >
            <TView style={styles.cardHeader}>
               <TView style={[styles.avatar, { backgroundColor: c.isactive ? COLORS.success : COLORS.danger, borderWidth: 0 }]}>
                  <TText style={{ color: '#fff', fontWeight: '900' }}>{c.clientname?.[0]?.toUpperCase()}</TText>
               </TView>
               <TView style={{ flex: 1, marginLeft: 16 }}>
                  <TText style={{ fontWeight: '800', fontSize: 16 }}>{c.clientname}</TText>
                  <TView style={{ flexDirection: 'row', alignItems: 'center' }}>
                     <Building size={12} color={colors.textSecondary} />
                     <TText variant="caption" style={{ marginLeft: 6, fontWeight: '600' }}>{c.gstin || 'No GSTIN'}</TText>
                  </TView>
               </TView>
               <TView style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                 <TouchableOpacity 
                   onPress={() => {
                     setEditingClient(c);
                     setFormData({ ...c });
                     setShowForm(true);
                   }}
                   style={styles.headerEditBtn}
                 >
                   <Edit2 size={18} color={COLORS.primary} />
                 </TouchableOpacity>
                 <Switch 
                  value={c.isactive} 
                  onValueChange={() => toggleStatus(c.clientid, c.isactive)}
                  trackColor={{ false: 'rgba(0,0,0,0.1)', true: COLORS.success }}
                />
               </TView>
            </TView>

            <TView style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <TView style={styles.infoRow}>
               <MapPin size={14} color={colors.textSecondary} style={{ width: 20 }} />
               <TText variant="caption" style={{ flex: 1 }}>{c.addressline1 || 'No Address Provided'}</TText>
            </TView>
            <TView style={[styles.infoRow, { marginTop: 6 }]}>
               <CreditCard size={14} color={colors.textSecondary} style={{ width: 20 }} />
               <TText variant="caption" style={{ flex: 1 }}>{c.accountnumber ? `Bank: ****${c.accountnumber.toString().slice(-4)}` : 'No Banking Info'}</TText>
            </TView>

            <TView style={styles.cardFooter}>
               <TView style={[styles.statusBadge, { backgroundColor: c.isactive ? COLORS.success + '15' : COLORS.danger + '15' }]}>
                  <TText style={{ fontSize: 10, fontWeight: '900', color: c.isactive ? COLORS.success : COLORS.danger }}>{c.isactive ? 'Active' : 'InActive'}</TText>
               </TView>
               <TView />
            </TView>
          </MotiView>
        ))}
      </ScrollView>

      {/* Registration/Edit Form Modal */}
      <Modal visible={showForm} animationType="slide">
        <TView style={{ flex: 1, backgroundColor: colors.background }}>
           <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
             <TText variant="subtitle">{editingClient ? 'Edit Client' : 'New Registration'}</TText>
             <TouchableOpacity onPress={() => setShowForm(false)}><X size={24} color={colors.text} /></TouchableOpacity>
           </View>
           <ScrollView contentContainerStyle={{ padding: 20 }}>
              <TText style={styles.formSectionTitle}>BUSINESS INFO</TText>
              <FormField label="Full Name / Company" value={formData.clientname} onChange={(v:any)=>setFormData({...formData, clientname:v})} placeholder="e.g. Acme Corp" icon={Building} />
              <TView style={{ flexDirection: 'row', gap: 16 }}>
                <View style={{ flex: 1 }}><FormField label="Category" value={formData.optional1} onChange={(v:any)=>setFormData({...formData, optional1:v})} placeholder="e.g. Dealer" icon={Briefcase} /></View>
                <View style={{ flex: 1 }}><FormField label="GSTIN" value={formData.gstin} onChange={(v:any)=>setFormData({...formData, gstin:v})} placeholder="Tax ID..." icon={CreditCard} /></View>
              </TView>

              <TText style={[styles.formSectionTitle, { marginTop: 10 }]}>CONTACT & LOCATION</TText>
              <FormField label="Email Address" value={formData.emailid} onChange={(v:any)=>setFormData({...formData, emailid:v})} placeholder="billing@client.com" icon={Mail} keyboardType="email-address" />
              <FormField label="Mobile Number" value={formData.mobile} onChange={(v:any)=>setFormData({...formData, mobile:v})} placeholder="Primary phone..." icon={Phone} keyboardType="phone-pad" />
              <FormField label="Address" value={formData.addressline1} onChange={(v:any)=>setFormData({...formData, addressline1:v})} placeholder="Street, City..." icon={MapPin} />
              
              <TText style={[styles.formSectionTitle, { marginTop: 10 }]}>BANKING DETAILS</TText>
              <FormField label="Bank Holder Name" value={formData.bankholdername} onChange={(v:any)=>setFormData({...formData, bankholdername:v})} placeholder="Account owner..." icon={User} />
              <FormField label="Account Number" value={formData.accountnumber} onChange={(v:any)=>setFormData({...formData, accountnumber:v})} placeholder="Bank account no." icon={CreditCard} keyboardType="numeric" />
              <FormField label="IFSC Code" value={formData.ifsccode} onChange={(v:any)=>setFormData({...formData, ifsccode:v})} placeholder="Bank IFSC..." icon={Hash} />

              <Button 
                title={editingClient ? "Update Client" : "Register Client"} 
                onPress={handleSave} 
                style={{ marginTop: 20, height: 50 }} 
                loading={loading}
              />
              <View style={{ height: 40 }} />
           </ScrollView>
        </TView>
      </Modal>

      <TouchableOpacity 
        onPress={() => {
          setEditingClient(null);
          resetForm();
          setShowForm(true);
        }}
        style={[styles.fab, { backgroundColor: COLORS.primary, ...SHADOWS.md }]}
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1 },
  backBtn: { padding: 8 },
  searchContainer: { padding: 20 },
  searchBar: { height: 50, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  scrollContent: { padding: 20, paddingTop: 0, paddingBottom: 100 },
  clientCard: { borderRadius: RADIUS.lg, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1, marginVertical: 12, opacity: 0.2 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  headerEditBtn: { padding: 6, borderRadius: 8, backgroundColor: 'rgba(129, 140, 248, 0.1)' },
  iconAction: { padding: 8, borderRadius: 10, backgroundColor: 'transparent' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  modalHeader: { height: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1 },
  formSectionTitle: { fontSize: 10, fontWeight: '800', color: COLORS.primary, marginBottom: 12, letterSpacing: 1 },
  label: { marginBottom: 6, fontWeight: '700', fontSize: 12 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48, borderRadius: RADIUS.md },
  input: { flex: 1, marginLeft: 12, fontWeight: '600' },
});

export default MobileClientManagement;
