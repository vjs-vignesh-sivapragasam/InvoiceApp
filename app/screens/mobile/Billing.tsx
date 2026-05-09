import { AnimatePresence, MotiView } from '@/components/MotiShim';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  Calendar,
  ChevronDown,
  ChevronRight,
  Eraser,
  Eye,
  Hash,
  Percent,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  User as UserIcon,
  X
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, RefreshControl, SafeAreaView, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppConfig } from '../../../components/AppConfigProvider';
import { Button } from '../../../components/Button';
import { useNotifications } from '../../../components/NotificationProvider';
import { SimpleDatePicker } from '../../../components/SimpleDatePicker';
import { Design1 } from '../../../components/templates/Design1';
import { TText, TView, useTheme } from '../../../components/ThemedUI';
import { db } from '../../../services/supabase';
import { COLORS, RADIUS, SHADOWS } from '../../../theme';

interface Client { clientid: number; clientname: string; gstin?: string; addressline1?: string; mobile?: string; }
interface Product { productid: number; productname: string; sellingprice: number; hsn?: string; incase?: number; optional1?: string; pieces?: number; }
interface Item {
  id: string; productid: number | null; name: string; qty: string;
  incase: string; pieces: string; price: string; hsn: string;
}

const MobileBilling = () => {
  const { colors, isDark } = useTheme();
  const { config, refreshConfig } = useAppConfig();
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
  const [gstEnabled, setGstEnabled] = useState(true);
  const [billNo, setBillNo] = useState('');
  const [billDate, setBillDate] = useState(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD format
  const [docType, setDocType] = useState<'invoice' | 'quotation'>('invoice');
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [isItemsExpanded, setIsItemsExpanded] = useState(true);
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT' | 'GPAY'>('CASH');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Use en-CA for stable YYYY-MM-DD in local time
      setBillDate(selectedDate.toLocaleDateString('en-CA'));
    }
  };

  const gstOptions = ['5', '2', '8', '9', '12', '18', '25', '40'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [c, p, nextBill] = await Promise.all([
        db.clients.getAll(),
        db.products.getWithStock(),
        db.billSeries.getNextBillNo(1)
      ]);
      setClients(c);
      setProducts(p);
      setBillNo(nextBill);
      const savedProfile = await AsyncStorage.getItem('business_profile');
      if (savedProfile) setBusinessProfile(JSON.parse(savedProfile));
    } catch (e) {
      console.error('Fetch error:', e);
      showToast('Connection issue', 'error');
    }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    resetForm(); // Clear all input fields on swipe down
    fetchInitialData();
  }, [fetchInitialData]);

  const addItem = () => { setItems([...items, { id: Math.random().toString(), productid: null, name: '', qty: '1', incase: '1', pieces: '1', price: '0', hsn: '' }]); setIsItemsExpanded(true); };
  const removeItem = (id: string) => items.length > 1 && setItems(items.filter(item => item.id !== id));

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(it => {
      if (it.id !== id) return it;
      let updated = { ...it, [field]: value };

      if (field === 'productid') {
        const p = products.find(x => x.productid === value);
        updated.productid = value; updated.name = p?.productname || ''; updated.price = p?.sellingprice?.toString() || '0'; updated.hsn = p?.hsn || ''; updated.incase = p?.incase?.toString() || '1';

        // Initial stock check on selection
        const availableStock = (p as any)?.currentStock || 0;
        if (availableStock <= 0) {
          showToast(`Warning: ${p?.productname} is out of stock!`, 'error');
        }
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
        }
      }

      updated.pieces = ((parseFloat(updated.qty) || 0) * (parseFloat(updated.incase) || 1)).toString();
      return updated;
    }));
  };

  const calculateSubtotal = () => items.reduce((acc, item) => acc + (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0), 0);
  const getCalculations = () => {
    const subtotal = calculateSubtotal();
    const discPerc = parseFloat(discount) || 0;
    const discAmount = subtotal * (discPerc / 100);
    const taxableAmount = subtotal - discAmount;

    const gstRate = gstEnabled ? parseFloat(billGST) : 0;
    const gstAmount = taxableAmount * (gstRate / 100);
    const cgstAmount = gstAmount / 2;
    const sgstAmount = gstAmount / 2;

    const adjustmentVal = parseFloat(adjustment) || 0;
    const totalAmount = taxableAmount + gstAmount + adjustmentVal;

    return {
      subtotal,
      discPerc,
      discAmount,
      taxableAmount,
      gstRate,
      gstAmount,
      cgstAmount,
      sgstAmount,
      adjustmentVal,
      totalAmount
    };
  };

  const calculateTotal = () => getCalculations().totalAmount;

  const handleSave = () => {
    if (!selectedClient) return showToast('Please select a client', 'error');
    setConfirmModalVisible(true);
  };

  const executeSave = async () => {
    setConfirmModalVisible(false);
    setLoading(true);
    try {
      const calcs = getCalculations();
      await db.billing.create({
        clientid: selectedClient!.clientid,
        billno: billNo,
        totalamount: calcs.totalAmount,
        taxableamount: calcs.taxableAmount,
        gstamount: calcs.gstAmount,
        cgstamount: calcs.cgstAmount,
        sgstamount: calcs.sgstAmount,
        disperc: calcs.discPerc,
        discamount: calcs.discAmount,
        isactive: true,
        billdate: billDate,
        optional1: discount,
        paymentmethod: paymentMethod,
        iswithgst: gstEnabled,
        productid: items[0].productid,
        box: parseInt(items[0].incase) || 0,
        pieces: parseInt(items[0].pieces) || 0,
        rate: parseFloat(items[0].price) || 0,
        optional2: adjustment // Storing adjustment in optional2 for now
      });

      // 📦 Stock Reduction Logic
      for (const item of items) {
        if (item.productid) {
          const product = products.find(p => p.productid === item.productid);
          if (product) {
            const currentStock = (product as any).currentStock || 0;
            const newStock = currentStock - (parseInt(item.qty) || 0);

            // Update product stock in logs
            await db.inventory.logMovement({
              productid: item.productid,
              movementtype: 'sale',
              quantitymoved: parseInt(item.qty) || 0,
              previousstock: currentStock,
              newstock: newStock,
              referenceno: billNo,
              notes: `Sale to ${selectedClient!.clientname}`
            });
          }
        }
      }

      // Increment the bill series count globally
      await db.billSeries.incrementCount(1);

      // ✅ Refresh internal config to get the latest series count
      await refreshConfig();

      showToast(`${docType.toUpperCase()} Saved!`);

      // 🔄 Clear inputs for next bill
      resetForm();

      // Fetch new bill number after increment
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
    setItems([{ id: Math.random().toString(), productid: null, name: '', qty: '1', incase: '1', pieces: '1', price: '0', hsn: '' }]);
    setAdjustment('0');
    setDiscount('0');
    setGstEnabled(true);
    setPaymentMethod('CASH');
    setIsHeaderExpanded(true); // Open header for next client
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: colors.background }]}>
      <TView style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ChevronRight size={22} color={colors.text} style={{ transform: [{ rotate: '180deg' }] }} /></TouchableOpacity>
        <TText variant="subtitle" style={{ fontWeight: '900', letterSpacing: -0.2 }}>Billing</TText>
        <TouchableOpacity onPress={resetForm} style={styles.backBtn}>
          <Eraser size={22} color={COLORS.danger} />
        </TouchableOpacity>
      </TView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}>
        {/* DOC TYPE SELECTOR */}
        <TView style={[styles.typeSwitcher, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
          <TouchableOpacity onPress={() => setDocType('invoice')} style={[styles.typeBtn, docType === 'invoice' && styles.activeTypeBtn]}>
            <TText style={[styles.typeLabel, docType === 'invoice' && { color: COLORS.primary, fontWeight: '900' }]}>INVOICE</TText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDocType('quotation')} style={[styles.typeBtn, docType === 'quotation' && styles.activeTypeBtn]}>
            <TText style={[styles.typeLabel, docType === 'quotation' && { color: COLORS.primary, fontWeight: '900' }]}>QUOTATION</TText>
          </TouchableOpacity>
        </TView>

        {/* CLIENT DETAILS SECTION - MATCHED TO PARTICULARS DESIGN */}
        <TView style={styles.headerLayout}>
          <TouchableOpacity onPress={() => setIsHeaderExpanded(!isHeaderExpanded)} activeOpacity={0.7} style={styles.gridTitleBar}>
            <TView style={styles.gridTitleLeft}>
              <UserIcon size={18} color={COLORS.primary} />
              <TText style={styles.gridTitleText}>CLIENT DETAILS</TText>
            </TView>
            <TView style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              {!isHeaderExpanded && selectedClient && (
                <TText style={{ fontSize: 10, fontWeight: '700', color: COLORS.primary, opacity: 0.8 }}>
                  {selectedClient.clientname.split(' ')[0]}... • {billNo.split('-').pop()}
                </TText>
              )}
              <ChevronDown size={20} color={colors.textSecondary} style={{ transform: [{ rotate: isHeaderExpanded ? '180deg' : '0deg' }] }} />
            </TView>
          </TouchableOpacity>

          <AnimatePresence>
            {isHeaderExpanded && (
              <MotiView from={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'timing', duration: 250 }} style={{ overflow: 'hidden' }}>
                <TView style={[styles.standardCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : colors.card, borderColor: colors.border }]}>
                  <TouchableOpacity onPress={() => { setSearchQuery(''); setClientModalVisible(true); }} style={[styles.compactPicker, { borderColor: colors.border }]}>
                    <TText style={{ fontWeight: '700', fontSize: 13, color: selectedClient ? colors.text : colors.textSecondary }}>{selectedClient ? selectedClient.clientname : 'Tap to select client...'}</TText>
                    <Search size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TView style={styles.compactMetaGrid}>
                    <TView style={[styles.compactMetaBox, { opacity: 0.6 }]}><Hash size={14} color={COLORS.primary} /><TText style={styles.compactMetaVal}>{billNo}</TText></TView>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.compactMetaBox}>
                      <Calendar size={14} color={COLORS.primary} />
                      <TText style={styles.compactMetaVal}>{billDate}</TText>
                    </TouchableOpacity>
                  </TView>
                  <SimpleDatePicker
                    visible={showDatePicker}
                    value={billDate}
                    onClose={() => setShowDatePicker(false)}
                    onChange={(date) => {
                      setBillDate(date);
                      setShowDatePicker(false);
                    }}
                  />
                  <TView style={styles.taxSection}>
                    <TView style={styles.taxSectionHead}>
                      <TView style={{ flexDirection: 'row', alignItems: 'center' }}><ShieldCheck size={16} color={COLORS.primary} /><TText style={{ marginLeft: 8, fontWeight: '800', fontSize: 12 }}>Tax Calculation</TText></TView>
                      <TouchableOpacity onPress={() => setGstEnabled(!gstEnabled)} style={[styles.swtBase, { backgroundColor: gstEnabled ? COLORS.primary : 'rgba(0,0,0,0.1)' }]}><MotiView animate={{ translateX: gstEnabled ? 18 : 0 }} transition={{ type: 'timing', duration: 150 }} style={styles.swtKnob} /></TouchableOpacity>
                    </TView>
                    {gstEnabled ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>{gstOptions.map(opt => (<TouchableOpacity key={opt} onPress={() => setBillGST(opt)} style={[styles.gstOptionChip, billGST === opt && { backgroundColor: COLORS.primary }]}><TText style={[styles.gstOptionText, billGST === opt && { color: '#fff' }]}>{opt}% GST</TText></TouchableOpacity>))}</ScrollView>
                    ) : <View style={styles.taxOff}><TText style={styles.taxOffText}>Non-GST Transaction</TText></View>}
                  </TView>
                </TView>
              </MotiView>
            )}
          </AnimatePresence>
        </TView>

        {/* PARTICULARS GRID */}
        <TView style={styles.particularsSection}>
          <TouchableOpacity onPress={() => setIsItemsExpanded(!isItemsExpanded)} style={styles.gridTitleBar}>
            <TView style={styles.gridTitleLeft}>
              <ShoppingBag size={18} color={COLORS.primary} />
              <TText style={styles.gridTitleText}>PARTICULARS ({items.length})</TText>
            </TView>
            <TView style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              <TouchableOpacity onPress={addItem} style={styles.addCta}><Plus size={16} color="#fff" /></TouchableOpacity>
              <ChevronDown size={20} color={colors.textSecondary} style={{ transform: [{ rotate: isItemsExpanded ? '180deg' : '0deg' }] }} />
            </TView>
          </TouchableOpacity>

          <AnimatePresence>
            {isItemsExpanded && (
              <MotiView from={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'timing', duration: 250 }} style={{ overflow: 'hidden' }}>
                <View style={{ paddingTop: 10 }}>
                  {items.map((item, index) => {
                    const p = products.find(x => x.productid === item.productid);
                    const isCritical = p && ((p as any).currentStock < 10);
                    return (
                      <TView key={item.id} style={[styles.lineCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#fff', borderColor: isCritical ? COLORS.danger : colors.border }]}>
                        {isCritical && (
                          <TView style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: COLORS.danger + '10', padding: 4, borderRadius: 6 }}>
                            <AlertTriangle size={12} color={COLORS.danger} />
                            <TText style={{ color: COLORS.danger, fontSize: 10, fontWeight: '900', marginLeft: 6 }}>CRITICAL LOW STOCK LEVEL ({(p as any).currentStock})</TText>
                          </TView>
                        )}
                        <TView style={styles.lineHeader}>
                          <View style={[styles.lineIdx, { backgroundColor: COLORS.primary + '15' }]}><TText style={{ fontSize: 11, fontWeight: '900', color: COLORS.primary }}>{index + 1}</TText></View>
                          <TouchableOpacity onPress={() => { setSearchQuery(''); setActiveItemIndex(index); setProductModalVisible(true); }} style={[styles.lineProductSelect, { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.08)' : 'rgba(129, 140, 248, 0.04)' }]}><TText numberOfLines={1} style={[styles.lineProductName, !item.name && { color: colors.textSecondary }]}>{item.name || 'Select Product...'}</TText></TouchableOpacity>
                          <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.lineRemove}><Trash2 size={18} color={COLORS.danger} /></TouchableOpacity>
                        </TView>
                        <TView style={styles.lineDataGrid}>
                          <View style={styles.lineGridCell}><TText style={styles.lineCellLabel}>INCASE</TText><TView style={styles.lineCellVal}><TText style={styles.lineCellValTxt}>{item.incase}</TText></TView></View>
                          <View style={styles.lineGridCell}><TText style={styles.lineCellLabel}>PIECES</TText><TView style={styles.lineCellVal}><TText style={styles.lineCellValTxt}>{item.pieces}</TText></TView></View>
                          <View style={styles.lineGridCell}><TText style={styles.lineCellLabel}>RATE</TText><TView style={styles.lineCellVal}><TText style={styles.lineCellValTxt}>₹{item.price}</TText></TView></View>
                          <View style={styles.lineGridCell}><TText style={styles.lineCellLabel}>HSN</TText><TView style={styles.lineCellVal}><TText style={styles.lineCellValTxt}>{item.hsn || '-'}</TText></TView></View>
                        </TView>
                        <TView style={styles.lineFooterAction}>
                          <TView style={{ flex: 1 }}><TText style={styles.lineCellLabel}>QTY (BOX)</TText><TextInput value={item.qty} onChangeText={v => updateItem(item.id, 'qty', v)} keyboardType="numeric" style={[styles.lineQtyInput, { color: isDark ? '#fff' : '#000', borderColor: isCritical ? COLORS.danger : COLORS.primary }]} /></TView>
                          <TView style={{ flex: 1.5 }}><TText style={styles.lineCellLabel}>ITEM TOTAL</TText><TView style={[styles.lineTotalBack, { backgroundColor: COLORS.primary + '08' }]}><TText style={styles.lineTotalValue}>₹{((parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0)).toLocaleString('en-IN')}</TText></TView></TView>
                        </TView>
                      </TView>
                    );
                  })}
                </View>
              </MotiView>
            )}
          </AnimatePresence>
        </TView>

        <TView style={[styles.summaryPane, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.card, borderColor: colors.border }]}>
          <TView style={styles.summaryLine}><Calculator size={18} color={COLORS.primary} /><TText style={styles.summaryText}>Round Off</TText><TextInput value={adjustment} onChangeText={setAdjustment} keyboardType="numeric" style={[styles.summaryInput, { color: colors.text }]} /></TView>
          <TView style={[styles.summaryLine, { marginTop: 12 }]}><Percent size={18} color={COLORS.primary} /><TText style={styles.summaryText}>Discount (%)</TText><TextInput value={discount} onChangeText={setDiscount} keyboardType="numeric" style={[styles.summaryInput, { color: COLORS.danger }]} /></TView>
        </TView>

        {/* PAYMENT METHOD SELECTOR */}
        <TView style={styles.paymentContainer}>
          <TText style={styles.gridTitleText}>PAYMENT METHOD</TText>
          <TView style={styles.paymentRow}>
            {['CASH', 'CREDIT', 'GPAY'].map((m: any) => (
              <TouchableOpacity
                key={m}
                onPress={() => setPaymentMethod(m)}
                style={[
                  styles.paymentChip,
                  { borderColor: colors.border },
                  paymentMethod === m && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                ]}
              >
                <TText style={[styles.paymentChipText, paymentMethod === m && { color: '#fff' }]}>{m}</TText>
              </TouchableOpacity>
            ))}
          </TView>
        </TView>
        <View style={{ height: 220 }} />
      </ScrollView>

      {/* REFACTORED FOOTER PANELS */}
      <MotiView from={{ translateY: 150 }} animate={{ translateY: 0 }} transition={{ type: 'spring', damping: 20 }} style={[styles.bottomTray, { backgroundColor: isDark ? '#0F172A' : '#fff', borderTopColor: colors.border }]}>
        <View style={styles.bottomTrayInner}>
          <View style={styles.billSummary}>
            <TText style={styles.billNetLabel}>NET PAYABLE</TText>
            <View style={styles.billTotalRow}><TText style={styles.billCurrency}>₹</TText><TText style={styles.billGrandTotal}>{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TText></View>
            <View style={styles.billBadgeRow}>
              <View style={[styles.billBadge, { backgroundColor: gstEnabled ? COLORS.success + '15' : 'rgba(0,0,0,0.05)' }]}><TText style={[styles.billBadgeText, { color: gstEnabled ? COLORS.success : colors.textSecondary }]}>{gstEnabled ? `${billGST}% GST INCL` : 'NO GST'}</TText></View>
              {parseFloat(discount) > 0 && <View style={styles.billDiscBadge}><TText style={styles.billDiscBadgeText}>{discount}% OFF</TText></View>}
            </View>
          </View>
          <View style={styles.billActionArea}>
            <TouchableOpacity onPress={() => setPreviewModalVisible(true)} style={[styles.billPreviewBtn, { backgroundColor: colors.surfaceSecondary }]}><Eye size={24} color={COLORS.primary} /></TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.billFinishBtn}><LinearGradient colors={['#6366F1', '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.billFinishGrad}>{loading ? <ActivityIndicator color="#fff" /> : (<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><TText style={styles.billFinishText}>FINISH</TText><ArrowRight size={20} color="#fff" /></View>)}</LinearGradient></TouchableOpacity>
          </View>
        </View>
      </MotiView>

      {/* MODALS */}
      <Modal visible={clientModalVisible} animationType="fade" transparent><TView style={styles.centeredModal}><MotiView from={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={[styles.modalSheet, { backgroundColor: colors.background }]}><TView style={[styles.modalTitleRow, { borderBottomColor: colors.border }]}><TText style={styles.modalTitle}>Select Client</TText><TouchableOpacity onPress={() => setClientModalVisible(false)}><X size={24} color={colors.text} /></TouchableOpacity></TView><TView style={{ padding: 15 }}><TView style={[styles.modalSearchBar, { backgroundColor: colors.surfaceSecondary }]}><Search size={18} color={colors.textSecondary} /><TextInput placeholder="Filter by name..." value={searchQuery} onChangeText={setSearchQuery} style={{ flex: 1, marginLeft: 10, color: colors.text }} /></TView></TView><FlatList data={clients.filter(c => c.clientname.toLowerCase().includes(searchQuery.toLowerCase()))} renderItem={({ item }) => (<TouchableOpacity onPress={() => { setSelectedClient(item); setClientModalVisible(false); }} style={[styles.modalItemRow, { borderBottomColor: colors.border }]}><View style={styles.modalItemIcon}><UserIcon size={20} color={COLORS.primary} /></View><TView style={{ flex: 1 }}><TText style={{ fontWeight: '800', fontSize: 15 }}>{item.clientname}</TText><TText variant="caption">{item.mobile || 'GST: ' + (item.gstin || 'None')}</TText></TView><ChevronRight size={18} color={colors.textSecondary} /></TouchableOpacity>)} /></MotiView></TView></Modal>
      <Modal visible={productModalVisible} animationType="fade" transparent><TView style={styles.centeredModal}><MotiView from={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={[styles.modalSheet, { backgroundColor: colors.background }]}><TView style={[styles.modalTitleRow, { borderBottomColor: colors.border }]}><TText style={styles.modalTitle}>Select Product</TText><TouchableOpacity onPress={() => setProductModalVisible(false)}><X size={24} color={colors.text} /></TouchableOpacity></TView><TView style={{ padding: 15 }}><TView style={[styles.modalSearchBar, { backgroundColor: colors.surfaceSecondary }]}><Search size={18} color={colors.textSecondary} /><TextInput placeholder="Filter by product..." value={searchQuery} onChangeText={setSearchQuery} style={{ flex: 1, marginLeft: 10, color: colors.text }} /></TView></TView><FlatList data={products.filter(p => p.productname.toLowerCase().includes(searchQuery.toLowerCase()))} renderItem={({ item }) => {
        const availableStock = (item as any).currentStock || 0;
        const isLow = availableStock < 10;
        return (
          <TouchableOpacity onPress={() => { if (activeItemIndex !== null) updateItem(items[activeItemIndex].id, 'productid', item.productid); setProductModalVisible(false); }} style={[styles.modalItemRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.modalItemIcon, { backgroundColor: COLORS.primary + '10' }]}><ShoppingBag size={20} color={COLORS.primary} /></View>
            <TView style={{ flex: 1 }}>
              <TText style={{ fontWeight: '800', fontSize: 15 }}>{item.productname}</TText>
              <TText variant="caption">₹{item.sellingprice} | HSN: {item.hsn || '-'}</TText>
            </TView>
            <TView style={{ alignItems: 'flex-end' }}>
              <TView style={{ backgroundColor: isLow ? COLORS.danger + '15' : COLORS.success + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                <TText style={{ fontSize: 10, fontWeight: '900', color: isLow ? COLORS.danger : COLORS.success }}>Stock: {availableStock}</TText>
              </TView>
              {isLow && <TText style={{ fontSize: 8, color: COLORS.danger, fontWeight: '800', marginTop: 4 }}>LOW STOCK</TText>}
            </TView>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        );
      }} /></MotiView></TView></Modal>
      <Modal visible={previewModalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <TView style={[styles.modalTitleRow, { borderBottomColor: colors.border }]}>
            <TText style={{ fontWeight: '900' }}>INVOICE PREVIEW</TText>
            <TouchableOpacity onPress={() => setPreviewModalVisible(false)}><X size={24} color={colors.text} /></TouchableOpacity>
          </TView>
          <ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TView style={styles.previewBox}>
                <Design1
                  data={{
                    business: businessProfile || {},
                    client: selectedClient || { clientname: 'Guest Client' },
                    billNo: billNo,
                    billDate: billDate,
                    withGST: gstEnabled,
                    docType: docType,
                    items: items.map(it => {
                      const qty = parseFloat(it.qty) || 0;
                      const basePrice = parseFloat(it.price) || 0;
                      const lineSubtotal = qty * basePrice;

                      // Apply bill-level discount proportionally per line
                      const discPerc = parseFloat(discount) || 0;
                      const discAmount = lineSubtotal * (discPerc / 100);
                      const taxableLineAmount = lineSubtotal - discAmount;

                      // GST on taxable amount
                      const gstRate = gstEnabled ? parseFloat(billGST) : 0;
                      const lineTax = taxableLineAmount * (gstRate / 100);
                      const cgst = lineTax / 2;
                      const sgst = lineTax / 2;

                      // Net rate = (taxable per unit) + (tax per unit)
                      const netRatePerUnit = qty > 0 ? (taxableLineAmount + lineTax) / qty : 0;

                      return {
                        name: it.name || '---',
                        hsn: it.hsn || '---',
                        box: it.qty,
                        pieces: it.pieces,
                        price: basePrice.toFixed(2),
                        disc: discPerc > 0 ? `${discPerc}% - ${discAmount.toFixed(2)}` : '0% - 0.00',
                        cgst: cgst.toFixed(2),
                        sgst: sgst.toFixed(2),
                        rate: netRatePerUnit.toFixed(2),
                        amount: (taxableLineAmount + lineTax).toFixed(2)
                      };
                    }),
                    summary: (() => {
                      const calcs = getCalculations();
                      return {
                        totalQty: items.reduce((acc, it) => acc + (parseFloat(it.qty) || 0), 0).toString(),
                        totalAmount: calcs.totalAmount.toFixed(2),
                        beforeTax: calcs.taxableAmount.toFixed(2),
                        afterTax: calcs.totalAmount.toFixed(2),
                      };
                    })()
                  }}
                />
              </TView>
            </ScrollView>
            <TView style={{ padding: 25 }}>
              <Button title="DISMISS PREVIEW" onPress={() => setPreviewModalVisible(false)} style={{ backgroundColor: COLORS.primary, height: 50, borderRadius: 12 }} />
            </TView>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <TView style={styles.centeredModal}>
          <MotiView from={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={[styles.modalSheet, { backgroundColor: colors.background, height: 'auto', padding: 25 }]}>
            <TView style={{ alignItems: 'center', marginBottom: 20 }}>
              <TView style={[styles.modalItemIcon, { width: 60, height: 60, borderRadius: 30, marginBottom: 15 }]}><ShieldCheck size={32} color={COLORS.primary} /></TView>
              <TText style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>Confirm Transaction</TText>
              <TText style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>Are you sure you want to generate this {docType}? This will reduce stock from inventory.</TText>
            </TView>

            <TView style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', padding: 15, borderRadius: 16, marginBottom: 25 }}>
               <TView style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <TText style={{ fontSize: 11, opacity: 0.6 }}>Bill Number</TText>
                  <TText style={{ fontSize: 11, fontWeight: '800' }}>{billNo}</TText>
               </TView>
               <TView style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <TText style={{ fontSize: 11, opacity: 0.6 }}>Billing Date</TText>
                  <TText style={{ fontSize: 11, fontWeight: '800' }}>{billDate}</TText>
               </TView>
               <TView style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <TText style={{ fontSize: 11, opacity: 0.6 }}>Tax Details</TText>
                  <TText style={{ fontSize: 11, fontWeight: '800', color: COLORS.primary }}>{gstEnabled ? `${billGST}% GST Included` : 'Non-GST'}</TText>
               </TView>
               <TView style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <TText style={{ fontSize: 11, opacity: 0.6 }}>Discount applied</TText>
                  <TText style={{ fontSize: 11, fontWeight: '800', color: COLORS.danger }}>{discount || '0'}%</TText>
               </TView>
               <TView style={{ height: 1, backgroundColor: colors.border, marginVertical: 8, opacity: 0.2 }} />
               <TView style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <TText style={{ fontSize: 11, opacity: 0.6 }}>Payment Mode</TText>
                  <TText style={{ fontSize: 11, fontWeight: '800' }}>{paymentMethod}</TText>
               </TView>
               <TView style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TText style={{ fontSize: 13, fontWeight: '700' }}>NET PAYABLE</TText>
                  <TText style={{ fontSize: 16, fontWeight: '900', color: COLORS.primary }}>₹{calculateTotal().toLocaleString()}</TText>
               </TView>
            </TView>

            <TView style={{ flexDirection: 'row', gap: 12 }}>
               <TouchableOpacity onPress={() => setConfirmModalVisible(false)} style={{ flex: 1, height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' }}>
                  <TText style={{ fontWeight: '800', opacity: 0.6 }}>Cancel</TText>
               </TouchableOpacity>
               <TouchableOpacity onPress={executeSave} style={{ flex: 1.5, height: 50, borderRadius: 12, overflow: 'hidden' }}>
                  <LinearGradient colors={['#6366F1', '#4F46E5']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                     <TText style={{ color: '#fff', fontWeight: '900' }}>Confirm & Finish</TText>
                  </LinearGradient>
               </TouchableOpacity>
            </TView>
          </MotiView>
        </TView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, marginTop: 40 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  scrollContent: { paddingBottom: 150 },
  typeSwitcher: { flexDirection: 'row', padding: 5, borderRadius: 16, marginHorizontal: 20, marginBottom: 15, marginTop: 15 },
  typeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTypeBtn: { backgroundColor: '#fff', ...SHADOWS.sm },
  typeLabel: { fontSize: 11, fontWeight: '800', color: COLORS.primary + '50' },
  headerLayout: { marginHorizontal: 0, marginTop: 10 },
  standardCard: { marginHorizontal: 16, padding: 18, borderRadius: RADIUS.xl, borderWidth: 1.2, gap: 14 },
  compactPicker: { height: 50, borderRadius: 12, borderWidth: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: 'rgba(0,0,0,0.02)' },
  compactMetaGrid: { flexDirection: 'row', gap: 12 },
  compactMetaBox: { flex: 1, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.03)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  compactMetaVal: { marginLeft: 10, fontSize: 13, fontWeight: '800' },
  taxSection: { padding: 12, backgroundColor: 'rgba(129, 140, 248, 0.04)', borderRadius: 16 },
  taxSectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  swtBase: { width: 44, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
  swtKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  gstOptionChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, marginRight: 10, backgroundColor: 'rgba(0,0,0,0.06)' },
  gstOptionText: { fontSize: 11, fontWeight: '900', color: COLORS.primary },
  taxOff: { marginTop: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 10, alignItems: 'center' },
  taxOffText: { fontSize: 11, fontWeight: '800', opacity: 0.5 },
  particularsSection: { marginTop: 20 },
  gridTitleBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginBottom: 12 },
  gridTitleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gridTitleText: { fontSize: 12, fontWeight: '900', color: COLORS.primary, letterSpacing: 0.5 },
  addCta: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.sm },
  lineCard: { marginHorizontal: 16, padding: 18, borderRadius: RADIUS.xl, borderWidth: 1.2, marginBottom: 14 },
  lineHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  lineIdx: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  lineProductSelect: { flex: 1, marginHorizontal: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderBottomWidth: 1.5, borderBottomColor: COLORS.primary + '20' },
  lineProductName: { fontWeight: '800', fontSize: 15 },
  lineRemove: { padding: 8 },
  lineDataGrid: { flexDirection: 'row', gap: 10 },
  lineGridCell: { flex: 1, alignItems: 'center' },
  lineCellLabel: { fontSize: 8, fontWeight: '900', color: COLORS.primary, opacity: 0.6, marginBottom: 8, letterSpacing: 0.5 },
  lineCellVal: { width: '100%', height: 40, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.04)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  lineCellValTxt: { fontSize: 12, fontWeight: '800', opacity: 0.8 },
  lineFooterAction: { flexDirection: 'row', gap: 12, marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.03)' },
  lineQtyInput: { height: 46, borderRadius: 12, borderWidth: 1.5, textAlign: 'center', fontWeight: '900', fontSize: 18, backgroundColor: 'rgba(129, 140, 248, 0.03)' },
  lineTotalBack: { height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary + '10' },
  lineTotalValue: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  summaryPane: { marginHorizontal: 16, marginTop: 10, padding: 18, borderRadius: RADIUS.xl, borderWidth: 1.2 },
  summaryLine: { flexDirection: 'row', alignItems: 'center' },
  summaryText: { flex: 1, marginLeft: 12, fontWeight: '800', fontSize: 13, opacity: 0.7 },
  summaryInput: { width: 90, height: 40, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.03)', textAlign: 'right', paddingHorizontal: 12, fontWeight: '900', fontSize: 14 },
  bottomTray: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1.5 },
  bottomTrayInner: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  billSummary: { flex: 1.2 },
  billNetLabel: { fontSize: 10, fontWeight: '900', opacity: 0.5, letterSpacing: 1, marginBottom: 4 },
  billTotalRow: { flexDirection: 'row', alignItems: 'baseline' },
  billCurrency: { fontSize: 18, fontWeight: '800', color: COLORS.primary, marginRight: 2, marginBottom: 4 },
  billGrandTotal: { fontSize: 32, fontWeight: '900', color: COLORS.primary, letterSpacing: -1 },
  billBadgeRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  billBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  billBadgeText: { fontSize: 9, fontWeight: '900' },
  billDiscBadge: { backgroundColor: COLORS.danger + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  billDiscBadgeText: { color: COLORS.danger, fontSize: 9, fontWeight: '900' },
  billActionArea: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'flex-end' },
  billPreviewBtn: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', ...SHADOWS.sm },
  billFinishBtn: { flex: 1, height: 52, borderRadius: 16, overflow: 'hidden', ...SHADOWS.md },
  billFinishGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  billFinishText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  centeredModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalSheet: { width: '100%', height: '70%', borderRadius: 30, overflow: 'hidden' },
  modalTitleRow: { height: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, borderBottomWidth: 1 },
  modalTitle: { fontWeight: '900', fontSize: 18 },
  modalSearchBar: { height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  modalItemRow: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, gap: 15 },
  modalItemIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(129, 140, 248, 0.08)', justifyContent: 'center', alignItems: 'center' },
  previewBox: { width: 850, backgroundColor: '#fff', borderRadius: 12 },
  paymentContainer: { marginHorizontal: 20, marginTop: 25 },
  paymentRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  paymentChip: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  paymentChipText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
});

export default MobileBilling;
