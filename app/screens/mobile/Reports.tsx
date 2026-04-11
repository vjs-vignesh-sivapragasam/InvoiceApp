import React, { useState, useEffect } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, View, Share, Platform
} from 'react-native';
import { MotiView } from 'moti';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../../theme';
import { db } from '../../../services/supabase';
import {
  FileText, TrendingUp, Download, Calendar,
  Users, Package, ArrowUpCircle, ArrowDownCircle,
  Sliders, RotateCcw, RefreshCw, Filter
} from 'lucide-react-native';

type ReportTab = 'transactions' | 'inventory';

const MOVEMENT_CONFIG: Record<string, { label: string; color: string }> = {
  restock:    { label: 'Restock',    color: COLORS.success },
  sale:       { label: 'Sale',       color: COLORS.danger  },
  adjustment: { label: 'Adjustment', color: COLORS.warning },
  return:     { label: 'Return',     color: '#818cf8'      },
};

// ─── CSV share helper (mobile uses Share API) ─────────────────────
const shareCSV = async (filename: string, headers: string[], rows: string[][]) => {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  await Share.share({ title: filename, message: csv });
};

// ─── Stat Chip ────────────────────────────────────────────────────
const StatChip = ({ label, value, color, colors }: any) => (
  <TView style={[styles.statChip, { backgroundColor: colors.card }]}>
    <TText variant="caption" style={{ fontSize: 10 }}>{label}</TText>
    <TText style={{ fontWeight: '800', fontSize: 16, color: color ?? colors.text, marginTop: 2 }}>{value}</TText>
  </TView>
);

// ─── Bill Card ────────────────────────────────────────────────────
const BillCard = ({ bill, colors }: any) => (
  <MotiView
    from={{ opacity: 0, translateX: -10 }}
    animate={{ opacity: 1, translateX: 0 }}
    style={[styles.card, { backgroundColor: colors.card }]}
  >
    <View style={styles.cardRow}>
      <TText style={{ fontWeight: '700', flex: 1 }}>{bill.billno ?? '—'}</TText>
      <View style={[styles.badge, { backgroundColor: (bill.isactive ? COLORS.success : COLORS.danger) + '20' }]}>
        <TText style={{ fontSize: 10, fontWeight: '700', color: bill.isactive ? COLORS.success : COLORS.danger }}>
          {bill.isactive ? 'ACTIVE' : 'VOID'}
        </TText>
      </View>
    </View>
    <TText variant="caption" style={{ marginTop: 2 }}>{bill.clientdetails?.clientname ?? '—'}</TText>
    <View style={[styles.cardRow, { marginTop: 10 }]}>
      <TText variant="caption">{bill.billdate ?? '—'}</TText>
      <TText style={{ fontWeight: '800', color: COLORS.primary }}>₹{(bill.totalamount ?? 0).toFixed(2)}</TText>
    </View>
  </MotiView>
);

// ─── Stock Entry Card ─────────────────────────────────────────────
const StockCard = ({ entry, colors }: any) => {
  const cfg = MOVEMENT_CONFIG[entry.movementtype] ?? { label: entry.movementtype, color: colors.text };
  const isOut = ['sale', 'adjustment'].includes(entry.movementtype);
  return (
    <MotiView
      from={{ opacity: 0, translateX: -10 }}
      animate={{ opacity: 1, translateX: 0 }}
      style={[styles.card, { backgroundColor: colors.card }]}
    >
      <View style={styles.cardRow}>
        <TText style={{ fontWeight: '700', flex: 1 }}>{entry.products?.productname ?? '—'}</TText>
        <View style={[styles.badge, { backgroundColor: cfg.color + '20' }]}>
          <TText style={{ fontSize: 10, fontWeight: '700', color: cfg.color }}>{cfg.label.toUpperCase()}</TText>
        </View>
      </View>
      <TText variant="caption" style={{ marginTop: 2 }}>{entry.notes ?? entry.referenceno ?? '—'}</TText>
      <View style={[styles.cardRow, { marginTop: 10 }]}>
        <TText variant="caption">{entry.previousstock} → {entry.newstock} units</TText>
        <TText style={{ fontWeight: '800', color: isOut ? COLORS.danger : COLORS.success }}>
          {isOut ? '-' : '+'}{entry.quantitymoved}
        </TText>
      </View>
    </MotiView>
  );
};

// ─── Date Filter Row ──────────────────────────────────────────────
const DateFilters = ({ fromDate, setFromDate, toDate, setToDate, colors }: any) => (
  <View style={styles.dateRow}>
    <TView style={[styles.dateInput, { backgroundColor: colors.card }]}>
      <Calendar size={14} color={colors.textSecondary} />
      <TextInput
        value={fromDate} onChangeText={setFromDate} placeholder="From YYYY-MM-DD"
        placeholderTextColor={colors.textSecondary}
        style={{ flex: 1, marginLeft: 8, color: colors.text, fontSize: 13 }}
      />
    </TView>
    <TView style={[styles.dateInput, { backgroundColor: colors.card }]}>
      <Calendar size={14} color={colors.textSecondary} />
      <TextInput
        value={toDate} onChangeText={setToDate} placeholder="To YYYY-MM-DD"
        placeholderTextColor={colors.textSecondary}
        style={{ flex: 1, marginLeft: 8, color: colors.text, fontSize: 13 }}
      />
    </TView>
  </View>
);

// ─── Transactions Sub-Report ──────────────────────────────────────
const TransactionsReport = ({ colors }: { colors: any }) => {
  const [loading, setLoading]   = useState(true);
  const [all, setAll]           = useState<any[]>([]);
  const [clients, setClients]   = useState<any[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientPicker, setShowClientPicker] = useState(false);

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
      if (toDate   && bd > new Date(toDate))   return false;
      return true;
    })();
    return dateOk && (!clientId || b.clientid?.toString() === clientId);
  });

  const totalRevenue = filtered.reduce((s, b) => s + (b.totalamount ?? 0), 0);
  const totalTax     = filtered.reduce((s, b) => s + (b.gstamount ?? 0), 0);

  const onExport = () => {
    const headers = ['Bill No', 'Date', 'Client', 'Taxable', 'GST', 'Total', 'Status'];
    const rows = filtered.map(b => [
      b.billno ?? '', b.billdate ?? '',
      b.clientdetails?.clientname ?? '',
      (b.taxableamount ?? 0).toFixed(2),
      (b.gstamount ?? 0).toFixed(2),
      (b.totalamount ?? 0).toFixed(2),
      b.isactive ? 'Active' : 'Void',
    ]);
    shareCSV('transactions_report.csv', headers, rows);
  };

  return (
    <View>
      {/* Filters */}
      <DateFilters fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate} colors={colors} />

      <TouchableOpacity
        onPress={() => setShowClientPicker(!showClientPicker)}
        style={[styles.dateInput, { backgroundColor: colors.card, marginBottom: 8 }]}
      >
        <Users size={14} color={colors.textSecondary} />
        <TText style={{ flex: 1, marginLeft: 8, color: clientId ? colors.text : colors.textSecondary, fontSize: 13 }}>
          {clientId ? clients.find(c => c.clientid.toString() === clientId)?.clientname : 'Filter by client…'}
        </TText>
        <Filter size={14} color={colors.textSecondary} />
      </TouchableOpacity>

      {showClientPicker && (
        <TView style={[styles.clientPicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity onPress={() => { setClientId(''); setShowClientPicker(false); }}
            style={[styles.clientItem, { borderBottomColor: colors.border }]}>
            <TText style={{ color: COLORS.primary, fontWeight: '700' }}>All Clients</TText>
          </TouchableOpacity>
          {clients.map(c => (
            <TouchableOpacity key={c.clientid}
              onPress={() => { setClientId(c.clientid.toString()); setShowClientPicker(false); }}
              style={[styles.clientItem, { borderBottomColor: colors.border }]}>
              <TText style={{ fontWeight: '600' }}>{c.clientname}</TText>
            </TouchableOpacity>
          ))}
        </TView>
      )}

      {/* Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatChip label="Total Bills"   value={filtered.length}                    colors={colors} />
          <StatChip label="Revenue"       value={`₹${totalRevenue.toFixed(0)}`}       color={COLORS.primary} colors={colors} />
          <StatChip label="GST"           value={`₹${totalTax.toFixed(0)}`}           color={COLORS.warning} colors={colors} />
          <StatChip label="Active"        value={filtered.filter(b => b.isactive).length} color={COLORS.success} colors={colors} />
        </View>
      </ScrollView>

      {/* Export */}
      <TouchableOpacity onPress={onExport} style={styles.exportBtn}>
        <Download size={16} color="#fff" />
        <TText style={{ color: '#fff', fontWeight: '700', marginLeft: 8 }}>Export / Share CSV</TText>
      </TouchableOpacity>

      {/* Bills */}
      {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} /> : (
        filtered.map(b => <BillCard key={b.billingid} bill={b} colors={colors} />)
      )}
    </View>
  );
};

// ─── Inventory Sub-Report ─────────────────────────────────────────
const InventoryReport = ({ colors }: { colors: any }) => {
  const [loading, setLoading]   = useState(true);
  const [log, setLog]           = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');

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
      if (toDate   && d > new Date(toDate))   return false;
      return true;
    })();
    return typeOk && dateOk;
  });

  const totals = filtered.reduce((acc, e) => {
    acc[e.movementtype] = (acc[e.movementtype] ?? 0) + e.quantitymoved;
    return acc;
  }, {} as Record<string, number>);

  const onExport = () => {
    const headers = ['Product', 'Type', 'Qty Moved', 'Prev', 'New', 'Reference', 'Date'];
    const rows = filtered.map(e => [
      e.products?.productname ?? '',
      e.movementtype,
      e.quantitymoved,
      e.previousstock,
      e.newstock,
      e.referenceno ?? '',
      new Date(e.createddate).toLocaleDateString('en-IN'),
    ].map(String));
    shareCSV('inventory_adjustments.csv', headers, rows);
  };

  const TYPES = ['all', 'restock', 'sale', 'adjustment', 'return'];

  return (
    <View>
      <DateFilters fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate} colors={colors} />

      {/* Type pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {TYPES.map(t => {
            const cfg = t === 'all' ? { label: 'All', color: COLORS.primary } : MOVEMENT_CONFIG[t];
            const active = typeFilter === t;
            return (
              <TouchableOpacity key={t} onPress={() => setTypeFilter(t)}
                style={[styles.typePill, { backgroundColor: active ? cfg.color + '25' : colors.card,
                  borderColor: active ? cfg.color : 'transparent', borderWidth: 1.5 }]}>
                <TText style={{ fontSize: 11, fontWeight: '700', color: active ? cfg.color : colors.textSecondary }}>
                  {cfg.label.toUpperCase()}
                </TText>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatChip label="Entries"    value={filtered.length}                colors={colors} />
          <StatChip label="Restocked" value={`+${totals.restock ?? 0}`}       color={COLORS.success} colors={colors} />
          <StatChip label="Sales Out" value={`-${totals.sale ?? 0}`}          color={COLORS.danger}  colors={colors} />
          <StatChip label="Adjusted"  value={totals.adjustment ?? 0}          color={COLORS.warning} colors={colors} />
          <StatChip label="Returns"   value={`+${totals.return ?? 0}`}        color="#818cf8"        colors={colors} />
        </View>
      </ScrollView>

      <TouchableOpacity onPress={onExport} style={styles.exportBtn}>
        <Download size={16} color="#fff" />
        <TText style={{ color: '#fff', fontWeight: '700', marginLeft: 8 }}>Export / Share CSV</TText>
      </TouchableOpacity>

      {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} /> : (
        filtered.map(e => <StockCard key={e.inventoryid} entry={e} colors={colors} />)
      )}
    </View>
  );
};

// ─── Main Mobile Screen ───────────────────────────────────────────
export default function ReportsScreen() {
  const { colors } = useTheme();
  const [tab, setTab] = useState<ReportTab>('transactions');

  const TABS: { key: ReportTab; label: string; icon: any }[] = [
    { key: 'transactions', label: 'Transactions', icon: FileText   },
    { key: 'inventory',    label: 'Inventory',    icon: TrendingUp },
  ];

  return (
    <TView style={styles.container}>
      {/* Header */}
      <TView style={styles.pageHeader}>
        <TText variant="title">Reports</TText>
        <TText variant="caption">Analyse and export your data</TText>
      </TView>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surfaceSecondary }]}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tabBtn, active && { backgroundColor: colors.card }]}
            >
              <Icon size={16} color={active ? COLORS.primary : colors.textSecondary} />
              <TText style={{ fontSize: 13, fontWeight: '700', marginLeft: 6,
                color: active ? COLORS.primary : colors.textSecondary }}>
                {t.label}
              </TText>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'transactions'
          ? <TransactionsReport colors={colors} />
          : <InventoryReport    colors={colors} />
        }
      </ScrollView>
    </TView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  pageHeader:   { padding: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.md },
  tabBar:       { flexDirection: 'row', marginHorizontal: SPACING.xl, borderRadius: 12, padding: 4, gap: 4 },
  tabBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  content:      { padding: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: 80 },
  dateRow:      { flexDirection: 'row', gap: 8, marginBottom: 8 },
  dateInput:    { flex: 1, flexDirection: 'row', alignItems: 'center', height: 42, borderRadius: 10, paddingHorizontal: 12 },
  clientPicker: { borderRadius: 12, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  clientItem:   { padding: 14, borderBottomWidth: 1 },
  typePill:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  exportBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, height: 48, borderRadius: 12, marginBottom: 16 },
  statChip:     { paddingHorizontal: 16, paddingVertical: 12, borderRadius: RADIUS.lg, minWidth: 100, ...SHADOWS.sm },
  card:         { borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.sm },
  cardRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
});
