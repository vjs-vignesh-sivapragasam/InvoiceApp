import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView, ActivityIndicator, View, Modal, FlatList, SafeAreaView } from 'react-native';
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
  Search, X, Hash, ShoppingBag, CreditCard, Eye
} from 'lucide-react-native';
import { Design1 } from '../../../components/templates/Design1';

interface Client { clientid: number; clientname: string; gstin?: string; addressline1?: string; mobile?: string; }
interface Product { productid: number; productname: string; sellingprice: number; hsn?: string; incase?: number; }
interface Item { id: string; productid: number | null; name: string; qty: string; price: string; gst: string; hsn: string; }

const DummyBilling = () => {
  const { colors, isDark } = useTheme();
  const { config } = useAppConfig();
  const { showToast } = useNotifications();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<Item[]>([{ id: '1', productid: null, name: '', qty: '1', price: '0', gst: '9', hsn: '' }]);
  const [adjustment, setAdjustment] = useState('0');
  const [billNo, setBillNo] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [docType, setDocType] = useState<'invoice'>('invoice');
  
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();
    const generatedNo = `${config.billSeriesText}${config.billSeriesDelimiter}${config.billSeriesNumber}${config.billSeriesDelimiter}${config.billSeriesCount}`;
    setBillNo(generatedNo);
  }, []);

  const fetchInitialData = async () => {
    try {
      const [c, p] = await Promise.all([db.clients.getAll(), db.products.getAll()]);
      setClients(c);
      setProducts(p);
      
      try {
        const savedProfile = await AsyncStorage.getItem('business_profile');
        if (savedProfile) {
          setBusinessProfile(JSON.parse(savedProfile));
        }
      } catch (storageErr) {
        console.warn('Dummy Billing: Storage cache not available:', storageErr);
      }
    } catch { showToast('Database connection error', 'error'); } 
    finally { setLoading(false); }
  };

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), productid: null, name: '', qty: '1', price: '0', gst: '9', hsn: '' }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(it => {
      if (it.id !== id) return it;
      if (field === 'productid') {
        const p = products.find(x => x.productid === value);
        return { ...it, productid: value, name: p?.productname || '', price: p?.sellingprice?.toString() || '0', hsn: p?.hsn || '' };
      }
      return { ...it, [field]: value };
    }));
  };

  const calculateSubtotal = () => items.reduce((acc, item) => acc + (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0), 0);
  const calculateTax = () => {
    return items.reduce((acc, item) => {
      const sub = (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0);
      return acc + (sub * (parseFloat(item.gst) / 100));
    }, 0);
  };
  const calculateTotal = () => calculateSubtotal() + (calculateTax() * 2) + (parseFloat(adjustment) || 0);

  const handleSave = async () => {
    if (!selectedClient) return showToast('Select a client first', 'error');
    setLoading(true);
    try {
      await db.billing.create({
          clientid: selectedClient.clientid,
          billno: billNo,
          totalamount: calculateTotal(),
          taxableamount: calculateSubtotal(),
          isactive: true,
          billdate: billDate
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
        <TText variant="subtitle" style={{ fontWeight: '800' }}>Dummy Bill</TText>
        <TouchableOpacity 
          onPress={() => setPreviewModalVisible(true)} 
          style={styles.headerActionBtn}
        >
          <Eye size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </TView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Client Selector (Redesigned) */}
        <TouchableOpacity 
          onPress={() => { setSearchQuery(''); setClientModalVisible(true); }}
          style={[
            styles.clientPickerCard, 
            { 
              backgroundColor: 'transparent', 
              borderColor: selectedClient ? COLORS.primary : 'rgba(129, 140, 248, 0.4)',
              borderWidth: 1.5,
              borderStyle: selectedClient ? 'solid' : 'dashed'
            }
          ]}
        >
           <TView style={styles.pickerIcon}>
              <UserIcon size={20} color={selectedClient ? COLORS.primary : colors.textSecondary} />
           </TView>
           <TView style={{ flex: 1, marginLeft: 15 }}>
              <TText style={{ fontWeight: '800', fontSize: 16, color: selectedClient ? colors.text : colors.textSecondary }}>
                 {selectedClient ? selectedClient.clientname : 'Tap to select client'}
              </TText>
              {selectedClient && <TText variant="caption">{selectedClient.gstin ? `GST: ${selectedClient.gstin}` : 'No GSTIN registered'}</TText>}
           </TView>
           <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Meta Grid */}
        <TView style={styles.metaGrid}>
           <TView style={[styles.metaItem, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.2)' }]}>
              <TText style={styles.metaLabel}>BILL NO</TText>
              <TextInput value={billNo} onChangeText={setBillNo} style={[styles.metaInput, { color: colors.text }]} />
           </TView>
           <TView style={[styles.metaItem, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.2)' }]}>
              <TText style={styles.metaLabel}>DATE</TText>
              <TextInput value={billDate} onChangeText={setBillDate} style={[styles.metaInput, { color: colors.text }]} />
           </TView>
        </TView>

        <TView style={styles.sectionTitleRow}>
           <TText style={styles.sectionTitle}>PARTICULARS ({items.length})</TText>
           <TouchableOpacity onPress={addItem} style={styles.addMiniBtn}><Plus size={14} color="#fff" /></TouchableOpacity>
        </TView>

        {items.map((item, index) => (
          <MotiView key={item.id} from={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={[styles.itemCard, { backgroundColor: 'transparent', borderWidth: 1.2, borderColor: 'rgba(129, 140, 248, 0.3)' }]}>
             <TView style={styles.itemHeader}>
                <TView style={styles.itemNum}><TText style={styles.itemNumText}>{index + 1}</TText></TView>
                <TouchableOpacity 
                   onPress={() => { setSearchQuery(''); setActiveItemIndex(index); setProductModalVisible(true); }}
                   style={styles.productLink}
                >
                   <TText style={[styles.productNameText, !item.name && { color: colors.textSecondary }]}>
                      {item.name || 'Select Product...'}
                   </TText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeItem(item.id)}><Trash2 size={18} color={COLORS.danger} /></TouchableOpacity>
             </TView>

             <TView style={styles.itemValues}>
                <TView style={styles.valCol}>
                   <TText style={styles.valLabel}>QTY</TText>
                   <TextInput value={item.qty} onChangeText={v => updateItem(item.id, 'qty', v)} keyboardType="numeric" style={[styles.valInput, { color: colors.text, backgroundColor: 'rgba(129, 140, 248, 0.05)', borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.1)' }]} />
                </TView>
                <TView style={[styles.valCol, { flex: 1.5 }]}>
                   <TText style={styles.valLabel}>PRICE</TText>
                   <TextInput value={item.price} onChangeText={v => updateItem(item.id, 'price', v)} keyboardType="numeric" style={[styles.valInput, { color: colors.text, backgroundColor: 'rgba(129, 140, 248, 0.05)', borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.1)' }]} />
                </TView>
                <TView style={styles.valCol}>
                    <TText style={styles.valLabel}>GST%</TText>
                    <TextInput value={item.gst} onChangeText={v => updateItem(item.id, 'gst', v)} keyboardType="numeric" style={[styles.valInput, { color: colors.text, backgroundColor: 'rgba(129, 140, 248, 0.05)', borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.1)' }]} />
                </TView>
             </TView>
          </MotiView>
        ))}

        <TView style={[styles.adjustmentCard, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.2)' }]}>
           <TView style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Calculator size={18} color={COLORS.primary} />
              <TText style={{ marginLeft: 10, fontWeight: '700' }}>Rounding / Adjustment</TText>
           </TView>
           <TextInput value={adjustment} onChangeText={setAdjustment} keyboardType="numeric" style={[styles.adjustInput, { color: colors.text, backgroundColor: 'rgba(129, 140, 248, 0.05)', borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.1)' }]} />
        </TView>
        
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Footer */}
      <TView style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
         <TView style={styles.totals}>
            <TView>
               <TText style={{ fontSize: 10, fontWeight: '800', color: colors.textSecondary }}>GRAND TOTAL</TText>
               <TText style={styles.totalValue}>₹{calculateTotal().toLocaleString('en-IN')}</TText>
            </TView>
            <Button title="COMPLETE BILL" onPress={handleSave} loading={loading} style={{ width: 160, height: 50, borderRadius: 15 }} />
         </TView>
      </TView>

      {/* Product/Client Modals (re-styled) */}
      <Modal visible={clientModalVisible} animationType="slide">
         <TView style={{ flex: 1, backgroundColor: colors.background }}>
            <TView style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
               <TText style={{ fontWeight: '800', fontSize: 18 }}>Select Client</TText>
               <TouchableOpacity onPress={() => setClientModalVisible(false)}><X size={24} color={colors.text} /></TouchableOpacity>
            </TView>
            <TView style={{ padding: 20 }}>
               <TView style={[styles.searchBar, { backgroundColor: colors.surfaceSecondary }]}>
                  <Search size={18} color={colors.textSecondary} />
                  <TextInput placeholder="Search..." value={searchQuery} onChangeText={setSearchQuery} style={{ flex: 1, marginLeft: 10, color: colors.text }} />
               </TView>
            </TView>
            <FlatList 
               data={clients.filter(c => c.clientname.toLowerCase().includes(searchQuery.toLowerCase()))}
               renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => { setSelectedClient(item); setClientModalVisible(false); }} style={[styles.modalListItem, { borderBottomColor: colors.border }]}>
                     <TText style={{ fontWeight: '700' }}>{item.clientname}</TText>
                     <TText variant="caption">{item.mobile || 'No contact'}</TText>
                  </TouchableOpacity>
               )}
            />
         </TView>
      </Modal>

      <Modal visible={productModalVisible} animationType="slide">
         <TView style={{ flex: 1, backgroundColor: colors.background }}>
            <TView style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
               <TText style={{ fontWeight: '800', fontSize: 18 }}>Select Product</TText>
               <TouchableOpacity onPress={() => setProductModalVisible(false)}><X size={24} color={colors.text} /></TouchableOpacity>
            </TView>
            <TView style={{ padding: 20 }}>
               <TView style={[styles.searchBar, { backgroundColor: colors.surfaceSecondary }]}>
                  <Search size={18} color={colors.textSecondary} />
                  <TextInput placeholder="Search..." value={searchQuery} onChangeText={setSearchQuery} style={{ flex: 1, marginLeft: 10, color: colors.text }} />
               </TView>
            </TView>
            <FlatList 
               data={products.filter(p => p.productname.toLowerCase().includes(searchQuery.toLowerCase()))}
               renderItem={({ item }) => (
                  <TouchableOpacity 
                     onPress={() => { if (activeItemIndex !== null) updateItem(items[activeItemIndex].id, 'productid', item.productid); setProductModalVisible(false); }} 
                     style={[styles.modalListItem, { borderBottomColor: colors.border }]}
                  >
                     <TText style={{ fontWeight: '700' }}>{item.productname}</TText>
                     <TText variant="caption">₹{item.sellingprice} | HSN: {item.hsn || '-'}</TText>
                  </TouchableOpacity>
               )}
            />
         </TView>
      </Modal>

      <Modal visible={previewModalVisible} animationType="slide">
         <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <TView style={[styles.modalHeader, { borderBottomColor: '#eee' }]}>
               <TText style={{ fontWeight: '900', color: '#000' }}>INVOICE PREVIEW</TText>
               <TouchableOpacity onPress={() => setPreviewModalVisible(false)}><X size={24} color="#000" /></TouchableOpacity>
            </TView>
            <ScrollView>
               <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TView style={{ width: 850 }}>
                     <Design1 
                       data={{
                          business: businessProfile || {},
                          client: selectedClient || { clientname: 'Guest Client' },
                          billNo: billNo,
                          billDate: billDate,
                          items: items.map(it => ({
                            name: it.name || 'Untitled Item',
                            hsn: it.hsn || '0000',
                            box: '1',
                            pieces: it.qty,
                            price: it.price,
                            cgst: (parseFloat(it.qty) * parseFloat(it.price) * (parseFloat(it.gst)/100)).toFixed(2),
                            sgst: (parseFloat(it.qty) * parseFloat(it.price) * (parseFloat(it.gst)/100)).toFixed(2),
                            rate: (parseFloat(it.price) * (1 + (parseFloat(it.gst) * 2 / 100))).toFixed(2),
                            amount: (parseFloat(it.qty) * parseFloat(it.price) * (1 + (parseFloat(it.gst) * 2 / 100))).toFixed(2)
                          })),
                          summary: {
                            totalQty: items.reduce((acc, it) => acc + (parseInt(it.qty) || 0), 0).toString(),
                            beforeTax: calculateSubtotal().toFixed(2),
                            totalAmount: calculateTotal().toFixed(2),
                            afterTax: calculateTotal().toFixed(2)
                          },
                          docType: docType
                       }} 
                     />
                  </TView>
               </ScrollView>
               <TView style={{ padding: 20 }}>
                  <Button 
                    title="CLOSE PREVIEW" 
                    onPress={() => setPreviewModalVisible(false)} 
                    style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : '#333' }}
                  />
               </TView>
               <View style={{ height: 100 }} />
            </ScrollView>
         </SafeAreaView>
      </Modal>

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, paddingTop: Platform.OS === 'ios' ? 10 : 0 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerActionBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  typeSwitcher: { flexDirection: 'row', padding: 4, borderRadius: 12, marginBottom: 20 },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  typeLabel: { fontSize: 11, fontWeight: '800', color: COLORS.primary + '60' },
  clientPickerCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: RADIUS.xl, borderWidth: 1.5, marginBottom: 20 },
  pickerIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  metaGrid: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  metaItem: { flex: 1, padding: 15, borderRadius: RADIUS.lg },
  metaLabel: { fontSize: 9, fontWeight: '900', color: COLORS.primary, letterSpacing: 1 },
  metaInput: { marginTop: 4, fontSize: 15, fontWeight: '800' },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: COLORS.primary, letterSpacing: 1 },
  addMiniBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  itemCard: { padding: 15, borderRadius: RADIUS.xl, marginBottom: 15 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  itemNum: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  itemNumText: { fontSize: 10, fontWeight: '800' },
  productLink: { flex: 1, marginHorizontal: 12, borderBottomWidth: 1, borderBottomColor: COLORS.primary + '20', paddingBottom: 4 },
  productNameText: { fontWeight: '700', fontSize: 15 },
  itemValues: { flexDirection: 'row', gap: 12 },
  valCol: { flex: 1 },
  valLabel: { fontSize: 8, fontWeight: '800', marginBottom: 4, marginLeft: 4 },
  valInput: { height: 40, borderRadius: 8, textAlign: 'center', fontWeight: '800' },
  adjustmentCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: RADIUS.lg, marginTop: 10 },
  adjustInput: { width: 100, height: 36, borderRadius: 8, textAlign: 'right', paddingHorizontal: 10, fontWeight: '800' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20, borderTopWidth: 1 },
  totals: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalValue: { fontSize: 24, fontWeight: '900', color: COLORS.primary },
  modalHeader: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 10, paddingHorizontal: 15 },
  modalListItem: { padding: 20, borderBottomWidth: 1 },
});

export default DummyBilling;
