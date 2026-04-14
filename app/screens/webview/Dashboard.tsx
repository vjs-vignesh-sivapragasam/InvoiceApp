import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowUpRight,
  ChevronRight,
  CreditCard,
  MoreHorizontal,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react-native';
import { MotiView } from '@/components/MotiShim';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { TText, TView, useTheme } from '../../../components/ThemedUI';
import { db } from '../../../services/supabase';
import { COLORS } from '../../../theme';
import { WebLayout } from './WebLayout';

// Constants
const ANIMATION_DELAYS = {
  STAT_CARD_BASE: 100,
  STAT_CARD_INCREMENT: 100,
  CHART: 400,
  INVOICES: 500,
  CHART_BAR_BASE: 600,
  CHART_BAR_INCREMENT: 50,
  INVOICE_ROW_BASE: 800,
  INVOICE_ROW_INCREMENT: 100,
};

const STAT_CARDS_CONFIG = [
  {
    title: 'Total Revenue',
    key: 'totalRevenue',
    formatValue: (val) => `$${val.toLocaleString()}`,
    trend: '+12.5%',
    icon: CreditCard,
    color: COLORS.primary
  },
  {
    title: 'Active Clients',
    key: 'clientCount',
    formatValue: (val) => val.toString(),
    trend: '+4.2%',
    icon: Users,
    color: COLORS.secondary
  },
  {
    title: 'Transactions',
    key: 'invoiceCount',
    formatValue: (val) => val.toString(),
    trend: 'Active',
    icon: TrendingUp,
    color: COLORS.accent
  },
];

const CHART_DATA = [60, 80, 45, 90, 70, 85, 60, 75, 95, 80, 65, 90];
const HIGHLIGHTED_BAR_INDEX = 8;

// Subcomponents
const StatCard = React.memo(({ title, value, trend, icon: Icon, color, delay }) => {
  const { colors } = useTheme();

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9, translateY: 30 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: 'spring', delay, damping: 15 }}
      whileHover={{ scale: 1.02 }}
      style={[
        styles.statCard,
        { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }
      ]}
    >
      <View style={styles.statHeader}>
        <View style={[
          styles.iconBox,
          {
            backgroundColor: `${color}10`,
            shadowColor: color,
            shadowOpacity: 0.5,
            shadowRadius: 10,
            elevation: 5
          }
        ]}>
          <Icon size={22} color={color} />
        </View>
        <View style={[styles.trendBadge, { backgroundColor: `${COLORS.accent}10` }]}>
          <ArrowUpRight size={14} color={COLORS.accent} />
          <TText style={styles.trendText}>{trend}</TText>
        </View>
      </View>

      <View style={styles.statContent}>
        <TText variant="caption" style={styles.statTitle}>{title}</TText>
        <TText style={[styles.statValue, { color: colors.text }]}>{value}</TText>
      </View>

      <View style={styles.cardFooterGlow}>
        <View style={[styles.glowLine, { backgroundColor: color }]} />
      </View>
    </MotiView>
  );
});

StatCard.displayName = 'StatCard';

const ChartBar = React.memo(({ height, index, isHighlighted, colors }) => (
  <View style={styles.barContainer}>
    <MotiView
      from={{ height: 0 }}
      animate={{ height: `${height}%` }}
      transition={{
        type: 'spring',
        delay: ANIMATION_DELAYS.CHART_BAR_BASE + (index * ANIMATION_DELAYS.CHART_BAR_INCREMENT)
      }}
      style={[
        styles.bar,
        { backgroundColor: isHighlighted ? COLORS.primary : colors.surfaceSecondary }
      ]}
    >
      {isHighlighted && (
        <LinearGradient
          colors={['#818cf8', '#6366f1']}
          style={StyleSheet.absoluteFill}
        />
      )}
    </MotiView>
  </View>
));

ChartBar.displayName = 'ChartBar';

const InvoiceRow = React.memo(({ invoice, index, colors }) => {
  const clientInitial = (invoice.clientdetails?.clientname || 'C')[0];
  const clientName = invoice.clientdetails?.clientname || 'Guest';
  const amount = invoice.totalamount?.toFixed(2) || '0.00';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        delay: ANIMATION_DELAYS.INVOICE_ROW_BASE + (index * ANIMATION_DELAYS.INVOICE_ROW_INCREMENT)
      }}
      style={[styles.tableRow, { borderBottomColor: colors.border }]}
    >
      <View style={styles.clientCell}>
        <TView style={[
          styles.avatar,
          {
            backgroundColor: `${colors.surfaceSecondary}80`,
            borderColor: 'rgba(255,255,255,0.05)'
          }
        ]}>
          <TText style={styles.avatarText}>{clientInitial}</TText>
        </TView>
        <View style={styles.clientInfo}>
          <TText style={styles.clientName}>{clientName}</TText>
          <TText variant="caption" style={styles.invoiceDate}>{invoice.billdate}</TText>
        </View>
      </View>
      <View style={styles.amountCell}>
        <TText style={styles.amount}>${amount}</TText>
        <View style={styles.statusDot} />
      </View>
    </MotiView>
  );
});

InvoiceRow.displayName = 'InvoiceRow';

const DashboardHeader = React.memo(({ colors }) => (
  <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.header}>
    <View>
      <View style={styles.headerTitle}>
        <Zap size={24} color={COLORS.warning} />
        <TText variant="title" style={styles.title}>Analytics Overview</TText>
      </View>
      <TText variant="caption" style={styles.subtitle}>
        Real-time performance metrics for your business
      </TText>
    </View>
    <TouchableOpacity
      style={[
        styles.dateFilter,
        { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }
      ]}
    >
      <TText style={styles.dateFilterText}>LAST 30 DAYS</TText>
      <ChevronRight size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  </MotiView>
));

DashboardHeader.displayName = 'DashboardHeader';

const LoadingState = () => (
  <WebLayout>
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  </WebLayout>
);

// Main Component
export const Dashboard = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    clientCount: 0,
    recentInvoices: []
  });

  const fetchData = useCallback(async () => {
    try {
      const { totalRevenue } = await db.billing.getDashboardStats();
      const [clients, invoices] = await Promise.all([
        db.clients.getAll(),
        db.billing.getAll()
      ]);

      setStats({
        totalRevenue,
        clientCount: clients.length,
        recentInvoices: invoices.slice(0, 5)
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statsWithValues = useMemo(() =>
    STAT_CARDS_CONFIG.map(config => ({
      ...config,
      value: config.formatValue(
        config.key === 'invoiceCount'
          ? stats.recentInvoices.length
          : stats[config.key]
      ),
    })),
    [stats]
  );

  if (loading) return <LoadingState />;

  return (
    <WebLayout>
      <DashboardHeader colors={colors} />

      <View style={styles.statsGrid}>
        {statsWithValues.map((stat, index) => (
          <StatCard
            key={stat.key}
            title={stat.title}
            value={stat.value}
            trend={stat.trend}
            icon={stat.icon}
            color={stat.color}
            delay={ANIMATION_DELAYS.STAT_CARD_BASE + (index * ANIMATION_DELAYS.STAT_CARD_INCREMENT)}
          />
        ))}
      </View>

      <View style={styles.mainGrid}>
        {/* Revenue Chart */}
        <MotiView
          from={{ opacity: 0, translateX: -20 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ delay: ANIMATION_DELAYS.CHART }}
          style={[
            styles.chartContainer,
            { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }
          ]}
        >
          <View style={styles.cardHeader}>
            <View>
              <TText variant="subtitle" style={styles.cardTitle}>Revenue Streams</TText>
              <TText variant="caption">Monthly performance breakdown</TText>
            </View>
            <MoreHorizontal size={20} color={colors.textSecondary} />
          </View>

          <View style={styles.chartWrapper}>
            <View style={styles.chartBars}>
              {CHART_DATA.map((height, index) => (
                <ChartBar
                  key={index}
                  height={height}
                  index={index}
                  isHighlighted={index === HIGHLIGHTED_BAR_INDEX}
                  colors={colors}
                />
              ))}
            </View>
          </View>
        </MotiView>

        {/* Recent Invoices */}
        <MotiView
          from={{ opacity: 0, translateX: 20 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ delay: ANIMATION_DELAYS.INVOICES }}
          style={[
            styles.recentInvoices,
            { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }
          ]}
        >
          <View style={styles.cardHeader}>
            <TText variant="subtitle" style={styles.cardTitle}>Recent Bills</TText>
            <TouchableOpacity>
              <TText style={styles.viewAllButton}>VIEW ALL</TText>
            </TouchableOpacity>
          </View>

          <View style={styles.table}>
            {stats.recentInvoices.map((invoice, index) => (
              <InvoiceRow
                key={invoice.id || index}
                invoice={invoice}
                index={index}
                colors={colors}
              />
            ))}
          </View>
        </MotiView>
      </View>
    </WebLayout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  title: {
    fontSize: 36,
    fontWeight: '900'
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15
  },
  dateFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 12,
    borderWidth: 1
  },
  dateFilterText: {
    fontSize: 13,
    fontWeight: '700'
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 40
  },
  statCard: {
    flex: 1,
    padding: 24,
    borderRadius: 24,
    overflow: 'hidden'
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13
  },
  trendText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '900',
    marginLeft: 4
  },
  statContent: {
    marginTop: 24
  },
  statTitle: {
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '800',
    opacity: 0.6
  },
  statValue: {
    marginTop: 8,
    fontSize: 32,
    fontWeight: '900'
  },
  cardFooterGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.5
  },
  glowLine: {
    flex: 1,
    height: '100%'
  },
  mainGrid: {
    flexDirection: 'row',
    gap: 24,
    height: 450
  },
  chartContainer: {
    flex: 2,
    padding: 30,
    borderRadius: 32
  },
  recentInvoices: {
    flex: 1.2,
    padding: 30,
    borderRadius: 32
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800'
  },
  viewAllButton: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12
  },
  chartWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingTop: 20
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%'
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 6
  },
  bar: {
    width: '100%',
    borderRadius: 8,
    minHeight: 4,
    overflow: 'hidden'
  },
  table: {
    gap: 4
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1
  },
  clientCell: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '900'
  },
  clientInfo: {
    marginLeft: 12
  },
  clientName: {
    fontWeight: '700',
    fontSize: 13
  },
  invoiceDate: {
    fontSize: 10
  },
  amountCell: {
    alignItems: 'flex-end'
  },
  amount: {
    fontWeight: '800',
    fontSize: 14
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginTop: 4
  },
});
