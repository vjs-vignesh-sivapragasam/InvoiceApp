import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, TextInput } from 'react-native';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { WebLayout } from './WebLayout';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../../theme';
import { Hash, Save, Info, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppConfig } from '../../../components/AppConfigProvider';
import { db } from '../../../services/supabase';

export const BillSeries = () => {
  const { colors, isDark } = useTheme();
  const { config, updateConfig } = useAppConfig();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasTransactions, setHasTransactions] = React.useState(false);

  const [localConfig, setLocalConfig] = useState({
    prefix: config.billSeriesText,
    delimiter: config.billSeriesDelimiter,
    startingNumber: config.billSeriesNumber,
  });

  React.useEffect(() => {
    const checkTransactions = async () => {
      try {
        const data = await db.billing.getAll();
        setHasTransactions(data.length > 0);
      } catch (e) {
        console.error(e);
      }
    };
    checkTransactions();
  }, []);

  const nextNumber = (parseInt(localConfig.startingNumber) + parseInt(config.billSeriesCount)).toString().padStart(3, '0');
  const previewText = `${localConfig.prefix}${localConfig.delimiter}${nextNumber}`;

  const handleSave = async () => {
    if (hasTransactions) return;

    setLoading(true);
    try {
      await db.billSeries.upsert(1, {
        prefix: localConfig.prefix,
        delimiter: localConfig.delimiter,
        startingnumber: parseInt(localConfig.startingNumber) || 1
      });
      updateConfig({
        billSeriesText: localConfig.prefix,
        billSeriesDelimiter: localConfig.delimiter,
        billSeriesNumber: localConfig.startingNumber
      });
      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <WebLayout>
      <TView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
           <ChevronLeft size={20} color={colors.text} />
           <TText style={{ marginLeft: 8, fontWeight: '600' }}>Back to Settings</TText>
        </TouchableOpacity>
        <TText variant="title" style={{ fontSize: 32, marginTop: 16 }}>Bill No Series</TText>
        <TText variant="caption">Configure the automated sequence for your invoices</TText>
      </TView>

      {hasTransactions && (
        <TView style={{ backgroundColor: COLORS.danger + '15', padding: 20, borderRadius: 12, marginBottom: 30, borderWidth: 1, borderColor: COLORS.danger + '30' }}>
           <TText style={{ color: COLORS.danger, fontWeight: '800' }}>BILL SERIES LOCKED</TText>
           <TText style={{ color: COLORS.danger, fontSize: 13, marginTop: 4 }}>Transactions already exist. To change the bill series order, you must first clear all billing data.</TText>
        </TView>
      )}

      <TView style={styles.contentGrid}>
        <TView style={{ flex: 1.5 }}>
          <TView style={[styles.card, { backgroundColor: colors.card, ...SHADOWS.sm }]}>
            <TText variant="subtitle" style={{ marginBottom: 24 }}>Dynamic Configuration</TText>
            
            <View style={styles.fieldGroup}>
              <TText style={styles.label}>Prefix Text</TText>
              <TextInput 
                style={[styles.input, { color: hasTransactions ? colors.textSecondary : colors.text, borderColor: colors.border, backgroundColor: hasTransactions ? 'rgba(0,0,0,0.05)' : colors.surfaceSecondary }]}
                value={localConfig.prefix}
                editable={!hasTransactions}
                onChangeText={(v) => setLocalConfig({...localConfig, prefix: v})}
              />
            </View>

            <View style={styles.fieldGroup}>
              <TText style={styles.label}>Delimiter</TText>
              <TextInput 
                style={[styles.input, { color: hasTransactions ? colors.textSecondary : colors.text, borderColor: colors.border, backgroundColor: hasTransactions ? 'rgba(0,0,0,0.05)' : colors.surfaceSecondary }]}
                value={localConfig.delimiter}
                editable={!hasTransactions}
                onChangeText={(v) => setLocalConfig({...localConfig, delimiter: v})}
              />
            </View>

            <View style={styles.fieldGroup}>
              <TText style={styles.label}>Starting Number</TText>
              <TextInput 
                style={[styles.input, { color: hasTransactions ? colors.textSecondary : colors.text, borderColor: colors.border, backgroundColor: hasTransactions ? 'rgba(0,0,0,0.05)' : colors.surfaceSecondary }]}
                value={localConfig.startingNumber}
                keyboardType="numeric"
                editable={!hasTransactions}
                onChangeText={(v) => setLocalConfig({...localConfig, startingNumber: v})}
              />
            </View>

            <View style={styles.fieldGroup}>
              <TText style={styles.label}>Sequence Tracker</TText>
              <TextInput 
                style={[styles.input, { color: colors.textSecondary, borderColor: colors.border, backgroundColor: 'rgba(0,0,0,0.05)' }]}
                value={config.billSeriesCount.toString()}
                editable={false}
              />
            </View>

            <TouchableOpacity 
              onPress={handleSave}
              disabled={loading || hasTransactions}
              style={[styles.saveBtn, { opacity: (loading || hasTransactions) ? 0.6 : 1 }]}
            >
               <Save size={18} color="#fff" />
               <TText style={{ color: '#fff', fontWeight: '800', marginLeft: 10 }}>{hasTransactions ? 'EDITING LOCKED' : 'SAVE CONFIGURATION'}</TText>
            </TouchableOpacity>
          </TView>
        </TView>

        <TView style={{ flex: 1 }}>
           <TView style={[styles.previewCard, { backgroundColor: COLORS.primary, ...SHADOWS.md }]}>
              <Hash size={24} color="#fff" />
              <TText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '900', marginTop: 16, letterSpacing: 2 }}>PROBABLE NEXT BILL</TText>
              <TText style={{ color: '#fff', fontSize: 36, fontWeight: '900', marginTop: 10 }}>{previewText}</TText>
              <TView style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.2)', width: '100%', marginVertical: 20 }} />
              <TText style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 20 }}>
                This matches the template: <TText style={{ fontWeight: '900' }}>[PREFIX][DELIMITER][SEQUENCE]</TText>
              </TText>
           </TView>

           <TView style={[styles.card, { backgroundColor: colors.card, ...SHADOWS.sm, marginTop: 24 }]}>
              <TView style={{ flexDirection: 'row', gap: 12 }}>
                 <Info size={20} color={COLORS.primary} />
                 <TView style={{ flex: 1 }}>
                    <TText style={{ fontWeight: '700' }}>Sequence Rules </TText>
                    <TText variant="caption" style={{ marginTop: 4 }}>
                      The current running count is <TText style={{ fontWeight: '900', color: COLORS.primary }}>{config.billSeriesCount}</TText>. 
                      This number increments automatically with every successfully generated invoice.
                    </TText>
                 </TView>
              </TView>
           </TView>
        </TView>
      </TView>
    </WebLayout>
  );
};

const styles = StyleSheet.create({
  header: { marginBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  contentGrid: { flexDirection: 'row', gap: 32 },
  card: { padding: 32, borderRadius: RADIUS.xl },
  previewCard: { padding: 40, borderRadius: RADIUS.xl, alignItems: 'center' },
  fieldGroup: { marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 10, opacity: 0.7 },
  input: { height: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, fontSize: 16, fontWeight: '700' },
  saveBtn: { height: 52, backgroundColor: COLORS.primary, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
});
