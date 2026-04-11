import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { Button } from '../../../components/Button';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../../theme';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  Eye, 
  FileText, 
  ChevronRight,
  Calculator,
  CornerDownRight
} from 'lucide-react-native';

const MobileBilling = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState([{ id: '1', name: '', qty: '1', price: '0' }]);
  const [adjustment, setAdjustment] = useState('0');

  const today = new Date().toLocaleDateString('en-US', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  });

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), name: '', qty: '1', price: '0' }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const calculateTotal = () => {
    const sub = items.reduce((acc, item) => acc + (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0), 0);
    return sub + (parseFloat(adjustment) || 0);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <TView style={[styles.header, { borderBottomColor: colors.border }]}>
        <TText variant="subtitle">New Bill</TText>
        <TView style={styles.headerBtns}>
          <TouchableOpacity style={styles.iconBtn}><Eye size={20} color={colors.text} /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}><FileText size={20} color={COLORS.secondary} /></TouchableOpacity>
        </TView>
      </TView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Date & Client Card */}
        <TView style={[styles.card, { backgroundColor: colors.card, ...SHADOWS.sm }]}>
          <TView style={styles.infoRow}>
            <Calendar size={18} color={COLORS.primary} />
            <TText style={{ marginLeft: 12, fontWeight: '600' }}>{today}</TText>
          </TView>
          <TView style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.infoRow}>
            <User size={18} color={COLORS.primary} />
            <TText style={{ marginLeft: 12, flex: 1, color: colors.textSecondary }}>Select Customer</TText>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </TView>

        <TView style={styles.sectionHeader}>
          <TText variant="caption" style={{ fontWeight: '700' }}>BILL ITEMS</TText>
          <TouchableOpacity onPress={addItem} style={styles.addSmall}>
            <Plus size={14} color={COLORS.primary} />
            <TText style={{ color: COLORS.primary, fontWeight: '700', fontSize: 12, marginLeft: 4 }}>ADD</TText>
          </TouchableOpacity>
        </TView>

        <AnimatePresence>
          {items.map((item, index) => (
            <MotiView
              key={item.id}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={[styles.itemCard, { backgroundColor: colors.card, ...SHADOWS.sm }]}
            >
              <TView style={styles.itemHeader}>
                <TText style={{ fontWeight: '700', color: COLORS.primary }}>Item #{index + 1}</TText>
                <TouchableOpacity onPress={() => removeItem(item.id)}><Trash2 size={18} color={COLORS.danger} /></TouchableOpacity>
              </TView>
              <TextInput 
                placeholder="Product name" 
                value={item.name}
                onChangeText={(v) => updateItem(item.id, 'name', v)}
                style={[styles.mobileInput, { color: colors.text, backgroundColor: colors.surfaceSecondary }]} 
              />
              <TView style={styles.row}>
                <TView style={{ flex: 1, marginRight: 10 }}>
                  <TText variant="caption" style={styles.miniLabel}>QTY</TText>
                  <TextInput 
                    value={item.qty}
                    onChangeText={(v) => updateItem(item.id, 'qty', v)}
                    keyboardType="numeric"
                    style={[styles.mobileInput, { color: colors.text, backgroundColor: colors.surfaceSecondary }]} 
                  />
                </TView>
                <TView style={{ flex: 2 }}>
                  <TText variant="caption" style={styles.miniLabel}>PRICE</TText>
                  <TextInput 
                    value={item.price}
                    onChangeText={(v) => updateItem(item.id, 'price', v)}
                    keyboardType="numeric"
                    style={[styles.mobileInput, { color: colors.text, backgroundColor: colors.surfaceSecondary }]} 
                  />
                </TView>
              </TView>
            </MotiView>
          ))}
        </AnimatePresence>

        <TView style={[styles.card, { backgroundColor: colors.card, marginTop: 10, ...SHADOWS.sm }]}>
          <TView style={styles.adjustmentRow}>
            <TView style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Calculator size={18} color={colors.textSecondary} />
              <TText style={{ marginLeft: 8 }}>Manual Adjustment</TText>
            </TView>
            <TextInput 
              value={adjustment}
              onChangeText={setAdjustment}
              keyboardType="numbers-and-punctuation"
              style={[styles.adjustInput, { color: colors.text, backgroundColor: colors.surfaceSecondary }]} 
            />
          </TView>
        </TView>
      </ScrollView>

      <TView style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TView style={styles.totalSummary}>
          <TText style={{ color: colors.textSecondary }}>Grand Total</TText>
          <TText style={{ fontSize: 24, fontWeight: '800', color: COLORS.primary }}>
            ${calculateTotal().toFixed(2)}
          </TText>
        </TView>
        <TView style={styles.footerBtns}>
           <TouchableOpacity style={[styles.quotationBtn, { borderColor: COLORS.secondary }]}>
              <TText style={{ color: COLORS.secondary, fontWeight: '700' }}>Quotation</TText>
           </TouchableOpacity>
           <Button title="Save Bill" onPress={() => {}} style={{ flex: 2, height: 50 }} />
        </TView>
      </TView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  },
  headerBtns: {
    flexDirection: 'row',
    gap: 16,
  },
  iconBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    padding: 16,
    borderRadius: RADIUS.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  addSmall: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemCard: {
    padding: 16,
    borderRadius: RADIUS.lg,
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mobileInput: {
    height: 48,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
  },
  miniLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
    marginLeft: 4,
    color: 'gray',
  },
  adjustmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adjustInput: {
    width: 80,
    height: 40,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 14,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
  },
  totalSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  quotationBtn: {
    flex: 1,
    height: 50,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MobileBilling;
