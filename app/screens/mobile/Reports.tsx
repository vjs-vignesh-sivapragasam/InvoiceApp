import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, View, Share, Platform, Dimensions, SafeAreaView, RefreshControl } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../../theme';
import { db } from '../../../services/supabase';
import { 
  FileText, TrendingUp, Download, Calendar, 
  Users, Package, ArrowUpCircle, ArrowDownCircle, 
  Sliders, RotateCcw, RefreshCw, Filter, ChevronLeft, ChevronRight
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

type ReportTab = 'transactions' | 'inventory';

const MOVEMENT_CONFIG: Record<string, { label: string; color: string }> = {
  restock: { label: 'Restock', color: COLORS.success },
  sale: { label: 'Sale', color: COLORS.danger },
  adjustment: { label: 'Adjustment', color: COLORS.warning },
  return: { label: 'Return', color: '#818cf8' },
};

const shareCSV = async (filename: string, headers: string[], rows: string[][]) => {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  await Share.share({ title: filename, message: csv });
};

const StatModule = ({ label, value, color, icon: Icon }: any) => {
  const { colors } = useTheme();
  return (
    <TView style={[
      styles.statModule, 
      { 
        backgroundColor: 'transparent',
        borderWidth: 1.2,
        borderColor: 'rgba(129, 140, 248, 0.3)'
      }
    ]}>
       <TView style={styles.statIconSmall}>
          <Icon size={14} color={color} />
       </TView>
       <TView style={{ marginTop: 10 }}>
          <TText style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>{value}</TText>
          <TText variant="caption" style={{ fontSize: 10, fontWeight: '700', marginTop: 2 }}>{label.toUpperCase()}</TText>
       </TView>
    </TView>
  );
};

export default function ReportsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<ReportTab>('transactions');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ bills: [] as any[], inventory: [] as any[], clients: [] as any[] });
  
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [clientId, setClientId] = useState('');

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [bills, inv, cli] = await Promise.all([db.billing.getAll(), db.inventory.getAll(), db.clients.getAll()]);
      setData({ bills, inventory: inv, clients: cli });
    } finally { 
      setLoading(false); 
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    load();
  }, []);

  const filteredBills = data.bills.filter(b => {
    const bd = new Date(b.billdate || b.createddate);
    if (fromDate && bd < new Date(fromDate)) return false;
    if (toDate && bd > new Date(toDate)) return false;
    if (clientId && b.clientid?.toString() !== clientId) return false;
    return true;
  });

  const totalRev = filteredBills.reduce((s, b) => s + (b.totalamount || 0), 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TView style={[styles.header, { borderBottomColor: isDark ? 'rgba(129, 140, 248, 0.2)' : colors.border }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/master')} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <TText variant="subtitle" style={{ fontWeight: '900' }}>Reports</TText>
        <TView style={{ width: 40 }} />
      </TView>

      <TView style={[styles.tabBar, { backgroundColor: 'rgba(129, 140, 248, 0.1)', borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.2)' }]}>
        <TouchableOpacity onPress={() => setTab('transactions')} style={[styles.tab, tab === 'transactions' && { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.2)' : '#fff', ...SHADOWS.sm }]}>
           <FileText size={16} color={tab === 'transactions' ? COLORS.primary : colors.textSecondary} />
           <TText style={[styles.tabLabel, tab === 'transactions' && { color: COLORS.primary }]}>Sales</TText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('inventory')} style={[styles.tab, tab === 'inventory' && { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.2)' : '#fff', ...SHADOWS.sm }]}>
           <TrendingUp size={16} color={tab === 'inventory' ? COLORS.primary : colors.textSecondary} />
           <TText style={[styles.tabLabel, tab === 'inventory' && { color: COLORS.primary }]}>Stock</TText>
        </TouchableOpacity>
      </TView>

      <ScrollView 
        contentContainerStyle={styles.content} 
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
        {/* Filter Section */}
        <TView style={[styles.filterCard, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.3)' }]}>
           <TText style={styles.filterTitle}>PERIOD FILTERS</TText>
           <TView style={styles.dateRow}>
              <TView style={[styles.dateInput, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.15)' }]}>
                 <Calendar size={14} color={colors.textSecondary} />
                 <TextInput value={fromDate} onChangeText={setFromDate} placeholder="From YYYY-MM-DD" style={[styles.input, { color: colors.text }]} placeholderTextColor={colors.textSecondary} />
              </TView>
              <TView style={[styles.dateInput, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.15)' }]}>
                 <Calendar size={14} color={colors.textSecondary} />
                 <TextInput value={toDate} onChangeText={setToDate} placeholder="To YYYY-MM-DD" style={[styles.input, { color: colors.text }]} placeholderTextColor={colors.textSecondary} />
              </TView>
           </TView>
           
           <TouchableOpacity onPress={() => {}} style={[styles.exportBtn, { backgroundColor: COLORS.primary }]}>
              <Download size={18} color="#fff" />
              <TText style={{ color: '#fff', fontWeight: '800', marginLeft: 10 }}>Export Result to CSV</TText>
           </TouchableOpacity>
        </TView>

        {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} /> : (
          <>
            <TText variant="subtitle" style={styles.sectionHeader}>Aggregate Performance</TText>
            <View style={styles.statsGrid}>
               <StatModule label="Transactions" value={tab === 'transactions' ? filteredBills.length : data.inventory.length} color={COLORS.primary} icon={TrendingUp} />
               <StatModule label={tab === 'transactions' ? 'Revenue' : 'Stock Out'} value={tab === 'transactions' ? `₹${totalRev.toLocaleString()}` : '-450'} color={tab === 'transactions' ? COLORS.success : COLORS.danger} icon={TrendingUp} />
            </View>

            <TText variant="subtitle" style={[styles.sectionHeader, { marginTop: 25 }]}>Detailed Log</TText>
            {tab === 'transactions' ? filteredBills.map((b, i) => (
               <MotiView key={b.billingid || i} from={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                  <TView>
                     <TText style={{ fontWeight: '700' }}>{b.clientdetails?.clientname || 'Client'}</TText>
                     <TText variant="caption">{b.billno || '#' + b.billingid}</TText>
                  </TView>
                  <TView style={{ alignItems: 'flex-end' }}>
                     <TText style={{ fontWeight: '800', color: COLORS.primary }}>₹{b.totalamount?.toLocaleString()}</TText>
                     <TText variant="caption">{b.billdate}</TText>
                  </TView>
               </MotiView>
            )) : data.inventory.slice(0, 10).map((e, i) => (
              <MotiView key={e.inventoryid || i} from={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                 <TView>
                    <TText style={{ fontWeight: '700' }}>{e.products?.productname || 'Item'}</TText>
                    <TText variant="caption">{e.movementtype.toUpperCase()}</TText>
                 </TView>
                 <TText style={{ fontWeight: '800', color: COLORS.accent }}>{e.quantitymoved} units</TText>
              </MotiView>
            ))}
          </>
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
  tabBar: { flexDirection: 'row', marginHorizontal: 20, padding: 4, borderRadius: 14, marginBottom: 20, marginTop: 15 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  tabLabel: { fontSize: 13, fontWeight: '800', color: COLORS.primary + '50', marginLeft: 8 },
  content: { padding: 20, paddingTop: 0 },
  filterCard: { padding: 20, borderRadius: RADIUS.xl, marginBottom: 30 },
  filterTitle: { fontSize: 9, fontWeight: '900', color: COLORS.primary, letterSpacing: 1, marginBottom: 15 },
  dateRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  dateInput: { flex: 1, height: 44, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  input: { flex: 1, marginLeft: 10, fontSize: 12, fontWeight: '700' },
  exportBtn: { height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  sectionHeader: { marginBottom: 15, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', gap: 15 },
  statModule: { flex: 1, padding: 15, borderRadius: RADIUS.xl },
  statIconSmall: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
});
