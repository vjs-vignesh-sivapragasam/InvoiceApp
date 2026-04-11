import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, ActivityIndicator, Platform } from 'react-native';
import { MotiView } from 'moti';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { Button } from '../../../components/Button';
import { COLORS, RADIUS, SHADOWS } from '../../../theme';
import { db } from '../../../services/supabase';
import { Plus, Search, Edit2, Package, Hash, Box, DollarSign, Tag, ShoppingBag } from 'lucide-react-native';

const MobileProductManagement = () => {
  const { colors } = useTheme();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await db.products.getAll();
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await db.products.update(id, { isactive: !currentStatus });
      fetchProducts();
    } catch (error) {
       alert('Error updating');
    }
  };

  if (loading) return <TView style={{flex: 1, justifyContent: 'center'}}><ActivityIndicator color={COLORS.primary} /></TView>;

  return (
    <TView style={[styles.container, { backgroundColor: colors.background }]}>
      <TView style={[styles.header, { borderBottomColor: colors.border }]}>
        <TText variant="subtitle">Product Catalog</TText>
        <TouchableOpacity style={styles.addBtn}><Plus size={24} color={COLORS.primary} /></TouchableOpacity>
      </TView>

      <TView style={styles.searchContainer}>
        <TView style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput placeholder="Search by name or HSN..." style={{ marginLeft: 8, flex: 1, color: colors.text }} />
        </TView>
      </TView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {products.map((p, i) => (
          <MotiView
            key={p.productid}
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 50 }}
            style={[styles.productCard, { backgroundColor: colors.card, ...SHADOWS.sm }]}
          >
            <TView style={styles.cardMain}>
              <TView style={[styles.iconBox, { backgroundColor: colors.surfaceSecondary }]}>
                <Package size={22} color={COLORS.primary} />
              </TView>
              <TView style={{ flex: 1, marginLeft: 16 }}>
                <TText style={{ fontWeight: '700', fontSize: 16 }}>{p.productname}</TText>
                <TView style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                   <TText variant="caption">HSN: {p.hsn || '-'}</TText>
                   <TText variant="caption" style={{ marginHorizontal: 6 }}>•</TText>
                   <TText variant="caption">BOX: {p.incase || '0'}</TText>
                   <TText variant="caption" style={{ marginHorizontal: 6 }}>•</TText>
                   <TText style={{ color: COLORS.primary, fontWeight: '800', fontSize: 13 }}>${p.sellingprice}</TText>
                </TView>
              </TView>
              <Switch 
                value={p.isactive} 
                onValueChange={() => toggleStatus(p.productid, p.isactive)}
                trackColor={{ false: colors.border, true: COLORS.primary }}
              />
            </TView>
            <TView style={[styles.divider, { backgroundColor: colors.border }]} />
            <TView style={styles.cardActions}>
               <TView style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Tag size={12} color={colors.textSecondary} />
                  <TText variant="caption" style={{ marginLeft: 4 }}>MRP: ${p.mrp}</TText>
               </TView>
               <TouchableOpacity style={styles.editBtn}>
                  <Edit2 size={14} color={COLORS.primary} />
                  <TText style={{ color: COLORS.primary, fontWeight: '700', fontSize: 12, marginLeft: 6 }}>Edit</TText>
               </TouchableOpacity>
            </TView>
          </MotiView>
        ))}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { backgroundColor: COLORS.primary, ...SHADOWS.md }]}>
        <Plus size={28} color="#fff" />
      </TouchableOpacity>
    </TView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, marginTop: Platform.OS === 'ios' ? 40 : 10 },
  addBtn: { padding: 8 },
  searchContainer: { padding: 20 },
  searchBar: { height: 48, borderRadius: RADIUS.md, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  scrollContent: { padding: 20, paddingTop: 0, paddingBottom: 100 },
  productCard: { borderRadius: RADIUS.lg, padding: 16, marginBottom: 16 },
  cardMain: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 48, height: 48, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1, marginVertical: 12, opacity: 0.3 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
});

export default MobileProductManagement;
