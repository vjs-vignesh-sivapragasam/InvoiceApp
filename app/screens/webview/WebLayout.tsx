import { usePathname, useRouter } from 'expo-router';
import {
  Bell,
  BarChart2,
  History as HistoryIcon,
  LayoutDashboard,
  LogOut,
  Package as PackageIcon,
  Plus,
  ReceiptText,
  Settings as SettingsIcon,
  UserPlus
} from 'lucide-react-native';
import { MotiView } from 'moti';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { TText, TView, useTheme } from '../../../components/ThemedUI';
import { COLORS, RADIUS, SPACING } from '../../../theme';

const SidebarItem: React.FC<{ icon: React.ComponentType<any>; label: string; path: any; active: boolean }> = ({ icon: Icon, label, path, active }) => {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(path)}
      style={[
        styles.sidebarItem,
        active && { backgroundColor: COLORS.primary + '15' }
      ]}
    >
      <Icon size={20} color={active ? COLORS.primary : colors.textSecondary} />
      <TText
        style={[
          styles.sidebarLabel,
          { color: active ? COLORS.primary : colors.textSecondary, fontWeight: active ? '600' : '500' }
        ]}
      >
        {label}
      </TText>
      {active && <MotiView style={[styles.activeIndicator, { backgroundColor: COLORS.primary }]} />}
    </TouchableOpacity>
  );
};

export const WebLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <TView style={styles.container}>
      {/* Sidebar */}
      <TView style={[styles.sidebar, { borderRightColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.logoSection}>
          <TView style={[styles.logo, { backgroundColor: COLORS.primary }]}>
            <ReceiptText color="#fff" size={24} />
          </TView>
          <TText variant="subtitle" style={{ marginLeft: 12 }}>Invoicer</TText>
        </View>

        <View style={styles.navSection}>
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            path="/(tabs)/dashboard"
            active={pathname.includes('dashboard')}
          />
          <SidebarItem
            icon={UserPlus}
            label="Add Client"
            path="/clients/create"
            active={pathname.includes('/clients/create')}
          />
          <SidebarItem
            icon={PackageIcon}
            label="Add Product"
            path="/products/create"
            active={pathname.includes('/products/create')}
          />
          <SidebarItem
            icon={PackageIcon}
            label="Inventory"
            path="/inventory/update"
            active={pathname.includes('/inventory/update')}
          />
          <SidebarItem
            icon={HistoryIcon}
            label="History"
            path="/(tabs)/history"
            active={pathname.includes('history')}
          />
          <SidebarItem
            icon={BarChart2}
            label="Reports"
            path="/(tabs)/reports"
            active={pathname.includes('reports')}
          />
          <SidebarItem
            icon={SettingsIcon}
            label="Settings"
            path="/(tabs)/settings"
            active={pathname.includes('settings')}
          />
        </View>

        <View style={styles.sidebarFooter}>
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login')}
            style={styles.logoutButton}
          >
            <LogOut size={20} color={colors.textSecondary} />
            <TText style={{ marginLeft: 12, color: colors.textSecondary }}>Sign Out</TText>
          </TouchableOpacity>
        </View>
      </TView>

      {/* Main Content */}
      <View style={[styles.mainContent, { backgroundColor: colors.background }]}>
        {/* Top Header */}
        <TView style={[styles.topHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          {/* Left: User info */}
          <View style={styles.headerLeft}>
            <TView style={[styles.userNameContainer, { backgroundColor: colors.surfaceSecondary }]}>
              <TText style={{ color: colors.text, fontWeight: '600' }}>John Doe</TText>
            </TView>
            <View style={styles.userInfo}>
              <TText variant="caption" style={{ color: colors.textSecondary }}>Last login</TText>
              <TText variant="caption" style={{ color: colors.text }}>Apr 10, 2026 10:00 AM</TText>
            </View>
          </View>

          {/* Right: icons + New Billing */}
          <View style={styles.headerActions}>
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.surfaceSecondary }]}>
              <Bell size={20} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleTheme}
              style={[styles.iconButton, { backgroundColor: colors.surfaceSecondary }]}
            >
              <TText>{isDark ? '🌙' : '☀️'}</TText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: COLORS.primary }]}
              onPress={() => router.push('/invoice/create')}
            >
              <Plus color="#fff" size={18} />
              <TText style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>New Billing</TText>
            </TouchableOpacity>
          </View>
        </TView>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {children}
        </ScrollView>
      </View>
    </TView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    height: '100%',
    borderRightWidth: 1,
    padding: SPACING.lg,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    paddingLeft: 8,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navSection: {
    flex: 1,
    gap: 8,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.md,
    position: 'relative',
  },
  sidebarLabel: {
    marginLeft: 12,
    fontSize: 15,
  },
  activeIndicator: {
    position: 'absolute',
    left: -SPACING.lg,
    width: 4,
    height: 24,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  sidebarFooter: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  mainContent: {
    flex: 1,
  },
  topHeader: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userInfo: {
    alignItems: 'flex-start',
  },
  userNameContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    marginRight: 8,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 44,
    borderRadius: RADIUS.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 40,
    paddingBottom: 100,
  },
});
