import { AnimatePresence, MotiView } from '@/components/MotiShim';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight,
  ChevronDown,
  Eye,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  User as UserIcon, X
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppConfig } from '../../../components/AppConfigProvider';
import { useNotifications } from '../../../components/NotificationProvider';
import { Design1 } from '../../../components/templates/Design1';
import { TText, TView, useTheme } from '../../../components/ThemedUI';
import { db } from '../../../services/supabase';
import { COLORS, SHADOWS } from '../../../theme';
import { WebLayout } from './WebLayout';

interface Client { clientid: number; clientname: string; gstin?: string; addressline1?: string; landmark?: string; mobile?: string; }
interface Product { productid: number; productname: string; sellingprice: number; hsn?: string; incase?: number; optional1?: string; pieces?: number; }
interface Item {
  id: number; productid: number | null; name: string; qty: string;
  price: string; hsn: string; incase: string; pieces: string;
}

export const Billing = () => {
  const { colors, isDark } = useTheme();
  const { config, refreshConfig } = useAppConfig();
  const { showToast } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [billNo, setBillNo] = useState('');
  const [billDate, setBillDate] = useState(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD local format
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  const [isItemsExpanded, setIsItemsExpanded] = useState(true);

  const [clientSearch, setClientSearch] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  const [docType, setDocType] = useState<'invoice' | 'quotation'>('invoice');
  const [gstEnabled, setGstEnabled] = useState(true);
  const [billGST, setBillGST] = useState('12');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT' | 'GPAY' | 'CARD'>('CASH');

  const [items, setItems] = useState<Item[]>([{ id: Date.now(), productid: null, name: '', qty: '1', price: '0', hsn: '', incase: '-', pieces: '-' }]);
  const [adjustment, setAdjustment] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [productSearch, setProductSearch] = useState('');
  const [activeProductIdIndex, setActiveProductIdIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<any>(null);

  const gstOptions = ['2', '8', '9', '12', '18'];

  useEffect(() => {
    fetchInitialData();
  }, [config]);

  const fetchInitialData = async () => {
    try {
      const [c, p, nextBill, dbProfile, profile] = await Promise.all([
        db.clients.getAll(),
        db.products.getWithStock(),
        db.billSeries.getNextBillNo(1),
        db.users.getProfile(1).catch(() => null),
        AsyncStorage.getItem('business_profile')
      ]);

      setClients(c);
      setProducts(p);
      setBillNo(nextBill);

      const loadProfile = (prof: any) => ({
        name: prof.companyName || prof.optional1 || prof.name || 'MK AGENCY',
        ownerName: prof.ownerName || prof.username || '',
        address: prof.address || prof.addressline1 || prof.AddressLine1 || '',
        address2: prof.address2 || prof.addressline2 || prof.AddressLine2 || '',
        landmark: prof.landmark || prof.Landmark || '',
        pincode: prof.pincode || prof.Pincode || '',
        mobile: prof.mobile || prof.Mobile || '',
        altMobile: prof.altMobile || prof.mobile2 || prof.Mobile2 || '',
        email: prof.email || prof.emailid || prof.EmailID || '',
        gstin: prof.gstin || prof.GSTIN || '',
        bankName: prof.bankName || prof.bankaccountname || prof.BankAccountName || '',
        accountNo: prof.accountNo || prof.accountno || prof.AccountNo || '',
        ifsc: prof.ifsc || prof.IFSC || '',
      });

      if (dbProfile) {
        setBusinessProfile(loadProfile(dbProfile));
        await AsyncStorage.setItem('business_profile', JSON.stringify(dbProfile));
      } else if (profile) {
        setBusinessProfile(loadProfile(JSON.parse(profile)));
      } else {
        setBusinessProfile({ name: 'MK AGENCY', address: '6, 1st cross, Puducherry', mobile: '+91 9791858965', gstin: '34CEBPG0848B1Z5' });
      }
    } catch { } finally { setLoading(false); }
  };

  const addItem = () => { setItems([...items, { id: Date.now(), productid: null, name: '', qty: '1', price: '0', hsn: '', incase: '-', pieces: '-' }]); setIsItemsExpanded(true); };
  const removeItem = (id: number) => items.length > 1 && setItems(items.filter(i => i.id !== id));

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map(it => {
      if (it.id !== id) return it;
      let updated = { ...it, [field]: value };

      if (field === 'productid') {
        const p = products.find(x => x.productid === value);
        updated.productid = value;
        updated.name = p?.productname || '';
        updated.price = p?.sellingprice?.toString() || '0';
        updated.hsn = p?.hsn || '';
        // incase (DB) = box unit display value (e.g. 1)
        updated.incase = (p?.incase ?? '-').toString();
        // pieces (DB) = pieces per box (e.g. 24)
        updated.pieces = (p?.pieces ?? '-').toString();

        const availableStock = (p as any)?.currentStock || 0;
        if (availableStock <= 0) showToast(`Warning: ${p?.productname} is out of stock!`, 'error');
      }

      if (field === 'qty') {
        const p = products.find(x => x.productid === it.productid);
        if (p) {
          const availableStock = (p as any).currentStock || 0;
          const requestedQty = parseFloat(value) || 0;
          if (requestedQty > availableStock) {
            showToast(`Insufficient stock! Max available: ${availableStock}`, 'error');
            updated.qty = availableStock.toString();
          }
          // pieces (DB) stays static
          updated.pieces = (p?.pieces ?? '-').toString();
        }
      }
      return updated;
    }));
  };

  const calculateSubtotal = () => items.reduce((acc, item) => {
    const qty = parseFloat(item.qty) || 0;
    const piecesPerBox = parseFloat(item.pieces) || 0;
    const price = parseFloat(item.price) || 0;
    return acc + (qty * piecesPerBox * price);
  }, 0);

  const getCalculations = () => {
    const subtotal = calculateSubtotal();
    const discPerc = parseFloat(discount) || 0;
    const discAmount = subtotal * (discPerc / 100);
    const taxableAmount = subtotal - discAmount;

    const gstRate = gstEnabled ? parseFloat(billGST) : 0;
    const gstAmount = taxableAmount * (gstRate / 100);

    const adjustmentVal = parseFloat(adjustment) || 0;
    const totalAmount = taxableAmount + gstAmount + adjustmentVal;

    return {
      subtotal,
      taxableAmount,
      gstAmount,
      discPerc,
      discAmount,
      totalAmount
    };
  };

  const calculateTotal = () => getCalculations().totalAmount;

  const handleSave = () => {
    if (!selectedClient) return showToast('Please select a client', 'error');
    setShowConfirmModal(true);
  };

  const executeSave = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const calcs = getCalculations();
      await db.billing.create({
        clientid: selectedClient!.clientid,
        billno: billNo,
        totalamount: calcs.totalAmount,
        taxableamount: calcs.taxableAmount,
        gstamount: calcs.gstAmount,
        disperc: calcs.discPerc,
        discamount: calcs.discAmount,
        isactive: true,
        billdate: billDate,
        paymentmethod: paymentMethod,
        iswithgst: gstEnabled,
        productid: items[0].productid,
        box: parseInt(items[0].incase) || 0,
        pieces: parseInt(items[0].pieces) || 0,
        rate: parseFloat(items[0].price) || 0,
        optional2: adjustment
      });

      // 📦 Stock Reduction Logic
      for (const item of items) {
        if (item.productid) {
          const product = products.find(p => p.productid === item.productid);
          if (product) {
            const currentStock = (product as any).currentStock || 0; // Current balance from latest log
            const newStock = currentStock - (parseInt(item.qty) || 0);

            await db.inventory.logMovement({
              productid: item.productid,
              movementtype: 'sale',
              quantitymoved: parseInt(item.qty) || 0,
              previousstock: currentStock,
              newstock: newStock,
              referenceno: billNo,
              notes: `Sale (Web) to ${selectedClient!.clientname}`
            });
          }
        }
      }

      await db.billSeries.incrementCount(1);
      await refreshConfig();

      showToast(`${docType.toUpperCase()} Saved!`);
      resetForm();
      const nextBill = await db.billSeries.getNextBillNo(1);
      setBillNo(nextBill);
    } catch (e) {
      console.error('Save error:', e);
      showToast('Save failed', 'error');
    }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setSelectedClient(null);
    setItems([{ id: Date.now(), productid: null, name: '', qty: '1', price: '0', hsn: '', incase: '-', pieces: '-' }]);
    setAdjustment('0');
    setDiscount('0');
    setGstEnabled(true);
    setPaymentMethod('CASH');
    setIsHeaderExpanded(true);
  };

  if (loading) return <WebLayout><ActivityIndicator size="large" color={COLORS.primary} /></WebLayout>;

  return (
    <WebLayout>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <TText variant="title" style={{ fontSize: 28, fontWeight: '900', textAlign: 'center' }}>Billing Terminal</TText>
          <TText variant="caption" style={{ textAlign: 'center', opacity: 0.6 }}>Unified document and series management</TText>
        </View>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 20, justifyContent: 'center' }}>
          <TView style={[styles.typeSwitcher, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <TouchableOpacity 
              onPress={() => setDocType('invoice')} 
              style={[styles.typeSlot, docType === 'invoice' && { backgroundColor: COLORS.primary }]}
            >
              <TText style={[styles.slotLabel, docType === 'invoice' ? { color: '#fff' } : { color: colors.textSecondary }]}>INVOICE</TText>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setDocType('quotation')} 
              style={[styles.typeSlot, docType === 'quotation' && { backgroundColor: COLORS.primary }]}
            >
              <TText style={[styles.slotLabel, docType === 'quotation' ? { color: '#fff' } : { color: colors.textSecondary }]}>QUOTATION</TText>
            </TouchableOpacity>
          </TView>
          <TView style={[styles.switchCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <TText style={{ fontWeight: '800', fontSize: 12, marginRight: 15, opacity: 0.6 }}>Payment</TText>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['CASH', 'CREDIT', 'GPAY', 'CARD'].map((m: any) => (
                <TouchableOpacity 
                  key={m} 
                  onPress={() => setPaymentMethod(m)} 
                  style={[styles.payChip, paymentMethod === m && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
                >
                  <TText style={{ fontSize: 10, fontWeight: '900', color: paymentMethod === m ? '#fff' : colors.textSecondary }}>{m}</TText>
                </TouchableOpacity>
              ))}
            </View>
          </TView>
          <TView style={[styles.switchCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <TText style={{ fontWeight: '800', fontSize: 12, marginRight: 15, opacity: 0.6 }}>GST Mode</TText>
            <TouchableOpacity onPress={() => setGstEnabled(!gstEnabled)} style={[styles.webToggle, { backgroundColor: gstEnabled ? COLORS.primary : 'rgba(0,0,0,0.1)' }]}>
              <View style={[styles.webToggleKnob, { marginLeft: gstEnabled ? 20 : 0 }]} />
            </TouchableOpacity>
          </TView>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <View style={styles.formPanel}>
          <TouchableOpacity onPress={() => setIsHeaderExpanded(!isHeaderExpanded)} style={[styles.collapsibleTrigger, { backgroundColor: colors.card, ...SHADOWS.sm }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}><UserIcon size={20} color={COLORS.primary} /><TText style={{ fontWeight: '800', fontSize: 16 }}>{selectedClient ? selectedClient.clientname : 'Click to select Client'}</TText>{!isHeaderExpanded && <TText style={{ opacity: 0.5, fontSize: 13 }}>• Bill: {billNo} • Date: {billDate} • Logic: {gstEnabled ? billGST + '%' : 'No GST'}</TText>}</View>
            <ChevronDown size={20} color={colors.textSecondary} style={{ transform: [{ rotate: isHeaderExpanded ? '180deg' : '0deg' }] }} />
          </TouchableOpacity>

          <AnimatePresence>
            {isHeaderExpanded && (
              <MotiView from={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'timing', duration: 200 }} style={{ overflow: 'hidden' }}>
                <TView style={[styles.cardLayout, { backgroundColor: colors.card }]}>
                  <View style={{ flexDirection: 'row', gap: 20 }}>
                    <View style={{ flex: 1.5 }}><TText variant="caption" style={{ marginBottom: 10 }}>Client Selector</TText><View style={{ position: 'relative' }}><TouchableOpacity onPress={() => setIsClientDropdownOpen(!isClientDropdownOpen)} style={[styles.webPicker, { backgroundColor: colors.surfaceSecondary }]}><TText style={{ fontWeight: '700' }}>{selectedClient ? selectedClient.clientname : 'Search Client...'}</TText><ChevronDown size={18} color={colors.textSecondary} /></TouchableOpacity>{isClientDropdownOpen && (<View style={[styles.webDropdown, { backgroundColor: colors.card, borderColor: colors.border, ...SHADOWS.lg }]}><TextInput placeholder="Filter..." value={clientSearch} onChangeText={setClientSearch} style={[styles.dropdownSearch, { backgroundColor: colors.surfaceSecondary }]} /><ScrollView style={{ maxHeight: 250 }}>{clients.filter(c => c.clientname.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (<TouchableOpacity key={c.clientid} onPress={() => { setSelectedClient(c); setIsClientDropdownOpen(false); }} style={styles.dropdownOption}><TText style={{ fontWeight: '700' }}>{c.clientname}</TText></TouchableOpacity>))}</ScrollView></View>)}</View></View>
                    <View style={{ flex: 1 }}><TText variant="caption" style={{ marginBottom: 10, fontWeight: '800', color: COLORS.primary }}>INVOICE NO</TText><TView style={[styles.webPicker, { backgroundColor: colors.surfaceSecondary, opacity: 0.8 }]}><TText style={{ fontWeight: '700' }}>{billNo}</TText></TView></View>
                    <View style={{ flex: 1 }}><TText variant="caption" style={{ marginBottom: 10, fontWeight: '800', color: COLORS.primary }}>BILL DATE</TText><TView style={[styles.webPicker, { backgroundColor: colors.surfaceSecondary }]}><TText style={{ fontWeight: '700' }}>{billDate}</TText></TView></View>
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
                    {items.map((it, idx) => {
                      const p = products.find(prod => prod.productid === it.productid);
                      const availableStock = (p as any)?.currentStock || 0;
                      const isLow = p && availableStock < 10;

                      return (
                        <View key={it.id} style={[styles.webTableRow, { borderBottomColor: isLow ? COLORS.danger + '40' : colors.border }]}>
                          <View style={{ flex: 3, position: 'relative' }}>
                            <TouchableOpacity
                              onPress={() => setActiveProductIdIndex(idx)}
                              style={[styles.webProductSelect, { backgroundColor: colors.surfaceSecondary, borderColor: isLow ? COLORS.danger : 'transparent', borderWidth: 1 }]}
                            >
                              <TText style={{ fontWeight: '700' }}>{it.name || 'Select Product...'}</TText>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                {p && <TText style={{ fontSize: 10, fontWeight: '900', color: isLow ? COLORS.danger : COLORS.success }}>Stock: {availableStock}</TText>}
                                <ChevronDown size={14} color={colors.textSecondary} />
                              </View>
                            </TouchableOpacity>

                            {activeProductIdIndex === idx && (
                              <View style={[styles.webDropdown, { backgroundColor: colors.card, borderColor: colors.border, top: 50, ...SHADOWS.lg }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <TextInput
                                    placeholder="Search product..."
                                    value={productSearch}
                                    autoFocus
                                    onChangeText={setProductSearch}
                                    style={[styles.dropdownSearch, { flex: 1, backgroundColor: colors.surfaceSecondary }]}
                                  />
                                  <TouchableOpacity onPress={() => setActiveProductIdIndex(null)} style={{ padding: 10 }}><X size={18} color={colors.textSecondary} /></TouchableOpacity>
                                </View>
                                <ScrollView style={{ maxHeight: 200 }}>
                                  {products.filter(p => p.productname.toLowerCase().includes(productSearch.toLowerCase())).map(p => {
                                    const stock = (p as any).currentStock || 0;
                                    return (
                                      <TouchableOpacity
                                        key={p.productid}
                                        onPress={() => { updateItem(it.id, 'productid', p.productid); setActiveProductIdIndex(null); }}
                                        style={styles.dropdownOption}
                                      >
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <TText style={{ fontWeight: '700' }}>{p.productname}</TText>
                                          <TText style={{ fontSize: 10, fontWeight: '900', color: stock < 10 ? COLORS.danger : COLORS.success }}>Stock: {stock}</TText>
                                        </View>
                                      </TouchableOpacity>
                                    )
                                  })}
                                </ScrollView>
                              </View>
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <TextInput value={it.qty} onChangeText={v => updateItem(it.id, 'qty', v)} style={[styles.webInput, { borderColor: isLow ? COLORS.danger : COLORS.primary + '30', color: colors.text }]} />
                            {isLow && <TText style={{ fontSize: 8, color: COLORS.danger, fontWeight: '900', textAlign: 'center', marginTop: 4 }}>CRITICAL LOW</TText>}
                          </View>
                          <View style={styles.webValCell}><TText style={styles.webValText}>{it.incase}</TText></View>
                          <View style={styles.webValCell}><TText style={styles.webValText}>{it.pieces}</TText></View>
                          <View style={styles.webValCell}><TText style={styles.webValText}>₹{it.price}</TText></View>
                          <View style={styles.webValCell}><TText style={styles.webValText}>{it.hsn || '-'}</TText></View>
                          <View style={[styles.webValCell, { flex: 1.2, backgroundColor: COLORS.primary + '05' }]}><TText style={{ fontWeight: '900', color: COLORS.primary }}>₹{(parseFloat(it.qty) * parseFloat(it.price)).toLocaleString()}</TText></View>
                          <TouchableOpacity onPress={() => removeItem(it.id)} style={{ padding: 10 }}><Trash2 size={18} color={COLORS.danger} /></TouchableOpacity>
                        </View>
                      );
                    })}
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
            <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.webFinishBtn}><LinearGradient colors={['#6366f1', '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.webFinishGrad}>{loading ? <ActivityIndicator color="#fff" /> : (<><TText style={{ color: '#fff', fontWeight: '900' }}>FINISH & GENERATE</TText><ArrowRight size={20} color="#fff" /></>)}</LinearGradient></TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPreview(true)} style={styles.webPreviewBtn}><Eye size={20} color={COLORS.primary} /><TText style={{ color: COLORS.primary, fontWeight: '800' }}>Quick Preview</TText></TouchableOpacity>
          </View>
        </TView>
      </View>

      <Modal visible={showPreview} transparent><View style={styles.modalOverlay}><MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={styles.webPreviewModal}><View style={styles.previewHead}><TText variant="subtitle">Invoice Preview</TText><TouchableOpacity onPress={() => setShowPreview(false)}><X size={24} color={colors.text} /></TouchableOpacity></View><ScrollView contentContainerStyle={{ padding: 40, alignItems: 'center' }}><View style={{ width: 850, backgroundColor: '#fff', ...SHADOWS.lg }}><Design1 data={{ business: businessProfile ? {
        name: businessProfile.companyName || businessProfile.optional1 || businessProfile.name || 'MK AGENCY',
        ownerName: businessProfile.ownerName || businessProfile.username || '',
        address: businessProfile.address || businessProfile.addressline1 || businessProfile.AddressLine1 || '',
        address2: businessProfile.address2 || businessProfile.addressline2 || businessProfile.AddressLine2 || '',
        landmark: businessProfile.landmark || businessProfile.Landmark || '',
        pincode: businessProfile.pincode || businessProfile.Pincode || '',
        mobile: businessProfile.mobile || businessProfile.Mobile || '',
        altMobile: businessProfile.altMobile || businessProfile.mobile2 || businessProfile.Mobile2 || '',
        email: businessProfile.email || businessProfile.emailid || businessProfile.EmailID || '',
        gstin: businessProfile.gstin || businessProfile.GSTIN || '',
        bankName: businessProfile.bankName || businessProfile.bankaccountname || businessProfile.BankAccountName || '',
        accountNo: businessProfile.accountNo || businessProfile.accountno || businessProfile.AccountNo || '',
        ifsc: businessProfile.ifsc || businessProfile.IFSC || '',
      } : { name: 'MK AGENCY', address: '6, 1st cross, Puducherry', mobile: '+91 9791858965', gstin: '34CEBPG0848B1Z5' }, client: selectedClient || { clientname: '---' }, billNo: billNo || 'DRAFT', billDate: billDate, withGST: gstEnabled, items: items.map(it => {
        const qty = parseFloat(it.qty) || 0;
        const piecesPerBox = parseFloat(it.pieces) || 0;
        const price = parseFloat(it.price) || 0;
        const totalUnits = qty * piecesPerBox;
        const baseAmount = totalUnits * price;

        const discPerc = parseFloat(discount) || 0;
        const discAmount = baseAmount * (discPerc / 100);
        const taxable = baseAmount - discAmount;

        const gstRate = gstEnabled ? parseFloat(billGST) : 0;
        const gstTotal = taxable * (gstRate / 100);
        const finalAmount = taxable + gstTotal;

        return {
          name: it.name || '---',
          hsn: it.hsn || '-',
          box: it.qty || '0',
          pieces: it.pieces, // Units per box
          price: it.price,  // Price per unit
          disc: discPerc > 0 ? `${discPerc}% - ₹${discAmount.toFixed(2)}` : '-',
          cgst: (gstTotal / 2).toFixed(2),
          sgst: (gstTotal / 2).toFixed(2),
          rate: (finalAmount / (totalUnits || 1)).toFixed(2),
          amount: finalAmount.toFixed(2)
        };
      }), summary: { totalQty: items.length.toString(), totalAmount: calculateTotal().toFixed(2), beforeTax: calculateSubtotal().toFixed(2), afterTax: calculateTotal().toFixed(2) }, docType: docType }} /></View></ScrollView></MotiView></View></Modal>
      <Modal visible={showConfirmModal} transparent>
        <View style={styles.modalOverlay}>
          <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={[styles.webPreviewModal, { width: 500, height: 'auto', padding: 40 }]}>
            <View style={{ alignItems: 'center', marginBottom: 30 }}>
              <View style={[styles.webAddBtn, { width: 64, height: 64, borderRadius: 32, marginBottom: 20 }]}><ShieldCheck size={32} color="#fff" /></View>
              <TText style={{ fontSize: 24, fontWeight: '900' }}>Confirm Transaction</TText>
              <TText style={{ textAlign: 'center', opacity: 0.6, marginTop: 10 }}>Are you sure you want to generate this {docType}? This will finalize the bill and update stock levels.</TText>
            </View>

            <TView style={{ backgroundColor: colors.surfaceSecondary, padding: 25, borderRadius: 20, marginBottom: 30 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <TText style={{ opacity: 0.6, fontSize: 13 }}>Bill Reference</TText>
                <TText style={{ fontWeight: '800' }}>{billNo}</TText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <TText style={{ opacity: 0.6, fontSize: 13 }}>Bill Date</TText>
                <TText style={{ fontWeight: '800' }}>{billDate}</TText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <TText style={{ opacity: 0.6, fontSize: 13 }}>Tax Configuration</TText>
                <TText style={{ fontWeight: '800', color: COLORS.primary }}>{gstEnabled ? `${billGST}% GST` : 'Non-GST'}</TText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <TText style={{ opacity: 0.6, fontSize: 13 }}>Discount</TText>
                <TText style={{ fontWeight: '800', color: COLORS.danger }}>{discount || '0'}%</TText>
              </View>
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 15, opacity: 0.3 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <TText style={{ opacity: 0.6, fontSize: 13 }}>Payment Method</TText>
                <TText style={{ fontWeight: '800' }}>{paymentMethod}</TText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TText style={{ fontWeight: '700', fontSize: 15 }}>TOTAL PAYABLE</TText>
                <TText style={{ fontWeight: '900', color: COLORS.primary, fontSize: 22 }}>₹{calculateTotal().toLocaleString()}</TText>
              </View>
            </TView>

            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)} style={{ flex: 1, height: 54, borderRadius: 14, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' }}>
                <TText style={{ fontWeight: '800', opacity: 0.6 }}>Go Back</TText>
              </TouchableOpacity>
              <TouchableOpacity onPress={executeSave} style={{ flex: 1.5, height: 54, borderRadius: 14, overflow: 'hidden' }}>
                <LinearGradient colors={['#6366f1', '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <TText style={{ color: '#fff', fontWeight: '900' }}>Confirm & Save</TText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </MotiView>
        </View>
      </Modal>
    </WebLayout>
  );
};

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 40 },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  webPreviewModal: { width: '90%', height: '90%', borderRadius: 24, overflow: 'hidden' },
  previewHead: { height: 80, paddingHorizontal: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#eee' },
  webDropdown: { position: 'absolute', top: 55, left: 0, right: 0, zIndex: 100, borderRadius: 16, padding: 10, borderWidth: 1 },
  dropdownSearch: { height: 44, borderRadius: 10, paddingHorizontal: 12, marginBottom: 10 },
  dropdownOption: { padding: 12, borderRadius: 8 },
  payChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
});

export default Billing;
