import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from '@/components/MotiShim';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { Button } from '../../../components/Button';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../../theme';
import { ChevronLeft, Plus, Trash2, Calendar, User, Package } from 'lucide-react-native';

interface InvoiceItem {
  id: string;
  name: string;
  quantity: string;
  price: string;
}

export default function CreateInvoiceScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<InvoiceItem[]>([{ id: '1', name: '', quantity: '1', price: '0' }]);
  const [client, setClient] = useState('');

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), name: '', quantity: '1', price: '0' }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.price) || 0;
      return acc + (q * p);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TView style={{ flex: 1 }}>
        {/* Header */}
        <TView style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <TText variant="subtitle">New Invoice</TText>
          <TView style={{ width: 40 }} />
        </TView>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Client Section */}
          <MotiView 
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={[styles.section, { backgroundColor: colors.card, ...SHADOWS.sm }]}
          >
            <TView style={styles.sectionHeader}>
              <User size={18} color={COLORS.primary} />
              <TText variant="body" style={styles.sectionTitle}>Client Information</TText>
            </TView>
            <TextInput
              placeholder="Select or Enter Client Name"
              placeholderTextColor={colors.textSecondary}
              value={client}
              onChangeText={setClient}
              style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceSecondary }]}
            />
          </MotiView>

          {/* Date Section */}
          <MotiView 
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 100 }}
            style={[styles.section, { backgroundColor: colors.card, ...SHADOWS.sm }]}
          >
            <TView style={styles.sectionHeader}>
              <Calendar size={18} color={COLORS.primary} />
              <TText variant="body" style={styles.sectionTitle}>Invoice Dates</TText>
            </TView>
            <TView style={styles.row}>
              <TView style={{ flex: 1 }}>
                <TText variant="caption" style={{ marginBottom: 4 }}>Issue Date</TText>
                <TView style={[styles.datePicker, { backgroundColor: colors.surfaceSecondary }]}>
                  <TText>Apr 10, 2026</TText>
                </TView>
              </TView>
              <TView style={{ flex: 1, marginLeft: SPACING.md }}>
                <TText variant="caption" style={{ marginBottom: 4 }}>Due Date</TText>
                <TView style={[styles.datePicker, { backgroundColor: colors.surfaceSecondary }]}>
                  <TText style={{ color: COLORS.danger }}>Apr 24, 2026</TText>
                </TView>
              </TView>
            </TView>
          </MotiView>

          {/* Items Section */}
          <MotiView 
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200 }}
            style={[styles.section, { backgroundColor: colors.card, ...SHADOWS.sm }]}
          >
            <TView style={styles.sectionHeader}>
              <Package size={18} color={COLORS.primary} />
              <TText variant="body" style={styles.sectionTitle}>Line Items</TText>
              <TouchableOpacity onPress={addItem} style={styles.addButton}>
                <Plus size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </TView>

            <AnimatePresence>
              {items.map((item, index) => (
                <MotiView 
                  key={item.id}
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={styles.itemRow}
                >
                  <TView style={{ flex: 3 }}>
                    <TextInput
                      placeholder="Product Name"
                      placeholderTextColor={colors.textSecondary}
                      value={item.name}
                      onChangeText={(val) => updateItem(item.id, 'name', val)}
                      style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceSecondary }]}
                    />
                  </TView>
                  <TView style={{ flex: 1, marginLeft: 8 }}>
                    <TextInput
                      placeholder="Qty"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                      value={item.quantity}
                      onChangeText={(val) => updateItem(item.id, 'quantity', val)}
                      style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceSecondary, textAlign: 'center' }]}
                    />
                  </TView>
                  <TView style={{ flex: 2, marginLeft: 8 }}>
                    <TextInput
                      placeholder="Price"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                      value={item.price}
                      onChangeText={(val) => updateItem(item.id, 'price', val)}
                      style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceSecondary }]}
                    />
                  </TView>
                  <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteButton}>
                    <Trash2 size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </MotiView>
              ))}
            </AnimatePresence>
          </MotiView>
        </ScrollView>

        {/* Sticky Footer */}
        <TView style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TView style={styles.summaryRow}>
            <TText variant="body">Subtotal</TText>
            <TText variant="body" style={{ fontWeight: '700' }}>${subtotal.toFixed(2)}</TText>
          </TView>
          <TView style={styles.summaryRow}>
            <TText variant="caption">Tax (15%)</TText>
            <TText variant="caption">${tax.toFixed(2)}</TText>
          </TView>
          <TView style={[styles.summaryRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }]}>
            <TText variant="subtitle">Total</TText>
            <TText variant="subtitle" style={{ color: COLORS.primary }}>${total.toFixed(2)}</TText>
          </TView>
          <Button 
            title="Generate Invoice" 
            onPress={() => Alert.alert('Success', 'Invoice created successfully!')} 
            style={{ marginTop: SPACING.lg }}
          />
        </TView>
      </TView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    marginTop: 40
  },
  backButton: {
    padding: 8,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 220,
  },
  section: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    flex: 1,
    marginLeft: 8,
    fontWeight: '700',
  },
  addButton: {
    padding: 4,
  },
  input: {
    height: 48,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
  },
  datePicker: {
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deleteButton: {
    padding: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: SPACING.xl,
    borderTopWidth: 1,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    ...SHADOWS.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
});
