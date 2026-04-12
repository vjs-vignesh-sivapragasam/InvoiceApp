import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView, ActivityIndicator, View, Modal, FlatList, SafeAreaView, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { Button } from '../../../components/Button';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../../theme';
import { db } from '../../../services/supabase';
import { useNotifications } from '../../../components/NotificationProvider';
import { useAppConfig } from '../../../components/AppConfigProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Plus, Trash2, Calendar, User as UserIcon, 
  FileText, ChevronRight, Calculator,
  Search, X, Hash, ShoppingBag, CreditCard, Eye, Percent, ChevronDown
} from 'lucide-react-native';
import { Design1 } from '../../../components/templates/Design1';

interface Client { clientid: number; clientname: string; gstin?: string; addressline1?: string; mobile?: string; }
interface Product { productid: number; productname: string; sellingprice: number; hsn?: string; incase?: number; }
interface Item { 
  id: string; productid: number | null; name: string; qty: string; 
  incase: string; pieces: string; price: string; hsn: string; 
}

const MobileBilling = () => {
  const { colors, isDark } = useTheme();
  const { config } = useAppConfig();
  const { showToast } = useNotifications();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<Item[]>([{ id: '1', productid: null, name: '', qty: '1', incase: '1', pieces: '1', price: '0', hsn: '' }]);
  const [adjustment, setAdjustment] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [billGST, setBillGST] = useState('12'); 
  const [billNo, setBillNo] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [withGST, setWithGST] = useState(true);
  const [docType, setDocType] = useState<'invoice' | 'quotation'>('invoice');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<any>(null);

  const gstOptions = ['2', '8', '9', '12', '18'];

  useEffect(() => {
    fetchInitialData();
    const generatedNo = `${config.billSeriesText}${config.billSeriesDelimiter}${config.billSeriesNumber}${config.billSeriesDelimiter}${config.billSeriesCount}`;
    setBillNo(generatedNo);
  }, []);

  const fetchInitialData = async () => {
    try {
      const [c, p] = await Promise.all([db.clients.getAll(), db.products.getAll()]);
      setClients(c); setProducts(p);
      const savedProfile = await AsyncStorage.getItem('business_profile');
      if (savedProfile) setBusinessProfile(JSON.parse(savedProfile));
    } catch { showToast('Database connection error', 'error'); } 
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInitialData();
  }, [fetchInitialData]);

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), productid: null, name: '', qty: '1', incase: '1', pieces: '1', price: '0', hsn: '' }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(it => {
      if (it.id !== id) return it;
      let updated = { ...it, [field]: value };
      if (field === 'productid') {
        const p = products.find(x => x.productid === value);
        updated.productid = value; updated.name = p?.productname || ''; updated.price = p?.sellingprice?.toString() || '0'; updated.hsn = p?.hsn || ''; updated.incase = p?.incase?.toString() || '1';
      }
      updated.pieces = ((parseFloat(updated.qty) || 0) * (parseFloat(updated.incase) || 1)).toString();
      return updated;
    }));
  };

  const calculateSubtotal = () => items.reduce((acc, item) => acc + (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0), 0);
  const calculateTotal = () => {
    const sub = calculateSubtotal();
    const total = sub * (1 + parseFloat(billGST)/100);
    const disc = total * (parseFloat(discount)/100 || 0);
    return total - disc + (parseFloat(adjustment) || 0);
  };

  const handleSave = async () => {
    if (!selectedClient) return showToast('Select a client first', 'error');
    setLoading(true);
    try {
      await db.billing.create({
          clientid: selectedClient.clientid, billno: billNo, totalamount: calculateTotal(),
          taxableamount: calculateSubtotal(), isactive: true, billdate: billDate,
          optional1: discount, optional2: billGST 
      });
      showToast('Transaction saved!');
      router.back();
    } catch (e) { showToast('Failed to save', 'error'); } 
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: colors.background }]}>
      <TView style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ChevronRight size={24} color={colors.text} style={{ transform: [{ rotate: '180deg'}] }} /></TouchableOpacity>
        <TText variant="subtitle" style={{ fontWeight: '800' }}>Terminal</TText>
        <TView style={{ width: 44 }} />
      </TView>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
      >
        <TView style={[styles.typeSwitcher, { backgroundColor: 'rgba(129, 140, 248, 0.1)', borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.2)' }]}>
           <TouchableOpacity onPress={() => { setDocType('invoice'); setWithGST(true); }} style={[styles.typeBtn, docType === 'invoice' && { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.2)' : '#fff', ...SHADOWS.sm }]}><TText style={[styles.typeLabel, docType === 'invoice' && { color: COLORS.primary }]}>TAX INVOICE</TText></TouchableOpacity>
           <TouchableOpacity onPress={() => { setDocType('quotation'); setWithGST(false); }} style={[styles.typeBtn, docType === 'quotation' && { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.2)' : '#fff', ...SHADOWS.sm }]}><TText style={[styles.typeLabel, docType === 'quotation' && { color: COLORS.primary }]}>QUOTATION</TText></TouchableOpacity>
        </TView>

        <TView style={[styles.headerSection, { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.05)' : colors.card, borderColor: colors.border }]}>
          <View style={styles.compactClientPicker}>
            <TView style={styles.pickerIconSmall}><UserIcon size={16} color={selectedClient ? COLORS.primary : colors.textSecondary} /></TView>
            <TView style={{ flex: 1, marginLeft: 10 }}>
              <TText numberOfLines={1} style={{ fontWeight: '800', fontSize: 14, color: selectedClient ? colors.text : colors.textSecondary }}>{selectedClient ? selectedClient.clientname : 'Locked Client'}</TText>
            </TView>
          </View>

          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={styles.expandHeader}>
             <TView style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Hash size={14} color={COLORS.primary} />
                <TText style={{ fontWeight: '800', fontSize: 12 }}>{billNo}</TText>
             </TView>
             <ChevronDown size={16} color={colors.textSecondary} style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }} />
          </TouchableOpacity>

          <AnimatePresence>
            {isExpanded && (
              <MotiView from={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'timing', duration: 250 }} style={{ overflow: 'hidden' }}>
                 <TView style={styles.expandedMetaRow}>
                    <TView style={styles.miniMetaDisabled}><Calendar size={12} color={COLORS.primary} /><TText style={[styles.miniValueText, { color: colors.textSecondary }]}>{billDate}</TText></TView>
                    <TView style={styles.miniMetaDisabled}><Percent size={12} color={COLORS.primary} /><TText style={[styles.miniValueText, { color: colors.textSecondary }]}>{billGST}% GST Enabled</TText></TView>
                 </TView>
              </MotiView>
             )}
          </AnimatePresence>

          <TView style={styles.miniMetaFull}><Percent size={12} color={COLORS.primary} /><TText style={{ marginLeft: 6, fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>Bill GST: </TText><ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>{gstOptions.map(opt => (<TouchableOpacity key={opt} onPress={() => setBillGST(opt)} style={[styles.gstChip, billGST === opt && { backgroundColor: COLORS.primary }]}><TText style={[styles.gstChipText, billGST === opt && { color: '#fff' }]}>{opt}%</TText></TouchableOpacity>))}</ScrollView></TView>
        </TView>

        <TView style={styles.sectionTitleRow}><TText style={styles.sectionTitle}>PARTICULARS ({items.length})</TText><TouchableOpacity onPress={addItem} style={styles.addMiniBtn}><Plus size={14} color="#fff" /></TouchableOpacity></TView>

        {items.map((item, index) => (
          <MotiView key={item.id} from={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={[styles.itemCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#fff', borderWidth: 1.2, borderColor: colors.border }]}>
             <TView style={styles.itemHeader}>
                <TView style={[styles.itemNum, { backgroundColor: COLORS.primary + '15' }]}><TText style={[styles.itemNumText, { color: COLORS.primary }]}>{index + 1}</TText></TView>
                <TouchableOpacity onPress={() => { setSearchQuery(''); setActiveItemIndex(index); setProductModalVisible(true); }} style={styles.productLink}><TText numberOfLines={1} style={[styles.productNameText, !item.name && { color: colors.textSecondary }]}>{item.name || 'Select Product...'}</TText></TouchableOpacity>
                <TouchableOpacity onPress={() => removeItem(item.id)} style={{ padding: 5 }}><Trash2 size={16} color={COLORS.danger} /></TouchableOpacity>
             </TView>

             <TView style={styles.compactRow}>
                <TView style={styles.compactCol}><TText style={styles.compactLabel}>INCASE</TText><TView style={styles.compactValueBox}><TText style={styles.compactValueText}>{item.incase}</TText></TView></TView>
                <TView style={styles.compactCol}><TText style={styles.compactLabel}>PIECES</TText><TView style={styles.compactValueBox}><TText style={styles.compactValueText}>{item.pieces}</TText></TView></TView>
                <TView style={styles.compactCol}><TText style={styles.compactLabel}>RATE</TText><TView style={styles.compactValueBox}><TText style={styles.compactValueText}>₹{item.price}</TText></TView></TView>
                <TView style={styles.compactCol}><TText style={styles.compactLabel}>HSN</TText><TView style={styles.compactValueBox}><TText style={styles.compactValueText}>{item.hsn || '-'}</TText></TView></TView>
             </TView>
             
             <TView style={[styles.compactRow, { marginTop: 12 }]}>
                <TView style={{ flex: 1 }}><TText style={styles.compactLabel}>QTY (BOX)</TText><TextInput value={item.qty} onChangeText={v => updateItem(item.id, 'qty', v)} keyboardType="numeric" style={[styles.compactInput, { borderColor: COLORS.primary, color: isDark ? '#fff' : '#000' }]} /></TView>
                <TView style={{ flex: 1.4 }}><TText style={styles.compactLabel}>ITEM TOTAL</TText><TView style={[styles.compactValueBox, { backgroundColor: COLORS.primary + '10', borderColor: COLORS.primary + '20' }]}><TText style={[styles.compactValueText, { color: COLORS.primary, fontWeight: '900', fontSize: 13 }]}>₹{((parseFloat(item.qty)||0)*(parseFloat(item.price)||0)).toLocaleString('en-IN')}</TText></TView></TView>
             </TView>
          </MotiView>
        ))}

        <TView style={[styles.adjustmentCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.card, borderWidth: 1, borderColor: colors.border }]}><TView style={{ flexDirection: 'row', alignItems: 'center' }}><Calculator size={18} color={COLORS.primary} /><TText style={{ marginLeft: 10, fontWeight: '700' }}>Rounding / Adjustment</TText></TView><TextInput value={adjustment} onChangeText={setAdjustment} keyboardType="numeric" style={[styles.adjustInput, { color: colors.text, backgroundColor: 'rgba(129, 140, 248, 0.05)', borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.1)' }]} /></TView>
        <TView style={[styles.adjustmentCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.card, borderWidth: 1, borderColor: colors.border, marginTop: 10 }]}><TView style={{ flexDirection: 'row', alignItems: 'center' }}><Percent size={18} color={COLORS.primary} /><TText style={{ marginLeft: 10, fontWeight: '700' }}>Discount (%)</TText></TView><TextInput value={discount} onChangeText={setDiscount} keyboardType="numeric" style={[styles.adjustInput, { color: COLORS.danger, backgroundColor: 'rgba(239, 68, 68, 0.05)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.1)' }]} /></TView>
        <View style={{ height: 160 }} />
      </ScrollView>

      <AnimatePresence><MotiView from={{ translateY: 100 }} animate={{ translateY: 0 }} style={[styles.premiumFooter, { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.12)' : 'rgba(255, 255, 255, 0.98)', borderTopColor: COLORS.primary + '20', borderTopWidth: 2 }]}><TView style={styles.footerContent}><TView style={styles.totalBlock}><TText style={styles.totalLabel}>PAYABLE ({billGST}%)</TText><TText style={[styles.totalValueMain, { color: COLORS.primary }]}>₹{calculateTotal().toLocaleString('en-IN')}</TText><TText variant="caption" style={{ fontSize: 9, opacity: 0.6 }}>Incl. {billGST}% GST</TText></TView><TView style={styles.actionRow}><TouchableOpacity onPress={() => setPreviewModalVisible(true)} style={[styles.premiumPreviewBtn, { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.1)' : '#F1F5F9' }]}><Eye size={22} color={COLORS.primary} /></TouchableOpacity><TouchableOpacity onPress={handleSave} disabled={loading}><LinearGradient colors={[COLORS.primary, '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.completeBtnGradient}>{loading ? (<ActivityIndicator color="#fff" size="small" />) : (<TText style={styles.completeBtnText}>FINISH BILL</TText>)}</LinearGradient></TouchableOpacity></TView></TView></MotiView></AnimatePresence>

      <Modal visible={productModalVisible} animationType="slide"><TView style={{ flex: 1, backgroundColor: colors.background }}><TView style={[styles.modalHeader, { borderBottomColor: colors.border }]}><TText style={{ fontWeight: '800', fontSize: 18 }}>Select Product</TText><TouchableOpacity onPress={() => setProductModalVisible(false)}><X size={24} color={colors.text} /></TouchableOpacity></TView><TView style={{ padding: 20 }}><TView style={[styles.searchBar, { backgroundColor: colors.surfaceSecondary }]}><Search size={18} color={colors.textSecondary} /><TextInput placeholder="Search..." value={searchQuery} onChangeText={setSearchQuery} style={{ flex: 1, marginLeft: 10, color: colors.text }} /></TView></TView><FlatList data={products.filter(p => p.productname.toLowerCase().includes(searchQuery.toLowerCase()))} renderItem={({ item }) => (<TouchableOpacity onPress={() => { if (activeItemIndex !== null) updateItem(items[activeItemIndex].id, 'productid', item.productid); setProductModalVisible(false); }} style={[styles.modalListItem, { borderBottomColor: colors.border }]}><TText style={{ fontWeight: '700' }}>{item.productname}</TText><TText variant="caption">₹{item.sellingprice} | HSN: {item.hsn || '-'}</TText></TouchableOpacity>)} /></TView></Modal>
      <Modal visible={previewModalVisible} animationType="slide"><SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><TView style={[styles.modalHeader, { borderBottomColor: colors.border }]}><TText style={{ fontWeight: '900', color: colors.text }}>INVOICE PREVIEW</TText><TouchableOpacity onPress={() => setPreviewModalVisible(false)}><X size={24} color={colors.text} /></TouchableOpacity></TView><ScrollView><ScrollView horizontal showsHorizontalScrollIndicator={false}><TView style={[styles.previewPaper, { backgroundColor: '#fff', margin: 20, borderRadius: 10, ...SHADOWS.lg }]}><Design1 data={{ business: businessProfile || {}, client: selectedClient || { clientname: 'Guest Client' }, billNo: billNo, billDate: billDate, items: items.map(it => ({ name: it.name || 'Untitled Item', hsn: it.hsn || '0000', box: it.qty, pieces: it.pieces, price: it.price, cgst: (parseFloat(it.qty) * parseFloat(it.price) * (parseFloat(billGST)/200)).toFixed(2), sgst: (parseFloat(it.qty) * parseFloat(it.price) * (parseFloat(billGST)/200)).toFixed(2), rate: (parseFloat(it.price) * (1 + (parseFloat(billGST) / 100))).toFixed(2), amount: (parseFloat(it.qty) * parseFloat(it.price) * (1 + (parseFloat(billGST) / 100))).toFixed(2) })), summary: { totalQty: items.reduce((acc, it) => acc + (parseInt(it.qty) || 0), 0).toString(), beforeTax: calculateSubtotal().toFixed(2), totalAmount: calculateTotal().toFixed(2), afterTax: calculateTotal().toFixed(2) }, docType: docType }} /></TView></ScrollView><TView style={{ padding: 20 }}><Button title="CLOSE PREVIEW" onPress={() => setPreviewModalVisible(false)} style={{ backgroundColor: COLORS.primary }} /></TView><View style={{ height: 100 }} /></ScrollView></SafeAreaView></Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, paddingTop: Platform.OS === 'ios' ? 10 : 0 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerSection: { margin: 20, padding: 14, borderRadius: RADIUS.lg, borderWidth: 1.2, gap: 10 },
  compactClientPicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(129, 140, 248, 0.05)', padding: 12, borderRadius: RADIUS.md, opacity: 0.8 },
  pickerIconSmall: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(129, 140, 248, 0.1)', justifyContent: 'center', alignItems: 'center' },
  expandHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)', padding: 12, borderRadius: RADIUS.md },
  expandedMetaRow: { flexDirection: 'row', gap: 10, marginTop: 4, paddingBottom: 6 },
  miniMetaDisabled: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)', paddingHorizontal: 10, height: 36, borderRadius: RADIUS.sm, opacity: 0.6 },
  miniValueText: { marginLeft: 6, fontSize: 11, fontWeight: '800' },
  miniMetaFull: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)', paddingHorizontal: 10, height: 36, borderRadius: RADIUS.sm },
  miniInput: { flex: 1, marginLeft: 6, fontSize: 12, fontWeight: '700' },
  gstChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, marginRight: 8, backgroundColor: 'rgba(0,0,0,0.05)' },
  gstChipText: { fontSize: 10, fontWeight: '800', color: COLORS.primary },
  scrollContent: { paddingBottom: 100 },
  typeSwitcher: { flexDirection: 'row', padding: 4, borderRadius: 12, marginHorizontal: 20, marginBottom: 10 },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  typeLabel: { fontSize: 11, fontWeight: '800', color: COLORS.primary + '60' },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginBottom: 15, marginTop: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: COLORS.primary, letterSpacing: 1 },
  addMiniBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  itemCard: { marginHorizontal: 16, padding: 14, borderRadius: RADIUS.xl, marginBottom: 12 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  itemNum: { width: 22, height: 22, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  itemNumText: { fontSize: 10, fontWeight: '900' },
  productLink: { flex: 1, marginHorizontal: 10, borderBottomWidth: 1.5, borderBottomColor: COLORS.primary + '15', paddingBottom: 4 },
  productNameText: { fontWeight: '800', fontSize: 14 },
  compactRow: { flexDirection: 'row', gap: 8 },
  compactCol: { flex: 1, alignItems: 'center' },
  compactLabel: { fontSize: 7, fontWeight: '900', marginBottom: 6, color: COLORS.primary, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.5 },
  compactInput: { width: '100%', height: 40, borderRadius: 8, textAlign: 'center', fontWeight: '900', fontSize: 16, borderWidth: 1.5, backgroundColor: 'rgba(129,140,248,0.05)' },
  compactValueBox: { width: '100%', height: 38, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.04)', justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' },
  compactValueText: { fontSize: 11, fontWeight: '800', opacity: 0.9, textAlign: 'center' },
  adjustmentCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, padding: 15, borderRadius: RADIUS.lg },
  adjustInput: { width: 80, height: 36, borderRadius: 8, textAlign: 'right', paddingHorizontal: 10, fontWeight: '800' },
  premiumFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20, borderTopWidth: 2, borderTopColor: COLORS.primary + '30', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 25 },
  footerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalBlock: { flex: 1 },
  totalLabel: { fontSize: 11, fontWeight: '900', color: COLORS.primary, opacity: 0.8, letterSpacing: 1, marginBottom: 4 },
  totalValueMain: { fontSize: 28, fontWeight: '900', color: COLORS.primary },
  actionRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  premiumPreviewBtn: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.2)' },
  completeBtnGradient: { height: 56, borderRadius: 20, paddingHorizontal: 28, justifyContent: 'center', alignItems: 'center', ...SHADOWS.md },
  completeBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  previewPaper: { width: 850, alignSelf: 'center' },
  modalHeader: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 10, paddingHorizontal: 15 },
  modalListItem: { padding: 20, borderBottomWidth: 1 },
});

export default MobileBilling;
