import React from 'react';
import { StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../../theme';
import { Plus, Users, Package, CreditCard, TrendingUp, ArrowUpRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const StatCard = ({ title, value, color, icon: Icon, delay = 0 }) => {
  const { colors } = useTheme();
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9, translateY: 20 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ delay }}
      style={[styles.statCard, { backgroundColor: colors.card }]}
    >
      <TView style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Icon size={20} color={color} />
      </TView>
      <TText variant="caption" style={{ marginTop: SPACING.sm }}>{title}</TText>
      <TText style={styles.statValue}>{value}</TText>
      <TView style={styles.statTrend}>
        <TrendingUp size={12} color={COLORS.accent} />
        <TText style={{ color: COLORS.accent, fontSize: 12, marginLeft: 4 }}>+12%</TText>
      </TView>
    </MotiView>
  );
};

export default function DashboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <TView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TView style={styles.headerContent}>
            <TView>
              <TText style={styles.greetingTitle}>Hello, Admin</TText>
              <TText style={styles.greetingSubtitle}>You have 3 pending payments</TText>
            </TView>
            <TouchableOpacity style={styles.profileButton}>
              <TView style={styles.profilePlaceholder}>
                <TText style={{ color: colors.text, fontWeight: '700' }}>JD</TText>
              </TView>
            </TouchableOpacity>
          </TView>
        </LinearGradient>

        <TView style={styles.content}>
          <TView style={styles.quickActions}>
            <TouchableOpacity 
              onPress={() => router.push('/invoice/create')}
              style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
            >
              <Plus color="#fff" size={24} />
              <TText style={styles.actionText}>Create Invoice</TText>
            </TouchableOpacity>
            
            <TView style={styles.smallActions}>
              <TouchableOpacity style={[styles.iconAction, { backgroundColor: colors.surfaceSecondary }]}>
                <Users color={colors.text} size={20} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconAction, { backgroundColor: colors.surfaceSecondary }]}>
                <Package color={colors.text} size={20} />
              </TouchableOpacity>
            </TView>
          </TView>

          <TText variant="subtitle" style={styles.sectionTitle}>Overview</TText>
          <TView style={styles.statsGrid}>
            <StatCard 
              title="Total Revenue" 
              value="$24,500" 
              color={COLORS.primary} 
              icon={CreditCard} 
            />
            <StatCard 
              title="Pending" 
              value="$1,200" 
              color={COLORS.warning} 
              icon={TrendingUp} 
              delay={100}
            />
          </TView>

          <TView style={[styles.chartPlaceholder, { backgroundColor: colors.card, ...SHADOWS.sm }]}>
            <TView style={styles.chartHeader}>
              <TText variant="subtitle">Monthly Revenue</TText>
              <ArrowUpRight size={20} color={colors.textSecondary} />
            </TView>
            <TView style={styles.chartBarContainer}>
              {[40, 70, 45, 90, 65, 80, 50].map((height, i) => (
                <MotiView
                  key={i}
                  from={{ height: 0 }}
                  animate={{ height: height }}
                  transition={{ type: 'timing', duration: 1000, delay: i * 100 }}
                  style={[styles.chartBar, { backgroundColor: i === 3 ? COLORS.primary : colors.surfaceSecondary }]}
                />
              ))}
            </TView>
          </TView>
        </TView>
      </ScrollView>
    </TView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: SPACING.xl,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  greetingSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 2,
  },
  profilePlaceholder: {
    flex: 1,
    borderRadius: RADIUS.md - 2,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: SPACING.xl,
    marginTop: -30,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    flex: 1,
    height: 60,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.md,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
  smallActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  iconAction: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  chartPlaceholder: {
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    marginTop: SPACING.md,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  chartBarContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
  },
  chartBar: {
    width: (width - 120) / 7,
    borderRadius: RADIUS.sm,
  },
});
