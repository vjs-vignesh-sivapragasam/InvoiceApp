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
  Plus, Trash2, Eye, ShoppingBag, User as UserIcon, X, Download, Printer, Hash, Calendar
} from 'lucide-react-native';
import { useNotifications } from '../../../components/NotificationProvider';
import { useAppConfig } from '../../../components/AppConfigProvider';
import { LinearGradient } from 'expo-linear-gradient';

interface Client { clientid: number; clientname: string; gstin?: string; addressline1?: string; landmark?: string; mobile?: string; }
interface Product { productid: number; productname: string; sellingprice: number; hsn?: string; incase?: number; pieces?: number; }
interface Item { id: number; productid: number | null; name: string; qty: string; price: string; gst: string; hsn: string; box: string; }

export const Billing = () => {
  const { colors } = useTheme();
  const { config } = useAppConfig();
  const { showToast } = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [billNo, setBillNo] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientSearch, setClientSearch] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [withGST, setWithGST] = useState(true);
  const [docType, setDocType] = useState<'invoice' | 'quotation'>('invoice');
  const [items, setItems] = useState<Item[]>([
    { id: Date.now(), productid: null, name: '', qty: '1', price: '0', gst: '9', hsn: '', box: '0' }
  ]);
  const [adjustment, setAdjustment] = useState('0');

  useEffect(() => {
    fetchInitialData();
    // Auto-generate complex Bill No series from config: TEXT/DELIM/YEAR/DELIM/COUNT
    const generatedNo = `${config.billSeriesText}${config.billSeriesDelimiter}${config.billSeriesNumber}${config.billSeriesDelimiter}${config.billSeriesCount}`;
    setBillNo(generatedNo);
  }, []);

  const fetchInitialData = async () => {
    try {
      const [c, p] = await Promise.all([db.clients.getAll(), db.products.getAll()]);
      setClients(c);
      setProducts(p);
    } catch (error) {
       console.error(error);
    } finally {
       setLoading(false);
    }
  };

  const filteredClients = clients.filter(c =>
    (c.clientname ?? '').toLowerCase().includes(clientSearch.toLowerCase())
  );

  const addItem = () => setItems([...items, { id: Date.now(), productid: null, name: '', qty: '1', price: '0', gst: '9', hsn: '', box: '0' }]);
  const removeItem = (id: number) => items.length > 1 && setItems(items.filter(i => i.id !== id));

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map(it => {
      if (it.id !== id) return it;
      if (field === 'productid') {
        const p = products.find(x => x.productid === value);
        return { ...it, productid: value, name: p?.productname || '', price: p?.sellingprice?.toString() || '0', hsn: p?.hsn || '', box: p?.incase?.toString() || '0' };
      }
      return { ...it, [field]: value };
    }));
  };

  const calculateSubtotal = () => items.reduce((acc, item) => acc + (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0), 0);
  const calculateTax = () => {
    if (!withGST || docType === 'quotation') return 0;
    return items.reduce((acc, item) => {
      const sub = (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0);
      return acc + (sub * (parseFloat(item.gst) / 100));
    }, 0);
  };
  const calculateGrandTotal = () => calculateSubtotal() + (calculateTax() * 2) + (parseFloat(adjustment) || 0);

  const handleSave = async () => {
    if (!selectedClient) return showToast('Please select a client', 'error');
    try {
      await db.billing.create({
          clientid: selectedClient.clientid,
          billno: billNo,
          totalamount: calculateGrandTotal(),
          taxableamount: calculateSubtotal(),
          isactive: true
      });
      showToast(`${docType === 'invoice' ? 'Bill' : 'Quotation'} ${billNo} generated successfully!`);
    } catch (e) { showToast('Execution failed', 'error'); }
  };

  const getPreviewData = () => ({
    business: { name: 'MK AGENCY', address: '6, 1st cross, Puducherry', mobile: '+91 9791858965', gstin: '34CEBPG0848B1Z5' },
    client: selectedClient || { name: '---' },
    billNo: billNo || 'DRAFT',
    billDate: billDate.split('-').reverse().join('/'),
    withGST,
    docType,
    items: items.map(it => {
      const sub = (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0);
      const tax = (withGST && docType === 'invoice') ? sub * (parseFloat(it.gst) / 100) : 0;
      return {
        name: it.name || '---',
        hsn: it.hsn || '-',
        box: it.box || '0',
        pieces: it.qty,
        price: it.price,
        cgst: tax > 0 ? tax.toFixed(2) : '0.00',
        sgst: tax > 0 ? tax.toFixed(2) : '0.00',
        rate: (parseFloat(it.price) + (tax * 2) / parseFloat(it.qty || '1')).toFixed(2),
        amount: (sub + (tax * 2)).toFixed(2)
      };
    }),
    summary: { totalQty: items.reduce((a, b) => a + (parseInt(b.qty) || 0), 0), totalAmount: calculateGrandTotal().toFixed(2), beforeTax: calculateSubtotal().toFixed(2), afterTax: calculateGrandTotal().toFixed(2) }
  });

  if (loading) return <WebLayout><ActivityIndicator size="large" color={COLORS.primary} /></WebLayout>;

  return (
    <WebLayout>
      <View style={styles.header}>
        <View>
          <TText variant="title">Billing Terminal</TText>
          <TText variant="caption">Create official tax invoices or quotations with real-time preview</TText>
        </View>

        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
           {/* Document Type & GST Toggle Handle */}
           <TView style={[styles.toggleContainer, { backgroundColor: colors.surfaceSecondary, width: 320 }]}>
              <TouchableOpacity 
                onPress={() => { setDocType('invoice'); setWithGST(true); }} 
                style={styles.toggleBtn}
              >
                {docType === 'invoice' && withGST && (
                  <LinearGradient colors={[COLORS.primary, '#6366f1']} start={{x:0,y:0}} end={{x:1,y:1}} style={[StyleSheet.absoluteFill, { borderRadius: 8 }]} />
                )}
                <TText style={{ color: docType === 'invoice' && withGST ? '#fff' : colors.textSecondary, fontWeight: '700', fontSize: 10 }}>INV + GST</TText>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => { setDocType('invoice'); setWithGST(false); }} 
                style={styles.toggleBtn}
              >
                {docType === 'invoice' && !withGST && (
                  <LinearGradient colors={[COLORS.primary, '#6366f1']} start={{x:0,y:0}} end={{x:1,y:1}} style={[StyleSheet.absoluteFill, { borderRadius: 8 }]} />
                )}
                <TText style={{ color: docType === 'invoice' && !withGST ? '#fff' : colors.textSecondary, fontWeight: '700', fontSize: 10 }}>INV NO GST</TText>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => { setDocType('quotation'); setWithGST(false); }} 
                style={styles.toggleBtn}
              >
                {docType === 'quotation' && (
                  <LinearGradient colors={[COLORS.primary, '#6366f1']} start={{x:0,y:0}} end={{x:1,y:1}} style={[StyleSheet.absoluteFill, { borderRadius: 8 }]} />
                )}
                <TText style={{ color: docType === 'quotation' ? '#fff' : colors.textSecondary, fontWeight: '700', fontSize: 10 }}>QUOTATION</TText>
              </TouchableOpacity>
           </TView>
           <Button title="Generate & Save" onPress={handleSave} style={{ width: 170 }} />
        </View>
      </View>

      <View style={styles.mainContainer}>
        <View style={styles.formPanel}>
          {/* Metadata Row: Bill No, Date, Client - ALL IN ONE ROW */}
          <TView style={[styles.card, { backgroundColor: colors.card, ...SHADOWS.sm, zIndex: 10 }]}>
            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-end' }}>
              <View style={{ flex: 0.8 }}>
                <View style={styles.sectionHeader}><Hash size={14} color={COLORS.primary} /><TText variant="caption">Bill No</TText></View>
                <TextInput value={billNo} onChangeText={setBillNo} style={[styles.rowInput, { backgroundColor: colors.surfaceSecondary }]} />
              </View>
              
              <View style={{ flex: 1 }}>
                <View style={styles.sectionHeader}><Calendar size={14} color={COLORS.primary} /><TText variant="caption">Bill Date</TText></View>
                <TextInput value={billDate} onChangeText={setBillDate} style={[styles.rowInput, { backgroundColor: colors.surfaceSecondary }]} />
              </View>

              <View style={{ flex: 2 }}>
                <View style={styles.sectionHeader}><UserIcon size={14} color={COLORS.primary} /><TText variant="caption">Client Selection</TText></View>
                <View style={{ position: 'relative' }}>
                  <TouchableOpacity 
                    onPress={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                    style={[styles.rowInput, { backgroundColor: colors.surfaceSecondary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                  >
                    <TText style={{ color: selectedClient ? colors.text : colors.textSecondary, fontWeight: '600', fontSize: 13 }}>{selectedClient ? selectedClient.clientname : 'Search Client...'}</TText>
                    <Plus size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                  
                  {isClientDropdownOpen && (
                    <MotiView 
                      from={{ opacity: 0, translateY: -10 }} 
                      animate={{ opacity: 1, translateY: 0 }}
                      style={[styles.dropdownMenu, { backgroundColor: colors.card, ...SHADOWS.lg, borderColor: colors.border }]}
                    >
                      <TextInput 
                        autoFocus
                        placeholder="Search..."
                        value={clientSearch}
                        onChangeText={setClientSearch}
                        style={[styles.miniSearch, { backgroundColor: colors.surfaceSecondary, color: colors.text }]}
                      />
                      <ScrollView style={{ maxHeight: 200 }}>
                        {filteredClients.map(c => (
                          <TouchableOpacity 
                            key={c.clientid} 
                            onPress={() => { setSelectedClient(c); setIsClientDropdownOpen(false); setClientSearch(''); }}
                            style={styles.dropdownItem}
                          >
                            <TText style={{ fontSize: 13 }}>{c.clientname}</TText>
                            <TText variant="caption">{c.gstin || '---'}</TText>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </MotiView>
                  )}
                </View>
              </View>
            </View>
          </TView>

          {/* Line Items Grid */}
          <TView style={[styles.card, { backgroundColor: colors.card, ...SHADOWS.sm, flex: 1 }]}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ShoppingBag size={18} color={COLORS.primary} />
                <TText variant="subtitle">Bill Particulars</TText>
              </View>
              <TouchableOpacity onPress={addItem} style={styles.roundAdd}>
                 <LinearGradient colors={[COLORS.primary, '#6366f1']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill} />
                 <Plus size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 16 }}>
              {items.map((it, idx) => (
                <View key={it.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                  <View style={{ flex: 4 }}>
                    <TText style={styles.rowLabel}>{idx + 1}. Particulars</TText>
                    <TextInput value={it.name} onChangeText={(v) => updateItem(it.id, 'name', v)} placeholder="Description..." style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceSecondary }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TText style={styles.rowLabel}>Qty</TText>
                    <TextInput value={it.qty} onChangeText={(v) => updateItem(it.id, 'qty', v)} style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceSecondary, textAlign: 'center' }]} keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1.5 }}>
                    <TText style={styles.rowLabel}>Price</TText>
                    <TextInput value={it.price} onChangeText={(v) => updateItem(it.id, 'price', v)} style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceSecondary }]} keyboardType="numeric" />
                  </View>
                  <TouchableOpacity onPress={() => removeItem(it.id)} style={styles.trashBtn}><Trash2 size={18} color={COLORS.danger} /></TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={styles.summaryFooter}>
               <View style={styles.summaryRow}><TText style={{ color: colors.textSecondary }}>Subtotal</TText><TText style={{ fontWeight: '700' }}>${calculateSubtotal().toFixed(2)}</TText></View>
               <View style={styles.summaryRow}><TText style={{ color: colors.textSecondary }}>GST (18%)</TText><TText style={{ fontWeight: '700' }}>${(calculateTax() * 2).toFixed(2)}</TText></View>
               <View style={[styles.summaryRow, { marginTop: 10 }]}><TText style={{ fontWeight: '800', fontSize: 24 }}>Total</TText><TText style={{ fontWeight: '800', fontSize: 24, color: COLORS.primary }}>${calculateGrandTotal().toFixed(2)}</TText></View>
            </View>
          </TView>
        </View>

        {/* Right Side: Quick Status Thumbnail */}
        <TView style={[styles.miniPreviewPanel, { backgroundColor: colors.card, ...SHADOWS.sm }]}>
           <View style={styles.miniHeader}>
              <TText style={{ fontWeight: '800', fontSize: 13, color: COLORS.primary }}>LIVE STATUS</TText>
              <View style={styles.miniBadge}><TText style={styles.miniBadgeText}>SYNCED</TText></View>
           </View>
           
           <View style={styles.thumbnailContainer}>
              <View style={styles.thumbnailPaper}>
                 <Design1 data={getPreviewData()} />
              </View>
              <TouchableOpacity onPress={() => setShowPreview(true)} style={styles.thumbnailOverlay}>
                 <MotiView from={{ scale: 0.8 }} animate={{ scale: 1 }} style={styles.playCircle}>
                    <Eye size={24} color="#fff" />
                 </MotiView>
                 <TText style={styles.overlayText}>View Full Invoice</TText>
              </TouchableOpacity>
           </View>

           <View style={styles.miniStats}>
              <View style={styles.statBox}>
                <TText variant="caption">Net Total</TText>
                <TText style={{ fontWeight: '700', fontSize: 16 }}>${calculateGrandTotal().toFixed(2)}</TText>
              </View>
              <View style={styles.statBox}>
                <TText variant="caption">Items</TText>
                <TText style={{ fontWeight: '700', fontSize: 16 }}>{items.length}</TText>
              </View>
           </View>
        </TView>
      </View>

      {/* FULL PREVIEW MODAL */}
      <Modal visible={showPreview} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <MotiView 
              from={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              style={[styles.modalContent, { backgroundColor: colors.background }]}
            >
                <View style={styles.modalHeader}>
                    <TText variant="subtitle">Official Invoice Preview</TText>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity style={styles.iconBtn}><Printer size={20} color={colors.text} /></TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn}><Download size={20} color={colors.text} /></TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowPreview(false)} style={styles.iconBtn}><X size={20} color={colors.text} /></TouchableOpacity>
                    </View>
                </View>
                <ScrollView contentContainerStyle={{ padding: 40, alignItems: 'center' }}>
                    <View style={styles.fullPaper}>
                        <Design1 data={getPreviewData()} />
                    </View>
                </ScrollView>
            </MotiView>
        </View>
      </Modal>
    </WebLayout>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  outlineBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 44, borderRadius: RADIUS.md, borderWidth: 1.5 },
  mainContainer: { flexDirection: 'row', gap: 24, flex: 1, minHeight: 800 },
  formPanel: { flex: 1.5, gap: 24 },
  card: { padding: 24, borderRadius: RADIUS.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  clientChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginRight: 10, borderWidth: 1.5 },
  roundAdd: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', ...SHADOWS.sm },
  itemRow: { flexDirection: 'row', gap: 12, paddingVertical: 10, alignItems: 'center' },
  rowLabel: { fontSize: 9, fontWeight: '800', color: COLORS.primary, marginBottom: 4, textTransform: 'uppercase' },
  input: { height: 44, borderRadius: 10, paddingHorizontal: 16, fontSize: 13, fontWeight: '600' },
  rowInput: { height: 40, borderRadius: 8, paddingHorizontal: 12, fontSize: 13, fontWeight: '600' },
  toggleContainer: { flexDirection: 'row', borderRadius: 10, padding: 4, height: 44, width: 200 },
  toggleBtn: { flex: 1, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  trashBtn: { padding: 8, marginTop: 12 },
  summaryFooter: { marginTop: 30, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', gap: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clientBadge: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  clientBadgeText: { color: COLORS.primary, fontSize: 10, fontWeight: '900' },
  dropdownTrigger: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1.5 
  },
  dropdownMenu: { 
    position: 'absolute', 
    top: 60, 
    left: 0, 
    right: 0, 
    zIndex: 1000, 
    borderRadius: 16, 
    borderWidth: 1, 
    padding: 12,
    elevation: 10
  },
  miniSearch: { padding: 12, borderRadius: 10, marginBottom: 10, fontSize: 14, fontWeight: '600' },
  dropdownItem: { padding: 12, borderRadius: 8, marginBottom: 4 },
  miniPreviewPanel: { width: 380, borderRadius: RADIUS.xl, overflow: 'hidden', padding: 20 },
  miniHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  miniBadge: { backgroundColor: COLORS.success + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  miniBadgeText: { color: COLORS.success, fontSize: 9, fontWeight: '900' },
  thumbnailContainer: { 
    width: '100%', 
    aspectRatio: 16 / 9, 
    borderRadius: 12, 
    backgroundColor: '#f5f5f5', 
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.sm
  },
  thumbnailPaper: { 
    width: '100%', 
    transform: [{ scale: 0.35 }, { translateY: -400 }],
    backgroundColor: '#fff',
  },
  thumbnailOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 8
  },
  playCircle: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: COLORS.primary, 
    justifyContent: 'center', 
    alignItems: 'center',
    ...SHADOWS.md
  },
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
