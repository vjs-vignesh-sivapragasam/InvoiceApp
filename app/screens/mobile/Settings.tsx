import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, View, Platform, SafeAreaView, RefreshControl } from 'react-native';
import { MotiView } from 'moti';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../../theme';
import { 
  User, Bell, Shield, Moon, LogOut, ChevronRight, 
  Building, Hash, Key, Layout, Globe, Smartphone, Info, ChevronLeft, FileText, Lock
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppConfig } from '../../../components/AppConfigProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../../services/supabase';
import { Activity, Database, Server } from 'lucide-react-native';

const SettingGroup = ({ title, children }: any) => {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ marginBottom: 25 }}>
      <TText style={styles.groupTitle}>{title.toUpperCase()}</TText>
      <TView style={[
        styles.groupCard, 
        { 
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: isDark ? 'rgba(129, 140, 248, 0.4)' : colors.border,
          shadowColor: COLORS.primary,
          shadowOpacity: 0.1,
          shadowRadius: 10
        }
      ]}>
        {children}
      </TView>
    </View>
  );
};

const SettingItem = ({ 
  icon: Icon, title, subtitle, showSwitch, value, onToggle, isLast, delay, onPress, renderRight 
}: any) => {
  const { colors, isDark } = useTheme();
  return (
    <TouchableOpacity 
      onPress={onPress}
      disabled={(showSwitch || !!renderRight) && !onPress}
      style={[styles.item, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
    >
      <TView style={styles.iconContainer}>
        <Icon size={18} color={COLORS.primary} />
      </TView>
      <TView style={styles.itemContent}>
        <TText style={{ fontWeight: '700', fontSize: 14 }}>{title}</TText>
        {subtitle && <TText variant="caption" style={{ fontSize: 11, marginTop: 1, color: isDark ? 'rgba(255,255,255,0.6)' : colors.textSecondary }}>{subtitle}</TText>}
      </TView>
      {renderRight ? renderRight() : (
        showSwitch ? (
          <Switch value={value} onValueChange={onToggle} trackColor={{ false: colors.border, true: COLORS.primary }} />
        ) : (
          <ChevronRight size={18} color={colors.textSecondary} />
        )
      )}
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { config, updateConfig } = useAppConfig();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [health, setHealth] = useState<any>(null);

  React.useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    const status = await db.system.getHealthStatus();
    setHealth(status);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    let userId = 1;

    try {
      const savedProfile = await AsyncStorage.getItem('business_profile');
      if (savedProfile) {
        userId = JSON.parse(savedProfile).userid;
      }
    } catch (e) {
      console.warn('Refresh: Storage access failed, using default ID: 1');
    }

    try {
      const dbProfile = await db.users.getProfile(userId);
      if (dbProfile) {
        updateConfig({ loginEnabled: dbProfile.isloginscreenenabled });
      }
    } catch (e) {
      console.error('Failed to sync settings on refresh', e);
    } finally {
      fetchHealth();
      setRefreshing(false);
    }
  };

  const handleToggleLogin = async (value: boolean) => {
    updateConfig({ loginEnabled: value });
    try {
      await db.users.updateLoginScreenStatus(1, value);
    } catch (e) {
      console.error('Failed to update login status in DB', e);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TView style={[styles.header, { borderBottomColor: colors.border }]}>
        <TText variant="subtitle" style={{ fontWeight: '900' }}>System Settings</TText>
        <TView style={{ width: 24 }} />
      </TView>

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        <SettingGroup title="Business Setup">
          <SettingItem 
            icon={Building} title="Business Profile" subtitle="Public info, address and banking" 
            onPress={() => router.push('/settings/business-details')} 
          />
          <SettingItem 
            icon={Hash} 
            title="Bill No Series" 
            subtitle="Prefix, Delimiter, Starting Number" 
            onPress={() => router.push('/settings/bill-series')}
          />
          <SettingItem 
            icon={Layout} 
            title="Invoice Template" 
            subtitle="Select and set your default invoice design" 
            onPress={() => router.push('/settings/templates')}
          />
          <SettingItem 
            icon={FileText} 
            title="Dummy Bill" 
            subtitle="Quick unofficial bill generation" 
            onPress={() => router.push('/settings/dummy-bill')}
            isLast
          />
        </SettingGroup>

        <SettingGroup title="Database & Connectivity">
          <SettingItem 
            icon={Server} 
            title="Database Health" 
            subtitle={health?.connected ? "Operational • Latency: " + health.latency : "System Offline"} 
            renderRight={() => (
              <TView style={{ 
                width: 8, height: 8, borderRadius: 4, 
                backgroundColor: health?.connected ? COLORS.success : COLORS.danger 
              }} />
            )}
          />
          <SettingItem 
            icon={Database} 
            title="Storage Usage" 
            subtitle={`${health?.usedMB || 0} MB consumed of 500 MB`}
            renderRight={() => (
              <TView style={{ width: 60, height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' }}>
                <TView style={{ 
                  width: `${health?.percentUsed || 0}%`, 
                  height: '100%', 
                  backgroundColor: parseFloat(health?.percentUsed || '0') > 80 ? COLORS.danger : COLORS.primary 
                }} />
              </TView>
            )}
            isLast
          />
        </SettingGroup>

        <SettingGroup title="Preferences">
          <SettingItem 
            icon={Moon} title="Dark Appearance" subtitle="Switch between light and dark modes" 
            showSwitch value={isDark} onToggle={toggleTheme} isLast
          />
        </SettingGroup>

        <SettingGroup title="Security">
          <SettingItem 
            icon={Key} title="Login Screen" subtitle="Requirement authentication on start" 
            showSwitch value={config.loginEnabled} onToggle={handleToggleLogin} 
          />
          <SettingItem 
             icon={Lock} title="Change Password" subtitle="Update your secret login key" 
             onPress={() => router.push('/settings/change-password')}
             isLast
          />
        </SettingGroup>

        <TouchableOpacity 
          onPress={() => router.replace('/(auth)/login')}
          style={[styles.logoutBtn, { borderColor: COLORS.danger + '40' }]}
        >
          <LogOut size={20} color={COLORS.danger} />
          <TText style={{ color: COLORS.danger, fontWeight: '800', marginLeft: 10 }}>Sign Out</TText>
        </TouchableOpacity>

        <TView style={{ alignItems: 'center', marginTop: 30, opacity: 0.5 }}>
           <Smartphone size={24} color={colors.textSecondary} />
           <TText style={{ fontSize: 10, fontWeight: '700', marginTop: 5 }}>v1.0.4.0 • PRODUCTION BUILDA</TText>
        </TView>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 25, borderBottomWidth: 1 },
  content: { padding: 20, paddingTop: 20 },
  groupTitle: { fontSize: 10, fontWeight: '900', color: COLORS.primary, letterSpacing: 1.5, marginBottom: 12, marginLeft: 5 },
  groupCard: { borderRadius: RADIUS.xl, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconContainer: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  itemContent: { flex: 1 },
  miniInput: { width: 60, height: 32, borderRadius: 8, paddingHorizontal: 10, fontSize: 12, fontWeight: '800' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: RADIUS.xl, borderWidth: 1, marginTop: 10 },
});
