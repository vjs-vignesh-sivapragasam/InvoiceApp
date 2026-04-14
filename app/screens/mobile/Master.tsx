import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Dimensions, SafeAreaView, Platform } from 'react-native';
import { MotiView } from '@/components/MotiShim';
import { LinearGradient } from 'expo-linear-gradient';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../../theme';
import { 
  Users, Package, Database, ChevronRight, ChevronLeft,
  Box, ArrowRightLeft, BarChart2, ShieldCheck, 
  Zap, Info, Layout
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const MasterItem = ({ icon: Icon, title, subtitle, color, onPress, delay }: any) => {
  const { colors } = useTheme();
  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ delay, type: 'timing', duration: 400 }}
      style={{ marginBottom: 16 }}
    >
      <TouchableOpacity 
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          styles.itemCard, 
          { 
            backgroundColor: 'transparent', 
            borderWidth: 1.2, 
            borderColor: 'rgba(129, 140, 248, 0.3)',
          }
        ]}
      >
        <TView style={styles.iconBox}>
          <Icon size={22} color={color} />
        </TView>
        <TView style={{ flex: 1, marginLeft: 16 }}>
          <TText style={{ fontSize: 16, fontWeight: '800' }}>{title}</TText>
          <TText variant="caption" style={{ fontSize: 12, marginTop: 2 }}>{subtitle}</TText>
        </TView>
        <TView style={styles.arrowBox}>
           <ChevronRight size={16} color={colors.textSecondary} />
        </TView>
      </TouchableOpacity>
    </MotiView>
  );
};

export default function MasterScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TView style={[styles.header, { borderBottomColor: isDark ? 'rgba(129, 140, 248, 0.2)' : colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <TText variant="subtitle" style={{ fontWeight: '900' }}>Master Settings</TText>
        <TView style={{ width: 40 }} />
      </TView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TView style={styles.innerContent}>
           <TText variant="subtitle" style={styles.groupLabel}>DATA SETUP</TText>
           <MasterItem 
              icon={Users} 
              title="Add Client" 
              subtitle="Register, segment and manage your customers" 
              color={COLORS.primary}
              onPress={() => router.push('/manage-clients')}
              delay={100}
           />
           
           <MasterItem 
              icon={Package} 
              title="Add Product" 
              subtitle="SKU management, HSN and pricing control" 
              color={COLORS.secondary}
              onPress={() => router.push('/manage-products')}
              delay={200}
           />

           <TText variant="subtitle" style={[styles.groupLabel, { marginTop: 10 }]}>RECORDS</TText>
           <MasterItem 
              icon={ArrowRightLeft} 
              title="Stock" 
              subtitle="Stock entries, adjustments and tracking" 
              color={COLORS.accent}
              onPress={() => router.push('/manage-inventory')}
              delay={300}
           />

           <MasterItem 
              icon={BarChart2} 
              title="Reports" 
              subtitle="Sales reports and detailed analytics" 
              color="#a855f7"
              onPress={() => router.push('/reports')}
              delay={400}
           />
        </TView>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1 },
  backBtn: { padding: 8 },
  content: { padding: 5, paddingTop: 15 },
  innerContent: { padding: 15, backgroundColor: 'transparent' },
  groupLabel: { fontSize: 10, fontWeight: '900', color: COLORS.primary, letterSpacing: 1.5, marginBottom: 15, marginLeft: 5 },
  itemCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: RADIUS.xl, marginHorizontal: 10 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  arrowBox: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
});
