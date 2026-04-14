import { useRouter } from 'expo-router';
import { Box, ChevronLeft, DollarSign, Edit2, Hash, Package, Plus, Search, ShoppingBag, Tag, X } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../../../components/Button';
import { useNotifications } from '../../../components/NotificationProvider';
import { TText, TView, useTheme } from '../../../components/ThemedUI';
import { db } from '../../../services/supabase';
import { COLORS, RADIUS, SHADOWS } from '../../../theme';

// 🛡️ Resilience Layer: Moved outside to prevent focus loss (Keyboard Auto-Close Fix)
const FormField = ({ label, value, onChange, placeholder, icon: Icon, keyboardType = 'default', disabled = false }: any) => {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 16 }}>
      <TText variant="caption" style={styles.label}>{label}</TText>
      <TView style={[styles.inputWrapper, { backgroundColor: colors.surfaceSecondary, opacity: disabled ? 0.6 : 1 }]}>
        <Icon size={16} color={colors.textSecondary} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          keyboardType={keyboardType}
          editable={!disabled}
          selectTextOnFocus={!disabled}
          style={[styles.input, { color: disabled ? colors.textSecondary : colors.text }]}
          placeholderTextColor={colors.textSecondary}
        />
      </TView>
    </View>
  );
};

const MobileProductManagement = () => {
  const { colors } = useTheme();
  const { showToast } = useNotifications();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [formData, setFormData] = useState({
    productname: '',
    hsn: '',
    mrp: '',
    sellingprice: '',
    purchaseprice: '', // Bound to 'purchaseorder' column
    incase: '', // Bound to 'incase' column
    piecesinbox: '', // Bound to 'pieces' column
    pieces: '0', // Opening stock
    producttype: 'Normal'
  });

  const fetchProducts = useCallback(async () => {
    try {
      const data = await db.products.getWithStock();
      setProducts(data);
    } catch (e) {
      showToast('Sync failed', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSave = async () => {
    if (!formData.productname) return showToast('Product name is required', 'error');
    if (!formData.sellingprice) return showToast('Selling price is required', 'error');

    setLoading(true);
    try {
      const payload = {
        productname: formData.productname,
        hsn: formData.hsn,
        producttype: formData.producttype,
        mrp: parseFloat(formData.mrp) || 0,
        sellingprice: parseFloat(formData.sellingprice) || 0,
        purchaseorder: formData.purchaseprice?.toString() || '0',
        incase: parseInt(formData.incase) || 0,
        pieces: parseInt(formData.piecesinbox) || 0, // This is 'Pieces per box'
      };

      // Remove the non-existent fields from the payload to prevent Supabase errors
      delete (payload as any).purchaseprice;
      delete (payload as any).piecesinbox;

      if (editingProduct) {
        await db.products.update(editingProduct.productid, payload);
        showToast('Product updated!');
      } else {
        const newProd = await db.products.create(payload);

        // Initial stock entry if provided
        const initialStock = parseInt(formData.pieces) || 0;
        if (initialStock > 0) {
          await db.inventory.logMovement({
            productid: newProd.productid,
            movementtype: 'restock',
            quantitymoved: initialStock,
            previousstock: 0,
            newstock: initialStock,
            notes: 'Initial opening stock'
          });
        }
        showToast('Product created!');
      }
      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      showToast('Save failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productname: '', hsn: '', mrp: '', sellingprice: '', purchaseprice: '',
      incase: '', piecesinbox: '', pieces: '0', producttype: 'Normal'
    });
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await db.products.update(id, { isactive: !currentStatus });
      fetchProducts();
      showToast('Status updated');
    } catch (error) {
      showToast('Error updating status', 'error');
    }
  };

  const filteredProducts = products.filter(p =>
    p.productname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.hsn || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && products.length === 0) return <TView style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color={COLORS.primary} /></TView>;

  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TView style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <TText variant="subtitle" style={{ fontWeight: '900' }}>Add Product</TText>
        <TView style={{ width: 40 }} />
      </TView>

      <TView style={styles.searchContainer}>
        <TView style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or HSN..."
            style={{ marginLeft: 8, flex: 1, color: colors.text, fontWeight: '600' }}
          />
        </TView>
      </TView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {filteredProducts.map((p, i) => (
          <MotiView
            key={p.productid}
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 50 }}
            style={[styles.productCard, { backgroundColor: 'transparent', borderWidth: 1.2, borderColor: p.isactive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)' }]}
          >
            <TView style={styles.cardMain}>
              <TView style={[styles.iconBox, { backgroundColor: p.isactive ? COLORS.success : COLORS.danger, borderWidth: 0 }]}>
                <Package size={22} color="#fff" />
              </TView>
              <TView style={{ flex: 1, marginLeft: 16 }}>
                <TText style={{ fontWeight: '800', fontSize: 16 }}>{p.productname}</TText>
                <TView style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <TText variant="caption" style={{ fontWeight: '600', opacity: 0.7 }}>HSN: {p.hsn || '-'}</TText>
                  <TText variant="caption" style={{ opacity: 0.3 }}>|</TText>
                  <TText variant="caption" style={{ fontWeight: '600' }}>{p.incase || '0'}C x {p.piecesinbox || '0'}P</TText>
                  <TText variant="caption" style={{ opacity: 0.3 }}>|</TText>
                  <TText style={{ color: COLORS.primary, fontWeight: '900', fontSize: 13 }}>₹{p.sellingprice}</TText>
                </TView>
              </TView>
              <TView style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    setEditingProduct(p);
                    setFormData({
                      ...p,
                      mrp: p.mrp?.toString() || '',
                      sellingprice: p.sellingprice?.toString() || '',
                      purchaseprice: p.purchaseorder?.toString() || '',
                      incase: p.incase?.toString() || '',
                      piecesinbox: p.pieces?.toString() || '',
                      pieces: (p as any).currentStock?.toString() || '0'
                    });
                    setShowForm(true);
                  }}
                  style={styles.headerEditBtn}
                >
                  <Edit2 size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <Switch
                  value={p.isactive}
                  onValueChange={() => toggleStatus(p.productid, p.isactive)}
                  trackColor={{ false: 'rgba(0,0,0,0.1)', true: COLORS.success }}
                />
              </TView>
            </TView>
            <TView style={[styles.divider, { backgroundColor: colors.border }]} />
            <TView style={styles.cardActions}>
              <TView style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Tag size={12} color={colors.textSecondary} />
                <TText variant="caption" style={{ marginLeft: 6, fontWeight: '600' }}>Stock: {(p as any).currentStock || '0'}</TText>
              </TView>
              <TView style={[styles.statusBadge, { backgroundColor: p.isactive ? COLORS.success + '15' : COLORS.danger + '15' }]}>
                <TText style={{ fontSize: 10, fontWeight: '900', color: p.isactive ? COLORS.success : COLORS.danger }}>{p.isactive ? 'Active' : 'InActive'}</TText>
              </TView>
            </TView>
          </MotiView>
        ))}
      </ScrollView>

      {/* Product Modal */}
      <Modal visible={showForm} animationType="slide">
        <TView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TText variant="subtitle">{editingProduct ? 'Update Product' : 'Add New Product'}</TText>
            <TouchableOpacity onPress={() => setShowForm(false)}><X size={24} color={colors.text} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <TText style={styles.formSectionTitle}>PRODUCT DETAILS</TText>
            <FormField label="Product Name" value={formData.productname} onChange={(v: any) => setFormData({ ...formData, productname: v })} placeholder="e.g. 50W LED Driver" icon={Package} />
            <TView style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}><FormField label="HSN Code" value={formData.hsn} onChange={(v: any) => setFormData({ ...formData, hsn: v })} placeholder="8504..." icon={Hash} /></View>
              <View style={{ flex: 1 }}><FormField label="Type" value={formData.producttype} onChange={(v: any) => setFormData({ ...formData, producttype: v })} placeholder="Normal" icon={Tag} /></View>
            </TView>

            <TText style={[styles.formSectionTitle, { marginTop: 10 }]}>PRICING & PACKAGING</TText>
            <FormField label="Purchase Order Price" value={formData.purchaseprice} onChange={(v: any) => setFormData({ ...formData, purchaseprice: v })} placeholder="0.00" icon={DollarSign} keyboardType="numeric" />
            <TView style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}><FormField label="MRP" value={formData.mrp} onChange={(v: any) => setFormData({ ...formData, mrp: v })} placeholder="0.00" icon={DollarSign} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><FormField label="Selling Price" value={formData.sellingprice} onChange={(v: any) => setFormData({ ...formData, sellingprice: v })} placeholder="0.00" icon={ShoppingBag} keyboardType="numeric" /></View>
            </TView>
            <TView style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}><FormField label="InCase" value={formData.incase} onChange={(v: any) => setFormData({ ...formData, incase: v })} placeholder="Qty in case" icon={Box} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><FormField label="Pieces per box" value={formData.piecesinbox} onChange={(v: any) => setFormData({ ...formData, piecesinbox: v })} placeholder="Qty in box" icon={Package} keyboardType="numeric" /></View>
            </TView>
            <TView style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}><FormField label="Opening Stock" value={formData.pieces} onChange={(v: any) => setFormData({ ...formData, pieces: v })} placeholder="Initial count" icon={Tag} keyboardType="numeric" disabled={true} /></View>
              <View style={{ flex: 1 }}></View>
            </TView>

            <Button
              title={editingProduct ? "Update Product" : "Add Product"}
              onPress={handleSave}
              style={{ marginTop: 20, height: 50 }}
              loading={loading}
            />
            <View style={{ height: 40 }} />
          </ScrollView>
        </TView>
      </Modal>

      <TouchableOpacity
        onPress={() => {
          setEditingProduct(null);
          resetForm();
          setShowForm(true);
        }}
        style={[styles.fab, { backgroundColor: COLORS.primary, ...SHADOWS.md }]}
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1 },
  backBtn: { padding: 8 },
  searchContainer: { padding: 20 },
  searchBar: { height: 50, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  scrollContent: { padding: 20, paddingTop: 0, paddingBottom: 100 },
  productCard: { borderRadius: RADIUS.lg, padding: 16, marginBottom: 16 },
  cardMain: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1, marginVertical: 12, opacity: 0.2 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  editBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  headerEditBtn: { padding: 6, borderRadius: 8, backgroundColor: 'rgba(129, 140, 248, 0.1)' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  modalHeader: { height: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1 },
  formSectionTitle: { fontSize: 10, fontWeight: '800', color: COLORS.primary, marginBottom: 12, letterSpacing: 1 },
  label: { marginBottom: 6, fontWeight: '700', fontSize: 12 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48, borderRadius: RADIUS.md },
  input: { flex: 1, marginLeft: 12, fontWeight: '600' },
});

export default MobileProductManagement;
