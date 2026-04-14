import { useRouter } from 'expo-router';
import { AlertCircle, ChevronLeft, Hash, Info, Save } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useAppConfig } from '../../../components/AppConfigProvider';
import { Button } from '../../../components/Button';
import { useNotifications } from '../../../components/NotificationProvider';
import { TText, TView, useTheme } from '../../../components/ThemedUI';
import { db } from '../../../services/supabase';
import { COLORS, RADIUS } from '../../../theme';

const ConfigField = ({ label, placeholder, value, onChangeText, keyboardType = 'default', editable = true }: any) => {
  const { colors, isDark } = useTheme();
  return (
    <TView style={styles.fieldGroup}>
      <TText variant="caption" style={[styles.fieldLabel, { color: isDark ? 'rgba(255,255,255,0.5)' : 'gray', opacity: editable ? 1 : 0.6 }]}>{label}</TText>
      <TView style={[
        styles.inputContainer,
        {
          backgroundColor: editable ? 'transparent' : 'rgba(0,0,0,0.05)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(129, 140, 248, 0.2)' : colors.border,
        }
      ]}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#999'}
          style={[styles.input, { color: editable ? colors.text : colors.textSecondary }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          editable={editable}
        />
      </TView>
    </TView>
  );
};

export default function BillSeries() {
  const { colors, isDark } = useTheme();
  const { showToast } = useNotifications();
  const { config, updateConfig, refreshConfig } = useAppConfig();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasTransactions, setHasTransactions] = useState(false);
  const [localConfig, setLocalConfig] = useState({
    prefix: config.billSeriesText,
    delimiter: config.billSeriesDelimiter,
    startingNumber: config.billSeriesNumber,
  });

  const checkTransactions = useCallback(async () => {
    try {
      const data = await db.billing.getAll();
      setHasTransactions(data.length > 0);
    } catch (error) {
      console.error("Failed to check transactions:", error);
    }
  }, []);

  useEffect(() => {
    checkTransactions();
    // Initialize exactly once on mount
    setLocalConfig({
      prefix: config.billSeriesText,
      delimiter: config.billSeriesDelimiter,
      startingNumber: config.billSeriesNumber,
    });
  }, []);

  // Sync only when explicitly refreshed or config changes meaningfully (and no local dirtiness)
  useEffect(() => {
    if (!refreshing) return; // Only sync back if we just finished a refresh
    setLocalConfig({
      prefix: config.billSeriesText,
      delimiter: config.billSeriesDelimiter,
      startingNumber: config.billSeriesNumber,
    });
  }, [config, refreshing]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshConfig(), checkTransactions()]);
    // Refreshing state will trigger the sync useEffect
    setRefreshing(false);
  }, [refreshConfig, checkTransactions]);

  // Calculate live preview
  const getPreview = () => {
    const startNum = localConfig.startingNumber || '';
    const currentCount = parseInt(config.billSeriesCount) || 0;
    const nextCount = (currentCount + 1).toString().padStart(2, '0');
    return `${localConfig.prefix}${localConfig.delimiter}${startNum}${localConfig.delimiter}${nextCount}`;
  };

  const previewText = getPreview();

  const handleSave = async () => {
    if (hasTransactions) {
      return showToast('Cannot update bill series while transactions exist.', 'error');
    }

    setLoading(true);
    try {
      // 1. Sync to Supabase
      const dbUpdates = {
        prefix: localConfig.prefix,
        delimiter: localConfig.delimiter,
        startingnumber: parseInt(localConfig.startingNumber) || 1
      };

      await db.billSeries.upsert(1, dbUpdates);

      // 2. Update local app config
      updateConfig({
        billSeriesText: localConfig.prefix,
        billSeriesDelimiter: localConfig.delimiter,
        billSeriesNumber: localConfig.startingNumber
      });

      showToast('Bill Series Configuration Updated!', 'success');
      setTimeout(() => router.back(), 500);
    } catch (e: any) {
      console.error('Bill Series Save failed:', e);
      showToast(e.message || 'Failed to sync settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TView style={[styles.header, { borderBottomColor: isDark ? 'rgba(129, 140, 248, 0.2)' : colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <TText variant="subtitle" style={{ fontWeight: '900' }}>Bill No Series</TText>
        <TView style={{ width: 40 }} />
      </TView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >

        {/* Live Preview Card */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={[styles.previewCard, { backgroundColor: COLORS.primary + '10', borderColor: COLORS.primary + '30' }]}
        >
          <TView style={styles.previewHeader}>
            <Hash size={16} color={COLORS.primary} />
            <TText style={styles.previewTitle}>LIVE PREVIEW</TText>
          </TView>
          <TText style={styles.previewValue}>{previewText}</TText>
          <TText variant="caption" style={styles.previewNote}>This is how your next invoice number will appear.</TText>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={[
            styles.configCard,
            {
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              borderColor: isDark ? 'rgba(129, 140, 248, 0.4)' : colors.border
            }
          ]}
        >
          <TText variant="subtitle" style={styles.subHeader}>Series Parts</TText>

          <ConfigField
            label="PREFIX TEXT"
            placeholder="Ex: INV"
            value={localConfig.prefix}
            onChangeText={(v: string) => setLocalConfig({ ...localConfig, prefix: v })}
            editable={!hasTransactions}
          />

          <ConfigField
            label="DELIMITER"
            placeholder="/"
            value={localConfig.delimiter}
            onChangeText={(v: string) => setLocalConfig({ ...localConfig, delimiter: v })}
            editable={!hasTransactions}
          />

          <ConfigField
            label="STARTING NUMBER"
            placeholder="100"
            keyboardType="numeric"
            value={localConfig.startingNumber}
            onChangeText={(v: string) => setLocalConfig({ ...localConfig, startingNumber: v })}
            editable={!hasTransactions}
          />

          <ConfigField
            label="SEQUENCE TRACKER"
            placeholder="0"
            keyboardType="numeric"
            value={config.billSeriesCount.toString().padStart(2, '0')}
            editable={false}
          />

          <TView style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.05)' : '#F8FAFC' }]}>
            <Info size={18} color={COLORS.primary} />
            <TView style={{ flex: 1, marginLeft: 12 }}>
              <TText style={{ fontSize: 12, fontWeight: '700' }}>Sequence Tracker</TText>
              <TText style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                Current usage count is <TText style={{ fontWeight: '900', color: COLORS.primary }}>{config.billSeriesCount}</TText>.
                Final bill number is formed by joining: Prefix + Start Number + Sequence.
              </TText>
            </TView>
          </TView>

        </MotiView>

        <TView style={styles.warningBox}>
          <AlertCircle size={20} color={hasTransactions ? COLORS.danger : COLORS.warning} />
          <TText style={[styles.warningText, hasTransactions && { color: COLORS.danger }]}>
            {hasTransactions
              ? "Bill series editing is disabled because transactions already exist. Clear all data to modify the series order."
              : "Changing the series format mid-cycle may cause issues with historical record searching."}
          </TText>
        </TView>

        <Button
          title={hasTransactions ? "Editing Locked" : "Save Configuration"}
          onPress={handleSave}
          loading={loading}
          disabled={hasTransactions}
          icon={<Save size={18} color="#fff" />}
          style={{ marginTop: 24, marginBottom: 40, opacity: hasTransactions ? 0.6 : 1 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1 },
  backBtn: { padding: 8 },
  scrollContent: { padding: 20 },
  previewCard: { padding: 24, borderRadius: RADIUS.xl, borderWidth: 1, marginBottom: 24, alignItems: 'center' },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  previewTitle: { fontSize: 10, fontWeight: '900', color: COLORS.primary, letterSpacing: 2 },
  previewValue: { fontSize: 32, fontWeight: '900', color: COLORS.primary, marginBottom: 8 },
  previewNote: { fontSize: 11, textAlign: 'center', opacity: 0.7 },
  configCard: { padding: 20, borderRadius: RADIUS.xl },
  subHeader: { color: COLORS.primary, fontWeight: '700', fontSize: 14, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 10, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  inputContainer: { height: 52, paddingHorizontal: 16, borderRadius: RADIUS.md, justifyContent: 'center' },
  input: { fontSize: 16, fontWeight: '700' },
  infoBox: { flexDirection: 'row', padding: 16, borderRadius: RADIUS.lg, marginTop: 10 },
  warningBox: { flexDirection: 'row', gap: 12, marginTop: 24, paddingHorizontal: 10, opacity: 0.8 },
  warningText: { flex: 1, fontSize: 12, color: COLORS.warning, fontWeight: '600', lineHeight: 18 },
});
