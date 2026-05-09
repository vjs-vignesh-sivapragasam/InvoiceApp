import { MotiView } from '@/components/MotiShim';
import { useRouter } from 'expo-router';
import { AlertCircle, ChevronLeft, Hash, Info, Save } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
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
  const { updateConfig } = useAppConfig();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasTransactions, setHasTransactions] = useState(false);
  
  const [prefix, setPrefix] = useState('');
  const [delimiter, setDelimiter] = useState('/');
  const [startingNumber, setStartingNumber] = useState('');
  const [currentCount, setCurrentCount] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dbData, transactions] = await Promise.all([
        db.billSeries.get(1),
        db.billing.getAll()
      ]);
      
      setHasTransactions(transactions.length > 0);
      
      if (dbData) {
        setPrefix(dbData.prefix || '');
        setDelimiter(dbData.delimiter || '/');
        setStartingNumber(dbData.startingnumber?.toString() || '');
        setCurrentCount(dbData.currentcount || 0);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getPreview = () => {
    const nextCount = (currentCount + 1).toString().padStart(2, '0');
    return `${prefix}${delimiter}${startingNumber}${delimiter}${nextCount}`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await db.billSeries.upsert(1, {
        prefix,
        delimiter,
        startingnumber: parseInt(startingNumber) || 1
      });

      updateConfig({
        billSeriesText: prefix,
        billSeriesDelimiter: delimiter,
        billSeriesNumber: startingNumber
      });

      showToast('Settings Saved', 'success');
      router.back();
    } catch (e: any) {
      showToast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TView style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <TText variant="subtitle" style={{ fontWeight: '900' }}>Bill Series Config</TText>
        <TView style={{ width: 40 }} />
      </TView>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={false} onRefresh={fetchData} tintColor={COLORS.primary} />}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={[styles.previewCard, { backgroundColor: COLORS.primary + '10', borderColor: COLORS.primary + '30' }]}
        >
          <TView style={styles.previewHeader}>
            <Hash size={16} color={COLORS.primary} />
            <TText style={styles.previewTitle}>LIVE PREVIEW</TText>
          </TView>
          <TText style={styles.previewValue}>{getPreview()}</TText>
          <TText variant="caption" style={styles.previewNote}>Next generated bill number format</TText>
        </MotiView>

        <TView style={[styles.configCard, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
          <ConfigField
            label="PREFIX"
            placeholder="Ex: INV"
            value={prefix}
            onChangeText={setPrefix}
            editable={!hasTransactions}
          />

          <ConfigField
            label="DELIMITER"
            placeholder="/"
            value={delimiter}
            onChangeText={setDelimiter}
            editable={!hasTransactions}
          />

          <ConfigField
            label="STARTING YEAR/NUMBER"
            placeholder="2026"
            keyboardType="numeric"
            value={startingNumber}
            onChangeText={setStartingNumber}
            editable={!hasTransactions}
          />

          <ConfigField
            label="CURRENT COUNT"
            value={currentCount.toString().padStart(2, '0')}
            editable={false}
          />
        </TView>

        {hasTransactions && (
          <TView style={styles.warningBox}>
            <AlertCircle size={18} color={COLORS.danger} />
            <TText style={styles.warningText}>Editing locked: Transactions already exist.</TText>
          </TView>
        )}

        <Button
          title="Save Configuration"
          onPress={handleSave}
          loading={saving}
          disabled={hasTransactions}
          icon={<Save size={18} color="#fff" />}
          style={{ marginTop: 24, marginBottom: 40 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, marginTop: 15 },
  backBtn: { padding: 8 },
  scrollContent: { padding: 20 },
  previewCard: { padding: 24, borderRadius: RADIUS.xl, borderWidth: 1, marginBottom: 24, alignItems: 'center' },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  previewTitle: { fontSize: 10, fontWeight: '900', color: COLORS.primary, letterSpacing: 2 },
  previewValue: { fontSize: 32, fontWeight: '900', color: COLORS.primary, marginBottom: 8 },
  previewNote: { fontSize: 11, textAlign: 'center', opacity: 0.7 },
  configCard: { padding: 20, borderRadius: RADIUS.xl },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 10, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  inputContainer: { height: 52, paddingHorizontal: 16, borderRadius: RADIUS.md, justifyContent: 'center' },
  input: { fontSize: 16, fontWeight: '700' },
  warningBox: { flexDirection: 'row', gap: 10, marginTop: 20, backgroundColor: COLORS.danger + '10', padding: 15, borderRadius: 12, alignItems: 'center' },
  warningText: { flex: 1, fontSize: 12, color: COLORS.danger, fontWeight: '700' },
});
