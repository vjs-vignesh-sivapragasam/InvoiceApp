import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import {
   Activity,
   ChevronRight,
   Clock,
   DollarSign,
   Moon,
   Package,
   Plus,
   Sun,
   TrendingUp,
   Users,
   Zap,
   AlertTriangle
} from 'lucide-react-native';
import { AnimatePresence, MotiView } from 'moti';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { TText, TView, useTheme } from '../../../components/ThemedUI';
import { db } from '../../../services/supabase';
import { COLORS, SHADOWS } from '../../../theme';

const { width } = Dimensions.get('window');

// Performance calculation helpers moved inside the component for reactivity

const GlassHeader = ({ isDark, toggleTheme, userName }: any) => {
   const [greeting, setGreeting] = useState('');

   useEffect(() => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
   }, []);

   return (
      <View style={styles.headerContainer}>
         <View style={styles.headerContent}>
            <View>
               <TText style={styles.headerGreeting}>{greeting},</TText>
               <TText style={styles.headerName}>{userName}</TText>
            </View>
            <View style={styles.headerActions}>
               <TouchableOpacity onPress={toggleTheme} style={[styles.headerIconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  {isDark ? <Sun size={20} color="#FBBF24" /> : <Moon size={20} color="#6366F1" />}
               </TouchableOpacity>
            </View>
         </View>
      </View>
   );
};

const PerformanceSnapshot = ({ isDark, data = [] }: { isDark: boolean; data: any[] }) => (
   <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: 150 }}
      style={[styles.performanceCard, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
   >
      <View style={styles.perfHeader}>
         <View style={styles.perfTitleRow}>
            <Zap size={16} color={COLORS.primary} strokeWidth={3} />
            <TText style={styles.perfTitle}>Performance</TText>
         </View>
         <TText style={styles.perfSub}>This Week</TText>
      </View>

      <View style={styles.chartArea}>
         {data.map((day, i) => (
            <View key={`${day.label}-${i}`} style={styles.chartCol}>
               <View style={styles.barTrack}>
                  <MotiView
                     from={{ height: 0 }}
                     animate={{ height: `${(day.value || 0) * 100}%` }}
                     transition={{ delay: 300 + (i * 100), type: 'spring' }}
                     style={styles.barFill}
                  >
                     <LinearGradient colors={['#6366F1', '#4F46E5']} style={StyleSheet.absoluteFill} />
                  </MotiView>
               </View>
               <TText style={styles.barLabel}>{day.label}</TText>
            </View>
         ))}
      </View>
   </MotiView>
);

const AnalyticsTile = ({ title, value, icon: Icon, gradient, delay }: any) => (
   <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring' }}
      style={styles.tileContainer}
   >
      <LinearGradient colors={gradient} style={styles.tileGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
         <View style={styles.tileTop}>
            <View style={styles.tileIconBack}><Icon size={18} color="#fff" /></View>
            <TText style={styles.tileTitle}>{title}</TText>
         </View>
         <TText style={styles.tileValue}>{value ?? '0'}</TText>
      </LinearGradient>
   </MotiView>
);

export default function DashboardScreen() {
   const { colors, isDark, toggleTheme } = useTheme();
   const router = useRouter();
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [userName, setUserName] = useState('Executive');
   const [stats, setStats] = useState({
      totalRevenue: 0,
      productCount: 0,
      clientCount: 0,
      totalStock: 0,
      topProducts: [] as any[],
      recentInvoices: [] as any[],
      weeklyPerf: [] as any[],
      criticalLowCount: 0,
   });

   const fetchData = useCallback(async () => {
      try {
         const { totalRevenue } = await db.billing.getDashboardStats();
         
         const fetchProfileSafe = async () => {
            try { return await db.users.getProfile(1); }
            catch (e) {
               console.warn('Dashboard: Business profile fetch failed/timed out, using offline profile.', e);
               return null;
            }
         };

         const [clients, invoices, products, dbProfile] = await Promise.all([
            db.clients.getAll(),
            db.billing.getAll(),
            db.products.getWithStock(),
            fetchProfileSafe()
         ]);

         if (dbProfile?.optional1) {
            setUserName(dbProfile.optional1);
         } else {
            const savedProfile = await AsyncStorage.getItem('business_profile');
            if (savedProfile) {
               const parsed = JSON.parse(savedProfile);
               setUserName(parsed.businessName || parsed.ownerName || 'Executive');
            }
         }

         // Calculate Weekly Performance based on Last 7 Days
         const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
         const now = new Date();
         const chartData = [];
         
         for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayIdx = d.getDay();
            
            const revenue = invoices
               .filter(inv => inv.billdate === dateStr)
               .reduce((acc, inv) => acc + (inv.totalamount || 0), 0);
               
            chartData.push({ label: dayLabels[dayIdx], revenue });
         }

         const maxRev = Math.max(...chartData.map(d => d.revenue)) || 1;
         const weeklyPerf = chartData.map(d => ({
            label: d.label,
            value: d.revenue / maxRev
         }));

         const totalStock = products.reduce((acc, p) => acc + (p.currentStock || 0), 0);
         const criticalLowProducts = products.filter(p => p.currentStock < 10);

         setStats({
            totalRevenue,
            productCount: products.length,
            clientCount: clients.length,
            totalStock,
            topProducts: products.slice(0, 8), // Show more in the scrollable view
            recentInvoices: invoices.slice(0, 4),
            weeklyPerf,
            criticalLowCount: criticalLowProducts.length
         });
      } catch (e) {
         console.error('Dashboard error:', e);
      } finally {
         setLoading(false);
         setRefreshing(false);
      }
   }, []);

   useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

   if (loading) {
      return (
         <TView variant="background" style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <ActivityIndicator size="large" color={COLORS.primary} />
         </TView>
      );
   }

   return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#020617' : '#F8FAFC' }]}>
         <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

         <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.primary} />}
         >
            <GlassHeader isDark={isDark} toggleTheme={toggleTheme} userName={userName} />

            {/* CRITICAL STOCK ALERT */}
            {stats.criticalLowCount > 0 && (
               <MotiView 
                  from={{ scale: 0.9, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  style={[styles.alertBanner, { backgroundColor: COLORS.danger + '15', borderColor: COLORS.danger + '30' }]}
               >
                  <AlertTriangle size={20} color={COLORS.danger} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                     <TText style={{ color: COLORS.danger, fontWeight: '900', fontSize: 13 }}>CRITICAL STOCK ALERT</TText>
                     <TText style={{ color: COLORS.danger, fontSize: 11, opacity: 0.8 }}>{stats.criticalLowCount} products are running low on stock. Please restock soon.</TText>
                  </View>
               </MotiView>
            )}

            {/* HIGH IMPACT SUMMARY SECTION */}
            <View style={styles.summarySection}>
               <AnalyticsTile
                  title="Revenue"
                  value={`₹${stats.totalRevenue.toLocaleString()}`}
                  icon={DollarSign}
                  gradient={['#6366F1', '#4338CA']}
                  delay={100}
               />
               <View style={styles.tileColumn}>
                  <AnalyticsTile
                     title="Products"
                     value={stats.productCount}
                     icon={Package}
                     gradient={['#EC4899', '#DB2777']}
                     delay={200}
                  />
                  <AnalyticsTile
                     title="Clients"
                     value={stats.clientCount}
                     icon={Users}
                     gradient={['#10B981', '#059669']}
                     delay={300}
                  />
               </View>
            </View>

            <PerformanceSnapshot isDark={isDark} data={stats.weeklyPerf} />

            {/* INVENTORY SECTION */}
            <View style={styles.actionsBox}>
               <View style={styles.sectionHeader}>
                  <TText style={styles.sectionTitle}>Inventory</TText>
                  <TrendingUp size={18} color={COLORS.primary} />
               </View>
               <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.actionScroll}
               >
                  {stats.topProducts && stats.topProducts.length > 0 ? stats.topProducts.map((p, idx) => {
                     const gradients = [
                        ['#6366F1', '#4F46E5'], // Indigo
                        ['#EC4899', '#DB2777'], // Rose
                        ['#10B981', '#059669'], // Emerald
                        ['#F59E0B', '#D97706'], // Amber
                     ];
                     const grad = gradients[idx % gradients.length];
                     
                     return (
                        <MotiView 
                           key={p.productid || idx}
                           from={{ opacity: 0, scale: 0.9 }}
                           animate={{ opacity: 1, scale: 1 }}
                           transition={{ delay: 400 + (idx * 100) }}
                           style={styles.inventoryCard}
                        >
                           <LinearGradient colors={grad} style={styles.inventoryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                              <View style={styles.invTop}>
                                 <TView style={[styles.stockTag, { backgroundColor: (p.currentStock || 0) < 10 ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)' }]}>
                                    <TText style={styles.invStock}>{p.currentStock || 0}</TText>
                                 </TView>
                                 {(p.currentStock || 0) < 10 && <AlertTriangle size={14} color="#fff" />}
                              </View>
                              <TText style={styles.invLabel}>{p.productname}</TText>
                           </LinearGradient>
                        </MotiView>
                     );
                  }) : (
                     <TText style={{ marginLeft: 25, opacity: 0.5, fontSize: 12 }}>No products found</TText>
                  )}
               </ScrollView>
            </View>

            {/* RECENT FEED SECTION */}
            <View style={styles.feedSection}>
               <View style={styles.sectionHeader}>
                  <TText style={styles.sectionTitle}>Recent Invoices</TText>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/history')} style={styles.viewAllBtn}><TText style={styles.viewAllText}>See all</TText><ChevronRight size={14} color={COLORS.primary} /></TouchableOpacity>
               </View>

               <View style={styles.feedList}>
                  <AnimatePresence>
                     {stats.recentInvoices.map((inv, i) => (
                        <MotiView
                           key={inv.billingid || i}
                           from={{ opacity: 0, translateX: -20 }}
                           animate={{ opacity: 1, translateX: 0 }}
                           transition={{ delay: 400 + (i * 100) }}
                           style={[styles.feedItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fff', borderColor: colors.border }]}
                        >
                           <View style={[styles.feedAvatar, { backgroundColor: COLORS.primary + '15' }]}>
                              <TText style={styles.avatarTxt}>{(inv.clientdetails?.clientname || 'G')[0]}</TText>
                           </View>
                           <View style={styles.feedInfo}>
                              <TText style={styles.feedClient}>{inv.clientdetails?.clientname || 'Cash Customer'}</TText>
                              <TText style={styles.feedMeta}>{inv.billno} • {inv.billdate}</TText>
                           </View>
                           <View style={styles.feedPricing}>
                              <TText style={styles.feedPrice}>₹{inv.totalamount?.toLocaleString()}</TText>
                              <View style={[styles.statusTag, { backgroundColor: inv.isactive ? '#10B98115' : '#F59E0B15' }]}>
                                 <TText style={[styles.statusTxt, { color: inv.isactive ? '#10B981' : '#F59E0B' }]}>{inv.isactive ? 'PAID' : 'PENDING'}</TText>
                              </View>
                           </View>
                        </MotiView>
                     ))}
                  </AnimatePresence>
               </View>
            </View>

            <View style={{ height: 100 }} />
         </ScrollView>
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: { flex: 1 },
   scrollContent: { paddingBottom: 20 },
   headerContainer: { paddingHorizontal: 25, paddingTop: 30, marginBottom: 25 },
   headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
   headerGreeting: { fontSize: 13, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },
   headerName: { fontSize: 26, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5 },
   headerActions: { flexDirection: 'row', gap: 12 },
   headerIconBtn: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },

   // Summary
   summarySection: { paddingHorizontal: 25, flexDirection: 'row', gap: 12, height: 210, marginBottom: 25 },
   tileColumn: { flex: 1, gap: 12 },
   tileContainer: { flex: 1, borderRadius: 24, overflow: 'hidden', ...SHADOWS.md },
   tileGrad: { flex: 1, padding: 16, justifyContent: 'space-between' },
   tileTop: { gap: 6 },
   tileIconBack: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
   tileTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
   tileValue: { color: '#fff', fontSize: 24, fontWeight: '900' },

   // Performance
   performanceCard: { marginHorizontal: 25, padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 30 },
   perfHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
   perfTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
   perfTitle: { fontSize: 15, fontWeight: '900' },
   perfSub: { fontSize: 11, color: '#94A3B8', fontWeight: '700' },
   chartArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 80 },
   chartCol: { alignItems: 'center', flex: 1 },
   barTrack: { width: 12, height: '100%', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
   barFill: { width: '100%', borderRadius: 6 },
   barLabel: { fontSize: 10, fontWeight: '800', marginTop: 8, opacity: 0.5 },

   // Actions
   actionsBox: { marginBottom: 30 },
   sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 15 },
   sectionTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
   actionGrid: { paddingHorizontal: 25, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
   actionScroll: { paddingHorizontal: 25, gap: 15 },
   actionBtn: { width: (width - 74) / 4, height: 85, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 10 },
   actionIconWrap: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', ...SHADOWS.sm },
   actionLabel: { fontSize: 10, fontWeight: '800', opacity: 0.8 },

   // Feed
   feedSection: { paddingBottom: 20 },
   viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
   viewAllText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
   feedList: { paddingHorizontal: 25, gap: 12 },
   feedItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, borderWidth: 1 },
   feedAvatar: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
   avatarTxt: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
   feedInfo: { flex: 1, marginLeft: 15 },
   feedClient: { fontSize: 15, fontWeight: '800' },
   feedMeta: { fontSize: 11, color: '#94A3B8', marginTop: 3, fontWeight: '600' },
   feedPricing: { alignItems: 'flex-end' },
   feedPrice: { fontSize: 15, fontWeight: '900' },
   statusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 5 },
   statusTxt: { fontSize: 8, fontWeight: '900' },
   statBtn: { width: (width - 74) / 4, height: 75, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 5 },
   statValue: { fontSize: 18, fontWeight: '900' },

   // Inventory Cards
   inventoryCard: { width: 160, borderRadius: 18, overflow: 'hidden', ...SHADOWS.sm },
   inventoryGrad: { flex: 1, padding: 15, height: 110, justifyContent: 'space-between' },
   invTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
   stockTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
   invStock: { color: '#fff', fontSize: 18, fontWeight: '900' },
   invLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '800', lineHeight: 14 },
   alertBanner: { marginHorizontal: 25, marginBottom: 20, padding: 15, borderRadius: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
   alertAction: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
});
