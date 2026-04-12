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
  Plus, Trash2, Eye, ShoppingBag, User as UserIcon, X, Download, Printer, Hash, Calendar, Percent, ChevronDown
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
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  
  const [clientSearch, setClientSearch] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [withGST, setWithGST] = useState(true);
  const [docType, setDocType] = useState<'invoice' | 'quotation'>('invoice');
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

  const addItem = () => setItems([...items, { id: Date.now(), productid: null, name: '', qty: '1', price: '0', hsn: '', incase: '1', pieces: '1' }]);
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
  const calculateTaxAmount = () => (withGST && docType === 'invoice') ? calculateSubtotal() * (parseFloat(billGST) / 100) : 0;
  const calculateGrandTotal = () => calculateSubtotal() + calculateTaxAmount() + (parseFloat(adjustment) || 0);

  const getPreviewData = () => ({
    business: { name: 'MK AGENCY', address: '6, 1st cross, Puducherry', mobile: '+91 9791858965', gstin: '34CEBPG0848B1Z5' },
    client: selectedClient || { name: '---' }, billNo: billNo || 'DRAFT', billDate: billDate.split('-').reverse().join('/'), withGST, docType,
    items: items.map(it => {
      const sub = (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0);
      const tax = (withGST && docType === 'invoice') ? sub * (parseFloat(billGST) / 100) / 2 : 0;
      return { name: it.name || '---', hsn: it.hsn || '-', box: it.qty || '0', pieces: it.pieces, price: it.price, cgst: tax.toFixed(2), sgst: tax.toFixed(2), rate: (parseFloat(it.price) * (1 + parseFloat(billGST)/100)).toFixed(2), amount: (sub * (1 + parseFloat(billGST)/100)).toFixed(2) };
    }),
    summary: { totalQty: items.reduce((a, b) => a + (parseInt(b.qty) || 0), 0), totalAmount: calculateGrandTotal().toFixed(2), beforeTax: calculateSubtotal().toFixed(2), afterTax: calculateGrandTotal().toFixed(2) }
  });

  const handleSave = async () => {
    if (!selectedClient) return showToast('Please select a client', 'error');
    try {
      await db.billing.create({ clientid: selectedClient.clientid, billno: billNo, totalamount: calculateGrandTotal(), taxableamount: calculateSubtotal(), isactive: true, optional2: billGST });
      showToast(`${docType === 'invoice' ? 'Bill' : 'Quotation'} ${billNo} generated successfully!`);
    } catch { showToast('Execution failed', 'error'); }
  };

  if (loading) return <WebLayout><ActivityIndicator size="large" color={COLORS.primary} /></WebLayout>;

  return (
    <WebLayout>
      <View style={styles.header}>
        <View><TText variant="title">Billing Terminal</TText><TText variant="caption">Create official tax invoices or quotations with real-time preview</TText></View>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
           <TView style={[styles.toggleContainer, { backgroundColor: colors.surfaceSecondary, width: 320 }]}>
              <TouchableOpacity onPress={() => { setDocType('invoice'); setWithGST(true); }} style={styles.toggleBtn}>{docType === 'invoice' && withGST && <LinearGradient colors={[COLORS.primary, '#6366f1']} start={{x:0,y:0}} end={{x:1,y:1}} style={[StyleSheet.absoluteFill, { borderRadius: 8 }]} />}<TText style={{ color: docType === 'invoice' && withGST ? '#fff' : colors.textSecondary, fontWeight: '700', fontSize: 10 }}>INV + GST</TText></TouchableOpacity>
              <TouchableOpacity onPress={() => { setDocType('invoice'); setWithGST(false); }} style={styles.toggleBtn}>{docType === 'invoice' && !withGST && <LinearGradient colors={[COLORS.primary, '#6366f1']} start={{x:0,y:0}} end={{x:1,y:1}} style={[StyleSheet.absoluteFill, { borderRadius: 8 }]} />}<TText style={{ color: docType === 'invoice' && !withGST ? '#fff' : colors.textSecondary, fontWeight: '700', fontSize: 10 }}>INV NO GST</TText></TouchableOpacity>
              <TouchableOpacity onPress={() => { setDocType('quotation'); setWithGST(false); }} style={styles.toggleBtn}>{docType === 'quotation' && <LinearGradient colors={[COLORS.primary, '#6366f1']} start={{x:0,y:0}} end={{x:1,y:1}} style={[StyleSheet.absoluteFill, { borderRadius: 8 }]} />}<TText style={{ color: docType === 'quotation' ? '#fff' : colors.textSecondary, fontWeight: '700', fontSize: 10 }}>QUOTATION</TText></TouchableOpacity>
           </TView>
           <Button title="Generate & Save" onPress={handleSave} style={{ width: 170 }} />
        </View>
      </View>

      <View style={styles.mainContainer}>
        <View style={styles.formPanel}>
          <TView style={[styles.card, { backgroundColor: colors.card, ...SHADOWS.sm, zIndex: 10 }]}>
            <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>
              <View style={{ flex: 1.5 }}>
                <View style={styles.sectionHeader}><UserIcon size={14} color={COLORS.primary} /><TText variant="caption">Client Name</TText></View>
                <TView style={[styles.rowInput, { backgroundColor: colors.surfaceSecondary, opacity: 0.6, justifyContent: 'center' }]}><TText style={{ fontWeight: '700' }}>{selectedClient ? selectedClient.clientname : 'Locked for Transaction'}</TText></TView>
              </View>

              <View style={{ flex: 2 }}>
                <TouchableOpacity onPress={() => setIsHistoryExpanded(!isHistoryExpanded)} style={[styles.expandHeaderWeb, { backgroundColor: colors.surfaceSecondary }]}>
                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Hash size={16} color={COLORS.primary} />
                      <TText style={{ fontWeight: '800', fontSize: 15 }}>{billNo}</TText>
                   </View>
                   <ChevronDown size={18} color={colors.textSecondary} style={{ transform: [{ rotate: isHistoryExpanded ? '180deg' : '0deg' }] }} />
                </TouchableOpacity>

                <AnimatePresence>
                  {isHistoryExpanded && (
                    <MotiView from={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'timing', duration: 200 }} style={{ overflow: 'hidden' }}>
                       <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                          <View style={{ flex: 1 }}><View style={styles.miniLabelRow}><Calendar size={12} color={COLORS.primary} /><TText variant="caption">Date</TText></View><TView style={[styles.miniValueBox, { backgroundColor: colors.surfaceSecondary }]}><TText style={{ fontSize: 13, fontWeight: '700' }}>{billDate}</TText></TView></View>
                          <View style={{ flex: 1 }}><View style={styles.miniLabelRow}><Percent size={12} color={COLORS.primary} /><TText variant="caption">Applicable GST</TText></View><TView style={[styles.miniValueBox, { backgroundColor: colors.surfaceSecondary }]}><TText style={{ fontSize: 13, fontWeight: '700' }}>{billGST}% Tax Logic</TText></TView></View>
                       </View>
                    </MotiView>
                  )}
                </AnimatePresence>
              </View>

              <View style={{ flex: 1.2 }}><View style={styles.sectionHeader}><Percent size={14} color={COLORS.primary} /><TText variant="caption">Bill GST %</TText></View><View style={{ flexDirection: 'row', gap: 4 }}>{gstOptions.map(opt => (<TouchableOpacity key={opt} onPress={() => setBillGST(opt)} style={[styles.gstOption, billGST === opt && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}><TText style={{ fontSize: 11, fontWeight: '700', color: billGST === opt ? '#fff' : colors.textSecondary }}>{opt}</TText></TouchableOpacity>))}</View></View>
            </View>
          </TView>

          <TView style={[styles.card, { backgroundColor: colors.card, ...SHADOWS.sm, flex: 1 }]}>
            <View style={styles.sectionHeader}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><ShoppingBag size={18} color={COLORS.primary} /><TText variant="subtitle">Bill Particulars</TText></View><TouchableOpacity onPress={addItem} style={styles.roundAdd}><LinearGradient colors={[COLORS.primary, '#6366f1']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill} /><Plus size={18} color="#fff" /></TouchableOpacity></View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 16 }}>
              <View style={[styles.gridHeader, { borderBottomColor: colors.border }]}><TText style={[styles.headerCol, { flex: 3, textAlign: 'left' }]}>Particulars</TText><TText style={[styles.headerCol, { flex: 0.8 }]}>Qty</TText><TText style={[styles.headerCol, { flex: 0.6 }]}>Inc</TText><TText style={[styles.headerCol, { flex: 0.6 }]}>Pcs</TText><TText style={[styles.headerCol, { flex: 1.2 }]}>Rate (Box)</TText><TText style={[styles.headerCol, { flex: 1 }]}>HSN</TText><TText style={[styles.headerCol, { flex: 1.2 }]}>Total</TText><TText style={{ width: 40 }}></TText></View>
              {items.map((it, idx) => (
                <View key={it.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                  <View style={{ flex: 3 }}><TextInput value={it.name} onChangeText={(v) => updateItem(it.id, 'name', v)} placeholder="Description..." style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceSecondary, textAlign: 'left' }]} /></View>
                  <View style={{ flex: 0.8 }}><TextInput value={it.qty} onChangeText={(v) => updateItem(it.id, 'qty', v)} style={[styles.input, { color: isDark ? '#fff' : '#000', backgroundColor: 'rgba(129,140,248,0.08)', borderWidth: 1, borderColor: COLORS.primary + '40', textAlign: 'center' }]} keyboardType="numeric" /></View>
                  <View style={{ flex: 0.6 }}><TView style={styles.labelCell}><TText style={styles.labelText}>{it.incase}</TText></TView></View>
                  <View style={{ flex: 0.6 }}><TView style={styles.labelCell}><TText style={styles.labelText}>{it.pieces}</TText></TView></View>
                  <View style={{ flex: 1.2 }}><TView style={styles.labelCell}><TText style={styles.labelText}>₹{it.price}</TText></TView></View>
                  <View style={{ flex: 1 }}><TView style={styles.labelCell}><TText style={styles.labelText}>{it.hsn || '-'}</TText></TView></View>
                  <View style={{ flex: 1.2 }}><TView style={[styles.labelCell, { backgroundColor: COLORS.primary + '10' }]}><TText style={[styles.labelText, { color: COLORS.primary, fontWeight: '800' }]}>₹{(parseFloat(it.qty)*parseFloat(it.price)).toLocaleString('en-IN')}</TText></TView></View>
                  <TouchableOpacity onPress={() => removeItem(it.id)} style={styles.trashBtn}><Trash2 size={18} color={COLORS.danger} /></TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={styles.summaryFooter}><View style={styles.summaryRow}><TText style={{ color: colors.textSecondary }}>Subtotal</TText><TText style={{ fontWeight: '700' }}>₹{calculateSubtotal().toLocaleString('en-IN')}</TText></View><View style={styles.summaryRow}><TText style={{ color: colors.textSecondary }}>GST ({billGST}%)</TText><TText style={{ fontWeight: '700' }}>₹{calculateTaxAmount().toLocaleString('en-IN')}</TText></View><View style={[styles.summaryRow, { marginTop: 10 }]}><TText style={{ fontWeight: '800', fontSize: 24 }}>Total</TText><TText style={{ fontWeight: '800', fontSize: 24, color: COLORS.primary }}>₹{calculateGrandTotal().toLocaleString('en-IN')}</TText></View></View>
          </TView>
        </View>

        <TView style={[styles.miniPreviewPanel, { backgroundColor: colors.card, ...SHADOWS.sm }]}><View style={styles.miniHeader}><TText style={{ fontWeight: '800', fontSize: 13, color: COLORS.primary }}>LIVE STATUS</TText><View style={styles.miniBadge}><TText style={styles.miniBadgeText}>SYNCED</TText></View></View><View style={styles.thumbnailContainer}><View style={styles.thumbnailPaper}><Design1 data={getPreviewData()} /></View><TouchableOpacity onPress={() => setShowPreview(true)} style={styles.thumbnailOverlay}><MotiView from={{ scale: 0.8 }} animate={{ scale: 1 }} style={styles.playCircle}><Eye size={24} color="#fff" /></MotiView><TText style={styles.overlayText}>View Full Invoice</TText></TouchableOpacity></View><View style={styles.miniStats}><View style={styles.statBox}><TText variant="caption">Net Total</TText><TText style={{ fontWeight: '700', fontSize: 16 }}>₹{calculateGrandTotal().toLocaleString('en-IN')}</TText></View><View style={styles.statBox}><TText variant="caption">Items</TText><TText style={{ fontWeight: '700', fontSize: 16 }}>{items.length}</TText></View></View></TView>
      </View>

      <Modal visible={showPreview} transparent animationType="fade"><View style={styles.modalOverlay}><MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={[styles.modalContent, { backgroundColor: colors.background }]}><View style={styles.modalHeader}><TText variant="subtitle">Official Invoice Preview</TText><View style={{ flexDirection: 'row', gap: 12 }}><TouchableOpacity style={styles.iconBtn}><Printer size={20} color={colors.text} /></TouchableOpacity><TouchableOpacity style={styles.iconBtn}><Download size={20} color={colors.text} /></TouchableOpacity><TouchableOpacity onPress={() => setShowPreview(false)} style={styles.iconBtn}><X size={20} color={colors.text} /></TouchableOpacity></View></View><ScrollView contentContainerStyle={{ padding: 40, alignItems: 'center' }}><View style={styles.fullPaper}><Design1 data={getPreviewData()} /></View></ScrollView></MotiView></View></Modal>
    </WebLayout>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  mainContainer: { flexDirection: 'row', gap: 24, flex: 1, minHeight: 800 },
  formPanel: { flex: 1.5, gap: 24 },
  card: { padding: 24, borderRadius: RADIUS.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  roundAdd: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', ...SHADOWS.sm, overflow: 'hidden' },
  gridHeader: { flexDirection: 'row', gap: 8, paddingBottom: 12, borderBottomWidth: 1.5, marginBottom: 8, paddingHorizontal: 4 },
  headerCol: { fontSize: 11, fontWeight: '900', color: COLORS.primary, textTransform: 'uppercase', textAlign: 'center', letterSpacing: 0.5 },
  itemRow: { flexDirection: 'row', gap: 8, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 1 },
  input: { height: 42, borderRadius: 8, paddingHorizontal: 15, fontSize: 14, fontWeight: '700' },
  labelCell: { height: 42, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.025)', justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)' },
  labelText: { fontSize: 13, fontWeight: '700', opacity: 0.85, textAlign: 'center' },
  rowInput: { height: 44, borderRadius: 10, paddingHorizontal: 16, fontSize: 13, fontWeight: '600' },
  expandHeaderWeb: { height: 44, borderRadius: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1.5, borderBottomColor: COLORS.primary + '15' },
  miniLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  miniValueBox: { height: 40, borderRadius: 8, justifyContent: 'center', paddingHorizontal: 12, opacity: 0.7 },
  toggleContainer: { flexDirection: 'row', borderRadius: 10, padding: 4, height: 44, width: 200, overflow: 'hidden' },
  toggleBtn: { flex: 1, borderRadius: 8, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  trashBtn: { padding: 8, width: 40, alignItems: 'center' },
  summaryFooter: { marginTop: 30, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', gap: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownMenu: { position: 'absolute', top: 60, left: 0, right: 0, zIndex: 1000, borderRadius: 16, borderWidth: 1, padding: 12, elevation: 10 },
  miniSearch: { padding: 12, borderRadius: 10, marginBottom: 10, fontSize: 14, fontWeight: '600' },
  dropdownItem: { padding: 12, borderRadius: 8, marginBottom: 4 },
  gstOption: { paddingHorizontal: 10, height: 32, borderRadius: 6, borderWidth: 1, borderColor: '#eee', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },
  miniPreviewPanel: { width: 380, borderRadius: RADIUS.xl, overflow: 'hidden', padding: 20, alignSelf: 'flex-start' },
  miniHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  miniBadge: { backgroundColor: COLORS.success + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  miniBadgeText: { color: COLORS.success, fontSize: 9, fontWeight: '900' },
  thumbnailContainer: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: '#f5f5f5', overflow: 'hidden', position: 'relative', ...SHADOWS.sm },
  thumbnailPaper: { width: '100%', transform: [{ scale: 0.35 }, { translateY: -400 }], backgroundColor: '#fff' },
  thumbnailOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', gap: 8 },
  playCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.md },
  overlayText: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  miniStats: { flexDirection: 'row', gap: 12, marginTop: 20 },
  statBox: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.03)' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', height: '90%', borderRadius: 24, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#eee' },
  iconBtn: { padding: 10, borderRadius: 10 },
  fullPaper: { width: '100%', maxWidth: 840, backgroundColor: '#fff', ...SHADOWS.lg },
});

export default Billing;
