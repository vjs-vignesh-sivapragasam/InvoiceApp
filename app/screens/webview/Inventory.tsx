import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Minus,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sliders
} from 'lucide-react-native';
import { MotiView } from '@/components/MotiShim';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useNotifications } from '../../../components/NotificationProvider';
import { TText, TView, useTheme } from '../../../components/ThemedUI';
import { db } from '../../../services/supabase';
import { COLORS, RADIUS, SHADOWS } from '../../../theme';
import { WebLayout } from './WebLayout';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Product {
  productid: number;
  productname: string;
  pieces: number; // Bound to 'pieces' column (Pieces per box)
  optional1?: string; // Bound to 'optional1' column (Stock Balance)
  hsn?: string;
  incase?: number;
  sellingprice?: number;
  isactive?: boolean;
}

interface InventoryEntry {
  inventoryid: number;
  productid: number;
  movementtype: 'restock' | 'sale' | 'adjustment' | 'return';
  quantitymoved: number;
  previousstock: number;
  newstock: number;
  referenceno?: string;
  notes?: string;
  createddate: string;
  products?: Product;
}

// ─── Movement type config ────────────────────────────────────────────────────
const MOVEMENT_CONFIG = {
  restock: { label: 'Restock', color: COLORS.success, icon: ArrowUpCircle, bg: '#10b98120' },
  sale: { label: 'Sale', color: COLORS.danger, icon: ArrowDownCircle, bg: '#ef444420' },
  adjustment: { label: 'Adjustment', color: COLORS.warning, icon: Sliders, bg: '#f59e0b20' },
  return: { label: 'Return', color: '#818cf8', icon: RotateCcw, bg: '#818cf820' },
};

// ─── Movement Log Row ────────────────────────────────────────────────────────
const LogRow = ({ entry, colors }: { entry: InventoryEntry; colors: any }) => {
  const cfg = MOVEMENT_CONFIG[entry.movementtype] ?? MOVEMENT_CONFIG.adjustment;
  const Icon = cfg.icon;
  const date = new Date(entry.createddate).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <MotiView
      from={{ opacity: 0, translateX: -10 }}
      animate={{ opacity: 1, translateX: 0 }}
      style={[styles.logRow, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.logIcon, { backgroundColor: cfg.bg }]}>
        <Icon size={16} color={cfg.color} />
      </View>

      <View style={styles.logInfo}>
        <TText style={{ fontWeight: '700', fontSize: 13 }}>
          {entry.products?.productname ?? `Product #${entry.productid}`}
        </TText>
        <TText variant="caption" style={{ fontSize: 11 }}>
          {entry.notes ?? entry.referenceno ?? '—'}
        </TText>
      </View>

      <View style={styles.logMeta}>
        <View style={[styles.movementBadge, { backgroundColor: cfg.bg }]}>
          <TText style={{ color: cfg.color, fontWeight: '800', fontSize: 10 }}>
            {cfg.label.toUpperCase()}
          </TText>
        </View>
        <TText variant="caption" style={{ textAlign: 'right', fontSize: 11, marginTop: 4 }}>
          {entry.previousstock} → {entry.newstock}
        </TText>
      </View>

      <View style={styles.logQty}>
        <TText style={{
          fontWeight: '900',
          fontSize: 18,
          color: ['sale', 'adjustment'].includes(entry.movementtype) ? COLORS.danger : COLORS.success
        }}>
          {['sale', 'adjustment'].includes(entry.movementtype) ? '-' : '+'}{entry.quantitymoved}
        </TText>
        <TText variant="caption" style={{ fontSize: 10 }}>{date}</TText>
      </View>
    </MotiView>
  );
};

// ─── Product Card ────────────────────────────────────────────────────────────
const ProductCard = ({
  item, colors, updatingId, adjustment,
  onAdjustmentChange, onAdd, onRemove
}: any) => (
  <MotiView
    key={item.productid}
    from={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    style={[styles.productCard, { backgroundColor: colors.card, ...SHADOWS.md }]}
  >
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
      <TView style={[styles.iconBox, { backgroundColor: COLORS.primary + '15' }]}>
        <Package size={24} color={COLORS.primary} />
      </TView>
      <TView style={[styles.stockBadge, {
        backgroundColor: parseInt(item.optional1 || '0') < 10 ? COLORS.danger + '15' : COLORS.success + '15'
      }]}>
        <TText style={{
          color: parseInt(item.optional1 || '0') < 10 ? COLORS.danger : COLORS.success,
          fontWeight: '900', fontSize: 12
        }}>
          {item.optional1 || '0'} IN STOCK
        </TText>
      </TView>
    </View>

    <TText style={{ fontWeight: '800', fontSize: 18, marginBottom: 4 }}>{item.productname}</TText>
    <TText variant="caption" style={{ marginBottom: 20 }}>
      HSN: {item.hsn || '---'} • Box Qty: {item.incase || '-'}
    </TText>

    {parseInt(item.optional1 || '0') < 10 && (
      <View style={styles.alertBox}>
        <AlertTriangle size={14} color={COLORS.danger} />
        <TText style={{ color: COLORS.danger, fontSize: 11, fontWeight: '700', marginLeft: 6 }}>
          LOW STOCK ALERT
        </TText>
      </View>
    )}

    <View style={styles.actionSection}>
      <TView style={[styles.inputGroup, { backgroundColor: colors.surfaceSecondary }]}>
        <TextInput
          placeholder="Qty"
          keyboardType="numeric"
          value={updatingId === item.productid ? adjustment : ''}
          onChangeText={(v) => onAdjustmentChange(item.productid, v)}
          style={{ flex: 1, paddingHorizontal: 12, color: colors.text, fontWeight: '700', textAlign: 'center' }}
          placeholderTextColor={colors.textSecondary}
        />
      </TView>
      <TouchableOpacity onPress={() => onAdd(item.productid)} style={[styles.actionBtn, { backgroundColor: '#10b981' }]}>
        <LinearGradient colors={['#10b981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 10 }]} />
        <View style={{ zIndex: 1 }}><Plus size={20} color="#fff" /></View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onRemove(item.productid)} style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}>
        <LinearGradient colors={['#ef4444', '#dc2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 10 }]} />
        <View style={{ zIndex: 1 }}><Minus size={20} color="#fff" /></View>
      </TouchableOpacity>
    </View>
  </MotiView>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
type Tab = 'stock' | 'log';

export const Inventory = () => {
  const { colors } = useTheme();
  const { showToast } = useNotifications();

  const [tab, setTab] = useState<Tab>('stock');
  const [loading, setLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [log, setLog] = useState<InventoryEntry[]>([]);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [adjustment, setAdjustment] = useState('');

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { if (tab === 'log' && log.length === 0) fetchLog(); }, [tab]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await db.products.getAll();
      setProducts(data);
    } catch {
      showToast('Failed to fetch inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLog = async () => {
    setLogLoading(true);
    try {
      const data = await db.inventory.getAll();
      setLog(data);
    } catch {
      showToast('Failed to fetch movement log', 'error');
    } finally {
      setLogLoading(false);
    }
  };

  const handleUpdateStock = async (id: number, type: 'add' | 'remove') => {
    const amount = parseInt(adjustment);
    if (isNaN(amount) || amount <= 0) return showToast('Enter a valid quantity', 'error');

    const currentStock = parseInt(product.optional1 || '0');
    const newStock = type === 'add' ? currentStock + amount : currentStock - amount;
    if (newStock < 0) return showToast('Insufficient stock', 'error');

    const movementtype = type === 'add' ? 'restock' : 'sale';

    try {
      setUpdatingId(id);
      // 1. Update optional1
      await db.products.update(id, { optional1: newStock.toString() });
      // 2. Log the movement
      await db.inventory.logMovement({
        productid: id,
        movementtype,
        quantitymoved: amount,
        previousstock: currentStock,
        newstock: newStock,
      });

      setProducts(prev => prev.map(p => p.productid === id ? { ...p, optional1: newStock.toString() } : p));
      // Invalidate log cache so next visit refetches
      setLog([]);
      setAdjustment('');
      setUpdatingId(null);
      showToast('Stock updated & movement logged');
    } catch {
      showToast('Update failed', 'error');
      setUpdatingId(null);
    }
  };

  const filtered = products.filter(p =>
    p.productname.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <WebLayout>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <TText variant="title" style={{ fontSize: 32 }}>Inventory Management</TText>
          <TText variant="caption">Track stock levels and view full movement history</TText>
        </View>
        <TouchableOpacity
          onPress={() => { fetchProducts(); setLog([]); }}
          style={[styles.iconButton, { backgroundColor: colors.surfaceSecondary }]}
        >
          <RefreshCw size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <TView style={[styles.tabBar, { backgroundColor: colors.surfaceSecondary }]}>
        {(['stock', 'log'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tabBtn, tab === t && { backgroundColor: colors.card }]}
          >
            {tab === t && (
              <LinearGradient
                colors={[COLORS.primary + '30', COLORS.primary + '10']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 10 }]}
              />
            )}
            <TText style={{
              fontWeight: '700', fontSize: 13, zIndex: 1,
              color: tab === t ? COLORS.primary : colors.textSecondary
            }}>
              {t === 'stock' ? '📦  Current Stock' : '📋  Movement Log'}
            </TText>
          </TouchableOpacity>
        ))}
      </TView>

      {tab === 'stock' ? (
        <>
          {/* Search */}
          <TView style={[styles.searchBar, { backgroundColor: colors.card, ...SHADOWS.sm }]}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              placeholder="Search items to update stock..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              style={{ flex: 1, marginLeft: 12, color: colors.text, fontSize: 16, fontWeight: '500' }}
            />
          </TView>

          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            <View style={styles.grid}>
              {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 100 }} />
              ) : (
                filtered.map(item => (
                  <ProductCard
                    key={item.productid}
                    item={item}
                    colors={colors}
                    updatingId={updatingId}
                    adjustment={adjustment}
                    onAdjustmentChange={(id: number, v: string) => { setUpdatingId(id); setAdjustment(v); }}
                    onAdd={(id: number) => handleUpdateStock(id, 'add')}
                    onRemove={(id: number) => handleUpdateStock(id, 'remove')}
                  />
                ))
              )}
            </View>
          </ScrollView>
        </>
      ) : (
        /* Movement Log Tab */
        <TView style={[styles.logCard, { backgroundColor: colors.card, ...SHADOWS.sm }]}>
          {/* Log Header Row */}
          <View style={[styles.logHeaderRow, { borderBottomColor: colors.border }]}>
            <TText variant="caption" style={[styles.logHeaderCell, { flex: 2 }]}>Product</TText>
            <TText variant="caption" style={styles.logHeaderCell}>Type</TText>
            <TText variant="caption" style={[styles.logHeaderCell, { textAlign: 'right' }]}>Qty Change</TText>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {logLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
            ) : log.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <TText variant="caption">No movement records found.</TText>
              </View>
            ) : (
              log.map(entry => (
                <LogRow key={entry.inventoryid} entry={entry} colors={colors} />
              ))
            )}
          </ScrollView>
        </TView>
      )}
    </WebLayout>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  iconButton: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  tabBar: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 24, gap: 4 },
  tabBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 60, borderRadius: 16, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
  productCard: { width: '31%', padding: 24, borderRadius: RADIUS.xl },
  iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  stockBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, justifyContent: 'center' },
  alertBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  actionSection: { flexDirection: 'row', gap: 10, marginTop: 10 },
  inputGroup: { flex: 1, height: 44, borderRadius: 10, overflow: 'hidden' },
  actionBtn: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', ...SHADOWS.sm },
  // Log tab
  logCard: { borderRadius: RADIUS.xl, overflow: 'hidden', flex: 1 },
  logHeaderRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  logHeaderCell: { flex: 1, fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  logIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logInfo: { flex: 2, gap: 2 },
  logMeta: { flex: 1, alignItems: 'flex-end' },
  logQty: { width: 80, alignItems: 'flex-end', gap: 2 },
  movementBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-end' },
});

export default Inventory;
