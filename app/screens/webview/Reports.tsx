import { LinearGradient } from 'expo-linear-gradient';
import {
  BarChart2,
  Calendar,
  Download,
  FileText,
  Package,
  RefreshCw,
  TrendingUp,
  Users
} from 'lucide-react-native';
import { MotiView } from '@/components/MotiShim';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { TText, TView, useTheme } from '../../../components/ThemedUI';
import { db } from '../../../services/supabase';
import { COLORS, RADIUS, SHADOWS } from '../../../theme';
import { WebLayout } from './WebLayout';

// ─── Types ─────────────────────────────────────────────────────────
type ReportTab = 'transactions' | 'inventory';

const MOVEMENT_CONFIG: Record<string, { label: string; color: string }> = {
  restock: { label: 'Restock', color: COLORS.success },
  sale: { label: 'Sale', color: COLORS.danger },
  adjustment: { label: 'Adjustment', color: COLORS.warning },
  return: { label: 'Return', color: '#818cf8' },
};

// ─── CSV Export helper ──────────────────────────────────────────────
const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
};

// ─── Sub-component: Summary Stat Card ──────────────────────────────
const StatChip = ({ label, value, color, colors }: any) => (
  <MotiView
    from={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    style={[styles.statChip, { backgroundColor: colors.card, borderColor: colors.border }]}
  >
    <TText variant="caption" style={{ color: colors.textSecondary }}>{label}</TText>
    <TText style={{ fontSize: 22, fontWeight: '800', color: color ?? colors.text, marginTop: 4 }}>
      {value}
    </TText>
  </MotiView>
);

// ─── Report 1: All Transactions ─────────────────────────────────────
const TransactionsReport = ({ colors }: { colors: any }) => {
  const [loading, setLoading] = useState(true);
  const [all, setAll] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [bills, cli] = await Promise.all([db.billing.getAll(), db.clients.getAll()]);
      setAll(bills);
      setClients(cli);
    } finally { setLoading(false); }
  };

  const filtered = all.filter(b => {
    const dateOk = (() => {
      if (!fromDate && !toDate) return true;
      const bd = new Date(b.billdate ?? b.createddate);
      if (fromDate && bd < new Date(fromDate)) return false;
      if (toDate && bd > new Date(toDate)) return false;
      return true;
    })();
    const clientOk = !selectedClient || b.clientid?.toString() === selectedClient;
    return dateOk && clientOk;
  });

  const totalAmount = filtered.reduce((s, b) => s + (b.totalamount ?? 0), 0);
  const totalTax = filtered.reduce((s, b) => s + (b.gstamount ?? 0), 0);
  const activeCount = filtered.filter(b => b.isactive).length;

  const exportCSV = () => {
    const headers = ['Bill No', 'Date', 'Client', 'Bill Amount', 'GST Amount', 'Taxable Amount', 'Status'];
    const rows = filtered.map(b => [
      b.billno ?? '',
      b.billdate ?? '',
      b.clientdetails?.clientname ?? '',
      (b.totalamount ?? 0).toFixed(2),
      (b.gstamount ?? 0).toFixed(2),
      (b.taxableamount ?? 0).toFixed(2),
      b.isactive ? 'Active' : 'Void',
    ]);
    downloadCSV('transactions_report.csv', headers, rows);
  };

  const filteredClientSuggestions = clients.filter(c =>
    c.clientname.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Filters */}
      <TView style={[styles.filterCard, { backgroundColor: colors.card }]}>
        <View style={styles.filterRow}>
          <View style={styles.filterGroup}>
            <TText variant="caption" style={styles.filterLabel}>From Date</TText>
            <TView style={[styles.filterInput, { backgroundColor: colors.surfaceSecondary }]}>
              <Calendar size={14} color={colors.textSecondary} />
              <TextInput
                value={fromDate}
                onChangeText={setFromDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                style={{ flex: 1, marginLeft: 8, color: colors.text, fontSize: 13 }}
              />
            </TView>
          </View>

          <View style={styles.filterGroup}>
            <TText variant="caption" style={styles.filterLabel}>To Date</TText>
            <TView style={[styles.filterInput, { backgroundColor: colors.surfaceSecondary }]}>
              <Calendar size={14} color={colors.textSecondary} />
              <TextInput
                value={toDate}
                onChangeText={setToDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                style={{ flex: 1, marginLeft: 8, color: colors.text, fontSize: 13 }}
              />
            </TView>
          </View>

          <View style={[styles.filterGroup, { flex: 2 }]}>
            <TText variant="caption" style={styles.filterLabel}>Client</TText>
            <TView style={[styles.filterInput, { backgroundColor: colors.surfaceSecondary }]}>
              <Users size={14} color={colors.textSecondary} />
              <TextInput
                value={clientSearch}
                onChangeText={v => { setClientSearch(v); if (!v) setSelectedClient(''); }}
                placeholder="All clients"
                placeholderTextColor={colors.textSecondary}
                style={{ flex: 1, marginLeft: 8, color: colors.text, fontSize: 13 }}
              />
            </TView>
            {clientSearch.length > 0 && !selectedClient && filteredClientSuggestions.length > 0 && (
              <TView style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {filteredClientSuggestions.map(c => (
                  <TouchableOpacity
                    key={c.clientid}
                    onPress={() => { setSelectedClient(c.clientid.toString()); setClientSearch(c.clientname); }}
                    style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                  >
                    <TText style={{ fontSize: 13, fontWeight: '600' }}>{c.clientname}</TText>
                  </TouchableOpacity>
                ))}
              </TView>
            )}
          </View>

          <TouchableOpacity
            onPress={() => { setFromDate(''); setToDate(''); setClientSearch(''); setSelectedClient(''); }}
            style={[styles.resetBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <RefreshCw size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={exportCSV} style={styles.exportBtn}>
            <LinearGradient colors={[COLORS.primary, '#6366f1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill} />
            <View style={{ zIndex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Download size={16} color="#fff" />
              <TText style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Export CSV</TText>
            </View>
          </TouchableOpacity>
        </View>
      </TView>

      {/* Summary chips */}
      <View style={styles.statsRow}>
        <StatChip label="Total Bills" value={filtered.length} colors={colors} />
        <StatChip label="Total Revenue" value={`₹${totalAmount.toFixed(2)}`} color={COLORS.primary} colors={colors} />
        <StatChip label="Total GST" value={`₹${totalTax.toFixed(2)}`} color={COLORS.warning} colors={colors} />
        <StatChip label="Active Bills" value={activeCount} color={COLORS.success} colors={colors} />
      </View>

      {/* Table */}
      <TView style={[styles.tableCard, { backgroundColor: colors.card }]}>
        <View style={[styles.tableHeaderRow, { borderBottomColor: colors.border }]}>
          {['Bill No', 'Date', 'Client', 'Taxable Amt', 'GST Amt', 'Total Amt', 'Status'].map(h => (
            <TText key={h} variant="caption" style={[styles.th, h === 'Bill No' ? { flex: 1.2 } : {}]}>{h}</TText>
          ))}
        </View>
        <ScrollView>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <TText variant="caption">No transactions match the filters.</TText>
            </View>
          ) : (
            filtered.map((b, i) => (
              <MotiView
                key={b.billingid ?? i}
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 30 }}
                style={[styles.tableRow, { borderBottomColor: colors.border }]}
              >
                <TText style={[styles.td, { flex: 1.2, fontWeight: '700' }]}>{b.billno ?? '—'}</TText>
                <TText style={styles.td}>{b.billdate ?? '—'}</TText>
                <TText style={[styles.td, { fontWeight: '600' }]}>{b.clientdetails?.clientname ?? '—'}</TText>
                <TText style={styles.td}>₹{(b.taxableamount ?? 0).toFixed(2)}</TText>
                <TText style={[styles.td, { color: COLORS.warning }]}>₹{(b.gstamount ?? 0).toFixed(2)}</TText>
                <TText style={[styles.td, { color: COLORS.primary, fontWeight: '700' }]}>₹{(b.totalamount ?? 0).toFixed(2)}</TText>
                <View style={styles.td}>
                  <View style={[styles.badge, { backgroundColor: (b.isactive ? COLORS.success : COLORS.danger) + '20' }]}>
                    <TText style={{ fontSize: 10, fontWeight: '800', color: b.isactive ? COLORS.success : COLORS.danger }}>
                      {b.isactive ? 'ACTIVE' : 'VOID'}
                    </TText>
                  </View>
                </View>
              </MotiView>
            ))
          )}
        </ScrollView>
      </TView>
    </View>
  );
};

// ─── Report 2: Inventory Stock Adjustment ──────────────────────────
const InventoryReport = ({ colors }: { colors: any }) => {
  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setLog(await db.inventory.getAll()); }
    finally { setLoading(false); }
  };

  const filtered = log.filter(e => {
    const typeOk = typeFilter === 'all' || e.movementtype === typeFilter;
    const dateOk = (() => {
      if (!fromDate && !toDate) return true;
      const d = new Date(e.createddate);
      if (fromDate && d < new Date(fromDate)) return false;
      if (toDate && d > new Date(toDate)) return false;
      return true;
    })();
    const searchOk = !search || (e.products?.productname ?? '').toLowerCase().includes(search.toLowerCase());
    return typeOk && dateOk && searchOk;
  });

  const totals = filtered.reduce((acc, e) => {
    acc[e.movementtype] = (acc[e.movementtype] ?? 0) + e.quantitymoved;
    return acc;
  }, {} as Record<string, number>);

  const exportCSV = () => {
    const headers = ['ID', 'Product', 'Type', 'Qty Moved', 'Previous Stock', 'New Stock', 'Reference', 'Notes', 'Date'];
    const rows = filtered.map(e => [
      e.inventoryid,
      e.products?.productname ?? '',
      e.movementtype,
      e.quantitymoved,
      e.previousstock,
      e.newstock,
      e.referenceno ?? '',
      e.notes ?? '',
      new Date(e.createddate).toLocaleDateString('en-IN'),
    ].map(String));
    downloadCSV('inventory_adjustment_report.csv', headers, rows);
  };

  const TYPES = ['all', 'restock', 'sale', 'adjustment', 'return'];

  return (
    <View style={{ flex: 1 }}>
      {/* Filters */}
      <TView style={[styles.filterCard, { backgroundColor: colors.card }]}>
        <View style={styles.filterRow}>
          {/* Type pill filter */}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {TYPES.map(t => {
              const cfg = t === 'all' ? { label: 'All', color: COLORS.primary } : MOVEMENT_CONFIG[t];
              const active = typeFilter === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTypeFilter(t)}
                  style={[styles.typePill, {
                    backgroundColor: active ? cfg.color + '25' : colors.surfaceSecondary,
                    borderColor: active ? cfg.color : 'transparent',
                    borderWidth: 1.5,
                  }]}
                >
                  <TText style={{ fontSize: 12, fontWeight: '700', color: active ? cfg.color : colors.textSecondary }}>
                    {cfg.label.toUpperCase()}
                  </TText>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.filterGroup}>
            <TView style={[styles.filterInput, { backgroundColor: colors.surfaceSecondary }]}>
              <Calendar size={14} color={colors.textSecondary} />
              <TextInput value={fromDate} onChangeText={setFromDate} placeholder="From YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                style={{ flex: 1, marginLeft: 8, color: colors.text, fontSize: 13 }} />
            </TView>
          </View>

          <View style={styles.filterGroup}>
            <TView style={[styles.filterInput, { backgroundColor: colors.surfaceSecondary }]}>
              <Calendar size={14} color={colors.textSecondary} />
              <TextInput value={toDate} onChangeText={setToDate} placeholder="To YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                style={{ flex: 1, marginLeft: 8, color: colors.text, fontSize: 13 }} />
            </TView>
          </View>

          <View style={[styles.filterGroup, { flex: 1.5 }]}>
            <TView style={[styles.filterInput, { backgroundColor: colors.surfaceSecondary }]}>
              <Package size={14} color={colors.textSecondary} />
              <TextInput value={search} onChangeText={setSearch} placeholder="Search product"
                placeholderTextColor={colors.textSecondary}
                style={{ flex: 1, marginLeft: 8, color: colors.text, fontSize: 13 }} />
            </TView>
          </View>

          <TouchableOpacity onPress={exportCSV} style={styles.exportBtn}>
            <LinearGradient colors={[COLORS.primary, '#6366f1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill} />
            <View style={{ zIndex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Download size={16} color="#fff" />
              <TText style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Export CSV</TText>
            </View>
          </TouchableOpacity>
        </View>
      </TView>

      {/* Summary chips */}
      <View style={styles.statsRow}>
        <StatChip label="Total Entries" value={filtered.length} colors={colors} />
        <StatChip label="Restocked" value={`+${totals.restock ?? 0}`} color={COLORS.success} colors={colors} />
        <StatChip label="Sales Out" value={`-${totals.sale ?? 0}`} color={COLORS.danger} colors={colors} />
        <StatChip label="Adjustments" value={totals.adjustment ?? 0} color={COLORS.warning} colors={colors} />
        <StatChip label="Returns" value={`+${totals.return ?? 0}`} color="#818cf8" colors={colors} />
      </View>

      {/* Table */}
      <TView style={[styles.tableCard, { backgroundColor: colors.card }]}>
        <View style={[styles.tableHeaderRow, { borderBottomColor: colors.border }]}>
          {['Product', 'Type', 'Qty Moved', 'Prev → New Stock', 'Reference', 'Notes', 'Date'].map(h => (
            <TText key={h} variant="caption" style={[styles.th, h === 'Product' || h === 'Notes' ? { flex: 1.5 } : {}]}>{h}</TText>
          ))}
        </View>
        <ScrollView>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <TText variant="caption">No movement records match the filters.</TText>
            </View>
          ) : (
            filtered.map((e, i) => {
              const cfg = MOVEMENT_CONFIG[e.movementtype] ?? { label: e.movementtype, color: colors.text };
              const isOut = ['sale', 'adjustment'].includes(e.movementtype);
              return (
                <MotiView
                  key={e.inventoryid ?? i}
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 25 }}
                  style={[styles.tableRow, { borderBottomColor: colors.border }]}
                >
                  <TText style={[styles.td, { flex: 1.5, fontWeight: '700' }]}>{e.products?.productname ?? '—'}</TText>
                  <View style={styles.td}>
                    <View style={[styles.badge, { backgroundColor: cfg.color + '20' }]}>
                      <TText style={{ fontSize: 10, fontWeight: '800', color: cfg.color }}>{cfg.label.toUpperCase()}</TText>
                    </View>
                  </View>
                  <TText style={[styles.td, { fontWeight: '800', color: isOut ? COLORS.danger : COLORS.success }]}>
                    {isOut ? '-' : '+'}{e.quantitymoved}
                  </TText>
                  <TText style={styles.td}>{e.previousstock} → {e.newstock}</TText>
                  <TText style={styles.td}>{e.referenceno ?? '—'}</TText>
                  <TText style={[styles.td, { flex: 1.5 }]} numberOfLines={2}>{e.notes ?? '—'}</TText>
                  <TText style={styles.td}>{new Date(e.createddate).toLocaleDateString('en-IN')}</TText>
                </MotiView>
              );
            })
          )}
        </ScrollView>
      </TView>
    </View>
  );
};

// ─── Main Reports Screen ────────────────────────────────────────────
export const Reports = () => {
  const { colors } = useTheme();
  const [tab, setTab] = useState<ReportTab>('transactions');

  const TABS: { key: ReportTab; label: string; icon: any; desc: string }[] = [
    { key: 'transactions', label: 'All Transactions', icon: FileText, desc: 'Full billing history with date & client filters' },
    { key: 'inventory', label: 'Inventory Adjustments', icon: TrendingUp, desc: 'Stock movement log with type filters' },
  ];

  return (
    <WebLayout>
      {/* Page Header */}
      <View style={styles.header}>
        <View>
          <TText variant="title" style={{ fontSize: 32 }}>Reports</TText>
          <TText variant="caption">Analyse, filter and export your business data</TText>
        </View>
        <View style={[styles.reportBadge, { backgroundColor: COLORS.primary + '20' }]}>
          <BarChart2 size={16} color={COLORS.primary} />
          <TText style={{ color: COLORS.primary, fontWeight: '700', fontSize: 12, marginLeft: 6 }}>
            {TABS.length} REPORTS
          </TText>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabRow}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tabCard, { backgroundColor: colors.card, borderColor: active ? COLORS.primary : colors.border }]}
            >
              {active && (
                <LinearGradient
                  colors={[COLORS.primary + '15', COLORS.primary + '05']}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <View style={[styles.tabCardIcon, { backgroundColor: active ? COLORS.primary + '20' : colors.surfaceSecondary }]}>
                <Icon size={20} color={active ? COLORS.primary : colors.textSecondary} />
              </View>
              <View style={{ marginLeft: 12, flex: 1, zIndex: 1 }}>
                <TText style={{ fontWeight: '700', color: active ? COLORS.primary : colors.text }}>{t.label}</TText>
                <TText variant="caption" style={{ fontSize: 11, marginTop: 2 }}>{t.desc}</TText>
              </View>
              {active && <View style={styles.activeBar} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Report Content */}
      {tab === 'transactions'
        ? <TransactionsReport colors={colors} />
        : <InventoryReport colors={colors} />
      }
    </WebLayout>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  reportBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  tabRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  tabCard: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: RADIUS.xl, borderWidth: 1.5, overflow: 'hidden', position: 'relative' },
  tabCardIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  activeBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: COLORS.primary, borderTopLeftRadius: RADIUS.xl, borderBottomLeftRadius: RADIUS.xl },
  filterCard: { padding: 20, borderRadius: RADIUS.xl, marginBottom: 20, overflow: 'visible' },
  filterRow: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  filterGroup: { flex: 1, minWidth: 140, position: 'relative' },
  filterLabel: { fontWeight: '700', marginBottom: 6, fontSize: 11 },
  filterInput: { flexDirection: 'row', alignItems: 'center', height: 42, borderRadius: 10, paddingHorizontal: 12 },
  typePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  dropdown: { position: 'absolute', top: 50, left: 0, right: 0, borderRadius: 12, borderWidth: 1, zIndex: 999, ...SHADOWS.lg },
  dropdownItem: { padding: 12, borderBottomWidth: 1 },
  resetBtn: { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  exportBtn: { height: 42, paddingHorizontal: 18, borderRadius: 10, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 20, flexWrap: 'wrap' },
  statChip: { flex: 1, minWidth: 140, padding: 16, borderRadius: RADIUS.xl, borderWidth: 1 },
  tableCard: { borderRadius: RADIUS.xl, flex: 1, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  th: { flex: 1, fontWeight: '700', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  td: { flex: 1, fontSize: 13 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
});

export default Reports;
