import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { MotiView } from 'moti';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../../theme';
import { User, Bell, Shield, Moon, LogOut, ChevronRight, Building } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const SettingItem = ({ icon: Icon, title, subtitle, showSwitch, value, onToggle, isLast, delay, onPress }) => {
  const { colors } = useTheme();
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay }}
    >
      <TouchableOpacity 
        onPress={onPress}
        style={[styles.item, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
        disabled={showSwitch && !onPress}
      >
        <TView style={[styles.iconContainer, { backgroundColor: colors.surfaceSecondary }]}>
          <Icon size={20} color={COLORS.primary} />
        </TView>
        <TView style={styles.itemContent}>
          <TText variant="body" style={{ fontWeight: '600' }}>{title}</TText>
          {subtitle && <TText variant="caption">{subtitle}</TText>}
        </TView>
        {showSwitch ? (
          <Switch 
            value={value} 
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: COLORS.primary }}
          />
        ) : (
          <ChevronRight size={20} color={colors.textSecondary} />
        )}
      </TouchableOpacity>
    </MotiView>
  );
};

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const router = useRouter();

  return (
    <TView style={styles.container}>
      <TView style={styles.header}>
        <TText variant="title">Settings</TText>
      </TView>

      <ScrollView contentContainerStyle={styles.content}>
        <TText variant="subtitle" style={styles.sectionTitle}>Business Setup</TText>
        <TView style={[styles.section, { backgroundColor: colors.card, ...SHADOWS.sm }]}>
          <SettingItem 
            icon={Building} 
            title="Business Profile" 
            subtitle="Logo, GSTIN, Bank, Address" 
            onPress={() => router.push('/settings/business-details')}
            delay={100}
          />
          <SettingItem 
            icon={Moon} 
            title="Dark Mode" 
            showSwitch 
            value={isDark} 
            onToggle={toggleTheme}
            isLast
            delay={200}
          />
        </TView>

        <TText variant="subtitle" style={styles.sectionTitle}>Notifications</TText>
        <TView style={[styles.section, { backgroundColor: colors.card, ...SHADOWS.sm }]}>
          <SettingItem 
            icon={Bell} 
            title="Email Notifications" 
            showSwitch 
            value={true} 
            delay={400} 
          />
          <SettingItem 
            icon={Shield} 
            title="Security" 
            subtitle="Password & 2FA" 
            isLast
            delay={500} 
          />
        </TView>

        <TText variant="subtitle" style={styles.sectionTitle}>Invoice Customization</TText>
        <TView style={[styles.section, { backgroundColor: colors.card, ...SHADOWS.sm }]}>
          <SettingItem 
            icon={Building} 
            title="Invoice Template" 
            subtitle="Set your default document design" 
            onPress={() => router.push('/settings/templates')}
            isLast
            delay={600}
          />
        </TView>

        <TouchableOpacity 
          onPress={() => router.replace('/(auth)/login')}
          style={[styles.logoutButton, { borderColor: COLORS.danger }]}
        >
          <LogOut size={20} color={COLORS.danger} />
          <TText style={{ color: COLORS.danger, fontWeight: '700', marginLeft: 8 }}>Sign Out</TText>
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    padding: SPACING.xl,
    paddingTop: 0,
  },
  section: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
    marginLeft: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  itemContent: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: SPACING.lg,
    marginBottom: 40,
  },
});
