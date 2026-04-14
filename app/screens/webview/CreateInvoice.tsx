import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from '@/components/MotiShim';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { Button } from '../../../components/Button';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../../theme';
import { ChevronLeft, Plus, Trash2, Calendar, User, Package, Eye, FileText, Download } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const CreateInvoice = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState([{ id: '1', name: 'UI/UX Design Services', quantity: '1', price: '1200' }]);
  const [client, setClient] = useState('Acme Corp');

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), name: '', quantity: '1', price: '0' }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => (acc + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)), 0);
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  return (
    <TView style={styles.container}>
      {/* Editor Side */}
      <TView style={[styles.editorSide, { borderRightColor: colors.border }]}>
        <TView style={styles.editorHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <TView>
            <TText variant="subtitle">Invoice Creation</TText>
            <TText variant="caption">Drafting INV-2026-001</TText>
          </TView>
        </TView>

        <ScrollView contentContainerStyle={styles.editorContent} showsVerticalScrollIndicator={false}>
          <TView style={styles.formGroup}>
            <TText variant="body" style={styles.formLabel}>Client Name</TText>
            <TView style={[styles.inputContainer, { backgroundColor: colors.surfaceSecondary }]}>
              <User size={18} color={colors.textSecondary} />
              <TextInput value={client} onChangeText={setClient} style={[styles.input, { color: colors.text }]} />
            </TView>
          </TView>

          <TView style={styles.row}>
            <TView style={[styles.formGroup, { flex: 1 }]}>
              <TText variant="body" style={styles.formLabel}>Issue Date</TText>
              <TView style={[styles.inputContainer, { backgroundColor: colors.surfaceSecondary }]}>
                <Calendar size={18} color={colors.textSecondary} />
                <TText style={{ marginLeft: 12 }}>Apr 10, 2026</TText>
              </TView>
            </TView>
            <TView style={[styles.formGroup, { flex: 1, marginLeft: 20 }]}>
              <TText variant="body" style={styles.formLabel}>Due Date</TText>
              <TView style={[styles.inputContainer, { backgroundColor: colors.surfaceSecondary }]}>
                <Calendar size={18} color={colors.textSecondary} />
                <TText style={{ marginLeft: 12 }}>Apr 24, 2026</TText>
              </TView>
            </TView>
          </TView>

          <TView style={styles.itemsHeader}>
            <TText variant="subtitle">Line Items</TText>
            <TouchableOpacity onPress={addItem} style={[styles.addItemBtn, { backgroundColor: COLORS.primary }]}>
              <Plus size={16} color="#fff" />
              <TText style={{ color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 6 }}>Add Item</TText>
            </TouchableOpacity>
          </TView>

          <TView style={styles.itemList}>
            <AnimatePresence>
              {items.map((item, i) => (
                <MotiView 
                  key={item.id}
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <TView style={{ flex: 1 }}>
                    <TText variant="caption" style={{ marginBottom: 4 }}>Description</TText>
                    <TextInput 
                      value={item.name} 
                      onChangeText={(val) => updateItem(item.id, 'name', val)}
                      style={[styles.miniInput, { color: colors.text, backgroundColor: colors.surfaceSecondary }]} 
                    />
                  </TView>
                  <TView style={{ width: 80, marginLeft: 12 }}>
                    <TText variant="caption" style={{ marginBottom: 4 }}>Qty</TText>
                    <TextInput 
                      value={item.quantity} 
                      onChangeText={(val) => updateItem(item.id, 'quantity', val)}
                      style={[styles.miniInput, { color: colors.text, backgroundColor: colors.surfaceSecondary, textAlign: 'center' }]} 
                    />
                  </TView>
                  <TView style={{ width: 120, marginLeft: 12 }}>
                    <TText variant="caption" style={{ marginBottom: 4 }}>Price</TText>
                    <TextInput 
                      value={item.price} 
                      onChangeText={(val) => updateItem(item.id, 'price', val)}
                      style={[styles.miniInput, { color: colors.text, backgroundColor: colors.surfaceSecondary }]} 
                    />
                  </TView>
                  <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.trashBtn}>
                    <Trash2 size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </MotiView>
              ))}
            </AnimatePresence>
          </TView>
        </ScrollView>
      </TView>

      {/* Preview Side */}
      <TView style={[styles.previewSide, { backgroundColor: colors.surfaceSecondary }]}>
        <TView style={styles.previewHeader}>
          <TText variant="subtitle">Live Preview</TText>
          <TView style={styles.previewActions}>
            <TouchableOpacity style={styles.actionBtn}><Download size={18} color={colors.text} /></TouchableOpacity>
            <Button title="Save & Send" onPress={() => {}} style={{ height: 40, paddingHorizontal: 20 }} />
          </TView>
        </TView>

        <TView style={[styles.invoicePaper, { backgroundColor: '#fff', ...SHADOWS.lg }]}>
          <TView style={styles.paperHeader}>
            <TView>
              <TText style={{ fontSize: 24, fontWeight: '800', color: COLORS.primary }}>INVOICE</TText>
              <TText style={{ color: '#666', marginTop: 4 }}>#INV-2026-001</TText>
            </TView>
            <TView style={{ alignItems: 'flex-end' }}>
              <TText style={{ fontWeight: '700' }}>Invoicer Inc.</TText>
              <TText style={{ color: '#666' }}>123 Business Ave, Tech City</TText>
            </TView>
          </TView>

          <TView style={styles.paperClient}>
            <TView>
              <TText style={{ color: '#999', textTransform: 'uppercase', fontSize: 10, fontWeight: '700' }}>Bill To</TText>
              <TText style={{ fontSize: 16, fontWeight: '600', marginTop: 4 }}>{client || 'Client Name'}</TText>
            </TView>
            <TView style={{ alignItems: 'flex-end' }}>
              <TText style={{ color: '#999', textTransform: 'uppercase', fontSize: 10, fontWeight: '700' }}>Date Issued</TText>
              <TText style={{ marginTop: 4 }}>Apr 10, 2026</TText>
            </TView>
          </TView>

          <TView style={styles.paperTable}>
            <TView style={styles.paperTableHeader}>
              <TText style={{ flex: 3, fontWeight: '700' }}>Description</TText>
              <TText style={{ flex: 1, textAlign: 'center', fontWeight: '700' }}>Qty</TText>
              <TText style={{ flex: 1, textAlign: 'right', fontWeight: '700' }}>Total</TText>
            </TView>
            {items.map((item, i) => (
              <TView key={i} style={styles.paperTableRow}>
                <TText style={{ flex: 3 }}>{item.name || 'Untitled Item'}</TText>
                <TText style={{ flex: 1, textAlign: 'center' }}>{item.quantity}</TText>
                <TText style={{ flex: 1, textAlign: 'right' }}>${((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)).toFixed(2)}</TText>
              </TView>
            ))}
          </TView>

          <TView style={styles.paperFooter}>
            <TView style={styles.paperSummaryRow}>
              <TText style={{ color: '#666' }}>Subtotal</TText>
              <TText style={{ fontWeight: '600' }}>${subtotal.toFixed(2)}</TText>
            </TView>
            <TView style={styles.paperSummaryRow}>
              <TText style={{ color: '#666' }}>Tax (15%)</TText>
              <TText style={{ fontWeight: '600' }}>${tax.toFixed(2)}</TText>
            </TView>
            <TView style={[styles.paperSummaryRow, { marginTop: 12, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 }]}>
              <TText style={{ fontSize: 18, fontWeight: '700' }}>Total Amout</TText>
              <TText style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>${total.toFixed(2)}</TText>
            </TView>
          </TView>
        </TView>
      </TView>
    </TView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  editorSide: {
    flex: 1,
    height: '100%',
    borderRightWidth: 1,
  },
  editorHeader: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: {
    marginRight: 16,
    padding: 8,
  },
  editorContent: {
    padding: 32,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: RADIUS.md,
  },
  input: {
    flex: 1,
    marginLeft: 12,
  },
  row: {
    flexDirection: 'row',
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 6,
  },
  itemList: {
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  miniInput: {
    height: 36,
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 13,
  },
  trashBtn: {
    marginLeft: 12,
    padding: 8,
  },
  previewSide: {
    flex: 1.2,
    height: '100%',
    padding: 40,
    alignItems: 'center',
  },
  previewHeader: {
    width: '100%',
    maxWidth: 700,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  invoicePaper: {
    width: '100%',
    maxWidth: 700,
    aspectRatio: 1 / 1.4,
    borderRadius: 8,
    padding: 60,
  },
  paperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 60,
  },
  paperClient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 60,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  paperTable: {
    flex: 1,
  },
  paperTableHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    marginBottom: 16,
  },
  paperTableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  paperFooter: {
    marginTop: 40,
    alignItems: 'flex-end',
  },
  paperSummaryRow: {
    width: 240,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
});
