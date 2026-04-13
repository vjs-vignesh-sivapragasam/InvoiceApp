import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, View, Modal } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { WebLayout } from './WebLayout';
import { Button } from '../../../components/Button';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../../theme';
import { db } from '../../../services/supabase';
import { Design1 } from '../../../components/templates/Design1';
import { 
  Plus, Trash2, Eye, ShoppingBag, User as UserIcon, X, Download, Printer, Hash, Calendar, Percent, ChevronDown, ShieldCheck, ArrowRight, Info
} from 'lucide-react-native';
import { useNotifications } from '../../../components/NotificationProvider';
import { useAppConfig } from '../../../components/AppConfigProvider';
import { LinearGradient } from 'expo-linear-gradient';

interface Client { clientid: number; clientname: string; gstin?: string; addressline1?: string; landmark?: string; mobile?: string; }
interface Product { productid: number; productname: string; sellingprice: number; hsn?: string; incase?: number; }
interface Item { 
  id: number; productid: number | null; name: string; qty: string; 
  price: string; hsn: string; incase: string; pieces: string;
}

export const Billing = () => {
  const { colors, isDark } = useTheme();
  const { config } = useAppConfig();
  const { showToast } = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [billNo, setBillNo] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  const [isItemsExpanded, setIsItemsExpanded] = useState(true);
  
  const [clientSearch, setClientSearch] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  
  const [docType, setDocType] = useState<'invoice' | 'quotation'>('invoice');
  const [gstEnabled, setGstEnabled] = useState(true);
  const [billGST, setBillGST] = useState('12');
  
  const [items, setItems] = useState<Item[]>([{ id: Date.now(), productid: null, name: '', qty: '1', price: '0', hsn: '', incase: '1', pieces: '1' }]);
  const [adjustment, setAdjustment] = useState('0');

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
    } catch { } finally { setLoading(false); }
  };

  const addItem = () => { setItems([...items, { id: Date.now(), productid: null, name: '', qty: '1', price: '0', hsn: '', incase: '1', pieces: '1' }]); setIsItemsExpanded(true); };
  const removeItem = (id: number) => items.length > 1 && setItems(items.filter(i => i.id !== id));

  const updateItem = (id: number, field: string, value: any) => {
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
    const gstRate = gstEnabled ? parseFloat(billGST) : 0;
    return (sub * (1 + gstRate/100)) + (parseFloat(adjustment) || 0);
  };

  if (loading) return <WebLayout><ActivityIndicator size="large" color={COLORS.primary} /></WebLayout>;

  return (
    <WebLayout>
      <View style={styles.header}>
        <View><TText variant="title">Billing Terminal (Web)</TText><TText variant="caption">Unified document and series management</TText></View>
        <View style={{ flexDirection: 'row', gap: 16 }}>
           <TView style={[styles.typeSwitcher, { backgroundColor: colors.card }]}>
              <TouchableOpacity onPress={() => setDocType('invoice')} style={[styles.typeSlot, docType === 'invoice' && styles.activeSlot]}><TText style={[styles.slotLabel, docType === 'invoice' && { color: COLORS.primary }]}>INVOICE</TText></TouchableOpacity>
              <TouchableOpacity onPress={() => setDocType('quotation')} style={[styles.typeSlot, docType === 'quotation' && styles.activeSlot]}><TText style={[styles.slotLabel, docType === 'quotation' && { color: COLORS.primary }]}>QUOTATION</TText></TouchableOpacity>
           </TView>
           <TView style={[styles.switchCard, { backgroundColor: colors.card }]}><TText style={{ fontWeight: '800', fontSize: 13, marginRight: 15 }}>GST Mode</TText><TouchableOpacity onPress={() => setGstEnabled(!gstEnabled)} style={[styles.webToggle, { backgroundColor: gstEnabled ? COLORS.primary : 'rgba(0,0,0,0.1)' }]}><View style={[styles.webToggleKnob, { marginLeft: gstEnabled ? 20 : 0 }]} /></TouchableOpacity></TView>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <View style={styles.formPanel}>
          <TouchableOpacity onPress={() => setIsHeaderExpanded(!isHeaderExpanded)} style={[styles.collapsibleTrigger, { backgroundColor: colors.card, ...SHADOWS.sm }]}>
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}><UserIcon size={20} color={COLORS.primary} /><TText style={{ fontWeight: '800', fontSize: 16 }}>{selectedClient ? selectedClient.clientname : 'Click to select Client'}</TText>{!isHeaderExpanded && <TText style={{ opacity: 0.5, fontSize: 13 }}>• Bill: {billNo} • Date: {billDate} • Logic: {gstEnabled ? billGST+'%' : 'No GST'}</TText>}</View>
             <ChevronDown size={20} color={colors.textSecondary} style={{ transform: [{ rotate: isHeaderExpanded ? '180deg' : '0deg' }] }} />
          </TouchableOpacity>

          <AnimatePresence>
            {isHeaderExpanded && (
              <MotiView from={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'timing', duration: 200 }} style={{ overflow: 'hidden' }}>
                 <TView style={[styles.cardLayout, { backgroundColor: colors.card }]}>
                    <View style={{ flexDirection: 'row', gap: 20 }}>
                       <View style={{ flex: 1.5 }}><TText variant="caption" style={{ marginBottom: 10 }}>Client Selector</TText><View style={{ position: 'relative' }}><TouchableOpacity onPress={() => setIsClientDropdownOpen(!isClientDropdownOpen)} style={[styles.webPicker, { backgroundColor: colors.surfaceSecondary }]}><TText style={{ fontWeight: '700' }}>{selectedClient ? selectedClient.clientname : 'Search Client...'}</TText><ChevronDown size={18} color={colors.textSecondary} /></TouchableOpacity>{isClientDropdownOpen && (<View style={[styles.webDropdown, { backgroundColor: colors.card, borderColor: colors.border, ...SHADOWS.lg }]}><TextInput placeholder="Filter..." value={clientSearch} onChangeText={setClientSearch} style={[styles.dropdownSearch, { backgroundColor: colors.surfaceSecondary }]} /><ScrollView style={{ maxHeight: 250 }}>{clients.filter(c => c.clientname.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (<TouchableOpacity key={c.clientid} onPress={() => { setSelectedClient(c); setIsClientDropdownOpen(false); }} style={styles.dropdownOption}><TText style={{ fontWeight: '700' }}>{c.clientname}</TText></TouchableOpacity>))}</ScrollView></View>)}</View></View>
                       <View style={{ flex: 1 }}><TText variant="caption" style={{ marginBottom: 10 }}>Bill No</TText><TView style={[styles.webPicker, { backgroundColor: colors.surfaceSecondary, opacity: 0.6 }]}><TText style={{ fontWeight: '700' }}>{billNo}</TText></TView></View>
                       <View style={{ flex: 1 }}><TText variant="caption" style={{ marginBottom: 10 }}>Date</TText><TView style={[styles.webPicker, { backgroundColor: colors.surfaceSecondary }]}><TText style={{ fontWeight: '700' }}>{billDate}</TText></TView></View>
                       <View style={{ flex: 1 }}>
                          <TText variant="caption" style={{ marginBottom: 10 }}>GST Rate</TText>
                          <View style={{ flexDirection: 'row', gap: 5 }}>{gstOptions.map(opt => (<TouchableOpacity key={opt} disabled={!gstEnabled} onPress={() => setBillGST(opt)} style={[styles.webGstChip, billGST === opt && gstEnabled && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }, !gstEnabled && { opacity: 0.3 }]}><TText style={{ fontSize: 11, fontWeight: '800', color: billGST === opt && gstEnabled ? '#fff' : colors.textSecondary }}>{opt}%</TText></TouchableOpacity>))}</View>
                       </View>
                    </View>
                 </TView>
              </MotiView>
            )}
          </AnimatePresence>

          <View style={{ marginTop: 20 }}>
             <TouchableOpacity onPress={() => setIsItemsExpanded(!isItemsExpanded)} style={[styles.gridTitleBar, { borderBottomColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><ShoppingBag size={20} color={COLORS.primary} /><TText style={{ fontWeight: '900', fontSize: 14 }}>BILLING PARTICULARS ({items.length})</TText></View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}><TouchableOpacity onPress={addItem} style={styles.webAddBtn}><Plus size={18} color="#fff" /></TouchableOpacity><ChevronDown size={20} color={colors.textSecondary} style={{ transform: [{ rotate: isItemsExpanded ? '180deg' : '0deg' }] }} /></View>
             </TouchableOpacity>

             <AnimatePresence>
                {isItemsExpanded && (
                   <MotiView from={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'timing', duration: 200 }} style={{ overflow: 'hidden' }}>
                      <View style={{ paddingTop: 15 }}>
                         <View style={styles.webTableHead}><TText style={[styles.headCell, { flex: 3, textAlign: 'left' }]}>Item Description</TText><TText style={styles.headCell}>Qty</TText><TText style={styles.headCell}>Inc</TText><TText style={styles.headCell}>Pcs</TText><TText style={styles.headCell}>Rate</TText><TText style={styles.headCell}>HSN</TText><TText style={[styles.headCell, { flex: 1.2 }]}>Total</TText><TText style={{ width: 40 }}></TText></View>
                         {items.map(it => (
                            <View key={it.id} style={[styles.webTableRow, { borderBottomColor: colors.border }]}>
                               <View style={{ flex: 3 }}><TouchableOpacity style={[styles.webProductSelect, { backgroundColor: colors.surfaceSecondary }]}><TText style={{ fontWeight: '700' }}>{it.name || 'Select Product...'}</TText></TouchableOpacity></View>
                               <View style={{ flex: 1 }}><TextInput value={it.qty} onChangeText={v => updateItem(it.id, 'qty', v)} style={[styles.webInput, { borderColor: COLORS.primary + '30', color: colors.text }]} /></View>
                               <View style={styles.webValCell}><TText style={styles.webValText}>{it.incase}</TText></View>
                               <View style={styles.webValCell}><TText style={styles.webValText}>{it.pieces}</TText></View>
                               <View style={styles.webValCell}><TText style={styles.webValText}>₹{it.price}</TText></View>
                               <View style={styles.webValCell}><TText style={styles.webValText}>{it.hsn || '-'}</TText></View>
                               <View style={[styles.webValCell, { flex: 1.2, backgroundColor: COLORS.primary + '05' }]}><TText style={{ fontWeight: '900', color: COLORS.primary }}>₹{(parseFloat(it.qty)*parseFloat(it.price)).toLocaleString()}</TText></View>
                               <TouchableOpacity onPress={() => removeItem(it.id)} style={{ padding: 10 }}><Trash2 size={18} color={COLORS.danger} /></TouchableOpacity>
                            </View>
                         ))}
                      </View>
                   </MotiView>
                )}
             </AnimatePresence>
          </View>
        </View>

        <TView style={[styles.webPreview, { backgroundColor: colors.card }]}>
           <TView style={styles.payableHeaer}><TText style={{ fontWeight: '900', fontSize: 11, opacity: 0.6 }}>NET PAYABLE</TText><TText style={{ fontSize: 36, fontWeight: '900', color: COLORS.primary }}>₹{calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</TText></TView>
           <View style={{ padding: 24, gap: 15 }}>
              <View style={styles.feeRow}><TText style={{ opacity: 0.6 }}>Subtotal</TText><TText style={{ fontWeight: '700' }}>₹{calculateSubtotal().toLocaleString()}</TText></View>
              <View style={styles.feeRow}><TText style={{ opacity: 0.6 }}>Tax Logic ({gstEnabled ? billGST : 0}%)</TText><TText style={{ fontWeight: '700' }}>₹{(calculateTotal() - calculateSubtotal()).toLocaleString()}</TText></View>
              <View style={{ height: 1.5, backgroundColor: colors.border, marginVertical: 10 }} />
              <TouchableOpacity style={styles.webFinishBtn}><LinearGradient colors={['#6366f1', '#4F46E5']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.webFinishGrad}><TText style={{ color: '#fff', fontWeight: '900' }}>FINISH & GENERATE</TText><ArrowRight size={20} color="#fff" /></LinearGradient></TouchableOpacity>
              <TouchableOpacity onPress={() => setShowPreview(true)} style={styles.webPreviewBtn}><Eye size={20} color={COLORS.primary} /><TText style={{ color: COLORS.primary, fontWeight: '800' }}>Quick Preview</TText></TouchableOpacity>
           </View>
        </TView>
      </View>

      <Modal visible={showPreview} transparent><View style={styles.modalOverlay}><MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={styles.webPreviewModal}><View style={styles.previewHead}><TText variant="subtitle">Invoice Preview</TText><TouchableOpacity onPress={() => setShowPreview(false)}><X size={24} color={colors.text} /></TouchableOpacity></View><ScrollView contentContainerStyle={{ padding: 40, alignItems: 'center' }}><View style={{ width: 850, backgroundColor: '#fff', ...SHADOWS.lg }}><Design1 data={{ business: { name: 'MK AGENCY', address: '6, 1st cross, Puducherry', mobile: '+91 9791858965', gstin: '34CEBPG0848B1Z5' }, client: selectedClient || { name: '---' }, billNo: billNo || 'DRAFT', billDateId: billDate, withGST: gstEnabled, items: items.map(it => ({ name: it.name || '---', hsn: it.hsn || '-', box: it.qty || '0', pieces: it.pieces, price: it.price, cgst: '0', sgst: '0', rate: it.price, amount: (parseFloat(it.qty)*parseFloat(it.price)).toFixed(2) })), summary: { totalQty: items.length.toString(), totalAmount: calculateTotal().toFixed(2), beforeTax: calculateSubtotal().toFixed(2), afterTax: calculateTotal().toFixed(2) }, docType: docType }} /></View></ScrollView></MotiView></View></Modal>
    </WebLayout>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  typeSwitcher: { flexDirection: 'row', padding: 4, borderRadius: 12, ...SHADOWS.sm },
  typeSlot: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  activeSlot: { backgroundColor: 'rgba(0,0,0,0.02)' },
  slotLabel: { fontSize: 11, fontWeight: '900', color: COLORS.primary + '50' },
  switchCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, ...SHADOWS.sm },
  webToggle: { width: 44, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
  webToggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  mainContainer: { flexDirection: 'row', gap: 24, flex: 1 },
  formPanel: { flex: 1.5 },
  collapsibleTrigger: { height: 64, borderRadius: 16, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLayout: { padding: 24, borderRadius: 16, borderTopWidth: 1.5, borderTopColor: COLORS.primary + '15', marginTop: 12 },
  webPicker: { height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  webGstChip: { width: 44, height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  gridTitleBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 2 },
  webAddBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.md },
  webTableHead: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 10, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 8, marginBottom: 10 },
  headCell: { flex: 1, fontSize: 11, fontWeight: '900', color: COLORS.primary, textAlign: 'center' },
  webTableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  webProductSelect: { flex: 1, marginHorizontal: 10, height: 48, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 10 },
  webInput: { flex: 1, height: 48, borderRadius: 10, borderWidth: 1.5, textAlign: 'center', fontWeight: '800' },
  webValCell: { flex: 1, height: 48, justifyContent: 'center', alignItems: 'center' },
  webValText: { fontSize: 14, fontWeight: '700', opacity: 0.6 },
  webPreview: { width: 420, borderRadius: 24, overflow: 'hidden', alignSelf: 'flex-start', ...SHADOWS.lg },
  payableHeaer: { padding: 32, backgroundColor: COLORS.primary + '05', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.primary + '08' },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  webFinishBtn: { height: 64, borderRadius: 18, overflow: 'hidden' },
  webFinishGrad: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15 },
  webPreviewBtn: { height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.primary + '20', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  webPreviewModal: { width: '90%', height: '90%', borderRadius: 24, overflow: 'hidden' },
  previewHead: { height: 80, paddingHorizontal: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#eee' },
  webDropdown: { position: 'absolute', top: 55, left: 0, right: 0, zIndex: 100, borderRadius: 16, padding: 10, borderWidth: 1 },
  dropdownSearch: { height: 44, borderRadius: 10, paddingHorizontal: 12, marginBottom: 10 },
  dropdownOption: { padding: 12, borderRadius: 8 },
});

export default Billing;
