import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, View, RefreshControl, Dimensions, SafeAreaView, Platform } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Package, Plus, Minus, Search, AlertTriangle, 
  ArrowUpCircle, ArrowDownCircle, Sliders, 
  RotateCcw, List, ChevronRight, ChevronLeft, CheckCircle
} from 'lucide-react-native';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { db } from '../../../services/supabase';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../../theme';
import { useNotifications } from '../../../components/NotificationProvider';
import { useRouter } from 'expo-router';
const { width } = Dimensions.get('window');

const MOVEMENT_CONFIG: any = {
  restock: { label: 'Restock', color: COLORS.success, icon: ArrowUpCircle, bg: '#10b98120' },
  sale: { label: 'Sale', color: COLORS.danger, icon: ArrowDownCircle, bg: '#ef444420' },
  adjustment: { label: 'Adjustment', color: COLORS.warning, icon: Sliders, bg: '#f59e0b20' },
  return: { label: 'Return', color: '#818cf8', icon: RotateCcw, bg: '#818cf820' },
};

export default function MobileInventory() {
  const { colors, isDark } = useTheme();
  const { showToast } = useNotifications();
  
  const [tab, setTab] = useState<'stock' | 'log'>('stock');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [log, setLog] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [adjustment, setAdjustment] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [pData, lData] = await Promise.all([db.products.getAll(), db.inventory.getAll()]);
      setProducts(pData);
      setLog(lData);
    } catch { showToast('Sync failed', 'error'); } 
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdateStock = async (id: number, type: 'add' | 'remove') => {
    const amount = parseInt(adjustment);
    if (isNaN(amount) || amount <= 0) return showToast('Invalid quantity', 'error');

    const product = products.find(p => p.productid === id);
    if (!product) return;

    const newStock = type === 'add' ? product.pieces + amount : product.pieces - amount;
    if (newStock < 0) return showToast('Insufficient stock', 'error');

    try {
      setUpdatingId(id);
      await db.products.update(id, { pieces: newStock });
      await db.inventory.logMovement({
        productid: id,
        movementtype: type === 'add' ? 'restock' : 'sale',
        quantitymoved: amount,
        previousstock: product.pieces,
        newstock: newStock,
        notes: `Manual ${type === 'add' ? 'Addition' : 'Removal'}`
      });

      setProducts(prev => prev.map(p => p.productid === id ? { ...p, pieces: newStock } : p));
      setAdjustment('');
      setUpdatingId(null);
      showToast('Inventory updated!');
      fetchData(); // Refresh logs
    } catch { showToast('Update failed', 'error'); } 
    finally { setUpdatingId(null); }
  };

  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TView style={[styles.header, { borderBottomColor: isDark ? 'rgba(129, 140, 248, 0.2)' : colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <TText variant="subtitle" style={{ fontWeight: '900' }}>Stock Balance</TText>
        <TView style={{ width: 40 }} />
      </TView>

      <TView style={[styles.tabContainer, { backgroundColor: 'rgba(129, 140, 248, 0.1)', borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.2)', marginTop: 15 }]}>
        <TouchableOpacity onPress={() => setTab('stock')} style={[styles.tab, tab === 'stock' && { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.2)' : '#fff', ...SHADOWS.sm }]}>
          <Package size={16} color={tab === 'stock' ? COLORS.primary : colors.textSecondary} />
          <TText style={[styles.tabText, tab === 'stock' && { color: COLORS.primary }]}>Stock Balance</TText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('log')} style={[styles.tab, tab === 'log' && { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.2)' : '#fff', ...SHADOWS.sm }]}>
          <List size={16} color={tab === 'log' ? COLORS.primary : colors.textSecondary} />
          <TText style={[styles.tabText, tab === 'log' && { color: COLORS.primary }]}>Movement Log</TText>
        </TouchableOpacity>
      </TView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.primary} />}>
        {tab === 'stock' ? (
          <>
            <TView style={[styles.searchBox, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.2)' }]}>
              <Search size={18} color={colors.textSecondary} />
              <TextInput placeholder="Search items..." value={search} onChangeText={setSearch} style={[styles.searchInput, { color: colors.text }]} />
            </TView>

            {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 50 }} /> : (
              products.filter(p => p.productname.toLowerCase().includes(search.toLowerCase())).map((item, i) => (
                <MotiView key={item.productid} from={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 50 }} style={[styles.stockCard, { backgroundColor: 'transparent', borderWidth: 1.2, borderColor: 'rgba(129, 140, 248, 0.3)' }]}>
                  <TView style={styles.cardInfo}>
                    <TView style={styles.itemIcon}>
                       <Package size={20} color={COLORS.primary} />
                    </TView>
                    <TView style={{ flex: 1, marginLeft: 15 }}>
                       <TText style={{ fontWeight: '800', fontSize: 16 }}>{item.productname}</TText>
                       <TText variant="caption">HSN: {item.hsn || '-'} • BOX: {item.incase || '0'}</TText>
                    </TView>
                    <TView style={[styles.stockValueBox, { backgroundColor: item.pieces < 10 ? COLORS.danger + '15' : COLORS.success + '15' }]}>
                       <TText style={{ fontWeight: '900', color: item.pieces < 10 ? COLORS.danger : COLORS.success }}>{item.pieces}</TText>
                       <TText style={{ fontSize: 8, fontWeight: '800', color: item.pieces < 10 ? COLORS.danger : COLORS.success }}>UNITS</TText>
                    </TView>
                  </TView>

                  {item.pieces < 10 && (
                    <TView style={styles.alertBar}>
                       <AlertTriangle size={12} color={COLORS.danger} />
                       <TText style={{ color: COLORS.danger, fontSize: 10, fontWeight: '800', marginLeft: 6 }}>CRITICAL LOW STOCK LEVEL</TText>
                    </TView>
                  )}

                  <TView style={[styles.divider, { backgroundColor: colors.border }]} />

                  <TView style={styles.actionRow}>
                     <TView style={[styles.inputWrapper, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.2)' }]}>
                        <TextInput 
                          placeholder="Adjustment Qty" 
                          keyboardType="numeric"
                          value={updatingId === item.productid ? adjustment : ''}
                          onChangeText={v => { setUpdatingId(item.productid); setAdjustment(v); }}
                          style={{ flex: 1, height: 44, textAlign: 'center', fontWeight: '800', color: colors.text }}
                        />
                     </TView>
                     <TouchableOpacity onPress={() => handleUpdateStock(item.productid, 'add')} style={styles.actionBtn}>
                        <LinearGradient colors={[COLORS.success, '#059669']} style={StyleSheet.absoluteFill} />
                        <Plus size={20} color="#fff" />
                     </TouchableOpacity>
                     <TouchableOpacity onPress={() => handleUpdateStock(item.productid, 'remove')} style={styles.actionBtn}>
                        <LinearGradient colors={[COLORS.danger, '#dc2626']} style={StyleSheet.absoluteFill} />
                        <Minus size={20} color="#fff" />
                     </TouchableOpacity>
                  </TView>
                </MotiView>
              ))
            )}
          </>
        ) : (
          /* Movement Log (Refined) */
          log.map((entry, i) => {
            const cfg = MOVEMENT_CONFIG[entry.movementtype] || MOVEMENT_CONFIG.adjustment;
            const Icon = cfg.icon;
            return (
              <MotiView key={entry.inventoryid} from={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 30 }} style={[styles.logRow, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.2)' }]}>
                 <TView style={styles.logIcon}>
                    <Icon size={18} color={cfg.color} />
                 </TView>
                 <TView style={{ flex: 1, marginLeft: 12 }}>
                    <TText style={{ fontWeight: '700', fontSize: 14 }}>{entry.products?.productname || 'System record'}</TText>
                    <TText variant="caption">{entry.notes || cfg.label.toUpperCase()}</TText>
                 </TView>
                 <TView style={{ alignItems: 'flex-end' }}>
                    <TText style={{ fontWeight: '900', color: ['sale', 'adjustment'].includes(entry.movementtype) ? COLORS.danger : COLORS.success }}>
                       {['sale', 'adjustment'].includes(entry.movementtype) ? '-' : '+'}{entry.quantitymoved}
                    </TText>
                    <TText variant="caption" style={{ fontSize: 10 }}>{entry.previousstock} → {entry.newstock}</TText>
                 </TView>
              </MotiView>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1 },
  backBtn: { padding: 8 },
  tabContainer: { flexDirection: 'row', marginHorizontal: 20, padding: 4, borderRadius: 14, marginBottom: 20 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  tabText: { fontSize: 12, fontWeight: '800', color: COLORS.primary + '50', marginLeft: 8 },
  content: { padding: 20, paddingTop: 0 },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50, borderRadius: 15, marginBottom: 20 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600' },
  stockCard: { borderRadius: RADIUS.xl, padding: 18, marginBottom: 16 },
  cardInfo: { flexDirection: 'row', alignItems: 'center' },
  itemIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  stockValueBox: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  alertBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.danger + '10', padding: 8, borderRadius: 8, marginTop: 15 },
  divider: { height: 1, marginVertical: 15, opacity: 0.5 },
  actionRow: { flexDirection: 'row', gap: 12 },
  inputWrapper: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  actionBtn: { width: 50, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  logRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: RADIUS.lg, marginBottom: 12 },
  logIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
});
