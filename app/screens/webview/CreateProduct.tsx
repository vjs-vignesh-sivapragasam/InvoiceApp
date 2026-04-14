import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, ScrollView, Switch, ActivityIndicator, View } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { WebLayout } from './WebLayout';
import { Button } from '../../../components/Button';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../../theme';
import { db } from '../../../services/supabase';
import { 
  Package, Hash, Box, Tag, Percent, DollarSign, Plus, Search, Edit3, X, FileText, ShoppingBag
} from 'lucide-react-native';

import { useNotifications } from '../../../components/NotificationProvider';

export const CreateProduct = () => {
  const { colors } = useTheme();
  const { showToast } = useNotifications();
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const [formData, setFormData] = useState({
    productname: '',
    producttype: 'Normal',
    incase: '', // Bound to 'incase' 
    piecesinbox: '', // Bound to 'pieces' 
    pieces: '0', // Opening Stock -> Bound to 'optional1'
    hsn: '',
    purchaseprice: '', // Bound to 'purchaseorder'
    sellingprice: '',
    mrp: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await db.products.getWithStock();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        productname: formData.productname,
        producttype: formData.producttype,
        incase: parseInt(formData.incase) || 0,
        pieces: parseInt(formData.piecesinbox) || 0,
        sellingprice: parseFloat(formData.sellingprice) || 0,
        purchaseorder: formData.purchaseprice?.toString() || '0',
        mrp: parseFloat(formData.mrp) || 0,
        hsn: formData.hsn,
      };

      // Remove non-existent fields
      delete (payload as any).piecesinbox;
      delete (payload as any).purchaseprice;

      if (editingProduct) {
        await db.products.update(editingProduct.productid, payload);
        showToast('Product updated successfully!');
      } else {
        const newProd = await db.products.create(payload);
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
        showToast('Product added successfully!');
      }
      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
       showToast('Failed to save product record', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      productname: '', producttype: 'Normal', incase: '', piecesinbox: '', pieces: '0', hsn: '',
      purchaseprice: '', sellingprice: '', mrp: ''
    });
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await db.products.update(id, { isactive: newStatus });
      showToast(newStatus ? 'Product listed as Active' : 'Product moved to Inactive', 'info');
      fetchProducts();
    } catch (error) {
       showToast('Error updating inventory status', 'error');
    }
  };

  const FormField = ({ label, value, onChange, placeholder, icon: Icon, width = '48%', disabled = false }: any) => (
    <View style={{ width, marginBottom: 16 }}>
      <TText variant="caption" style={styles.label}>{label}</TText>
      <TView style={[styles.inputWrapper, { backgroundColor: colors.surfaceSecondary, opacity: disabled ? 0.6 : 1 }]}>
        <Icon size={16} color={colors.textSecondary} />
        <TextInput 
          value={value} 
          onChangeText={onChange} 
          placeholder={placeholder} 
          editable={!disabled}
          style={[styles.input, { color: disabled ? colors.textSecondary : colors.text }]} 
          placeholderTextColor={colors.textSecondary}
        />
      </TView>
    </View>
  );

  if (loading) {
    return (
      <WebLayout>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </WebLayout>
    );
  }

  return (
    <WebLayout>
      <View style={styles.header}>
        <View>
          <TText variant="title">Product Inventory</TText>
          <TText variant="caption">Full catalog management with HSN and BOX configurations</TText>
        </View>
        <Button 
          title="Add Product" 
          icon={<Plus size={18} color="#fff" />} 
          onPress={() => setShowForm(true)}
          style={{ width: 180 }}
        />
      </View>

      <AnimatePresence>
        {showForm && (
          <View style={styles.overlay}>
             <MotiView 
                from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                style={[styles.formCard, { backgroundColor: colors.card, ...SHADOWS.lg }]}
             >
                <View style={styles.formHeader}>
                  <TText variant="subtitle">{editingProduct ? 'Update Product' : 'Register New Product'}</TText>
                  <TouchableOpacity onPress={() => setShowForm(false)}><X size={24} color={colors.textSecondary} /></TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingRight: 10 }}>
                  <View style={styles.grid}>
                    <FormField label="Product Name" value={formData.productname} onChange={(v:any)=>setFormData({...formData, productname:v})} placeholder="e.g. Wireless Mouse" icon={Package} width="100%" />
                    <FormField label="Product Type" value={formData.producttype} onChange={(v:any)=>setFormData({...formData, producttype:v})} placeholder="e.g. Hardware" icon={Tag} />
                    <FormField label="HSN Code" value={formData.hsn} onChange={(v:any)=>setFormData({...formData, hsn:v})} placeholder="8471" icon={Hash} />
                    
                    <TText style={{ width: '100%', marginTop: 10, fontWeight: '800', color: COLORS.primary }}>PRICING & PACKAGING</TText>
                    <FormField label="Purchase Order Price" value={formData.purchaseprice} onChange={(v:any)=>setFormData({...formData, purchaseprice:v})} placeholder="0.00" icon={DollarSign} />
                    <FormField label="Selling Price" value={formData.sellingprice} onChange={(v:any)=>setFormData({...formData, sellingprice:v})} placeholder="0.00" icon={ShoppingBag} />
                    <FormField label="MRP" value={formData.mrp} onChange={(v:any)=>setFormData({...formData, mrp:v})} placeholder="0.00" icon={Tag} />
                    <FormField label="InCase" value={formData.incase} onChange={(v:any)=>setFormData({...formData, incase:v})} placeholder="Qty per Case" icon={Box} />
                    <FormField label="Pieces per Box" value={formData.piecesinbox} onChange={(v:any)=>setFormData({...formData, piecesinbox:v})} placeholder="Qty per Box" icon={Package} />
                    <FormField label="Opening Stock" value={formData.pieces} onChange={(v:any)=>setFormData({...formData, pieces:v})} placeholder="0" icon={FileText} disabled={true} />
                  </View>
                  <Button title={editingProduct ? "Update Record" : "Save Product"} onPress={handleSave} style={{ marginTop: 24 }} />
                </ScrollView>
             </MotiView>
          </View>
        )}
      </AnimatePresence>

      <TView style={[styles.listCard, { backgroundColor: colors.card, ...SHADOWS.sm }]}>
        <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
          <TText style={[styles.col, { flex: 2 }]} variant="caption">Product Name</TText>
          <TText style={styles.col} variant="caption">HSN</TText>
          <TText style={styles.col} variant="caption">Packaging</TText>
          <TText style={styles.col} variant="caption">Stock</TText>
          <TText style={styles.col} variant="caption">Pricing (Sell/MRP)</TText>
          <TText style={styles.col} variant="caption">Status</TText>
          <View style={{ width: 60 }} />
        </View>
        {products.map((p) => (
          <View key={p.productid} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.col, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
               <TView style={[styles.prodIcon, { backgroundColor: colors.surfaceSecondary }]}>
                  <Package size={16} color={COLORS.primary} />
               </TView>
               <TText style={{ marginLeft: 12, fontWeight: '600' }}>{p.productname}</TText>
            </View>
            <TText style={styles.col} variant="body">{p.hsn || '-'}</TText>
            <TText style={styles.col} variant="body">{p.incase || '0'} / {p.pieces || '0'}</TText>
            <TText style={styles.col} variant="body">{(p as any).currentStock || '0'}</TText>
            <TText style={styles.col} variant="body">₹{p.sellingprice} <TText variant="caption" style={{fontSize: 10}}>(₹{p.mrp})</TText></TText>
            <View style={styles.col}>
              <Switch value={p.isactive} onValueChange={() => toggleStatus(p.productid, p.isactive)} trackColor={{ false: colors.border, true: COLORS.primary }} />
            </View>
            <TouchableOpacity onPress={() => { setEditingProduct(p); setFormData({ ...p, incase: p.incase?.toString(), piecesinbox: p.pieces?.toString(), pieces: (p as any).currentStock?.toString(), sellingprice: p.sellingprice?.toString(), mrp: p.mrp?.toString(), purchaseprice: p.purchaseorder?.toString() }); setShowForm(true); }} style={styles.iconBtn}>
              <Edit3 size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}
      </TView>
    </WebLayout>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  listCard: { borderRadius: RADIUS.xl, padding: 24 },
  tableHeader: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, marginBottom: 8 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  col: { flex: 1 },
  prodIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  iconBtn: { padding: 8 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, justifyContent: 'center', alignItems: 'center' },
  formCard: { width: '90%', maxWidth: 700, maxHeight: '90%', padding: 32, borderRadius: RADIUS.xl, overflow: 'hidden' },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  label: { marginBottom: 6, fontWeight: '700', fontSize: 12 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48, borderRadius: RADIUS.md },
  input: { flex: 1, marginLeft: 12 },
});
