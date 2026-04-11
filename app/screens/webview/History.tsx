import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, View } from 'react-native';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { WebLayout } from './WebLayout';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../../theme';
import { db } from '../../../services/supabase';
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal,
  FileText
} from 'lucide-react-native';

export const History = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const data = await db.billing.getAll();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <TText variant="title" style={{ fontSize: 32 }}>Transaction History</TText>
          <TText variant="caption">Manage and search through all your generated invoices</TText>
        </View>
      </View>

      <View style={styles.toolbar}>
        <TView style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput 
            placeholder="Search by ID, client..." 
            style={[styles.input, { color: colors.text }]} 
            placeholderTextColor={colors.textSecondary}
          />
        </TView>
        <TouchableOpacity style={[styles.filterBtn, { borderColor: colors.border }]}>
          <Filter size={18} color={colors.text} />
          <TText style={{ marginLeft: 8 }}>Filters</TText>
        </TouchableOpacity>
      </View>

      <TView style={[styles.tableCard, { backgroundColor: colors.card, ...SHADOWS.sm }]}>
        <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
          <TText style={[styles.col, { flex: 1.5 }]} variant="caption">Invoice ID</TText>
          <TText style={[styles.col, { flex: 2 }]} variant="caption">Client Name</TText>
          <TText style={styles.col} variant="caption">Amount</TText>
          <TText style={styles.col} variant="caption">Date</TText>
          <TText style={styles.col} variant="caption">Status</TText>
          <View style={{ width: 80 }} />
        </View>

        {transactions.map((row) => (
          <View key={row.billingid} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
            <TText style={[styles.col, { flex: 1.5, fontWeight: '700' }]} variant="body">{row.billno || `INV-${row.billingid}`}</TText>
            <View style={[styles.col, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
              <TView style={[styles.avatar, { backgroundColor: colors.surfaceSecondary }]}>
                <FileText size={14} color={COLORS.primary} />
              </TView>
              <TText style={{ marginLeft: 12 }}>{row.clientdetails?.clientname || 'Deleted Client'}</TText>
            </View>
            <TText style={styles.col} variant="body">${row.totalamount?.toFixed(2)}</TText>
            <TText style={styles.col} variant="body">{row.billdate}</TText>
            <View style={styles.col}>
              <View style={[styles.statusBadge, { backgroundColor: (row.isactive ? COLORS.accent : COLORS.warning) + '20' }]}>
                <TText style={{ fontSize: 11, color: row.isactive ? COLORS.accent : COLORS.warning, fontWeight: '700' }}>
                  {row.isactive ? 'Active' : 'Void'}
                </TText>
              </View>
            </View>
            <View style={styles.actionGroup}>
              <TouchableOpacity><Download size={18} color={colors.textSecondary} /></TouchableOpacity>
              <TouchableOpacity><MoreHorizontal size={18} color={colors.textSecondary} /></TouchableOpacity>
            </View>
          </View>
        ))}
      </TView>
    </WebLayout>
  );
};

const styles = StyleSheet.create({
  header: { marginBottom: 40 },
  toolbar: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  searchBox: { flex: 1, maxWidth: 400, height: 48, borderRadius: RADIUS.md, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  input: { flex: 1, marginLeft: 12 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 48, borderRadius: RADIUS.md, borderWidth: 1 },
  tableCard: { borderRadius: RADIUS.xl, padding: 24 },
  tableHeader: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, marginBottom: 8 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  col: { flex: 1 },
  avatar: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  actionGroup: { width: 80, flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
});
