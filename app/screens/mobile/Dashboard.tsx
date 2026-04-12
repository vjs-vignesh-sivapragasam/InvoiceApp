import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import {
   ArrowRight,
   Bell,
   CreditCard,
   LayoutGrid,
   Moon,
   Package,
   Plus,
   Sun,
   TrendingUp,
   Users,
   ChevronRight,
   Activity,
   Settings
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatePresence, MotiView } from 'moti';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, RefreshControl, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { TText, TView, useTheme } from '../../../components/ThemedUI';
import { db } from '../../../services/supabase';
import { COLORS, RADIUS, SHADOWS } from '../../../theme';

const { width, height } = Dimensions.get('window');

// ─── Design Tokens ───────────────────────────────────────────────────────────
const DASHBOARD_THEME = {
   gradients: {
      primary: ['#6366F1', '#4F46E5'],
      secondary: ['#EC4899', '#D946EF'],
      accent: ['#10B981', '#059669'],
      surface: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
      darkSurface: ['rgba(30, 41, 59, 0.7)', 'rgba(15, 23, 42, 0.5)'],
   },
   shadows: {
      primary: {
         shadowColor: '#6366F1',
         shadowOffset: { width: 0, height: 10 },
         shadowOpacity: 0.3,
         shadowRadius: 20,
         elevation: 10,
      }
   }
};

// ─── Header Components ─────────────────────────────────────────────────────
const GlassHeader = ({ colors, isDark, toggleTheme, userName, onSettings }: any) => (
   <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={styles.headerContainer}
   >
      <TView style={styles.headerContent}>
         <TView>
            <TText style={styles.headerGreeting}>Good Morning,</TText>
            <TText style={styles.headerName}>{userName}</TText>
         </TView>
         <TView style={styles.headerActions}>
            <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
               <LinearGradient
                  colors={isDark ? ['#334155', '#1E293B'] : ['#F8FAFC', '#F1F5F9']}
                  style={StyleSheet.absoluteFill}
               />
               {isDark ? <Sun size={18} color="#FBBF24" /> : <Moon size={18} color="#6366F1" />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
               <LinearGradient
                  colors={isDark ? ['#334155', '#1E293B'] : ['#F8FAFC', '#F1F5F9']}
                  style={StyleSheet.absoluteFill}
               />
               <Bell size={18} color={isDark ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
         </TView>
      </TView>
   </MotiView>
);

// ─── Analytics Module ────────────────────────────────────────────────────────
const AnalyticsCard = ({ title, value, color, icon: Icon, delay = 0, colors, gradient }: any) => {
   return (
      <MotiView
         from={{ opacity: 0, scale: 0.9, translateY: 20 }}
         animate={{ opacity: 1, scale: 1, translateY: 0 }}
         transition={{ delay, type: 'spring', damping: 15 }}
         style={styles.cardContainer}
      >
         <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
         >
            <TView style={styles.cardTop}>
               <TView style={styles.cardIconBox}>
                  <Icon size={20} color="#fff" strokeWidth={2.5} />
               </TView>
               <TView style={styles.trendBadge}>
                  <TrendingUp size={12} color="#fff" />
                  <TText style={styles.trendText}>+12%</TText>
               </TView>
            </TView>
            
            <TView style={styles.cardBottom}>
               <TText style={styles.cardTitle}>{title}</TText>
               <TText style={styles.cardValue}>{value}</TText>
            </TView>
         </LinearGradient>
      </MotiView>
   );
};

const AnimatedBg = ({ isDark }: { isDark: boolean }) => (
   <View style={StyleSheet.absoluteFill}>
      <LinearGradient
         colors={isDark ? ['#0F172A', '#020617'] : ['#F8FAFC', '#F1F5F9']}
         style={StyleSheet.absoluteFill}
      />
      <MotiView
         from={{ translateX: -100, translateY: -100, scale: 1 }}
         animate={{ 
            translateX: [ -100, 100, -100 ],
            translateY: [ -100, 150, -100 ],
            scale: [1, 1.2, 1]
         }}
         transition={{ duration: 10000, loop: true, type: 'timing' }}
         style={[styles.bgOrb, { backgroundColor: isDark ? '#4F46E520' : '#4F46E510', top: 50, left: 0 }]}
      />
      <MotiView
         from={{ translateX: 200, translateY: 400, scale: 1 }}
         animate={{ 
            translateX: [ 200, -100, 200 ],
            translateY: [ 400, 600, 400 ],
            scale: [1, 1.5, 1]
         }}
         transition={{ duration: 15000, loop: true, type: 'timing' }}
         style={[styles.bgOrb, { backgroundColor: isDark ? '#EC489920' : '#EC489910', bottom: 100, right: 0 }]}
      />
   </View>
);


export default function DashboardScreen() {
   const { colors, isDark, toggleTheme } = useTheme();
   const router = useRouter();
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [userName, setUserName] = useState('Executive');
   const [stats, setStats] = useState({
      totalRevenue: 0,
      clientCount: 0,
      productCount: 0,
      recentInvoices: [] as any[],
   });

   const fetchData = useCallback(async () => {
      try {
         let savedProfile = null;
         try {
            savedProfile = await AsyncStorage.getItem('business_profile');
         } catch (storageErr) {
            console.warn('Storage not available:', storageErr);
         }

         // Try local cache first for instant UI response
         if (savedProfile) {
            const parsed = JSON.parse(savedProfile);
            if (parsed.ownerName) setUserName(parsed.ownerName);
         }

         // Sync from Supabase (Source of Truth)
         const dbProfile = await db.users.getProfile(1);
         if (dbProfile && dbProfile.optional1) {
            setUserName(dbProfile.optional1);
         }

         const { totalRevenue } = await db.billing.getDashboardStats();
         const [clients, invoices, products] = await Promise.all([
            db.clients.getAll(),
            db.billing.getAll(),
            db.products.getAll(),
         ]);
         setStats({
            totalRevenue,
            clientCount: clients.length,
            productCount: products.length,
            recentInvoices: invoices.slice(0, 5),
         });
      } catch (e) {
         console.error('Dashboard error:', e);
      } finally {
         setLoading(false);
         setRefreshing(false);
      }
   }, []);

   useFocusEffect(
      useCallback(() => {
         fetchData();
      }, [fetchData])
   );

   if (loading) {
      return (
         <TView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={COLORS.primary} />
         </TView>
      );
   }

   return (
      <SafeAreaView style={styles.container}>
         <AnimatedBg isDark={isDark} />
         
         <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
               <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={() => { setRefreshing(true); fetchData(); }} 
                  tintColor={COLORS.primary} 
               />
            }
         >
            <GlassHeader isDark={isDark} colors={colors} toggleTheme={toggleTheme} userName={userName} />

            {/* Quick Actions Grid */}
            <MotiView
               from={{ opacity: 0, translateY: 20 }}
               animate={{ opacity: 1, translateY: 0 }}
               transition={{ delay: 100 }}
               style={styles.actionGrid}
            >
               <TouchableOpacity
                  onPress={() => router.push('/(tabs)/billing')}
                  style={styles.mainActionContainer}
               >
                  <LinearGradient
                     colors={DASHBOARD_THEME.gradients.primary}
                     style={StyleSheet.absoluteFill}
                     start={{ x: 0, y: 0 }}
                     end={{ x: 1, y: 1 }}
                  />
                  <TView style={styles.mainActionInner}>
                     <TView style={styles.mainActionIcon}>
                        <Plus size={28} color="#fff" strokeWidth={3} />
                     </TView>
                     <TText style={styles.mainActionText}>Create Bill</TText>
                     <TText style={styles.mainActionSub}>Quick invoice generation</TText>
                  </TView>
               </TouchableOpacity>

               <TView style={styles.subActionGrid}>
                  <TouchableOpacity
                     onPress={() => router.push('/manage-clients')}
                     style={styles.subActionCard}
                  >
                     <TView style={[styles.subIconBox, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                        <Users size={20} color="#6366F1" />
                     </TView>
                     <TText style={[styles.subActionTitle, { color: colors.text }]}>Clients</TText>
                  </TouchableOpacity>

                  <TouchableOpacity
                     onPress={() => router.push('/manage-inventory')}
                     style={styles.subActionCard}
                  >
                     <TView style={[styles.subIconBox, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                        <Package size={20} color="#EC4899" />
                     </TView>
                     <TText style={[styles.subActionTitle, { color: colors.text }]}>Products</TText>
                  </TouchableOpacity>
               </TView>
            </MotiView>

            {/* Stats Section */}
            <TView style={styles.statsSection}>
               <TView style={styles.sectionHeader}>
                  <TText style={[styles.sectionTitle, { color: colors.text }]}>Business Overview</TText>
                  <Activity size={18} color="#6366F1" />
               </TView>

               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
                  <AnalyticsCard
                     title="Total Revenue"
                     value={`₹${stats.totalRevenue.toLocaleString()}`}
                     gradient={DASHBOARD_THEME.gradients.primary}
                     icon={CreditCard}
                     colors={colors}
                     delay={200}
                  />
                  <AnalyticsCard
                     title="Active Clients"
                     value={stats.clientCount}
                     gradient={DASHBOARD_THEME.gradients.accent}
                     icon={Users}
                     colors={colors}
                     delay={300}
                  />
                  <AnalyticsCard
                     title="Total Products"
                     value={stats.productCount}
                     gradient={DASHBOARD_THEME.gradients.secondary}
                     icon={Package}
                     colors={colors}
                     delay={400}
                  />
               </ScrollView>
            </TView>

            {/* Recent Bills Section */}
            <TView style={styles.recentSection}>
               <TView style={styles.sectionHeader}>
                  <TText style={[styles.sectionTitle, { color: colors.text }]}>Recent Invoices</TText>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/history')} style={styles.viewAllBtn}>
                     <TText style={styles.viewAllText}>View All</TText>
                     <ChevronRight size={14} color="#6366F1" />
                  </TouchableOpacity>
               </TView>

               <TView style={styles.billsList}>
                  <AnimatePresence>
                     {stats.recentInvoices.length > 0 ? stats.recentInvoices.map((inv, i) => (
                        <MotiView
                           key={inv.billingid || i}
                           from={{ opacity: 0, translateX: -20 }}
                           animate={{ opacity: 1, translateX: 0 }}
                           transition={{ delay: 500 + (i * 100) }}
                           style={[
                              styles.billRow,
                              { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#fff' },
                              i < stats.recentInvoices.length - 1 && styles.rowBorder
                           ]}
                        >
                           <TView style={styles.billAvatar}>
                              <LinearGradient
                                 colors={['#6366F120', '#6366F110']}
                                 style={StyleSheet.absoluteFill}
                              />
                              <TText style={styles.avatarText}>
                                 {(inv.clientdetails?.clientname || 'G')[0]}
                              </TText>
                           </TView>
                           
                           <TView style={styles.billInfo}>
                              <TText style={[styles.billClient, { color: colors.text }]}>
                                 {inv.clientdetails?.clientname || 'General Customer'}
                              </TText>
                              <TText style={styles.billMeta}>
                                 {inv.billno || '#INV-102'} • {inv.billdate || 'Today'}
                              </TText>
                           </TView>

                           <TView style={styles.billPricing}>
                              <TText style={[styles.billAmount, { color: colors.text }]}>
                                 ₹{inv.totalamount?.toLocaleString()}
                              </TText>
                              <TView style={[
                                 styles.statusBadge,
                                 { backgroundColor: inv.isactive ? '#10B98115' : '#F59E0B15' }
                              ]}>
                                 <TView style={[
                                    styles.statusDot,
                                    { backgroundColor: inv.isactive ? '#10B981' : '#F59E0B' }
                                 ]} />
                                 <TText style={[
                                    styles.statusText,
                                    { color: inv.isactive ? '#10B981' : '#F59E0B' }
                                 ]}>
                                    {inv.isactive ? 'Paid' : 'Pending'}
                                 </TText>
                              </TView>
                           </TView>
                        </MotiView>
                     )) : (
                        <TView style={styles.emptyState}>
                           <TText style={{ color: colors.textSecondary }}>No recent history found</TText>
                        </TView>
                     )}
                  </AnimatePresence>
               </TView>
            </TView>

            <View style={{ height: 100 }} />
         </ScrollView>
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
   },
   scrollContent: {
      flexGrow: 1,
   },
   bgOrb: {
      position: 'absolute',
      width: 300,
      height: 300,
      borderRadius: 150,
      opacity: 0.5,
      filter: 'blur(60px)',
   },

   // Header
   headerContainer: {
      paddingHorizontal: 25,
      paddingTop: 20,
      paddingBottom: 20,
   },
   headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
   },
   headerGreeting: {
      fontSize: 12,
      fontWeight: '700',
      color: '#94A3B8',
      letterSpacing: 0.5,
   },
   headerName: {
      fontSize: 24,
      fontWeight: '900',
      color: '#6366F1',
      marginTop: 2,
   },
   headerActions: {
      flexDirection: 'row',
      gap: 12,
   },
   iconButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(148, 163, 184, 0.1)',
   },

   // Action Grid
   actionGrid: {
      paddingHorizontal: 25,
      flexDirection: 'row',
      gap: 12,
      marginBottom: 30,
   },
   mainActionContainer: {
      flex: 1.2,
      height: 140,
      borderRadius: 24,
      overflow: 'hidden',
      padding: 20,
      justifyContent: 'flex-end',
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 15,
      elevation: 8,
   },
   mainActionInner: {
      zIndex: 1,
   },
   mainActionIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
   },
   mainActionText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '900',
   },
   mainActionSub: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 11,
      fontWeight: '600',
      marginTop: 2,
   },
   subActionGrid: {
      flex: 1,
      gap: 12,
   },
   subActionCard: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 18,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: 'rgba(148, 163, 184, 0.1)',
   },
   subIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
   },
   subActionTitle: {
      fontSize: 13,
      fontWeight: '800',
   },

   // Section Common
   sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 25,
      marginBottom: 16,
   },
   sectionTitle: {
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: -0.5,
   },

   // Stats Cards
   statsSection: {
      marginBottom: 30,
   },
   statsScroll: {
      paddingLeft: 25,
      paddingRight: 10,
      gap: 14,
   },
   cardContainer: {
      width: 150,
      height: 160,
      borderRadius: 24,
      overflow: 'hidden',
   },
   cardGradient: {
      flex: 1,
      padding: 20,
      justifyContent: 'space-between',
   },
   cardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
   },
   cardIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
   },
   trendBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
   },
   trendText: {
      color: '#fff',
      fontSize: 9,
      fontWeight: '800',
   },
   cardBottom: {
      marginTop: 20,
   },
   cardTitle: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 10,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
   },
   cardValue: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '900',
      marginTop: 4,
   },

   // Recent Bills
   recentSection: {
      paddingBottom: 20,
   },
   viewAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
   },
   viewAllText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#6366F1',
   },
   billsList: {
      marginHorizontal: 25,
      borderRadius: 24,
      overflow: 'hidden',
   },
   billRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
   },
   rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(148, 163, 184, 0.08)',
   },
   billAvatar: {
      width: 48,
      height: 48,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
   },
   avatarText: {
      fontSize: 18,
      fontWeight: '900',
      color: '#6366F1',
   },
   billInfo: {
      flex: 1,
      marginLeft: 16,
   },
   billClient: {
      fontSize: 15,
      fontWeight: '800',
   },
   billMeta: {
      fontSize: 11,
      color: '#94A3B8',
      marginTop: 3,
      fontWeight: '600',
   },
   billPricing: {
      alignItems: 'flex-end',
   },
   billAmount: {
      fontSize: 15,
      fontWeight: '900',
   },
   statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      marginTop: 6,
   },
   statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
   },
   statusText: {
      fontSize: 9,
      fontWeight: '800',
   },
   emptyState: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
   }
});
