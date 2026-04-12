import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Switch, TextInput } from 'react-native';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { WebLayout } from './WebLayout';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../../theme';
import { User, Building, Shield, Moon, ChevronRight, Key, Hash, Layout } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppConfig } from '../../../components/AppConfigProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../../services/supabase';

interface SettingCardProps {
  title: string;
  children: React.ReactNode;
}

const SettingCard: React.FC<SettingCardProps> = ({ title, children }) => {
  const { colors } = useTheme();
  return (
    <TView style={[styles.settingCard, { backgroundColor: colors.card, ...SHADOWS.sm }]}>
      <TText variant="subtitle" style={{ marginBottom: 24 }}>{title}</TText>
      {children}
    </TView>
  );
};

interface SettingItemProps {
  icon: any;
  title: string;
  description: string;
  showSwitch?: boolean;
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  renderRight?: () => React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon: Icon, title, description, showSwitch, value, onToggle, onPress, renderRight }) => {
  const { colors, isDark } = useTheme();
  return (
    <TouchableOpacity 
      onPress={onPress}
      disabled={showSwitch || !onPress || !!renderRight}
      style={[
        styles.settingItem,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        }
      ]}
    >
      <TView style={[styles.iconBox, { backgroundColor: colors.surfaceSecondary }]}>
        <Icon size={20} color={COLORS.primary} />
      </TView>
      <View style={{ flex: 1, marginLeft: 16 }}>
        <TText style={{ fontWeight: '600' }}>{title}</TText>
        <TText variant="caption">{description}</TText>
      </View>
      {renderRight ? renderRight() : (
        showSwitch ? (
          <Switch 
            value={value} 
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: COLORS.primary }}
          />
        ) : (
          <ChevronRight size={20} color={colors.textSecondary} />
        )
      )}
    </TouchableOpacity>
  );
};

export const Settings = () => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { config, updateConfig } = useAppConfig();
  const router = useRouter();

  const handleToggleLogin = async (value: boolean) => {
    updateConfig({ loginEnabled: value });
    try {
      await db.users.updateLoginScreenStatus(1, value);
    } catch (e) {
      console.error('Failed to update login status in DB', e);
    }
  };

  return (
    <WebLayout>
      <TView style={styles.header}>
        <TText variant="title" style={{ fontSize: 32 }}>System Settings</TText>
        <TText variant="caption">Manage your account preferences and global configuration</TText>
      </TView>

      <TView style={styles.contentGrid}>
        <TView style={{ flex: 1, gap: 24 }}>
          <SettingCard title="Business Configuration">
            <SettingItem 
              icon={Building} 
              title="Business Profile" 
              description="Logo, Tax ID, Bank Details, and more" 
              onPress={() => router.push('/settings/business-details')}
            />
            <SettingItem 
              icon={Hash} 
              title="Bill No Series" 
              description="Configure parts: text, delimiter, and start number" 
              onPress={() => router.push('/settings/bill-series')}
            />
          </SettingCard>

          <SettingCard title="Appearance">
            <SettingItem 
              icon={Moon} 
              title="Dark Mode" 
              description="Switch between light and dark themes" 
              showSwitch 
              value={isDark} 
              onToggle={toggleTheme} 
            />
          </SettingCard>
        </TView>

        <TView style={{ flex: 1, gap: 24 }}>
          <SettingCard title="Security & Access">
            <SettingItem 
              icon={Key} 
              title="Login Screen" 
              description="Require authentication on startup" 
              showSwitch 
              value={config.loginEnabled} 
              onToggle={handleToggleLogin}
            />
            <SettingItem 
              icon={Shield} 
              title="Two-Factor Authentication" 
              description="Add an extra layer of security" 
              showSwitch 
              value={false} 
            />
          </SettingCard>

          <SettingCard title="Invoice Customization">
            <SettingItem 
              icon={Layout} 
              title="Invoice Template" 
              description="Select and set your default invoice design" 
              onPress={() => router.push('/settings/templates')}
            />
          </SettingCard>
        </TView>
      </TView>
    </WebLayout>
  );
};

const styles = StyleSheet.create({
  header: { marginBottom: 40 },
  contentGrid: { flexDirection: 'row', gap: 24 },
  settingCard: { padding: 32, borderRadius: RADIUS.xl, gap: 10 },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  miniInput: {
    width: 100,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: '700',
  }
});
