import React, { useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { MotiView } from 'moti';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../../theme';
import { Search, Filter, ChevronRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react-native';

const MOCK_INVOICES = [
  { id: '1', client: 'Acme Corp', amount: 1250, date: 'Apr 10, 2026', status: 'Paid' },
  { id: '2', client: 'Global Tech', amount: 850, date: 'Apr 08, 2026', status: 'Pending' },
  { id: '3', client: 'Starlight Inc', amount: 2400, date: 'Apr 05, 2026', status: 'Overdue' },
  { id: '4', client: 'Nexus Soft', amount: 450, date: 'Apr 02, 2026', status: 'Paid' },
  { id: '5', client: 'Pico Design', amount: 980, date: 'Mar 30, 2026', status: 'Pending' },
];

const StatusBadge = ({ status }) => {
  const getColors = () => {
    switch (status) {
      case 'Paid': return { bg: COLORS.accent + '20', text: COLORS.accent, icon: CheckCircle2 };
      case 'Pending': return { bg: COLORS.warning + '20', text: COLORS.warning, icon: Clock };
      case 'Overdue': return { bg: COLORS.danger + '20', text: COLORS.danger, icon: AlertCircle };
      default: return { bg: '#eee', text: '#333', icon: Clock };
    }
  };
  const { bg, text, icon: Icon } = getColors();
  return (
    <TView style={[styles.badge, { backgroundColor: bg }]}>
      <Icon size={12} color={text} style={{ marginRight: 4 }} />
      <TText style={{ color: text, fontSize: 10, fontWeight: '700' }}>{status}</TText>
    </TView>
  );
};

export default function HistoryScreen() {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');

  const renderItem = ({ item, index }) => (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ delay: index * 100 }}
      style={[styles.invoiceCard, { backgroundColor: colors.card, ...SHADOWS.sm }]}
    >
      <TView style={styles.cardInfo}>
        <TText variant="body" style={{ fontWeight: '600' }}>{item.client}</TText>
        <TText variant="caption">{item.date}</TText>
      </TView>
      <TView style={styles.cardRight}>
        <TText variant="subtitle" style={{ color: COLORS.primary }}>${item.amount}</TText>
        <StatusBadge status={item.status} />
      </TView>
      <ChevronRight size={20} color={colors.textSecondary} style={{ marginLeft: 8 }} />
    </MotiView>
  );

  return (
    <TView style={styles.container}>
      <TView style={styles.header}>
        <TText variant="title">History</TText>
        <TView style={styles.searchBar}>
          <TView style={[styles.searchInputContainer, { backgroundColor: colors.surfaceSecondary }]}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              placeholder="Search invoices..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </TView>
          <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.surfaceSecondary }]}>
            <Filter size={20} color={colors.text} />
          </TouchableOpacity>
        </TView>
      </TView>

      <FlatList
        data={MOCK_INVOICES}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </TView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: SPACING.xl,
    paddingTop: 60,
  },
  searchBar: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  searchInputContainer: {
    flex: 1,
    height: 50,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 14,
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.xl,
    paddingTop: 0,
  },
  invoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
});
